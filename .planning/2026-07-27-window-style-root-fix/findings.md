# Findings & Decisions

## Requirements
- 用户最初要求回看前几次代码修复，选择合适 skills，制定方案并验证修复 window 样式错乱。
- 用户随后明确调整：先重新整理真实需求，再按需求制定修复方案。
- 本轮交付是需求重述 + 根因导向方案，不直接修改产品代码。
- “样式错乱”应转换为可验收窗口契约，而不是继续按截图分散补 CSS。
- 目标是恢复既有认可设计，不重新选择视觉方向；`two-round-visual-compare` 只借用状态矩阵和前后对照方法。
- 必须尊重 Windows WebView2 只能在 D:\ checkout 实机验证的边界。

## Research Findings
- 权威 `develop` 当前实现的不可满足几何约束：物理折叠态 `360×36` (`App.tsx:22-26`)，但 root 永远 `p-3`（上下 24px）且 `FoldedBar` 自身 `h-9`（36px），活动任务还追加 `ControlRow` 第二行。总最小高度超过 60px，必然溢出或被 `overflow-hidden` 裁剪；这是样式错乱的结构根因，不能靠 alpha/shadow 修。
- 当前玻璃材质有两个 owner：`.floating-root` CSS 自己 blur/background/shadow，内层 wrapper 又以内联 `PANEL_STYLE` blur/background/inset+drop-shadow；同时 root CSS 半径 14px 与 Tailwind `rounded-2xl` 冲突。级联顺序决定实际外观，导致 WebView2/DPI 下不稳定。
- 已有视觉决策不是空白：2026-07-13 用户已选 V0.1.2 G3 实装为真值，即 fill 0.22/0.28/0.36、blur 20/24/28、saturate 120%、中性黑阴影；本轮无需重选视觉方向。
- floating entry 不加载 `src/index.css`，而 `floating.css` 复制了旧值 0.35/0.42/0.50 + 冷蓝阴影，导致已选 G3 真值不可达；内联 `PANEL_STYLE` 又是第三套 0.6 + 冷蓝阴影。
- `App.test.tsx:63-91` 多个所谓生产 CSS 回归测试只断言手写字符串，不读取生产 HTML/CSS，当前实现变坏也不会判红；Vitest 又配置 `css:false`，DOM 测试不能验证计算样式。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 使用 diagnosing-bugs + planning-with-files | 前者强制先建立判红反馈环，后者保存跨多轮 git/代码/测试证据 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|

## Resources
- `CLAUDE.md` 的双工作树和 floating PATCH 历史入口。
