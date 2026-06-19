// src-tauri/src/db/mod.rs
pub mod schema;
pub mod task;
pub mod idea;
pub mod check_in;
pub mod record;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub struct DbState(pub Mutex<Connection>);

pub fn init(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_dir)?;
    let db_path = app_dir.join("mindtap.db");
    let conn = Connection::open(&db_path)?;
    schema::create_tables(&conn)?;
    app.manage(DbState(Mutex::new(conn)));
    Ok(())
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbInfo {
    pub path: String,
    pub size_bytes: u64,
    pub record_count: u64,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub version: String,
    pub total_launches: u64,
    pub first_launch_at: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveTaskSummary {
    pub id: i64,
    pub content: String,
    pub focus_started_at: i64,
    pub duration_ms: i64,
}

pub fn info(conn: &rusqlite::Connection) -> Result<DbInfo, String> {
    let path = match conn.path() {
        Some(p) => p.to_string(),
        None => return Err("database has no path".into()),
    };
    let size_bytes = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM record", [], |r| r.get(0))
        .unwrap_or(0);
    Ok(DbInfo { path, size_bytes, record_count: count as u64 })
}
