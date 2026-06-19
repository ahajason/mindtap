//! Settings module — public API surface.
//!
//! `mod.rs` re-exports the public types from submodules and defines
//! module-level constants. The actual implementations live in:
//!   - `schema.rs` — Settings struct, sections, Default, validate, to_shortcut
//!   - `cmd.rs`    — #[tauri::command] handlers (settings_get/set/reset)

pub mod cmd;
pub mod schema;

pub use schema::{
    AppearanceSettings, Dispersion, FloatingSettings, HotkeySettings,
    LoggingSettings, MetaSettings, Settings, SettingsError, SettingsState,
    Theme, WindowGeometry, WindowStateSettings, CURRENT_VERSION, SETTINGS_FILENAME,
};
