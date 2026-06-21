# P1 · 字体大小未引用 token(`text-sm` / `text-2xl` / `text-[13px]` 硬编码)

> **优先级**: 🟠 P1(token 化未完成)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三 + [`1-design/03-toolbar-spec.md`](../../1-design/03-toolbar-spec.md) §八
> **关联原始**:
> - `0-originals/apple/hig/07-color.md`(语义化字号)
> - `0-originals/apple/hig/08-accessibility.md`(Dynamic Type 支持)

---

## 一、问题现状(代码实测)

`src/index.css:54-59` 已定义字号 token:

```css
--text-core:    48px;
--text-h1:      24px;
--text-h2:      16px;
--text-h3:      14px;
--text-caption: 12px;
```

但代码里**硬编码** Tailwind class,未引用 token:

| 文件:行 | 硬编码 | 应引用 token |
|---|---|---|
| `PageHeader.tsx:9` | `text-2xl`(24px) | `var(--text-h1)` |
| `PageHeader.tsx:10` | `text-sm`(14px) | `var(--text-h3)` |
| `Sidebar.tsx:16` | `text-sm`(14px) | `var(--text-h3)` |
| `button.tsx:20` | `text-[13px]`(13px) | `var(--text-h3)`(14px)— **甚至不一致** |
| `button.tsx:21` | `text-sm`(14px) | `var(--text-h3)` |
| `CodeBlock.tsx:21` | `text-xs`(12px) | `var(--text-caption)` |

## 二、根因

Tailwind 4 class 跟 CSS var 不直接联动:

- `text-sm` 在 Tailwind 默认 = 14px(=`--text-h3` 值)
- `text-xs` 在 Tailwind 默认 = 12px(=`--text-caption` 值)

**值相同,但语义没建立**:
- 改 `--text-h3: 14px → 15px`,`text-sm` 不会跟改
- 开发者无法从 `text-sm` 看出"这是 H3"

## 三、规范要求

[`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三:

| 元素 | 字号规范 |
|---|---|
| Sidebar Row 文字 | 14px |
| Sidebar NavLink | 14px |

[`1-design/03-toolbar-spec.md`](../../1-design/03-toolbar-spec.md) §八:

| 元素 | 字号规范 |
|---|---|
| Toolbar Title | 17pt(Toolbar 标准) / 28pt+(Large title) |
| Toolbar Button | 13pt / 14pt |

**Apple HIG 默认字号**(权威源 `0-originals/apple/hig/08-accessibility.md`):

| Platform | Default | Minimum |
|---|---|---|
| macOS | 13 pt | 10 pt |

## 四、解决路径

### 路径 FT-1:建立 Tailwind class 跟 CSS var 映射(推荐)

在 `src/index.css` 用 `@theme` 重新声明:

```css
@theme {
  --text-h1: 24px;     /* 跟 Tailwind text-2xl 同步 */
  --text-h2: 16px;     /* 跟 Tailwind text-base 同步 */
  --text-h3: 14px;     /* 跟 Tailwind text-sm 同步 */
  --text-caption: 12px; /* 跟 Tailwind text-xs 同步 */
}
```

然后在组件里:

```tsx
// 之前
<h1 className="text-2xl">  // 24px,跟 token 无关

// 之后
<h1 className="text-[length:var(--text-h1)]">  // 引用 token
// 或
<h1 style={{ fontSize: 'var(--text-h1)' }}>     // 内联
```

| 优点 | 严格 token 化 |
| 缺点 | 写法冗长 |

### 路径 FT-2:Tailwind config 自定义字号 scale(更适合)

在 `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        h1: 'var(--text-h1)',
        h2: 'var(--text-h2)',
        h3: 'var(--text-h3)',
        caption: 'var(--text-caption)',
      }
    }
  }
}
```

然后组件里:

```tsx
<h1 className="text-h1">  // 直接读 token
<p className="text-h3">
```

| 优点 | 写 class 跟 token 同名,可读性高 |
| 缺点 | +Tailwind config 改动 |

### 路径 FT-3:最低改动 — 修 `text-[13px]` 不一致(应急)

```tsx
// button.tsx:20
sm: 'h-8 px-3 text-[13px] rounded-md'  // ← 不一致
// 改为:
sm: 'h-8 px-3 text-sm rounded-md'  // 跟 md 一致
```

| 优点 | 1 行修复,消除 13px vs 14px 不一致 |
| 缺点 | 不解决 token 化根本问题 |

## 五、推荐

**FT-2 + FT-3 组合**:FT-3 立即修不一致,FT-2 后续建立 token 体系

## 六、自检

| 检查项 | 方法 |
|---|---|
| 全仓 grep `text-\[13px\]` → 0 处 | grep 验证 |
| 全仓 grep `text-2xl` / `text-base` 等 Tailwind 内置字号 → 应该改成 `text-h1/h2/h3/caption` | grep |
| Sidebar Row 跟 PageHeader description 字号 = 14px | dev tools |
| Button sm 跟 md 字号一致(都是 14px) | 视觉对比 |

---

**引用源**:
- 设计规范 — [`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三 + [`1-design/03-toolbar-spec.md`](../../1-design/03-toolbar-spec.md) §八
- 原始资料 — `0-originals/apple/hig/07-color.md` + `0-originals/apple/hig/08-accessibility.md`