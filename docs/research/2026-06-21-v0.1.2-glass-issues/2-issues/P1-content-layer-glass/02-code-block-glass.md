# P1 · 代码示例 `<pre>` 用 glass-l1(读代码区是内容层)

> **优先级**: 🟠 P1(违反 4 铁律 §1)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §二 L3
> **关联原始**:
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(铁律 §1)
> - `0-originals/microsoft/acrylic.md`("Don't put desktop acrylic on large background surfaces")

---

## 一、问题现状(代码实测)

`src/components/style-guide/CodeBlock.tsx:20`:

```tsx
<div className="relative rounded-[var(--radius-input)] glass-l1 p-4 group">
  <pre className={cn('text-xs text-text-1 overflow-x-auto')}>
    <code>{code}</code>
  </pre>
  ...
</div>
```

6 子页面路由的代码展示也用 `glass-l1`:

| 文件 | 行 |
|---|---|
| `src/routes/Button.tsx` | 末尾 `<pre className="glass-l1 ...">` |
| `src/routes/Input.tsx` | 末尾 `<pre className="glass-l1 ...">` |
| `src/routes/Overlay.tsx:46` | `<pre className="glass-l1 rounded-md p-4 text-xs text-text-1 overflow-x-auto">` |
| `src/routes/Feedback.tsx:51` | 同上 |
| `src/routes/Surface.tsx:30` | 同上 |

**问题**:代码区是 L3 内容层(读代码),用 glass-l1 违反 4 铁律 §1。

## 二、为什么 code block 不该用 glass

1. **代码密度高**:多行小字,blur 会让字符边缘模糊,可读性下降
2. **代码本身有色彩**(syntax highlight 未来),玻璃 tint 会污染色彩
3. **代码区通常较大**,违反 Microsoft Acrylic "Don't put desktop acrylic on large background surfaces"

## 三、设计匹配

[`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §二 L3 内容层:

> **玻璃使用:绝对禁止**
> - 背景必须实色 / 极浅半透明(≥ 92% alpha)

## 四、解决路径

### 路径 C-1:CodeBlock 改 `bg-text-1/5`(中性灰底)

```tsx
<div className="relative rounded-[var(--radius-input)] bg-neutral-900/[0.04] border border-neutral-200/60 p-4 group">
```

| 优点 | 中性灰底,不抢代码视觉,vs glass-l1 视觉更清晰 |
| 改动量 | 1 文件 + 5 子页面 × 1 行 |
| 推荐度 | ⭐⭐⭐ |

### 路径 C-2:CodeBlock 保留 glass 但降低 blur

```tsx
<div className="glass-l1 backdrop-blur-[2px] ...">  // blur 从 20px → 2px
```

| 优点 | 仍有 glass 视觉,但 blur 几乎无 |
| 缺点 | glass 视觉很弱,不如直接实色 |

### 路径 C-3:CodeBlock 改成 dark syntax(不透明)

```tsx
<div className="bg-neutral-900 text-neutral-100 p-4 rounded-[var(--radius-input)]">
```

| 优点 | 类 VSCode / GitHub 风格,可读性最高 |
| 缺点 | 跟 light theme 整体反差大,需要单独 dark section |

## 五、推荐

**C-1**(最稳妥,改 1 行 className)

## 六、自检

| 检查项 | 方法 |
|---|---|
| CodeBlock 容器不再 `glass-l*` | grep `glass-l` in CodeBlock + 5 子页面 |
| 代码文字对比度 ≥ 4.5:1 | WebAIM checker |
| 代码区无 blur 副作用 | 视觉 |
| 复制按钮(copy icon button)仍在玻璃上可识别 | hover 视觉对比 |

---

**引用源**:
- 设计规范 — [`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §二 L3
- 原始资料 — `0-originals/apple/liquid-glass/03-hig-materials.md` + `0-originals/microsoft/acrylic.md`