pub mod platform;

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
    .resizable(false)
    .skip_taskbar(true)
    .focused(false)
    .shadow(false)
    .visible(true)
    .build()
    .map_err(|e| e.to_string())?;

    if let Some(win) = app.get_webview_window("floating") {
        platform::set_as_panel(&win)?;
    }
    Ok(())
}
