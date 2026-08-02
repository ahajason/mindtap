# chore(meta): ponytail 精简 — 删死抽象 + 闭包化 + 依赖收缩
<!-- scope: meta 跨前后端 -->

> 创建: 2026-07-11

## Why

ponytail-audit 跑了 2 轮 (round 1 砍了 Rust mutex boilerplate + 9 deps;round 2 砍了 forwardRef/displayName 死抽象 + useFocusTicker 闭包化)。
每跑一次净 -X 行。下次再加新功能时不会出现"为什么这里有个没人调用的 ref"或"为啥 useFocusTicker 这么厚"的考古问题。

## What

ponytail ultra 模式跑 repo-wide audit,按 biggest-cut-first 顺序改后端 (Rust mutex 闭包化 / AppError 5 变体合 1 / dead import 删) + 前端 (forwardRef 死代码剥除 / useFocusTicker 闭包化 / contentContainer inline)。

## Done when

- [ ] tsc --noEmit 0 error
- [ ] vitest 73/73
- [ ] cargo test 9/9
- [ ] 净 -200+ 行
