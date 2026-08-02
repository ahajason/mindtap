# iron-rules-extraction.md

怎么从一份 design system 文档（Apple HIG / Material Design / 公司 DS）读出**硬约束**（hard constraints），用于 visual-variant-explorer。

## 为什么需要这个

铁律 ≠ 风格描述。设计系统文档里既有"风格建议"（字体推荐 / 色板参考）也有"硬约束"（禁用规则 / 限量规则）。**visual-variant-explorer 只能从硬约束推 N 个方向**，因为硬约束决定"哪些能做 / 哪些不能做"，建议只是"其中一种做法"。

错误示例：把 Apple HIG 的"SF Pro 是默认字体"当硬约束 → 4 个方向全用 SF Pro，差异不出来。
正确做法：把"玻璃只在 chrome" / "≤4 玻璃元素"当硬约束 → 4 个方向都得遵守，但字体可以完全不同。

## 提取流程

### 第 1 步：通读全文，标"必须/禁止/限制"

扫一遍铁律文件，标记含以下关键词的句子：

| 类别 | 关键词 |
|---|---|
| **必须** | "must" / "should always" / "required" / "需要" / "必须" |
| **禁止** | "never" / "don't" / "avoid" / "禁止" / "不要" / "避免" |
| **限量** | "no more than N" / "at most" / "≤" / "最多" / "不超过" |
| **指定** | "use [X]" / "only [X]" / "指定" / "只" |

### 第 2 步：归类到 4 个硬约束类别

把所有标记的句子归到 4 类：

| 类别 | 含义 | 示例 |
|---|---|---|
| **元素类约束** | 哪些 UI 元素被禁用 / 限量 | Apple HIG "玻璃只在 chrome"、"≤4 玻璃元素" |
| **Material / Token 约束** | 哪些 material / token 是规定的 | Apple "regular / clear / Standard / Thick 4 种 material" |
| **反 AI 味 / 风格底线** | 哪些视觉风格被禁止 | 无紫粉渐变 / 无居中孤岛 / 无硬边硬阴影 |
| **可访问性 / 性能约束** | contrast ratio / 动画时长 / 触控目标 | WCAG AA 4.5:1 / 动效 < 200ms / 触控 ≥ 44pt |

### 第 3 步：把硬约束写成可勾选清单

```
Apple HIG 4 铁律（mindtap V1.0 实战提取）:
☐ 玻璃元素 ≤ 4 个
☐ 玻璃只承载控件和导航（topbar / sidebar / tabbar / fab / inspector / menu）
☐ 玻璃不承载内容（卡片 / 列表 / 文本用 Standard material）
☐ Standard material 变体：ultraThin / thin / regular / thick / clear
☐ clear 变体只能用在视觉丰富的背景上（图片 / 渐变 / 复杂内容）
☐ 节制（restraint）：4 个以上自定义玻璃元素即过度
☐ 镜面高光：1px inset border + 顶部 highlight
☐ 反 AI 味：不用紫粉渐变、不用居中孤岛毛玻璃卡片
```

### 第 4 步：把硬约束转成"可违反检测"清单

每个硬约束写成"自检时一眼能看出来"的规则：

```
- [ ] 这页有 5 个 .glass 元素（topbar + sidebar + inspector + fab + switcher）
       → 违规：超出 ≤4 上限。删 fab 或 inspector，fab 改普通按钮
- [ ] 主页内容区卡片用了 backdrop-filter: blur(...)
       → 违规：内容用 Standard material。改 background: var(--card-bg) + 不透明
- [ ] clear 变体用在了纯色背景上
       → 违规：clear 只能富背景。换 regular 变体
```

## Apple HIG 实战模板

