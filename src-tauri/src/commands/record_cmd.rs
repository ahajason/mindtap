// src-tauri/src/commands/record_cmd.rs
use crate::db::record::{self, Record};
use crate::db::task::{self, Task};
use crate::db::DbState;
use crate::error::AppResult;
use tauri::State;

#[tauri::command]
pub fn record_list(
    state: State<'_, DbState>,
    limit: Option<i64>,
    hide_archived: Option<bool>,
) -> AppResult<Vec<Record>> {
    let conn = state.0.lock().unwrap();
    record::list_records(&conn, limit.unwrap_or(50), hide_archived.unwrap_or(true))
}

#[tauri::command]
pub fn record_list_by_kind(
    state: State<'_, DbState>,
    kind: String,
    limit: Option<i64>,
) -> AppResult<Vec<Record>> {
    let conn = state.0.lock().unwrap();
    record::list_by_kind(&conn, &kind, limit.unwrap_or(50))
}

#[tauri::command]
pub fn record_list_switchable(state: State<'_, DbState>) -> AppResult<Vec<Record>> {
    let conn = state.0.lock().unwrap();
    record::list_switchable(&conn)
}

#[tauri::command]
pub fn record_get_active(state: State<'_, DbState>) -> AppResult<Option<Record>> {
    let conn = state.0.lock().unwrap();
    record::get_active_task(&conn)
}

#[tauri::command]
pub fn record_get_active_task(state: State<'_, DbState>) -> AppResult<Option<Task>> {
    let conn = state.0.lock().unwrap();
    let rec = record::get_active_task(&conn)?;
    match rec {
        Some(r) => Ok(Some(task::get_task(&conn, r.source_id)?)),
        None => Ok(None),
    }
}