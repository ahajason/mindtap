mod commands;
mod db;
mod diagnostics;
mod error;
mod floating;
mod log;
mod tray;
pub mod settings;

use tauri::Manager;
use tauri_plugin_global_shortcut::ShortcutState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--floating"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, sc, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    let st = app.state::<crate::settings::SettingsState>();
                    let cur = st.0.lock().unwrap().hotkey.to_shortcut().ok();
                    if Some(sc) == cur.as_ref() {
                        let _ = crate::commands::floating_cmd::floating_toggle(app.clone());
                    }
                })
                .build(),
        )
        .setup(move |app| {
            crate::log::init(app.handle())?;
            db::init(app).map_err(|e| e.to_string())?;
            let settings = crate::settings::load_or_default(app.handle());
            app.manage(crate::settings::SettingsState(std::sync::Mutex::new(settings)));
            floating::ensure_window(&app.handle()).map_err(|e| e.to_string())?;
            crate::settings::apply::apply_floating_geometry(app.handle())?;
            crate::settings::apply::apply_hotkey(app.handle())?;
            crate::settings::apply::apply_autostart(app.handle())?;
            crate::settings::apply::apply_logging(app.handle());

            // 两窗口绑定 on_menu_event：浮窗右键菜单 / V1.4 托盘菜单复用同一分发
            for label in ["main", "floating"] {
                if let Some(w) = app.get_webview_window(label) {
                    let app_handle = app.handle().clone();
                    w.on_menu_event(move |_window, event| {
                        tray::menu::handle_action(&app_handle, event.id().as_ref());
                    });
                }
            }

            // macOS:主窗 close 按钮走 Tauri 2 默认 destroy 行为(不要拦截改 hide)。
            // 原因:prevent_close + hide 会改变主窗 lifecycle,触发浮窗 NSPanel
            // IMKCFRunLoopWakeUpReliable 错误(NSPanel 在失去 first responder 的
            // 主窗 hide 时被 IME 找 first responder,失败)。点 dock Reopen 时
            // 用 WebviewWindowBuilder 重建 main(get_webview_window 拿到的 zombie
            // 句柄 show 不会 work)。

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::task_cmd::task_create,
            commands::task_cmd::task_start_timer,
            commands::task_cmd::task_pause,
            commands::task_cmd::task_resume,
            commands::task_cmd::task_complete,
            commands::task_cmd::task_undo,
            commands::task_cmd::task_switch,
            commands::task_cmd::task_archive,
            commands::task_cmd::task_aggregate_today,
            commands::idea_cmd::idea_create,
            commands::check_in_cmd::check_in_create,
            commands::record_cmd::record_list,
            commands::record_cmd::record_list_switchable,
            commands::record_cmd::record_get_active,
            commands::record_cmd::record_get_active_task,
            commands::floating_cmd::floating_show,
            commands::floating_cmd::floating_hide,
            commands::floating_cmd::floating_toggle,
            commands::floating_cmd::floating_is_visible,
            commands::floating_cmd::floating_set_height,
            commands::floating_cmd::get_platform,
            commands::floating_cmd::show_floating_context_menu,
            crate::settings::cmd::settings_get,
            crate::settings::cmd::settings_set,
            crate::settings::cmd::settings_reset,
            crate::diagnostics::cmd::diagnostics_get,
            crate::diagnostics::cmd::diagnostics_recent_logs,
            crate::diagnostics::cmd::frontend_log,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // macOS:点 dock 栏图标触发 applicationShouldHandleReopen →
            // Tauri 派发为 RunEvent::Reopen。主窗被 close (destroy) 后点 dock
            // 不会自动显示,需要 WebviewWindowBuilder 重建(get_webview_window
            // 拿到的 zombie 句柄 show 无效,因为底层 NSWindow 已 nil)。
            if let tauri::RunEvent::Reopen { .. } = event {
                // 门控用 main_handle_present,不用 has_visible_windows:floating window
                // 默认 visible: true → macOS 永远认为有 visible 窗口,has_visible_windows
                // 恒为 true,旧门控 `!has_visible_windows` 永远不进 rebuild 分支(诊断
                // 验证:reopen-debug 日志显示 has_visible_windows=true 但 main 句柄已
                // 被 close 销毁)。
                match app_handle.get_webview_window("main") {
                    None => {
                        // 主窗被 close/destroy 后点 dock 触发 Reopen → 用
                        // WebviewWindowBuilder 重建(get_webview_window 拿到的
                        // zombie 句柄 show 无效,因为底层 NSWindow 已 nil)。
                        let _ = tauri::WebviewWindowBuilder::new(
                            app_handle,
                            "main",
                            tauri::WebviewUrl::App("index.html".into()),
                        )
                        .title("轻念 · Mindtap")
                        .inner_size(800.0, 600.0)
                        .build();
                    }
                    Some(w) => {
                        // main 还在(可能 hide 了)→ show + focus;show 已 visible 是 no-op
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
            }
        });
}
