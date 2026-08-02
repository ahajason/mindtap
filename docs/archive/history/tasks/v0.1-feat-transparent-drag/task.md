# feat(window): macOS 26 透明窗口 + native drag

> 创建: 2026-06-21

## Why
V0.1.0 交付的 window 是普通标题栏 + 不透明背景,跟"玻璃感"设计语言冲突。
窗口没法拖动玻璃区域(只有顶部 titlebar 才能拖),也看不到桌面壁纸的层次,
Liquid Glass 的 vibrance 完全没法在网页内复现。

## What
Tauri 2 窗口改 transparent + Overlay titlebar,Rust 端挂 main thread hook
让整个 NSWindow 背景都可拖。

## Done when
- [x] tauri.conf.json: transparent + titleBarStyle Overlay + hiddenTitle + macOSPrivateApi
- [x] src-tauri/src/lib.rs: setup hook 主线程同步调 NSWindow.setMovableByWindowBackground(YES)
- [x] src-tauri/Cargo.toml: 加 cocoa + objc2 依赖
- [x] Sidebar.tsx: mt-3 → mt-10 给 traffic light 让位
- [x] tauri dev 启动,整窗背景按下可拖动
- [x] WKWebView 内 button/input 正常 click,不污染 drag