# chore(tailwind): glassic ui 落地 @theme + glass utilities

> 创建: 2026-06-21

## Why
spec 里的色值/模糊/圆角/字号需要落到 Tailwind 4 @theme 才有 utility 可用,
glass-l1/l2/l3 utilities 是 ui 组件的基础 class。 不落地的话,
后续 11 个组件每个自己写 CSS 变量值,既冗余又易飘。

## What
src/index.css 增量。

## Done when
- [ ] @theme block 含色彩/玻璃 4 要素/圆角/间距/字号/动效
- [ ] .glass-l1/.glass-l2/.glass-l3 utilities 渲染符合 spec §二
- [ ] body 有冷蓝渐变背景(spec §三.1)
- [ ] npm run build 通过