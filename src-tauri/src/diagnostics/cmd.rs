use crate::db::DbState;
use crate::diagnostics::{gather, Diagnostics};
use crate::log::ring::LogEntry;
use crate::log::recent;
use crate::settings::SettingsState;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, State};

#[tauri::command]
pub fn diagnostics_get(
    app: AppHandle,
    settings: State<'_, SettingsState>,
    db: State<'_, DbState>,
) -> Diagnostics {
    gather(&app, &settings, &db)
}

#[tauri::command]
pub fn diagnostics_recent_logs() -> Vec<LogEntry> {
    recent(200)
}

#[tauri::command]
pub fn frontend_log(level: String, message: String, args: Option<String>) {
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);
    let target = "frontend";
    let full = match args {
        Some(a) if !a.is_empty() => format!("{message} {a}"),
        _ => message,
    };
    let entry = LogEntry { ts, level: level.to_lowercase(), target: target.into(), message: full.clone() };
    log::info!("[FE] {}", full);
}
