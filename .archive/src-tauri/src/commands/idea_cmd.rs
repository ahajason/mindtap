// src-tauri/src/commands/idea_cmd.rs
use crate::db::idea;
use crate::db::DbState;
use crate::error::AppResult;
use tauri::{Emitter, State};

#[tauri::command]
pub fn idea_create(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    content: String,
) -> AppResult<i64> {
    let conn = state.0.lock().unwrap();
    let id = idea::create_idea(&conn, &content)?;
    let _ = app.emit("record-updated", ());
    Ok(id)
}