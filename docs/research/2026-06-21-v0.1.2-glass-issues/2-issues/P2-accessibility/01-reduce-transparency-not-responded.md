# P2-3 · 未响应 Reduce Transparency 系统设置

> **优先级**: 🟡 P2(无障碍合规,Apple HIG 强制响应)
> **创建**: 2026-06-21
> **状态**: ✅ **已修复**(2026-06-21 @media (prefers-reduced-transparency: reduce) 降级)
> **修复 commit**: `9540ad9` feat(a11y): Reduce Transparency + Reduce Motion 降级
> **关联设计**: [`../../1-design/07-accessibility.md`](../../1-design/07-accessibility.md) §二
> **关联原始**:
> - `0-originals/apple/hig/08-accessibility.md` §"Reduce Transparency"
> - `0-originals/microsoft/acrylic.md` §"Usability and adaptability"
> - `0-originals/mdn/backdrop-filter.md`(prefers-reduced-transparency)

---

## 一、问题表现

用户在系统设置开启 "Reduce Transparency"(降低透明度)后,玻璃材质仍保持 vibrance + blur,未响应系统设置。

这违反:
- **Apple HIG Accessibility**(权威源:`0-originals/apple/hig/08-accessibility.md`)
- **WCAG 1.4.3**(对比度要求)
- 用户无障碍偏好

## 二、根因

CSS 未使用 `@media (prefers-reduced-transparency: reduce)` 媒体查询。

JS 未通过 `window.matchMedia('(prefers-reduced-transparency: reduce)')` 检测。

Rust 端未读取 `NSWorkspace.shared.accessibilityDisplayShouldReduceTransparency`(未来 Tier 2 方案)。

## 三、设计匹配

[`1-design/07-accessibility.md`](../../1-design/07-accessibility.md) §二 降级规则:

| 元素 | 正常 | Reduce Transparency |
|---|---|---|
| Sidebar | glass depth-2 | `rgba(245,249,255,0.95)` 实色 |
| Toolbar | glass depth-2 | `rgba(245,249,255,0.95)` 实色 |
| Card | glass depth-3 | `rgba(255,255,255,0.95)` 实色 |
| Modal | glass depth-4 | `rgba(255,255,255,0.98)` 实色 |
| Backdrop-filter | blur 启用 | `none` |

**权威源**(`0-originals/apple/hig/08-accessibility.md`):

```swift
// SwiftUI 检测
@Environment(\.accessibilityReduceTransparency) var reduceTransparency

// AppKit 检测
NSWorkspace.shared.accessibilityDisplayShouldReduceTransparency
```

**Microsoft Acrylic 原文**:

> In High Contrast mode, users continue to see the familiar background color of their choosing in place of acrylic. In addition, both background acrylic and in-app acrylic appear as a solid color: When the user turns off *Transparency effects* in Settings > Personalization > Colors. When Battery Saver mode is activated. When the app runs on low-end hardware.

## 四、解决路径

### 路径 A-1:CSS `@media` 响应(立即)

```css
@media (prefers-reduced-transparency: reduce) {
  .glass-l1, .glass-l2, .glass-l3 {
    backdrop-filter: none;
    background-color: rgba(245, 249, 255, 0.95);
  }
}
```

| 优点 | 纯 CSS,无需 JS |
| 标准 | [CSS Media Queries Level 5](https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-transparency)(Baseline 2024) |
| 兼容 | macOS Safari / Chrome / Firefox / Edge 全支持 |

### 路径 A-2:JS 增强(可选)

```js
const mq = window.matchMedia('(prefers-reduced-transparency: reduce)');
document.documentElement.classList.toggle(
  'reduce-transparency',
  mq.matches
);
mq.addEventListener('change', e => {
  document.documentElement.classList.toggle('reduce-transparency', e.matches);
});
```

### 路径 A-3:Rust 端读取 AppKit(未来 Tier 2)

```rust
// src-tauri/src/lib.rs
#[cfg(target_os = "macos")]
use objc2_app_kit::NSWorkspace;
let reduce = NSWorkspace::shared().accessibilityDisplayShouldReduceTransparency();
```

## 五、推荐

**A-1 立即**(纯 CSS,无风险,Web 标准)

A-2 / A-3 用于动态切换场景,本项目静态 CSS 已足够。

## 六、自检

| 检查项 | 方法 |
|---|---|
| `@media (prefers-reduced-transparency: reduce)` 加到 `src/index.css` | grep 验证 |
| 系统设置开启后,Safari DevTools 模拟 `prefers-reduced-transparency: reduce` | DevTools Rendering tab |
| glass 类在 reduce 模式下:`backdrop-filter: none`,background 实色 | dev tools 查 computed style |
| 视觉:Sidebar / Card 仍清晰可读 | 视觉 |
| 关闭 reduce 后立即恢复 | 切换测试 |

---

**引用源**:
- 设计规范 — [`1-design/07-accessibility.md`](../../1-design/07-accessibility.md) §二
- 原始资料 — `0-originals/apple/hig/08-accessibility.md` + `0-originals/microsoft/acrylic.md` + `0-originals/mdn/backdrop-filter.md`