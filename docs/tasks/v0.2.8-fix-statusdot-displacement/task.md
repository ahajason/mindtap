# fix(floating): 折叠态 StatusDot 错位 — 时有时无 + 仅右上漏一部分

> 创建: 2026-07-13

## Why

V0.2.7 5 bug 主流程 PASS (commit c6fc6eb), 但用户实测发现折叠态右上角"呼吸灯" (StatusDot) 位置不对: 时有时无 + 仅露一部分。StatusDot 是折叠态关键 UI 信号 (timer running / paused 状态), 错位破坏信息可见性, 用户能看见但解释不通, 算 P1 瑕疵必修。

详细 root cause 假设 + 歧义澄清 + 排查命令: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 B (5 假设 + 5 歧义点)

## What

修 StatusDot.tsx + 关联 CSS (StatusDot.css / floating.css): 排查 absolute 定位被父容器 `overflow: hidden` 裁掉的可能性, 或 `animate-pulse-dot` keyframes scale 让 position 偏移, 或 transition-opacity 中间帧 opacity=0。最终行为: 折叠态右上角小圆点稳定可见 + 平滑呼吸, 不闪烁不漏出。

## Done when

- [ ] DevTools (D:\ 端 F12) 选中 .status-dot, computed box 在 4 个折叠态动画帧 (0% / 50% / 100% / 中间) 都完整可见 (width = height = ~6px, 不被裁)
- [ ] StatusDot CSS 没被 `.floating-root { overflow: hidden }` 裁, 或 overflow:hidden 范围精确 (含 dot)
- [ ] `animate-pulse-dot` keyframe scale 不导致 absolute position 偏移 (或 transform-origin: center + 父容器 padding 留足)
- [ ] App.fix.test.tsx 加 vitest 测试: 折叠态下 StatusDot 元素 visible (computed style opacity > 0)
- [ ] L1 vitest 全套 PASS
- [ ] L3 D:\ 用户实测: 折叠态跑 10 秒 StatusDot 持续可见 + 呼吸节奏正常 + 不漏出
- [ ] 沉淀: task.md 跟业务代码同 commit