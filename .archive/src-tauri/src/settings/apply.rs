//! Settings appliers — idempotent functions that apply settings to the running app.
//!
//! Called on startup (setup) and on every `settings_set` user change.
//! Each function reads current values from SettingsState so it is safe to
//! call at any time after SettingsState is managed.

use tauri::{AppHandle, Manager, PhysicalSize};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

/// Apply the hotkey setting: unregister old shortcut, register new one.
/// Idempotent: unregister + re-register with same shortcut is harmless.
pub fn apply_hotkey(app: &AppHandle) -> Result<(), String> {
    let gs = app.global_shortcut();
    let st = app.state::<crate::settings::SettingsState>();
    let hotkey = st.0.lock().unwrap().hotkey.clone();

    // Unregister any previously-registered shortcut (ignore errors if nothing was registered)
    if let Ok(cur) = hotkey.to_shortcut() {
        let _ = gs.unregister(cur);
    }

    // Register the new shortcut with a placeholder handler; the real handler
    // is in lib.rs's `with_handler` which reads from SettingsState at runtime.
    let new = hotkey.to_shortcut().map_err(|e| e.to_string())?;
    gs.on_shortcut(new, |_app, _sc, _event| {
        // placeholder — real logic is in lib.rs's with_handler
    })
    .map_err(|e| e.to_string())?;

    log::info!("hotkey applied: modifiers={}, code={}", hotkey.modifiers, hotkey.code);
    Ok(())
}

/// Apply autostart enable/disable. Idempotent: only calls enable/disable
/// when the actual state differs from the requested state.
pub fn apply_autostart(app: &AppHandle) -> Result<(), String> {
    let st = app.state::<crate::settings::SettingsState>();
    let enable = st.0.lock().unwrap().startup.autostart;
    let al = app.autolaunch();
    let on = al.is_enabled().unwrap_or(false);
    if enable && !on {
        al.enable().map_err(|e| e.to_string())?;
        log::info!("autostart enabled");
    } else if !enable && on {
        al.disable().map_err(|e| e.to_string())?;
        log::info!("autostart disabled");
    }
    Ok(())
}

/// Apply floating window geometry (min/max size). The window must already exist.
pub fn apply_floating_geometry(app: &AppHandle) -> Result<(), String> {
    let st = app.state::<crate::settings::SettingsState>();
    let f = st.0.lock().unwrap().floating.clone();
    let w = app.get_webview_window("floating").ok_or("floating window missing")?;
    w.set_min_size(Some(PhysicalSize::new(f.fold_w as u32, f.fold_h as u32)))
        .map_err(|e| e.to_string())?;
    w.set_max_size(Some(PhysicalSize::new(f.max_w as u32, f.max_h as u32)))
        .map_err(|e| e.to_string())?;
    log::info!(
        "floating geometry applied: min={}x{}, max={}x{}",
        f.fold_w, f.fold_h, f.max_w, f.max_h
    );
    Ok(())
}

/// Apply logging settings: update the log level filter at runtime.
pub fn apply_logging(app: &AppHandle) {
    let st = app.state::<crate::settings::SettingsState>();
    let l = st.0.lock().unwrap().logging.clone();
    let level = match l.level {
        crate::settings::schema::LogLevel::Error => "error",
        crate::settings::schema::LogLevel::Warn => "warn",
        crate::settings::schema::LogLevel::Info => "info",
        crate::settings::schema::LogLevel::Debug => "debug",
        crate::settings::schema::LogLevel::Trace => "trace",
    };
    crate::log::apply(level);
}
