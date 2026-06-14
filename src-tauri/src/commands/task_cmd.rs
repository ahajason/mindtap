// src-tauri/src/commands/task_cmd.rs
use crate::db::task;
use crate::db::DbState;
use crate::error::AppResult;
use tauri::{Emitter, State};

#[tauri::command]
pub fn task_create(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    content: String,
    due_at: Option<i64>,
) -> AppResult<task::Task> {
    let conn = state.0.lock().unwrap();
    let t = task::create_task(&conn, &content, due_at)?;
    let _ = app.emit("record-updated", ());
    Ok(t)
}

#[tauri::command]
pub fn task_start_timer(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    id: i64,
) -> AppResult<task::Task> {
    let conn = state.0.lock().unwrap();
    let t = task::start_timer(&conn, id)?;
    let _ = app.emit("focus-changed", &t);
    Ok(t)
}

#[tauri::command]
pub fn task_pause(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    id: i64,
) -> AppResult<task::Task> {
    let conn = state.0.lock().unwrap();
    let t = task::pause(&conn, id)?;
    let _ = app.emit("focus-changed", &t);
    Ok(t)
}

#[tauri::command]
pub fn task_resume(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    id: i64,
) -> AppResult<task::Task> {
    let conn = state.0.lock().unwrap();
    let t = task::resume(&conn, id)?;
    let _ = app.emit("focus-changed", &t);
    Ok(t)
}

#[tauri::command]
pub fn task_complete(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    id: i64,
) -> AppResult<task::Task> {
    let conn = state.0.lock().unwrap();
    let t = task::complete(&conn, id)?;
    let _ = app.emit("focus-changed", &t);
    Ok(t)
}

#[tauri::command]
pub fn task_undo(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    id: i64,
) -> AppResult<task::Task> {
    let conn = state.0.lock().unwrap();
    let t = task::undo(&conn, id)?;
    let _ = app.emit("focus-changed", &t);
    Ok(t)
}

#[tauri::command]
pub fn task_switch(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    id: i64,
) -> AppResult<task::Task> {
    let conn = state.0.lock().unwrap();
    let t = task::switch_focus(&conn, id)?;
    let _ = app.emit("focus-changed", &t);
    Ok(t)
}

#[tauri::command]
pub fn task_archive(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    id: i64,
) -> AppResult<task::Task> {
    let conn = state.0.lock().unwrap();
    let t = task::archive(&conn, id)?;
    let _ = app.emit("record-updated", ());
    Ok(t)
}