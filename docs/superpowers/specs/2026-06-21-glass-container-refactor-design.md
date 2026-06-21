# Glass Container Refactor — Design Spec

> 日期: 2026-06-21
> 范围: V0.1.1 玻璃容器布局对照 macOS 系统设置参考图的精细化重构
> 状态: design approved,等待 spec review + implementation plan

---

## Context

V0.1.1 已交付以下能力(CSS 玻璃感 + 透明窗口 + macOS native drag):
- `src/index.css` `--glass-fill/border` 百分比化(CSS var 在 `rgba()` 中需要 percentage)
- `tauri.conf.json` `transparent: true` + `titleBarStyle: Overlay` + `macOSPrivateApi: true`
- `src-tauri/src/lib.rs` `NSWindow.setMovableByWindowBackground(Bool::YES)`
- `src/routes/StyleGuideLayout.tsx` 玻璃容器布局(fixed `top-8 inset-x-3 bottom-3`,圆角 `glass-l2`)
- `src/components/layout/Sidebar.tsx` 在玻璃容器内 normal flow

V0.1.1 视觉 smoke 通过(用户确认"能够拖拽了")。

**触发**:V0.1.1 交付后,用户对照 macOS 系统设置参考图(macOS 系统设置 → 辅助功能页),提出 5 项调整:

1. 标题位置调整(从玻璃容器顶横栏 → Sidebar 顶部)
2. Sidebar 几何(4 角圆,floating)
3. Nav 风格(无容器,icon + title 平铺)
4. 主区分组次级玻璃面板
5. 玻璃 level 反转(L1/L2 互换)

**约束**:
- 不修改玻璃参数数值(用户明确)
- 保留 macOS native traffic light(用户明确不改造)
- 不增加搜索框 / 账号区 / row ‹ 指示 / 主区顶部返回导航 / 子页面 PageNav(用户明确否定)

---

## Goal

把 V0.1.1 的玻璃容器布局对照参考图精细化,提升视觉一致性:

| 改动 | 旧(V0.1.1) | 新(本次) |
|---|---|---|
| 主玻璃容器玻璃 | glass-l2 | **glass-l1**(反转,更透) |
| Sidebar 玻璃 | glass-l2(沿用容器) | **glass-l2** + 浮动 4 角圆(独立 panel) |
| Nav 形态 | 分组标题 + row 列表(有容器感) | **icon + title 平铺**(无容器) |
| 主区分组 | 直接平铺 row | **glass-l3 圆角面板包裹分组** |
| 标题位置 | Sidebar 顶部 | **Sidebar 顶部**(保留位置但简化为单标题) |
| 交通灯 | native overlay(transparent 让位区) | **native overlay 保留**(不自定义) |

---

## Design Decisions

### D1. 玻璃 level 分配(**数值不动**)

| Level | 用途 | 当前 blur / fill |
|---|---|---|
| glass-l1 | **主玻璃容器**(整窗) | 24px / 42% |
| glass-l2 | **Sidebar**(floating) | 24px / 42% |
| glass-l3 | 次级玻璃面板(分组) | 28px / 50% |

**依据**:用户明确"L1 主、L2 sidebar、L3 分组";玻璃数值不动(用户明确)。
**反转效果**:主容器玻璃"实度"略降(Sidebar 之前跟主容器同 level,现在 Sidebar 用 L2 是用相同数值但作为独立 panel),整体层次更分明。

### D2. 主玻璃容器

| 属性 | 值 |
|---|---|
| 位置 | `fixed top-8 inset-x-3 bottom-3`(保留 native traffic light 让位) |
| 圆角 | `rounded-2xl` |
| 玻璃 | `glass-l1` |
| Body | `flex gap-3`(Sidebar + Main 间距 12px) |

### D3. Sidebar

| 属性 | 值 |
|---|---|
| 几何 | `w-60 ml-3 mt-3 mb-3 rounded-xl glass-l2` |
| 标题 | `<h1>轻念 · Mindtap</h1>` 顶部,`text-sm font-medium text-text-2` |
| 副标题 | 移除(简化为单标题) |
| Nav | 无容器,icon + title 平铺,`gap-1` |
| 选中态 | `bg-primary text-white rounded-md` |
| 默认态 | `bg-white/30 hover:bg-white/50` |
| 拖动 | NSWindow 接管,不需要前端 marker |

### D4. Nav(icon + title 平铺)

| 属性 | 值 |
|---|---|
| 分组标题 | **移除**(`<h2>` 删除) |
| 分组容器 | **移除**(无 `gap-3` 分组间距) |
| 每个 row | `<NavLink>` + Lucide icon + label |
| 行间距 | `gap-1`(4px) |
| 图标来源 | `lucide-react`(新增依赖) |
| 图标映射 | 见 § D7 |

### D5. 主区分组次级玻璃面板

