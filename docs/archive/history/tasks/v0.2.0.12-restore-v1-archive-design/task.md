# fix(floating): V0.2.0.12 PATCH — 4 对象并行恢复 V1.0 archive 设计(A 原生 Menu + B StatusDot 位置 + C Rust 黑边 + D Active 开启路径)

> 创建: 2026-07-13
> 版本: **V0.2.0.12**(V0.2.0 的第 12 个 PATCH)
> 优先级: **P0**(4 个对象,user L3 重测全部发现 V0.2.0.11 PATCH 未真修)
> **关联 PRD**: [`docs/prd/v0.2.3-floating-window-native-menu-prd.md`](../../prd/v0.2.3-floating-window-native-menu-prd.md)
> **关联 Tech**: [`docs/tech/v0.2.3-floating-window-tech.md`](../../tech/v0.2.3-floating-window-tech.md)
> **归属判定**: 见 [`docs/tech/v0.2.3-floating-window-tech.md` §1 + §6.1](../../tech/v0.2.3-floating-window-tech.md) — 4 对象全在 scope

## Why

V0.2.0 ~ V0.2.0.11 共 11 次 PATCH 都涉及浮窗,user L3 重测发现 V0.2.0.11 仍漏修 4 类 issue:

| 对象 | V0.2.0.6 ~ V0.2.0.11 反复修的误导前提 | V1.0 archive 真相 | 反复修次数 |
|---|---|---|---|
| **A** ContextMenu | HTML React `ContextMenu.tsx`(V0.2.6 误改) | Rust 原生 Tauri Menu(`window.popup_menu(&menu)`) | 5 次 |
| **B** StatusDot 位置 | absolute 右上角(V0.2.x spec 误导) | inline-block flex 第 1 child(最左,标题前面) | 4 次 |  <!-- [V0.2.0 误导] -->
| **C** Rust 黑边 | transparent + backgroundColor + 改 CSS(V0.2.0.11) | `shadow: false` 关闭 DWM aura shadow(漏字段) | 3 次 |
| **D** Active 开启路径 | mousedown / click button guard(V0.2.0.6 / V0.2.0.11) | Radix pointerdown capture 守住 panel 内点击(在 blur 一拍前) | 2 次 |

**业务影响**:V0.2.0 浮窗 4 类 issue 全部未真修,user 看到"反复声称修了但实测未修"的反复跳票,破坏 V0.2.0 ~ V0.2.3 浮窗交付承诺。

## What

4 个对象完全独立,各 subagent 独立 worktree 并行修:

### A 修(ContextMenu = Rust 原生 Menu)

1. **删** `src/floating/components/ContextMenu.tsx` + `ContextMenu.test.tsx`(V0.2.6 误改的 HTML React 组件)
2. **新建** `src-tauri/src/tray/mod.rs` + `src-tauri/src/tray/menu.rs` + `src-tauri/src/tray/confirm.rs`(V1.0 archive 沿用)
3. **新建** `src-tauri/src/commands/floating_cmd.rs`(`show_floating_context_menu` command)
4. **改** `src-tauri/src/lib.rs`:`.plugin(tauri_plugin_autostart::init(...))` + `.on_menu_event(...)` 绑定 + `invoke_handler!` 加新 command
5. **改** `src-tauri/Cargo.toml`:加 `tauri-plugin-autostart = "2"`
6. **改** `src/lib/tauri-bridge.ts`:`app.showFloatingContextMenu` wrapper
7. **改** `src/floating/App.tsx`:`onContextMenuCapture` 内调 `api.app.showFloatingContextMenu()`(替代 `setContextMenu` / `<ContextMenu>`)

### B 修(StatusDot = inline-block flex 最左)

1. **改** `src/floating/components/StatusDot.tsx`:删 `POSITION_CLASS` map(V0.2.0.x `absolute top-1 right-1`),恢复 V1.0 archive inline-block 8×8 span
2. **改** `src/floating/components/FoldedBar.tsx`:`<StatusDot status={status} />` 不传 `position` prop
3. **改** `src/floating/App.tsx`:折叠态 JSX `<StatusDot status={...} />` 不带 `position="absolute"`
4. **改** `src/floating/styles/floating.css`:
   - 删 `.floating-root { position: relative }`(V0.2.0.11 B fix 加的,误导)
   - 恢复 V1.0 archive `.dot` flex item 样式 + `@keyframes pulse 1.6s`
5. **改** `src/floating/App.test.tsx` + `App.fix.test.tsx`:
   - 删 V0.2.0.11 B 锁住(`absolute` / `top-1 right-1` / `position: relative`)
   - 加 V0.2.0.12 锁住(inline-block + FoldedBar flex 第 1 child)

