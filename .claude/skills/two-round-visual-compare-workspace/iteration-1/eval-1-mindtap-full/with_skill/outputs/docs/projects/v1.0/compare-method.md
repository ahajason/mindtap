# 两轮视觉对比法 · Mindtap V1.0

> 让用户在浏览器里**亲眼**判断视觉方向，而不是在会议里靠形容词猜测。

---

## 1. 硬约束（反 AI 味）

任何原型/页面在产出前必须自检：

| # | 反 AI 味 | 正做法 |
|---|---|---|
| 1 | `linear-gradient(135deg, #667eea, #764ba2, ...)` | 实色 surface（白/米/暗）+ 真实色板 |
| 2 | `<div class="card" style="max-width: 480px; margin: 0 auto;">` 居中卡片 | 全幅布局（1280×800），侧栏/顶栏分层 |
| 3 | `font-size: 28px` 英雄标题 | 真实产品字号 36-72px，标题分 4 档 |
| 4 | `🎨 ✨ 🚀` emoji 当主视觉 | SF Symbols / 衬线字符 / 几何图标 |
| 5 | 把玻璃放在内容卡片上 | 玻璃**只**承载顶栏/侧栏/工具栏/FAB/菜单 |
| 6 | "Lorem ipsum" / "Card title 1" | 真实记录数据：标题、字数、时间、类型 |

**第六条尤其重要**：玻璃漂浮在**真实内容**之上。如果下面没有真东西，玻璃就是个装饰，不是设计语言。

---

## 2. Liquid Glass 正确定义

> 摘自 `docs/material/apple/liquid-glass/01-overview.md`、`02-adopting.md`、`03-hig-materials.md`

### 核心命题

> Liquid Glass forms a distinct functional layer for controls and navigation elements — like tab bars and sidebars — that floats above the content layer, establishing a clear visual hierarchy between functional elements and content.

### 4 条铁律

1. **不要在内容层使用 Liquid Glass**（除非 Slider / Toggle 这类瞬时交互）
2. **节制使用** —— 标准组件自动获得，自定义时仅限最重要的功能元素
3. **仅在视觉丰富的背景上**用 `clear` 变体
4. **`regular` 变体**适用于多数情况（弹窗、侧栏、提醒）

### 两种变体

| 变体 | 视觉 | 适用 |
|---|---|---|
| `.regular` | 模糊 + 调暗背景 | 默认（顶栏、侧栏、菜单） |
| `.clear` | 高度透明 | 媒体背景、沉浸场景 |

### 配色规则（来自 HIG · Color）

- 默认 Liquid Glass **无颜色** —— 从背景内容取色
- **节制**使用 tint —— 只在最重要的主操作上加
- 加颜色到**背景**，不**图标/文字**

### 镜面高光（mirror highlight）

每个玻璃元素必须包含：

```css
box-shadow:
  inset 0 1px 0 rgba(255,255,255, .6),  /* 顶部高光 */
  inset 0 -1px 0 rgba(0,0,0, .04);      /* 底部阴影 */
border: 1px solid rgba(255,255,255, .5); /* 1px 镜面边框 */
```

少了这个镜面，玻璃就是"半透明白块"，不是 Liquid Glass。

---

## 3. 流程图

```
            ┌─────────────────────┐
            │ 用户：「决策视觉方向」 │
            └─────────┬───────────┘
                      ▼
            ┌─────────────────────┐
            │  Step 1 · 一个问题   │
            │  "有方向吗？/没想法"  │
            └─────────┬───────────┘
              ┌───────┴───────┐
              ▼               ▼
         有方向             没方向
              │               │
              │               ▼
              │     ┌─────────────────────┐
              │     │  Round 1 · 4×4 矩阵   │
              │     │  玻璃密度（8 tiles）  │
              │     └─────────┬───────────┘
              │               ▼
              │     用户选 Q1/Q2/Q3/Q4
              │     + 可选 D5/D6/D7/D8
              │               │
              └───────┬───────┘
                      ▼
            ┌─────────────────────┐
            │  Round 2 · 4 方向     │
            │  全幅 1280×800 语境   │
            └─────────┬───────────┘
                      ▼
            ┌─────────────────────┐
            │  用户选 A/B/C/D       │
            └─────────┬───────────┘
                      ▼
            ┌─────────────────────┐
            │  更新 PRD / 脚手架    │
            │  + 沉淀 compare-method│
            └─────────────────────┘
```

---

## 4. 资产清单 · 跳转关系

```
docs/projects/v1.0/
├── compare-method.md       ← 你正在读
├── prototype/
│   ├── index.html          ← 入口
│   ├── compare.html        ← Round 1 总览（4×4）
│   ├── compare-v2.html     ← Round 2 总览（2×2）
│   │
│   ├── Q1-light-creative.html     ─┐
│   ├── Q2-light-strict.html       │ Round 1
│   ├── Q3-heavy-creative.html     │ 8 个 480×360
│   ├── Q4-heavy-strict.html       │ 密度变体
│   ├── D5-immersive.html          │
│   ├── D6-productive.html         │
│   ├── D7-adaptive.html           │
│   └── D8-expressive.html        ─┘
│
│   ├── v2-a-macos26.html          ─┐
│   ├── v2-b-linear.html           │ Round 2
│   ├── v2-c-editorial.html        │ 4 个 1280×800
│   └── v2-d-engdoc.html          ─┘
```

**入口层级**：从 `src/App.tsx` → "4 方向对比"链接 → `prototype/index.html` → 选轮次 → 选方向 → 全幅对比。

