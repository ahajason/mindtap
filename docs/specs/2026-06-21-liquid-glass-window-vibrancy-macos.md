---
title: V0.1.2 混合架构 Liquid Glass (Tauri + React + Swift 三层)
status: active
version: v0.1.2
created: 2026-06-21
type: design
parent: 2026-06-21-v0.1-scope-and-ui-design.md
tags: [design-system, liquid-glass, macos, tauri, react, swift, hybrid, mindtap-v0.1.2]
---

# V0.1.2 混合架构 Liquid Glass

> **架构决策**:采用 **3 层混合架构**,在保留 React 前端 + Tauri 跨平台代码的同时,让 Swift 接管 macOS 26 真原生 Liquid Glass 渲染。
>
> - **前端层** (React 19 + TS + Vite 7): 只做页面渲染 / 交互 / 状态;**不直接接触 Swift**,所有原生能力统一通过 Tauri 命令调用
> - **Rust 通用层** (Tauri 2): 跨平台业务 / 数据 / 加密 / 文件;macOS 专属逻辑**路由到 Swift 插件**,Win/Linux 兜底
> - **Swift 原生层** (仅 macOS): 封装 Apple 平台独有能力,通过 SPM 编译为静态库,**链接进 Rust 二进制**
>
> **核心创新**:per-element Liquid Glass 通过 Swift 在 WKWebView 上叠 `NSHostingView` overlay,位置由 React 通过 `getBoundingClientRect()` 同步。**WKWebView 对 Swift 是黑盒 → Swift 反向覆盖到 WKWebView 之上**。

---

## 1. 背景与目标

### 1.1 根因复盘 (V0.1.0 失败的 3 个事实)

