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

      // drag region 由 web 侧声明(data-tauri-drag-region),此处无 Rust 代码
      // 历史/失败模式见 docs/reports/v0.1.6-retrospective.md

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}