// src-tauri/src/db/check_in.rs
use crate::db::task::now_ms;
use crate::error::AppResult;
use rusqlite::{Connection, params};

pub fn create_check_in(
    conn: &Connection,
    habit: &str,
    note: Option<&str>,
) -> AppResult<i64> {
    let now = now_ms();
    let content = match note {
        Some(n) => format!("{} · {}", habit, n),
        None => habit.to_string(),
    };
    let tx = conn.unchecked_transaction()?;
    tx.execute(
        "INSERT INTO check_in (habit, note, checked_at) VALUES (?1, ?2, ?3)",
        params![habit, note, now],
    )?;
    let id = tx.last_insert_rowid();
    tx.execute(
        "INSERT INTO record (kind, source_id, content, status, created_at)
         VALUES ('check_in', ?1, ?2, NULL, ?3)",
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
    fn create_check_in_with_note() {
        let conn = test_conn();
        let id = create_check_in(&conn, "晨跑", Some("5km")).unwrap();
        let content: String = conn
            .query_row(
                "SELECT content FROM record WHERE kind = 'check_in' AND source_id = ?1",
                params![id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(content, "晨跑 · 5km");
    }

    #[test]
    fn create_check_in_without_note() {
        let conn = test_conn();
        let id = create_check_in(&conn, "冥想", None).unwrap();
        let content: String = conn
            .query_row(
                "SELECT content FROM record WHERE kind = 'check_in' AND source_id = ?1",
                params![id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(content, "冥想");
    }
}