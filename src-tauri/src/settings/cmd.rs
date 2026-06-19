//! Settings Tauri commands — settings_get / settings_set / settings_reset.
//!
//! Full implementations are added in Task 3.3. This stub exists so the
//! settings module compiles after Task 3.1.

use crate::settings::SettingsState;
use tauri::State;

#[tauri::command]
pub fn settings_get(_state: State<'_, SettingsState>) -> crate::settings::Settings {
    crate::settings::Settings::default()
}
