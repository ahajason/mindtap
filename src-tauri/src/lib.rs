use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_notification::NotificationExt;

pub mod commands;
pub mod db;
pub mod error;
pub mod idle;
pub mod foreground;
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
                app.dialog()
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
                    app.dialog()
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
                    // V0.2.2: 统一后台线程,每 30s 执行多路扫描。
                    // 1. 启动时: 立即执行一次失真检测(settle_dormant)
                    // 2. 每 30s: 空闲自动暂停 + 失真检测 + 预留前台监听
                    let app_handle = app.handle().clone();
                    std::thread::spawn(move || {
                        // --- 辅助:持有锁执行->返回结果 ---
                        fn with_conn<F, R>(ah: &tauri::AppHandle, f: F) -> Result<R, ()>
                        where
                            F: FnOnce(&rusqlite::Connection) -> Result<R, crate::error::AppError>,
                        {
                            let state = ah.state::<crate::db::DbState>();
                            let result = match state.0.lock() {
                                Ok(conn) => f(&conn).map_err(|e| log::warn!("[bg] db error: {e}")),
                                Err(e) => {
                                    log::warn!("[bg] db lock poisoned: {e}");
                                    Err(())
                                }
                            };
                            result
                        }

                        // 启动时立即执行一次失真检测
                        let now = crate::db::time::now_ms();
                        let dormant = with_conn(&app_handle, |conn| {
                            crate::db::dormant::settle_dormant(conn, now)
                        }).ok();
                        if let Some(dormant) = dormant {
                            if !dormant.has_pending.is_empty() {
                                if let Ok(payloads) = with_conn(&app_handle, |conn| {
                                    crate::db::dormant::get_dormant_payloads(conn, &dormant.has_pending)
                                }) {
                                    for p in payloads {
                                        let _ = app_handle.emit("floating:dormant", &p);
                                    }
                                }
                            }
                        }

                        // 周期性扫描
                        loop {
                            std::thread::sleep(std::time::Duration::from_secs(30));
                            let now = crate::db::time::now_ms();

                            // 1. 空闲自动暂停扫描
                            let idle = crate::idle::last_input_ms();
                            let paused = with_conn(&app_handle, |conn| {
                                crate::idle::scan_and_auto_pause(conn, idle, now)
                            }).unwrap_or_default();
                            for r in &paused {
                                let payload = crate::db::dormant::DormantPayload {
                                    id: r.item.id,
                                    content: r.item.content.clone(),
                                    pending_ms: r.pending_ms.unwrap_or(0),
                                };
                                let _ = app_handle.emit("floating:dormant", &payload);
                                let _ = app_handle
                                    .notification()
                                    .builder()
                                    .title("Mindtap")
                                    .body(format!("{} 已自动暂停", r.item.content))
                                    .show();
                            }

                            // 2. 失真检测(冷却/跨天) — 每周期执行
                            let dormant = with_conn(&app_handle, |conn| {
                                crate::db::dormant::settle_dormant(conn, now)
                            }).ok();
                            if let Some(dormant) = dormant {
                                if !dormant.has_pending.is_empty() {
                                    if let Ok(payloads) = with_conn(&app_handle, |conn| {
                                        crate::db::dormant::get_dormant_payloads(conn, &dormant.has_pending)
                                    }) {
                                        for p in payloads {
                                            let _ = app_handle.emit("floating:dormant", &p);
                                        }
                                    }
                                }
                            }

                            // 3. 前台监听(V0.2.2 P5):检测活跃应用变化(仅 activity_monitor_enabled=true 时)
                            let monitor_enabled = with_conn(&app_handle, |conn| {
                                crate::db::setting::get(conn, "activity_monitor_enabled")
                            }).ok().flatten().unwrap_or_default();
                            if monitor_enabled == "true" {
                                if let Some(app_info) = crate::foreground::get_foreground_app() {
                                    let _ = app_handle.emit("floating:activity_signal", &app_info);
                                }
                            }
                        }
                    });
                }
                Err(e) => {
                    eprintln!("[setup] db init failed: {e}");
                    app.dialog()
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
            commands::item::item_rename,
            commands::item::item_triage_todo,
            commands::item::item_triage_archive,
            commands::item::item_soft_delete,
            commands::item::item_reactivate,
            commands::item::item_undo_delete,
            commands::item::item_check_dormant,
            commands::item::item_list_duplicate,
            // V0.2.1 自动计时空闲保护:前端轮询 idle 是否超自动暂停阈值。
            commands::item::item_get_idle,
            // V0.2.2 P4 管理:归档视图。
            commands::item::item_get_archived,
            // V0.2.1 3.3:某卡的激活明细(供并行统计/合并)。
            commands::item::item_list_intervals,
            // V0.2.1 设置 KV:浮窗展开高度等用户偏好。
            commands::setting::setting_get,
            commands::setting::setting_set,
            commands::app::app_exit,
            commands::app::app_show_main_window,
            // V0.2.0.12 PATCH 对象 B:浮窗右键弹原生菜单 command。前端 IPC 调用入口。
            commands::floating_cmd::show_floating_context_menu,
            // V0.2.0.16 PATCH C: 强制 resize floating 物理窗口 (user L3 实测 resize 完全无效
            // 反馈后, 走自定义 rust command 绕过 Tauri JS setSize API 中转竞争, 直接
            // tauri::Window::set_size 调 tao set_inner_size → Win32 SetWindowPos)。
            commands::floating_cmd::set_floating_size,
            // V0.2.2 复盘视图:每日复盘 + 关联空档。
            commands::review::review_get_daily,
            commands::review::review_associate_gap,
            // V0.2.2 P4 管理:回收站 + 永久删除。
            commands::item::item_list_deleted,
            commands::item::item_hard_delete,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
