# mindtap V1 · Apple HIG Liquid Glass · 4 方向实战

> 这是 visual-variant-explorer 在 mindtap V1.0 项目里的真实应用案例。
> 用作 skill 调用时的参考实现。

## 输入

```
业务: 极简记录 APP（标题 + 文本 + 标签 + 时间戳，本地存储）
铁律: docs/M-1-material/apple/liquid-glass/01-overview.md
     + 03-hig-materials.md（Standard material 5 变体）
N: 4
输出: prototype/v2-scaffold-live/scaffold-live-v2.html
```

## 提取的硬约束

按 `references/iron-rules-extraction.md` 的方法从 Apple HIG 文档里提取：

```
Apple HIG 4 铁律（visual-variant-explorer 实战版）:
☐ 玻璃元素 ≤ 4 个（topbar / sidebar / tabbar / fab / inspector / menu）
☐ 玻璃只承载 chrome（不承载内容）
☐ Standard material 5 变体：ultraThin / thin / regular / thick / clear
☐ clear 变体只能在富背景（图片 / 渐变 / 复杂内容）上用
☐ 镜面高光：1px inset border + 顶部 highlight
☐ 反 AI 味：无紫粉渐变 / 无居中孤岛 / 无 emoji 主视觉
☐ 反硬边：不用 border: 2px+ solid + box-shadow: 0 0 0
```

## 选差异轴

从 4 维（字体 / 配色 / 装饰 / 密度）+ 2 material 实验轴：

| 维度 | 极端值 |
|---|---|
| 字体 | serif ↔ sans ↔ mono |
| 配色 | 暖米黄 ↔ 工程白 ↔ 深黑 ↔ 冷灰 |
| 装饰 | 极简 ↔ 几何 ↔ 有机 ↔ 工业 |
| 密度 | sparse ↔ dense ↔ bento ↔ editorial |
| Material 实验 | regular ↔ clear ↔ Standard(thick) |

## 4 个方向设计

### A1 · Editorial · 衬线 + 暖米白 + 报刊流

**铁律自检**:
- ✓ 玻璃用在 topbar + sidebar + inspector + switcher（4 个）
- ✓ 主内容用 Standard material（衬线卡片，不玻璃）
- ✓ 用 regular 变体（clear 不需要 —— 背景是纯色）
- ✓ 字体：Fraunces (serif italic) + Manrope (sans)
- ✓ 装饰：1px inset border + 顶部 highlight

**与其他 3 个方向的差异**:
- 字体：A1 衬线 vs A2 无衬线 vs A3 衬线 italic vs A4 无衬线
- 配色：A1 暖 vs A2 冷 vs A3 深 vs A4 中
- 装饰：A1 极简 vs A2 几何 vs A3 编辑 vs A4 纸张
- 密度：A1 sparse vs A2 dense vs A3 editorial vs A4 notebook

### A2 · Lab · 无衬线 + 工程白 + 几何 dense 列表

**铁律自检**: 同 A1
**与其他方向的差异**: 见 A1 对比表

### A3 · Salon · 衬线 italic + 深黑 + editorial

**注意**（V1.0 真实错位）: A3 早期版本用了 `writing-mode: vertical-rl` 让侧边栏竖排文字，60px 宽列里塞 12 个垂直链接，**溢出严重**。修法：去掉 `writing-mode`，让侧边栏水平 icon-only（`.ic { font-size: 0; }` + 文本藏在 icon 旁）。

### A4 · Notebook · 无衬线 + 暖白 + 纸张纹理

**注意**（V1.0 真实违规）: A4 早期版本是 A4 · Studio 包豪斯 —— 用了 `border: 2px solid var(--ink)` + `box-shadow: 4px 4px 0 var(--ink)`，**违反 Apple HIG "floating" 原则**（视觉感受是 Neo-Brutalism，不是 Liquid Glass）。修法：换成 A4 Notebook（纸张纹理，1px inset border，无硬投影）。

## B 行 · 4 个变体实验（不是 regular 副本）

B 行 = 4 个真正的 material / 装饰 / 密度 极端。

### B1 · Photo · clear 变体 + 富背景图

**铁律自检**:
- ✓ 用 **clear 变体**（背景是图，必须用 clear 才能"漂浮"）
- ✓ 玻璃在 topbar + sidebar + inspector + fab + switcher —— **5 个，超 4**

**违规**（V1.0 真实错位）: B1 用了 5 个玻璃元素。修法：把 fab 改普通按钮，4 个玻璃元素。

