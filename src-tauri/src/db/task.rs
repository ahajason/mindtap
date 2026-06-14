// src-tauri/src/db/task.rs
use crate::error::{AppError, AppResult};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: i64,
    pub content: String,
    pub status: String,
    pub duration_ms: i64,
    pub first_focused_at: Option<i64>,
    pub focus_started_at: Option<i64>,
    pub paused_at: Option<i64>,
    pub focused_count: i64,
    pub due_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub archived_at: Option<i64>,
}

pub fn now_ms() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

pub fn create_task(
    conn: &Connection,
    content: &str,
    due_at: Option<i64>,
) -> AppResult<Task> {
    let now = now_ms();
    let tx = conn.unchecked_transaction()?;
    tx.execute(
        "INSERT INTO task (content, status, created_at, updated_at, due_at)
         VALUES (?1, 'pending', ?2, ?2, ?3)",
        params![content, now, due_at],
    )?;
    let id = tx.last_insert_rowid();
    tx.execute(
        "INSERT INTO record (kind, source_id, content, status, created_at)
         VALUES ('task', ?1, ?2, 'pending', ?3)",
        params![id, content, now],
    )?;
    tx.commit()?;
    Ok(Task {
        id,
        content: content.to_string(),
        status: "pending".to_string(),
        duration_ms: 0,
        first_focused_at: None,
        focus_started_at: None,
        paused_at: None,
        focused_count: 0,
        due_at,
        created_at: now,
        updated_at: now,
        archived_at: None,
    })
}

/// 启动计时：pending → active
pub fn start_timer(conn: &Connection, task_id: i64) -> AppResult<Task> {
    let now = now_ms();
    let tx = conn.unchecked_transaction()?;

    // L1: 全局唯一 active 检查
    let existing: Option<i64> = tx
        .query_row(
            "SELECT id FROM task WHERE status = 'active' AND id != ?1 LIMIT 1",
            params![task_id],
            |r| r.get(0),
        )
        .ok();
    if existing.is_some() {
        return Err(AppError::ActiveExists);
    }

    tx.execute(
        "UPDATE task
         SET status = 'active',
             focus_started_at = ?1,
             first_focused_at = COALESCE(first_focused_at, ?1),
             focused_count = focused_count + 1,
             updated_at = ?1
         WHERE id = ?2",
        params![now, task_id],
    )?;
    tx.execute(
        "UPDATE record SET status = 'active' WHERE kind = 'task' AND source_id = ?1",
        params![task_id],
    )?;
    tx.commit()?;
    get_task(conn, task_id)
}

/// 暂停：active → paused
pub fn pause(conn: &Connection, task_id: i64) -> AppResult<Task> {
    let now = now_ms();
    let tx = conn.unchecked_transaction()?;
    let (status, focus_started_at, duration_ms): (String, Option<i64>, i64) = tx.query_row(
        "SELECT status, focus_started_at, duration_ms FROM task WHERE id = ?1",
        params![task_id],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
    )?;
    if status != "active" {
        return Err(AppError::InvalidTransition(format!(
            "pause requires active, got {}", status
        )));
    }
    let started = focus_started_at.ok_or_else(|| {
        AppError::InvalidTransition("active task missing focus_started_at".into())
    })?;
    let new_duration = duration_ms + (now - started);
    tx.execute(
        "UPDATE task
         SET status = 'paused',
             duration_ms = ?1,
             focus_started_at = NULL,
             paused_at = ?2,
             updated_at = ?2
         WHERE id = ?3",
        params![new_duration, now, task_id],
    )?;
    tx.execute(
        "UPDATE record SET status = 'paused' WHERE kind = 'task' AND source_id = ?1",
        params![task_id],
    )?;
    tx.commit()?;
    get_task(conn, task_id)
}

/// 继续：paused → active
pub fn resume(conn: &Connection, task_id: i64) -> AppResult<Task> {
    let now = now_ms();
    let tx = conn.unchecked_transaction()?;
    let existing: Option<i64> = tx
        .query_row(
            "SELECT id FROM task WHERE status = 'active' AND id != ?1 LIMIT 1",
            params![task_id],
            |r| r.get(0),
        )
        .ok();
    if existing.is_some() {
        return Err(AppError::ActiveExists);
    }
    let updated = tx.execute(
        "UPDATE task
         SET status = 'active',
             focus_started_at = ?1,
             paused_at = NULL,
             updated_at = ?1
         WHERE id = ?2 AND status = 'paused'",
        params![now, task_id],
    )?;
    if updated == 0 {
        return Err(AppError::InvalidTransition("resume requires paused".into()));
    }
    tx.execute(
        "UPDATE record SET status = 'active' WHERE kind = 'task' AND source_id = ?1",
        params![task_id],
    )?;
    tx.commit()?;
    get_task(conn, task_id)
}

/// 完成：active → done
pub fn complete(conn: &Connection, task_id: i64) -> AppResult<Task> {
    let now = now_ms();
    let tx = conn.unchecked_transaction()?;
    let (status, focus_started_at, duration_ms): (String, Option<i64>, i64) = tx.query_row(
        "SELECT status, focus_started_at, duration_ms FROM task WHERE id = ?1",
        params![task_id],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
    )?;
    if status != "active" {
        return Err(AppError::InvalidTransition(format!(
            "complete requires active, got {}", status
        )));
    }
    let new_duration = if let Some(started) = focus_started_at {
        duration_ms + (now - started)
    } else {
        duration_ms
    };
    tx.execute(
        "UPDATE task
         SET status = 'done',
             duration_ms = ?1,
             focus_started_at = NULL,
             updated_at = ?2
         WHERE id = ?3",
        params![new_duration, now, task_id],
    )?;
    tx.execute(
        "UPDATE record SET status = 'done' WHERE kind = 'task' AND source_id = ?1",
        params![task_id],
    )?;
    tx.commit()?;
    get_task(conn, task_id)
}

