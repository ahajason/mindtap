use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, Row};

use crate::error::AppError;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TimerSession {
    pub id: i64,
    pub task_title: String,
    pub status: String,
    pub started_at: Option<i64>,
    pub paused_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub focus_ms: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn row_to_session(row: &Row<'_>) -> rusqlite::Result<TimerSession> {
    Ok(TimerSession {
        id: row.get(0)?,
        task_title: row.get(1)?,
        status: row.get(2)?,
        started_at: row.get(3)?,
        paused_at: row.get(4)?,
        completed_at: row.get(5)?,
        focus_ms: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
    })
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TaskTitleRec {
    pub task_title: String,
    pub last_used: i64,
}

pub fn create(conn: &Connection, task_title: String) -> Result<TimerSession, AppError> {
    let now = now_ms();
    conn.execute(
        "INSERT INTO timer_session (task_title, status, started_at, focus_ms, created_at, updated_at)
         VALUES (?1, 'active', ?2, 0, ?2, ?2)",
        params![task_title, now],
    )?;
    let id = conn.last_insert_rowid();
    get_by_id(conn, id)?.ok_or_else(|| AppError("just-created session not found".into()))
}

pub fn get_active(conn: &Connection) -> Result<Option<TimerSession>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, task_title, status, started_at, paused_at, completed_at, focus_ms, created_at, updated_at
         FROM timer_session WHERE status = 'active' LIMIT 1",
    )?;
    let mut rows = stmt.query([])?;
    match rows.next()? {
        Some(row) => Ok(Some(row_to_session(row)?)),
        None => Ok(None),
    }
}

pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<TimerSession>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, task_title, status, started_at, paused_at, completed_at, focus_ms, created_at, updated_at
         FROM timer_session WHERE id = ?1",
    )?;
    let mut rows = stmt.query(params![id])?;
    match rows.next()? {
        Some(row) => Ok(Some(row_to_session(row)?)),
        None => Ok(None),
    }
}

pub fn update_focus_ms(conn: &Connection, id: i64, focus_ms: i64) -> Result<(), AppError> {
    conn.execute(
        "UPDATE timer_session SET focus_ms = ?1, updated_at = ?2 WHERE id = ?3 AND status = 'active'",
        params![focus_ms, now_ms(), id],
    )?;
    Ok(())
}

pub fn pause(conn: &Connection, id: i64) -> Result<TimerSession, AppError> {
    let now = now_ms();
    let changed = conn.execute(
        "UPDATE timer_session SET status = 'paused', paused_at = ?1, updated_at = ?1
         WHERE id = ?2 AND status = 'active'",
        params![now, id],
    )?;
    if changed == 0 {
        return Err(AppError(format!(
            "session {id} is not active, cannot pause"
        )));
    }
    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("session {id} not found")))
}

pub fn resume(conn: &Connection, id: i64) -> Result<TimerSession, AppError> {
    let now = now_ms();
    let changed = conn.execute(
        "UPDATE timer_session SET status = 'active', paused_at = NULL, updated_at = ?1
         WHERE id = ?2 AND status = 'paused'",
        params![now, id],
    )?;
    if changed == 0 {
        return Err(AppError(format!(
            "session {id} is not paused, cannot resume"
        )));
    }
    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("session {id} not found")))
}

pub fn complete(conn: &Connection, id: i64) -> Result<TimerSession, AppError> {
    let now = now_ms();
    let changed = conn.execute(
        "UPDATE timer_session SET status = 'completed', completed_at = ?1, updated_at = ?1
         WHERE id = ?2 AND status IN ('active', 'paused')",
        params![now, id],
    )?;
    if changed == 0 {
        return Err(AppError(format!(
            "session {id} is already completed or not active/paused"
        )));
    }
    get_by_id(conn, id)?.ok_or_else(|| AppError(format!("session {id} not found")))
}

