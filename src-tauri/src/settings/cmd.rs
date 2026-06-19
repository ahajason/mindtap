//! Settings Tauri commands — settings_get / settings_set / settings_reset.

use crate::settings::apply::{apply_autostart, apply_floating_geometry, apply_logging};
use crate::settings::{load_from_file, save, settings_path, Settings, SettingsState};
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn settings_get(state: State<'_, SettingsState>) -> Settings {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
pub fn settings_set(
    new: Settings,
    app: AppHandle,
    state: State<'_, SettingsState>,
) -> Result<Settings, String> {
    new.validate()
        .map_err(|e| format!("invalid settings: {e}"))?;
    save(&app, &new)?;
    *state.0.lock().unwrap() = new.clone();
    let _ = app.emit("settings-changed", &new);

    // Apply side effects immediately (read from SettingsState, idempotent).
    // Best-effort: settings are already saved and will take effect on next
    // launch; OS-level apply failures (autostart permission, env_logger
    // architectural limit on runtime log filter) are logged as warnings.
    if let Err(e) = apply_autostart(&app) {
        log::warn!("apply_autostart failed: {e}");
    }
    if let Err(e) = apply_floating_geometry(&app) {
        log::warn!("apply_floating_geometry failed: {e}");
    }
    apply_logging(&app);

    Ok(new)
}

#[tauri::command]
pub fn settings_reset(app: AppHandle, state: State<'_, SettingsState>) -> Result<Settings, String> {
    let mut s = if let Ok(p) = settings_path(&app) {
        load_from_file(&p)
    } else {
        Settings::default()
    };
    // Reset launch counters
    s.meta.total_launches = 0;
    s.meta.first_launch_at = if s.meta.first_launch_at == 0 {
        crate::settings::settings_now_ms()
    } else {
        s.meta.first_launch_at
    };
    save(&app, &s)?;
    *state.0.lock().unwrap() = s.clone();
    let _ = app.emit("settings-changed", &s);

    // Mirror settings_set: apply side effects after reset so OS / log
    // state matches the freshly-saved SettingsState.
    if let Err(e) = apply_autostart(&app) {
        log::warn!("apply_autostart failed: {e}");
    }
    if let Err(e) = apply_floating_geometry(&app) {
        log::warn!("apply_floating_geometry failed: {e}");
    }
    apply_logging(&app);

    Ok(s)
}
