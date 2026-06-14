mod commands;
mod db;
mod error;
mod floating;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}