pub fn list_recent_task_titles(
    conn: &Connection,
    limit: i64,
) -> Result<Vec<TaskTitleRec>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT task_title, MAX(completed_at) AS last_used
         FROM timer_session
         WHERE status = 'completed'
         GROUP BY task_title
         ORDER BY last_used DESC
         LIMIT ?1",
    )?;
    let rows = stmt.query_map(params![limit], |row| {
        Ok(TaskTitleRec {
            task_title: row.get(0)?,
            last_used: row.get(1)?,
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(AppError::from)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn fresh_db() -> Connection {
        let id = COUNTER.fetch_add(1, Ordering::SeqCst);
        let path =
            std::env::temp_dir().join(format!("mindtap_test_{}_{}.db", std::process::id(), id));
        let _ = std::fs::remove_file(&path);
        let conn = Connection::open(&path).unwrap();
        conn.execute_batch(crate::db::schema::CREATE_SQL).unwrap();
        conn
    }

    #[test]
    fn create_returns_active_session() {
        let conn = fresh_db();
        let s = create(&conn, "写代码".into()).unwrap();
        assert_eq!(s.status, "active");
        assert_eq!(s.task_title, "写代码");
        assert_eq!(s.focus_ms, 0);
        assert!(s.started_at.is_some());
        assert!(s.paused_at.is_none());
        assert!(s.completed_at.is_none());
    }

    #[test]
    fn get_active_returns_none_when_empty() {
        let conn = fresh_db();
        assert!(get_active(&conn).unwrap().is_none());
    }

    #[test]
    fn get_active_returns_only_active() {
        let conn = fresh_db();
        let a = create(&conn, "A".into()).unwrap();
        assert!(
            create(&conn, "B".into()).is_err(),
            "partial unique index must reject 2nd active"
        );
        let active = get_active(&conn).unwrap().unwrap();
        assert_eq!(active.id, a.id);
        assert_eq!(active.task_title, "A");
    }

    #[test]
    fn update_focus_ms_only_active() {
        let conn = fresh_db();
        let s = create(&conn, "X".into()).unwrap();
        update_focus_ms(&conn, s.id, 5000).unwrap();
        let after = get_by_id(&conn, s.id).unwrap().unwrap();
        assert_eq!(after.focus_ms, 5000);
    }

    #[test]
    fn pause_then_resume_roundtrip() {
        let conn = fresh_db();
        let s = create(&conn, "X".into()).unwrap();
        let paused = pause(&conn, s.id).unwrap();
        assert_eq!(paused.status, "paused");
        assert!(paused.paused_at.is_some());

        let resumed = resume(&conn, s.id).unwrap();
        assert_eq!(resumed.status, "active");
        assert!(resumed.paused_at.is_none());
    }

    #[test]
    fn complete_from_active() {
        let conn = fresh_db();
        let s = create(&conn, "X".into()).unwrap();
        let done = complete(&conn, s.id).unwrap();
        assert_eq!(done.status, "completed");
        assert!(done.completed_at.is_some());
    }

    #[test]
    fn complete_from_paused() {
        let conn = fresh_db();
        let s = create(&conn, "X".into()).unwrap();
        pause(&conn, s.id).unwrap();
        let done = complete(&conn, s.id).unwrap();
        assert_eq!(done.status, "completed");
    }

    #[test]
    fn complete_twice_errors() {
        let conn = fresh_db();
        let s = create(&conn, "X".into()).unwrap();
        complete(&conn, s.id).unwrap();
        assert!(complete(&conn, s.id).is_err());
    }

    #[test]
    fn pause_inactive_errors() {
        let conn = fresh_db();
        let s = create(&conn, "X".into()).unwrap();
        pause(&conn, s.id).unwrap();
        assert!(pause(&conn, s.id).is_err());
    }

    #[test]
    fn list_recent_task_titles_empty_db() {
        let conn = fresh_db();
        let recs = list_recent_task_titles(&conn, 5).unwrap();
        assert_eq!(recs.len(), 0);
    }

    #[test]
    fn list_recent_task_titles_dedup_by_task_title() {
        let conn = fresh_db();
        let s1 = create(&conn, "写周报".into()).unwrap();
        complete(&conn, s1.id).unwrap();
        let s2 = create(&conn, "写周报".into()).unwrap();
        complete(&conn, s2.id).unwrap();
        let recs = list_recent_task_titles(&conn, 5).unwrap();
        assert_eq!(recs.len(), 1);
        assert_eq!(recs[0].task_title, "写周报");
    }

    #[test]
    fn list_recent_task_titles_order_by_last_used_desc() {
        let conn = fresh_db();
        let s1 = create(&conn, "task A".into()).unwrap();
        complete(&conn, s1.id).unwrap();
        std::thread::sleep(std::time::Duration::from_millis(5));
        let s2 = create(&conn, "task B".into()).unwrap();
        complete(&conn, s2.id).unwrap();
        let recs = list_recent_task_titles(&conn, 5).unwrap();
        assert_eq!(recs.len(), 2);
        assert_eq!(recs[0].task_title, "task B");
        assert_eq!(recs[1].task_title, "task A");
    }
}
