// 复盘视图模块:每日台账回顾四块面板(2026-08-03)。
// 依赖: item + focus_interval + time(仅 local_day_start_ms)。
// 单向依赖: review → item, review → focus_interval(无反向依赖)。
// 四块面板: 已完成任务 / 专注分布 / 待确认(待处理) / 未覆盖时段(空档)。

use rusqlite::{params, Connection};

use crate::db::item::Item;
use crate::db::time::now_ms;
use crate::error::AppError;

/// 每日复盘 DTO，供前端 ReviewPage 渲染。
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct DailyReview {
    /// 今天已完成的卡(archived, updated_at ≥ 今日 0 点)
    pub completed: Vec<Item>,
    /// 专注分布:每项今天的聚焦时长(毫秒)
    pub distribution: Vec<FocusDistribution>,
    /// 待确认卡(pending_ms IS NOT NULL, 未删除)
    pub stale: Vec<Item>,
    /// 今天未被覆盖的时段(空档)
    pub uncovered_gaps: Vec<TimeRange>,
}

/// 单卡今日专注分布
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct FocusDistribution {
    pub item_id: i64,
    pub content: String,
    /// 今日专注时长(毫秒)
    pub focus_ms: i64,
}

/// 时间范围
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct TimeRange {
    pub start: i64,
    pub end: i64,
    /// 持续时长(毫秒)
    pub duration_ms: i64,
}

/// 获取今日复盘数据。
/// `local_day_start` 由调用方传入(由 time::local_day_start_ms 计算),保持无状态。
pub fn get_daily_review(
    conn: &Connection,
    local_day_start: i64,
) -> Result<DailyReview, AppError> {
    let completed = get_completed_today(conn, local_day_start)?;
    let distribution = get_distribution_today(conn, local_day_start)?;
    let stale = get_stale_items(conn)?;
    let uncovered_gaps = get_uncovered_gaps(conn, local_day_start)?;

    Ok(DailyReview {
        completed,
        distribution,
        stale,
        uncovered_gaps,
    })
}

/// 将某空档关联到一项(手动兜底/补充说明)。
/// 在当前 focus_interval 表无 source 字段时,写入一条带 source='manual_gap' 的 interval 记录。
pub fn associate_gap(
    conn: &Connection,
    item_id: i64,
    gap_start: i64,
    gap_end: i64,
) -> Result<(), AppError> {
    let now = now_ms();
    conn.execute(
        "INSERT INTO focus_interval (item_id, started_at, ended_at, created_at, source)
         VALUES (?1, ?2, ?3, ?4, 'manual_gap')",
        params![item_id, gap_start, gap_end, now],
    )?;
    Ok(())
}

