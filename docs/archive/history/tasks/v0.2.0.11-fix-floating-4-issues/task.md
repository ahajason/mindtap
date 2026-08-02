# fix(floating): V0.2.0.11 PATCH — A [V0.2.0 误导] HTML 右键 ContextMenu 定位 + B [V0.2.0 误导] StatusDot 右上角错位 + C transparent + D 移除 transition (4 收口)

> ⚠️ **[作废,见 V0.2.0.12]** 本任务中 A 段(HTML ContextMenu)与 B 段(StatusDot 右上角)基于"V0.2.6 误改"的错误前提,V0.2.0.12 PATCH 已恢复 V1.0 archive(A = Rust 原生 Menu;B = inline-block flex 最左)。C/D 段(transparent + 移除 transition)在 V0.2.0.12 中也被替代方案覆盖。保留本文件仅作历史档案。详见 [`docs/tasks/v0.2.0.12-restore-v1-archive-design/task.md`](../../tasks/v0.2.0.12-restore-v1-archive-design/task.md) + [`docs/reports/v0.2.0.12-release-notes.md`](../../reports/v0.2.0.12-release-notes.md)。

> **[V0.2.0 误导]** 本文件中 A 段(HTML ContextMenu)与 B 段(StatusDot 右上角)基于 V0.2.6 误改的描述,V0.2.0.12 PATCH 已恢复 V1.0 archive(A = Rust 原生 Menu;B = inline-block flex 最左)。本文件保留只作历史档案。