/// 撤销：done → active
pub fn undo(conn: &Connection, task_id: i64) -> AppResult<Task> {
    let now = now_ms();
    let tx = conn.unchecked_transaction()?;
    let updated = tx.execute(
        "UPDATE task
         SET status = 'active',
             focus_started_at = ?1,
             updated_at = ?1
         WHERE id = ?2 AND status = 'done'",
        params![now, task_id],
    )?;
    if updated == 0 {
        return Err(AppError::InvalidTransition("undo requires done".into()));
    }
    tx.execute(
        "UPDATE record SET status = 'active' WHERE kind = 'task' AND source_id = ?1",
        params![task_id],
    )?;
    tx.commit()?;
    get_task(conn, task_id)
}

pub fn get_task(conn: &Connection, id: i64) -> AppResult<Task> {
    Ok(conn.query_row(
        "SELECT id, content, status, duration_ms, first_focused_at, focus_started_at,
                paused_at, focused_count, due_at, created_at, updated_at, archived_at
         FROM task WHERE id = ?1",
        params![id],
        |r| Ok(Task {
            id: r.get(0)?,
            content: r.get(1)?,
            status: r.get(2)?,
            duration_ms: r.get(3)?,
            first_focused_at: r.get(4)?,
            focus_started_at: r.get(5)?,
            paused_at: r.get(6)?,
            focused_count: r.get(7)?,
            due_at: r.get(8)?,
            created_at: r.get(9)?,
            updated_at: r.get(10)?,
            archived_at: r.get(11)?,
        }),
    )?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::schema::create_tables;

    fn test_conn() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        create_tables(&conn).unwrap();
        conn
    }

    #[test]
    fn create_task_inserts_both_task_and_record() {
        let conn = test_conn();
        let task = create_task(&conn, "写 Q3 计划", None).unwrap();
        assert_eq!(task.status, "pending");
        assert_eq!(task.duration_ms, 0);
        assert_eq!(task.focused_count, 0);

        // 验证 task 行存在
        let task_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM task WHERE id = ?1", params![task.id], |r| r.get(0))
            .unwrap();
        assert_eq!(task_count, 1);

        // 验证 record 行自动写入（事务双写）
        let (kind, source_id, content, status): (String, i64, String, Option<String>) = conn
            .query_row(
                "SELECT kind, source_id, content, status FROM record WHERE source_id = ?1",
                params![task.id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .unwrap();
        assert_eq!(kind, "task");
        assert_eq!(source_id, task.id);
        assert_eq!(content, "写 Q3 计划");
        assert_eq!(status, Some("pending".to_string()));
    }

    #[test]
    fn create_task_with_due_at_stores_due() {
        let conn = test_conn();
        let due = now_ms() + 86_400_000;
        let task = create_task(&conn, "明天做", Some(due)).unwrap();
        assert_eq!(task.due_at, Some(due));
    }

    #[test]
    fn start_timer_pending_to_active() {
        let conn = test_conn();
        let task = create_task(&conn, "test", None).unwrap();
        let active = start_timer(&conn, task.id).unwrap();
        assert_eq!(active.status, "active");
        assert!(active.first_focused_at.is_some());
        assert!(active.focus_started_at.is_some());
        assert_eq!(active.focused_count, 1);
    }

    #[test]
    fn start_timer_when_active_exists_errors() {
        let conn = test_conn();
        let t1 = create_task(&conn, "a", None).unwrap();
        let t2 = create_task(&conn, "b", None).unwrap();
        start_timer(&conn, t1.id).unwrap();
        let result = start_timer(&conn, t2.id);
        assert!(matches!(result, Err(AppError::ActiveExists)));
    }

    #[test]
    fn pause_active_accumulates_duration() {
        let conn = test_conn();
        let task = create_task(&conn, "x", None).unwrap();
        start_timer(&conn, task.id).unwrap();
        std::thread::sleep(std::time::Duration::from_millis(50));
        let paused = pause(&conn, task.id).unwrap();
        assert_eq!(paused.status, "paused");
        assert!(paused.duration_ms >= 50);
        assert!(paused.focus_started_at.is_none());
        assert!(paused.paused_at.is_some());
    }

    #[test]
    fn resume_paused_preserves_duration() {
        let conn = test_conn();
        let task = create_task(&conn, "x", None).unwrap();
        start_timer(&conn, task.id).unwrap();
        std::thread::sleep(std::time::Duration::from_millis(30));
        let paused = pause(&conn, task.id).unwrap();
        let d1 = paused.duration_ms;
        let resumed = resume(&conn, task.id).unwrap();
        assert_eq!(resumed.status, "active");
        assert_eq!(resumed.duration_ms, d1, "duration preserved across resume");
        assert!(resumed.focus_started_at.is_some());
    }

    #[test]
    fn complete_accumulates_then_done() {
        let conn = test_conn();
        let task = create_task(&conn, "x", None).unwrap();
        start_timer(&conn, task.id).unwrap();
        std::thread::sleep(std::time::Duration::from_millis(20));
        let done = complete(&conn, task.id).unwrap();
        assert_eq!(done.status, "done");
        assert!(done.duration_ms >= 20);
        assert!(done.focus_started_at.is_none());
    }

    #[test]
    fn undo_done_to_active() {
        let conn = test_conn();
        let task = create_task(&conn, "x", None).unwrap();
        start_timer(&conn, task.id).unwrap();
        complete(&conn, task.id).unwrap();
        let undone = undo(&conn, task.id).unwrap();
        assert_eq!(undone.status, "active");
        assert!(undone.focus_started_at.is_some());
    }
}