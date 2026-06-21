# P1 · macOS Traffic Light 跟 Sidebar 标题重叠

> **优先级**: 🟠 P1(几何冲突,影响 chrome 可见性)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三(垂直 padding 顶部 44-48px)
> **关联原始**:
> - `0-originals/apple/hig/04-sidebars.md`(macOS titlebar 28pt 标准)
> - `0-originals/tauri/v2-window-customization.md`(`titleBarStyle: "Overlay"` + `hiddenTitle: true`)

---

## 一、问题表现(Image #4-#8)

V0.1.1 之前 Sidebar `mt-3`(12px),Sidebar 标题 "轻念·Mindtap" 跟 macOS traffic light(关闭/最小化/最大化按钮)在 y=20~28px 重叠。

**V0.1.2 Task #52 临时修复**:Sidebar 改 `mt-10`(40px),让位 traffic light。

## 二、根因

macOS Overlay titlebar + hiddenTitle 时:
- traffic light 仍画在 (12, 12) 位置(高度约 20px)
- 内容从 y=0 开始,没有给 traffic light 让位
- Sidebar 标题 padding-top 没考虑 traffic light 占位

## 三、设计匹配

[`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三:

| 维度 | 值 | 出处 |
|---|---|---|
| **垂直 padding 顶部** | **44-48px**(macOS titlebar 28pt + 间距) | macOS HIG Windows |

**Apple HIG**:macOS 标准 titlebar 高度 28pt,加上 16px 视觉缓冲 = 44px。

## 四、解决路径

### 路径 T-1:Sidebar mt-11 替代 mt-10(V0.1.2 临时 — Task #52)

```jsx
<aside className="mt-10 ..." />  {/* 当前 V0.1.2 */}
```

```jsx
<aside className="mt-11 ..." />  {/* 微调到 44px */}
```

| 优点 | 1 字符改动 |
| 缺点 | 仍是硬编码,非 token |

### 路径 T-2:引入 --titlebar-height token

```css
:root { --titlebar-height: 44px; }
aside { margin-top: var(--titlebar-height); }
```

| 优点 | 复用 / 跨平台可调(macOS / Windows / Linux) |
| 缺点 | +1 token 维护 |

### 路径 T-3:Rust 端读取 macOS titlebar 实际高度

```rust
// NSWindow 标准 titlebar = 28pt
// 但 Overlay titlebar = 0pt(透明)
// Hidden = 0pt
// 用 44px 作为视觉安全距离
```

## 五、推荐

**T-2** — 引入 token,作为 V0.1.2 收尾。

## 六、自检

| 检查项 | 方法 |
|---|---|
| macOS traffic light 跟 Sidebar 标题间距 ≥ 16px | dev tools 量 `getBoundingClientRect` |
| Sidebar 顶部 y 坐标 ≥ 44px | 视觉 |
| token `--titlebar-height` 在 CSS 定义 | grep `src/index.css` |
| 切换 window decoration 时,Safe area 仍正常 | tauri dev 验证 |

---

**引用源**:
- 设计规范 — [`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三
- 原始资料 — `0-originals/apple/hig/04-sidebars.md` + `0-originals/tauri/v2-window-customization.md`