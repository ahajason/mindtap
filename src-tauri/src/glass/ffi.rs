//! FFI 桥接到 src-tauri/swift/MindtapGlass/ 静态库
//!
//! macOS: 调 Swift @_cdecl 函数 (in-process 静态链接)
//! 其他: no-op,warn log

#[cfg(target_os = "macos")]
mod platform {
    use std::ffi::{CStr, CString};
    use std::os::raw::c_char;

    extern "C" {
        fn mindtap_glass_attach(ns_window_ptr: *mut std::ffi::c_void);
        fn mindtap_glass_register(json: *const c_char) -> *mut c_char;
        fn mindtap_glass_update_rect(json: *const c_char) -> *mut c_char;
        fn mindtap_glass_unregister(json: *const c_char) -> *mut c_char;
        fn mindtap_glass_clear() -> *mut c_char;
        fn mindtap_glass_response_free(ptr: *mut c_char);
    }

    pub fn call(cmd: &str, payload: &str) -> Result<(), String> {
        let input = CString::new(payload).map_err(|e| e.to_string())?;
        let response_ptr = unsafe {
            match cmd {
                "register" => mindtap_glass_register(input.as_ptr()),
                "update_rect" => mindtap_glass_update_rect(input.as_ptr()),
                "unregister" => mindtap_glass_unregister(input.as_ptr()),
                "clear" => mindtap_glass_clear(),
                _ => return Err(format!("unknown cmd: {}", cmd)),
            }
        };
        let response = unsafe { CStr::from_ptr(response_ptr as *const c_char) }
            .to_string_lossy()
            .into_owned();
        unsafe { mindtap_glass_response_free(response_ptr) };
        log::debug!("glass {} → {}", cmd, response);
        Ok(())
    }

    pub fn attach(ns_window_ptr: *mut std::ffi::c_void) {
        unsafe { mindtap_glass_attach(ns_window_ptr) };
    }
}

#[cfg(not(target_os = "macos"))]
mod platform {
    pub fn call(cmd: &str, _payload: &str) -> Result<(), String> {
        log::warn!("glass ffi called on non-macOS, ignored: cmd={}", cmd);
        Ok(())
    }

    pub fn attach(_ns_window_ptr: *mut std::ffi::c_void) {
        log::warn!("glass attach called on non-macOS, ignored");
    }
}

pub use platform::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unknown_cmd_handles_gracefully() {
        // 不验证具体结果(平台差异),只验证不 panic
        let _ = call("noop", "{}");
    }
}
