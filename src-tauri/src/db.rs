use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::db::schema::CREATE_SQL;
use crate::error::AppError;

pub mod dormant;
pub mod item;
pub mod review;
pub mod schema;
pub mod setting;
pub mod time;

/// 当前唯一规范 schema 版本。后续 schema 变更只允许前向迁移。
const SCHEMA_VERSION: i32 = 1;

pub struct DbState(pub Mutex<Connection>);

pub fn init(app: &AppHandle) -> Result<DbState, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    let conn = Connection::open(dir.join("projects.db"))?;
    init_connection(&conn)?;
    // 启动只允许写 app_setting（时区）；业务表不动。
    time::persist_tz_offset(&conn);
    Ok(DbState(Mutex::new(conn)))
}

/// 三表为唯一规范；旧 shape 拒绝，不做静默 ALTER/UPDATE。
pub fn init_connection(conn: &Connection) -> Result<(), AppError> {
    let version: i32 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;

    if version > SCHEMA_VERSION {
        return Err(AppError(format!(
            "数据库 schema 版本 {version} 高于本程序支持的 {SCHEMA_VERSION}"
        )));
    }
    if version != 0 && version != SCHEMA_VERSION {
        return Err(AppError(format!(
            "不支持的数据库 schema 版本 {version}；当前仅支持 {SCHEMA_VERSION}"
        )));
    }

    match ensure_current_schema(conn) {
        Ok(()) => {}
        Err(_) if version == 0 => {
            // 空库或非本应用库：建规范表。已有残缺表会在 CREATE IF NOT EXISTS 后仍缺列/坏 status 时再 fail。
            conn.execute_batch(CREATE_SQL)?;
            ensure_current_schema(conn)?;
        }
        Err(e) => return Err(e),
    }

    if version == 0 {
        conn.pragma_update(None, "user_version", SCHEMA_VERSION)?;
    }
    Ok(())
}

fn ensure_current_schema(conn: &Connection) -> Result<(), AppError> {
    for table in ["item", "focus_interval", "app_setting"] {
        if !table_exists(conn, table)? {
            return Err(AppError(format!(
                "数据库缺少表 `{table}`，与 0.2.2 规范 schema 不兼容"
            )));
        }
    }
    if !column_exists(conn, "focus_interval", "source")? {
        return Err(AppError(
            "focus_interval 缺少 source 列，与 0.2.2 规范 schema 不兼容".into(),
        ));
    }
    let bad_status: i64 = conn.query_row(
        "SELECT COUNT(*) FROM item WHERE status NOT IN ('todo','active','archived')",
        [],
        |row| row.get(0),
    )?;
    if bad_status > 0 {
        return Err(AppError(format!(
            "检测到 {bad_status} 条非三态 status 记录；0.2.2 不再自动迁移旧状态"
        )));
    }
    Ok(())
}

fn table_exists(conn: &Connection, name: &str) -> Result<bool, AppError> {
    let n: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?1",
        [name],
        |row| row.get(0),
    )?;
    Ok(n > 0)
}

fn column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool, AppError> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})"))?;
    let exists = stmt
        .query_map([], |row| row.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .any(|name| name == column);
    Ok(exists)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn open_mem() -> Connection {
        Connection::open_in_memory().unwrap()
    }

    #[test]
    fn fresh_db_creates_schema_and_stamps_user_version() {
        let conn = open_mem();
        init_connection(&conn).unwrap();
        let version: i32 = conn
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .unwrap();
        assert_eq!(version, SCHEMA_VERSION);
        assert!(table_exists(&conn, "item").unwrap());
        assert!(column_exists(&conn, "focus_interval", "source").unwrap());
    }

    #[test]
    fn current_unversioned_db_is_stamped_without_data_loss() {
        let conn = open_mem();
        conn.execute_batch(CREATE_SQL).unwrap();
        conn.execute(
            "INSERT INTO item (content, status, focus_ms, source, created_at, updated_at)
             VALUES ('保留', 'todo', 0, 'manual', 1, 1)",
            [],
        )
        .unwrap();
        init_connection(&conn).unwrap();
        let version: i32 = conn
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .unwrap();
        assert_eq!(version, SCHEMA_VERSION);
        let n: i64 = conn
            .query_row("SELECT COUNT(*) FROM item WHERE content = '保留'", [], |r| r.get(0))
            .unwrap();
        assert_eq!(n, 1);
    }

    #[test]
    fn legacy_focus_interval_without_source_is_rejected() {
        let conn = open_mem();
        conn.execute_batch(
            "CREATE TABLE item (id INTEGER PRIMARY KEY, content TEXT NOT NULL, status TEXT NOT NULL,
               focus_ms INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
             CREATE TABLE focus_interval (id INTEGER PRIMARY KEY, item_id INTEGER NOT NULL,
               started_at INTEGER NOT NULL, ended_at INTEGER, created_at INTEGER NOT NULL);
             CREATE TABLE app_setting (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);",
        )
        .unwrap();
        // 已 stamp 为当前版本的残缺库：不得静默 ALTER
        conn.pragma_update(None, "user_version", SCHEMA_VERSION)
            .unwrap();
        let err = init_connection(&conn).unwrap_err();
        assert!(err.0.contains("source"));
        assert!(!column_exists(&conn, "focus_interval", "source").unwrap());
    }

    #[test]
    fn legacy_status_values_are_rejected_without_rewrite() {
        let conn = open_mem();
        conn.execute_batch(
            "CREATE TABLE item (
               id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL,
               type TEXT NOT NULL DEFAULT 'task', status TEXT NOT NULL,
               focus_ms INTEGER NOT NULL DEFAULT 0, last_active_at INTEGER,
               progress_note TEXT, source TEXT NOT NULL DEFAULT 'manual',
               payload TEXT, tag TEXT, deleted_at INTEGER, pending_ms INTEGER,
               created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
             );
             CREATE TABLE focus_interval (
               id INTEGER PRIMARY KEY AUTOINCREMENT, item_id INTEGER NOT NULL,
               started_at INTEGER NOT NULL, ended_at INTEGER, created_at INTEGER NOT NULL,
               source TEXT NOT NULL DEFAULT 'start'
             );
             CREATE TABLE app_setting (
               key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL
             );",
        )
        .unwrap();
        conn.execute(
            "INSERT INTO item (content, status, focus_ms, source, created_at, updated_at)
             VALUES ('旧', 'inbox', 0, 'manual', 1, 1)",
            [],
        )
        .unwrap();
        conn.pragma_update(None, "user_version", SCHEMA_VERSION)
            .unwrap();
        let err = init_connection(&conn).unwrap_err();
        assert!(err.0.contains("非三态"));
        let status: String = conn
            .query_row("SELECT status FROM item WHERE content = '旧'", [], |r| r.get(0))
            .unwrap();
        assert_eq!(status, "inbox");
    }

    #[test]
    fn newer_user_version_is_rejected() {
        let conn = open_mem();
        conn.pragma_update(None, "user_version", SCHEMA_VERSION + 1)
            .unwrap();
        let err = init_connection(&conn).unwrap_err();
        assert!(err.0.contains("高于"));
    }
}
