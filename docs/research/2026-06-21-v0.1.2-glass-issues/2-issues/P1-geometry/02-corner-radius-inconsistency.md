# P1 · 圆角 token 不统一

> **优先级**: 🟠 P1(视觉一致性)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §三(同心圆角)
> **关联原始**:
> - `0-originals/apple/liquid-glass/01-overview.md`(8 维度 §2 同心圆角)
> - `0-originals/apple/swiftui/01-key-apis.md` §8(`ConcentricRectangle`)
> - `0-originals/apple/liquid-glass/02-adopting.md` §3(对齐圆角)

---

## 一、问题表现

| 元素 | 当前圆角 |
|---|---|
| 玻璃容器(StyleGuideLayout 外层) | `rounded-2xl` = **16px** |
| Sidebar | `rounded-xl` = **12px** |
| Main Card | `rounded-xl` = **12px** |
| PageHeader section | `rounded-xl` = **12px** |
| NavLink row | 无圆角 / 6px |

没有统一 token,各处硬编码。

## 二、根因

`glassic-ui-spec.md` 是 `.archive/docs/`,未恢复到 `docs/design/`,所以 Tailwind config 没引用 token,开发者各自硬编码 `rounded-xl` / `rounded-2xl`。

## 三、设计匹配

[`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §三(嵌套规则):

```
外层 R1 ≥ R2 + padding  (同心)
内层圆角 ≤ 外层圆角的一半
```

**Apple 范式**(`0-originals/apple/liquid-glass/01-overview.md` 8 维度 §2):

> 同心圆角:嵌套容器时,外层圆角 ≥ 内层圆角 + 间距,保持视觉同心

**SwiftUI 原生支持**(`ConcentricRectangle`):自动计算同心圆角,无需手动算 padding。

## 四、3 层圆角 token(规范)

| Layer | Token | 值 | 适用 |
|---|---|---|---|
| **L1 控制** | `--radius-control` | **8px** | Button / Input / Toggle |
| **L2 容器** | `--radius-container` | **16px** | Sidebar / Card / Toolbar |
| **L2 容器(主)** | `--radius-container-lg` | **20px** | 主容器(StyleGuideLayout 外层) |
| **L3 内容** | 无圆角 | **0** | 内容 row / list item |

## 五、解决路径

### 路径 R-1:Tailwind config 引用 token(优先)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        'control': '8px',
        'container': '16px',
        'container-lg': '20px',
      }
    }
  }
}
```

```jsx
<aside className="rounded-container">  // 不再硬编码 rounded-xl
<button className="rounded-control">
```

### 路径 R-2:恢复 glassic-ui-spec.md 到 docs/design/

| 改动 | 文件 |
|---|---|
| `cp .archive/docs/design/glassic-ui-spec.md docs/design/` |
| 把所有 `--glass-*` / `--radius-*` token 同步到 `src/index.css` |

## 六、推荐

**R-1 立即 + R-2 后续**

理由:
- R-1 是 Tailwind 工程化,跟 glassic spec token 解耦
- R-2 把 spec 文档恢复,后续 reference 完整

## 七、自检

| 检查项 | 方法 |
|---|---|
| 全仓 grep `rounded-xl` / `rounded-2xl` | 应该 0 处硬编码 |
| 全部用 `rounded-control` / `rounded-container` token | grep 验证 |
| 嵌套容器同心(外层圆角 ≥ 内层 + padding) | dev tools 查 DOM |
| glassic-ui-spec.md 恢复到 `docs/design/` | `ls docs/design/` |

---

**引用源**:
- 设计规范 — [`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §三
- 原始资料 — `0-originals/apple/liquid-glass/01-overview.md` + `0-originals/apple/swiftui/01-key-apis.md` §8 + `0-originals/apple/liquid-glass/02-adopting.md` §3