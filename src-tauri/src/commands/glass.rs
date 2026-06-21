//! Tauri commands for per-element Liquid Glass overlay.
//!
//! macOS: 路由到 Swift FFI。
//! 其他平台: no-op,log warn。

use crate::glass::ffi;

#[tauri::command]
pub fn glass_attach(window: tauri::WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let ns_window_ptr = window
            .ns_window()
            .map_err(|e| e.to_string())?
            as *mut std::ffi::c_void;
        ffi::attach(ns_window_ptr);
    }
    #[cfg(not(target_os = "macos"))]
    {
        log::warn!("glass_attach called on non-macOS, ignored");
    }
    Ok(())
}

#[tauri::command]
pub async fn glass_register(
    id: String,
    tier: String,
    x: f64, y: f64, w: f64, h: f64,
) -> Result<(), String> {
    let payload = serde_json::json!({
        "id": id, "tier": tier, "x": x, "y": y, "w": w, "h": h
    }).to_string();
    ffi::call("register", &payload)
}

#[tauri::command]
pub async fn glass_update_rect(
    id: String,
    x: f64, y: f64, w: f64, h: f64,
) -> Result<(), String> {
    let payload = serde_json::json!({
        "id": id, "x": x, "y": y, "w": w, "h": h
    }).to_string();
    ffi::call("update_rect", &payload)
}

#[tauri::command]
pub async fn glass_unregister(id: String) -> Result<(), String> {
    let payload = serde_json::json!({ "id": id }).to_string();
    ffi::call("unregister", &payload)
}

#[tauri::command]
pub async fn glass_clear() -> Result<(), String> {
    ffi::call("clear", "{}")
}

#[cfg(test)]
mod tests {
    #[test]
    fn payload_json_is_valid() {
        let payload = serde_json::json!({
            "id": "x", "tier": "l1", "x": 0.0, "y": 0.0, "w": 100.0, "h": 50.0
        }).to_string();
        assert!(payload.contains("\"tier\":\"l1\""));
        assert!(payload.contains("\"w\":100.0"));
    }
}
