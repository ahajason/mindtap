mod commands;
mod db;
mod error;
mod floating;
mod tray;
pub mod accessibility;

use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let toggle_shortcut = Shortcut::new(
        Some(if cfg!(target_os = "macos") {
            Modifiers::SUPER | Modifiers::SHIFT
        } else {
            Modifiers::CONTROL | Modifiers::SHIFT
        }),
        Code::Space,
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--floating"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if shortcut == &toggle_shortcut && event.state == ShortcutState::Pressed {
                        let _ = commands::floating_cmd::floating_toggle(app.clone());
                    }
                })
                .build(),
        )
        .setup(move |app| {
            db::init(app).map_err(|e| e.to_string())?;
            floating::ensure_window(&app.handle()).map_err(|e| e.to_string())?;
            app.global_shortcut().register(toggle_shortcut)?;

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
            commands::record_cmd::record_list_by_kind,
            commands::record_cmd::record_list_switchable,
            commands::record_cmd::record_get_active,
            commands::record_cmd::record_get_active_task,
            commands::floating_cmd::floating_show,
            commands::floating_cmd::floating_hide,
            commands::floating_cmd::floating_toggle,
            commands::floating_cmd::get_platform,
            commands::floating_cmd::show_floating_context_menu,
            crate::accessibility::cmd::accessibility_status,
            crate::accessibility::cmd::accessibility_request_prompt,
            crate::accessibility::cmd::open_ax_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}