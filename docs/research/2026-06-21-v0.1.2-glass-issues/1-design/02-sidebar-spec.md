# 02 · Sidebar 设计规范

> **层级**: 1-design / Sidebar
> **创建**: 2026-06-21
> **作用**: Sidebar 必须遵守的规范(从 Apple HIG Sidebars + NavigationSplitView 提取)
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/hig/04-sidebars.md`(Sidebar 6 最佳实践)
> - `0-originals/apple/hig/05-split-views.md`(Split View 三栏结构)
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(sidebar material)

---

## 一、Sidebar 在分层中的归属

**Sidebar 是 L2 容器层,必须使用玻璃材质。**

权威源:Apple HIG Materials — sidebar 是系统级专用材质,不是通用 glass。

## 二、6 最佳实践(权威源:Apple HIG Sidebars)

| # | 原则 | 规范 |
|---|---|---|
| 1 | **保留视觉层级** | Sidebar 是次要内容,主区域才是焦点。Sidebar 不能比 content 更显眼 |
| 2 | **一致的行高** | 所有 row 同一高度,active 状态用 tint + 加粗,不用色块 |
| 3 | **图标 + 文字** | 必须 icon + label 一起;不能只有 icon(可发现性低) |
| 4 | **section header 清晰** | section 之间用 semantic color 区隔,不用 divider |
| 5 | **可折叠** | 允许用户 collapse / expand;collapsed 时只有 icon |
| 6 | **键盘可达** | Tab 顺序、Cmd+数字快捷键、↑↓ 导航 |

## 三、几何规范

| 维度 | 值 | 出处 |
|---|---|---|
| **宽度** | 240-280px(mindtap 取 240px) | Apple HIG Split Views |
| **最小宽度** | 200px(collapsed 状态) | Apple HIG Sidebars |
| **垂直 padding 顶部** | 44-48px(macOS titlebar 28pt + 间距) | macOS HIG Windows |
| **水平 padding** | 16px | Apple HIG Sidebars |
| **底部 padding** | 16px | 通用 |
| **Row 高度** | 36-40px | Apple HIG Sidebars(舒适触摸) |
| **Row 圆角** | 8px | 内部组件圆角 |

## 四、玻璃规范

| 属性 | 值 |
|---|---|
| Material depth | `--glass-depth-2`(薄玻璃) |
| Backdrop-filter | `blur(20px) saturate(180%)` |
| Background | `rgba(255, 255, 255, 0.50)`(Light) / `rgba(20, 20, 20, 0.50)`(Dark) |
| Border | `1px solid rgba(255, 255, 255, 0.18)` |
| Inset top highlight | `inset 0 1px 0 rgba(255, 255, 255, 0.6)` |
| 圆角 | 16px(`--radius-container`) |

## 五、active/inactive 状态规范

| 状态 | 视觉 |
|---|---|
| **default** | 文字 `text-2`(#475467)+ 透明背景 |
| **hover** | 背景 `rgba(0,0,0,0.04)`,文字 `text-1` |
| **active/focus** | 背景 brand color(`#165DFF`)+ 文字 `white`,加粗 |
| **selected(系统级)** | inset left border `2px brand` + tint 背景 |

**系统级 active 状态**:如果 app 在 focus / key window,Sidebar 玻璃保持 vibrance;非 active 时,玻璃降低 blur 强度。

## 六、图标规范

| 元素 | 规范 |
|---|---|
| **图标样式** | `Hierarchical`(默认)/ `Mono`(导航类) |
| **图标尺寸** | 16x16pt(row 内) |
| **图标与文字间距** | 10px |
| **图标颜色** | `secondaryLabel` / `tertiaryLabel` 系统色 |

权威源:`0-originals/apple/hig/02-icons.md` + `0-originals/apple/hig/04-sidebars.md`

## 七、Section Header 规范

| 元素 | 规范 |
|---|---|
| **字号** | 11-12pt |
| **字重** | semibold(600) |
| **颜色** | `tertiaryLabel`(系统级灰色) |
| **transform** | uppercase 或 sentence case |
| **上下间距** | 上 16px / 下 6px |
| **左对齐** | 跟 row 文字左边缘对齐(共享 grid) |

## 八、Split View 整合(权威源:`0-originals/apple/hig/05-split-views.md`)

| 角色 | 位置 | 占比 |
|---|---|---|
| **Sidebar** | 最左 | 240px 固定 |
| **Content** | 中间 | flex 1 |
| **Detail** | 最右(可选) | 320-400px |

**统一原则**:Sidebar / Content / Detail 在同一窗口内,共享同一根 baseline(顶部对齐)。

## 九、无障碍

| 维度 | 规范 | 出处 |
|---|---|---|
| Reduce Transparency | 玻璃 → 95% alpha 实色 | Apple HIG Accessibility |
| Reduce Motion | 无 spring 动画 | Apple HIG Accessibility |
| VoiceOver | `role="navigation"` + `aria-label` | WCAG 4.1.2 |
| 键盘 | Tab 进入,↑↓ 导航,Enter 激活 | WCAG 2.1.1 |
| Focus ring | 2px brand color,≥ 3:1 对比 | WCAG 1.4.11 |

---

**引用源**:
- Apple HIG Sidebars — `0-originals/apple/hig/04-sidebars.md`
- Apple HIG Split Views — `0-originals/apple/hig/05-split-views.md`
- Apple HIG Materials — `0-originals/apple/liquid-glass/03-hig-materials.md`
- Apple HIG Icons — `0-originals/apple/hig/02-icons.md`
- WCAG 2.2 — `0-originals/wcag/`
- Apple HIG Accessibility — `0-originals/apple/hig/08-accessibility.md`