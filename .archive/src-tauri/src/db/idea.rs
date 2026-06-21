// src-tauri/src/db/idea.rs
use crate::db::task::now_ms;
use crate::error::AppResult;
use rusqlite::{Connection, params};

pub fn create_idea(conn: &Connection, content: &str) -> AppResult<i64> {
    let now = now_ms();
    let tx = conn.unchecked_transaction()?;
    tx.execute(
        "INSERT INTO idea (content, created_at) VALUES (?1, ?2)",
        params![content, now],
    )?;
    let id = tx.last_insert_rowid();
    tx.execute(
        "INSERT INTO record (kind, source_id, content, status, created_at)
         VALUES ('idea', ?1, ?2, NULL, ?3)",
        params![id, content, now],
    )?;
    tx.commit()?;
    Ok(id)
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
    fn create_idea_writes_idea_and_record() {
        let conn = test_conn();
        let id = create_idea(&conn, "用 Vercel KV 做缓存").unwrap();
        let idea_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM idea WHERE id = ?1", params![id], |r| r.get(0))
            .unwrap();
        assert_eq!(idea_count, 1);
        let record_kind: String = conn
            .query_row(
                "SELECT kind FROM record WHERE source_id = ?1",
                params![id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(record_kind, "idea");
    }
}