//! Settings schema — all configurable app state.
//!
//! Section struct definitions + Settings top-level + Default impl + validate.

/// Current settings schema version.
pub const CURRENT_VERSION: u32 = 1;

/// Settings file name within the app config directory.
pub const SETTINGS_FILENAME: &str = "settings.json";

use std::str::FromStr;
use serde::{Deserialize, Serialize};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

/// Tauri State container for Settings.
/// Lives in schema.rs so cmd.rs (PR3.3) can reference it without circular imports.
pub struct SettingsState(pub std::sync::Mutex<crate::settings::Settings>);

// ---------------------------------------------------------------------------
// Section enums
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Theme { Light, Dark, Auto }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Dispersion { Subtle, Vivid }

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum LogLevel { Error, Warn, Info, Debug, Trace }

// ---------------------------------------------------------------------------
// Section structs
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetaSettings {
    pub first_launch_at: i64, // unix ms; 0 = never launched
    pub total_launches: u64,
    pub schema_version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartupSettings {
    pub autostart: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeySettings {
    /// bitmask of tauri_plugin_global_shortcut::Modifiers
    pub modifiers: u32,
    /// Code variant name string, e.g. "Space"
    pub code: String,
}

impl HotkeySettings {
    /// Convert to a tauri Shortcut.
    pub fn to_shortcut(&self) -> Result<Shortcut, tauri_plugin_global_shortcut::Error> {
        let mods = Modifiers::from_bits(self.modifiers)
            .ok_or_else(|| tauri_plugin_global_shortcut::Error::GlobalHotkey(
                format!("invalid modifiers bitmask: {}", self.modifiers)
            ))?;
        let code = Code::from_str(&self.code)
            .map_err(|e| tauri_plugin_global_shortcut::Error::GlobalHotkey(e.to_string()))?;
        Ok(Shortcut::new(Some(mods), code))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FloatingSettings {
    pub fold_w: u32,
    pub fold_h: u32,
    pub expand_w: u32,
    pub expand_h: u32,
    pub max_w: u32,
    pub max_h: u32,
    pub hover_out_delay_ms: u32,
    pub animation_ms: u32,
    pub start_visible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowGeometry {
    pub x: i32,
    pub y: i32,
    pub w: u32,
    pub h: u32,
    pub maximized: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowStateSettings {
    pub main: Option<WindowGeometry>,
    pub floating: Option<WindowGeometry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub theme: Theme,
    pub dispersion: Dispersion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoggingSettings {
    pub level: LogLevel,
    pub ring_size: u32,
    pub file_enabled: bool,
}

// ---------------------------------------------------------------------------
// Top-level Settings
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub version: u32,
    pub meta: MetaSettings,
    pub startup: StartupSettings,
    pub hotkey: HotkeySettings,
    pub floating: FloatingSettings,
    pub window_state: WindowStateSettings,
    pub appearance: AppearanceSettings,
    pub logging: LoggingSettings,
}

// ---------------------------------------------------------------------------
// SettingsError
// ---------------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum SettingsError {
    #[error("floating geometry constraint violated: fold ({fold_w}x{fold_h}) must be <= expand ({expand_w}x{expand_h}) <= max ({max_w}x{max_h}), and all dimensions >= 32")]
    FloatingConstraint {
        fold_w: u32, fold_h: u32,
        expand_w: u32, expand_h: u32,
        max_w: u32, max_h: u32,
    },
    #[error("hover-out delay {0}ms exceeds maximum 2000ms")]
    HoverOutDelayTooLarge(u32),
    #[error("animation {0}ms outside allowed range 50~1000ms")]
    AnimationOutOfRange(u32),
    #[error("ring size {0} outside allowed range 50~2000")]
    RingSizeOutOfRange(u32),
    #[error("hotkey code '{0}' is not a valid key code")]
    InvalidHotkeyCode(String),
}

impl Settings {
    /// Returns the platform-default modifiers bitmask.
    fn default_modifiers() -> u32 {
        if cfg!(target_os = "macos") {
            Modifiers::SUPER.bits() | Modifiers::SHIFT.bits()
        } else {
            Modifiers::CONTROL.bits() | Modifiers::SHIFT.bits()
        }
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: CURRENT_VERSION,
            meta: MetaSettings {
                first_launch_at: 0,
                total_launches: 0,
                schema_version: CURRENT_VERSION,
            },
            startup: StartupSettings { autostart: false },
            hotkey: HotkeySettings {
                modifiers: Self::default_modifiers(),
                code: "Space".into(),
            },
            floating: FloatingSettings {
                fold_w: 320,
                fold_h: 36,
                expand_w: 360,
                expand_h: 280,
                max_w: 480,
                max_h: 460,
                hover_out_delay_ms: 200,
                animation_ms: 150,
                start_visible: true,
            },
            window_state: WindowStateSettings {
                main: None,
                floating: None,
            },
            appearance: AppearanceSettings {
                theme: Theme::Auto,
                dispersion: Dispersion::Subtle,
            },
            logging: LoggingSettings {
                level: LogLevel::Info,
                ring_size: 200,
                file_enabled: true,
            },
        }
    }
}

impl Settings {
    /// Validate all constraints. Returns Ok(()) if valid.
    pub fn validate(&self) -> Result<(), SettingsError> {
        // Floating: fold <= expand <= max; all W/H >= 32
        if self.floating.fold_w > self.floating.expand_w
            || self.floating.fold_h > self.floating.expand_h
            || self.floating.expand_w > self.floating.max_w
            || self.floating.expand_h > self.floating.max_h
            || self.floating.fold_w < 32
            || self.floating.fold_h < 32
            || self.floating.expand_w < 32
            || self.floating.expand_h < 32
            || self.floating.max_w < 32
            || self.floating.max_h < 32
        {
            return Err(SettingsError::FloatingConstraint {
                fold_w: self.floating.fold_w,
                fold_h: self.floating.fold_h,
                expand_w: self.floating.expand_w,
                expand_h: self.floating.expand_h,
                max_w: self.floating.max_w,
                max_h: self.floating.max_h,
            });
        }

        if self.floating.hover_out_delay_ms > 2000 {
            return Err(SettingsError::HoverOutDelayTooLarge(self.floating.hover_out_delay_ms));
        }

        if !(50..=1000).contains(&self.floating.animation_ms) {
            return Err(SettingsError::AnimationOutOfRange(self.floating.animation_ms));
        }

        if !(50..=2000).contains(&self.logging.ring_size) {
            return Err(SettingsError::RingSizeOutOfRange(self.logging.ring_size));
        }

        // hotkey.code must be a valid Code variant string
        if Code::from_str(&self.hotkey.code).is_err() {
            return Err(SettingsError::InvalidHotkeyCode(self.hotkey.code.clone()));
        }

        Ok(())
    }

    /// Convert to a tauri Shortcut.
    pub fn to_shortcut(&self) -> Result<Shortcut, tauri_plugin_global_shortcut::Error> {
        let mods = Modifiers::from_bits(self.hotkey.modifiers)
            .ok_or_else(|| tauri_plugin_global_shortcut::Error::GlobalHotkey(
                format!("invalid modifiers bitmask: {}", self.hotkey.modifiers)
            ))?;
        let code = Code::from_str(&self.hotkey.code)
            .map_err(|e| tauri_plugin_global_shortcut::Error::GlobalHotkey(e.to_string()))?;
        Ok(Shortcut::new(Some(mods), code))
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn valid() -> Settings { Settings::default() }

    #[test]
    fn default_validates() { assert!(valid().validate().is_ok()); }

    #[test]
    fn reject_floating_fold_gt_expand() {
        let mut s = valid();
        s.floating.fold_w = s.floating.expand_w + 1;
        assert!(s.validate().is_err());
    }

    #[test]
    fn reject_floating_geometry_too_small() {
        let mut s = valid();
        s.floating.fold_w = 8;
        assert!(s.validate().is_err());
    }

    #[test]
    fn reject_animation_out_of_range() {
        let mut s = valid();
        s.floating.animation_ms = 10;
        assert!(s.validate().is_err());
    }

    #[test]
    fn reject_ring_size_out_of_range() {
        let mut s = valid();
        s.logging.ring_size = 10;
        assert!(s.validate().is_err());
    }

    #[test]
    fn reject_invalid_hotkey_code() {
        let mut s = valid();
        s.hotkey.code = "NotARealKey".into();
        assert!(s.validate().is_err());
    }

    #[test]
    fn to_shortcut_default_succeeds() {
        let s = valid();
        assert!(s.to_shortcut().is_ok());
    }
}
