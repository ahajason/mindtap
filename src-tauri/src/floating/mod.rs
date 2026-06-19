// 浮窗模块入口。V1.5+ macOS 不再 set_as_panel —— set_as_panel 把 NSWindow
// 改成 NSPanel,触发 macOS 26 InputMethodKit IMKCFRunLoopWakeUpReliable 错误
// (NSPanel 没 first responder 时 IME mach port 通信失败)。删 platform 模块后
// macOS 走 fallback:transparent + decorations(false) + alwaysOnTop + Web CSS
// backdrop-filter 兜底(见 src/floating/styles/floating.css 的 --glass-blur)。
use tauri::Manager;

pub fn ensure_window(app: &tauri::AppHandle) -> Result<(), String> {
    if app.get_webview_window("floating").is_some() {
        return Ok(());
    }
    let _w = tauri::WebviewWindowBuilder::new(
        app,
        "floating",
        tauri::WebviewUrl::App("floating.html".into()),
    )
    .title("Mindtap")
    .inner_size(320.0, 36.0)
    .min_inner_size(320.0, 36.0)
    .max_inner_size(480.0, 460.0)
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .resizable(true)
    .skip_taskbar(true)
    .focused(false)
    .shadow(false)
    .visible(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}