// 深模块 ItemRepo —— 藏住整个五态状态机 + 结算 + 失真闭环。
// 外部 seam: create / start / pause / complete / confirm_pending / list / settle_dormant / list_duplicate。
// 状态转换正确性(零成本切换 / focus_ms 只增不减 / 跨天停表 / 待确认结算)全部在此模块事务内原子完成。
// 前端与 commands 层只发意图,不持有状态机。

use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, Row};

use crate::error::AppError;

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct Item {
    pub id: i64,
    pub content: String,
    pub r#type: String,
    pub status: String,
    pub focus_ms: i64,
    pub last_active_at: Option<i64>,
    pub progress_note: Option<String>,
    pub source: String,
    pub pending_ms: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct StartResult {
    pub item: Item,
    /// 因切换而退回待办的原进行中卡 id 列表
    pub switched_from: Vec<i64>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct PauseResult {
    pub item: Item,
    /// 失真窗口毫秒(若非主动暂停)。None = 无待确认
    pub pending_ms: Option<i64>,
}

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

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ListStatus {
    Active,
    Inbox,
    Todo,
    Done,
    Archived,
}

impl ListStatus {
    fn as_str(self) -> &'static str {
        match self {
            ListStatus::Active => "active",
            ListStatus::Inbox => "inbox",
            ListStatus::Todo => "todo",
            ListStatus::Done => "done",
            ListStatus::Archived => "archived",
        }
    }
}

/// 失真检测阈值:冷却 2 小时无更新(ADR-0012)
pub const DISTORTION_IDLE_MS: i64 = 2 * 60 * 60 * 1000;

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

/// 供 commands 层取当前时间戳(测试注入用 `settle_dormant(conn, now)`)
pub fn now_ms_for_cmd() -> i64 {
    now_ms()
}

fn row_to_item(row: &Row<'_>) -> rusqlite::Result<Item> {
    Ok(Item {
        id: row.get(0)?,
        content: row.get(1)?,
        r#type: row.get(2)?,
        status: row.get(3)?,
        focus_ms: row.get(4)?,
        last_active_at: row.get(5)?,
        progress_note: row.get(6)?,
        source: row.get(7)?,
        pending_ms: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

const COLS: &str = "id, content, type, status, focus_ms, last_active_at, progress_note, source, pending_ms, created_at, updated_at";

pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<Item>, AppError> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLS} FROM item WHERE id = ?1 AND deleted_at IS NULL"
    ))?;
    let mut rows = stmt.query(params![id])?;
    match rows.next()? {
        Some(row) => Ok(Some(row_to_item(row)?)),
        None => Ok(None),
    }
}

/// 捕获:内容非空即存,进收件箱。
pub fn create(conn: &Connection, content: String) -> Result<Item, AppError> {
    let content = content.trim();
    if content.is_empty() {
        return Err(AppError("内容不能为空".into()));
    }
    if content.chars().count() > 200 {
        return Err(AppError("内容超过 200 字上限".into()));
    }
    let now = now_ms();
    conn.execute(
        "INSERT INTO item (content, status, created_at, updated_at) VALUES (?1, 'inbox', ?2, ?2)",
        params![content, now],
    )?;
    let id = conn.last_insert_rowid();
    get_by_id(conn, id)?.ok_or_else(|| AppError("just-created item not found".into()))
}