/// 已完成的卡: archived + updated_at ≥ 今日 0 点 + 未删除
fn get_completed_today(conn: &Connection, day_start: i64) -> Result<Vec<Item>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, content, type, status, focus_ms, last_active_at,
                progress_note, source, pending_ms, created_at, updated_at
         FROM item
         WHERE status = 'archived' AND deleted_at IS NULL AND updated_at >= ?1
         ORDER BY updated_at DESC",
    )?;
    let rows = stmt.query_map(params![day_start], |row| {
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
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

/// 今日专注分布:按 item 分组,sum focus_interval 的时长
fn get_distribution_today(conn: &Connection, day_start: i64) -> Result<Vec<FocusDistribution>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT fi.item_id, i.content,
                COALESCE(SUM(
                    CASE WHEN fi.ended_at IS NOT NULL
                         THEN fi.ended_at - fi.started_at
                         ELSE ?1 - fi.started_at
                    END
                ), 0) AS total_focus_ms
         FROM focus_interval fi
         JOIN item i ON i.id = fi.item_id
         WHERE fi.started_at >= ?2
         GROUP BY fi.item_id
         ORDER BY total_focus_ms DESC",
    )?;
    let now = now_ms();
    let rows = stmt.query_map(params![now, day_start], |row| {
        Ok(FocusDistribution {
            item_id: row.get(0)?,
            content: row.get(1)?,
            focus_ms: row.get(2)?,
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

/// 待确认卡: pending_ms IS NOT NULL, 未删除
fn get_stale_items(conn: &Connection) -> Result<Vec<Item>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, content, type, status, focus_ms, last_active_at,
                progress_note, source, pending_ms, created_at, updated_at
         FROM item
         WHERE pending_ms IS NOT NULL AND deleted_at IS NULL
         ORDER BY updated_at DESC",
    )?;
    let rows = stmt.query_map([], |row| {
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
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(AppError::from)
}

/// 今日未覆盖时段:找到 focus_interval 中 today 的完整区间,反向推导空档。
/// 策略:取今天最早和最晚的 interval 之间的空白,过滤掉 ≤15s 的微间隙。
fn get_uncovered_gaps(conn: &Connection, day_start: i64) -> Result<Vec<TimeRange>, AppError> {
    let day_end = day_start + 86400 * 1000;

    let mut stmt = conn.prepare(
        "SELECT started_at, ended_at
         FROM focus_interval
         WHERE started_at >= ?1 AND started_at < ?2
         ORDER BY started_at ASC",
    )?;
    let intervals: Vec<(i64, Option<i64>)> = stmt
        .query_map(params![day_start, day_end], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, Option<i64>>(1)?))
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    if intervals.is_empty() {
        return Ok(Vec::new());
    }

    // 只考虑已结算的区间(ended_at IS NOT NULL)来推导空档
    let closed: Vec<(i64, i64)> = intervals
        .iter()
        .filter_map(|(s, e)| e.map(|e| (*s, e)))
        .collect();

    if closed.len() < 2 {
        return Ok(Vec::new());
    }

    let mut gaps = Vec::new();
    let mut prev_end = closed[0].1;

    for &(start, end) in &closed[1..] {
        if start > prev_end {
            let gap_start = prev_end;
            let gap_end = start;
            let duration_ms = gap_end - gap_start;
            // 过滤 ≤15s 的微间隙
            if duration_ms > 15_000 {
                gaps.push(TimeRange {
                    start: gap_start,
                    end: gap_end,
                    duration_ms,
                });
            }
        }
        if end > prev_end {
            prev_end = end;
        }
    }

    Ok(gaps)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn fresh_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(crate::db::schema::CREATE_SQL).unwrap();
        conn
    }

    fn insert_item(conn: &Connection, content: &str, status: &str, updated_at: i64) -> i64 {
        conn.execute(
            "INSERT INTO item (content, status, focus_ms, last_active_at, created_at, updated_at)
             VALUES (?1, ?2, 0, ?3, ?3, ?3)",
            params![content, status, updated_at],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    fn insert_interval(conn: &Connection, item_id: i64, started_at: i64, ended_at: Option<i64>) {
        conn.execute(
            "INSERT INTO focus_interval (item_id, started_at, ended_at, created_at, source)
             VALUES (?1, ?2, ?3, ?4, 'start')",
            params![item_id, started_at, ended_at, started_at],
        )
        .unwrap();
    }

    #[test]
    fn get_completed_today_returns_archived() {
        let conn = fresh_db();
        let day_start = 1000 * 86400 * 1000; // 虚构的今天
        let _active = insert_item(&conn, "进行中", "active", day_start + 1000);
        let done_id = insert_item(&conn, "已完成", "archived", day_start + 2000);

        let result = get_completed_today(&conn, day_start).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].id, done_id);
    }

    #[test]
    fn get_distribution_returns_empty_for_no_intervals() {
        let conn = fresh_db();
        let day_start = 1000 * 86400 * 1000;
        let dist = get_distribution_today(&conn, day_start).unwrap();
        assert!(dist.is_empty());
    }

    #[test]
    fn get_distribution_aggregates_intervals() {
        let conn = fresh_db();
        let day_start = 1000 * 86400 * 1000;
        let item_id = insert_item(&conn, "任务A", "active", day_start + 1000);
        insert_interval(&conn, item_id, day_start + 1000, Some(day_start + 2000));
        insert_interval(&conn, item_id, day_start + 3000, Some(day_start + 4000));

        let dist = get_distribution_today(&conn, day_start).unwrap();
        assert_eq!(dist.len(), 1);
        assert_eq!(dist[0].focus_ms, 2000); // 1000 + 1000
    }

    #[test]
    fn get_stale_returns_items_with_pending_ms() {
        let conn = fresh_db();
        let now = now_ms();
        let item_id = insert_item(&conn, "待确认", "todo", now);
        conn.execute(
            "UPDATE item SET pending_ms = 60000 WHERE id = ?1",
            params![item_id],
        )
        .unwrap();
        let _normal = insert_item(&conn, "正常", "active", now);

        let stale = get_stale_items(&conn).unwrap();
        assert_eq!(stale.len(), 1);
        assert_eq!(stale[0].id, item_id);
    }

    #[test]
    fn get_uncovered_gaps_finds_gaps_between_intervals() {
        let conn = fresh_db();
        let day_start = 1000 * 86400 * 1000;
        let item_id = insert_item(&conn, "任务", "active", day_start + 1000);
        // 区间1: 1000-2000, 区间2: 50000-60000 → 中间有 48000ms 空档(> 15s 阈值)
        insert_interval(&conn, item_id, day_start + 1000, Some(day_start + 2000));
        insert_interval(&conn, item_id, day_start + 50000, Some(day_start + 60000));

        let gaps = get_uncovered_gaps(&conn, day_start).unwrap();
        assert_eq!(gaps.len(), 1);
        assert_eq!(gaps[0].start, day_start + 2000);
        assert_eq!(gaps[0].end, day_start + 50000);
        assert_eq!(gaps[0].duration_ms, 48000);
    }

    #[test]
    fn associate_gap_inserts_interval() {
        let conn = fresh_db();
        let item_id = insert_item(&conn, "关联", "todo", 1000);
        associate_gap(&conn, item_id, 2000, 5000).unwrap();

        let mut stmt = conn
            .prepare("SELECT item_id, started_at, ended_at, source FROM focus_interval WHERE item_id = ?1")
            .unwrap();
        let result: Vec<(i64, i64, i64, String)> = stmt
            .query_map(params![item_id], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            })
            .unwrap()
            .collect::<rusqlite::Result<Vec<_>>>()
            .unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].1, 2000);
        assert_eq!(result[0].2, 5000);
        assert_eq!(result[0].3, "manual_gap");
    }

    #[test]
    fn get_uncovered_gaps_empty_when_no_intervals() {
        let conn = fresh_db();
        let day_start = 1000 * 86400 * 1000;
        let gaps = get_uncovered_gaps(&conn, day_start).unwrap();
        assert!(gaps.is_empty());
    }

    #[test]
    fn get_uncovered_gaps_filters_micro_gaps() {
        let conn = fresh_db();
        let day_start = 1000 * 86400 * 1000;
        let item_id = insert_item(&conn, "任务", "active", day_start + 1000);
        // 3 秒微间隙(≤15s)→ 应被过滤
        insert_interval(&conn, item_id, day_start + 1000, Some(day_start + 2000));
        insert_interval(&conn, item_id, day_start + 5000, Some(day_start + 6000));

        let gaps = get_uncovered_gaps(&conn, day_start).unwrap();
        assert!(gaps.is_empty(), "微间隙应被过滤掉");
    }

    #[test]
    fn get_daily_review_integration() {
        let conn = fresh_db();
        let day_start = 1000 * 86400 * 1000;
        // 已完成
        insert_item(&conn, "已完成A", "archived", day_start + 1000);
        // 进行中(不出现)
        insert_item(&conn, "进行中B", "active", day_start + 500);
        // 待确认
        let stale_id = insert_item(&conn, "待确认C", "todo", day_start + 2000);
        conn.execute("UPDATE item SET pending_ms = 30000 WHERE id = ?1", params![stale_id]).unwrap();
        // 专注分布
        let active_id = insert_item(&conn, "活跃D", "active", day_start + 100);
        insert_interval(&conn, active_id, day_start + 1000, Some(day_start + 3000));

        let review = get_daily_review(&conn, day_start).unwrap();
        assert_eq!(review.completed.len(), 1);
        assert_eq!(review.completed[0].content, "已完成A");
        assert_eq!(review.distribution.len(), 1);
        assert_eq!(review.distribution[0].focus_ms, 2000);
        assert_eq!(review.stale.len(), 1);
        assert_eq!(review.stale[0].id, stale_id);
        assert!(review.uncovered_gaps.is_empty());
    }
}