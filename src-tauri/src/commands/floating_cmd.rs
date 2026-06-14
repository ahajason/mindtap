// src-tauri/src/commands/floating_cmd.rs
use tauri::Manager;
use tauri_plugin_autostart::ManagerExt;

#[tauri::command]
pub fn get_platform() -> String {
    if cfg!(target_os = "macos") {
        "macos".to_string()
    } else if cfg!(target_os = "windows") {
        "windows".to_string()
    } else {
        "linux".to_string()
    }
}

#[tauri::command]
pub fn floating_show(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("floating") {
        w.show().map_err(|e| e.to_string())?;
        w.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn floating_hide(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("floating") {
        w.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn floating_toggle(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("floating") {
        if w.is_visible().unwrap_or(false) {
            w.hide().map_err(|e| e.to_string())?;
        } else {
            w.show().map_err(|e| e.to_string())?;
            w.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// 浮窗右键菜单：在浮动窗当前光标位置弹出 4 项主菜单。
/// 菜单用完即弃（V1.4 spec §5.3：每次 popup 前重读 autostart 真实状态）。
/// 动作分发：window.on_menu_event → tray::menu::handle_action
#[tauri::command]
pub fn show_floating_context_menu(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    use crate::tray::menu::{self, MenuState};

    let autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);
    let state = MenuState { autostart_enabled };

    let menu = menu::build_main_menu(&app, &state).map_err(|e| e.to_string())?;
    window.popup_menu(&menu).map_err(|e| e.to_string())?;
    Ok(())
}
