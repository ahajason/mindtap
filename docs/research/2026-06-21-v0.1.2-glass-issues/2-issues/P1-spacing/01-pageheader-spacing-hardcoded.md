# P1 · PageHeader / Section / 容器间距全部硬编码

> **优先级**: 🟠 P1(token 化未完成,77 处硬编码)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三
> **关联原始**:
> - `0-originals/apple/hig/04-sidebars.md`(padding 命名 vs 实际值的对应关系)

---

## 一、问题现状(代码实测)

`PageHeader.tsx:8`:

```tsx
<header className="mb-6">  // 硬编码 24px,应引用 var(--spacing-6)
  <h1 className="text-2xl font-semibold text-text-1">{title}</h1>
  {description && <p className="text-sm text-text-2 mt-1">{description}</p>}  // mt-1 硬编码 4px
</header>
```

6 子页面根容器:

```tsx
// Button.tsx:31 / Input.tsx:16 / Tokens.tsx:22 / Surface.tsx:14 / ...
<section className="glass-l3 rounded-xl p-4 space-y-4">  // p-4 + space-y-4 硬编码
```

`LivePreview.tsx:12`:

```tsx
'rounded-[var(--radius-card)] border border-dashed border-white/40 p-6',
//                                                       ^^^^ p-6 硬编码
```

`Tokens.tsx:24-29`:

```tsx
<h2 className="text-lg font-semibold text-text-1 mb-3">  // mb-3 硬编码
<div className="grid grid-cols-4 gap-3">                  // gap-3 硬编码
  <Card key={c.name} tier="l1" className="p-3">          // p-3 硬编码
    <div className="... mb-2" ... />                      // mb-2 硬编码
```

**统计**(grep 验证):src/ 下 Tailwind spacing class 硬编码 **77 处**。

## 二、根因

spacing token(`--spacing-1..7`)已在 `src/index.css`,但:

1. 0 处 `var(--spacing-N)` 引用(token 没人用)
2. 77 处 `p-N` / `m-N` / `gap-N` / `space-y-N` 硬编码

**结论**:token 形同虚设,所有 spacing 决策飘在 Tailwind 默认 scale,跟 design intent 无关。

## 三、规范要求

[`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三:

| 维度 | 值 |
|---|---|
| Sidebar 水平 padding | 16px(= `--spacing-4`) |
| Sidebar 底部 padding | 16px(= `--spacing-4`) |
| Row 高度 | 36-40px |
| Sidebar header 到 nav 间距 | 上 16px / 下 6px |

**统一 token 体系**(已 G3 修复):

| Token | 值 | 典型用途 |
|---|---|---|
| `--spacing-1` | 4px | 微调 |
| `--spacing-2` | 8px | icon + label |
| `--spacing-3` | 12px | 紧凑间距 |
| `--spacing-4` | 16px | 容器内 padding |
| `--spacing-5` | 20px | 中等间距 |
| `--spacing-6` | 24px | PageHeader / 大段间距 |
| `--spacing-7` | 32px | 跨 section 间距 |

## 四、解决路径

### 路径 PS-1:渐进替换 — PageHeader + 6 子页面优先(推荐短期)

```tsx
// PageHeader.tsx:8
<header className="mb-[var(--spacing-6)]">  // 24px

// Button.tsx:31 等 6 子页面
<section className="glass-l3 rounded-xl p-[var(--spacing-4)] space-y-[var(--spacing-4)]">
```

| 优点 | 高频使用位置先 token 化 |
| 改动量 | 7 文件,~10 行 |
| 推荐度 | ⭐⭐⭐ |

### 路径 PS-2:Tailwind config 映射(推荐长期)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '1': 'var(--spacing-1)',
        '2': 'var(--spacing-2)',
        // ...
        '4': 'var(--spacing-4)',
        '6': 'var(--spacing-6)',
      }
    }
  }
}
```

然后 `p-4` 自动 = `var(--spacing-4)`。

| 优点 | 现有 `p-4` / `gap-3` 写法不变,自动 token 化 |
| 缺点 | 需 Tailwind 4 config 调整 |

### 路径 PS-3:全部 77 处一次性替换

全 grep `p-N` / `m-N` / `gap-N` / `space-y-N` → 替换为 `var(--spacing-N)`。

| 优点 | 一步到位 |
| 缺点 | 改动面大,容易出 bug |

## 五、推荐

**PS-2 长期 + PS-1 短期验证**

PS-2 让 Tailwind class 自动 token 化,**所有现有 77 处硬编码立即获得 token 含义**,无 1 行组件改动。

## 六、自检

| 检查项 | 方法 |
|---|---|
| 全仓 `var(--spacing-N)` 引用 ≥ 20 处 | grep |
| PageHeader `mb-6` 视觉 = 24px | dev tools 量 |
| Section `p-4` 视觉 = 16px | dev tools 量 |
| 跨页面间距一致 | 视觉对比 |

---

**引用源**:
- 设计规范 — [`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三
- 原始资料 — `0-originals/apple/hig/04-sidebars.md`