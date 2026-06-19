// src-tauri/src/commands/record_cmd.rs
use crate::db::record::{self, Record};
use crate::db::task::{self, Task};
use crate::db::DbState;
use crate::error::AppResult;
use tauri::State;

/// 统一列表：可选 kind 筛选（None = 全部），可选 hideArchived 默认 true。
#[tauri::command]
pub fn record_list(
    state: State<'_, DbState>,
    kind: Option<String>,
    limit: Option<i64>,
    hide_archived: Option<bool>,
) -> AppResult<Vec<Record>> {
    let conn = state.0.lock().unwrap();
    let lim = limit.unwrap_or(50);
    let hide = hide_archived.unwrap_or(true);
    match kind.as_deref() {
        Some(k) => record::list_by_kind(&conn, k, lim),
        None => record::list_records(&conn, lim, hide),
    }
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