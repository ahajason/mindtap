mod commands;
mod glass;

use tauri::Manager;

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
      if let Some(window) = app.get_webview_window("main") {
        let _ = commands::glass::glass_attach(window);
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::glass::glass_attach,
      commands::glass::glass_register,
      commands::glass::glass_update_rect,
      commands::glass::glass_unregister,
      commands::glass::glass_clear,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