| # | 事实 | 影响 |
|---|---|---|
| 1 | CSS `backdrop-filter` 是 **Web 层渲染**,只模糊 WebView 内的像素;拿不到 NSWindow 后面的桌面/其他 App 窗口 | macOS 26 Liquid Glass 的实时折射、位移、色散在 WKWebView 里不可能还原 |
| 2 | [liquid-glass-react](https://github.com/rdev/liquid-glass-react) (rdev, 5.2k★, MIT) **在 Safari/WKWebView 上 displacement 不可见** (作者 README 自承) | 最接近的开源 Web 实现,在 macOS 上恰好失效 |
| 3 | Tauri [window-vibrancy](https://github.com/tauri-apps/window-vibrancy) plugin 只做**整窗 NSVisualEffectMaterial**,**不是 per-element** | 拿到 Apple 自家 App 那种 per-element glass 必须 Swift 出马 |

→ per-element 真原生感只有 SwiftUI `.glassEffect()` 能给。**但 SwiftUI view 不渲染 DOM 元素** → 需要 overlay 同步 DOM 位置的混合架构。

### 1.2 目标

| 维度 | 目标 |
|---|---|
| 平台 | macOS 26+ 真原生;Win/Linux 跨平台兜底(用现有 CSS backdrop-filter) |
| per-element glass | SwiftUI `.glassEffect(.regular.tint(.white), in: RoundedRectangle)` 真实渲染 |
| 整窗背景 | `.glassBackgroundEffect()` (SwiftUI macOS 26) 整窗 vibrancy |
| React 工作量 | 加 `useGlassOverlay` 内部 hook,11 个组件**最小改动**接入 |
| 跨平台代码 | 不污染 — Swift 编译产物仅在 macOS 链接,其他平台自动跳过 |
| 真实感 | per-element 折射 / 桌布跟随窗口位移 = Apple Mail / Notes 同观感 |

### 1.3 非目标 (V0.1.2 范围外)

- ❌ 其他 macOS 独有能力(file picker / dock / menu / notifications) — 同套机制但本 spec 不写,V0.2+ 单独 spec
- ❌ 浮窗 (`WebviewWindow`) — 复用本套 overlay manager,V0.2+ 单独 spec
- ❌ 暗色主题 — V0.2+
- ❌ 公证 / Mac App Store — V0.2+
- ❌ iOS / iPadOS — 暂不

---

## 2. 架构总览

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend Layer (React 19 + TS + Vite 7)                      │
│ ├─ src/components/ui/*.tsx (11 组件)                         │
│ │   └─ useGlassOverlay() — 内部 hook,自动 register/update/unregister│
│ │       → ResizeObserver + scroll listener (去抖 16ms)        │
│ │       → invoke('glass_register', { id, tier, rect })       │
│ │       → invoke('glass_update_rect', { id, rect })          │
│ │       → invoke('glass_unregister', { id }) on unmount      │
│ ├─ src/lib/glass-invoke.ts — typed Tauri command wrappers    │
│ └─ src/index.css — 保留现有 .glass-l1/l2/l3 (Win/Linux 兜底)  │
└────────────────────┬─────────────────────────────────────────┘
                     │ Tauri IPC (typed commands, JSON)
┌────────────────────▼─────────────────────────────────────────┐
│ Rust Core Layer (Tauri 2)                                    │
│ ├─ src-tauri/src/commands/glass.rs                           │
│ │   #[tauri::command]                                         │
│ │   glass_register(state, id, tier, rect)                    │
│ │   glass_update_rect(state, id, rect)                       │
│ │   glass_unregister(state, id)                              │
│ │   glass_clear(state) — 全清,关窗/重载时调用               │
│ │   → macOS: 调 Swift C-ABI FFI                             │
│ │   → 其他: warn + Ok(None),CSS 兜底                         │
│ ├─ src-tauri/src/lib.rs (setup hook)                         │
│ │   macOS: 注入 .glassBackgroundEffect() + 调 GlassOverlayManager.shared.attach()│
│ │   其他: 仅启用 macos-private-api feature 兜底             │
│ ├─ src-tauri/build.rs                                        │
│ │   macOS: 调 `swift build -c release --package-path swift/MindtapGlass`│
│ │   → 静态库 .a 链接进 Rust 二进制                           │
│ └─ src-tauri/Cargo.toml                                      │
│     [target.'cfg(target_os = "macos")'.dependencies]         │
│     mindtap-glass-ffi = { path = "swift/MindtapGlass" }      │
└────────────────────┬─────────────────────────────────────────┘
                     │ C-ABI FFI (JSON over C string, in-process 静态链接)
┌────────────────────▼─────────────────────────────────────────┐
│ Swift Native Layer (macOS only, Swift 5.10+)                 │
│ ├─ src-tauri/swift/MindtapGlass/                             │
│ │   ├─ Package.swift (SPM, macOS 26 platform)                │
│ │   ├─ Sources/MindtapGlass/                                 │
│ │   │   ├─ Tier.swift — enum l1/l2/l3                       │
│ │   │   ├─ GlassOverlay.swift — SwiftUI .glassEffect() view │
│ │   │   ├─ GlassOverlayManager.swift — @MainActor 单例      │
│ │   │   │   管理 [id: NSHostingView] 映射表                 │
│ │   │   ├─ FFIBridge.swift — @_cdecl 导出函数               │
│ │   │   │   mindtap_glass_{register,update_rect,unregister,clear}│
│ │   │   └─ WindowGlassBackground.swift — 整窗 .glassBackgroundEffect() 接入│
│ │   └─ Tests/GlassOverlayManagerTests.swift                  │
│ └─ 仅 macOS 编译;其他平台 SPM 不构建                         │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 关键不变量

| 不变量 | 强制 |
|---|---|
| React 不知道 Swift 存在 | React 只通过 Tauri command 调用,不 import 任何 Swift 类型 |
| Swift 不知道 React 存在 | Swift 只通过 element ID 字符串识别 DOM 元素,不解析 JSX/DOM 结构 |
| Rust 是唯一桥 | 所有跨层通信经 Rust;不允许 React 直接 spawn Swift / Swift 直接调 JS |
| 跨平台不污染 | `cfg!(target_os = "macos")` 是唯一门控;非 macOS 平台代码不引用任何 Swift 符号 |
| overlay 不拦截事件 | overlay view `hitTest` 返回 nil 让 WKWebView 仍接收 click/scroll |

---

## 3. 通信契约

### 3.1 Tauri Commands (4 个)

```rust
// src-tauri/src/commands/glass.rs
#[tauri::command]
pub async fn glass_attach(window: tauri::WebviewWindow) -> Result<(), String> {
    // 一次性调用,启动时把 NSWindow 交给 Swift overlay manager
    #[cfg(target_os = "macos")]
    {
        let ns_window_ptr = window.ns_window().map_err(|e| e.to_string())? as *mut std::ffi::c_void;
        unsafe { mindtap_glass_attach(ns_window_ptr) };
    }
    #[cfg(not(target_os = "macos"))]
    {
        log::warn!("glass_attach called on non-macOS, ignored");
    }
    Ok(())
}

#[tauri::command]
pub async fn glass_register(
    state: State<'_, AppState>,
    id: String,
    tier: String,
    x: f64, y: f64, w: f64, h: f64,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let payload = json!({ "id": id, "tier": tier, "x": x, "y": y, "w": w, "h": h });
        glass_ffi::call("register", &payload.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        log::warn!("glass_register called on non-macOS, ignored: id={}", id);
        Ok(())
    }
}

#[tauri::command]
pub async fn glass_update_rect(
    state: State<'_, AppState>,
    id: String,
    x: f64, y: f64, w: f64, h: f64,
) -> Result<(), String> { /* same shape */ }

#[tauri::command]
pub async fn glass_unregister(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> { /* same shape */ }

#[tauri::command]
pub async fn glass_clear(state: State<'_, AppState>) -> Result<(), String> { /* same shape */ }
```

### 3.2 FFI 协议 (Rust ↔ Swift)

```c
// C-ABI
// 注册类命令: 参数和返回值都是 *const c_char (JSON,UTF-8,NUL 终止)
// Swift 端 strdup 字符串,Rust 端负责 free
const char* mindtap_glass_register(const char* json);
const char* mindtap_glass_update_rect(const char* json);
const char* mindtap_glass_unregister(const char* json);
const char* mindtap_glass_clear(void);
// 启动时调用: 把 NSWindow 指针交给 Swift overlay manager
void       mindtap_glass_attach(void* ns_window_ptr);
// 释放 Swift 返回的字符串
void       mindtap_glass_response_free(char* ptr);
```

**JSON payload 示例**:
```json
// register / update_rect
{ "id": "card-7a3f", "tier": "l1", "x": 120.0, "y": 240.0, "w": 320.0, "h": 180.0 }

// unregister
{ "id": "card-7a3f" }

// 响应
{ "ok": true }
{ "ok": false, "error": "tier must be l1|l2|l3" }
```

**为什么用 C string + JSON 而不是 `swift-bridge`**:V0.1.2 阶段 4 个命令都简单,JSON 字符串已经够用。`swift-bridge` 加额外代码生成和构建复杂度。V0.2+ 命令多了再考虑升级。

### 3.3 调用方向

| 调用方 | 被调方 | 协议 | 频率 |
|---|---|---|---|
| React | Rust | Tauri IPC (`invoke`) | 高频(滚动/resize 时) |
| Rust | Swift | C-ABI FFI (in-process) | 同上 |
| Swift | AppKit/SwiftUI | 直接调 | 高频 |

---

## 4. Glass 渲染策略 (核心)

### 4.1 整窗背景

```swift
// src-tauri/swift/MindtapGlass/Sources/MindtapGlass/WindowGlassBackground.swift
import SwiftUI
import AppKit

@MainActor
public enum WindowGlassBackground {
    public static func apply(to window: NSWindow) {
        // macOS 26 SwiftUI 提供 .glassBackgroundEffect() 整窗 vibrancy
        // 通过 NSHostingView 包整个 window.contentView 实现
        let host = NSHostingView(rootView: AnyView(
            Color.clear
                .glassBackgroundEffect()
                .ignoresSafeArea()
        ))
        host.frame = window.contentView?.bounds ?? .zero
        host.autoresizingMask = [.width, .height]
        host.isUserInteractionEnabled = false
        // 插到 WKWebView 之下,作为背景
        window.contentView?.addSubview(host, positioned: .below, relativeTo: nil)
    }
}
```

### 4.2 Per-Element Overlay (核心机制)

**核心思想**:React 渲染的 DOM 元素,Swift 在 WKWebView 之上叠同样位置/大小的 SwiftUI `.glassEffect()` view。两者视觉合成 = 真 per-element Liquid Glass。

```
┌─ NSWindow.contentView ────────────────────────────┐
│                                                    │
│  ┌─ BackgroundHost (NSHostingView, .below) ────┐  │
│  │  .glassBackgroundEffect() 整窗               │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌─ WKWebView (full bounds) ────────────────────┐  │
│  │  └─ DOM <Card id="card-7a3f" />              │  │
│  │     └─ 渲染 React 内容(text, children)       │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌─ OverlayHost (NSHostingView, .above) ────────┐  │
│  │  └─ GlassOverlay(id: "card-7a3f", tier: l1) │  │
│  │     frame: (120, 240, 320, 180)               │  │
│  │     .glassEffect(.regular.tint(.white),       │  │
│  │       in: RoundedRectangle(cornerRadius: 20)) │  │
│  │     hitTest → nil (事件穿透)                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

**位置同步流程**:
```
[React 渲染 DOM 元素]
   ↓ mount
[useGlassOverlay effect]
   ↓ invoke('glass_register', { id, tier, getBoundingClientRect() })
[Rust command 路由]
   ↓ macOS FFI
[Swift register(): 创建 NSHostingView, frame = rect, addSubview]
   ↓
[WebView resize / window scroll]
   ↓ ResizeObserver / scroll listener
[React 重读 getBoundingClientRect]
   ↓ invoke('glass_update_rect', { id, new rect })
[Rust → Swift updateRect(): 修改 frame]
   ↓
[component unmount]
[useGlassOverlay cleanup → invoke('glass_unregister', { id })]
   ↓
[Swift unregister(): removeFromSuperview]
```

### 4.3 Overlay View 实现

```swift
// src-tauri/swift/MindtapGlass/Sources/MindtapGlass/GlassOverlay.swift
import SwiftUI

public struct GlassOverlay: View {
    let tier: GlassTier

    public init(tier: GlassTier) { self.tier = tier }

    public var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(.white.opacity(fillOpacity))
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(.white.opacity(borderOpacity), lineWidth: 1)
            }
            .glassEffect(.regular.tint(.white), in:
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            )
    }

    private var cornerRadius: Double {
        switch tier {
        case .l1: 20; case .l2: 24; case .l3: 28
        }
    }
    private var fillOpacity: Double {
        switch tier {
        case .l1: 0.35; case .l2: 0.42; case .l3: 0.50
        }
    }
    private var borderOpacity: Double {
        switch tier {
        case .l1: 0.60; case .l2: 0.70; case .l3: 0.80
        }
    }
}
```

### 4.4 Overlay Manager 状态机

```swift
// src-tauri/swift/MindtapGlass/Sources/MindtapGlass/GlassOverlayManager.swift
import AppKit
import SwiftUI

@MainActor
public final class GlassOverlayManager {
    public static let shared = GlassOverlayManager()
    private var overlays: [String: NSHostingView<AnyView>] = [:]
    private weak var hostWindow: NSWindow?

    private init() {}

    public func attach(to window: NSWindow) {
        self.hostWindow = window
    }

    public func register(id: String, tier: GlassTier, rect: CGRect) {
        guard let window = hostWindow else {
            log.warn("hostWindow not set; overlay not registered")
            return
        }
        // 同一 id 重复 register: 先清旧
        overlays[id]?.removeFromSuperview()

        let overlay = NSHostingView(rootView: AnyView(GlassOverlay(tier: tier)))
        overlay.frame = rect
        overlay.autoresizingMask = []  // 我们手动管理 frame
        overlay.isUserInteractionEnabled = false  // 事件穿透到 WKWebView
        // 加到 contentView,位于 WKWebView 之上
        if let contentView = window.contentView {
            contentView.addSubview(overlay)
        }
        overlays[id] = overlay
    }

    public func updateRect(id: String, rect: CGRect) {
        // 用 frame.origin/size 修改,不触发 Auto Layout
        overlays[id]?.frame = rect
    }

    public func unregister(id: String) {
        overlays[id]?.removeFromSuperview()
        overlays[id] = nil
    }

    public func clear() {
        overlays.values.forEach { $0.removeFromSuperview() }
        overlays.removeAll()
    }
}
```

---

## 5. React `useGlassOverlay` Hook

### 5.1 接口(内部 helper,组件直接调)

```ts
// src/lib/use-glass-overlay.ts
import { useEffect, useId, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

type GlassTier = 'l1' | 'l2' | 'l3';

/**
 * 内部 helper。给 DOM 元素挂 per-element Liquid Glass overlay。
 * 用法: 组件内 useRef, useGlassOverlay(tier, ref), 把 ref 挂到元素。
 */
export function useGlassOverlay(
  tier: GlassTier,
  ref: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  const reactId = useId();  // React 18+ stable id
  const id = `glass-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const sendRect = () => {
      const r = el.getBoundingClientRect();
      invoke('glass_register', {
        id, tier,
        x: r.x, y: r.y, w: r.width, h: r.height,
      });
    };

    sendRect();

    const ro = new ResizeObserver(() => sendRect());
    ro.observe(el);

    const onScroll = () => sendRect();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      invoke('glass_unregister', { id });
    };
  }, [tier, enabled, ref, id]);
}
```

### 5.2 接入 11 组件(其中 9 组件挂 overlay)

```tsx
// src/components/ui/card.tsx (改造)
import { forwardRef, useRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useGlassOverlay } from '@/lib/use-glass-overlay';

