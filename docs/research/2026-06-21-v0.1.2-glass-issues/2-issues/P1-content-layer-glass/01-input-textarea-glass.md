# P1 · `<input>` / `<textarea>` 用 glass-l1(违反铁律)

> **优先级**: 🟠 P1(违反 4 铁律 §1,影响所有表单)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §一 L3 内容层
> **关联原始**:
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(4 铁律 §1:"不要在内容层使用 Liquid Glass")
> - `0-originals/microsoft/acrylic.md`("Don't put desktop acrylic on large background surfaces of your app")

---

## 一、问题现状(代码实测)

`src/components/ui/input.tsx:6`:

```tsx
'inline-flex items-center justify-center gap-2 font-medium transition-all duration-base ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed'
```

但实际 className 在文件其它位置:

```tsx
className="glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-3 transition-all duration-base focus-visible:outline-none focus-visible:bg-white/55"
```

`src/components/ui/textarea.tsx:6`:

```tsx
'glass-l1 rounded-[var(--radius-input)] text-sm text-text-1 placeholder:text-text-3 p-3 transition-all duration-base focus-visible:outline-none focus-visible:bg-white/55 resize-none'
```

**问题**:`<input>` 和 `<textarea>` 是 L3 内容层(用户输入的文字),用 `glass-l1` 违反 4 铁律 §1。

## 二、范式违反

| 铁律 | 当前 | 违反 |
|---|---|---|
| ❌ 内容层不用 Liquid Glass | input/textarea 用 glass-l1 | ❌ |
| ✅ 节制使用 | 一屏多个 input 全 glass | ⚠️ |

**Microsoft Acrylic 原文**:`Don't put desktop acrylic on large background surfaces of your app` — input 在表单里就是大背景面。

## 三、设计匹配

[`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §一 3 层结构:

| 层级 | 包含 | 玻璃使用 |
|---|---|---|
| L1 控制(Button / Input / Toggle) | **Input 是控制层,不是内容层** | **可选** |

等等 — Input 本身是 L1 控制(用户操作的控件),但用户**输入的文字**是 L3 内容。

> **重新审视**:`<input>` 的容器背景 = L1 控制(可用 glass);`<input>` 内的文字 = L3 内容(必须可读)。所以 glass 是允许的,**但要确保文字可读**。

**实际问题的子项**:

| # | 子问题 | 严重度 |
|---|---|---|
| 1 | `glass-l1` 在 light 模式下,blur 20px 采样穿透文字,可能影响 placeholder 可见 | 🟠 |
| 2 | `placeholder:text-text-3`(#98A2B3)在 glass 上对比度 < 4.5:1(WCAG AA 失败) | 🔴 |
| 3 | `focus-visible:outline-none focus-visible:bg-white/55` — 鼠标焦点 ring 缺失,只改 bg 太弱 | 🟠 |

## 四、解决路径

### 路径 I-1:保留 glass,但提亮 placeholder + 加强 focus ring(短期)

```tsx
// src/components/ui/input.tsx
className="glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-2 transition-all duration-base focus-visible:outline-2 focus-visible:outline-primary focus-visible:bg-white/55"
```

| 改动 | `placeholder:text-text-3` → `placeholder:text-text-2` + `outline` 替代仅改 bg |
| 优点 | 保留 glass 视觉,2 处微调 |
| 缺点 | 不解决玻璃根本上的 placeholder 可读性 |

### 路径 I-2:input 改实色 + 仅聚焦时浅玻璃(推荐)

```tsx
className="bg-white/85 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-2 transition-all duration-base focus:bg-white/95 focus-visible:outline-2 focus-visible:outline-primary focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-primary/15"
```

| 优点 | 默认实色可读性最高 + 聚焦时 ring 清晰 |
| 缺点 | 失去 input 的 glass 视觉 |

### 路径 I-3:input 维持 glass,但 focus 时透明度升 95%(中间方案)

```tsx
className="glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-2 transition-all duration-base focus-visible:outline-2 focus-visible:outline-primary"
```

| 优点 | glass 视觉保留,placeholder 升 text-2 |
| 缺点 | 仍违反铁律 §1(本质上) |

## 五、推荐

**I-2**(最干净)。`input` 作为表单核心,实色是 default,聚焦加 ring。

若需保留 glass 视觉,选 **I-1**(代价小)。

## 六、自检

| 检查项 | 方法 |
|---|---|
| placeholder 文字对比度 ≥ 4.5:1 | WebAIM checker |
| 聚焦时 outline 2px brand,≥ 3:1 | WebAIM checker |
| 失焦后 input 背景恢复 | dev tools 观察 |
| 输入文字可读性 | 输入文字后视觉对比 |

---

**引用源**:
- 设计规范 — [`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §一
- 原始资料 — `0-originals/apple/liquid-glass/03-hig-materials.md` + `0-originals/microsoft/acrylic.md`