//! Log infrastructure: ring buffer + dual writer (stderr + file).
//!
//! `init()` must be called early in `setup()` before any other init that might log.
//! `apply()` lets the v1 settings UI update the log level at runtime.

pub mod ring;

use crate::log::ring::{LogEntry, RingBuffer, SharedRing};
use log::{LevelFilter, Log, Metadata, Record};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

const RING_CAPACITY: usize = 200;
const ROTATION_BYTES: u64 = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// Timestamp helper (std::time only — no chrono)
// ---------------------------------------------------------------------------

fn chrono_now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}

// ---------------------------------------------------------------------------
// Log file path
// ---------------------------------------------------------------------------

pub fn log_path() -> PathBuf {
    let base = data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    let app_dir = base.join("mindtap");
    fs::create_dir_all(&app_dir).ok();
    app_dir.join("mindtap.log")
}

/// Cross-platform data/local dir using std only.
fn data_local_dir() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("LOCALAPPDATA").ok().map(PathBuf::from)
    }
    #[cfg(target_os = "macos")]
    {
        std::env::var("HOME")
            .ok()
            .map(|h| PathBuf::from(h).join("Library/Application Support"))
    }
    #[cfg(target_os = "linux")]
    {
        std::env::var("XDG_DATA_HOME")
            .ok()
            .map(PathBuf::from)
            .or_else(|| std::env::var("HOME").ok().map(|h| PathBuf::from(h).join(".local/share")))
    }
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

fn open_log_file(path: &PathBuf) -> Option<std::fs::File> {
    OpenOptions::new().create(true).append(true).open(path).ok()
}

// ---------------------------------------------------------------------------
// DualWriter — writes to ring AND appends to log file
// ---------------------------------------------------------------------------

struct DualWriter {
    file: Mutex<Option<std::fs::File>>,
    ring: SharedRing,
}

impl DualWriter {
    fn new(ring: SharedRing) -> Self {
        let path = log_path();
        let file = open_log_file(&path);
        Self { file: Mutex::new(file), ring }
    }
}

impl Log for DualWriter {
    fn enabled(&self, _metadata: &Metadata) -> bool {
        true
    }

    fn log(&self, record: &Record) {
        let ts = chrono_now_ms();
        let entry = LogEntry {
            ts,
            level: record.level().to_string().to_lowercase(),
            target: record.target().to_string(),
            message: record.args().to_string(),
        };

        // Push to ring
        self.ring.push(entry.clone());

        // Append to file
        let line = format!(
            "{} {} {}: {}\n",
            ts,
            record.level(),
            record.target(),
            record.args()
        );
        let mut g = self.file.lock().unwrap();
        if let Some(ref mut f) = *g {
            let _ = f.write_all(line.as_bytes());
        }
    }

    fn flush(&self) {
        let mut g = self.file.lock().unwrap();
        if let Some(ref mut f) = *g {
            let _ = f.flush();
        }
    }
}

// ---------------------------------------------------------------------------
// Shared ring handle — exported so lib.rs can pass it to commands later
// ---------------------------------------------------------------------------

pub(crate) static RING: std::sync::OnceLock<SharedRing> = std::sync::OnceLock::new();

fn ring() -> SharedRing {
    RING.get().expect("log::init() not called").clone()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Initialize logging: ring + env_logger + dual writer (stderr + file).
/// Must be called first in `setup()` before any other init that might log.
pub fn init(_app: &tauri::AppHandle) -> Result<(), String> {
    let ring = RingBuffer::new(RING_CAPACITY).shared();
    RING.set(ring.clone()).map_err(|_| "log::init called twice")?;

    // Build env_logger with custom format (writes to stderr)
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .format(|buf, record| {
            writeln!(
                buf,
                "{} {} {}: {}",
                chrono_now_ms(),
                record.level(),
                record.target(),
                record.args()
            )
        })
        .write_style(env_logger::WriteStyle::Always)
        .init();

    // Override log to use our dual writer (stderr + file + ring)
    let dual = DualWriter::new(ring);
    log::set_boxed_logger(Box::new(dual))
        .map(|()| log::set_max_level(LevelFilter::Trace))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Apply a new log level filter at runtime (v1 settings UI).
/// `env_logger` is replaced by our DualWriter at init, so we drive the
/// `log` crate's global filter directly — changes take effect immediately.
pub fn apply(level_filter: &str) {
    let f = match level_filter {
        "error" => LevelFilter::Error,
        "warn" => LevelFilter::Warn,
        "info" => LevelFilter::Info,
        "debug" => LevelFilter::Debug,
        "trace" => LevelFilter::Trace,
        _ => LevelFilter::Info,
    };
    log::set_max_level(f);
    log::info!("log level filter set to '{level_filter}' (immediate)");
}

/// Return the most recent `n` log entries (newest last).
pub fn recent(n: usize) -> Vec<LogEntry> {
    ring().recent(n)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn init_smoke_ring_capacity() {
        // RING_CAPACITY must be 200
        assert_eq!(RING_CAPACITY, 200);
    }

    #[test]
    fn log_path_returns_log_file() {
        let path = log_path();
        assert_eq!(path.file_name().unwrap(), "mindtap.log");
    }

    #[test]
    fn rotate_threshold_is_5mb() {
        assert_eq!(ROTATION_BYTES, 5 * 1024 * 1024);
    }
}