const cardVariants = cva(/* 同 V0.1.0 */);

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, tier = 'l1', ...props }, ref) => {
    const innerRef = useRef<HTMLDivElement | null>(null);
    useGlassOverlay(tier, innerRef);

    return (
      <div
        ref={(el) => {
          innerRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        className={cn(cardVariants({ tier }), className)}
        {...props}
      />
    );
  }
);
```

**所有 11 个组件接入清单**:

| 组件 | tier | 备注 |
|---|---|---|
| Button.secondary | l1 | `useGlassOverlay` 接 ref |
| Button.icon | l1 | — |
| Button.primary | — | **实色不变**,**不接 overlay**(`.glassProminent` 风格 V0.2+ 单独评估) |
| Button.ghost | — | **透明不变**,**不接 overlay** |
| Card | tier prop 直接传 | 整组件接 overlay |
| Input | l2 | 与 V0.1.0 CSS 一致 |
| Textarea | l2 | — |
| Label | — | **纯文本,不接**;父级容器挂玻璃 |
| Badge | l1 | — |
| Separator | — | **线条,不接** |
| Tabs.Root | l2 | 容器挂,内部 Tab 不挂 |
| Tooltip 内容 | l3 | 浮窗 |
| Dialog 内容 | l3 | modal |
| Sonner (Toast) | l3 | toast |

> 注:**仅 V0.1.0 中已有 `.glass-l1/l2/l3` 的组件接 overlay**。实色 / 透明 / 纯文本 / 线条组件保持 V0.1.0 视觉,**零样式回归**。Swift overlay 通过 `isUserInteractionEnabled = false` 不拦截 WKWebView 事件;文本由 WKWebView 渲染,对比度保持 WCAG AA。

### 5.3 跨平台降级(Win/Linux)

- `useGlassOverlay` 内部判断 `import.meta.env.TAURI_PLATFORM` 或 `window.__TAURI_INTERNALS__?.platform`
- 非 macOS: skip `invoke`,只渲染 CSS `.glass-l1/l2/l3`(V0.1.0 已有)
- CSS 类保留(Win/Linux 仍走 backdrop-filter)

---

## 6. Rust FFI Bridge

### 6.1 FFI 调用包装

```rust
// src-tauri/src/glass/ffi.rs
#[cfg(target_os = "macos")]
mod macos {
    use std::ffi::{CStr, CString};
    use std::os::raw::c_char;

    extern "C" {
        fn mindtap_glass_register(json: *const c_char) -> *const c_char;
        fn mindtap_glass_update_rect(json: *const c_char) -> *const c_char;
        fn mindtap_glass_unregister(json: *const c_char) -> *const c_char;
        fn mindtap_glass_clear() -> *const c_char;
        fn mindtap_glass_response_free(ptr: *mut c_char);
    }

    pub fn call(cmd: &str, payload: &str) -> Result<(), String> {
        let input = CString::new(payload).map_err(|e| e.to_string())?;
        let response_ptr = unsafe {
            match cmd {
                "register"     => mindtap_glass_register(input.as_ptr()),
                "update_rect"  => mindtap_glass_update_rect(input.as_ptr()),
                "unregister"   => mindtap_glass_unregister(input.as_ptr()),
                "clear"        => mindtap_glass_clear(),
                _ => return Err(format!("unknown cmd: {}", cmd)),
            }
        };
        let response = unsafe { CStr::from_ptr(response_ptr) }
            .to_string_lossy()
            .into_owned();
        unsafe { mindtap_glass_response_free(response_ptr as *mut _) };
        // 解析 { ok: bool, error?: string };V0.1.2 仅日志
        log::debug!("glass {} → {}", cmd, response);
        Ok(())
    }
}

#[cfg(not(target_os = "macos"))]
mod other {
    pub fn call(_cmd: &str, _payload: &str) -> Result<(), String> {
        log::warn!("glass ffi called on non-macOS, ignored");
        Ok(())
    }
}
```

### 6.2 build.rs (自动编译 Swift)

```rust
// src-tauri/build.rs
fn main() {
    #[cfg(target_os = "macos")]
    {
        let swift_pkg = "swift/MindtapGlass";
        let status = std::process::Command::new("swift")
            .args(["build", "-c", "release", "--package-path", swift_pkg])
            .status()
            .expect("failed to invoke swift build");
        assert!(status.success(), "MindtapGlass SPM build failed");

        println!("cargo:rustc-link-search=native={}/.build/release", swift_pkg);
        println!("cargo:rustc-link-lib=static=MindtapGlass");
        println!("cargo:rerun-if-changed={}", swift_pkg);
    }
}
```

### 6.3 Cargo.toml 片段

```toml
# src-tauri/Cargo.toml
[build-dependencies]
# 不需要;build.rs 用 std::process::Command

[dependencies]
tauri = { version = "2", features = ["macos-private-api"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
log = "0.4"

[target.'cfg(target_os = "macos")'.dependencies]
# FFI 通过 build.rs 静态链接,不需要 [dependencies] 项
```

---

## 7. Swift 包结构

### 7.1 Package.swift

```swift
// src-tauri/swift/MindtapGlass/Package.swift
// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "MindtapGlass",
    platforms: [.macOS(.v26)],
    products: [
        .library(name: "MindtapGlass", type: .static, targets: ["MindtapGlass"])
    ],
    targets: [
        .target(
            name: "MindtapGlass",
            path: "Sources/MindtapGlass"
        ),
        .testTarget(
            name: "MindtapGlassTests",
            dependencies: ["MindtapGlass"],
            path: "Tests/MindtapGlassTests"
        )
    ]
)
```

### 7.2 FFI 导出实现

```swift
// src-tauri/swift/MindtapGlass/Sources/MindtapGlass/FFIBridge.swift
import Foundation
import AppKit

struct GlassRegisterRequest: Decodable {
    let id: String
    let tier: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
}

struct GlassUpdateRectRequest: Decodable {
    let id: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
}

struct GlassUnregisterRequest: Decodable {
    let id: String
}

/// 启动时调用一次。把 NSWindow 指针交给 Swift overlay manager。
@_cdecl("mindtap_glass_attach")
public func mindtap_glass_attach(_ nsWindowPtr: UnsafeMutableRawPointer) {
    let nsWindow = Unmanaged<NSWindow>.fromOpaque(nsWindowPtr).takeUnretainedValue()
    Task { @MainActor in
        GlassOverlayManager.shared.attach(to: nsWindow)
        WindowGlassBackground.apply(to: nsWindow)
    }
}

@_cdecl("mindtap_glass_register")
public func mindtap_glass_register(_ json: UnsafePointer<CChar>) -> UnsafeMutablePointer<CChar> {
    let result: String
    do {
        let request = try decodeJSON(GlassRegisterRequest.self, from: json)
        let tier = GlassTier(rawValue: request.tier) ?? .l1
        let rect = CGRect(x: request.x, y: request.y, width: request.w, height: request.h)
        Task { @MainActor in
            GlassOverlayManager.shared.register(id: request.id, tier: tier, rect: rect)
        }
        result = "{\"ok\":true}"
    } catch {
        result = "{\"ok\":false,\"error\":\"\(error)\"}"
    }
    return strdup(result)
}

@_cdecl("mindtap_glass_update_rect")
public func mindtap_glass_update_rect(_ json: UnsafePointer<CChar>) -> UnsafeMutablePointer<CChar> { /* 同 register,decode UpdateRequest */ }

@_cdecl("mindtap_glass_unregister")
public func mindtap_glass_unregister(_ json: UnsafePointer<CChar>) -> UnsafeMutablePointer<CChar> { /* 同 register,decode UnregisterRequest */ }

@_cdecl("mindtap_glass_clear")
public func mindtap_glass_clear() -> UnsafeMutablePointer<CChar> {
    Task { @MainActor in GlassOverlayManager.shared.clear() }
    return strdup("{\"ok\":true}")
}

@_cdecl("mindtap_glass_response_free")
public func mindtap_glass_response_free(_ ptr: UnsafeMutablePointer<CChar>) {
    free(ptr)
}

// MARK: - Helpers

private func decodeJSON<T: Decodable>(_ type: T.Type, from ptr: UnsafePointer<CChar>) throws -> T {
    let str = String(cString: ptr)
    let data = Data(str.utf8)
    return try JSONDecoder().decode(type, from: data)
}
```

---

## 8. 文件改动清单

### 8.1 新增文件

| # | 文件 | 行数 | 内容 |
|---|---|---|---|
| 1 | `src-tauri/swift/MindtapGlass/Package.swift` | ~25 | SPM 配置,macOS 26 |
| 2 | `src-tauri/swift/MindtapGlass/Sources/MindtapGlass/Tier.swift` | ~10 | enum l1/l2/l3 |
| 3 | `src-tauri/swift/MindtapGlass/Sources/MindtapGlass/GlassOverlay.swift` | ~40 | SwiftUI .glassEffect view |
| 4 | `src-tauri/swift/MindtapGlass/Sources/MindtapGlass/GlassOverlayManager.swift` | ~80 | @MainActor 单例 + 映射表 |
| 5 | `src-tauri/swift/MindtapGlass/Sources/MindtapGlass/WindowGlassBackground.swift` | ~30 | 整窗 .glassBackgroundEffect 接入 |
| 6 | `src-tauri/swift/MindtapGlass/Sources/MindtapGlass/FFIBridge.swift` | ~120 | 5 个 @_cdecl (attach / register / update_rect / unregister / clear) + JSON 编解码 + response_free |
| 7 | `src-tauri/swift/MindtapGlass/Tests/GlassOverlayManagerTests.swift` | ~80 | XCTest: register/update/unregister 状态机 |
| 8 | `src-tauri/src/commands/glass.rs` | ~50 | 4 个 #[tauri::command] |
| 9 | `src-tauri/src/glass/ffi.rs` | ~50 | FFI 调用包装 + cfg 分支 |
| 10 | `src-tauri/build.rs` | ~15 | swift build 自动调 |
| 11 | `src/lib/use-glass-overlay.ts` | ~50 | React hook |
| 12 | `src/lib/glass-invoke.ts` | ~30 | typed Tauri command wrappers |

### 8.2 修改文件

| # | 文件 | 改动 | 行数 |
|---|---|---|---|
| 1 | `src-tauri/Cargo.toml` | 加 `tauri = { ..., features = ["macos-private-api"] }`;加 `log = "0.4"` | +2 |
| 2 | `src-tauri/tauri.conf.json` | `app.macOSPrivateApi: true`;`windows[0].titleBarStyle: "Transparent"` | +2 |
| 3 | `src-tauri/src/lib.rs` | setup hook: macOS → 取 `webview_window.ns_window()` 裸指针 → 调 FFI `mindtap_glass_attach`(Swift 内部 apply background + attach manager);非 macOS → 仅启用 private api feature 兜底 | +20 |
| 4 | `src/components/ui/button.tsx` | secondary/icon variants 加 `useGlassOverlay('l1', ref)`;primary/ghost 不变(实色/透明) | +10 |
| 5 | `src/components/ui/card.tsx` | 加 `useGlassOverlay(tier, ref)` | +8 |
| 6 | `src/components/ui/input.tsx` | 加 `useGlassOverlay('l2', ref)` | +8 |
| 7 | `src/components/ui/textarea.tsx` | 加 `useGlassOverlay('l2', ref)` | +8 |
| 8 | `src/components/ui/label.tsx` | (Label 本身不挂,父级挂) | +0 |
| 9 | `src/components/ui/badge.tsx` | 加 `useGlassOverlay('l1', ref)` | +8 |
| 10 | `src/components/ui/separator.tsx` | (Separator 不挂) | +0 |
| 11 | `src/components/ui/tabs.tsx` | Tabs.Root 容器挂 l2 | +8 |
| 12 | `src/components/ui/tooltip.tsx` | Tooltip 内容挂 l3 | +8 |
| 13 | `src/components/ui/dialog.tsx` | Dialog 内容挂 l3 | +8 |
| 14 | `src/components/ui/sonner.tsx` | Toast 挂 l3 | +8 |

### 8.3 不修改文件(明确声明)

- `src/index.css` (现有 `.glass-l1/l2/l3` 保留,Win/Linux 兜底)
- `src/lib/utils.ts`
- `src/components/style-guide/*` × 5
- `src/routes/*` × 7
- `docs/design/glassic-ui-spec.md` (单源,不改)
- `docs/design/glass-tokens.md` (单源,不改)
- `docs/design/component-format.md` (参考,不改)

---

## 9. 验收标准

### 9.1 静态检查

- [ ] `cd src-tauri && swift build -c release --package-path swift/MindtapGlass` 0 error 0 warning
- [ ] `cd src-tauri && cargo check` 0 error 0 warning
- [ ] `cd src-tauri && cargo test` 通过(含 GlassOverlayManagerTests 状态机)
- [ ] `cd src-tauri && swift test --package-path swift/MindtapGlass` 通过
- [ ] `npx tsc --noEmit` 0 error
- [ ] `npm test` 通过 (V0.1.0 14 个 smoke test 无回归)
- [ ] 跨平台代码无 Swift 符号污染: `grep -r "MindtapGlass" src/` 在非 macOS CI 应 0 hit
- [ ] `cfg(target_os = "macos")` 是唯一门控:`grep -r "target_os = \"macos\"" src-tauri/src/` 仅在 glass/ffi.rs 和 commands/glass.rs

### 9.2 功能验收 (真机肉眼)

- [ ] macOS 26 真机启动后,主窗口显示 **整窗 vibrancy**(拖动窗口时桌布跟随折射)
- [ ] 打开 `/components` 路由,Card / Button / Input 等 11 组件**每个都有 per-element glass**,折射/色散可见
- [ ] 对比 Apple Mail:Card 边缘折射 / 桌布跟随窗口位移流畅度**与 Apple 自家 App 一致**
- [ ] 滚动 / 调整窗口大小时,**overlay 跟随 DOM 元素位置**无错位(肉眼 + 0 卡顿)
- [ ] 路由切换时,旧组件 unmount → overlay 自动消失;新组件 mount → overlay 自动出现
- [ ] 文本选择 / 点击 / 滚动事件**全部仍由 WKWebView 处理**(overlay 不拦截)

### 9.3 跨平台降级验证

- [ ] Linux `npm run tauri dev` 启动,UI 视觉与 V0.1.0 一致(CSS `.glass-l1/l2/l3` 工作)
- [ ] Windows `npm run tauri dev` 启动(若有环境),同上
- [ ] macOS 真机启动后 `console.log` 无 `glass_register on non-macOS` 警告

### 9.4 设计强制项 (spec §八 5 条)

| spec 强制项 | 落地 |
|---|---|
| 1. 必须有 backdrop-filter 等价 | Swift `.glassEffect(.regular.tint(.white), in: ...)` 真实 OS 层渲染 |
| 2. 阴影必须大模糊低不透明度 | GlassOverlay 内 `.fill(.white.opacity(0.35/0.42/0.50))` + SwiftUI 玻璃原生阴影 |
| 3. 背景必须有渐变 + vibrancy | 整窗 `.glassBackgroundEffect()` + body 保留 V0.1.0 渐变 |
| 4. 文本对比度 WCAG AA | overlay 在 WKWebView **下方**(不挡文字),文字由 WKWebView 渲染,对比度保持 |
| 5. 禁止半透白色代替模糊 | Swift overlay 必含 `.glassEffect(...)` modifier,不能仅 `.fill(.white.opacity(0.35))` |

---

## 10. 错误与降级

| 场景 | 行为 |
|---|---|
| macOS < 26 启动 | Tauri 配置 `minimumSystemVersion: 26.0`,系统检查;不满足直接退出 + 友好提示 |
| Swift build 失败 | build.rs panic 出清晰错误:`MindtapGlass SPM build failed, see ...` |
| Swift 运行时崩溃 (overlay manager) | `GlassOverlayManager.register` 失败 → Rust 端 log error → React 端 invoke reject → UI 仍渲染(CSS 兜底) |
| FFI JSON 解析失败 | Swift 返回 `{"ok":false,"error":"..."}`,Rust 端 log warn,不抛错 |
| DOM 元素被遮挡 (`z-index`) | React hook 读 `getComputedStyle().zIndex` 转译到 Swift overlay `view.layer.zPosition`(V0.1.2 可不做,先用最上层;V0.2+ 再处理) |
| ResizeObserver 不触发(元素被 display:none) | Swift 端 frame 不更新;overlay 残留旧 frame → 下次 updateRect / unmount 时清理 |
| Swift overlay 遮挡点击 | overlay `isUserInteractionEnabled = false` + `hitTest` 返回 nil → WKWebView 收事件 |
| 高频 updateRect (滚动期间) | Rust 端 `glass_update_rect` 不 await,异步发;Swift 端 `Task { @MainActor in ... }` 入队 → 60fps 不卡 |

---

## 11. 调研引用

| # | 来源 | 用途 |
|---|---|---|
| [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Liquid Glass 设计语言官方入口 | 设计参照 |
| [Apple developer · SwiftUI .glassEffect()](https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)) | API 签名 | per-element overlay |
| [Apple developer · .glassBackgroundEffect()](https://developer.apple.com/documentation/swiftui/view/glassbackgroundeffect()) | 整窗 vibrancy | WindowGlassBackground |
| [WWDC25 session 356](https://developer.apple.com/cn/wwdc25/) | "Build a SwiftUI app with the new design" | 最佳实践 |
| [Tauri 2 macOS private API](https://v2.tauri.app/learn/window-customization/#macos) | `macos-private-api` feature + `transparent` 配置 | 必备配置 |
| [Tauri 2 IPC](https://v2.tauri.app/develop/calling-rust/) | `#[tauri::command]` + `invoke` | 通信基础 |
| [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) | 5.2k★,确认 WKWebView 上失效 | 否定方案 A |
| `docs/design/glassic-ui-spec.md` | 设计语言单源 | 不改 |
| `docs/design/glass-tokens.md` | Token 映射单源 | Swift Tier 枚举对照 |
| `docs/design/component-format.md` | 组件接口规范 | 11 组件 tier 映射 |
| `docs/specs/2026-06-21-v0.1-scope-and-ui-design.md` | V0.1.0 父 spec | 本 spec 是其 macOS 真原生补强 |

---

## 12. 关联与边界

### 12.1 上游

- `docs/design/glassic-ui-spec.md`(单源,不改)
- `docs/design/glass-tokens.md`(单源,不改)
- `docs/design/component-format.md`(参考,不改)
- `docs/specs/2026-06-21-v0.1-scope-and-ui-design.md`(V0.1.0 父 spec,本 spec 是其 macOS 真原生补强)

### 12.2 下游 (V0.1.2 任务正式档,本 spec 派生)

- `docs/tasks/v0.1.2-feat-hybrid-liquid-glass/task.md` — 实施计划待 writing-plans 阶段生成

### 12.3 V0.2+ 预留(本 spec 不实现,占位到位)

- 文件 picker / dock / menu / notifications 等其他 Apple 独有能力 — 沿用本套 FFI + Swift plugin 模式
- 浮窗 (`WebviewWindow`) — 复用 `GlassOverlayManager`(每个浮窗一个 manager 实例)
- SwiftUI `.glassBackgroundEffect()` 暗色主题适配
- SPM Package 拆分 `MindtapGlass` 为独立 repo 共享
- 快照测试(`swift-snapshot-testing`)做视觉回归基线

---

## 13. 任务清单预告 (writing-plans 阶段细化)

> 占位,具体 step 在 writing-plans 阶段生成。每个任务对应一次 commit。

| # | 任务 | 输出 | commit 粒度 |
|---|---|---|---|
| T1 | 建 Swift SPM `MindtapGlass` skeleton + Package.swift + Tier enum | `swift build` 通过 | `feat(swift): MindtapGlass SPM skeleton` |
| T2 | `GlassOverlay` + `GlassOverlayManager` + XCTest 状态机 | `swift test` 通过 | `feat(swift): GlassOverlay + manager + tests` |
| T3 | `FFIBridge` 4 个 @_cdecl + JSON 编解码 | Swift 静态库导出 FFI | `feat(swift): FFI bridge for glass commands` |
| T4 | Rust `glass/ffi.rs` + `commands/glass.rs` + `build.rs` | `cargo check` 通过 | `feat(rust): glass FFI + tauri commands + build.rs` |
| T5 | Tauri config: `macOSPrivateApi` + `titleBarStyle` + setup hook | `npm run tauri dev` 启动 | `feat(rust): tauri macOS vibrancy config` |
| T6 | `WindowGlassBackground.apply` + `GlassOverlayManager.attach` 接入 | 整窗 vibrancy 可见 | `feat(swift): window glass background + manager attach` |
| T7 | React `useGlassOverlay` hook + `glass-invoke.ts` typed wrapper | vitest 通过 | `feat(react): useGlassOverlay hook` |
| T8 | 11 组件接入 `useGlassOverlay`(逐个 commit)| 每个组件 1 commit | `feat(ui): <component> useGlassOverlay` |
| T9 | 跨平台降级:`import.meta.env.TAURI_PLATFORM` 判断 + CSS 兜底 | Win/Linux 视觉不退化 | `feat(react): cross-platform glass fallback` |
| T10 | 真机 smoke:`npm run tauri dev` + 截图存 `docs/reports/2026-06-21-v0.1.2-hybrid-smoke.md` | 验收报告 | `docs(report): v0.1.2 hybrid liquid glass smoke` |

---

**设计档结束**。下一步:用户复核 → 转 writing-plans 写实施计划。