# Glass Container Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 V0.1.1 玻璃容器布局,对照 macOS 系统设置参考图细调:玻璃 level L1/L2 反转 + Sidebar 浮动 4 角圆 + Nav 改 Lucide icon 平铺 + 6 个子页面主区用 glass-l3 圆角面板包裹。

**Architecture:** 三段式重构。**Task 1** 数据层(`src/lib/nav-order.ts` 集中管理 7 项 nav + Lucide icon 映射);**Task 2** 视图层 Sidebar(用 nav-order + icon 平铺 + glass-l2 floating);**Task 3** 顶层布局 StyleGuideLayout(玻璃 L1/L2 反转 + Body `flex gap-3`);**Task 4** 内容容器(6 个子页面主区用 glass-l3 圆角面板包裹)。**玻璃参数数值不动,拖动由 NSWindow.setMovableByWindowBackground(true) 接管,前端不需要 marker**。

**Tech Stack:** Tauri 2 + React 19 + TypeScript 5.8 + Vite 7 + Tailwind 4 + react-router-dom 7 + lucide-react 0.469(已装)+ class-variance-authority

## Global Constraints

| 约束 | 值 | 来源 |
|---|---|---|
| 玻璃参数数值 | **不改** `--glass-fill-1/2/3` / `--glass-blur-1/2/3` / `--glass-border-1/2/3` | spec D1 + 用户明确 |
| macOS traffic light | **保留 native**,不自定义 React | spec D6 + 用户明确 |
| 拖动行为 | NSWindow.setMovableByWindowBackground(true),**不加前端 marker** | spec § 7 + V0.1.1 已交付 |
| 子页面 PageNav | **不加** ‹ › 胶囊按钮组 | 用户明确 |
| 玻璃容器顶栏横条 | **不加**(标题移到 Sidebar) | spec § 1 |
| 搜索框 / 账号区 / row ‹ 指示 | **不加** | 用户明确 |
| 主区顶部返回导航 | **不加** | 用户明确 |
| Node 版本 | >=24 <25 | package.json engines |
| TypeScript | ~5.8.3 | package.json devDependencies |
| lucide-react | 0.469.0(devDependencies,已装,**无需新增**) | package.json |
| 版本号 | **不要新增**,所有改动属 V0.1.1 范围 | 用户明确 |

---

## File Structure

| 文件 | 类型 | 职责 |
|---|---|---|
| `src/lib/nav-order.ts` | 新建 | nav 数据源(7 项 + Lucide icon + 路由 end) |
| `src/components/layout/Sidebar.tsx` | 大改 | 用 nav-order,icon 平铺,glass-l2 floating |
| `src/routes/StyleGuideLayout.tsx` | 改 | 玻璃 L1/L2 反转 + Body `flex gap-3` |
| `src/routes/Surface.tsx` | 改 | 主区 glass-l3 圆角面板包裹 TabsRoot |
| `src/routes/Button.tsx` | 改 | 主区 glass-l3 圆角面板包裹 StateSwitcher + TabsRoot |
| `src/routes/Input.tsx` | 改 | 主区 glass-l3 圆角面板包裹 TabsRoot |
| `src/routes/Feedback.tsx` | 改 | 主区 glass-l3 圆角面板包裹 TabsRoot |
| `src/routes/Overlay.tsx` | 改 | 主区 glass-l3 圆角面板包裹 TabsRoot |
| `src/routes/Tokens.tsx` | 改 | 主区 glass-l3 圆角面板包裹色板 section |
| `src/routes/Overview.tsx` | **不改** | 已是 L1/L2/L3 Card 网格对比展示,外层套 glass-l3 会跟 L3 Card 视觉重复 |

**已存在且不重建**:`<PageHeader>`(`src/components/style-guide/PageHeader.tsx`)、`<LivePreview>`(`.../LivePreview.tsx`)、`<Card tier="l1|l2|l3">`(`src/components/ui/card.tsx`、cva variant)、`<TabsRoot>` 系列(`src/components/ui/tabs.tsx`)。

---

## Task 1: 新增 nav-order 数据源

**Files:**
- Create: `src/lib/nav-order.ts`

