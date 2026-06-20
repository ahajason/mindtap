# 6 Agent 最终合成 · 浮窗 v3 第三方工具决策表

> 时间:2026-06-20
> 范围:浮窗 v3 重构的 7 项 UI + 7 项动画 + 6 项视觉需求
> 方法:6 个并行研究 agent,每个独立域;Tier 1-4 阶梯评估

## TL;DR

**唯一推荐增量 = 1 个 Tier 1 升级(Tailwind v3.4 → v4.3)**
**1 个 Tier 3 可选(liquid-glass-react — 需用户拍板)**
**12+ 个候选库 0 ROI 全部 REJECT**
**最终 0 第三方 UI 库 / 0 第三方动画库 / 0 第三方玻璃库**

## 决策矩阵(用户拍板)

| 方案 | 阶梯 | 工作量 | 风险 | 解决哪个痛点 | 4-阶评估 |
|---|---|---|---|---|---|
| **A · Tailwind v3.4 → v4.3 升级** | Tier 1(已有 dep 升级) | 半天 | 低 | 玻璃 sRGB 偏色 + saturate 补偿 + OKLCH 调色 | **⭐ 推荐先做** |
| **B · liquid-glass-react 引入** | Tier 3(第三方 WebGL) | 1-2h | 中(React 19 alpha) | Apple 真实折射感(非清透感) | **待用户拍板** |
| **C · stdlib 维持 v3.1 配方** | Tier 1(不动) | 0 | 0 | 当前 α=0.22 配方 | **保守基线** |
| **D · 全部采纳(A+B)** | Tier 1 + Tier 3 | 1 天 | 中 | 玻璃清透 + 折射 | **激进组合** |

## 推荐:先 A 后看效果,再决定 B

- A 解决 80% "清透感"问题(OKLCH 调色板 + `color-mix`);低风险半天
- 跑完 A 后,如果用户视觉仍觉得"还差点" → 再上 B(WebGL 折射)
- 跳过 B 直接 C:最低风险,但"saturate 120% 偏保守"的根本问题未解

## 6 agent 详细结论

### Agent 1(UI primitives · 早回合)✓
**域**:@base-ui/react / Radix / react-aria-components / headlessui / sonner / react-textarea-autosize / cmdk
**结论**:**0 新增**。`@base-ui/react@1.6.0` + `sonner@1.7.4` + stdlib + 自带 `useDragLongPress` 覆盖 6/6 浮窗 UI 需求
**动作**:`npx shadcn@latest add toggle-group textarea` 拿 wrapper;写 `src/floating/sonner.tsx` 副本(去 useTheme)

### Agent 2(动画基础 · 早回合)✓
**域**:WAAPI / tailwindcss-animate / tw-animate-css / motion / framer-motion / react-spring
**结论**:**7/7 走 stdlib**;`tailwindcss-animate`/`tw-animate-css`/`motion`/`react-spring` ROI 全部负
**关键**:`tw-animate-css` 与 D-11(grid-template-rows 0fr→1fr)冲突(用 height 而非 grid-rows)

### Agent 3(Liquid Glass · 本轮)✓
**域**:Tailwind glass 插件 / Apple HIG 参考 / 颜色工具 / 视觉对比工具
**结论**:
- Tailwind v3.4 原生 + CVA + tailwind-merge 4 variant 覆盖 6/6 玻璃配方
- `tailwindcss-glassmorphism`(2022 弃坑)/ `liquid-glass-react`(rdev 停更)/ `liquidGL`(WebGL 冲突)全部 REJECT
- Apple HIG **官方无公开 α/blur/saturate 数值表**(验证 spec D-10 "实测"措辞正确)
- 加 1 devDep:`@playwright/test`(用 `toHaveScreenshot` 视觉回归,取代已 sunset 的 Lost Pixel)

### Agent B(组件 blocks · 本轮)✓
**域**:shadcn 衍生 registry / Apple-HIG 风格库 / 玻璃 / 完整 blocks
**结论**:
- **1 真正推荐**:`liquid-glass-react`(DavidAlphaFox,2.8k star,2026-05,SVG + WebGL)
- **次推荐**:`basecn.dev` registry(同 base-ui 栈,补 Sheet/Calendar/Form blocks)/ `coss ui`(Cal.com DS)
- REJECT:aceternity-ui(商业)/ shadcnblocks.com(商业)/ cult-ui(neobrutalism)/ LiqUIdify(stale)