> 创建: 2026-07-13
> 旧目录: 无(新 PATCH,4 issue 一次性收口)
> 版本: **V0.2.0.11**(V0.2.0 的第 11 个 PATCH)
> 优先级: **P1**(V0.2.0 浮窗 4 issue 收口;user 已 L3 重测发现 4 issue 都没真修)
> **归属判定**: 见 [`docs/tech/v0.2.0-floating-window-tech.md` §1 + §4.2 + §7.2`](../../tech/v0.2.0-floating-window-tech.md) — A/B 在 scope, C 是 V0.2.0 收口目标, D 不在 scope(PRD §3.2 无 transition)
> **关联 PRD**: [`docs/prd/v0.2.0-floating-window-prd.md` §3.1 折叠态](../../prd/v0.2.0-floating-window-prd.md) + §3.2 展开态
> **关联 retro**: [`docs/reports/v0.2.0-retrospective.md`](../../reports/v0.2.0-retrospective.md)(待补)

## Why

V0.2.0.6 ~ V0.2.0.10 五个 PATCH 都涉及浮窗,user L3 重测发现 4 issue 都没真修:

| Issue | V0.2.0.6~10 反复修 | 真根因 | 反模式 |
|---|---|---|---|
| **A** ContextMenu 不弹 | 加 capture phase listener / `e.button !== 0` 守卫 | [V0.2.0 误导] HTML React ContextMenu.tsx 单向 `Math.min` 做 bottom clamp;折叠态 `window.innerHeight=36` 时 `innerHeight-120=-84` → top:-84 跑 viewport 外;展开态 ContextMenu JSX 不渲染(实为 V0.2.6 误改产物,V0.2.0.12 PATCH 已删 HTML 改 V1.0 archive Rust 原生 Menu) | 反模式 14(反复修)+ 16(测试用 `fireEvent.contextMenu` 不传 button 测了"左键弹菜单") |
| **B** StatusDot 错位 4px | 反复改 `top-0.5 right-0.5` → `top-1 right-1` | `.floating-root` 缺 `position: relative`,StatusDot `absolute` 穿透到 body 当祖先 → 跑 viewport 角落错位 | 反模式 14(反复改 StatusDot 类名)+ 15(注释把功劳归错 StatusDot 而非根 div) |
| **C** 黑边(focus 后更明显) | 删 `.floating-root` inset / FoldedBar inline style box-shadow | `tauri.conf.json` floating 段 `transparent:false` + 无 `backgroundColor` 字段,WebView2 transparent 半透明合成时仍出灰色描边;App.test.tsx V0.2.6 回归测试反向 lock-in 锁死 `transparent:false` | 反模式 15(commit 谎改:声称 transparent iterate 但配置 transparent:false;测试反向 lock-in) |
| **D** 折叠↔展开 transition 看不到 | 加 `transition: width 200ms ease-out, height...` + `@media (prefers-reduced-motion: reduce) { transition: none }` 兜底 | `@media (prefers-reduced-motion: reduce)` 在 Tauri WebView2 transparent 模式下可能被错误匹配(Win11 / 高 DPI / 远程桌面常传 reduce),即使 user 没设系统偏好,transition 仍被 `none` 覆盖;且 PRD §3.2 只提物理尺寸 360×280 无 transition 要求 | 反模式 14(反复声称加过渡)+ 15(comment 谎改)+ PRD scope 误判 |

**业务影响**:浮窗 4 issue 复活 / 误修,user 看到的是"反复声称修了但实测未修"的反复跳票,破坏 V0.2.0 浮窗收口承诺。

## What

### [V0.2.0 误导] A 修 (HTML ContextMenu 定位 + 展开态渲染 + capture phase button guard) — V0.2.0.12 已删 HTML React 组件,改 V1.0 archive Rust 原生 Tauri Menu

1. **`ContextMenu.tsx`** [V0.2.0 误导]:加 `MENU_W=144 / MENU_H=80 / VIEWPORT_MARGIN=4` 常数 + `clampToViewport(x, y)` 函数做双向 `Math.max / Math.min` clamp(修 top/left 都不出 viewport)(V0.2.0.12 已删 HTML ContextMenu.tsx,改 V1.0 archive Rust 原生 Tauri Menu)
2. **`App.tsx`**:`onContextMenuCapture` 加 `if (e.button !== 2) return;` 守卫(左/中键不该触发)
3. **`App.tsx`**:ContextMenu 渲染从折叠态 JSX 移到外层(折叠 + 展开态共用),展开态右键也能弹 ContextMenu(user L3 报"左键展开后右键反而切换状态" — 实际是展开态 JSX 不渲染 ContextMenu,user 看不到菜单误读为状态切换)

### B 修 (`.floating-root` 加 `position: relative`)

1. **`floating.css`** [V0.2.0 误导]: `.floating-root` 块加 `position: relative;` 作为首条声明(让 StatusDot `absolute top-1 right-1` 找根 div 当祖先)(V0.2.0.12 改回 V1.0 archive: StatusDot = inline-block flex 第 1 child,根本不需要 `position: relative` 兜底)
2. **`StatusDot.tsx`** [V0.2.0 误导]: 注释修正 — V0.2.0.7 改 `top-1 right-1` 是必要非充分;真正 fix 是根 div 加 relative(反模式 14/15 注释纠错)(V0.2.0.12 改回 V1.0 archive: StatusDot 无 absolute,V0.2.0.7 `top-1 right-1` 改类名本就是误导)

### C 修 (tauri.conf.json floating 段 transparent + backgroundColor)

1. **`tauri.conf.json`**: floating 段 `transparent: false` → `true` + 加 `backgroundColor: "#00000000"`(WebView2 transparent 窗口必须显式 alpha=0)
2. **`App.test.tsx`**: V0.2.6 旧 describe "transparent:false" 反向 lock-in 删,改 V0.2.0.11 C 锁住 `transparent:true + backgroundColor:#00000000 + resizable:true`(反模式 15 测试反向 lock-in 清理)

### D 移除 (transition + prefers-reduced-motion 不在 V0.2.0 scope)

1. **`floating.css`**: 删 `.floating-root` 块的 `transition: width 200ms ease-out, ...` 行 + 整个 `@media (prefers-reduced-motion: reduce) { .floating-root { transition: none } }` 块
2. **`App.fix.test.tsx`**: 删 V0.2.0.9 Bug 5 cosmetic describe 块(4 it: transition / width-height 子句 / 数值保留 / prefers-reduced-motion 兜底)
3. **`App.fix.test.tsx`**: 加 V0.2.0.11 D describe 锁住"无 transition / 无 prefers-reduced-motion / width-height-border-radius 数值保留"

### 锁住测试 (V0.2.0.11 新增 12 个 it)

`App.fix.test.tsx` + `App.test.tsx` 新增 describe 锁住 A/B/C/D:

- **A**: ContextMenu.tsx 含 `clampToViewport` fn + 双向 Math.max(top 双向)/Math.min;App.tsx `onContextMenuCapture` 含 `e.button !== 2` 守卫
- **B**: floating.css `.floating-root` 含 `position: relative` + `.floating-root.expanded` 数值层未破
- **C**: tauri.conf.json floating `transparent:true` + 含 `backgroundColor: "#00000000"` + `transparent:false` 已移除 + `resizable:true` 保留
- **D**: floating.css `.floating-root` 不含 `transition:` + 不含 `@media prefers-reduced-motion` + 数值层 width 320 / height 36 / border-radius 14 保留

## Done when

- [x] [V0.2.0 误导] ContextMenu.tsx 加 `clampToViewport` + `MENU_W/MENU_H/VIEWPORT_MARGIN` 常数 + 双向 clamp(V0.2.0.12 已删此 HTML 组件,改 Rust 原生 Menu)
- [x] App.tsx `onContextMenuCapture` 加 `e.button !== 2` 守卫
- [x] [V0.2.0 误导] App.tsx ContextMenu 渲染提到外层(折叠 + 展开态共用)(V0.2.0.12 改为外层调 `show_floating_context_menu` IPC)
- [x] floating.css `.floating-root` 加 `position: relative`
- [x] StatusDot.tsx 注释修正(B fix 真根因)
- [x] tauri.conf.json floating 段 `transparent: true` + `backgroundColor: "#00000000"`
- [x] App.test.tsx V0.2.6 反向 lock-in describe 替换为 V0.2.0.11 C 锁住
- [x] floating.css 删 `transition` 行 + `@media prefers-reduced-motion` 块
- [x] App.fix.test.tsx 删 V0.2.0.9 Bug 5 cosmetic describe(4 it)
- [x] App.fix.test.tsx + App.test.tsx 加 V0.2.0.11 锁住测试(12 it)
- [x] **L1 vitest 全套 PASS**: 140/140 (24 files;从 V0.2.0.10 132 净增 8 = 删 4 V0.2.0.9 + 加 12 V0.2.0.11)
- [x] **L2 grep 自查**:
  - `grep "boxShadow" src/floating/components/FoldedBar.tsx` = 0 hits
  - `grep "transition" src/floating/styles/floating.css` = 0 CSS 声明(只剩注释描述原因)
  - `grep "prefers-reduced-motion" src/floating/styles/floating.css` = 0 hits
- [x] `npx tsc --noEmit` = 0 error
- [x] `cargo check` = pre-existing warning only(`src/lib.rs:26` `e` unused, V0.2.5 commit 1b162eb5)
- [ ] **L3 D:\ 端实测**(user 必走): Ctrl+C 重启 `scripts\dev.bat` → 浮窗 4 issue L3 重测 — A 右键弹 ContextMenu(折叠 + 展开态) [V0.2.0 误导] HTML React ContextMenu(V0.2.0.12 已删,改 Rust 原生) + B StatusDot [V0.2.0 误导] 在浮窗右上角(V0.2.0.12 改回 V1.0 archive inline-block flex 最左) + C 无黑边(focus 后也不明显) + D 无 transition(也没 prefers-reduced-motion 误匹配)
- [ ] 沉淀:`docs/reports/v0.2.0.11-release-notes.md`(用户视角 5 行摘要)
- [ ] 通知 user D:\ `git pull origin develop`

## 反模式防御

- **反模式 14(反复修)**:4 issue 一次收口,不再分 PATCH — A 修 [V0.2.0 误导] ContextMenu 定位 + 展开态渲染 + button guard 一起(HTML React 实现,V0.2.0.12 改 V1.0 archive Rust 原生),B 修 [V0.2.0 误导] 根 div relative + 注释纠错(V0.2.0.12 改回 V1.0 archive inline-block flex,根本不需要 relative 兜底),C 修 tauri.conf.json + 反向 lock-in 测试清理,D 移除不在 scope 的 transition + 兜底块
- **反模式 15(commit 谎改)**:`grep "transition" src/floating/styles/floating.css` 验证 D 移除 commit claim 跟代码一致;tauri.conf.json floating transparent:true commit claim 跟代码一致;StatusDot.tsx 注释纠错不再把 B fix 功劳归 StatusDot 而归根 div
- **反模式 16(测试字面断言)**:`fireEvent.contextMenu(document, { button: 2, clientX: 50, clientY: 60 })` 显式传 button=2(修 V0.2.0.8 测试缺 button 维度的 bug);剥注释 + 剥 @media 嵌套后 match `.floating-root` 块(反模式 18 防御);`getFloatingWindowBlock` JSON 解析只匹配 floating 段不误伤 main 段
- **反模式 17**:不用 gh CLI / GitHub MCP 写 issue/PR,走纯 git + ssh(`git push origin develop` + D:\ `git pull`)
- **反模式 18**:CSS 静态扫描 regex 剥 `@media` / `@supports` / `@keyframes` 嵌套块后再 match `.floating-root` 块,跟 V0.2.0.10 同思路

## 跨 task 依赖

- **阻塞 V0.2.0.6 ~ V0.2.0.10 retro 收口**: V0.2.0.11 修 V0.2.0.6(A)/V0.2.0.7(B)/V0.2.0.8(C 黑边)/V0.2.0.9(D transition) 漏掉的真根因
- **影响 V0.2.0-retrospective §二 Bug 表**: A/B/C 行从"未完全修好"更新为"V0.2.0.11 PATCH 修复";D 行从"待重测"更新为"V0.2.0.11 不在 scope 已移除"

## 关联

- Tech §1 范围边界: [`docs/tech/v0.2.0-floating-window-tech.md`](../../tech/v0.2.0-floating-window-tech.md)
- PRD §3.1 折叠态 / §3.2 展开态: [`docs/prd/v0.2.0-floating-window-prd.md`](../../prd/v0.2.0-floating-window-prd.md)
- V0.2.0.6 A(漏修): [`../v0.2.0.6-fix-contextmenu-right-click/task.md`](../v0.2.0.6-fix-contextmenu-right-click/task.md)
- V0.2.0.7 B(漏修): [`../v0.2.0.7-fix-statusdot-displacement/task.md`](../v0.2.0.7-fix-statusdot-displacement/task.md)
- V0.2.0.8 C(漏修): [`../v0.2.0.8-fix-black-border/task.md`](../v0.2.0.8-fix-black-border/task.md)
- V0.2.0.9 D(不在 scope): [`../v0.2.0.9-fix-expanded-asymmetry/task.md`](../v0.2.0.9-fix-expanded-asymmetry/task.md)
- V0.2.0.10 C 二次根因: [`../v0.2.0.10-fix-foldedbar-inline-shadow/task.md`](../v0.2.0.10-fix-foldedbar-inline-shadow/task.md)
- L3 findings 来源: [`docs/reports/2026-07-13-v0.2.7-l3-findings.md`](../../reports/2026-07-13-v0.2.7-l3-findings.md)
- V0.2.5 commit 谎改审计: [`docs/reports/v0.2.0.4-33-commit-audit.md`](../../reports/v0.2.0.4-33-commit-audit.md)
- 治理规则: [`docs/governance/versioning-rule.md`](../../governance/versioning-rule.md) §三 + [`docs/governance/l3-gating.md`](../../governance/l3-gating.md)
- 沉淀到 retro: [`docs/reports/v0.2.0-retrospective.md`](../../reports/v0.2.0-retrospective.md)(待补)