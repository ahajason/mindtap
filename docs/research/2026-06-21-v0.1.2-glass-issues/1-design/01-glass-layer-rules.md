# 01 · 玻璃分层宪法

> **层级**: 1-design / 玻璃分层
> **创建**: 2026-06-21
> **作用**: 定义 UI 中所有元素的"玻璃层归属",从根本上避免"玻璃乱用"
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(4 铁律)
> - `0-originals/microsoft/acrylic.md`(transient vs in-app 边界)
> - `0-originals/microsoft/fluent2-material.md`(Material 适用场景)

---

## 一、3 层结构(权威源:Apple Liquid Glass 8 维度 §1 + Microsoft Acrylic)

| 层级 | 名称 | 包含组件 | 玻璃使用 |
|---|---|---|---|
| **L1** | **控制层**(Controls) | Button / Toggle / Slider / Input | 可选 glass,优先清晰 |
| **L2** | **容器层**(Containers) | Sidebar / Toolbar / Tab bar / Card | **必须 glass**(液体玻璃标识) |
| **L3** | **内容层**(Content) | Text / List / Media / Form | **禁止 glass**(可读性优先) |

> **核心铁律**:内容层不用玻璃。这是 Apple HIG / Microsoft Acrylic 共同硬性规定。

## 二、每层规则详细

### L1 控制层(Buttons / Inputs)

- **形态**:小尺寸、可点按
- **玻璃使用**:可选
  - 默认:不透明 + brand color(active)/ gray(inactive)
  - 次级:轻微 backdrop-filter,辅助"按压力"反馈
- **圆角**:统一 `--radius-control`(建议 8-10px)
- **尺寸**:minimum 44x44pt(Apple HIG Buttons)
- **对比度**:文字与背景 ≥ 4.5:1(WCAG AA)

### L2 容器层(Sidebar / Toolbar / Tab bar / Card)

- **形态**:中等尺寸,组织其他元素
- **玻璃使用**:**强制**
  - 必须有 backdrop-filter 或等效玻璃材质
  - 必须有 inset 1px 高光(凸起感)
  - 必须有 saturation(>100%)
- **圆角**:统一 `--radius-container`(建议 16-20px)
- **玻璃深度**:4 档(参考 `0-originals/apple/liquid-glass/01-overview.md`):
  - `--glass-depth-1`:极薄,临时浮层
  - `--glass-depth-2`:薄,侧边栏
  - `--glass-depth-3`:标准,卡片 / 工具栏
  - `--glass-depth-4`:厚,弹窗 / 对话框

### L3 内容层(Text / List / Media)

- **形态**:承载信息
- **玻璃使用**:**绝对禁止**
  - 背景必须实色 / 极浅半透明(≥ 92% alpha)
  - 文字必须可读,WCAG 4.5:1 强制
- **例外**:List row hover/focus 可有极浅 tint(< 10%),不构成"glass"

## 三、嵌套规则(权威源:Apple Liquid Glass 8 维度 §2 同心圆角)

```
外层容器 ─┬─ padding ≥ 8px ─┬─ 内层容器 ─┬─ padding ≥ 4px ─┬─ 内容
         └─ 圆角 R1        └─ 圆角 R2        └─ 无圆角
```

**约束**:
- `R1 ≥ R2 + padding`(同心)
- 内层圆角 `<=` 外层圆角的一半
- 内容层不应再有容器包裹(违反分层)

## 四、玻璃深度对照表

| Depth | Backdrop-filter | Background Tint | 适用 |
|---|---|---|---|
| 1 (clear) | `blur(0) saturate(180%)` | `rgba(255,255,255,0.15)` | 临时浮层(tooltip / menu) |
| 2 (regular) | `blur(20px) saturate(180%)` | `rgba(255,255,255,0.50)` | Sidebar / Toolbar |
| 3 (regular-strong) | `blur(30px) saturate(200%)` | `rgba(255,255,255,0.70)` | Card / Section |
| 4 (thick) | `blur(40px) saturate(220%)` | `rgba(255,255,255,0.85)` | Modal / Dialog |

> **Microsoft Acrylic 同等参考**:`0-originals/microsoft/acrylic.md` §"Acrylic blend types" — Background acrylic / In-app acrylic 区分
>
> **Microsoft Fluent 2 同等参考**:`0-originals/microsoft/fluent2-material.md` — Solid / Acrylic / Mica / Smoke 4 材质适用场景

## 五、降级路径

| 场景 | 降级策略 | 出处 |
|---|---|---|
| Reduce Transparency 开启 | 玻璃 → 实色 95% alpha | Apple HIG Accessibility |
| Battery Saver | 玻璃 → 实色 100% | Microsoft Acrylic |
| 低端硬件 | 玻璃 → 实色 100% | Microsoft Acrylic |
| 窗口 inactive | 玻璃 → 降低 blur 强度 | Apple NSVisualEffectState |
| High Contrast | 玻璃 → 系统 HC 色 | Microsoft Acrylic |

## 六、错误示范(仅描述违规模式,不指向具体代码)

| 违规 | 后果 |
|---|---|
| 内容层套玻璃 | 文字模糊、对比度不足、WCAG fail |
| 多个玻璃容器紧贴 | 出现可见接缝(seam artifact) |
| 嵌套玻璃 + 反向圆角 | 失去同心感,视觉凌乱 |
| 全屏玻璃(无 opaque anchor) | 后面内容穿透,blur 失效 |

---

**引用源**:
- Apple Liquid Glass 4 铁律 — `0-originals/apple/liquid-glass/03-hig-materials.md`
- Apple Liquid Glass 8 维度 — `0-originals/apple/liquid-glass/01-overview.md`
- Microsoft Acrylic blend types — `0-originals/microsoft/acrylic.md`
- Microsoft Fluent 2 Material — `0-originals/microsoft/fluent2-material.md`