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
}