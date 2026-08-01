// src-tauri/src/tray/menu.rs
//
// 主菜单构建 + 动作分发(V1.4 spec §5.1 / §5.2 落地)。
// 当前被 commands::floating_cmd::show_floating_context_menu 调用;
// V1.4 托盘图标注册时复用同一 build_main_menu。

use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_autostart::ManagerExt;

pub struct MenuState {
    pub autostart_enabled: bool,
    // V0.2.0.13 PATCH B-2-1: 加 floating_visible / main_visible 字段,
    // 让 floating_toggle / main_toggle menu item label 根据当前 visibility 动态化:
    // 显示任务栏 / 隐藏任务栏 (浮窗) / 显示主窗 / 隐藏主窗。
    // 不再用合并文案 "显示/隐藏 浮窗" — user 实测跟当前状态对不上,触发时会困惑。
    pub floating_visible: bool,
    pub main_visible: bool,
}

const ID_FLOATING_TOGGLE: &str = "floating_toggle";
const ID_MAIN_TOGGLE: &str = "main_toggle";
const ID_AUTOSTART_TOGGLE: &str = "autostart_toggle";
const ID_QUIT: &str = "quit";

/// 构建 4 项主菜单(与 V1.4 spec §5.1 一致)。
/// 每次调用都会读 autostart 真实状态 + 各窗口 visibility,菜单用完即弃,
/// 不维护 CheckMenuItem / MenuItem 引用。
pub fn build_main_menu(app: &AppHandle, state: &MenuState) -> tauri::Result<Menu<Wry>> {
    // V0.2.0.13 PATCH B-2-1: 根据 floating / main 当前可见性动态选 label,
    // 让用户看到当前操作意图(单一动作文案,不是合并)。
    let floating_label = if state.floating_visible {
        "隐藏任务栏"
    } else {
        "显示任务栏"
    };
    let main_label = if state.main_visible {
        "隐藏主窗"
    } else {
        "显示主窗"
    };
    let floating = MenuItem::with_id(app, ID_FLOATING_TOGGLE, floating_label, true, None::<&str>)?;
    let main = MenuItem::with_id(app, ID_MAIN_TOGGLE, main_label, true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let autostart = CheckMenuItem::with_id(
        app,
        ID_AUTOSTART_TOGGLE,
        "开机自启",
        true,
        state.autostart_enabled,
        None::<&str>,
    )?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, ID_QUIT, "退出 Mindtap", true, None::<&str>)?;

    Menu::with_items(app, &[&floating, &main, &sep1, &autostart, &sep2, &quit])
}

/// 由 window.on_menu_event 回调;按 menu id 路由到具体动作。
pub fn handle_action(app: &AppHandle, id: &str) {
    match id {
        ID_FLOATING_TOGGLE => {
            if let Some(w) = app.get_webview_window("floating") {
                let visible = w.is_visible().unwrap_or(false);
                let _ = if visible { w.hide() } else { w.show() };
            }
        }
        ID_MAIN_TOGGLE => {
            if let Some(w) = app.get_webview_window("main") {
                let visible = w.is_visible().unwrap_or(false);
                let _ = if visible { w.hide() } else { w.show() };
            }
        }
        ID_AUTOSTART_TOGGLE => {
            let mgr = app.autolaunch();
            let enabled = mgr.is_enabled().unwrap_or(false);
            let result = if enabled { mgr.disable() } else { mgr.enable() };
            if let Err(e) = result {
                eprintln!("autostart toggle failed: {e}");
            }
        }
        ID_QUIT => {
            // 异步弹确认;用户在另一线程看到对话框,避免阻塞菜单事件循环
            let app_clone = app.clone();
            tauri::async_runtime::spawn(async move {
                let confirmed = crate::tray::confirm::ask_quit_confirm(&app_clone).await;
                if confirmed {
                    app_clone.exit(0);
                }
            });
        }
        _ => {}
    }
}
