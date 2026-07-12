# fix(floating): Bug 5 cosmetic — 折叠展开不等宽 + 无下拉动画

> 创建: 2026-07-13
> 旧目录: `docs/tasks/v0.2.8-fix-bug5-cosmetic/`(2026-07-13 按 `docs/governance/versioning-rule.md` §三 slug 改写)
> 版本: V0.2.0.9(V0.2.0 的第 9 个 PATCH)
> 优先级: P2(cosmetic,不影响主流程,顺手修)
> **归属判定**: 见 [`docs/tech/v0.2.0-floating-window-tech.md` §1.3 + §6.1`](../../tech/v0.2.0-floating-window-tech.md) — 折叠/展开尺寸契约是 §1.1 "在范围内"项
> **关联 PRD**: [`docs/prd/v0.2.0-floating-window-prd.md` §3.1 折叠态 + §3.2 展开态](../../prd/v0.2.0-floating-window-prd.md)
> **关联 retro**: [`docs/reports/v0.2.0-retrospective.md`](../../reports/v0.2.0-retrospective.md)(待补)

## Why

V0.2.0.5(即原 V0.2.7)Bug 5 主流程修好(展开后位置不偏移),但用户实测发现 2 处 cosmetic:

1. 折叠态 width 由内容撑开(`size="small"`),展开态 = EXPANDED_W(360px),切换时 width 突变不连贯
2. 折叠→展开 瞬变无 transition,视觉上突兀

P2,不影响主流程,顺手修。

**业务影响**:`docs/prd/v0.2.0-floating-window-prd.md` §3.2 展开态业务规则第 1 条"浮窗物理尺寸 360×280"已硬契约,但折叠态 width 不固定(由内容撑开)违反 §3.1"浮窗物理尺寸 320×36"硬契约。Design 视觉规范(见 `docs/design/v0.2.0-floating-window-design.md`,待迁)中"折叠→展开应有 200-300ms ease-out 下拉动画"未实现。

## What

修 `src/floating/App.tsx` + `src/floating/styles/floating.css`:
- `.floating-root` 加固定 width(折叠态 = FOLDED_W = 320px,展开态 = EXPANDED_W = 360px),不由内容撑开
- 加 `transition: width <ms> ease, height <ms> ease`,让折叠→展开 下拉展开有动画

## Done when

- [ ] 折叠态 root width = FOLDED_W(320px,沿用 tauri.conf.json floating 段),不由内容撑开
- [ ] 展开态 root width = EXPANDED_W(360px)
- [ ] `.floating-root` CSS 含 `transition: width Xms, height Xms ease`
- [ ] `src/floating/App.fix.test.tsx` 加 vitest 测试:折叠态 + 展开态 root div 的 computed width 各自为 FOLDED_W / EXPANDED_W(用 happy-dom 测,排除注释行后源码 grep `transition: width` 命中)
- [ ] **L1 vitest 全套 PASS**
- [ ] **L3 D:\ 用户实测**: 折叠→展开 width 平滑过渡(建议 200-300ms ease-out,用户体感不卡顿)
- [ ] 沉淀: task.md 跟业务代码同 commit;写一行到 `docs/reports/v0.2.0-retrospective.md`

## 反模式防御

- **反模式 14**:不要分散 commit,一次修完
- **反模式 15**:commit claim "修展开动画" 写完用 `grep -n "transition: width" src/floating/styles/floating.css` 自查
- **反模式 16**:测试用 `expect(getComputedStyle(root).transition).toMatch(/width/)` 行为断言,排除注释行
- **反模式 17**:不用 gh CLI / GitHub MCP 写 issue/PR,走 web
- **反模式 18**:CSS 静态扫描 regex 时先剥 `@media` / `@supports` / `@keyframes` 嵌套块

## 关联

- Tech §1 范围边界: `docs/tech/v0.2.0-floating-window-tech.md`
- PRD §3.1 折叠态 + §3.2 展开态: `docs/prd/v0.2.0-floating-window-prd.md`
- Design 视觉规范: `docs/design/v0.2.0-floating-window-design.md`(待迁)
- 治理规则: `docs/governance/versioning-rule.md` §三 + `docs/governance/l3-gating.md`
- L3 findings 来源: `docs/reports/v0.2.7-final-fix-retrospective.md` §2 Bug 5 段
- 沉淀到 retro: `docs/reports/v0.2.0-retrospective.md`(待补)