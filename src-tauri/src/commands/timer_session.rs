use tauri::State;

use crate::db::timer_session;
use crate::db::DbState;
use crate::error::AppError;

#[tauri::command]
pub fn timer_session_get_active(
    state: State<DbState>,
) -> Result<Option<timer_session::TimerSession>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    timer_session::get_active(&conn)
}

#[tauri::command]
pub fn timer_session_get_by_id(
    id: i64,
    state: State<DbState>,
) -> Result<Option<timer_session::TimerSession>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    timer_session::get_by_id(&conn, id)
}

#[tauri::command]
pub fn timer_session_create(
    task_title: String,
    state: State<DbState>,
) -> Result<timer_session::TimerSession, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    timer_session::create(&conn, task_title)
}

#[tauri::command]
pub fn timer_session_update_focus_ms(
    id: i64,
    focus_ms: i64,
    state: State<DbState>,
) -> Result<(), AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    timer_session::update_focus_ms(&conn, id, focus_ms)
}

#[tauri::command]
pub fn timer_session_pause(
    id: i64,
    state: State<DbState>,
) -> Result<timer_session::TimerSession, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    timer_session::pause(&conn, id)
}

#[tauri::command]
pub fn timer_session_resume(
    id: i64,
    state: State<DbState>,
) -> Result<timer_session::TimerSession, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    timer_session::resume(&conn, id)
}

#[tauri::command]
pub fn timer_session_complete(
    id: i64,
    state: State<DbState>,
) -> Result<timer_session::TimerSession, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    timer_session::complete(&conn, id)
}
