# fix(floating): P0-9 复活 — 右键被折叠态根 div 抢占触发 toggle

> 创建: 2026-07-13

## Why

V0.2.7 5 bug 主流程已修 (commit c6fc6eb), 但用户 D:\ 端实测时发现浮窗**右键被抢占** —— 右键按下后变成折叠↔展开 toggle, 而不是弹原生/React 上下文菜单。V0.2.6 commit 6990327 (P0-9) 修过这路径 (改用 capture phase 原生 `addEventListener("contextmenu", ..., true)` 替代 React 合成 `onContextMenu`), 现在复发 = 主流程破坏, 必修。

详细 root cause 假设 + 歧义澄清 + 排查命令: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 A (5 假设 + 5 歧义点)

## What

修 App.tsx 折叠态根 div 的 mousedown handler: 区分 `e.button` (右键 = 2), 不当成 left button 0 走 setExpanded toggle; 同时验证 capture phase 原生 `addEventListener("contextmenu", ..., true)` 仍在, React 合成 `onContextMenu` 不应再有 (P0-9 切走的)。最终行为: 左键短按 = toggle, 左键拖动 = drag, 右键 = 弹 ContextMenu。

## Done when

- [ ] App.tsx 折叠态根 div onMouseDown 检查 `e.button === 0` 才走 setExpanded
- [ ] capture phase 原生 `addEventListener("contextmenu", ..., true)` 在 cleanup function 里有对应 `removeEventListener`
- [ ] App.tsx 不挂 React 合成 `onContextMenu` prop (V0.2.6 P0-9 切走的)
- [ ] App.fix.test.tsx (V0.2.7 新增) 加 1 个 vitest 测试: fireEvent.contextMenu 后 assert ContextMenu 组件渲染 / 不触发 setExpanded
- [ ] L1 vitest 全套 PASS (24 files / 113+ tests)
- [ ] L2 grep 反模式 15 防御: commit claim "修右键" → grep 代码命中
- [ ] L3 D:\ 用户实测: 右键浮窗弹 ContextMenu (含 "显示主窗" 等按钮), 不再触发折叠/展开 toggle
- [ ] 沉淀: task.md 跟业务代码同 commit; 写一行到 `v0.2.8-final-fix-retrospective.md` (如本次是该 patch 主成果)