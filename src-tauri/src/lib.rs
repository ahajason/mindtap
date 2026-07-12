use tauri::{Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub mod commands;
pub mod db;
pub mod error;
pub mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // V0.2.0.12 PATCH 对象 B:浮窗右键原生菜单需要 autostart_toggle。
        // 对照 V1.0 archive `.archive/src-tauri/src/lib.rs` 第 18-21 行;
        // 当前仓库之前漏装 tauri-plugin-autostart,补回。
        // Some(vec!["--floating"]) 让开机自启启动时直接打开浮窗(spec §3.2)。
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--floating"]),
        ))
        .setup(|app| {
            if cfg!(debug_assertions) {
                if let Err(e) = app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                ) {
                    eprintln!("[setup] log plugin init failed: {e}");
                }
            }

            let toggle_shortcut =
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
            if let Err(e) = app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            if let Some(floating) = app.get_webview_window("floating") {
                                match floating.is_visible() {
                                    Ok(true) => {
                                        let _ = floating.hide();
                                    }
                                    Ok(false) => {
                                        let _ = floating.show();
                                    }
                                    Err(err) => {
                                        eprintln!("[shortcut] floating is_visible failed: {err}");
                                        let _ = floating.show();
                                    }
                                }
                            } else {
                                eprintln!("[shortcut] floating window not found");
                            }
                        }
                    })
                    .build(),
            ) {
                eprintln!("[setup] global-shortcut plugin init failed");
                let _ = app
                    .dialog()
                    .message("全局快捷键插件初始化失败, 浮窗快捷键可能无效。")
                    .title("初始化错误")
                    .buttons(MessageDialogButtons::Ok)
                    .show(|_| {});
            }

            match app.global_shortcut().register(toggle_shortcut) {
                Ok(()) => {
                    eprintln!("[setup] global shortcut Ctrl+Shift+Space registered");
                }
                Err(err) => {
                    eprintln!(
                        "[setup] global shortcut Ctrl+Shift+Space register failed: {err} (likely hotkey conflict, see spec §3.8)"
                    );
                    let _ = app
                        .dialog()
                        .message(format!(
                            "Ctrl+Shift+Space 已被其他应用占用, 浮窗无法用快捷键显示/隐藏。\n\n\
                            建议: 在系统设置里关闭其他应用(如中文输入法)的全局快捷键, 或编辑 src-tauri/src/lib.rs:21 改其他 Modifier。\n\n\
                            错误详情: {err}"
                        ))
                        .title("快捷键冲突")
                        .buttons(MessageDialogButtons::Ok)
                        .show(|_| {});
                }
            }

            if let Some(main) = app.get_webview_window("main") {
                let main_clone = main.clone();
                main.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = main_clone.hide();
                    }
                });
            }

            // V0.2.0.12 PATCH 对象 B:两窗口绑定 on_menu_event — 浮窗右键菜单弹出后
            // 用户选菜单项 → window 派发 MenuEvent → 这里统一走 tray::menu::handle_action
            // 分发到 4 项具体动作(floating_toggle / main_toggle / autostart_toggle / quit)。
            // 对照 V1.0 archive `.archive/src-tauri/src/lib.rs` 第 47-55 行。
            for label in ["main", "floating"] {
                if let Some(w) = app.get_webview_window(label) {
                    let app_handle = app.handle().clone();
                    w.on_menu_event(move |_window, event| {
                        crate::tray::menu::handle_action(&app_handle, event.id().as_ref());
                    });
                }
            }

            let db_state = db::init(app.handle());
            match db_state {
                Ok(state) => {
                    app.manage(state);
                }
                Err(e) => {
                    eprintln!("[setup] db init failed: {e}");
                    let _ = app
                        .dialog()
                        .message(format!(
                            "数据库初始化失败: {e}\n\n\
                            应用无法启动。请删除 %APPDATA%\\com.mindtap.desktop\\projects.db 后重试。"
                        ))
                        .title("数据库错误")
                        .buttons(MessageDialogButtons::Ok)
                        .show(|_| {});
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::timer_session::timer_session_get_active,
            commands::timer_session::timer_session_create,
            commands::timer_session::timer_session_update_focus_ms,
            commands::timer_session::timer_session_pause,
            commands::timer_session::timer_session_resume,
            commands::timer_session::timer_session_complete,
            commands::timer_session::timer_session_list_recent_task_titles,
            commands::app::app_exit,
            commands::app::app_show_main_window,
            // V0.2.0.12 PATCH 对象 B:浮窗右键弹原生菜单 command。前端 IPC 调用入口。
            commands::floating_cmd::show_floating_context_menu,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
