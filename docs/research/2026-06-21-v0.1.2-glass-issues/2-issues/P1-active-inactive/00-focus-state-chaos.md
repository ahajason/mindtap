# P1 · focus 状态混乱问题(解决 #53)

> **优先级**: P1(架构性问题,影响全部页)
> **创建**: 2026-06-21
> **状态**: **待解决** — 路径已确定,实施待用户决策
> **关联设计规范**: [`../../1-design/10-focus-state-spec.md`](../../1-design/10-focus-state-spec.md)
> **关联原始资料**:
> - `0-originals/mdn/focus-visible.md`
> - `0-originals/apple/liquid-glass/02-adopting.md` §3
> - `0-originals/apple/hig/08-accessibility.md`
> - `0-originals/wcag/1.4.11-non-text-contrast.md`

---

## 一、问题陈述

根据 Image #4-#8 视觉反馈 + 用户原话:

> "它现在变化的情况好像有点混乱,就是并没有说 native traffic light 和整个窗口是一致的"

**表现**:
1. **窗口 active/inactive 时,Sidebar 玻璃不变**:macOS traffic light 暗下去,但 Sidebar glass-l2 保持同样 vibrance
2. **NavLink active 跟 hover 视觉冲突**:active 是 brand bg + white,hover 是 `rgba(0,0,0,0.04)`,鼠标点击后短暂看起来像 active 然后又消失
3. **键盘 Tab 聚焦 NavLink 无 ring**:键盘用户无法看出当前 focus 在哪里(没有 `:focus-visible` 实现)
4. **PageHeader 描述 vs Section 标题 active 状态不一致**:PageHeader 的 active 用 brand color,Section title 的 active 用 underline
5. **Window inactive 时,PageHeader 仍 vibrant**:窗口失焦后内容区不应比 chrome 更显眼

## 二、根因分析(从浅到深)

### 表层(实施问题)

| # | 原因 | 位置 |
|---|---|---|
| 1 | CSS 无 `window-active` / `window-inactive` 状态切换 | `src/index.css` |
| 2 | NavLink 用 `:hover` 而非 `:focus-visible` | `src/components/layout/Sidebar.tsx` |
| 3 | glass token 没有"inactive 变体" | `src/index.css` `--glass-fill-1/2/3` |
| 4 | PageHeader / Section 各自定义 active,无统一 token | `src/components/styleguide/PageHeader.tsx` + 各 Section |

### 中层(架构问题)

| # | 原因 |
|---|---|
| 5 | 没有"3 层 focus 模型"概念 — Window/Nav/Focus 混在一起 |
| 6 | focus ring 样式被某个 button 的 `outline: none` 全局覆盖 |

### 深层(范式违反)

| # | 原因 | 出处 |
|---|---|---|
| 7 | Web 模拟无法监听 macOS keyWindow 事件,只有 document.hasFocus() | Tier 5 局限(`0-originals/tauri/v2-window-customization.md`) |
| 8 | 玻璃材质在 inactive 时的变化需要 NSVisualEffectView 才能完美实现 | Apple Liquid Glass adopting §3 |

## 三、设计匹配(对应 `1-design/10-focus-state-spec.md`)

| 设计章节 | 解决根因 |
|---|---|
| §3 Window active/inactive(Layer 1) | 解决根因 1、5、7、8 |
| §4 Navigation active(Layer 2) | 解决根因 4 |
| §5 Keyboard focus / hover(Layer 3) | 解决根因 2、3、6 |

## 四、3 个实施路径(按改动量)

### 路径 F1:**最小 CSS 修正**(0.5 天)

只解决根因 1、2、3、4:

```css
/* 1. window-inactive 状态 */
.window-inactive .glass-l2 {
  --glass-tint: rgba(255,255,255,0.40);
  --glass-blur: 14px;
  --glass-saturation: 140%;
}

/* 2. focus-visible 替代 focus */
.nav-link:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 2px;
}

/* 3. active 加 inset border(色盲友好) */
.nav-link[aria-current="page"] {
  border-left: 2px solid var(--brand-500);
}
```