### B2 · Terminal · mono + 纯黑 + dense 命令行

**铁律自检**:
- ✓ 全 mono 字体（"命令行感"）
- ✓ 玻璃在 topbar + switcher（2 个，远低于 4）
- ✓ 主内容是 terminal-style 列表（Standard material）

**与其他方向的差异**: 字体 mono + 密度 dense + 配色纯黑 —— 3 维都极端。

### B3 · Glass Thick · Standard material · thick 变体 · 不透明

**关键**（V1.0 真实错位）: B3 早期版本叫"B3 · Focus 极简单一焦点（regular 极致节制）" —— 但 **regular 是 Apple HIG 的 default baseline**，单独拎出来不构成 variant 实验。修法：改成 B3 Glass Thick（Standard material · thick 变体 · 不透明半透明 solid，不是 glass），体现"非玻璃的 extreme"。

### B4 · Bento · bento 网格 + Standard material · 3 列不玻璃

**违规**（V1.0 真实错位）: B4 早期版本叫"B4 · Workshop 工作坊" —— 4 列 + 多层 backdrop-filter，**违反节制原则**。修法：改成 B4 Bento（3 列 + bento 卡片全用 Standard material，**不玻璃**），体现"非玻璃的 bento 网格"。

## 4 维度差异总结

| 维度 | A1 | A2 | A3 | A4 | B1 | B2 | B3 | B4 |
|---|---|---|---|---|---|---|---|---|
| **字体** | serif | sans | serif italic | sans | sans | mono | sans | sans |
| **配色** | 暖米黄 | 工程白 | 深黑 | 暖白 | 冷调 | 纯黑 | 中灰 | 黑白 |
| **装饰** | 极简 | 几何 | editorial | 纸张 | 富图 | 命令行 | thick solid | bento 网格 |
| **密度** | sparse | dense | editorial | notebook | photo | dense | sparse | bento |
| **Material** | regular | regular | regular | regular | clear | regular | thick | standard |

✓ **任意 2 个 skin 在 4 维度上至少 2 维不同**（不是微调）。

## 实际产物

| 文件 | 说明 |
|---|---|
| `prototype/v2-scaffold-live/scaffold-live-v2.html` | V2 8 skin live switcher（46 KB） |
| `prototype/v2-scaffold-live/scaffold-live.html` | V1 8 skin live switcher（25 KB，轻量调整版，保留作历史） |
| `prototype/v2-scaffold-live/index.html` | 本批次索引页 |

打开 `scaffold-live-v2.html` → 浮动 switcher 切 A-H（或点按钮）→ 对比 8 个真正不同的视觉世界。

## 自检回顾

按 SKILL.md §步骤 6 的清单：

- [x] 8 skin 在 4 维度上至少 2 维有显著差异 ✓
- [x] 每个 skin 严格守铁律（玻璃 ≤ 4、玻璃只在 chrome、clear 只在富背景）✓
- [x] 任意两个 skin 不"看起来像"（A3 B3 早期都深黑金斜体，已修）✓
- [x] 每个 skin 的 .glass 元素数 ≤ 4 ✓
- [x] 无 `border: 2px+ solid` 类的硬边（A4 Studio 已删）✓
- [x] 无 `box-shadow: 0 0 0` 类的硬阴影 ✓
- [x] 无紫粉渐变 / 居中孤岛毛玻璃 ✓
- [x] data-skin 切换时类名不互相影响（`[data-skin="X"]` 前缀隔离）✓

## 经验教训

1. **B3 "regular 极致节制" 是错的** —— regular 是 default，单独拎出来不构成"实验"。B 行必须是真正的 material 变体（clear / thick / standard）或其他设计变量（强度 / 主色 / 装饰密度 / 排版方向）。
2. **A3 B3 早期同色系是错的** —— 4 方向里 2 个深黑金斜体 = 同一个方向的微调。强制 4 维度 ≥ 2 维不同。
3. **A4 "包豪斯硬边" 是错的** —— 视觉语言不是"粗黑边"。装饰用 inset highlight（玻璃镜面）+ soft shadow（低不透明度长投影）。
4. **B4 "4 列密集" 是错的** —— 把"丰富" = "多玻璃"。超出 ≤4 上限就违规，装饰 / 卡片用 Standard material。
5. **类名一定要 `[data-skin="X"]` 前缀** —— 不隔离会 A1 的 card 样式污染 B3 的 card。
