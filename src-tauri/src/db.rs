use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::db::schema::CREATE_SQL;
use crate::error::AppError;

pub mod item;
pub mod schema;

pub struct DbState(pub Mutex<Connection>);

pub fn init(app: &AppHandle) -> Result<DbState, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    let db_path = dir.join("projects.db");
    let conn = Connection::open(&db_path)?;
    conn.execute_batch(CREATE_SQL)?;
    Ok(DbState(Mutex::new(conn)))
}
