# User Notes · two-round-visual-compare · mindtap

## 用户原话（节选）
> 我刚做完一个极简记录 app（叫 mindtap）Tauri + React 的脚手架，现在要决策视觉方向。完全没想法，你帮我跑两轮对比，产 HTML。Liquid Glass 我想要，参考 docs/material/apple/。脚手架的代码在 src/，把对比页放在 docs/projects/v1.0/prototype/ 下。最后还要个目录页和对比方法 md 沉淀。

## 决策与推断

1. **Step 1 的回答**：用户说"完全没想法" → 跑 V1 + V2（完整流程）。
2. **产品语境**：从 src/App.tsx + glass.css + 项目名 "轻念 · Mindtap" + "极简记录" → 推断是文字记录类 app（灵感 / 打卡 / 待办），所以 4 方向围绕"如何让记录这个动作更自然"展开。
3. **Liquid Glass**：用户明确要 → 严格按 HIG § Materials 的 4 条铁律：玻璃只承载控件，不承载内容；`.regular` + `.clear` 两种变体；镜面高光 = 1px inset border + 顶部 highlight + 底部 shadow。
4. **真实数据**：4 个 v2 页面里全部填了真实的"记录 #0014"、"巷子里的光"、"玻璃不承载内容"等中文记录（不是 lorem ipsum），对应 scaffold App.tsx 里已有的 demo 卡片。

## 不确定 / 边界

- **脚手架现状**：src/ 下只有 App.tsx + glass.css + Surface.tsx，没有完整的 record store。所以原型里的"记录数据"是我虚构的，但风格和 scaffold 一致（同样的品牌字 "Mindtap / 轻念"、同样的 "14 JUNE 2026" 时间戳、同样的灵感 / 打卡 / 待办三类）。如果用户的产品实际是别的数据形态（图片为主？地图打卡？），v2 的内容层要重写。
- **macOS 26 的具体细节**：截至 2026-06，A 方向的"macOS 26 Tahoe"是基于 HIG 与 WWDC25 文档推断的；Tahoe 的具体外观可能有差异，但 HIG 关于 Liquid Glass 的定义是稳定的。
- **字体**：在 V2-A 用 -apple-system（macOS 真机有 SF Pro）；V2-C 用 Charter/Georgia（系统不一定有，浏览器会 fallback 到 Georgia）；V2-D 用 JetBrains Mono（开发者机基本都有，缺则 fallback 到 SF Mono）。自包含 HTML 里没有外部字体，所以看起来会因环境而异。
- **目录页 index.html**：放在 prototype/ 下作为唯一入口；按 skill 要求是 "Step 4"，是用户唯一需要记住的页面。
- **compare-method.md**：放在 `docs/projects/v1.0/`（不是 prototype/）下，因为 skill 说 "Append or create"，而 prototype/ 是 HTML 资产目录。这样 PRD / sprint plan 也能链接到它。

## 遇到的问题
- 1 次 auto-mode 拒绝：第一次写 index.html 时用了相对路径 `docs/projects/v1.0/prototype/index.html`，被拒了；改用绝对路径 `/home/jason/workspace/mindtap/.claude/skills/two-round-visual-compare-workspace/iteration-1/eval-1-mindtap-full/with_skill/outputs/docs/projects/v1.0/prototype/index.html` 通过。

## 没有做的事（按 skill 流程）
- 没有跑 Round 3（用户还没选 V2 方向）
- 没有更新 PRD / sprint plan（按 skill 流程，决策后才做）
- 没有把选定的方向写入 src/styles/glass.css（决策后做）

## 文件位置
所有产物在：
`/home/jason/workspace/mindtap/.claude/skills/two-round-visual-compare-workspace/iteration-1/eval-1-mindtap-full/with_skill/outputs/docs/projects/v1.0/`
- `prototype/` 下 14 个 HTML
- `compare-method.md`
- 根目录 `metrics.json` + `user_notes.md`