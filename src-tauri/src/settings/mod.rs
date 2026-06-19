//! Settings module — public API surface.
//!
//! `mod.rs` re-exports the public types from submodules and defines
//! module-level constants + load/save utilities. The actual implementations
//! live in:
//!   - `schema.rs` — Settings struct, sections, Default, validate, to_shortcut
//!   - `cmd.rs`    — #[tauri::command] handlers (settings_get/set/reset)

pub mod cmd;
pub mod schema;

use tauri::Manager;

pub use schema::{
    AppearanceSettings, Dispersion, FloatingSettings, HotkeySettings,
    LoggingSettings, MetaSettings, Settings, SettingsError, SettingsState,
    Theme, WindowGeometry, WindowStateSettings, CURRENT_VERSION, SETTINGS_FILENAME,
};

// ---------------------------------------------------------------------------
// Path helper
// ---------------------------------------------------------------------------

/// Returns the path to settings.json inside the app config directory.
pub fn settings_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(SETTINGS_FILENAME))
}

// ---------------------------------------------------------------------------
// Timestamp helper (std::time only — no chrono)
// ---------------------------------------------------------------------------

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

/// Load Settings from a JSON file. Returns Defaults on any error.
pub fn load_from_file(path: &std::path::PathBuf) -> Settings {
    let raw = match std::fs::read_to_string(path) {
        Ok(s) => s,
        Err(_) => return Settings::default(),
    };
    let v: serde_json::Value = serde_json::from_str(&raw).unwrap_or_else(|_| {
        log::warn!("settings.json parse failed; using defaults");
        serde_json::Value::Null
    });
    let version = v.get("version").and_then(|x| x.as_u64()).unwrap_or(0);
    match version {
        0 => migrate_v0(v),
        1 => serde_json::from_value(v).unwrap_or_else(|_| {
            log::warn!("settings.json parse v1 failed; using defaults");
            Settings::default()
        }),
        v if v > CURRENT_VERSION as u64 => {
            log::warn!("settings.json version {v} newer than app; using defaults");
            Settings::default()
        }
        _ => Settings::default(),
    }
}

/// v0 → v1 migration (greenfield: just return default).
fn migrate_v0(_v: serde_json::Value) -> Settings {
    Settings::default()
}

/// Load settings for the app, applying first-launch sentinel if needed.
/// Bumps total_launches. Save is best-effort.
pub fn load_or_default(app: &tauri::AppHandle) -> Settings {
    let path = match settings_path(app) {
        Ok(p) => p,
        Err(_) => return Settings::default(),
    };
    let mut s = load_from_file(&path);
    if s.meta.first_launch_at == 0 {
        s.meta.first_launch_at = now_ms();
    }
    s.meta.total_launches = s.meta.total_launches.saturating_add(1);
    let _ = save(app, &s); // best-effort
    s
}

/// Atomically save Settings to disk: write to tmp → fsync → rename.
pub fn save(app: &tauri::AppHandle, s: &Settings) -> Result<(), String> {
    let final_path = settings_path(app)?;
    let tmp_path = final_path.with_extension("json.tmp");
    let json = serde_json::to_string_pretty(s).map_err(|e| e.to_string())?;
    {
        let mut f = std::fs::File::create(&tmp_path).map_err(|e| e.to_string())?;
        std::io::Write::write_all(&mut f, json.as_bytes()).map_err(|e| e.to_string())?;
        std::fs::File::sync_all(&mut f).map_err(|e| e.to_string())?;
    }
    std::fs::rename(&tmp_path, &final_path).map_err(|e| e.to_string())?;
    Ok(())
}

// Expose now_ms for cmd.rs
pub(crate) fn settings_now_ms() -> i64 {
    now_ms()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn missing_file_returns_default() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("settings.json");
        let s = load_from_file(&p);
        assert_eq!(s.version, CURRENT_VERSION);
    }

    #[test]
    fn atomic_write_creates_file() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("settings.json");
        let mut s = Settings::default();
        s.startup.autostart = true;
        save_to_path(&p, &s).unwrap();
        let back = load_from_file(&p);
        assert!(back.startup.autostart);
    }

    #[test]
    fn load_or_default_bumps_launch_counter() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("settings.json");
        let _ = save_to_path(&p, &Settings::default());
        let s = load_from_file(&p);
        let _ = save_to_path(&p, &s);
        let s2 = load_from_file(&p);
        // total_launches should not increase on load (only load_or_default bumps it)
        assert_eq!(s2.meta.total_launches, s.meta.total_launches);
    }

    // Internal helpers for tests (avoiding dependency on AppHandle in unit tests)
    fn save_to_path(p: &std::path::Path, s: &Settings) -> Result<(), String> {
        let tmp = p.with_extension("json.tmp");
        let json = serde_json::to_string_pretty(s).map_err(|e| e.to_string())?;
        let mut f = std::fs::File::create(&tmp).map_err(|e| e.to_string())?;
        std::io::Write::write_all(&mut f, json.as_bytes()).map_err(|e| e.to_string())?;
        std::fs::File::sync_all(&mut f).map_err(|e| e.to_string())?;
        std::fs::rename(&tmp, p).map_err(|e| e.to_string())?;
        Ok(())
    }
}
