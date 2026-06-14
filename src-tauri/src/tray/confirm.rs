// src-tauri/src/tray/confirm.rs
//
// 退出确认弹窗（V1.4 spec §7 落地）。
// tauri-plugin-dialog 的原生 message 对话框（macOS sheet / Windows 任务对话框）。
// MessageDialogBuilder::show 接受 FnOnce(bool) 回调；用 oneshot 把回调转 future。

use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tokio::sync::oneshot;

pub async fn ask_quit_confirm(app: &AppHandle) -> bool {
    let (tx, rx) = oneshot::channel();
    app.dialog()
        .message("退出后，浮窗与主窗都会关闭。\n下次需要时可从 Dock / 任务栏图标重新打开。")
        .title("退出 Mindtap")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "退出".to_string(),
            "取消".to_string(),
        ))
        .show(move |confirmed| {
            let _ = tx.send(confirmed);
        });
    rx.await.unwrap_or(false) // 出错时保守视为"取消"
}
