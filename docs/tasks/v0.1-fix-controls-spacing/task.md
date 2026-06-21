# fix(controls): Button 圆角+字号统一 / Card padding prop / Label gap

> 创建: 2026-06-21

## Why
V0.1.1 交付的控件 3 处不一致:
- Button sm `text-[13px]` 跟 md `text-sm`(14px)字号不一致
- Button sm `rounded-md`(6px) / md `rounded-[12px]` / icon `rounded-full` 三档圆角混乱
- Card 内部 padding 在不同页面不一致:`Tokens.tsx` `p-3`(12px) vs `Surface.tsx` `p-4`(16px)
- Label + Input 之间 `gap-1`(4px)偏紧,Apple HIG 推荐 6-8pt

不修:Button 视觉混乱 / Card 跨页面大小不一致 / form 标签-输入难区分。

## What
Button 全用 `--radius-button`(10px)+ 字号 14px;Card 加 `padding` prop 默认 md=16px;
Label+Input 间距 4→8px。

## Done when
- [x] button.tsx: size.sm `rounded-[var(--radius-button)]` + `text-sm`, icon `rounded-[var(--radius-button)]`
- [x] card.tsx: 加 `padding` prop (none/sm/md/lg), 默认 md = 16px
- [x] Input.tsx: 3 处 `gap-1` → `gap-2`(8px)
- [x] Tokens.tsx: Card `p-3` → `padding="sm"`, 子项 `mb-3/gap-3/mb-2` → `var(--spacing-N)`
- [x] Surface.tsx: Card `p-4` → `padding="md"`
- [x] button.test.tsx + card.test.tsx 通过