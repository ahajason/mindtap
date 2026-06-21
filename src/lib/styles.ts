/**
 * 共享样式常量 — V0.1.2 P0-2 修复
 *
 * 用途: 6 个 StyleGuide 子页面根容器统一规范
 * 铁律: 内容层(L3)禁止使用 Liquid Glass,改为实色 / ≥ 92% alpha
 * spec:  1-design/01-glass-layer-rules.md §一 + §二 L3
 *        2-issues/P0-foundation/02-content-layer-liquid-glass.md 路径 F-1
 */

/** L3 内容层容器 — 5% 半透明实色,圆角 20px,内 padding 16px,子项间距 16px */
export const contentContainer =
  'rounded-[var(--radius-card)] bg-white/95 p-[var(--spacing-4)] space-y-[var(--spacing-4)]';

/** L2 容器层 — glass-l2 加 inset border 用于强调 */
export const containerL2 =
  'glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)] space-y-[var(--spacing-4)]';