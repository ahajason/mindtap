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
