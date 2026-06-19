use crate::accessibility;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn accessibility_status() -> bool {
    accessibility::is_trusted()
}

#[tauri::command]
pub fn accessibility_request_prompt() {
    accessibility::request_prompt()
}

#[tauri::command]
pub fn open_ax_settings(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        app.opener()
            .open_url(
                "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
                None::<&str>,
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("not supported on this platform".into())
    }
}
