use tauri::{AppHandle, Manager};

use crate::error::AppError;

#[tauri::command]
pub fn app_exit(app: AppHandle) -> Result<(), AppError> {
    app.exit(0);
    Ok(())
}

#[tauri::command]
pub fn app_show_main_window(app: AppHandle) -> Result<(), AppError> {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.unminimize();
        let _ = main.set_focus();
        Ok(())
    } else {
        Err(AppError("main window not found".into()))
    }
}