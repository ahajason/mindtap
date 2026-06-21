# Glassic UI Token 落地映射表

> spec 单源: [glassic-ui-spec.md](./glassic-ui-spec.md)
> 本表是 spec 到代码的查表索引,不是替代 spec。

## 1. Tailwind 4 @theme block (`src/index.css`)

```css
@import "tailwindcss";

@theme {
  /* === 色彩(背景) === */
  --color-bg-from: #F5F9FF;
  --color-bg-to:   #E8F1FF;

  /* === 主强调色 === */
  --color-primary:        #165DFF;
  --color-primary-hover:  #0E4AD9;
  --color-primary-active: #0A3DBC;
  --color-primary-glow:   rgba(22, 93, 255, 0.25);

  /* === 文本色 === */
  --color-text-1: #1D2939;
  --color-text-2: #475467;
  --color-text-3: #98A2B3;

  /* === 功能色 === */
  --color-success:  #5BCBA0;
  --color-inactive: #DDE3EE;
  --color-warning:  rgba(245, 166, 35, 0.8);
  --color-error:    rgba(229, 72, 77, 0.85);

  /* === 玻璃四要素 (L1/L2/L3) === */
  --glass-blur-1:   20px; --glass-fill-1:   0.35; --glass-border-1:   0.60; --glass-shadow-1:   0.08;
  --glass-blur-2:   24px; --glass-fill-2:   0.42; --glass-border-2:   0.70; --glass-shadow-2:   0.10;
  --glass-blur-3:   28px; --glass-fill-3:   0.50; --glass-border-3:   0.80; --glass-shadow-3:   0.12;

  /* === 圆角 === */
  --radius-card:    20px;
  --radius-input:   12px;
  --radius-button:  12px;
  --radius-badge:   10px;
  --radius-full:    9999px;

  /* === 间距 (space-N) === */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 24px;
  --spacing-6: 32px;

  /* === 字号 (text-N) === */
  --text-core:    48px;   /* 核心数值 */
  --text-h1:      24px;   /* 一级标题 */
  --text-h2:      16px;   /* 二级说明 */
  --text-h3:      14px;   /* 三级提示 */
  --text-caption: 12px;   /* 辅助文字 */

  /* === 字重 === */
  --font-weight-regular:  400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  /* === 动效 === */
  --ease-out:     cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-base: 240ms;
  --duration-slow: 320ms;
}
```

## 2. liquid-glass-react props 映射 (lvl = L1 / L2 / L3)

| spec 等级 | blur | tintOpacity | tint | saturation | displacement |
|---|---|---|---|---|---|
| L1 | 20  | 0.35 | white | 1.2 | subtle |
| L2 | 24  | 0.42 | white | 1.2 | subtle |
| L3 | 28  | 0.50 | white | 1.2 | subtle |

**使用**:

```tsx
import { Glass } from 'liquid-glass-react';

// L1
<Glass
  displacementScale={20}
  blurAmount={20}
  saturation={1.2}
  aberrationIntensity={0}
  cornerRadius={20}
  tint="white"
  tintOpacity={0.35}
  displacement="subtle"
>
  {children}
</Glass>
```

## 3. 状态色 → Tailwind / CVA 映射 (Button 4 variants)

| spec 状态 | Tailwind class | CVA variant |
|---|---|---|
| primary default | `bg-primary text-white` | `variant="primary"` |
| primary hover | `hover:bg-primary-hover` | 同上, hover: |
| primary active | `active:bg-primary-active active:scale-[0.97]` | 同上, active: |
| secondary default | `glass-l1 text-text-1` | `variant="secondary"` |
| ghost default | `bg-transparent text-text-2` | `variant="ghost"` |
| ghost hover | `hover:glass-l1` | 同上, hover: |
| icon default | `glass-l1 rounded-full` | `variant="icon"` |
| disabled | `opacity-40 cursor-not-allowed` | `disabled:opacity-40` |

**主按钮尺寸**:

| size | height | padding-x | radius | text |
|---|---|---|---|---|
| sm | 32px | 12px | 10px | 13px / 500 |
| md | 36-44px | 16-24px | 12px | 14px / 600 |

## 4. 强制项检查 (spec §八)

| # | 强制项 | 代码侧检查 | 工具 |
|---|---|---|---|
| 1 | 必须有 backdrop-filter | grep `backdrop-filter` 命中所有 .glass-* utility | `grep -r "backdrop-filter" src/` |
| 2 | 阴影必须大模糊低不透明度 | shadow 值是 `0 8px 32px rgba(0,30,80,0.xx)` | manual review |
| 3 | 背景必须有渐变 | body 有冷蓝渐变背景 (`--color-bg-from` → `--color-bg-to`) | manual review |
| 4 | 文本对比度 WCAG AA | 玻璃背景上文字 ≥ 4.5:1 | manual review + axe |
| 5 | 禁止半透明白色代替模糊 | `glass-*` utility 必须同时有 `backdrop-filter` | grep `backdrop-filter` |