```markdown
# Apple HIG Liquid Glass 铁律提取

## 元素类约束
- 玻璃元素 ≤ 4 个（topbar / sidebar / tabbar / fab / inspector / menu 选 ≤4）
- 玻璃只承载 chrome（不承载内容）
- 背景延伸：sidebar 打开时背景图"镜像 + 模糊"延伸到玻璃下

## Material 约束
- Standard material 5 变体：ultraThin / thin / regular / thick / clear
- Glass = backdrop-filter + 半透明（"漂浮"在内容上）
- Standard = 不透明 / 半透明 solid（"承载"内容）
- clear 变体只在富背景（图片 / 渐变 / 复杂内容）上用

## 视觉规则
- 镜面高光：1px inset border + 顶部 highlight
- 节制：超出 4 个玻璃元素即视觉过度
- 反 AI 味：无紫粉渐变 / 无居中孤岛毛玻璃 / 无 emoji 主视觉

## 可访问性
- 文本对比度 ≥ 4.5:1（WCAG AA）
- 动效 < 200ms（避免眩晕）
- 触控目标 ≥ 44pt

## 自检项
- [ ] 玻璃元素数 ≤ 4？
- [ ] 内容用 Standard material（不玻璃）？
- [ ] clear 变体只在富背景？
- [ ] 无紫粉渐变 / 居中孤岛？
- [ ] 无硬边 (border > 1px) + 硬阴影 (box-shadow 0 0 0)？
```

## Material Design 3 实战模板

```markdown
# Material Design 3 铁律提取

## 元素类约束
- Button 3 变体：filled / outlined / text（不能混用，1 页只选 1 个主题）
- 5 档 elevation（level 0/1/2/3/4/5），不混用相邻 3 档以上
- FAB 限 1 个 / 页

## Token 约束
- Dynamic color：primary / secondary / tertiary 从 wallpaper 派生
- Tonal palette：每个 color 有 13 阶（tone 0-100）
- Typography scale：display / headline / title / body / label 5 类，每类 large/medium/small

## 视觉规则
- 形状：corner radius 4dp（小）/ 8dp（中）/ 16dp（大）/ 28dp（特）
- 反 AI 味：不用渐变文字 / 不用泛光 glow

## 可访问性
- 文本对比度 ≥ 4.5:1（WCAG AA）
- 触控目标 ≥ 48dp
- 动效 < 250ms

## 自检项
- [ ] 1 页只用 1 个 button 主题？
- [ ] elevation 不超 3 档？
- [ ] FAB ≤ 1 个？
- [ ] Typography 5 类都用到了？
- [ ] corner radius 风格统一？
```

## 公司 Design System 实战模板

公司 DS 通常 100-300 页，比 HIG/MD 难提取。流程：

1. **找 "Principles" / "Foundations" 章节** —— 这部分通常是硬约束
2. **找 "Components" 章节** —— 通常是建议
3. **找 "Don'ts" / "Anti-patterns" 章节** —— 铁律集中地
4. **看 design tokens**（颜色 / 字体 / 间距）—— 决定可用素材池

```markdown
# <公司名> DS 铁律提取

## Principles（必读）
- <列出 3-5 条核心原则>

## Foundations（硬约束）
- Color: <主色 / 中性色 / 状态色 / 不可用色>
- Typography: <字体族 / 字号阶 / 字重>
- Spacing: <间距阶 4dp / 8dp / 16dp / 24dp>
- Elevation: <投影阶 / 不可用投影>

## Components（建议）
- Button: <变体数>
- Card: <变体数>
- Modal: <变体数>

## Don'ts（禁用）
- <列出 5-10 条具体禁用项>

## 自检项
- [ ] 主色是否在允许列表？
- [ ] 字体是否在 token 内？
- [ ] 间距是否在 token 阶内？
- [ ] 没有用禁用项？
```

## 提取失败时怎么办

如果铁律文件**信息密度太低**（如只有风格描述、无硬约束），停下来问用户：

> "这份铁律文件主要是 [风格描述]，但 visual-variant-explorer 需要 [硬约束]。能否补充：
> - 哪些 UI 元素被禁用 / 限量？
> - 哪些 material / token 是规定的？
> - 哪些视觉风格被禁止？
> 
> 或者你接受我按 [Apple HIG 4 铁律] 作默认铁律？"

或者询问用户是否愿意用**已知的成熟铁律**（Apple HIG / Material Design 3）作为默认值。

## 跨铁律的共同硬约束

不管用哪份铁律，以下 3 条**几乎都是**硬约束（建议默认带上）：

1. **文本对比度 ≥ 4.5:1**（WCAG AA）
2. **触控目标 ≥ 44pt / 48dp**（平台标准）
3. **反 AI 味**（无紫粉渐变 / 无居中孤岛毛玻璃 / 无 emoji 主视觉）

这 3 条不来自具体铁律文件，是行业共识。任何方向的 N 个 skin 都要满足。
