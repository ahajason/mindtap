// src-tauri/src/commands/floating_cmd.rs
//
// V0.2.0.12 PATCH:浮窗右键原生菜单 (对照 V1.0 archive `.archive/src-tauri/src/commands/floating_cmd.rs` 第 78-94 行的
// show_floating_context_menu 恢复 Rust 端 popup_menu 调用,删除前端 HTML ContextMenu 误实现)。
// V0.2.0.16 PATCH C:加 set_floating_size(w, h) command,强制物理 resize (user L3 实测反馈原 JS setSize IPC 链路
// 时序竞争让物理窗口不切 — rust 直接 Window::set_size 调 tao set_inner_size → Win32 SetWindowPos)。

use tauri::{LogicalSize, Manager, Size};
use tauri_plugin_autostart::ManagerExt;

/// 浮窗右键菜单:在浮动窗当前光标位置弹出 4 项主菜单。
/// 菜单用完即弃(V1.4 spec §5.3:每次 popup 前重读 autostart 真实状态 + 各窗口 visibility)。
/// 动作分发:window.on_menu_event → tray::menu::handle_action
#[tauri::command]
pub fn show_floating_context_menu(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
) -> Result<(), String> {
    use crate::tray::menu::{self, MenuState};

    // V0.2.0.13 PATCH B-2-1: 读 floating / main 两窗口的 visibility 传给 MenuState,
    // 让 build_main_menu 能动态生成 "显示任务栏/隐藏任务栏" / "显示主窗/隐藏主窗" label。
    let floating_visible = app
        .get_webview_window("floating")
        .map(|w| w.is_visible().unwrap_or(false))
        .unwrap_or(false);
    let main_visible = app
        .get_webview_window("main")
        .map(|w| w.is_visible().unwrap_or(false))
        .unwrap_or(false);
    let autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);

    let state = MenuState {
        autostart_enabled,
        floating_visible,
        main_visible,
    };

    let menu = menu::build_main_menu(&app, &state).map_err(|e| e.to_string())?;
    window.popup_menu(&menu).map_err(|e| e.to_string())?;
    Ok(())
}

/// V0.2.0.16 PATCH C: 强制 resize floating 物理窗口。
/// 走自定义 rust command 走 `tauri::Window::set_size(LogicalSize)` → `tao::window::Window::set_inner_size`
/// → Win32 `SetWindowPos`, 不经 Tauri JS API 中转, 物理窗口尺寸立即跟随.
#[tauri::command]
pub fn set_floating_size(window: tauri::WebviewWindow, w: f64, h: f64) -> Result<(), String> {
    window
        .set_size(Size::Logical(LogicalSize::new(w, h)))
        .map_err(|e| format!("[set_floating_size] {}x{}: {}", w, h, e))
}
