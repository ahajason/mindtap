# 09 · Transparency Tier 透明窗口方案对比

> **层级**: 1-design / Transparency Tier
> **创建**: 2026-06-21
> **作用**: macOS / Windows / Web 三平台透明窗口方案对比
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/liquid-glass/`(Liquid Glass 全章)
> - `0-originals/microsoft/acrylic.md`
> - `0-originals/microsoft/fluent2-material.md`
> - `0-originals/mdn/backdrop-filter.md`
> - `0-originals/tauri/v2-window-customization.md`

---

## 一、三平台 Tier 总览

| Tier | 平台 | 系统 API | Web 模拟 | 性能 |
|---|---|---|---|---|
| **Tier 1** | macOS 26+ | `NSGlassEffectView` | — | 最佳 |
| **Tier 2** | macOS 10.10+ | `NSVisualEffectView` | — | 优 |
| **Tier 3** | Windows 11 | MicaController / `DesktopAcrylicBackdrop` | — | 优 |
| **Tier 4** | Web(任意) | — | `backdrop-filter` | 中(取决于 webview) |
| **Tier 5** | Web + webview transparent | — | `backdrop-filter` + Tauri `transparent: true` | 差(穿透风险) |

## 二、Tier 1 — macOS 26+ Liquid Glass

```swift
// SwiftUI
.background(.glass)
.glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
```

| 属性 | 值 |
|---|---|
| 自动采样频率 | 系统智能 |
| Light/Dark | 自动 |
| active/inactive | 自动 |
| 圆角集成 | shape 参数原生 |
| 性能 | GPU 独立通道 |

权威源:`0-originals/apple/liquid-glass/01-overview.md` + `02-adopting.md` + `swiftui/01-key-apis.md`

## 三、Tier 2 — NSVisualEffectView(macOS 10.10+)

```swift
let effectView = NSVisualEffectView()
effectView.material = .sidebar
effectView.state = .followsWindowActiveState
effectView.blendingMode = .behindWindow
```

| 属性 | 值 |
|---|---|
| Material 选择 | 11 种(titlebar / sidebar / menu / popover / headerView / sheet / windowBackground / hudWindow / fullScreenUI / tooltip / underWindowBackground / contentBackground / sidebar) |
| State | `.followsWindowActiveState` / `.active` / `.inactive` |
| Blending | `.behindWindow`(默认)/ `.withinWindow` |

## 四、Tier 3 — Windows 11 Mica / Acrylic

```xaml
<Window.SystemBackdrop>
  <DesktopAcrylicBackdrop />
</Window.SystemBackdrop>
```

| 材质 | 用途 |
|---|---|
| **Mica** | 窗口基础层(opaque + 桌面 tint) |
| **Acrylic(Background)** | 跨窗口弹层、菜单 |
| **Acrylic(In-app)** | 同窗口内浮层 |
| **Smoke** | Modal 对话框(always black 50%) |

权威源:`0-originals/microsoft/acrylic.md` + `0-originals/microsoft/fluent2-material.md`

## 五、Tier 4 — Web `backdrop-filter`

```css
.glass {
  background-color: rgb(255 255 255 / 50%);
  backdrop-filter: blur(20px) saturate(180%);
}
```

**优点**:
- 跨平台、跨 webview
- 实现成本低

**缺点**(权威源:MDN `backdrop-filter`):
- 采样源 = 元素后内容,**不是整个窗口后**
- 无系统 tint
- 无 active/inactive 自动
- 无 Light/Dark 自动(需 CSS var)
- Backdrop root 限制(opacity < 1 / filter / mask 会截断)
- 性能:webview 重绘时连带重算

## 六、Tier 5 — Web + Tauri `transparent: true`(本项目当前)

```jsonc
{
  "transparent": true,
  "macOSPrivateApi": true
}
```

```css
body { background: transparent; }
.glass { backdrop-filter: blur(20px); }
```

**核心问题**(权威源:Apple HIG Materials + Tauri docs):
- WKWebView 完全 transparent → **没有任何层提供 base color**
- 后面窗口(终端、浏览器、其他 app)直接穿透
- vibrancy 失去锚点 → 不可读

**对比**:
| 维度 | Tier 5 | Tier 1/2(macOS) |
|---|---|---|
| Base color | 无 | 系统提供 |
| 采样源 | 仅 webview 后 | 整个窗口后 |
| 系统 tint | 无 | 自动 |
| Light/Dark | 手动 | 自动 |
| active/inactive | 无 | 自动 |

## 七、Tier 决策树

```
目标平台是 macOS?
├── 是
│   ├── macOS 26+ 可用? ─ 是 → Tier 1(NSGlassEffectView / SwiftUI .glass)
│   │                  └─ 否 → Tier 2(NSVisualEffectView)
│   └── 仅 web 技术栈? ──── → Tier 5 + body 半透明 base color(过渡)
└── 否(Windows / Linux)
    ├── Windows 11 ──────── → Tier 3(Mica + Acrylic)
    ├── Windows 10 ───────── → Tier 4(纯 backdrop-filter)
    └── Linux / 其他 ────── → Tier 4
```

## 八、对 mindtap V0.1.x 的 Tier 路径建议

| 阶段 | Tier | 备注 |
|---|---|---|
| V0.1.x(当前) | Tier 5 + body 半透明 base color | 短期方案,1 行 CSS |
| V0.2.x | Tier 2(NSVisualEffectView 注入) | Rust 端 objc |
| V0.3.x+ | Tier 1(NSGlassEffectView) | macOS 26+ |

---

**引用源**:
- Apple Liquid Glass — `0-originals/apple/liquid-glass/`
- Apple SwiftUI API — `0-originals/apple/swiftui/`
- Microsoft Acrylic — `0-originals/microsoft/acrylic.md`
- Microsoft Fluent 2 Material — `0-originals/microsoft/fluent2-material.md`
- MDN backdrop-filter — `0-originals/mdn/backdrop-filter.md`
- Tauri v2 Window Customization — `0-originals/tauri/v2-window-customization.md`