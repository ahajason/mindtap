use tauri::AppHandle;

use crate::error::AppError;

#[tauri::command]
pub fn app_exit(app: AppHandle) -> Result<(), AppError> {
    app.exit(0);
    Ok(())
}