**Interfaces:**
- Produces:
  - `NavItem` interface — `{ to: string; label: string; icon: LucideIcon; end?: boolean }`
  - `navOrder: readonly NavItem[]` — 7 项,顺序跟 `src/App.tsx` 路由完全一致

- [ ] **Step 1.1: 创建文件**

```ts
import {
  Sparkles, Square, MousePointerClick, TextCursorInput,
  MessageSquare, Layout, Palette, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navOrder: readonly NavItem[] = [
  { to: '/',         label: '设计语言',                 icon: Sparkles,         end: true },
  { to: '/surface',  label: 'Card / Separator',         icon: Square },
  { to: '/button',   label: 'Button',                   icon: MousePointerClick },
  { to: '/input',    label: 'Input / Textarea / Label', icon: TextCursorInput },
  { to: '/feedback', label: 'Badge / Toast / Dialog',   icon: MessageSquare },
  { to: '/overlay',  label: 'Tooltip / Tabs',           icon: Layout },
  { to: '/tokens',   label: 'Token 速查',               icon: Palette },
] as const;
```

- [ ] **Step 1.2: 跑 tsc 验证**

Run: `npx tsc --noEmit`
Expected: 无 error / warning(`lucide-react` 0.469 的 7 个 icon + `LucideIcon` type 已存在)

- [ ] **Step 1.3: Commit**

```bash
git add src/lib/nav-order.ts
git commit -m "feat(meta): nav-order 数据源(7 项 + Lucide icon 映射)

- 集中管理 Sidebar nav 数据,避免硬编码分散在组件里
- 用 lucide-react 已装的 0.469(devDependencies,无需新增)
- 路由顺序跟 src/App.tsx 完全一致:Overview index + 6 个 path"
```

---

## Task 2: Sidebar 大改 — icon 平铺 + glass-l2 floating

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`(全文件重写,72 行 → ~45 行)

**Interfaces:**
- Consumes: `navOrder` from `src/lib/nav-order.ts`
- Consumes: `cn` from `@/lib/utils`

- [ ] **Step 2.1: 重写 Sidebar.tsx**

```tsx
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navOrder } from '@/lib/nav-order';

/**
 * Sidebar — 玻璃容器内 floating,4 角圆,glass-l2
 *
 * - 用 navOrder 数据源,Lucide icon 平铺,无分组容器
 * - 顶部简化标题"轻念 · Mindtap"(单行,无副标题)
 * - 拖动由 NSWindow.setMovableByWindowBackground 接管,不需要 marker
 */
