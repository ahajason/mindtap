mod commands;
mod db;
mod diagnostics;
mod error;
mod floating;
mod log;
mod tray;
pub mod accessibility;
pub mod settings;

use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--floating"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, sc, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    let st = app.state::<crate::settings::SettingsState>();
                    let cur = st.0.lock().unwrap().hotkey.to_shortcut().ok();
                    if Some(sc) == cur.as_ref() {
                        let _ = crate::commands::floating_cmd::floating_toggle(app.clone());
                    }
                })
                .build(),
        )
        .setup(move |app| {
            crate::log::init(app.handle())?;
            db::init(app).map_err(|e| e.to_string())?;
            let settings = crate::settings::load_or_default(app.handle());
            app.manage(crate::settings::SettingsState(std::sync::Mutex::new(settings)));
            floating::ensure_window(&app.handle()).map_err(|e| e.to_string())?;
            crate::settings::apply::apply_floating_geometry(app.handle())?;
            crate::settings::apply::apply_hotkey(app.handle())?;
            crate::settings::apply::apply_autostart(app.handle())?;
            crate::settings::apply::apply_logging(app.handle());

            // 两窗口绑定 on_menu_event：浮窗右键菜单 / V1.4 托盘菜单复用同一分发
            for label in ["main", "floating"] {
                if let Some(w) = app.get_webview_window(label) {
                    let app_handle = app.handle().clone();
                    w.on_menu_event(move |_window, event| {
                        tray::menu::handle_action(&app_handle, event.id().as_ref());
                    });
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::task_cmd::task_create,
            commands::task_cmd::task_start_timer,
            commands::task_cmd::task_pause,
            commands::task_cmd::task_resume,
            commands::task_cmd::task_complete,
            commands::task_cmd::task_undo,
            commands::task_cmd::task_switch,
            commands::task_cmd::task_archive,
            commands::idea_cmd::idea_create,
            commands::check_in_cmd::check_in_create,
            commands::record_cmd::record_list,
            commands::record_cmd::record_list_switchable,
            commands::record_cmd::record_get_active,
            commands::record_cmd::record_get_active_task,
            commands::floating_cmd::floating_show,
            commands::floating_cmd::floating_hide,
            commands::floating_cmd::floating_toggle,
            commands::floating_cmd::floating_is_visible,
            commands::floating_cmd::get_platform,
            commands::floating_cmd::show_floating_context_menu,
            crate::accessibility::cmd::accessibility_status,
            crate::accessibility::cmd::accessibility_request_prompt,
            crate::accessibility::cmd::open_ax_settings,
            crate::settings::cmd::settings_get,
            crate::settings::cmd::settings_set,
            crate::settings::cmd::settings_reset,
            crate::diagnostics::cmd::diagnostics_get,
            crate::diagnostics::cmd::diagnostics_recent_logs,
            crate::diagnostics::cmd::frontend_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
