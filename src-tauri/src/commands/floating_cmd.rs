// src-tauri/src/commands/floating_cmd.rs
use tauri::{LogicalSize, Manager};
use tauri_plugin_autostart::ManagerExt;

// 浮窗尺寸上下限（必须与 tauri.conf.json 的 maxInnerSize / minInnerSize
// 以及 src/floating/App.tsx 的 MIN_H/MAX_H 同步）
const MIN_H: f64 = 36.0;
const MAX_H: f64 = 460.0;
// 展开态固定宽度（必须与 src/floating/App.tsx 的 EXPAND_W 同步）
const EXPAND_W: f64 = 360.0;

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
        // 不调 set_focus():NSPanel 已被 set_as_panel 改成 setCanBecomeKeyWindow:false,
        // set_focus 会触发 InputMethodKit wake up → hide→show 之间 IMKCFRunLoopWakeUpReliable
        // 错误 → 命令抛错 → 前端 toggle 看似「点不开」。
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
            // 不调 set_focus():理由同 floating_show (NSPanel IME mach port)
        }
    }
    Ok(())
}

/// 查询浮窗当前可见性（SettingsPage 顶部状态条用）。
/// 浮窗窗口不存在 / is_visible 失败时返回 false，绝不抛错到前端。
#[tauri::command]
pub fn floating_is_visible(app: tauri::AppHandle) -> bool {
    app.get_webview_window("floating")
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false)
}

/// 浮窗自适应内容高度：前端测量根容器 scrollHeight 调入，
/// Rust 端按 MIN/MAX_H clamp 后写窗口尺寸。宽度固定 EXPAND_W（展开态）。
/// 折叠态不应调此 command——窗口本身已 36px 高。
#[tauri::command]
pub fn floating_set_height(app: tauri::AppHandle, height: f64) -> Result<(), String> {
    let h = height.clamp(MIN_H, MAX_H);
    let Some(w) = app.get_webview_window("floating") else {
        return Ok(()); // 窗口不存在 = 静默成功，不报错
    };
    w.set_size(LogicalSize::new(EXPAND_W, h))
        .map_err(|e| e.to_string())?;
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