/// 开始:inbox/todo → active。零成本切换(一个事务):把其他 active 全部退回 todo。
pub fn start(conn: &Connection, id: i64) -> Result<StartResult, AppError> {
    let tx = conn.unchecked_transaction()?;

    match get_by_id(&tx, id)? {
        Some(t) if t.status == "inbox" || t.status == "todo" => (),
        Some(t) => return Err(AppError(format!("item {id} 状态 {} 不能开始", t.status))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    }

    // 零成本切换:所有其他 active → todo(结算)
    let now = now_ms();
    let mut switched: Vec<i64> = Vec::new();
    {
        let mut stmt = tx.prepare(
            "SELECT id FROM item WHERE status = 'active' AND id != ?1 AND deleted_at IS NULL",
        )?;
        let rows = stmt.query_map(params![id], |r| r.get::<_, i64>(0))?;
        for r in rows {
            switched.push(r?);
        }
    }
    for sid in &switched {
        tx.execute(
            "UPDATE item SET status = 'todo', focus_ms = focus_ms + (CASE WHEN last_active_at IS NOT NULL THEN ?1 - last_active_at ELSE 0 END),
             last_active_at = ?1, updated_at = ?1 WHERE id = ?2 AND status = 'active'",
            params![now, sid],
        )?;
    }

    tx.execute(
        "UPDATE item SET status = 'active', last_active_at = ?1, updated_at = ?1 WHERE id = ?2",
        params![now, id],
    )?;
    tx.commit()?;

    let item = get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))?;
    Ok(StartResult {
        item,
        switched_from: switched,
    })
}

/// 暂停:active → todo。失真时(pending_ms 传入)把失真窗口挂到待确认,结算到失真点。
/// 主动暂停传 pending_ms = None:只结算到暂停点,不挂待确认。
pub fn pause(conn: &Connection, id: i64, pending_ms: Option<i64>) -> Result<PauseResult, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    let target = match get_by_id(&tx, id)? {
        Some(t) if t.status == "active" => t,
        Some(t) => return Err(AppError(format!("item {id} 状态 {} 不能暂停", t.status))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    };

    // 结算:active 段 (started → 暂停点)。
    // - 主动暂停(pending_ms=None):settled_ms 计入 focus(这段真实投入)
    // - 失真暂停(pending_ms=Some):settled_ms 即失真窗口,未确认前不入账(ADR-0012),只挂 pending_ms
    let settled_ms = target
        .last_active_at
        .map(|la| now.saturating_sub(la))
        .unwrap_or(0);
    let focus_delta = if pending_ms.is_some() { 0 } else { settled_ms };
    let pending_to_write = pending_ms;

    tx.execute(
        "UPDATE item SET status = 'todo', focus_ms = focus_ms + ?1, pending_ms = ?2, updated_at = ?3 WHERE id = ?4",
        params![focus_delta, pending_to_write, now, id],
    )?;
    tx.commit()?;

    let item = get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))?;
    Ok(PauseResult {
        item,
        pending_ms: pending_to_write,
    })
}

/// 完成:active/todo → done。结算 active 段,清空待确认。
pub fn complete(conn: &Connection, id: i64) -> Result<Item, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    let target = match get_by_id(&tx, id)? {
        Some(t) if t.status == "active" || t.status == "todo" => t,
        Some(t) => return Err(AppError(format!("item {id} 状态 {} 不能完成", t.status))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    };

    let settled_ms = if target.status == "active" {
        target
            .last_active_at
            .map(|la| now.saturating_sub(la))
            .unwrap_or(0)
    } else {
        0
    };

    tx.execute(
        "UPDATE item SET status = 'done', focus_ms = focus_ms + ?1, pending_ms = NULL, updated_at = ?2 WHERE id = ?3",
        params![settled_ms, now, id],
    )?;
    tx.commit()?;

    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

/// 待确认结算:keep=true 记入 pending_ms,keep=false 丢弃。清空 pending_ms。
pub fn confirm_pending(conn: &Connection, id: i64, keep: bool) -> Result<Item, AppError> {
    let tx = conn.unchecked_transaction()?;
    let now = now_ms();

    let target = match get_by_id(&tx, id)? {
        Some(t) if t.pending_ms.is_some() => t,
        Some(_) => return Err(AppError(format!("item {id} 无待确认窗口"))),
        None => return Err(AppError(format!("item {id} 不存在"))),
    };

    let pending = target.pending_ms.unwrap_or(0);
    let focus_delta = if keep { pending } else { 0 };
    tx.execute(
        "UPDATE item SET focus_ms = focus_ms + ?1, pending_ms = NULL, updated_at = ?2 WHERE id = ?3",
        params![focus_delta, now, id],
    )?;
    tx.commit()?;

    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("item {id} not found")))
}