export default function Sidebar() {
  return (
    <aside className="w-60 ml-3 mt-3 mb-3 rounded-xl glass-l2 p-4 flex flex-col gap-3 shrink-0">
      <header>
        <h1 className="text-sm font-medium text-text-2">轻念 · Mindtap</h1>
      </header>

      <nav className="flex flex-col gap-1">
        {navOrder.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-base',
                isActive
                  ? 'bg-primary text-white font-semibold'
                  : 'bg-white/30 text-text-2 hover:bg-white/50'
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2.2: 跑 tsc 验证**

Run: `npx tsc --noEmit`
Expected: 无 error / warning

- [ ] **Step 2.3: 视觉 smoke(用户执行)**

Run: `npm run tauri dev`
Expected:
- Sidebar 浮动在玻璃容器内,4 角圆(`rounded-xl`)
- Sidebar `glass-l2` 视觉比主容器 `glass-l2` 略不透(因主容器之后会反转成 `glass-l1`,见 Task 3,当前两步一起看效果)
- 顶部单行标题"轻念 · Mindtap",**无副标题**
- 7 个 nav row icon + title 平铺,**无分组标题 / 容器**
- 选中 row 蓝底白字(`bg-primary text-white`),Lucide icon 因 `text-white` 继承反色
- macOS native traffic light 仍显示在玻璃容器外(top 0-28px 区)

- [ ] **Step 2.4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "refactor(meta): Sidebar 浮动 4 角圆 + glass-l2 + icon 平铺

- 移除原分组标题/容器,nav 改 Lucide icon + title 平铺
- 简化标题为单行'轻念 · Mindtap',移除副标题和 padding-y header
- 玻璃改 glass-l2(数值不变,反转 L1/L2 角色)
- 浮动 margin ml-3 mt-3 mb-3,跟主区有视觉分隔"
```

---

## Task 3: StyleGuideLayout 玻璃反转 + Body flex gap

**Files:**
- Modify: `src/routes/StyleGuideLayout.tsx`(全文件改)

**Interfaces:**
- 无新 interface,只用既有 Outlet + Sidebar

- [ ] **Step 3.1: 重写 StyleGuideLayout.tsx**

```tsx
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

/**
 * StyleGuide Layout — 玻璃容器(L1 透)+ Sidebar floating(L2 实)
 *
 * - 主玻璃容器:`fixed top-8 inset-x-3 bottom-3`,rounded-2xl,**glass-l1**(反转)
 * - Body:flex gap-3,Sidebar(L2 实)+ Main(L1 透 + 子内容)并排,间距 12px
 * - Main margin mr-3 mt-3 mb-3 跟容器边缘 + Sidebar 留间距
 * - 拖动由 NSWindow.setMovableByWindowBackground(true) 接管
 */
export default function StyleGuideLayout() {
  return (
    <div className="fixed top-8 inset-x-3 bottom-3 z-0 rounded-2xl glass-l1 overflow-hidden flex gap-3">
      <Sidebar />
      <main className="flex-1 mr-3 mt-3 mb-3 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3.2: 跑 tsc 验证**

Run: `npx tsc --noEmit`
Expected: 无 error / warning

- [ ] **Step 3.3: 视觉 smoke**

Run: `npm run tauri dev`
Expected:
- 主玻璃容器视觉比之前略透(`glass-l1` < `glass-l2`,因数值不变但角色反转 — 主容器 `glass-l1` 是当前体系里最透的)
- Sidebar 跟主区之间有 12px `gap-3` 间距
- 主区滚动条正常(`overflow-y-auto`)
- macOS native traffic light 仍显示(玻璃容器外)
- 拖动行为**不回归**(玻璃容器空白处按下可拖动窗口)

- [ ] **Step 3.4: Commit**

```bash
git add src/routes/StyleGuideLayout.tsx
git commit -m "refactor(meta): 玻璃容器 L1/L2 反转 + Body flex gap-3

- 主玻璃容器 glass-l2 → glass-l1(数值不变,反转让主容器更透)
- Body 加 flex gap-3 让 Sidebar 跟 Main 视觉分隔 12px
- Main margin mr-3 mt-3 mb-3 跟容器边缘 + Sidebar 留间距
- 拖动不回归(NSWindow.setMovableByWindowBackground 接管)"
```

---

## Task 4: 6 个子页面主区用 glass-l3 圆角面板包裹

**Files:**
- Modify: `src/routes/Surface.tsx`
- Modify: `src/routes/Button.tsx`
- Modify: `src/routes/Input.tsx`
- Modify: `src/routes/Feedback.tsx`
- Modify: `src/routes/Overlay.tsx`
- Modify: `src/routes/Tokens.tsx`

**Rationale:** 主玻璃容器(`glass-l1` 透)→ Sidebar(`glass-l2` 中)→ 子页面内容容器(`glass-l3` 实)形成 3 级玻璃层次。每个子页面 PageHeader 保留在外作为标题,TabsRoot / Card 网格用 `<section className="glass-l3 rounded-xl p-4">` 包裹。**Overview 不改**(它本身已是 L1/L2/L3 Card 网格对比展示,外层再套 `glass-l3` 会跟内部 `Card tier="l3"` 视觉重复)。

---

- [ ] **Step 4.1: Surface.tsx — 包裹 TabsRoot**

```tsx
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Surface() {
  return (
    <div>
      <PageHeader
        title="Surface"
        description="Card (L1 / L2 / L3) + Separator (horizontal / vertical)"
      />
      <section className="glass-l3 rounded-xl p-4">
        <TabsRoot defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="code">代码</TabsTrigger>
          </TabsList>
          <TabsPanel value="preview">
            <LivePreview>
              <Card tier="l1" className="p-4 w-48">L1 Card</Card>
              <Card tier="l2" className="p-4 w-48">L2 Card</Card>
              <Card tier="l3" className="p-4 w-48">L3 Card</Card>
              <Separator orientation="horizontal" className="w-full" />
              <Separator orientation="vertical" className="h-12" />
            </LivePreview>
          </TabsPanel>
          <TabsPanel value="code">
            <pre className="glass-l1 rounded-md p-4 text-xs text-text-1 overflow-x-auto">
{`<Card tier="l1">L1 Card</Card>
<Card tier="l2">L2 Card</Card>
<Card tier="l3">L3 Card</Card>
<Separator />
<Separator orientation="vertical" />`}
            </pre>
          </TabsPanel>
        </TabsRoot>
      </section>
    </div>
  );
}
```

- [ ] **Step 4.2: Button.tsx — 包裹 StateSwitcher + TabsRoot**

```tsx
import { useState } from 'react';
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import CodeBlock from '@/components/style-guide/CodeBlock';
import PropsTable from '@/components/style-guide/PropsTable';
import StateSwitcher, { type State } from '@/components/style-guide/StateSwitcher';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const variants = ['primary', 'secondary', 'ghost', 'icon'] as const;
const sizes = ['sm', 'md'] as const;

export default function ButtonRoute() {
  const [state, setState] = useState<State>('default');

  const stateClass = {
    default: '',
    hover: 'hover:opacity-90',
    active: 'active:scale-[0.97]',
    focus: 'ring-2 ring-primary',
    disabled: 'opacity-40 pointer-events-none',
  }[state];

  return (
    <div>
      <PageHeader
        title="Button"
        description="4 变体 (primary / secondary / ghost / icon) × 2 尺寸 (sm / md)"
      />
      <section className="glass-l3 rounded-xl p-4 space-y-4">
        <StateSwitcher value={state} onChange={setState} />
        <TabsRoot defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="code">代码</TabsTrigger>
            <TabsTrigger value="props">属性</TabsTrigger>
          </TabsList>
          <TabsPanel value="preview">
            <LivePreview className="flex-col items-start">
              {variants.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <span className="text-xs text-text-3 w-20">{v}</span>
                  {sizes.map((s) => (
                    <Button key={s} variant={v} size={s} className={cn(stateClass)}>
                      {v === 'icon' ? '✦' : `${v} ${s}`}
                    </Button>
                  ))}
                </div>
              ))}
            </LivePreview>
          </TabsPanel>
          <TabsPanel value="code">
            <CodeBlock
              code={`<Button variant="primary" size="md">提交</Button>
<Button variant="secondary" size="md">取消</Button>
<Button variant="ghost" size="md">更多</Button>
<Button variant="icon" size="md">✦</Button>`}
            />
          </TabsPanel>
          <TabsPanel value="props">
            <PropsTable
              rows={[
                { name: 'variant', type: "'primary' | 'secondary' | 'ghost' | 'icon'", default: "'primary'" },
                { name: 'size', type: "'sm' | 'md'", default: "'md'" },
                { name: 'className', type: 'string' },
                { name: 'children', type: 'ReactNode', required: true },
              ]}
            />
          </TabsPanel>
        </TabsRoot>
      </section>
    </div>
  );
}
```

- [ ] **Step 4.3: Input.tsx — 包裹 TabsRoot**

```tsx
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import CodeBlock from '@/components/style-guide/CodeBlock';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function InputRoute() {
  return (
    <div>
      <PageHeader
        title="Input / Textarea / Label"
        description="表单输入三件套"
      />
      <section className="glass-l3 rounded-xl p-4">
        <TabsRoot defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="code">代码</TabsTrigger>
          </TabsList>
          <TabsPanel value="preview">
            <LivePreview className="flex-col items-start gap-3">
              <div className="flex flex-col gap-1 w-64">
                <Label required>姓名</Label>
                <Input placeholder="输入姓名" />
              </div>
              <div className="flex flex-col gap-1 w-64">
                <Label>简介</Label>
                <Textarea placeholder="说点什么" />
              </div>
              <div className="flex flex-col gap-1 w-64">
                <Label>禁用</Label>
                <Input disabled placeholder="不可用" />
              </div>
            </LivePreview>
          </TabsPanel>
          <TabsPanel value="code">
            <CodeBlock
              code={`<Label required>姓名</Label>
<Input placeholder="输入姓名" />

<Label>简介</Label>
<Textarea placeholder="说点什么" />`}
            />
          </TabsPanel>
        </TabsRoot>
      </section>
    </div>
  );
}
```

- [ ] **Step 4.4: Feedback.tsx — 包裹 TabsRoot**

```tsx
import { useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogWrapper } from '@/components/ui/dialog';

export default function FeedbackRoute() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Feedback"
        description="Badge / Sonner Toast / Dialog"
      />
      <section className="glass-l3 rounded-xl p-4">
        <TabsRoot defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="code">代码</TabsTrigger>
          </TabsList>
          <TabsPanel value="preview">
            <LivePreview className="flex-col items-start gap-4">
              <div className="flex items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="inactive">Inactive</Badge>
                <Badge variant="warning">Warning</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => toast.success('保存成功')}>触发 Toast</Button>
                <Button variant="secondary" onClick={() => setOpen(true)}>打开 Dialog</Button>
              </div>
              <DialogWrapper
                open={open}
                onOpenChange={setOpen}
                title="确认操作"
                description="此操作不可撤销,确定继续?"
              >
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
                  <Button onClick={() => setOpen(false)}>确定</Button>
                </div>
              </DialogWrapper>
            </LivePreview>
          </TabsPanel>
          <TabsPanel value="code">
            <pre className="glass-l1 rounded-md p-4 text-xs text-text-1 overflow-x-auto">
{`import { toast } from 'sonner';
import { DialogWrapper } from '@/components/ui/dialog';

toast.success('保存成功');

<DialogWrapper open={open} onOpenChange={setOpen} title="确认" description="...">
  ...
</DialogWrapper>`}
            </pre>
          </TabsPanel>
        </TabsRoot>
      </section>
    </div>
  );
}
```

- [ ] **Step 4.5: Overlay.tsx — 包裹 TabsRoot**

```tsx
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { TooltipProvider, TooltipWrapper } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function OverlayRoute() {
  return (
    <div>
      <PageHeader
        title="Overlay"
        description="Tooltip / Tabs (浮层组件)"
      />
      <section className="glass-l3 rounded-xl p-4">
        <TabsRoot defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="code">代码</TabsTrigger>
          </TabsList>
          <TabsPanel value="preview">
            <LivePreview className="flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <TooltipWrapper content="提示:这是一段说明" side="top">
                    <Button>Hover 我 (top)</Button>
                  </TooltipWrapper>
                </TooltipProvider>
                <TooltipProvider>
                  <TooltipWrapper content="右侧提示" side="right">
                    <Badge>Hover 我 (right)</Badge>
                  </TooltipWrapper>
                </TooltipProvider>
              </div>
              <TabsRoot defaultValue="a">
                <TabsList>
                  <TabsTrigger value="a">子 Tab A</TabsTrigger>
                  <TabsTrigger value="b">子 Tab B</TabsTrigger>
                </TabsList>
                <TabsPanel value="a"><div className="p-4">A 内容</div></TabsPanel>
                <TabsPanel value="b"><div className="p-4">B 内容</div></TabsPanel>
              </TabsRoot>
            </LivePreview>
          </TabsPanel>
          <TabsPanel value="code">
            <pre className="glass-l1 rounded-md p-4 text-xs text-text-1 overflow-x-auto">
{`<TooltipWrapper content="提示" side="top">
  <Button>Hover</Button>
</TooltipWrapper>`}
            </pre>
          </TabsPanel>
        </TabsRoot>
      </section>
    </div>
  );
}
```

- [ ] **Step 4.6: Tokens.tsx — 包裹色板**

```tsx
import PageHeader from '@/components/style-guide/PageHeader';
import { Card } from '@/components/ui/card';

const colors = [
  { name: 'primary', value: '#165DFF' },
  { name: 'primary-hover', value: '#0E4AD9' },
  { name: 'primary-active', value: '#0A3DBC' },
  { name: 'text-1', value: '#1D2939' },
  { name: 'text-2', value: '#475467' },
  { name: 'text-3', value: '#98A2B3' },
  { name: 'success', value: '#5BCBA0' },
  { name: 'inactive', value: '#DDE3EE' },
];

export default function TokensRoute() {
  return (
    <div>
      <PageHeader
        title="Token 速查"
        description="色板 / 字号 / 间距 (静态展示,无 Live Preview)"
      />
      <section className="glass-l3 rounded-xl p-4 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text-1 mb-3">色板</h2>
          <div className="grid grid-cols-4 gap-3">
            {colors.map((c) => (
              <Card key={c.name} tier="l1" className="p-3">
                <div className="w-full h-12 rounded-md mb-2" style={{ background: c.value }} />
                <div className="text-xs font-mono text-text-1">{c.name}</div>
                <div className="text-xs font-mono text-text-3">{c.value}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4.7: 跑 tsc 验证**

Run: `npx tsc --noEmit`
Expected: 无 error / warning(改动不引入新类型,只调整 JSX 结构)

- [ ] **Step 4.8: 视觉 smoke**

Run: `npm run tauri dev`
Expected:
- 6 个子页面(Surface / Button / Input / Feedback / Overlay / Tokens)主区都被 `glass-l3 rounded-xl p-4` 圆角面板包裹(视觉更"实",作为内容容器)
- Overview **不变**(仍是 L1/L2/L3 Card 网格对比展示,无外层 panel)
- PageHeader 仍在外(标题区)
- Tabs 切换正常,LivePreview demo 正常,Code/Props 内容正常
- 玻璃层次:主容器 `glass-l1`(透)→ Sidebar `glass-l2`(中)→ 子页面内容 `glass-l3`(实),3 级递进
- macOS native traffic light 仍显示
- 拖动行为不回归

- [ ] **Step 4.9: Commit**

```bash
git add src/routes/Surface.tsx src/routes/Button.tsx src/routes/Input.tsx \
        src/routes/Feedback.tsx src/routes/Overlay.tsx src/routes/Tokens.tsx
git commit -m "refactor(meta): 6 个子页面主区用 glass-l3 圆角面板包裹

- 形成 3 级玻璃层次:主容器 L1(透)→ Sidebar L2(中)→ 子页面内容 L3(实)
- 每个子页面 PageHeader 保留在外,内容(TabsRoot / 色板 section)用 section.glass-l3.rounded-xl.p-4 包裹
- Overview 不改(本身已是 L1/L2/L3 Card 对比展示,外层套 L3 会跟 Card tier=l3 视觉重复)
- spec § D5 落地点;PageNav / TrafficLights / 顶栏横条不加,符合 out-of-scope"
```

---

## Self-Review Checklist

- [x] **Spec coverage**:
  - § D1 玻璃 level 反转 → Task 3(主容器 `glass-l1`)+ Task 2(Sidebar `glass-l2`)+ Task 4(子页面内容 `glass-l3`)
  - § D2 主玻璃容器 → Task 3
  - § D3 Sidebar → Task 2
  - § D4 Nav icon 平铺 → Task 1(数据)+ Task 2(渲染)
  - § D5 分组面板 → Task 4(6 个子页面,Overview 例外已说明)
  - § D6 交通灯 native → 所有 task 不动
  - § D7 nav-order → Task 1
- [x] **Placeholder scan**: 无 TBD / TODO / "类似 Task N",所有 step 含完整代码
- [x] **Type consistency**: `NavItem` / `navOrder` 在 Task 1 定义,Task 2 用;7 个子页面 Section 包裹模式一致
- [x] **Out-of-scope 守**: 玻璃数值不动 / traffic light 不动 / PageNav 不加 / 搜索框不加 / 账号区不加 / 顶栏横条不加 / 主区返回导航不加
- [x] **Spec 偏差**: 记录在 plan 顶部(Overview 不改 + lucide-react 已装 + 子页面在 `src/routes/` 不是 `src/pages/`)
- [x] **Bite-Sized Steps**: 每个 step 2-5 分钟,完整代码,exact commands
- [x] **Frequent commits**: 4 task = 4 commit(每个 task 1 commit)
- [x] **commit-style 合规**: subject ≤ 72 字符,body 写 why 不写 what,scope 用 `meta`,业务层粒度