# P1 · Button 同 size / 跨 variant 圆角不一致

> **优先级**: 🟠 P1(视觉一致性)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/05-button-spec.md`](../../1-design/05-button-spec.md) §五
> **关联原始**:
> - `0-originals/apple/hig/01-buttons.md`(按钮几何规范)

---

## 一、问题现状(代码实测)

`src/components/ui/button.tsx:20-21`:

```tsx
size: {
  sm: 'h-8 px-3 text-[13px] rounded-md',                  // rounded-md = 6px
  md: 'h-10 px-4 text-sm rounded-[var(--radius-button)]', // rounded-[12px]
},
```

**问题 R1**:同一组件不同 size 圆角不一致:
- `size: sm` `rounded-md`(6px)
- `size: md` `rounded-[var(--radius-button)]`(12px)

视觉上 sm 偏方,md 偏圆,跟规范"控件圆角统一"不符。

`src/components/ui/button.tsx:17`:

```tsx
icon:
  'glass-l1 rounded-full text-text-1 hover:bg-white/55',
```

**问题 R2**:`variant: icon` 用 `rounded-full` 跟其他 variant 不同:
- `primary` / `secondary` / `ghost` 继承 size 的圆角(md 是 12px)
- `icon` 强制 `rounded-full`(完全圆)

**影响**:icon 按钮在 primary 行内出现时,跟 sibling primary 按钮圆角视觉反差大。

## 二、设计匹配

[`1-design/05-button-spec.md`](../../1-design/05-button-spec.md) §五:

| 维度 | 值 |
|---|---|
| **圆角** | 8-10px(`--radius-control`) |
| **最小高度** | 32pt(`regular`) |

**Apple HIG Buttons**:按钮几何应当一致,**icon 按钮可以是方形/圆形,但需明确规范**。

## 三、解决路径

### 路径 BV-1:统一 `--radius-button: 10px`,所有 size 引用

```css
:root { --radius-button: 10px; }
```

```tsx
size: {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-button)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-button)]',
},
icon: 'glass-l1 rounded-[var(--radius-button)] text-text-1 hover:bg-white/55',
```

| 优点 | 全 Button 圆角统一 10px |
| 缺点 | icon 失去完全圆特性 |

### 路径 BV-2:icon variant 改 `rounded-lg`(8px)跟 primary 一致,sm 改 8px

```tsx
size: {
  sm: 'h-8 px-3 text-sm rounded-[8px]',
  md: 'h-10 px-4 text-sm rounded-[10px]',
},
icon: 'glass-l1 rounded-[10px] text-text-1 hover:bg-white/55',
```

| 优点 | 2 个 size 圆角接近(8/10),icon 跟 md 一致 |
| 缺点 | sm 跟 md 仍有 2px 差异 |

### 路径 BV-3:icon 按钮单独规范(square 1:1)

如果未来需要完全圆 icon,新增 `icon-circle` variant:

```tsx
icon: 'glass-l1 rounded-[var(--radius-button)] ...',
iconCircle: 'glass-l1 rounded-full ...',
```

| 优点 | icon 形状由用户选 |
| 缺点 | API 复杂 |

## 四、推荐

**BV-1**(全 Button 圆角统一 `--radius-button: 10px`)。icon 失去 rounded-full 但视觉更一致。

若产品坚持 icon 必须圆,用 **BV-3**(新增 iconCircle variant)。

## 五、自检

| 检查项 | 方法 |
|---|---|
| Button sm / md / icon 圆角一致 | 视觉对比 |
| `--radius-button: 10px` 在 `src/index.css` 定义 | grep |
| 跟 Sidebar Row `rounded-md` / Card `rounded-card` 圆角 token 不冲突 | grep 验证 |

---

**引用源**:
- 设计规范 — [`1-design/05-button-spec.md`](../../1-design/05-button-spec.md) §五
- 原始资料 — `0-originals/apple/hig/01-buttons.md`