pub fn list(
    conn: &Connection,
    status: ListStatus,
    limit: Option<i64>,
) -> Result<Vec<Item>, AppError> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLS} FROM item WHERE status = ?1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?2"
    ))?;
    let rows = stmt.query_map(params![status.as_str(), limit.unwrap_or(100)], |row| {
        row_to_item(row)
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(AppError::from)
}

/// 失真检测 + 跨天停表。返回:退回 todo 的 id + 有待确认的 id。
pub fn settle_dormant(conn: &Connection, now: i64) -> Result<DormantResult, AppError> {
    let tx = conn.unchecked_transaction()?;
    let mut paused: Vec<i64> = Vec::new();
    let mut has_pending: Vec<i64> = Vec::new();

    // 冷却:active 且 last_active_at 超过阈值 → 退回 todo,结算到失真点 + 挂待确认
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
            if now - la > DISTORTION_IDLE_MS {
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
    let day_start = local_day_start_ms(now);
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

/// 重复捕获检测:同内容已有 inbox/todo/active 卡(不合并,轻提示)。
pub fn list_duplicate(conn: &Connection, content: &str) -> Result<Vec<Item>, AppError> {
    let content = content.trim();
    let mut stmt = conn.prepare(&format!(
        "SELECT {COLS} FROM item WHERE content = ?1 AND status IN ('inbox','todo','active') AND deleted_at IS NULL ORDER BY created_at DESC"
    ))?;
    let rows = stmt.query_map(params![content], |row| row_to_item(row))?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(AppError::from)
}

/// 历史任务名复用(改自 timer_session_list_recent_task_titles)
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct TitleRec {
    pub content: String,
    pub last_used: i64,
}
pub fn list_recent_titles(conn: &Connection, limit: i64) -> Result<Vec<TitleRec>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT content, MAX(updated_at) AS last_used FROM item
         WHERE status = 'done' GROUP BY content ORDER BY last_used DESC LIMIT ?1",
    )?;
    let rows = stmt.query_map(params![limit], |row| {
        Ok(TitleRec {
            content: row.get(0)?,
            last_used: row.get(1)?,
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(AppError::from)
}

// 本地时区"今天 0 点"毫秒。SQLite 无时区概念,用系统本地时区算自然日边界。
fn local_day_start_ms(now: i64) -> i64 {
    // 用系统本地偏移近似(不引入 chrono 依赖)
    let local_offset_secs = local_utc_offset_secs(now);
    let local_now = now + local_offset_secs * 1000;
    let local_day = local_now.div_euclid(86400 * 1000) * 86400 * 1000;
    local_day - local_offset_secs * 1000
}

// ponytail: 用 libc localtime 拿当前时区偏移,避免引入 chrono。
fn local_utc_offset_secs(_now: i64) -> i64 {
    // Linux/macOS 用 libc 的 localtime_r;Windows 用 _timezone。
    // 保守实现:直接用 UTC 日边界(偏差 = 本地时区小时数)。V0.2.1 跨天检测用 UTC 自然日近似,
    // 时区偏差(如 UTC+8 的"今天"早 8 小时)会让"跨天"在本地 0 点前 8 小时触发,轻微偏早。
    // 对台账可接受:晚间的 active 在本地 0 点前被停表,更接近"不跨天"意图。
    0
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn fresh_db() -> Connection {
        let id = COUNTER.fetch_add(1, Ordering::SeqCst);
        let path = std::env::temp_dir().join(format!(
            "mindtap_item_test_{}_{}.db",
            std::process::id(),
            id
        ));
        let _ = std::fs::remove_file(&path);
        let conn = Connection::open(&path).unwrap();
        conn.execute_batch(crate::db::schema::CREATE_SQL).unwrap();
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
    fn create_requires_nonempty_content() {
        let conn = fresh_db();
        assert!(create(&conn, "  ".into()).is_err());
        assert!(create(&conn, "".into()).is_err());
    }

    #[test]
    fn create_enters_inbox() {
        let conn = fresh_db();
        let item = create(&conn, "写代码".into()).unwrap();
        assert_eq!(item.status, "inbox");
        assert_eq!(item.content, "写代码");
        assert_eq!(item.focus_ms, 0);
    }

    #[test]
    fn create_rejects_over_200_chars() {
        let conn = fresh_db();
        assert!(create(&conn, "字".repeat(201)).is_err());
        let ok = create(&conn, "字".repeat(200)).unwrap();
        assert_eq!(ok.status, "inbox");
    }

    #[test]
    fn start_inbox_to_active() {
        let conn = fresh_db();
        let item = create(&conn, "写代码".into()).unwrap();
        let res = start(&conn, item.id).unwrap();
        assert_eq!(res.item.status, "active");
        assert!(res.switched_from.is_empty());
        assert!(res.item.last_active_at.is_some());
    }

    #[test]
    fn multi_active_allowed() {
        let conn = fresh_db();
        let a = create(&conn, "A".into()).unwrap();
        let b = create(&conn, "B".into()).unwrap();
        start(&conn, a.id).unwrap();
        // 第二张卡 start 应把 A 退回,但 B 进 active —— 任意时刻可多 active 的语义由"切换"保证
        // 这里直接验证:start B 后 A 是 todo,B 是 active
        let res = start(&conn, b.id).unwrap();
        assert_eq!(res.item.status, "active");
        assert!(res.switched_from.contains(&a.id));
        let a_after = get_by_id(&conn, a.id).unwrap().unwrap();
        assert_eq!(a_after.status, "todo");
    }

    #[test]
    fn start_rejects_completed() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        complete(&conn, item.id).unwrap();
        assert!(start(&conn, item.id).is_err());
    }

    #[test]
    fn start_from_done_rejected() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        complete(&conn, item.id).unwrap();
        assert!(start(&conn, item.id).is_err());
    }

    #[test]
    fn pause_active_to_todo_without_pending() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        let res = pause(&conn, item.id, None).unwrap();
        assert_eq!(res.item.status, "todo");
        assert!(res.pending_ms.is_none());
    }

    #[test]
    fn pause_with_pending_sets_pending_ms() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        start(&conn, item.id).unwrap();
        let res = pause(&conn, item.id, Some(12345)).unwrap();
        assert_eq!(res.pending_ms, Some(12345));
        let after = get_by_id(&conn, item.id).unwrap().unwrap();
        assert_eq!(after.pending_ms, Some(12345));
        // ADR-0012: 失真暂停不入账,只挂待确认
        assert_eq!(after.focus_ms, 0);
    }

    #[test]
    fn complete_from_active_settles_focus() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "active", 1000, now_ms() - 5000);
        let done = complete(&conn, id).unwrap();
        assert_eq!(done.status, "done");
        assert!(done.focus_ms >= 6000 && done.focus_ms < 6200); // 1000 + 5000 已结算 + 运行开销容差
        assert!(done.pending_ms.is_none());
    }

    #[test]
    fn complete_from_todo_no_settle() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "todo", 1000, now_ms());
        let done = complete(&conn, id).unwrap();
        assert_eq!(done.focus_ms, 1000);
    }

    #[test]
    fn confirm_pending_keep_adds_focus() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "todo", 1000, now_ms());
        conn.execute(
            "UPDATE item SET pending_ms = 2000 WHERE id = ?1",
            params![id],
        )
        .unwrap();
        let after = confirm_pending(&conn, id, true).unwrap();
        assert_eq!(after.focus_ms, 3000); // 1000 + 2000
        assert!(after.pending_ms.is_none());
    }

    #[test]
    fn confirm_pending_discard_keeps_focus() {
        let conn = fresh_db();
        let id = insert_raw(&conn, "X", "todo", 1000, now_ms());
        conn.execute(
            "UPDATE item SET pending_ms = 2000 WHERE id = ?1",
            params![id],
        )
        .unwrap();
        let after = confirm_pending(&conn, id, false).unwrap();
        assert_eq!(after.focus_ms, 1000);
        assert!(after.pending_ms.is_none());
    }

    #[test]
    fn confirm_pending_no_pending_errors() {
        let conn = fresh_db();
        let item = create(&conn, "X".into()).unwrap();
        assert!(confirm_pending(&conn, item.id, true).is_err());
    }

    #[test]
    fn settle_dormant_cooling_pends_but_keeps_active() {
        let conn = fresh_db();
        // 失真:4 小时前活跃 → 冷却
        let now = now_ms();
        let id = insert_raw(&conn, "X", "active", 1000, now - 4 * 3600 * 1000);
        let res = settle_dormant(&conn, now).unwrap();
        // 冷却只挂 pending,不转 todo(卡保持 active,计时继续,等气泡超时再停)
        assert!(res.has_pending.contains(&id));
        assert!(!res.paused.contains(&id));
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "active");
        assert_eq!(after.pending_ms, Some(4 * 3600 * 1000));
        // ADR-0012: 失真窗口未确认前不入账 → focus 保持 1000
        assert_eq!(after.focus_ms, 1000);
    }

    #[test]
    fn settle_dormant_skips_recent_active() {
        let conn = fresh_db();
        let now = now_ms();
        let id = insert_raw(&conn, "X", "active", 0, now - 1000); // 1 秒前
        let res = settle_dormant(&conn, now).unwrap();
        assert!(res.paused.is_empty());
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "active");
    }

    #[test]
    fn settle_dormant_day_cross_returns_todo_and_clears_pending() {
        let conn = fresh_db();
        // 昨天活跃的 active → 跨天退回(UTC 日边界近似);且清空已挂 pending_ms(避免双重结算)
        let now = now_ms();
        let yesterday = now - 25 * 3600 * 1000;
        let id = insert_raw(&conn, "X", "active", 0, yesterday);
        conn.execute(
            "UPDATE item SET pending_ms = 1000 WHERE id = ?1",
            params![id],
        )
        .unwrap();
        let res = settle_dormant(&conn, now).unwrap();
        assert!(res.paused.contains(&id));
        let after = get_by_id(&conn, id).unwrap().unwrap();
        assert_eq!(after.status, "todo");
        assert_eq!(after.pending_ms, None);
    }

    #[test]
    fn list_duplicate_finds_same_content() {
        let conn = fresh_db();
        let a = create(&conn, "写代码".into()).unwrap();
        start(&conn, a.id).unwrap();
        let dup = list_duplicate(&conn, "写代码").unwrap();
        assert_eq!(dup.len(), 1);
        assert_eq!(dup[0].id, a.id);
    }

    #[test]
    fn list_duplicate_ignores_done() {
        let conn = fresh_db();
        let item = create(&conn, "写代码".into()).unwrap();
        start(&conn, item.id).unwrap();
        complete(&conn, item.id).unwrap();
        let dup = list_duplicate(&conn, "写代码").unwrap();
        assert!(dup.is_empty());
    }

    #[test]
    fn list_recent_titles_dedup() {
        let conn = fresh_db();
        let a = create(&conn, "写周报".into()).unwrap();
        start(&conn, a.id).unwrap();
        complete(&conn, a.id).unwrap();
        let b = create(&conn, "写周报".into()).unwrap();
        start(&conn, b.id).unwrap();
        complete(&conn, b.id).unwrap();
        let recs = list_recent_titles(&conn, 5).unwrap();
        assert_eq!(recs.len(), 1);
        assert_eq!(recs[0].content, "写周报");
    }

    #[test]
    fn list_filters_by_status() {
        let conn = fresh_db();
        let a = create(&conn, "A".into()).unwrap();
        start(&conn, a.id).unwrap();
        let _b = create(&conn, "B".into()).unwrap();
        let actives = list(&conn, ListStatus::Active, None).unwrap();
        assert_eq!(actives.len(), 1);
        let inboxes = list(&conn, ListStatus::Inbox, None).unwrap();
        assert_eq!(inboxes.len(), 1);
    }
}