### C 修(Rust 黑边 = `shadow: false` 单字段)

1. **改** `src-tauri/tauri.conf.json` floating 段:
   - 加 `"shadow": false`(Tauri 2 默认 `true`,在 `decorations: false + transparent` 下产生 1px border / Win11 aura shadow / focus 后加重)
   - `"resizable": true` → `false`(浮窗固定 320×36 不需要 resize,避免 non-client edge / resize grip 残留)
   - 保留 V0.2.0.11 已加的 `transparent: true` + `backgroundColor: "#00000000"`
2. **不改** main 窗口配置(main 走另一条 DWM 路径,与 floating 黑边无直接关联,无依据不盲改)
3. **改** `src/floating/App.test.tsx`:加 V0.2.0.12 C 锁住(`tauri.conf.json` floating 段含 `"shadow": false` + `"resizable": false` + 已有 `transparent:true` + `backgroundColor:"#00000000"`)

### D 修(Active 开启路径 = Radix pointerdown capture)

1. **改** `src/floating/components/ExpandedPanel.tsx`:
   - 加 `panelRef = useRef<HTMLDivElement|null>(null)` + `dismissingRef = useRef(true)`(默认 panel 外才 cancel)
   - panel 根 div 加 `ref={panelRef}` + `onPointerDownCapture={(e) => { dismissingRef.current = !panelRef.current?.contains(e.target as Node); }}`
   - `handleBlur` 改为 `if (submittingRef.current) return; if (dismissingRef.current) onCancel();`
   - **blur listener 不删,只改逻辑**
2. **不改** `src/floating/App.tsx`:所有 `data-no-expand` / `e.button !== 0` / `onContextMenuCapture` 守卫保留
3. **改** `src/floating/components/ExpandedPanel.test.tsx`:
   - **删** 第 73-81 行 "失焦 (blur) 触发 onCancel" describe(把 bug 当 feature 锁住)
   - **加** panel 内 click 不折叠(Start 按钮 pointerdown → input blur → 不 cancel)
   - **加** panel 外 click 折叠(保留 spec §3.2 语义)
   - **加** Start async 路径中 blur 不折叠
   - **保留** Esc→onCancel + Enter→onStart 现有断言
4. **改** `src/floating/App.fix.test.tsx`:
   - **加** Issue 2 展开态右键不折叠(panel pointerdown capture 守住)
   - **加** Issue 4 点 Start 不折叠

## Done when

- [ ] A: `ContextMenu.tsx` 已删;`show_floating_context_menu` command 存在 + `popup_menu` 调用;`tray/menu.rs` 4 项菜单 ID 全命中;`lib.rs` 注册新 command + `on_menu_event` 绑定;`cargo check` 0 error(允许 `e` unused warning)
- [ ] B: `StatusDot.tsx` 渲染 inline-block span + 无 absolute;`FoldedBar.tsx` `<StatusDot status={status} />` 不传 position;`App.tsx` 折叠态 JSX 同上;`floating.css` 不含 `position: relative` + 含 `@keyframes pulse 1.6s`
- [ ] C: `tauri.conf.json` floating 段含 `"shadow": false` + `"transparent": true` + `"backgroundColor": "#00000000"` + `"resizable": false`;main 段不含 `"shadow": false`(误改防御)
- [ ] D: `ExpandedPanel.tsx` 含 `panelRef` + `dismissingRef` + `onPointerDownCapture` + `handleBlur` 改后逻辑;expanded-panel 旧 "blur 触发 onCancel" describe 删;panel 内 click 不折叠 + panel 外 click 折叠 + Start 不折叠共 4 新 it
- [ ] **L1 vitest 全套 PASS**: V0.2.0.11 140 → V0.2.0.12 142(-12 锁住 +14 新锁住 = +2)
- [ ] **L2 grep 自查全命中**:
  - `grep "absolute top-1 right-1" src/floating/components/StatusDot.tsx` = 0 hits
  - `grep "position: relative" src/floating/styles/floating.css` = 0 hits
  - `grep -rn 'ContextMenu\.tsx' src/` = 0 hits
  - `grep "shadow" src-tauri/tauri.conf.json` = floating 段 `"shadow": false` 命中
  - `grep "prefers-reduced-motion" src/floating/styles/floating.css` = 0 hits(沿用 V0.2.0.11)
