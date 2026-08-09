// 失真检测闭环(2026-08-02 拆分,独立业务关注点):后台扫描 active 卡的冷却/跨天失真。
// 与台账状态机正交——改失真逻辑不碰 item.rs,改状态机不碰本模块(单向依赖 dormant → item)。
// 触发者:定时后台扫描(lib.rs) / 前端轮询(commands/item.rs::item_check_dormant)。

use rusqlite::{params, Connection};

use crate::db::item::{get_by_id, settle_open_intervals};
use crate::db::time;
use crate::error::AppError;

/// 失真检测默认阈值:冷却 2 小时无更新(ADR-0012)
pub const DEFAULT_DISTORTION_IDLE_MS: i64 = 2 * 60 * 60 * 1000;

/// 从 app_setting 读取冷却阈值(分钟),失败用默认值。
pub fn get_cooling_ms(conn: &Connection) -> i64 {
    crate::db::setting::get(conn, "dormant_cooling_min")
        .ok()
        .flatten()
        .and_then(|s| s.parse::<i64>().ok())
        .map(|min| min * 60 * 1000)
        .unwrap_or(DEFAULT_DISTORTION_IDLE_MS)
}

/// 失真检测结果:退回待办的卡 id + 有待确认窗口的卡 id。
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct DormantResult {
    /// 因失真退回待办的卡 id
    pub paused: Vec<i64>,
    /// 有待确认窗口的卡 id
    pub has_pending: Vec<i64>,
}

/// 失真确认气泡的 emit payload(bubble 窗口监听)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DormantPayload {
    pub id: i64,
    pub content: String,
    pub pending_ms: i64,
}

/// 失真检测 + 跨天停表。返回:退回 todo 的 id + 有待确认的 id。
/// cooling_ms: 冷却阈值(毫秒),由调用方从 app_setting 读取后传入。
pub fn settle_dormant(
    conn: &Connection,
    now: i64,
    cooling_ms: i64,
) -> Result<DormantResult, AppError> {
    let tx = conn.unchecked_transaction()?;
    let mut paused: Vec<i64> = Vec::new();
    let mut has_pending: Vec<i64> = Vec::new();

    // 冷却:active 且 last_active_at 超过阈值 → 挂待确认(卡保持 active,计时继续)。
    let mut stmt = tx.prepare(
        "SELECT id, last_active_at, focus_ms FROM item WHERE status = 'active' AND deleted_at IS NULL",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, Option<i64>>(1)?))
    })?;
    let mut to_settle: Vec<(i64, i64)> = Vec::new();
    for r in rows {
        let (id, la) = r?;
        if let Some(la) = la {
            if now - la > cooling_ms {
                to_settle.push((id, la));
            }
        }
    }
    drop(stmt);
    for (id, la) in to_settle {
        let pending = now.saturating_sub(la);
        // ADR-0012: 冷却检测不转 todo(卡保持 active,计时继续),只挂 pending_ms 触发气泡。
        // 气泡 5s 超时才真正 pause(active→todo + 挂待确认)。
        tx.execute(
            "UPDATE item SET pending_ms = ?1, updated_at = ?2 WHERE id = ?3 AND status = 'active'",
            params![pending, now, id],
        )?;
        has_pending.push(id);
    }

    // 跨天:active 且 last_active_at 不在今天 → 退回 todo(不挂待确认,只停表)
    // 自然日边界:用本地时区判断"今天"。
    let day_start = time::local_day_start_ms(now);
    let mut stmt = tx.prepare(
        "SELECT id FROM item WHERE status = 'active' AND last_active_at IS NOT NULL AND last_active_at < ?1 AND deleted_at IS NULL",
    )?;
    let rows = stmt.query_map(params![day_start], |r| r.get::<_, i64>(0))?;
    let mut day_cross: Vec<i64> = Vec::new();
    for r in rows {
        day_cross.push(r?);
    }
    drop(stmt);
    for id in day_cross {
        tx.execute(
            "UPDATE item SET status = 'todo', focus_ms = focus_ms + (CASE WHEN last_active_at IS NOT NULL THEN ?1 - last_active_at ELSE 0 END), last_active_at = ?1, pending_ms = NULL, updated_at = ?1 WHERE id = ?2 AND status = 'active'",
            params![now, id],
        )?;
        // 跨天停表:结算进行中 interval
        settle_open_intervals(&tx, id, now)?;
        if !paused.contains(&id) {
            paused.push(id);
        }
    }

    tx.commit()?;
    Ok(DormantResult {
        paused,
        has_pending,
    })
}

