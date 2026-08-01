use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_notification::NotificationExt;

pub mod commands;
pub mod db;
pub mod error;
pub mod idle;
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
        // V0.2.1 自动计时空闲保护:后台线程发系统通知。
        // capabilities 里的 notification:default 权限在 B4 加(前端请求权限),Rust 侧 show 不依赖 IPC。
        .plugin(tauri_plugin_notification::init())
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
            if let Err(err) = app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            if let Some(floating) = app.get_webview_window("floating") {
                                match floating.is_visible() {
                                    Ok(true) => {
                                        // 浮窗可见 → 隐藏(toggle)
                                        let _ = floating.hide();
                                    }
                                    Ok(false) => {
                                        // 浮窗不可见 → 显示 + 发捕获意图(前端聚焦输入框, PRD 1.1)
                                        let _ = floating.show();
                                        let _ = app.emit("floating:capture", ());
                                    }
                                    Err(err) => {
                                        eprintln!("[shortcut] floating is_visible failed: {err}");
                                        let _ = floating.show();
                                        let _ = app.emit("floating:capture", ());
                                    }
                                }
                            } else {
                                eprintln!("[shortcut] floating window not found");
                            }
                        }
                    })
                    .build(),
            ) {
                eprintln!("[setup] global-shortcut plugin init failed: {err}");
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

            // V0.2.0.13 PATCH B-2-2: 只在 floating 窗口上挂 on_menu_event。
            // V0.2.0.12 在 ["main", "floating"] 两个窗口都挂 listener 是 bug: Tauri 2
            // popup_menu 在 floating 弹出后, MenuEvent 会被 app-level 派发到所有 registered
            // listener, 结果 handle_action 走 2 遍 (用户实测 "显示主窗" 隐藏后又显示,
            // "退出 Mindtap" 出 2 个确认框 — 走 2 遍 toggle / 出 2 次 confirm 弹窗)。
            // 修法: 只在 floating 挂 (main 窗口不走 popup_menu 路径, 它的右键不在 scope)。
            // 对照 V1.0 archive `.archive/src-tauri/src/lib.rs` 第 47-55 行也是单 floating 挂。
            for label in ["floating"] {
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
                    // V0.2.1: 启动失真检测(跨天/冷却 active → 退回 todo + 挂待确认)。
                    // 对每个失真项 emit floating:dormant,由 bubble 窗口监听。
                    // ponytail: 启动一次即可(PRD 跨天停表);空闲自动暂停是周期轮询,见下方 V0.2.1 线程。
                    let app_handle = app.handle().clone();
                    std::thread::spawn(move || {
                        let now = crate::db::item::now_ms_for_cmd();
                        let result = {
                        let state = app_handle.state::<crate::db::DbState>();
                        let conn = state.0.lock().map_err(|e| crate::error::AppError(e.to_string()));
                        match conn {
                            Ok(conn) => crate::db::item::settle_dormant(&conn, now),
                            Err(e) => Err(e),
                        }
                        };
                        if let Ok(dormant) = result {
                            if !dormant.has_pending.is_empty() {
                                let state = app_handle.state::<crate::db::DbState>();
                                let conn = state.0.lock().map_err(|e| crate::error::AppError(e.to_string()));
                                if let Ok(conn) = conn {
                                    if let Ok(payloads) = crate::db::item::get_dormant_payloads(
                                        &conn,
                                        &dormant.has_pending,
                                    ) {
                                        for p in payloads {
                                            let _ = app_handle.emit("floating:dormant", &p);
                                        }
                                    }
                                }
                            }
                        }
                    });

                    // V0.2.1 自动计时空闲保护:每 30s 扫描 active,空闲超阈值 → 主动暂停 + 系统通知。
                    // 锁屏/休眠兜底:锁屏后无键鼠输入,idle 必然超阈值,下个周期自动暂停
                    // (不单独监听电源事件,见 tech §1 不在范围)。
                    let app_handle = app.handle().clone();
                    std::thread::spawn(move || loop {
                        std::thread::sleep(std::time::Duration::from_secs(30));
                        let idle = crate::idle::last_input_ms();
                        let now = crate::db::item::now_ms_for_cmd();
                        let paused = {
                            let state = app_handle.state::<crate::db::DbState>();
                            let result = match state.0.lock() {
                                Ok(conn) => {
                                    match crate::idle::scan_and_auto_pause(&conn, idle, now) {
                                        Ok(items) => items,
                                        Err(e) => {
                                            log::warn!("[idle] auto-pause scan failed: {e}");
                                            Vec::new()
                                        }
                                    }
                                }
                                Err(e) => {
                                    log::warn!("[idle] db lock poisoned: {e}");
                                    Vec::new()
                                }
                            };
                            result
                        };
                        for it in paused {
                            let _ = app_handle
                                .notification()
                                .builder()
                                .title("Mindtap")
                                .body(format!("{} 已自动暂停", it.content))
                                .show();
                        }
                    });
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
            commands::item::item_create,
            commands::item::item_get_active,
            commands::item::item_get_inbox,
            commands::item::item_get_todo,
            commands::item::item_start,
            commands::item::item_pause,
            commands::item::item_complete,
            commands::item::item_confirm_pending,
            commands::item::item_triage_todo,
            commands::item::item_triage_archive,
            commands::item::item_soft_delete,
            commands::item::item_reactivate,
            commands::item::item_undo_delete,
            commands::item::item_check_dormant,
            commands::item::item_list_duplicate,
            commands::item::item_get_history_titles,
            // V0.2.1 自动计时空闲保护:前端轮询 idle 是否超自动暂停阈值。
            commands::item::item_get_idle,
            // V0.2.1 3.3:某卡的激活明细(供并行统计/合并)。
            commands::item::item_list_intervals,
            commands::app::app_exit,
            commands::app::app_show_main_window,
            // V0.2.0.12 PATCH 对象 B:浮窗右键弹原生菜单 command。前端 IPC 调用入口。
            commands::floating_cmd::show_floating_context_menu,
            // V0.2.0.16 PATCH C: 强制 resize floating 物理窗口 (user L3 实测 resize 完全无效
            // 反馈后, 走自定义 rust command 绕过 Tauri JS setSize API 中转竞争, 直接
            // tauri::Window::set_size 调 tao set_inner_size → Win32 SetWindowPos)。
            commands::floating_cmd::set_floating_size,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
