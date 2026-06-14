// src-tauri/src/db/record.rs
use crate::error::AppResult;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Record {
    pub id: i64,
    pub kind: String,
    pub source_id: i64,
    pub content: String,
    pub status: Option<String>,
    pub created_at: i64,
}

/// 全部记录（最新优先），可隐藏归档
pub fn list_records(
    conn: &Connection,
    limit: i64,
    hide_archived: bool,
) -> AppResult<Vec<Record>> {
    let sql = if hide_archived {
        "SELECT id, kind, source_id, content, status, created_at FROM record
         WHERE kind != 'task' OR source_id NOT IN
             (SELECT id FROM task WHERE archived_at IS NOT NULL)
         ORDER BY created_at DESC
         LIMIT ?1"
    } else {
        "SELECT id, kind, source_id, content, status, created_at FROM record
         ORDER BY created_at DESC
         LIMIT ?1"
    };
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt
        .query_map(params![limit], |r| {
            Ok(Record {
                id: r.get(0)?,
                kind: r.get(1)?,
                source_id: r.get(2)?,
                content: r.get(3)?,
                status: r.get(4)?,
                created_at: r.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

/// 按类型筛选
pub fn list_by_kind(
    conn: &Connection,
    kind: &str,
    limit: i64,
) -> AppResult<Vec<Record>> {
    let mut stmt = conn.prepare(
        "SELECT id, kind, source_id, content, status, created_at FROM record
         WHERE kind = ?1
         ORDER BY created_at DESC
         LIMIT ?2",
    )?;
    let rows = stmt
        .query_map(params![kind, limit], |r| {
            Ok(Record {
                id: r.get(0)?,
                kind: r.get(1)?,
                source_id: r.get(2)?,
                content: r.get(3)?,
                status: r.get(4)?,
                created_at: r.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

/// 切换下拉清单：未开始 + 已暂停
pub fn list_switchable(conn: &Connection) -> AppResult<Vec<Record>> {
    let mut stmt = conn.prepare(
        "SELECT r.id, r.kind, r.source_id, r.content, r.status, r.created_at
         FROM record r
         WHERE r.kind = 'task' AND r.status IN ('pending', 'paused')
         ORDER BY
             CASE r.status WHEN 'pending' THEN 1 WHEN 'paused' THEN 2 END,
             r.created_at DESC",
    )?;
    let rows = stmt
        .query_map([], |r| {
            Ok(Record {
                id: r.get(0)?,
                kind: r.get(1)?,
                source_id: r.get(2)?,
                content: r.get(3)?,
                status: r.get(4)?,
                created_at: r.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

/// 当前 active task
pub fn get_active_task(conn: &Connection) -> AppResult<Option<Record>> {
    let mut stmt = conn.prepare(
        "SELECT id, kind, source_id, content, status, created_at FROM record
         WHERE kind = 'task' AND status = 'active'
         LIMIT 1",
    )?;
    let mut rows = stmt.query([])?;
    if let Some(r) = rows.next()? {
        Ok(Some(Record {
            id: r.get(0)?,
            kind: r.get(1)?,
            source_id: r.get(2)?,
            content: r.get(3)?,
            status: r.get(4)?,
            created_at: r.get(5)?,
        }))
    } else {
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::check_in::create_check_in;
    use crate::db::idea::create_idea;
    use crate::db::schema::create_tables;
    use crate::db::task::{complete, create_task, pause, start_timer};

    fn test_conn() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        create_tables(&conn).unwrap();
        conn
    }

    #[test]
    fn list_records_mixes_all_kinds() {
        let conn = test_conn();
        create_idea(&conn, "a").unwrap();
        create_check_in(&conn, "h", None).unwrap();
        let t = create_task(&conn, "x", None).unwrap();
        start_timer(&conn, t.id).unwrap();

        let all = list_records(&conn, 50, false).unwrap();
        assert_eq!(all.len(), 3);
        let kinds: Vec<&str> = all.iter().map(|r| r.kind.as_str()).collect();
        assert!(kinds.contains(&"idea"));
        assert!(kinds.contains(&"check_in"));
        assert!(kinds.contains(&"task"));
    }

    #[test]
    fn get_active_task_returns_currently_active() {
        let conn = test_conn();
        let t = create_task(&conn, "active one", None).unwrap();
        start_timer(&conn, t.id).unwrap();
        let active = get_active_task(&conn).unwrap();
        assert!(active.is_some());
        assert_eq!(active.unwrap().source_id, t.id);
    }

    #[test]
    fn list_switchable_excludes_active_and_done() {
        let conn = test_conn();
        let t1 = create_task(&conn, "active", None).unwrap();
        start_timer(&conn, t1.id).unwrap();
        let t2 = create_task(&conn, "pending one", None).unwrap();
        let t3 = create_task(&conn, "to be done", None).unwrap();
        // t1 is active, so pause it before starting t3
        pause(&conn, t1.id).unwrap();
        start_timer(&conn, t3.id).unwrap();
        complete(&conn, t3.id).unwrap();

        let list = list_switchable(&conn).unwrap();
        let ids: Vec<i64> = list.iter().map(|r| r.source_id).collect();
        assert!(ids.contains(&t1.id));
        assert!(ids.contains(&t2.id));
        assert!(!ids.contains(&t3.id));
    }
}
