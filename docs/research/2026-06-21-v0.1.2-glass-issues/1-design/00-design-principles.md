# 00 · 设计原则总纲(Liquid Glass 8 维度)

> **层级**: 1-design / 总纲
> **创建**: 2026-06-21
> **作用**: 设计哲学 — 一切交互/视觉/无障碍决策的源头
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/liquid-glass/01-overview.md`(Liquid Glass 8 维度)
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(Materials 4 铁律)

---

## 一、设计语言:Liquid Glass(macOS 26+ / WWDC25)

Liquid Glass 是 Apple 在 macOS 26(Tahoe)推出的系统级材质语言,核心思想是:

> "Translucent material that dynamically concentrates light, defines focus, and expresses a sense of depth."

**它不是一个 CSS 滤镜,是一个材质系统** — 同时承载光影、聚焦、深度、动效。

## 二、8 维度(权威源:Apple Liquid Glass Overview)

| # | 维度 | 规范要求 |
|---|---|---|
| 1 | **4 层玻璃深度** | 系统级标准 / 容器玻璃 / 控件玻璃 / 临时表面 — 不同层级用不同玻璃深度 |
| 2 | **同心圆角** | 嵌套容器时,外层圆角 ≥ 内层圆角 + 间距,保持视觉同心 |
| 3 | **组件玻璃化** | 导航 / 工具栏 / Sidebar / Tab bar 等"容器型"组件应使用玻璃材质 |
| 4 | **4 图标样式** | Mono / Color / Hierarchical / Palette — 不同语境用不同样式 |
| 5 | **3 Z 轴层级** | Base / Raised / Floating — 控件的视觉高度应反映交互层级 |
| 6 | **动效规范** | 形变 / 渐显 / 滑动 都需 spring 动画,避免线性 |
| 7 | **色彩与 Light/Dark** | 玻璃材质自动适配 Light/Dark,需用 system color / semantic color |
| 8 | **Mac 专属深度** | macOS 26 支持玻璃更多维度(凸起高度 / 采样频率 / tint 强度) |

## 三、Materials 4 铁律(权威源:Apple HIG Materials)

> 任何材质(玻璃 / 不透明 / 临时表面)都遵循这 4 条:

1. **不要在内容层使用 Liquid Glass** — 内容(文字、列表、媒体)需要可读性,玻璃会降低可读性
2. **节制使用** — 一屏不超过几个玻璃元素,过多会失去层次感
3. **clear 仅丰富背景时使用** — `.glass-clear` 适用于已经有低频背景的场景,不适合纯透明
4. **regular 适用多数** — `.glass-regular` 是默认推荐,blur + tint 平衡可读性

## 四、设计原则 — mindtap 自有补充

| 原则 | 说明 | 出处 |
|---|---|---|
| **可读性优先** | 所有视觉决策优先满足 WCAG 2.2 AA(4.5:1 / 3:1) | WCAG 2.2 |
| **系统级集成** | 优先用系统 API(macOS NSVisualEffectView),其次模拟实现 | Apple HIG |
| **不要凭空虚构** | 所有 token / 尺寸 / 间距必须有具体来源(spec / 标准 / 文档) | Apple HIG |
| **跨窗口一致性** | 同类组件(Sidebar / Toolbar)在所有页面表现一致 | Apple HIG Split Views |
| **辅助功能优先** | Reduce Transparency / Reduce Motion 必须被尊重 | Apple HIG Accessibility |

## 五、设计哲学 3 句话

```
玻璃不是装饰,是结构。
可读性不是偏好,是底线。
一致性不是重复,是约定。
```

## 六、对设计决策的指导

当面对任何视觉/交互/无障碍决策,按以下顺序检查:

1. **WCAG 2.2 AA 通过?** — 4.5:1 文字 / 3:1 UI 组件
2. **Apple HIG 是否明确规范?** — 如有,严格遵守
3. **Liquid Glass 8 维度是否覆盖?** — 缺哪个维度需要补
4. **是否破坏 4 铁律?** — 内容层用玻璃 / 过度使用 / clear 滥用 / 没用 regular
5. **Reduce Transparency / Reduce Motion 是否兼容?** — 系统设置优先

---

**引用源**:
- Apple Liquid Glass Overview(8 维度) — `0-originals/apple/liquid-glass/01-overview.md`
- Apple HIG Materials(4 铁律) — `0-originals/apple/liquid-glass/03-hig-materials.md`
- WCAG 2.2 — `0-originals/wcag/1.4.3-contrast-minimum.md` + `0-originals/wcag/1.4.11-non-text-contrast.md`