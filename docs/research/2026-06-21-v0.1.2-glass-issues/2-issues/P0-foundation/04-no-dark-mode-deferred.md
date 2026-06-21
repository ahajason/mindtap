# P0 · 无 Dark mode / macOS 系统外观适配(延后到 V0.2.x)

> **优先级**: 🔴 P0 根因级 — 但**延后到 V0.2.x 处理**(用户决策 2026-06-21,2026-06-21 由 V0.1.3+ 上调到 V0.2.x)
> **创建**: 2026-06-21
> **状态**: 🟡 **已记录,延后处理**
> **关联设计**: [`../../1-design/06-color-and-contrast.md`](../../1-design/06-color-and-contrast.md) §四 Color Token
> **关联原始**:
> - `0-originals/apple/hig/07-color.md`(系统色优先 + 动态适配)
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(玻璃材质自动 Light/Dark)
> - `0-originals/microsoft/acrylic.md`(Mica / Acrylic 都 mode aware)
> - `0-originals/microsoft/fluent2-material.md`("Solid is mode aware; it supports both light and dark mode")

---

## 一、问题现状(明确记录)

`src/index.css` 用 Tailwind 4 `@theme {}` 块定义 token:

```css
@theme {
  --color-bg-from: #F5F9FF;     /* 浅色 */
  --color-bg-to:   #E8F1FF;     /* 浅色 */
  --color-text-1: #1D2939;      /* 浅色文字 */
  /* ... 全部浅色 token */
}
```

**问题表现**:
1. **完全无 Dark mode 适配** — 任何 token 都没有 `:root[data-theme="dark"]` 或 `prefers-color-scheme: dark` 变体
2. **macOS 系统外观切换未响应** — 用户在"系统设置 → 外观"切 Dark,Safari 加载 webview 时仍按 light 渲染
3. **玻璃材质无法跟随系统 tint** — 当前 `--glass-fill-1/2/3` 都是 `rgba(255,255,255,*)`(浅色),在 Dark mode 下会变成"白色玻璃在黑色背景上"的不协调视觉

## 二、范式违反

| 平台 | 规范要求 | 当前 | 违反 |
|---|---|---|---|
| **Apple HIG Color** | 优先系统色 + 自动 Light/Dark | 硬编码浅色 | ❌ |
| **Apple Liquid Glass** | 玻璃材质自动适配 Light/Dark | 静态白色 | ❌ |
| **Microsoft Acrylic** | "Acrylic is mode aware; it supports both light and dark mode" | 仅 light | ❌ |
| **Microsoft Fluent 2 Solid** | "Solid is mode aware; it supports both light and dark mode" | 仅 light | ❌ |

## 三、根因(架构性)

Tailwind 4 `@theme {}` 块**静态注入 token 到 CSS**,**不支持运行时切换**。

要支持 Dark mode,有 3 个方向:

| 方向 | 改动量 | 风险 | 适合阶段 |
|---|---|---|---|
| **A. CSS 变量 + `@media (prefers-color-scheme: dark)`** | 中(全 token 翻倍 + 媒体查询) | 低 | V0.2.x(初版,跟随系统) |
| **B. CSS 变量 + `[data-theme="dark"]` + React state** | 大(全局 theme provider + 所有页面读 theme) | 中 | V0.2.x(进阶) |
| **C. 跟随系统 + 用户可覆盖** | 最大(state 同步系统 + override UI) | 高 | V0.2.x(完整版) |

## 四、为什么延后到 V0.2.x

1. **架构性改动**:不是 1-2 行 CSS,而是 **token 全量翻倍 + Theme provider + 系统/用户双源**,工作量 **3-5 天**
2. **依赖 V0.1.2 视觉稳定 + V0.1.3+ 范围扩张**:Dark mode 实施时,所有玻璃 token / shadow / border / 排版都要重调;放在 V0.2.x(产品功能更丰富时)能跟浮窗、设置面板的视觉同步推进,避免在 V0.1.x 修补阶段重复返工
3. **测试矩阵翻倍**:每个视觉改动都要在 light + dark 下各验证一次
4. **用户决策明确**(2026-06-21):"L4/L5 太大,应该延后到 V0.1.3+,明确记录问题";2026-06-21 进一步调整至 **V0.2.x**(V0.1.3+ 阶段优先做浮窗/快捷键等业务功能,Theme 系统留到阶段切换时一次性铺底)
5. **V0.2.x 是产品阶段切换节点**:届时设置面板、浮窗、扩展主题等模块都需要 Theme 系统支撑,正好一起做

## 五、延后期间的已知影响

| 用户场景 | 影响 | 接受度 |
|---|---|---|
| macOS 浅色用户 | ✅ 正常 | OK |
| macOS 深色用户 | ⚠️ 看到浅色 webview(反差强) | 已知,接受 |
| Windows / Linux Light mode 用户 | ✅ 正常 | OK |
| Windows Dark mode 用户 | ⚠️ 看到浅色 webview | 已知,接受 |
| 系统自动切换外观 | ❌ 不会跟随 | 已知,接受 |
| 高对比度 / Increase Contrast | ❌ 不会跟随 | 已知,接受(部分由 P2-accessibility Reduce Transparency 缓解) |

## 六、延后替代(临时缓解)

V0.1.x 期间(V0.1.2 / V0.1.3+),可通过以下方式临时缓解(非根本解决):

1. **`meta name="color-scheme" content="light"`** — 让浏览器 chrome(滚动条等)保持浅色,跟 webview 视觉一致
2. **文档说明**:`README.md` 加 "V0.1.x 暂不支持 Dark mode"
3. **未来 commit message**:升级 commit 时明确"包含 Dark mode 适配"

## 七、再处理触发条件(进入 V0.2.x)

满足以下**任一**即可触发:

1. **V0.1.x 视觉全部稳定**(本目录 2-issues/ 全部关闭)
2. **有 ≥ 1 个用户明确反馈需要 Dark mode**
3. **V0.2.x 阶段规划开始**(届时 Theme 系统是基础,跟设置/浮窗一起推进)

## 八、自检清单(留作 V0.2.x 实施时)

| 检查项 | 方法 |
|---|---|
| 全 token 都有 light + dark 变体 | grep `src/index.css` token 数量 |
| `@media (prefers-color-scheme: dark)` 或 `[data-theme="dark"]` 全覆盖 | grep 媒体查询 |
| 玻璃材质 `--glass-fill-*` dark 变体 = `rgba(20,20,20,0.X)` | 视觉对比 |
| 系统外观切换时 webview 自动跟随 | macOS 系统设置切 dark 验证 |
| 所有 glass 组件 light/dark 下都通过 WCAG 4.5:1 | WebAIM checker 双模式 |

---

**引用源**:
- 设计规范 — [`1-design/06-color-and-contrast.md`](../../1-design/06-color-and-contrast.md) §四
- 原始资料 — `0-originals/apple/hig/07-color.md` + `0-originals/apple/liquid-glass/03-hig-materials.md` + `0-originals/microsoft/acrylic.md` + `0-originals/microsoft/fluent2-material.md`