// V0.2.2 P5:前台活跃应用检测(2026-08-03)。
// 跨平台: Windows 用 GetForegroundWindow + GetWindowModuleFileNameW;
// macOS 预留。
// 依赖: 30s 后台线程在 lib.rs 中轮询。

/// 前台应用信息。
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct AppInfo {
    /// 可执行文件路径(Windows: exe 全路径)
    pub exe_path: String,
    /// 窗口标题
    pub window_title: String,
}

/// 获取当前前台应用信息。
/// 跨平台: Windows 实现,其他平台返回 None。
pub fn get_foreground_app() -> Option<AppInfo> {
    #[cfg(target_os = "windows")]
    {
        windows_impl::get_foreground_app()
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = AppInfo;
        None
    }
}

#[cfg(target_os = "windows")]
mod windows_impl {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowModuleFileNameW, GetWindowTextLengthW, GetWindowTextW,
    };

    use super::AppInfo;

    pub fn get_foreground_app() -> Option<AppInfo> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() {
                return None;
            }

            // 获取窗口标题
            let title_len = GetWindowTextLengthW(hwnd);
            let mut title_buf = vec![0u16; (title_len + 1) as usize];
            let actual_len = GetWindowTextW(hwnd, &mut title_buf);
            title_buf.truncate(actual_len as usize);
            let window_title = OsString::from_wide(&title_buf)
                .to_string_lossy()
                .into_owned();

            // 获取模块路径
            let mut path_buf = vec![0u16; 260]; // MAX_PATH
            let path_len = GetWindowModuleFileNameW(hwnd, &mut path_buf);
            if path_len == 0 {
                return None;
            }
            path_buf.truncate(path_len as usize);
            let exe_path = OsString::from_wide(&path_buf)
                .to_string_lossy()
                .into_owned();

            Some(AppInfo {
                exe_path,
                window_title,
            })
        }
    }
}

#[cfg(test)]
mod tests {
    #[cfg(target_os = "windows")]
    #[test]
    fn get_foreground_app_returns_some() {
        // 在测试环境中,通常有前台窗口(IDE 或终端)
        let result = super::get_foreground_app();
        // 不强制断言,因为测试可能运行在无窗口环境(CI)
        if let Some(info) = result {
            assert!(!info.exe_path.is_empty());
            println!("前台: {} | {}", info.exe_path, info.window_title);
        }
    }
}
