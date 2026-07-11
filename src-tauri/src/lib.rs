use tauri::Manager;

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

      let db_state = db::init(&app.handle())
        .map_err(|e| format!("db init failed: {e}"))?;
      app.manage(db_state);

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::timer_session::timer_session_get_active,
      commands::timer_session::timer_session_get_by_id,
      commands::timer_session::timer_session_create,
      commands::timer_session::timer_session_update_focus_ms,
      commands::timer_session::timer_session_pause,
      commands::timer_session::timer_session_resume,
      commands::timer_session::timer_session_complete,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}