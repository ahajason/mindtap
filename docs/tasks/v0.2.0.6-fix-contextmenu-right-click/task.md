# fix(floating): P0-9 复活 — 右键被折叠态根 div 抢占触发 toggle

> ⚠️ **[作废,见 V0.2.0.12]** 本任务的实现前提("V0.2.6 误改的 HTML React ContextMenu")已被 V0.2.0.12 PATCH 证伪,本任务**不再适用**。详见 [`docs/tasks/v0.2.0.12-restore-v1-archive-design/task.md`](../../tasks/v0.2.0.12-restore-v1-archive-design/task.md) + [`docs/reports/v0.2.0.12-release-notes.md`](../../reports/v0.2.0.12-release-notes.md)。保留本文件仅作历史档案。

> **[V0.2.0 误导]** 本文件基于"V0.2.6 误改的 HTML React ContextMenu 实现"前提 — V0.2.0 ~ V0.2.0.11 反复修 HTML React 组件,从未真修对。
> **[V0.2.0 误导]** 真实实现按 V1.0 archive: **Rust 原生 Tauri Menu**(`src-tauri/src/tray/menu.rs` + `window.popup_menu(&menu)`),而不是 HTML React 组件。
> **[V0.2.0 误导]** V0.2.0.12 PATCH 已删除 HTML `ContextMenu.tsx`,恢复 V1.0 archive Rust 原生 Menu 模式。本文件保留只作历史档案,**不**描述当前真实架构。
> 创建: 2026-07-13
> 旧目录: `docs/tasks/v0.2.8-fix-contextmenu-right-click/`(2026-07-13 按 `docs/governance/versioning-rule.md` §三 回退)
> 版本: V0.2.0.6(V0.2.0 的第 6 个 PATCH)
> 优先级: P0(P0-9 复活)
> **归属判定**: 见 [`docs/tech/v0.2.0-floating-window-tech.md` §1.3 + §6.1`](../../tech/v0.2.0-floating-window-tech.md) — 浮窗右键 = ContextMenu 触发是 §1.1 "在范围内"项
> **关联 PRD**: [`docs/prd/v0.2.0-floating-window-prd.md` §3.5 窗口关系](../../prd/v0.2.0-floating-window-prd.md)
> **关联 retro**: [`docs/reports/v0.2.0-retrospective.md`](../../reports/v0.2.0-retrospective.md)(待补)

## Why

V0.2.0.5(即原 V0.2.7,commit `c6fc6eb`)5 bug 主流程已修,但用户 D:\ 端实测时发现浮窗**右键被抢占** —— 右键按下后变成折叠↔展开 toggle,而不是弹原生/React 上下文菜单。

V0.2.0.4(即原 V0.2.6)commit `6990327`(P0-9)修过这路径——改用 capture phase 原生 `addEventListener("contextmenu", ..., true)` 替代 React 合成 `onContextMenu`。现在复发 = 主流程破坏。

详细 root cause 假设 + 歧义澄清 + 排查命令: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 A(5 假设 + 5 歧义点)。

**业务影响**:`docs/prd/v0.2.0-floating-window-prd.md` §3.5 业务规则第 2 条"浮窗右键菜单 → 退出应用(本期唯一正退出入口)"被破坏,用户失去正退出路径。

## What

修 `src/floating/App.tsx` 折叠态根 div 的 `onMouseDown` handler: 区分 `e.button`(右键 = 2),不当成 left button 0 走 `setExpanded` toggle;同时验证 capture phase 原生 `addEventListener("contextmenu", ..., true)` 仍在,React 合成 `onContextMenu` 不应再有(P0-9 切走的)。

最终行为:
- 左键短按 = toggle 折叠/展开
- 左键拖动 = drag 浮窗
- 右键 = 弹 ContextMenu(显示主窗 / 退出)

## Done when

- [ ] `src/floating/App.tsx` 折叠态根 div `onMouseDown` 检查 `e.button === 0` 才走 `setExpanded`
- [ ] capture phase 原生 `addEventListener("contextmenu", ..., true)` 在 cleanup function 里有对应 `removeEventListener`
- [ ] `src/floating/App.tsx` 不挂 React 合成 `onContextMenu` prop(V0.2.0.4 P0-9 切走的)
- [ ] `src/floating/App.fix.test.tsx`(V0.2.0.5 新增)加 1 个 vitest 测试:`fireEvent.contextMenu` 后 assert ContextMenu 组件渲染 / 不触发 setExpanded
- [ ] **L1 vitest 全套 PASS**(24 files / 113+ tests)
- [ ] **L2 grep 反模式 15 防御**: commit claim "修右键" → grep 代码命中
- [ ] **L3 D:\ 用户实测**(见 [`docs/governance/l3-gating.md`](../../governance/l3-gating.md)): 右键浮窗弹 ContextMenu(含"显示主窗"等按钮),不再触发折叠/展开 toggle
- [ ] 沉淀: task.md 跟业务代码同 commit;写一行到 `docs/reports/v0.2.0-retrospective.md`

## 反模式防御

- **反模式 14**:不要分散 commit,一次修完
- **反模式 15**:commit claim "修右键" 写完用 `grep -n "button === 0" src/floating/App.tsx` 自查
- **反模式 16**:测试用 `expect(setExpanded).not.toHaveBeenCalled()` 行为断言,不用源码 regex
- **反模式 17**:不用 gh CLI / GitHub MCP 写 issue/PR,走 web
- **反模式 18**:写 CSS selector 静态扫描时先剥 `@media` / `@supports` / `@keyframes` 嵌套块

## 关联

- 旧版本归档: `docs/projects/v0.2/`(2026-07-13 整体删除,内容已迁到 prd/domain/tech)
- Tech §1 范围边界: `docs/tech/v0.2.0-floating-window-tech.md`
- PRD §3.5 窗口关系: `docs/prd/v0.2.0-floating-window-prd.md`
- Domain 状态机: `docs/domain/v0.2-domain-model.md`
- 治理规则: `docs/governance/versioning-rule.md` §三 + `docs/governance/l3-gating.md`
- L3 findings 来源: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 A
- 沉淀到 retro: `docs/reports/v0.2.0-retrospective.md`(待补)