- [ ] `npx tsc --noEmit` = 0 error
- [ ] `cargo check` = 0 error
- [ ] **I4 误导言论清理**: 13 doc 文件全部已标 `[V0.2.0 误导]`(本任务的 doc cleanup subagent 完成)
- [ ] **L3 D:\ 端实测**(user 必走): Ctrl+C 重启 `scripts\dev.bat` → 浮窗 6 issue L3 重测 — A 右键弹 OS 原生菜单 + B StatusDot 在折叠态最左 + C/D 展开态内点击不折叠 + E/F 无黑边(focus 后也不明显)
- [ ] 沉淀:`docs/reports/v0.2.0.12-release-notes.md`(用户视角 5 行摘要,见本任务的 release notes)
- [ ] 通知 user D:\ `git pull origin develop`

## 反模式防御

- **反模式 14(反复修)**:V0.2.0.6 ~ V0.2.0.11 共 11 次 PATCH 反复修,本次 4 对象一次收口,不再分散 commit
- **反模式 15(commit 谎改)**:commit message 引用 V1.0 archive 路径(.archive/src/...);不写"右上角"(那是 V0.2.x 误导),写"恢复到 V1.0 archive inline-block 实现";tauri.conf.json `shadow:false` commit claim 用 `grep -n "shadow" src-tauri/tauri.conf.json` 自查  <!-- [V0.2.0 误导] -->
- **反模式 16(测试字面断言)**:用 `fireEvent.pointerDown(button) + fireEvent.blur(input)` 真实模拟事件序列;用行为断言(`expect(win.startDragging).toHaveBeenCalled()` / `expect(setExpanded).not.toHaveBeenCalled()`)
- **反模式 17(gh/MCP 滥用)**:不用 gh CLI / GitHub MCP 写 issue/PR,走纯 git + ssh(`git push origin worktree-v0.2.0.12-*` + 主 agent `git fetch + merge --ff-only` 集成)
- **反模式 18(CSS regex 嵌套)**:CSS 静态扫描 regex 剥 `@media` / `@supports` / `@keyframes` 嵌套块后再 match `.floating-root` 块,跟 V0.2.0.10 同思路

## 跨 task 依赖

- **阻塞 V0.2.0.6 ~ V0.2.0.11 retro 收口**: V0.2.0.12 修 V0.2.0.6(A ContextMenu)/V0.2.0.7(B StatusDot)/V0.2.0.8(C 黑边)/V0.2.0.9(D transition)/V0.2.0.10(C 二次根因)/V0.2.0.11(4 收口未真修)漏掉的真根因
- **影响 V0.2.3 PRD**:本任务正式档基于 [`docs/prd/v0.2.3-floating-window-native-menu-prd.md`](../../prd/v0.2.3-floating-window-native-menu-prd.md)
- **影响 V0.2.0-retrospective §二 Bug 表**: A/B/C/D 行从"V0.2.0.11 修复"更新为"V0.2.0.12 真正修复";误导言论清理行从"未清理"更新为"V0.2.0.12 已标 [V0.2.0 误导]"
- **影响 docs/tasks/v0.2.0.{6,7,8,9,10,11}/task.md 文件顶部注释**: 顶部加 `[V0.2.0 误导]` 块,说明原文件基于 V0.2.x 误导前提,V0.2.0.12 已基于 V1.0 archive 重新实现

## 关联

- PRD: [`docs/prd/v0.2.3-floating-window-native-menu-prd.md`](../../prd/v0.2.3-floating-window-native-menu-prd.md)
- Tech: [`docs/tech/v0.2.3-floating-window-tech.md`](../../tech/v0.2.3-floating-window-tech.md)
- Release notes: [`docs/reports/v0.2.0.12-release-notes.md`](../../reports/v0.2.0.12-release-notes.md)
- V0.2.0 PRD(基础 spec): [`docs/prd/v0.2.0-floating-window-prd.md`](../../prd/v0.2.0-floating-window-prd.md)
- V0.2.0 Tech(基础 spec): [`docs/tech/v0.2.0-floating-window-tech.md`](../../tech/v0.2.0-floating-window-tech.md)
- V0.2.0.11 task.md(漏修 4 issue): [`../v0.2.0.11-fix-floating-4-issues/task.md`](../v0.2.0.11-fix-floating-4-issues/task.md)
- V0.2.0 release notes: [`../../reports/v0.2.0.11-release-notes.md`](../../reports/v0.2.0.11-release-notes.md)
- 治理规则: [`docs/governance/versioning-rule.md`](../../governance/versioning-rule.md) §三 + [`docs/governance/l3-gating.md`](../../governance/l3-gating.md)
- L3 findings 来源: [`docs/reports/2026-07-13-v0.2.7-l3-findings.md`](../../reports/2026-07-13-v0.2.7-l3-findings.md)
