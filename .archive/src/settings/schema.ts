export type Theme = 'Light' | 'Dark' | 'Auto'
export type Dispersion = 'Subtle' | 'Vivid'
export type LogLevel = 'Error' | 'Warn' | 'Info' | 'Debug' | 'Trace'

export interface MetaSettings { firstLaunchAt: number; totalLaunches: number; schemaVersion: number }
export interface StartupSettings { autostart: boolean }
export interface HotkeySettings { modifiers: number; code: string }
export interface FloatingSettings {
  foldW: number; foldH: number; expandW: number; expandH: number;
  maxW: number; maxH: number; hoverOutDelayMs: number; animationMs: number; startVisible: boolean
}
export interface WindowGeometry { x: number; y: number; w: number; h: number; maximized: boolean }
export interface WindowStateSettings { main: WindowGeometry | null; floating: WindowGeometry | null }
export interface AppearanceSettings { theme: Theme; dispersion: Dispersion }
export interface LoggingSettings { level: LogLevel; ringSize: number; fileEnabled: boolean }
export interface Settings {
  version: number; meta: MetaSettings; startup: StartupSettings; hotkey: HotkeySettings;
  floating: FloatingSettings; windowState: WindowStateSettings; appearance: AppearanceSettings; logging: LoggingSettings
}
export interface LogEntry { ts: number; level: string; target: string; message: string }
export interface DbInfo { path: string; sizeBytes: number; recordCount: number }
export interface AppInfo { version: string; totalLaunches: number; firstLaunchAt: string }
export interface ActiveTaskSummary { id: number; content: string; focusStartedAt: number; durationMs: number }
export interface Diagnostics {
  hotkeyRegistered: boolean; activeTask: ActiveTaskSummary | null;
  floatingVisible: boolean; db: DbInfo; recentLogs: LogEntry[]; app: AppInfo
}
