#[cfg(target_os = "macos")]
mod platform;

#[cfg(target_os = "macos")]
pub use platform::{is_trusted, request_prompt};

#[cfg(not(target_os = "macos"))]
pub fn is_trusted() -> bool { true }
#[cfg(not(target_os = "macos"))]
pub fn request_prompt() {}

pub mod cmd;

#[cfg(all(test, not(target_os = "macos")))]
mod tests {
    #[test]
    fn stub_returns_true() {
        assert!(super::is_trusted());
    }
}
