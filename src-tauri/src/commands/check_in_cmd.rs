// src-tauri/src/commands/check_in_cmd.rs
use crate::db::check_in;
use crate::db::DbState;
use crate::error::AppResult;
use tauri::{Emitter, State};

#[tauri::command]
pub fn check_in_create(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    habit: String,
    note: Option<String>,
) -> AppResult<i64> {
    let conn = state.0.lock().unwrap();
    let id = check_in::create_check_in(&conn, &habit, note.as_deref())?;
    let _ = app.emit("record-updated", ());
    Ok(id)
}