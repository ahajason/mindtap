use tauri::{Manager, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub mod commands;
pub mod db;
pub mod error;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let toggle_shortcut =
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            if let Some(floating) = app.get_webview_window("floating") {
                                let visible = floating.is_visible().unwrap_or(false);
                                if visible {
                                    let _ = floating.hide();
                                } else {
                                    let _ = floating.show();
                                }
                            }
                        }
                    })
                    .build(),
            )?;
            app.global_shortcut().register(toggle_shortcut)?;

            if let Some(main) = app.get_webview_window("main") {
                let main_clone = main.clone();
                main.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = main_clone.hide();
                    }
                });
            }

            let db_state = db::init(app.handle()).map_err(|e| format!("db init failed: {e}"))?;
            app.manage(db_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::timer_session::timer_session_get_active,
            commands::timer_session::timer_session_create,
            commands::timer_session::timer_session_update_focus_ms,
            commands::timer_session::timer_session_pause,
            commands::timer_session::timer_session_resume,
            commands::timer_session::timer_session_complete,
            commands::timer_session::timer_session_list_recent_task_titles,
            commands::app::app_exit,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
