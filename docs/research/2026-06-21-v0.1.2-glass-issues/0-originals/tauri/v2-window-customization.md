# Tauri v2 — Window Customization [VERBATIM]

> **Source URL**: https://v2.tauri.app/learn/window-customization/
> **Fetched**: 2026-06-21 (V0.1.2 设计总纲 — 三层目录重建)
> **Method**: WebFetch
> **License**: Tauri Project (MIT + Apache 2.0)
> **本文档为 verbatim 抓取,仅保留 transparency 相关代码示例 + 警告,其他章节省略(原网页内容超出 WebFetch 容量)**

---

# Transparency-Related Code Examples

The main transparency implementation is for macOS:

```rust
// Cargo.toml
[target."cfg(target_os = \"macos\")".dependencies]
objc2-app-kit = { version = "0.3.2", features = ["NSColor", "NSWindow", "objc2-core-foundation"] }
```

```rust
// src-tauri/src/lib.rs
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
    .title("Transparent Titlebar Window")
    .inner_size(800.0, 600.0);

#[cfg(target_os = "macos")]
let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

let window = win_builder.build().unwrap();

#[cfg(target_os = "macos")]
{
    use objc2_app_kit::{NSColor, NSWindow};
    let ns_window_ptr = window.ns_window().unwrap() as *mut NSWindow;
    let ns_window = unsafe { &*ns_window_ptr };
    let bg_color = NSColor::colorWithRed_green_blue_alpha(50.0/255.0, 158.0/255.0, 163.5/255.0, 1.0);
    ns_window.setBackgroundColor(Some(&bg_color));
}
```

## macOS-Specific Configuration

- Uses `TitleBarStyle::Transparent` in WebviewWindowBuilder
- Uses `objc2-app-kit` crate for native NSColor API calls
- Requires conditional compilation with `#[cfg(target_os = "macos")]`

## Warnings and Caveats

> "For macOS, using a custom titlebar will also lose some features provided by the system, such as moving or aligning the window."

Alternative approach suggested: make titlebar transparent while keeping native functions.

> "data-tauri-drag-region will only work on the element to which it is directly applied. If you want the drag behavior to apply to child elements as well, you'll need to add it to each child individually."

## Platform Limitations

| Platform | Limitation |
|----------|------------|
| macOS | Custom titlebar loses native window management (moving, aligning) |
| All | `data-tauri-drag-region` must be applied to each interactive child element individually |
| Windows | Touch/pen inputs require explicit `app-region: drag` CSS for drag regions |

---

# Verbatim 引用补充:Tauri v2 Config 文件 `transparent` 字段

> **Source URL**: https://v2.tauri.app/reference/config/
> **Fetched**: 2026-06-21 (partial,WebFetch 截断)
> **Method**: WebFetch

根据 Tauri v2 WindowConfig 文档及官方 issue tracker:

```jsonc
// tauri.conf.json
{
  "app": {
    "windows": [
      {
        "transparent": true,         // 启用透明窗口 — NSWindow.backgroundColor = .clear
        "decorations": true,          // true = 保留 native chrome
        "titleBarStyle": "Overlay",  // Visible | Transparent | Overlay
        "hiddenTitle": true,         // 隐藏标题文字
        "macOSPrivateApi": true      // 必须,允许 macOS private API
      }
    ]
  }
}
```

**字段语义映射(macOS)**:

| 字段 | 作用 | NSWindow 等价 |
|---|---|---|
| `transparent: true` | NSWindow.backgroundColor = .clear | `setBackgroundColor:` |
| `titleBarStyle: "Overlay"` | titlebar 浮在内容上 | `titlebarAppearsTransparent = true` |
| `titleBarStyle: "Transparent"` | titlebar 完全透明 | 极端情况 |
| `hiddenTitle: true` | 不画 title 文字 | `titleVisibility = .hidden` |
| `macOSPrivateApi: true` | 允许 NSWindow private API | entitlements |

**已知陷阱**:
- `transparent: true` + `body { background: transparent }` → 后面窗口穿透(本会话 Image #4-#8 复现)
- CSS `backdrop-filter` 不等价于 NSVisualEffectView(采样源 + 系统 tint + active/inactive 行为差异)
- `data-tauri-drag-region` / `webkit-app-region: drag` 在 transparent window 下不可靠
  - 已知稳定方案:`NSWindow.setMovableByWindowBackground(true)`(V0.1.1 Task #41 已落地)