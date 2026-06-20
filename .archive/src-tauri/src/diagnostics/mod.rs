use tauri::Manager;
// Re-export types from db so commands can import from diagnostics
pub use crate::db::{AppInfo, DbInfo, ActiveTaskSummary};

pub mod cmd;

use crate::db::DbState;
use crate::log::recent;
use crate::log::ring::LogEntry;
use crate::settings::SettingsState;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostics {
    pub hotkey_registered: bool,
    pub active_task: Option<ActiveTaskSummary>,
    pub floating_visible: bool,
    pub db: DbInfo,
    pub recent_logs: Vec<LogEntry>,
    pub app: AppInfo,
}

pub fn gather(
    app: &tauri::AppHandle,
    settings: &SettingsState,
    db: &DbState,
) -> Diagnostics {
    let hotkey_registered = settings.0.lock().unwrap().hotkey.to_shortcut().is_ok();
    let active_task =
        crate::db::task::active_task_summary(&db.0.lock().unwrap()).ok().flatten();
    let floating_visible = app
        .get_webview_window("floating")
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false);
    let db_info = crate::db::info(&db.0.lock().unwrap())
        .unwrap_or(DbInfo { path: String::new(), size_bytes: 0, record_count: 0 });
    let recent_logs = recent(200);
    let s = settings.0.lock().unwrap();
    let app_info = AppInfo {
        version: env!("CARGO_PKG_VERSION").into(),
        total_launches: s.meta.total_launches,
        first_launch_at: s.meta.first_launch_at.to_string(),
    };
    drop(s);
    Diagnostics {
        hotkey_registered,
        active_task,
        floating_visible,
        db: db_info,
        recent_logs,
        app: app_info,
    }
}
