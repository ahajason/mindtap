# fix(floating): 折叠态 StatusDot 错位 — 时有时无 + 仅右上漏一部分

> ⚠️ **[作废,见 V0.2.0.12]** 本任务的实现前提("StatusDot 右上角 absolute 定位")已被 V0.2.0.12 PATCH 证伪 — V1.0 archive 真实实现是 inline-block flex 第 1 child(最左)。保留本文件仅作历史档案。详见 [`docs/tasks/v0.2.0.12-restore-v1-archive-design/task.md`](../../tasks/v0.2.0.12-restore-v1-archive-design/task.md) + [`docs/reports/v0.2.0.12-release-notes.md`](../../reports/v0.2.0.12-release-notes.md)。

> **[V0.2.0 误导]** 本文件基于"StatusDot 右上角 absolute 定位"的错误前提 — V1.0 archive StatusDot 实现为 **inline-block 8×8 span,FoldedBar flex 第 1 child(最左,标题前面)**,无 absolute。
> **[V0.2.0 误导]** V0.2.x 反复修改 StatusDot 类名(top-0.5→top-1 等)是误导路径上的反复修,从未真修对。
> **[V0.2.0 误导]** V0.2.0.12 PATCH 已恢复到 V1.0 archive inline-block flex 第 1 child 实现。本文件保留只作历史档案,**不**描述当前真实架构。
> 创建: 2026-07-13
> 旧目录: `docs/tasks/v0.2.8-fix-statusdot-displacement/`(2026-07-13 按 `docs/governance/versioning-rule.md` §三 回退)
> 版本: V0.2.0.7(V0.2.0 的第 7 个 PATCH)
> 优先级: P1(cosmetic-ish,但破坏信息可见性)
> **归属判定**: 见 [`docs/tech/v0.2.0-floating-window-tech.md` §1.3 + §6.1`](../../tech/v0.2.0-floating-window-tech.md) — StatusDot 是折叠态 UI 信号,属 §1.1 "在范围内"
> **关联 PRD**: [`docs/prd/v0.2.0-floating-window-prd.md` §3.1 折叠态](../../prd/v0.2.0-floating-window-prd.md)
> **关联 retro**: [`docs/reports/v0.2.0-retrospective.md`](../../reports/v0.2.0-retrospective.md)(待补)

## Why

V0.2.0.5(即原 V0.2.7,commit `c6fc6eb`)5 bug 主流程 PASS,但用户实测发现 [V0.2.0 误导] 折叠态右上角"呼吸灯"(StatusDot)位置不对:时有时无 + 仅露一部分 [V0.2.0 误导](实为 V0.2.x 误改,V1.0 archive StatusDot = inline-block flex 第 1 child 最左,根本不该在右上角)。

StatusDot 是折叠态关键 UI 信号(timer running / paused 状态),错位破坏信息可见性,用户能看见但解释不通,算 P1 瑕疵必修。

**业务影响**:`docs/prd/v0.2.0-floating-window-prd.md` §3.1 折叠态业务规则第 4 条"计时器每秒更新一次"的状态指示不清晰,用户无法从浮窗一眼看出当前 timer 是 running 还是 paused。

详细 root cause 假设 + 歧义澄清 + 排查命令: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 B(5 假设 + 5 歧义点)。

## What

修 `src/floating/components/StatusDot.tsx` + 关联 CSS(`StatusDot.css` / `floating.css`):排查 absolute 定位被父容器 `overflow: hidden` 裁掉的可能性,或 `animate-pulse-dot` keyframes scale 让 position 偏移,或 `transition-opacity` 中间帧 opacity=0。

最终行为:[V0.2.0 误导] 折叠态右上角小圆点稳定可见 + 平滑呼吸(注:本文件错误前提为右上角,V1.0 archive = 最左 inline-block flex 第 1 child)

## Done when

- [ ] DevTools(D:\ 端 F12)选中 `.status-dot`,computed box 在 4 个折叠态动画帧(0% / 50% / 100% / 中间)都完整可见(width = height = ~6px,不被裁)
- [ ] StatusDot CSS 没被 `.floating-root { overflow: hidden }` 裁,或 `overflow: hidden` 范围精确(含 dot)
- [ ] `animate-pulse-dot` keyframe scale 不导致 absolute position 偏移(或 `transform-origin: center` + 父容器 padding 留足)
- [ ] `src/floating/App.fix.test.tsx` 加 vitest 测试:折叠态下 StatusDot 元素 visible(computed style opacity > 0)
- [ ] **L1 vitest 全套 PASS**
- [ ] **L3 D:\ 用户实测**: 折叠态跑 10 秒 StatusDot 持续可见 + 呼吸节奏正常 + 不漏出
- [ ] 沉淀: task.md 跟业务代码同 commit;写一行到 `docs/reports/v0.2.0-retrospective.md`

## 反模式防御

- **反模式 14**:不要分散 commit,一次修完
- **反模式 15**:commit claim "修 StatusDot" 写完用 `grep -n "StatusDot" src/floating/App.tsx src/floating/components/StatusDot.tsx` 自查
- **反模式 16**:测试用 `expect(statusDotElement).toBeVisible()` 行为断言,不用源码 regex
- **反模式 17**:不用 gh CLI / GitHub MCP 写 issue/PR,走 web
- **反模式 18**:写 CSS selector 静态扫描时先剥 `@media` / `@supports` / `@keyframes` 嵌套块(`.floating-root` 在 keyframes 内嵌套会让外层 regex 误命中)

## 关联

- Tech §1 范围边界: `docs/tech/v0.2.0-floating-window-tech.md`
- PRD §3.1 折叠态: `docs/prd/v0.2.0-floating-window-prd.md`
- Domain 状态机: `docs/domain/v0.2-domain-model.md` §2.2(状态语义表)
- 治理规则: `docs/governance/versioning-rule.md` §三 + `docs/governance/l3-gating.md`
- L3 findings 来源: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 B
- 沉淀到 retro: `docs/reports/v0.2.0-retrospective.md`(待补)