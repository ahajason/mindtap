# fix(tokens): G3 spacing 编号错位 + radius-button 12→10 + 玻璃 fill 收窄

> 创建: 2026-06-21

## Why
V0.1.0 玻璃 token 编号跟 Tailwind 默认 scale 不对齐(--spacing-5 = 24px 应是 20px),
Button 圆角 sm/md/icon 三档不一致(6/10/full),玻璃 fill 太厚(--glass-fill-1: 0.35)
导致"灰色塑料感"而非"玻璃 vibrance"。

不修:spacing token 引用错位 4px / Button 圆角视觉混乱 / 玻璃质感缺失。

## What
CSS token 重对齐:Tailwind 默认对齐 / 圆角 10px / 玻璃 fill 收窄 / 加 inset 顶部高光。

## Done when
- [x] --spacing-5: 24px → 20px, --spacing-6: 32px → 24px (G3 修复)
- [x] 新增 --spacing-7: 32px
- [x] --radius-button: 12px → 10px (全 Button 圆角统一)
- [x] --glass-fill-1/2/3: 0.35/0.42/0.50 → 22%/28%/36% (G3 降 fill)
- [x] glass-l1/2/3 加 inset 0 1px 0 rgba(255,255,255,0.6) 顶部高光 (G1)
- [x] body background: linear-gradient → transparent (V0.1.1 透明窗口)
- [x] 现有 var(--spacing-N) 引用 0 处,77 处 Tailwind 硬编码自动 = var(--spacing-N)
- [x] button.test.tsx 通过 (size prop 不变, 字号 13→14px 由 Phase 3 调整)