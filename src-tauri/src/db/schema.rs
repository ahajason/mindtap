// src-tauri/src/db/schema.rs
use rusqlite::Connection;

pub fn create_tables(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS task (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            content             TEXT    NOT NULL,
            status              TEXT    NOT NULL DEFAULT 'pending',
            duration_ms         INTEGER NOT NULL DEFAULT 0,
            first_focused_at    INTEGER,
            focus_started_at    INTEGER,
            paused_at           INTEGER,
            focused_count       INTEGER NOT NULL DEFAULT 0,
            due_at              INTEGER,
            created_at          INTEGER NOT NULL,
            updated_at          INTEGER NOT NULL,
            archived_at         INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_task_status ON task(status);
        CREATE INDEX IF NOT EXISTS idx_task_due_at ON task(due_at);

        CREATE TABLE IF NOT EXISTS idea (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            content     TEXT    NOT NULL,
            created_at  INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_idea_created_at ON idea(created_at);

        CREATE TABLE IF NOT EXISTS check_in (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            habit       TEXT    NOT NULL,
            note        TEXT,
            checked_at  INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_check_in_habit      ON check_in(habit);
        CREATE INDEX IF NOT EXISTS idx_check_in_checked_at ON check_in(checked_at);

        CREATE TABLE IF NOT EXISTS record (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            kind        TEXT    NOT NULL,
            source_id   INTEGER NOT NULL,
            content     TEXT    NOT NULL,
            status      TEXT,
            created_at  INTEGER NOT NULL,
            UNIQUE(kind, source_id)
        );
        CREATE INDEX IF NOT EXISTS idx_record_created_at ON record(created_at);
        CREATE INDEX IF NOT EXISTS idx_record_kind       ON record(kind);
        CREATE INDEX IF NOT EXISTS idx_record_status     ON record(status);
        "#,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn test_conn() -> Connection {
        Connection::open_in_memory().unwrap()
    }

    #[test]
    fn create_tables_runs_without_error() {
        let conn = test_conn();
        let result = create_tables(&conn);
        assert!(result.is_ok(), "create_tables should succeed: {:?}", result);
    }

    #[test]
    fn all_four_tables_exist_after_create() {
        let conn = test_conn();
        create_tables(&conn).unwrap();
        let names: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |r| r.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();
        assert!(names.contains(&"task".to_string()));
        assert!(names.contains(&"idea".to_string()));
        assert!(names.contains(&"check_in".to_string()));
        assert!(names.contains(&"record".to_string()));
    }
}
