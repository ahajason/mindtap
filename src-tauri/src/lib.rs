use tauri::Manager;
#[cfg(target_os = "macos")]
use objc2::{msg_send, runtime::{AnyObject, Bool}};

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

      // macOS: 让整个窗口背景可拖动(用户设计意图)
      //
      // NSWindow.setMovableByWindowBackground(true) 的行为:
      // - 任何 background 区域按下 + 拖动 → 启动 native window drag
      // - WKWebView 内的 button / input / link → WKWebView 拦截事件,正常 click
      // - 完美匹配"整个窗口可拖,内容不需要拖"
      //
      // 实现注意:
      // - 必须 main thread 同步调(不能 spawn thread,webview_windows() 内部 Rc 跨线程会 panic)
      // - 参数类型用 objc2::runtime::Bool::YES(bool 直接传会被 objc2 当成错误签名)
      // - sleep 200ms 等 main webview 完全 ready
      #[cfg(target_os = "macos")]
      {
        std::thread::sleep(std::time::Duration::from_millis(200));
        for window in app.webview_windows().values() {
          if let Ok(ns_window) = window.ns_window() {
            unsafe {
              let ptr = ns_window as *mut AnyObject;
              let _: () = msg_send![ptr, setMovableByWindowBackground: Bool::YES];
            }
          }
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}