use std::sync::Mutex;

use rusqlite::{params, Connection};
use tauri::{AppHandle, Manager};

use crate::db::schema::CREATE_SQL;
use crate::error::AppError;

pub mod schema;
pub mod timer_session;

pub struct DbState(pub Mutex<Connection>);

pub fn init(app: &AppHandle) -> Result<DbState, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Path(e.to_string()))?;
    std::fs::create_dir_all(&dir).map_err(|e| AppError::Io(e.to_string()))?;
    let db_path = dir.join("projects.db");

    let conn = Connection::open(&db_path).map_err(|e| AppError::Sqlite(e.to_string()))?;
    conn.execute_batch(CREATE_SQL)
        .map_err(|e| AppError::Sqlite(e.to_string()))?;

    let _ = params![];
    Ok(DbState(Mutex::new(conn)))
}