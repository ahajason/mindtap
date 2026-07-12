// src-tauri/src/commands/floating_cmd.rs
//
// V0.2.0.12 PATCH 对象 B:浮窗右键原生菜单。
// 对照 V1.0 archive `.archive/src-tauri/src/commands/floating_cmd.rs` 第 78-94 行
// 的 show_floating_context_menu 恢复 Rust 端 popup_menu 调用,删除前端 HTML
// ContextMenu 误实现(V0.2.6 / V0.2.0.11 用 HTML div 模拟菜单,定位/事件转发有 bug)。
//
// 仅保留 show_floating_context_menu 一个 command — 其它 floating_* command 在当前
// 仓库尚未存在(对象 A/C/D 等其它 subagent scope 范围),不在本 patch 引入。

use tauri::Manager;
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
