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

      // 窗口拖动:V0.1.4 起改用 web 侧 `data-tauri-drag-region`(Tauri 2 官方 API)
      // 原 NSWindow.setMovableByWindowBackground(Bool::YES) 副作用:
      //   - 拦截 WKWebView 内 mousedown → 文字选不中
      //   - 接管 resize handle → 窗口大小拖不动
      //   - 抑制 WKWebView cursor 更新 → button hover 不显手型
      // V0.1.1 retro + V0.1.4 决策: 切换到显式 drag region,见 docs/reports/v0.1.1-retrospective.md

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}