# fix(floating): 黑边仍有 — V0.2.0.4 fix (border:0) 没拦干净回归

> 创建: 2026-07-13
> 旧目录: `docs/tasks/v0.2.8-fix-black-border/`(2026-07-13 按 `docs/governance/versioning-rule.md` §三 回退)
> 版本: V0.2.0.8(V0.2.0 的第 8 个 PATCH)
> 优先级: P1(V0.2.0.4 修了但回归,已知问题必修)
> **归属判定**: 见 [`docs/tech/v0.2.0-floating-window-tech.md` §1.3 + §6.1`](../../tech/v0.2.0-floating-window-tech.md) — 浮窗边框是 §1.1 "在范围内"项(浮窗 UI 视觉)
> **关联 PRD**: [`docs/prd/v0.2.0-floating-window-prd.md` §3.1 折叠态 + §4 非功能需求-视觉](../../prd/v0.2.0-floating-window-prd.md)
> **关联 retro**: [`docs/reports/v0.2.0-retrospective.md`](../../reports/v0.2.0-retrospective.md)(待补)

## Why

V0.2.0.4(即原 V0.2.6)commit `48f4dbd` 报过"1px 黑边" P0,用 `.floating-root { border: 0 }` + `.glass-l1/l2/l3 { border: 0 }` 修。`src/floating/App.test.tsx` 还有 5 处 `border:0` 断言。

但用户 D:\ 端实测发现黑边**仍在** —— CSS `border:0` 测试拦不住 `outline` / `box-shadow inset` / WebView2 system window chrome。算 P1 已知问题回归必修。

**业务影响**:`docs/prd/v0.2.0-floating-window-prd.md` §4 非功能需求(玻璃外观生效 + 视觉规范对齐)被破坏;`docs/design/glassic-ui-spec.md` 玻璃边缘与窗口外背景的平滑过渡无法实现。

详细 root cause 假设 + 歧义澄清 + 排查命令: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 C(5 假设 + 4 歧义点)。

## What

修 `src/floating/styles/floating.css` / `StatusDot.css` / `src-tauri/tauri.conf.json`:排查 box-shadow inset 模拟边框,tauri.conf.json 主窗 `decorations:true` 是否生效,`backdrop-filter` blur 边缘亚像素渲染,或 `.floating-root` 没显式 `background-color` 让 WebView2 transparent 浮窗填 `#000`。

最终行为:浮窗 4 边无可见黑边框(玻璃边缘和窗口外背景平滑过渡)。

## Done when

- [ ] DevTools(D:\ 端 F12)选中 `.floating-root` + `.glass-l1/l2/l3`,computed `border / outline / box-shadow` 都无可见描边
- [ ] 截图浮窗 4 角像素 RGB 检查,边缘非黑色(RGB 各通道 > 30)
- [ ] `src-tauri/tauri.conf.json` 主窗 `decorations` 配置验过;或浮窗段确实独立无 OS chrome
- [ ] `src/floating/App.test.tsx` 加 vitest 测试:`floating.css` 不含任何 `border: 1px` / `outline:` / `box-shadow: inset` 字样(CSS 字符串扫描,排除注释行)
- [ ] **L1 vitest 全套 PASS**
- [ ] **L3 D:\ 用户实测**: 单屏 + 4K 缩放 + 副屏 3 环境下浮窗都无黑边
- [ ] 沉淀: task.md 跟业务代码同 commit;写一行到 `docs/reports/v0.2.0-retrospective.md`

## 反模式防御

- **反模式 14**:不要分散 commit,一次修完
- **反模式 15**:commit claim "修黑边" 写完用 `grep -rn "border: 1px\|outline: \|box-shadow: inset" src/floating/styles/` 自查
- **反模式 16**:测试用 `expect(computedStyle.outline).toBe('none')` 行为断言 + 排除注释行;不用源码 regex 命中注释
- **反模式 17**:不用 gh CLI / GitHub MCP 写 issue/PR,走 web
- **反模式 18**:CSS 静态扫描 regex 时**先剥 `@media` / `@supports` / `@keyframes` 嵌套块**,否则同名选择器在嵌套块里会误命中

## 关联

- Tech §1 范围边界: `docs/tech/v0.2.0-floating-window-tech.md`
- PRD §3.1 折叠态 + §4 非功能: `docs/prd/v0.2.0-floating-window-prd.md`
- Design 视觉规范: `docs/design/glassic-ui-spec.md`
- 治理规则: `docs/governance/versioning-rule.md` §三 + `docs/governance/l3-gating.md`
- L3 findings 来源: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 C
- 沉淀到 retro: `docs/reports/v0.2.0-retrospective.md`(待补)