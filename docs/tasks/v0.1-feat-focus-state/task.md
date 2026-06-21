# feat(focus): 3 层 focus 模型 + useWindowActive + SidebarNavLink

> 创建: 2026-06-21

## Why
V0.1.1 玻璃容器重构后,用户反馈"focus 状态混乱":
- 键盘 Tab 聚焦 NavLink 无 visible ring
- NavLink 用 `:focus` 而非 `:focus-visible`,鼠标点击后 ring 残留
- active 跟 hover 视觉冲突(品牌色块 vs 浅色)
- 窗口 active/inactive 时 Sidebar 玻璃不变(切到其他 app 后 vibrance 不降)
- PageHeader 跟 Section active 状态不一致

## What
3 层 focus 模型:Layer 1 Window / Layer 2 Navigation / Layer 3 Keyboard。
新增 `useWindowActive` hook 检测窗口 focus,抽出 `SidebarNavLink` 统一 active + focus-visible + hover。

## Done when
- [x] src/hooks/useWindowActive.ts: 监听 focus/blur/visibilitychange,写 `<html data-window-active>`
- [x] src/hooks/useWindowActive.test.ts: 4 个 vitest 用例
- [x] src/index.css: `[data-window-active='false']` 玻璃降 vibrance(fill -8% / blur -6px)
- [x] src/components/layout/SidebarNavLink.tsx: 抽出 NavLink 子组件
- [x] aria-current="page" + bg-primary + font-semibold + border-l-2 brand (Layer 2 active)
- [x] focus-visible:ring-2 ring-primary ring-offset-2 (Layer 3 focus, WCAG 1.4.11)
- [x] hover:bg-black/[0.04] (Layer 3 hover)
- [x] <main> 加 p-[var(--spacing-6)] = 24px 对齐 Sidebar baseline(28px 内容左缘)
- [x] vitest 4/4 passed