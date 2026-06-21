# P1 · `Card` 组件 `tier="l1/l2/l3"` 用玻璃(Card 是内容载体)

> **优先级**: 🟠 P1(违反 4 铁律 §1 + 性能铁律 §1)
> **创建**: 2026-06-21
> **状态**: 🟡 **部分修复** — Card 加 `padding` prop 默认 md=16px,但 `tier="l1/l2/l3"` 仍保留(供 Dialog 等 L2/L3 容器使用)
> **修复 commit**: `b89d8a0` fix(controls): Card padding prop
> **关联设计**: [`../../1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §二 L2 容器 vs L3 内容
> **关联原始**:
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(4 铁律 + 节制使用)

---

## 一、问题现状(代码实测)

`src/components/ui/card.tsx` 提供 `Card` 组件,接受 `tier="l1" | "l2" | "l3"` prop,内部应用 `glass-l1/2/3` class。

`src/routes/Surface.tsx:22-24`:

```tsx
<Card tier="l1" className="p-4 w-48">L1 Card</Card>
<Card tier="l2" className="p-4 w-48">L2 Card</Card>
<Card tier="l3" className="p-4 w-48">L3 Card</Card>
```

`src/routes/Tokens.tsx:27`:

```tsx
<Card key={c.name} tier="l1" className="p-3">
  <div className="w-full h-12 rounded-md mb-2" style={{ background: c.value }} />
  <div className="text-xs font-mono text-text-1">{c.name}</div>
  <div className="text-xs font-mono text-text-3">{c.value}</div>
</Card>
```

**问题**:`Card` 是承载内容的容器,在 L2 容器层(玻璃)内使用 L2/L3 玻璃,违反:
1. **铁律 §1 内容层不用 Liquid Glass** — Card 内的色块 / 文字是内容
2. **铁律 §1 节制** — Surface.tsx 一屏 3 个 Card 玻璃 + Tokens.tsx 色板 4×3 = 12 个 Card 玻璃
3. **嵌套玻璃 seam** — Card glass-l3 嵌在 Tokens 区 glass-l3 容器内,blur 边缘可见接缝

## 二、范式违反

| 范式 | 当前 | 违反 |
|---|---|---|
| 4 铁律 §1:内容层不用 Liquid Glass | Card 包内容用 glass | ❌ |
| 4 铁律 §1:节制(≤ 5 一屏) | Tokens 色板 12 Card + Surface 3 Card + Section container = ≥ 15 玻璃 | ❌ |
| Microsoft Acrylic seam 警告 | Card edge-to-edge 在 Section 内 | ❌ |
| Apple Liquid Glass 同心圆角 | Card 圆角 + Section 圆角 非同心 | ⚠️ |

**Microsoft Acrylic 原文**:

> However, to avoid creating a striping effect, try not to place multiple pieces of acrylic edge-to-edge - this can create an unwanted seam between the two blurred surfaces.

## 三、设计匹配

[`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §一 + §三:

> L2 容器层:**必须** glass
> L3 内容层:**绝对禁止** glass
> 嵌套规则:外层 R1 ≥ R2 + padding(同心)

## 四、解决路径

### 路径 K-1:Card 组件去 `tier` prop,改实色(推荐)

```tsx
// src/components/ui/card.tsx
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] bg-white/85 border border-neutral-200/60 shadow-sm',
        className
      )}
      {...props}
    />
  );
}
```

| 优点 | Card 变实色,内容可读性 + 性能 + 同心圆角都解决 |
| 改动量 | 1 文件 + 2 个使用方(Surface / Tokens)|
| 推荐度 | ⭐⭐⭐ |

### 路径 K-2:Card 保留 glass,但只在 page-level 用

```tsx
// Card 内部用实色,只在 demo 区演示时用 glass
<Card variant="glass-l2">L2 Glass Demo</Card>  // 演示用
<Card>普通内容</Card>  // 实色默认
```

| 优点 | 演示与生产分离 |
| 缺点 | API 复杂 |

### 路径 K-3:Card 完全删除 tier / glass,Surface 演示改用 div

```tsx
// Surface.tsx 改为:
<div className="glass-l1 rounded-[var(--radius-card)] p-4 w-48">L1 Glass Demo</div>
<div className="glass-l2 rounded-[var(--radius-card)] p-4 w-48">L2 Glass Demo</div>
<div className="glass-l3 rounded-[var(--radius-card)] p-4 w-48">L3 Glass Demo</div>
```

| 优点 | Card 组件纯实色,demo 直接用 div + glass class |
| 缺点 | Surface 演示代码不优雅 |

## 五、推荐

**K-1**(最干净)。Card 组件设计原则就是承载内容,**默认实色**;glass 留给容器层(Section / Sidebar)。

## 六、自检

| 检查项 | 方法 |
|---|---|
| `Card` 组件不再接受 `tier` prop,内部不再用 glass | grep `glass-l` in `src/components/ui/card.tsx` |
| `Surface.tsx` / `Tokens.tsx` 调整后,一屏独立 glass ≤ 5 | DOM count |
| Card 圆角同心(外层 Section 圆角 ≥ Card 圆角 + padding) | dev tools |
| WCAG 4.5:1 实色 Card 文字 | WebAIM checker |

---

**引用源**:
- 设计规范 — [`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §一 + §三
- 原始资料 — `0-originals/apple/liquid-glass/03-hig-materials.md` + `0-originals/microsoft/acrylic.md`