---

## 5. V1 → V2 何时做哪一轮

| 场景 | 跳过 V1？ | 跳过 V2？ | 推荐 |
|---|---|---|---|
| 完全没方向 | 否 | 否 | 跑 V1 + V2 |
| 用户说"像 macOS 26 那种" | **是** | 否 | 跑 V2，把 macOS26 当作 A |
| 用户说"暖一点的" | **否**（跑密度） | 否 | V1 解决密度，V2 解决语境 |
| 用户说"先做完整版再说" | 否 | **是**（只跑 V1） | V1 决定基础，再细化 |
| 用户说"我要编辑杂志感" | 是 | 否（跑 V2） | V2 把 editorial 当 C |
| 用户说"看起来差不多，再来一轮" | 否 | 否 | V3 沿用用户给出的新轴 |

---

## 6. 反 AI 味 vs 玻璃味 · CSS 对照

### ❌ AI 味（不要写）

```css
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: 64px 32px;
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
  box-shadow: 0 30px 60px rgba(102, 126, 234, .4);
}
.hero h1 {
  font-size: 28px;
  background: linear-gradient(90deg, #fff, #eee);
  -webkit-background-clip: text;
  color: transparent;
}
.hero .emoji {
  font-size: 64px;
}
```

### ✅ 玻璃味（按 HIG 写）

```css
.topbar {
  background: rgba(245, 245, 247, 0.65);
  backdrop-filter: saturate(180%) blur(28px);
  -webkit-backdrop-filter: saturate(180%) blur(28px);
  border-bottom: 1px solid rgba(0,0,0,.08);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.6),  /* 镜面 */
    inset 0 -1px 0 rgba(0,0,0,.04);
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}
.topbar .title {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;     /* 系统色，不写死 hex */
}
.fab {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: saturate(180%) blur(24px);
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  border: 1px solid rgba(255,255,255,.7);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.8),
    inset 0 -1px 0 rgba(0,0,0,.05),
    0 14px 32px -8px rgba(0,0,0,.3);  /* 浮动阴影 */
  width: 56px; height: 56px;
  border-radius: 50%;
}
/* 内容卡片：不玻璃 */
.card {
  background: #ffffff;
  border: 1px solid #d2d2d7;
  border-radius: 14px;
  padding: 16px;
  /* 没有 backdrop-filter */
  /* 没有 box-shadow 太厚 */
}
```

**关键差异**：
- AI 味：渐变 + 居中 + 厚阴影 + emoji + 28px 标题
- 玻璃味：实色 surface + 镜面高光 + 系统色 + 分层（控件玻璃 vs 内容实色）+ 真实字号

---

## 7. 自检清单（交付前必跑）

```bash
# 在每个 HTML 文件里搜索以下字符串，期望结果：0
grep -E "linear-gradient\(135deg, #667eea|linear-gradient\(135deg, #764ba2" *.html
grep -E 'max-width: 480px; margin: 0 auto' *.html
grep -E "font-size: 28px" *.html  # 仅允许用于次要元数据
grep -E "[🎨✨🚀]" *.html
grep -E "backdrop-filter" *.html  # 应出现在 topbar/sidebar/fab/menu；不应出现在 .card
```

**期望结果**：
- 渐变 emoji 搜索 → 0 命中
- 居中 480px 卡片 → 0 命中
- 28px 英雄标题 → 0 命中（v2-c 的 h1 是 64px，v2-a 是 44px，符合产品字号）
- 装饰性 emoji → 0 命中
- backdrop-filter 只出现在控件类（topbar / sidebar / fab / palette / menu / pill），不在 .card / .paper / .panel

---

## 8. Round 2 四方向的真实语境

为什么是这 4 个？因为它们回答不同的产品问题：

| 方向 | 回答的问题 | 真实参照 |
|---|---|---|
| A · System-native | "这是一个 Apple 生态原生 app 吗？" | macOS 26 Tahoe / iOS 26 |
| B · Developer-tool | "这是一个给重度用户用的工具吗？" | Linear / Vercel / Raycast |
| C · Editorial | "这是一个用来读和写的 app 吗？" | Medium / Are.na / 杂志 |
| D · Engineering Doc | "这是一个给开发者用户的工具吗？" | Stripe Docs / Vercel Docs |

不选 C/D 的项目，不代表它们做错了 —— 代表这个产品**不是**那种语境。

---

## 9. 决策后下一步

用户选定方向（假设 B）：

1. 更新 `compare-method.md` 第 8 节：标注 B 为选定方向
2. 把 B 的 CSS 变量写入 `src/styles/glass.css`
3. 删除 `src/App.tsx` 中 demo 用的占位玻璃，换成生产版
4. 更新 `docs/projects/v1.0/prd-v1.2.md` 的"视觉语言"段
5. 在 `src/components/Surface.tsx` 加 Liquid Glass variants（可选 V1.1）

---

## 10. 已知边界

- `backdrop-filter` 在 Firefox 默认关闭（截至 2026）—— Tauri WebView (WKWebView / WebView2) 都基于 Chromium，**支持**，不用 fallback
- iOS Safari 早期版本不支持 `saturate()` 与 `blur()` 组合 —— 已用 `-webkit-backdrop-filter` 双写
- 暗模式下，玻璃的 `background` 不能写死 hex，要用 CSS 自定义属性响应 `prefers-color-scheme`（详见 v2-b 的 `--glass` token）