/// 取一批卡的失真 payload(bubble 窗口 emit 用)。
pub fn get_dormant_payloads(
    conn: &Connection,
    ids: &[i64],
) -> Result<Vec<DormantPayload>, AppError> {
    let mut out = Vec::new();
    for id in ids {
        if let Some(item) = get_by_id(conn, *id)? {
            out.push(DormantPayload {
                id: item.id,
                content: item.content.clone(),
                pending_ms: item.pending_ms.unwrap_or(0),
            });
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::item::{create, get_by_id, list_intervals, start};
    use rusqlite::Connection;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn fresh_db() -> Connection {
        let id = COUNTER.fetch_add(1, Ordering::SeqCst);
        let path = std::env::temp_dir().join(format!(
            "mindtap_dormant_test_{}_{}.db",
            std::process::id(),
            id
        ));
        let _ = std::fs::remove_file(&path);
        let conn = Connection::open(&path).unwrap();
        crate::db::init_connection(&conn).unwrap();
        conn
    }

    fn insert_raw(
        conn: &Connection,
        content: &str,
        status: &str,
        focus_ms: i64,
        last_active_at: i64,
    ) -> i64 {
        conn.execute(
            "INSERT INTO item (content, status, focus_ms, last_active_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?4, ?4)",
            params![content, status, focus_ms, last_active_at],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    #[test]
    fn settle_dormant_cooling_pends_but_keeps_active() {
        let conn = fresh_db();
        // 失真:4 小时前活跃 → 冷却
        let now = time::now_ms();
        let day_start = time::local_day_start_ms(now);
        // 确保 la 在今天且 now-la > 2h(冷却阈值):用今天 0 点 + 1ms,now 设为 day_start + 5h
        let la = day_start + 1;
        let now = day_start + 5 * 3600 * 1000; // 今天 05:00(确保 > 2h 冷却)
        let id = insert_raw(&conn, "X", "active", 1000, la);
        let res = settle_dormant(&conn, now, DEFAULT_DISTORTION_IDLE_MS).unwrap();
        // 冷却只挂 pending,不转 todo(卡保持 active,计时继续,等气泡超时再停)
        assert!(res.has_pending.contains(&id));
        assert!(!res.paused.contains(&id));
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "active");
        assert_eq!(after.pending_ms, Some(now - la));
        // ADR-0012: 失真窗口未确认前不入账 → focus 保持 1000
        assert_eq!(after.focus_ms, 1000);
    }

    #[test]
    fn settle_dormant_skips_recent_active() {
        let conn = fresh_db();
        let now = time::now_ms();
        let id = insert_raw(&conn, "X", "active", 0, now - 1000); // 1 秒前
        let res = settle_dormant(&conn, now, DEFAULT_DISTORTION_IDLE_MS).unwrap();
        assert!(res.paused.is_empty());
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "active");
    }

    #[test]
    fn settle_dormant_day_cross_returns_todo_and_clears_pending() {
        let conn = fresh_db();
        // 昨天活跃的 active → 跨天退回(UTC 日边界近似);且清空已挂 pending_ms(避免双重结算)
        let now = time::now_ms();
        let yesterday = now - 25 * 3600 * 1000;
        let id = insert_raw(&conn, "X", "active", 0, yesterday);
        conn.execute(
            "UPDATE item SET pending_ms = 1000 WHERE id = ?1",
            params![id],
        )
        .unwrap();
        let res = settle_dormant(&conn, now, DEFAULT_DISTORTION_IDLE_MS).unwrap();
        assert!(res.paused.contains(&id));
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "todo");
        assert_eq!(after.pending_ms, None);
    }

    #[test]
    fn get_dormant_payloads_maps_items() {
        let conn = fresh_db();
        let item = create(&conn, "写代码".into()).unwrap();
        conn.execute(
            "UPDATE item SET pending_ms = 5000 WHERE id = ?1",
            params![item.id],
        )
        .unwrap();
        let payloads = get_dormant_payloads(&conn, &[item.id]).unwrap();
        assert_eq!(payloads.len(), 1);
        assert_eq!(payloads[0].content, "写代码");
        assert_eq!(payloads[0].pending_ms, 5000);
    }

    #[test]
    fn settle_dormant_day_cross_settles_interval() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        let now = time::now_ms();
        let yesterday = now - 25 * 3600 * 1000;
        // 模拟"昨天开始跑进今天":last_active_at 与 interval 起点同源,都挪到昨天
        conn.execute(
            "UPDATE item SET last_active_at = ?1 WHERE id = ?2",
            params![yesterday, item.id],
        )
        .unwrap();
        conn.execute(
            "UPDATE focus_interval SET started_at = ?1 WHERE item_id = ?2",
            params![yesterday, item.id],
        )
        .unwrap();
        let res = settle_dormant(&conn, now, DEFAULT_DISTORTION_IDLE_MS).unwrap();
        assert!(res.paused.contains(&item.id));
        let intervals = list_intervals(&conn, item.id).unwrap();
        assert_eq!(intervals.len(), 1);
        assert!(intervals[0].ended_at.is_some());
        let agg: i64 = intervals
            .iter()
            .map(|i| i.ended_at.unwrap() - i.started_at)
            .sum();
        let after = get_by_id(&conn, item.id).unwrap().unwrap();
        assert_eq!(after.status, "todo");
        assert_eq!(after.focus_ms, agg); // 跨天停表后 focus == interval 聚合
    }
}
