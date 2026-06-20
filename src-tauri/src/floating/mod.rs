// 浮窗模块入口。V1.5+ macOS 不再 set_as_panel —— set_as_panel 把 NSWindow
// 改成 NSPanel,触发 macOS 26 InputMethodKit IMKCFRunLoopWakeUpReliable 错误
// (NSPanel 没 first responder 时 IME mach port 通信失败)。删 platform 模块后
// macOS 走 fallback:transparent + decorations(false) + alwaysOnTop + Web CSS
// backdrop-filter 兜底(见 src/floating/styles/floating.css 的 --glass-blur)。
// 圆角修在 macOS 段(见 apply_macos_corner_radius):CSS border-radius 不能 round
// native NSWindow,必须设 WKWebView.layer.cornerRadius + masksToBounds。
use tauri::{Manager, PhysicalPosition};

pub fn ensure_window(app: &tauri::AppHandle) -> Result<(), String> {
    // 关键:tauri.conf.json 静态声明了 floating 窗口,启动时 Tauri 已经预建好。
    // 老逻辑 `if ...is_some() { return }` 跳过了 R4 防御 — 整本 mindtap.log
    // 都看不到 "floating webview state" 这行(启动时打的位置 fix 永远没跑)。
    // 新逻辑:先看窗口是否已存在;若不存在走 builder 建一个;无论哪条路径,
    // 都跑 R4(set_position 兜底 + log webview 物理 state)。
    if let Some(w) = app.get_webview_window("floating") {
        // R4 防御:Tauri 2 .position() 在 macOS 上偶发不生效 — 显式 set_position
        // 兜底(失败不报错,fall back 到 build 时的默认)。无论窗口是 Tauri 预建
        // 还是我们现建,这条 set_position 都要跑(否则 macOS (0,0) 被菜单栏遮)。
        let _ = w.set_position(PhysicalPosition::new(100, 60));
        apply_macos_corner_radius(&w);
        log_floating_state(&w);
        return Ok(());
    }

    let w = tauri::WebviewWindowBuilder::new(
        app,
        "floating",
        tauri::WebviewUrl::App("floating.html".into()),
    )
    .title("Mindtap")
    // F5' 启动期位置兜底:Tauri WebviewWindowBuilder 不指定 x/y 时,macOS 把
    // webview 放 (0, 0) 附近 — 菜单栏遮顶部 ~25px,用户报告"屏幕上不出现浮窗"。
    // (100, 60) 跨平台安全:macOS 避菜单栏、Windows/Linux 不撞任何 chrome。
    // 前端 useWindowPosition hook 会接管(saved 恢复 / onMoved 持久化),此默认值
    // 仅在 JS mount 前生效,后续用户拖动会覆盖。
    .position(100.0, 60.0)
    .inner_size(320.0, 36.0)
    .min_inner_size(320.0, 36.0)
    .max_inner_size(480.0, 460.0)
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .resizable(true)
    .skip_taskbar(true)
    .focused(false)
    .shadow(false)
    .visible(true)
    .build()
    .map_err(|e| e.to_string())?;

    // R4 防御:同上,这条路径下 log_floating_state 也必须跑。
    let _ = w.set_position(PhysicalPosition::new(100, 60));
    apply_macos_corner_radius(&w);
    log_floating_state(&w);

    Ok(())
}

/// macOS 圆角修复:CSS `.floating-root { border-radius: 14px }` 只 round web 内容,
/// NSWindow 本身四角是直角 → 浮窗"圆角不完整"。修法:用 Tauri 2 `with_webview`
/// 拿 WKWebView,设其 CALayer 的 `cornerRadius` + `masksToBounds`,让 webview 边界
/// 物理贴合 CSS 圆角。值 14 跟 src/floating/styles/floating.css 同步。
/// 失败(非 macOS / runtime 异常)→ 静默 no-op,前端 CSS 兜底。
#[cfg(target_os = "macos")]
fn apply_macos_corner_radius(w: &tauri::WebviewWindow) {
    let _ = w.with_webview(|webview| {
        use objc2::msg_send;
        use objc2::runtime::AnyObject;
        // SAFETY: webview.inner() returns *mut c_void 指向 WKWebView 实例
        let wk = webview.inner() as *mut AnyObject;
        unsafe {
            // CALayer *layer = [wk layer];
            let layer: *mut AnyObject = msg_send![&*wk, layer];
            // CGFloat 在 64-bit macOS 上是 f64
            let _: () = msg_send![&*layer, setCornerRadius: 14.0_f64];
            // BOOL = true(1)
            let _: () = msg_send![&*layer, setMasksToBounds: true];
        }
    });
}

#[cfg(not(target_os = "macos"))]
fn apply_macos_corner_radius(_w: &tauri::WebviewWindow) {
    // no-op on Windows / Linux
}

/// R4:启动后立即 log webview 物理 state。floating_diagnose command 拿同样数据返给前端,
/// 但这里 log 到 stderr + mindtap.log 是 first-class 诊断通道(用户跑一次发我看 log 即可)。
pub fn log_floating_state(w: &tauri::WebviewWindow) {
    let pos = w.outer_position().ok();
    let size = w.outer_size().ok();
    let visible = w.is_visible().unwrap_or(false);
    log::info!(
        "floating webview state: pos={:?}, size={:?}, visible={}",
        pos.map(|p| (p.x, p.y)),
        size.map(|s| (s.width, s.height)),
        visible,
    );
}