### Agent C(CSS 框架 · 本轮)✓
**域**:UnoCSS / Panda / Master / Open Props / StyleX / Vanilla Extract / Tailwind v4
**结论**:
- **⭐ 强烈推荐升级 Tailwind v3.4 → v4.3**(半天工作量,shadcn 4.x + base-ui + sonner 全 v4-ready)
- 收益:OKLCH 调色板 + `color-mix(in oklch, ...)` + 内置 `backdrop-filter` + `@property` 动画
- 同步删:`tailwindcss-animate`(2023-04 停更)/ `autoprefixer`(v4 内置)/ `postcss.config.js`
- 加 1:`@tailwindcss/forms`(shadcn Input/Select 跨浏览器 reset)
- 全 REJECT:UnoCSS / Panda / Master / StyleX / Vanilla Extract / Open Props / daisyUI / Preline

### Agent A(高级动画 · 本轮)✓
**域**:GSAP / Lottie / animejs v4 / @use-gesture / @react-spring / @tsparticles / auto-animate / particles.js / motionone
**结论**:**12 个候选全部 ROI 负**,**0 新增**
- GSAP:70KB Draggable 对 4px 拖动是杀鸡用牛刀;商业 license 审计成本
- Lottie:零现存 Lottie 资产,引入即要为设计师 + 资产存储 + runtime 付费
- @use-gesture:14 个月没动
- @motionone/react:已 archived
- particles.js:2 年没动
- @tsparticles:粒子效果破坏 Glassic UI "透 + 静"语言

## 显式"未改的 + 为什么"

- **不引**任何第三方 UI 库(0 必要)
- **不引**任何第三方动画库(0 必要)
- **不引**任何第三方玻璃库(liquid-glass-react 留作 Tier 3 可选)
- **不写**GlassSurface 自封装(走 Tailwind v3.4 原生 utilities + CVA 4 variant;升 v4 后用 v4 内置)
- **不动**Lucide 图标(已装,1,743 icon 够用)
- **不动**Geist 字体(已装,只差在 `tailwind.config.js` 注册;升 v4 后改 `@theme --font-sans`)
- **不动**cva / tailwind-merge / clsx / next-themes / sonner(全 v4 兼容)
- **不动**shadcn 17 个 ui wrapper(全 v4 兼容)

## 升级路径(若用户选 A)

```bash
# 1. 升级 Tailwind 到 v4
npm i tailwindcss@^4.3.1 @tailwindcss/vite
npx @tailwindcss/upgrade

# 2. 删 3 个
npm rm tailwindcss-animate autoprefixer
rm postcss.config.js  # 走 Vite 插件后无需

# 3. 加 1 个
npm i -D @tailwindcss/forms@latest

# 4. 加 1 个 devDep(Agent 3 推荐,视觉回归)
npm i -D @playwright/test

# 5. 改 src/index.css,把 src/styles/glass.css 的 --glass-* token 迁到 @theme,
#    暴露 bg-glass-1/2/3 工具类
```

## 升级路径(若用户再选 B)

```bash
# 6. 装 liquid-glass-react(React 19 alpha 需先验)
pnpm add liquid-glass-react

# 7. 在 src/floating/App.tsx 包外壳
import LiquidGlass from 'liquid-glass-react'
<LiquidGlass displacementScale={64} blurAmount={0.1} saturation={1.4} elasticity={0}>
  <div className="rounded-2xl border ...">{/* 现有 17 个 wrapper */}</div>
</LiquidGlass>
```

## 验证清单(任何方案必跑)

| 项 | 命令 | 预期 |
|---|---|---|
| 类型检查 | `npx tsc --noEmit` | 0 error |
| 前端单测 | `npx vitest run` | 全绿(基线 + 浮窗新增) |
| Rust 单测 | `cargo test --manifest-path src-tauri/Cargo.toml` | 全绿(尤其 `db::task` 状态机) |
| 视觉回归 | `npx playwright test` | 浮窗 4 场景 × 8 态 baseline diff < 0.1% |
| 手动 | 折叠↔展开 5 次 / 拖动 5 次 / segmented 切换 5 次 | 流畅,saturate 视觉补偿到位 |

## 等待用户拍板

- **A · Tailwind v4 升级**:是否同意?(半天工作量,低风险)
- **B · liquid-glass-react**:是否同意?(需要 React 19 alpha 自验,WebGL shader)
- **C · stdlib 维持**:是否同意(当前 v3.1 配方,最保守)
- **D · 全部采纳**:是否同意?

拍板后:
- 选 A → 更新 spec § 1.5 / § 6 / § 7 加 Tailwind v4 升级章节
- 选 B → 更新 spec § 1.3 / § 6 加 liquid-glass-react 外壳包装
- 选 C → spec 不变,直接进 writing-plans
- 选 D → spec 加 A+B 章节