| 属性 | 值 |
|---|---|
| 每组容器 | `<section className="glass-l3 rounded-xl p-2">` |
| 组间 | `space-y-4`(16px) |
| 内部 row | 保持现有样式 |
| row 间分隔线 | 1px `border-white/20` |

### D6. 交通灯

| 属性 | 值 |
|---|---|
| 实现 | **保留 macOS native traffic light** |
| 位置 | transparent 让位区(玻璃容器外,top 0-28px) |
| 自定义 | **不自定义**(用户明确不改造) |

### D7. nav-order 定义

新建 `src/lib/nav-order.ts`:

```ts
import { Sparkles, Square, MousePointerClick, TextCursorInput,
         MessageSquare, Layout, Palette, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navOrder: readonly NavItem[] = [
  { to: '/',          label: '设计语言',             icon: Sparkles,         end: true },
  { to: '/surface',   label: 'Card / Separator',     icon: Square },
  { to: '/button',    label: 'Button',               icon: MousePointerClick },
  { to: '/input',     label: 'Input / Textarea / Label', icon: TextCursorInput },
  { to: '/feedback',  label: 'Badge / Toast / Dialog',   icon: MessageSquare },
  { to: '/overlay',   label: 'Tooltip / Tabs',       icon: Layout },
  { to: '/tokens',    label: 'Token 速查',           icon: Palette },
] as const;
```

---

## File Changes

| 文件 | 类型 | 改动 |
|---|---|---|
| `src/index.css` | **不动** | 玻璃数值不动 |
| `src/routes/StyleGuideLayout.tsx` | 改 | 玻璃容器 `glass-l1` + Body `flex gap-3` |
| `src/components/layout/Sidebar.tsx` | 大改 | 简化 title + nav icon 平铺 + `glass-l2` |
| `src/lib/nav-order.ts` | 新 | § D7 |
| `src/pages/*.tsx`(6 个子页面) | 改 | 分组用 `glass-l3 rounded-xl p-2` 面板包裹 |
| `package.json` | 改 | 新增 `lucide-react` 依赖 |

**不创建**:`TrafficLights.tsx` / `PageNav.tsx` / `PageHeader.tsx`(撤回)

---

## Out of Scope

| 项 | 原因 |
|---|---|
| 玻璃参数数值调整 | 用户明确不动 |
| React 自定义交通灯 | 用户明确不改造 |
| 子页面顶部 PageNav | 用户明确不要 |
| 玻璃容器顶栏横条 | 已删(标题移到 Sidebar) |
| 搜索框 / 账号区 / row ‹ 指示 | 用户明确否定 |
| 主区顶部返回导航 | 用户明确否定 |

---

## Risks

| 风险 | 缓解 |
|---|---|
| `lucide-react` 包大小 | 仅 7 个 icon(tree-shake 后约 1-2 KB) |
| 6 个子页面改动范围 | 范围明确:每个子页面 `<section className="glass-l3 rounded-xl p-2">` 包裹 row 列表 |
| Sidebar 浮动 + 主区 margin 视觉平衡 | 通过 `gap-3`(12px)统一 Sidebar/Main 间距 |
| Sidebar 浮动后 macOS native traffic light 视觉对齐 | 让位区 28px 跟 Sidebar `mt-3`(12px) 内 padding 协同,native traffic light 跟 Sidebar 顶部"轻念 · Mindtap" 垂直分开 |

---

## Acceptance Criteria

1. ✅ 玻璃容器用 `glass-l1`(视觉更透)
2. ✅ Sidebar 用 `glass-l2`,4 角圆(`rounded-xl`),floating(margin 跟容器边缘 + 主区分隔)
3. ✅ Nav 无容器,icon + title 平铺(`gap-1`)
4. ✅ 主区分组用 `glass-l3 rounded-xl p-2` 面板包裹
5. ✅ 交通灯保留 macOS native,无 React 自定义
6. ✅ 玻璃参数数值(`--glass-fill-*` / `--glass-blur-*` / `--glass-border-*`)无变化
7. ✅ `npm run tsc --noEmit` 通过
8. ✅ `npm run tauri dev` 视觉 smoke 通过(对照参考图)
9. ✅ 拖动行为:玻璃容器空白处按下可拖动窗口,Sidebar / Main 内 button / link 正常 click(NSWindow.setMovableByWindowBackground 接管,V0.1.1 已交付,本次回归)
10. ✅ Nav 7 个 row 全部渲染,Lucide icon 显示正常,选中态 `bg-primary text-white` 高亮

---

## References

- V0.1.1 `task_plan.md`(项目根,gitignore)
- V0.1.1 `findings.md`(NSWindow.setMovableByWindowBackground 模式 + objc2 0.6 正确用法)
- 参考图:macOS 系统设置 → 辅助功能页(macOS 26 Liquid Glass 范式)
- `docs/design/glassic-ui-spec.md`(项目自有 Liquid Glass 视觉 spec)