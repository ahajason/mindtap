# 通用组件接口规范 (Component Format)

> spec 单源: [glassic-ui-spec.md](./glassic-ui-spec.md)
> token 表: [glass-tokens.md](./glass-tokens.md)

## 跨组件共用规则

| 规则 | 内容 |
|---|---|
| 命名 | 文件 `kebab-case.tsx`,导出 `PascalCase`;每个文件默认导出组件 |
| 类型 | Props 用 `interface`(不用 `type`),继承原生 HTML attrs |
| className | **总是**接受 `className` prop,通过 `cn()` 合并到末尾(允许外部覆盖) |
| ref 转发 | 所有 ui 组件用 `React.forwardRef`(Tabs / Tooltip / Dialog 由 Base UI 处理) |
| 空依赖 | 不依赖任何业务 store / context;纯展示组件 |
| glass 原则 | 组件本身不直接调 `backdrop-filter`,由父级 `<Glass>` 提供;实色组件(Button / Input)不需要 |
| i18n | V0.1.0 硬编码中文,V0.2+ 引入 i18n |
| smoke 测试 | 每个组件配套 `*.test.tsx`,验证: 挂载不报错 + 主要 props 默认值渲染 + 关键 variant 切换可见。 不做交互 / a11y / snapshot。`npm test` 必须通过 |

---

## Button

### Props API

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
type ButtonSize = 'sm' | 'md';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;   // default: 'primary'
  size?: ButtonSize;         // default: 'md'
}
```

### Variants (cva)

| variant | size | 视觉(spec §五.1) | 用途 |
|---|---|---|---|
| primary | md | 36-44px, 主色渐变 + 软阴影, 白字 | 主操作(每页最多 1) |
| primary | sm | 32px, 同上缩小 | 紧凑主操作 |
| secondary | md | 40px, L1 玻璃, `#475467` 字 | 次操作 |
| secondary | sm | 32px, 同上 | 紧凑次操作 |
| ghost | md | 40px, 透明背景, hover L1 | 第三级 / 工具 |
| icon | md | 36×36 圆形, L1 玻璃 | 工具栏 |

### Do / Don't

- 一个页面最多 1 个 primary
- 不要 ghost 装成次按钮
- 不要 icon variant 装文字

### 依赖

- `cn` (`src/lib/utils.ts`)
- `lucide-react` (icon 槽, 外部传 icon)
- 不依赖 `liquid-glass-react` (Button 本身实色)

## Card

### Props API

```ts
type CardTier = 'l1' | 'l2' | 'l3';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: CardTier;     // default: 'l1'
}
```

### Variants

| tier | 模糊 | 填充 | 描边 | 阴影 | 圆角 | 用途 |
|---|---|---|---|---|---|---|
| l1 | 20px | 0.35 | 0.60 | 0.08 | 20px | 普通卡片 / 标签 |
| l2 | 24px | 0.42 | 0.70 | 0.10 | 24px | 输入框 / 次按钮容器 |
| l3 | 28px | 0.50 | 0.80 | 0.12 | 28px | 主按钮 / 悬浮弹窗 |

### Do / Don't

- 用 tier 表达 Z 轴层级,不要写自定义 boxShadow
- 不要在 Card 内再放 glass 子组件(避免叠层模糊性能问题)
- 不要 l3 用作"普通背景"

### 依赖

- `cn`
- `liquid-glass-react` (`<Glass />` 包 Card 外层)

## Input

### Props API

```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: 'sm' | 'md';         // default: 'md'
  error?: boolean;            // default: false
}
```

### Variants

| size | height | padding-x | radius |
|---|---|---|---|
| sm | 36px | 12px | 12px |
| md | 40px | 16px | 12px |

`error=true` 描边切 `--color-error` 红。

### 依赖 — `cn`, `lucide-react`(右侧 icon 槽, 外部传)

## Textarea

### Props API

```ts
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'sm' | 'md';
  error?: boolean;
}
```

| size | rows | padding |
|---|---|---|
| sm | 2 | 12px |
| md | 4 | 16px |

### 依赖 — `cn`

## Label

### Props API

```ts
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;     // 显示 `*`
}
```

### 依赖 — `cn`

## Badge

### Props API

```ts
type BadgeVariant = 'default' | 'success' | 'inactive' | 'warning';
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;     // default: 'default'
}
```

### Variants — 4 状态色,玻璃 L1 背景

### 依赖 — `cn`, `lucide-react`

## Separator

### Props API

```ts
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';   // default: 'horizontal'
}
```

视觉: 1px 玻璃高光描边(`rgba(255,255,255,0.6)`)。

### 依赖 — `cn`

## Tabs

### Props API

```ts
// 包 @base-ui/react Tabs,统一 defaultValue
import { Tabs } from '@base-ui/react/tabs';

interface TabsRootProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
}
```

直接用 Base UI 的 `Tabs.Root / Tabs.List / Tabs.Tab / Tabs.Panel` 组合(注意是 `Tabs.Tab` 不是 `Tabs.Trigger`)。演示页统一用三段(preview / code / props)。

### 依赖 — `@base-ui/react/tabs`, `lucide-react`

## Tooltip

### Props API

```ts
import { Tooltip } from '@base-ui/react/tooltip';

interface TooltipWrapperProps {
  content: React.ReactNode;     // 提示内容
  side?: 'top' | 'right' | 'bottom' | 'left';   // default: 'top'
  children: React.ReactElement;  // 必须能接受 ref
}
```

包一层统一 `side` prop。

### 依赖 — `@base-ui/react/tooltip`

## Dialog

### Props API

```ts
import { Dialog } from '@base-ui/react/dialog';

interface DialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;     // 内容
  trigger?: React.ReactElement;  // 触发器
}
```

包一层统一 title / description。

### 依赖 — `@base-ui/react/dialog`

## Sonner

### Props API

```ts
// 直接 re-export sonner 的 <Toaster />
import { Toaster } from 'sonner';

// 在 main.tsx 全局挂一次:
<Toaster richColors position="top-center" theme="light" />
```

业务组件用 `import { toast } from 'sonner'` 调用。

### 依赖 — `sonner`