| 维度 | 评价 |
|---|---|
| 改动量 | 1 文件,~20 行 CSS |
| 解决根因 | 1、2、3、4 |
| 未解决 | 5、6、7、8(架构性) |
| 推荐度 | ⭐⭐ 短期过渡方案 |

### 路径 F2:**3 层 focus 模型完整实施**(1.5 天)

实施 [`1-design/10-focus-state-spec.md`](../../1-design/10-focus-state-spec.md) §1-§11 全部内容:

1. 新增 `useWindowActive()` hook
2. 顶层 Layout 监听 focus/blur/visibilitychange,设 `.window-inactive` class
3. 抽出 NavLink 组件统一 active + focus 视觉
4. glass token 加 `--glass-tint-blur-inactive` 变量
5. PageHeader / Section 统一 active 视觉

| 维度 | 评价 |
|---|---|
| 改动量 | 3-4 文件,~80 行 |
| 解决根因 | 全部 |
| 长期可维护 | ✅ |
| 推荐度 | ⭐⭐⭐ **推荐** |

### 路径 F3:**Tauri Tier 2 升级**(1 周)

Rust 端注入 NSVisualEffectView + `.followsWindowActiveState`,完全系统级:

```rust
// src-tauri/src/lib.rs
let effect = NSVisualEffectView::new();
effect.setMaterial(NSVisualEffectMaterial::Sidebar);
effect.setState(NSVisualEffectState::FollowsWindowActiveState);
```

| 维度 | 评价 |
|---|---|
| 改动量 | 50+ 行 Rust,需 extensive smoke 测试 |
| 解决根因 | 全部 + 7、8(Web 无法模拟的) |
| 风险 | objc NSException 风险 |
| 推荐度 | ⭐⭐ 长期方案,需配合 F2 一起 |

## 五、推荐路径

**F2 立即实施 + F3 后续升级**

理由:
- F2 解决 90% 的混乱问题(架构清晰)
- F3 是终极方案,但需要 Tauri 集成测试,延后到 V0.2.x
- 不做 F2 直接做 F3 风险太大(独立项)

## 六、自检清单

完成 F2 后,验证:

| 检查项 | 方法 |
|---|---|
| Window active 时 Sidebar 玻璃 vibrance 强 | 目测对比 |
| Window inactive 时 Sidebar 玻璃明显降 vibrance | 点击其他窗口观察 |
| 键盘 Tab 聚焦 NavLink 有 visible ring | Tab 4 次观察 |
| 鼠标点击 NavLink **无** ring 残留 | 点击后观察 |
| Active NavLink 有 inset left border 2px | dev tools 查 `:focus-visible` |
| PageHeader active 跟 NavLink active 视觉一致 | 视觉对比 |
| Reduce Motion 下 focus 无过渡动画 | 系统设置开启后观察 |
| Reduce Transparency 下 focus ring offset +1px | 系统设置开启后观察 |

## 七、关联 commit / 任务

| 关联 | 状态 |
|---|---|
| Task #53 V0.1.2 focus 状态混乱问题 | in_progress(本文件) |
| Task #42 V0.1.1 commit 决策 | in_progress(working tree 包含 Sidebar NavLink 改动) |
| 1-design/10-focus-state-spec.md | ✅ 已写 |
| 0-originals/mdn/focus-visible.md | ✅ 已写 |

---

**引用源**:
- 设计规范 — [`1-design/10-focus-state-spec.md`](../../1-design/10-focus-state-spec.md)
- 原始资料 — `0-originals/mdn/focus-visible.md` + `0-originals/apple/liquid-glass/02-adopting.md` + `0-originals/apple/hig/08-accessibility.md` + `0-originals/wcag/1.4.11-non-text-contrast.md`