# P1 · Card 内部 padding 不一致(`p-3` vs `p-4` 混用)

> **优先级**: 🟠 P1(视觉一致性)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §三
> **关联原始**:
> - `0-originals/apple/hig/04-sidebars.md`(容器 padding 一致性)

---

## 一、问题现状(代码实测)

`src/routes/Tokens.tsx:27`:

```tsx
<Card key={c.name} tier="l1" className="p-3">  // p-3 = 12px
```

`src/routes/Surface.tsx:22-24`:

```tsx
<Card tier="l1" className="p-4 w-48">L1 Card</Card>  // p-4 = 16px
<Card tier="l2" className="p-4 w-48">L2 Card</Card>
<Card tier="l3" className="p-4 w-48">L3 Card</Card>
```

**问题**:Card 内部 padding 在不同场景不一致:
- Tokens 色板用 `p-3`(12px)
- Surface 演示用 `p-4`(16px)

视觉上同类 Card 出现时大小不一致。

## 二、设计匹配

[`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §三(同心圆角):

> 嵌套规则:外层 R1 ≥ R2 + padding(同心)
> 内容层不应再有容器包裹(违反分层)

[`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三:

| 维度 | 值 |
|---|---|
| Sidebar 水平 padding | 16px(`--spacing-4`) |
| Sidebar 底部 padding | 16px(`--spacing-4`) |

## 三、解决路径

### 路径 CP-1:统一 Card padding = 16px(`p-4`)

```tsx
// Tokens.tsx:27
<Card key={c.name} tier="l1" className="p-4">  // 改 p-3 → p-4
```

| 优点 | 全 Card 一致 16px |
| 缺点 | Tokens 色板可能视觉偏松 |

### 路径 CP-2:Card 组件化 — props 接受 `padding`

```tsx
// src/components/ui/card.tsx
<Card padding="md">L2 Card</Card>  // = p-4

// 或更简单:
<Card density="compact">...</Card>   // = p-3
<Card density="regular">...</Card>   // = p-4
```

| 优点 | 语义化,文档自动生成 |
| 缺点 | API 复杂 |

### 路径 CP-3:Card 组件内置默认 padding,使用者不传

```tsx
// src/components/ui/card.tsx
export function Card({ className, padding = 'md', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)]',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-4',
        className
      )}
      {...props}
    />
  );
}
```

| 优点 | 默认 16px,需要紧凑时显式 `padding="sm"` |
| 缺点 | +1 prop |

## 四、推荐

**CP-3**(Card 内置 padding prop,默认 md=16px)。Tokens 色板显式 `padding="sm"`,Surface 演示用默认。

## 五、自检

| 检查项 | 方法 |
|---|---|
| Card 默认 padding = 16px | grep `card.tsx` |
| 视觉上 Tokens 色板 vs Surface Card 一致 | 视觉对比 |
| 嵌套同心圆角(外层 Card 圆角 ≥ 内层 Card 圆角 + padding) | dev tools |

---

**引用源**:
- 设计规范 — [`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §三 + [`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三
- 原始资料 — `0-originals/apple/hig/04-sidebars.md`