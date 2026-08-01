// 薄 adapter:app_setting KV 读写。设置值统一文本,前端序列化/解析。
use tauri::State;

use crate::db::setting;
use crate::db::DbState;
use crate::error::AppError;

#[tauri::command]
pub fn setting_get(key: String, state: State<DbState>) -> Result<Option<String>, AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    setting::get(&conn, &key)
}

#[tauri::command]
pub fn setting_set(key: String, value: String, state: State<DbState>) -> Result<(), AppError> {
    let conn = state.0.lock().map_err(|e| AppError(e.to_string()))?;
    setting::set(&conn, &key, &value)
}
