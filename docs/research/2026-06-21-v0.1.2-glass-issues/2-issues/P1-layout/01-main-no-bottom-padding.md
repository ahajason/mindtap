# P1 · `<main>` 缺底部安全间距,内容贴边

> **优先级**: 🟠 P1(布局完整性,影响视觉呼吸感)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三 + [`1-design/00-design-principles.md`](../../1-design/00-design-principles.md) §四
> **关联原始**:
> - `0-originals/apple/hig/05-split-views.md`(split view padding 规范)

---

## 一、问题现状(代码实测)

`src/routes/StyleGuideLayout.tsx:19`:

```tsx
<main className="flex-1 mr-3 mt-3 mb-3 overflow-y-auto">
  <Outlet />
</main>
```

**问题 A1**:Main 内部 `<Outlet />` 渲染的子页面(PageHeader + section)跟 Main 的 `mb-3` 之间没有**额外 padding**:

```
┌─ main (mt-3 mb-3) ──────────┐
│  <PageHeader>               │ ← mb-6
│  <section>...</section>     │ ← 紧贴 mb-3
└─────────────────────────────┘
       ↑ 最后内容贴 mb-3 边缘,无视觉缓冲
```

**问题 A3**:Sidebar 内容左边缘(`p-4` + 16px)跟 Main 内容左边缘(0 padding,PageHeader 直接贴边)**不对齐**:

- Sidebar:容器左 12px(`ml-3`) + padding 16px = **内容左 28px**
- Main:容器左 12px(`ml-3` from StyleGuideLayout gap) + 0 padding = **内容左 12px**

视觉上 Sidebar 内容比 Main 内容**右移 16px**,不同步。

## 二、设计匹配

[`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三:

| 维度 | 值 |
|---|---|
| Sidebar 水平 padding | 16px |
| Main 水平 padding | **跟 Sidebar 同 baseline** |

[`1-design/00-design-principles.md`](../../1-design/00-design-principles.md) §四"跨窗口一致性":

> 同类组件在所有页面表现一致

## 三、解决路径

### 路径 ML-1:Main 加内 padding(p-6)对齐 Sidebar

```tsx
<main className="flex-1 mr-3 mt-3 mb-3 overflow-y-auto p-[var(--spacing-6)]">
  <Outlet />
</main>
```

| 优点 | Sidebar 跟 Main 内容左边缘对齐 |
| 缺点 | Main 内容多一层 padding,可能挤压内容区 |

### 路径 ML-2:Main 保持 0 padding,但 PageHeader 强制 `pl-[var(--spacing-4)]`

```tsx
// PageHeader.tsx
<header className="mb-6 pl-[var(--spacing-4)]">
```

| 优点 | PageHeader 视觉右移 16px,跟 Sidebar 内容对齐 |
| 缺点 | 只 PageHeader 对齐,section 内容仍贴边 |

### 路径 ML-3:CSS Grid 共享 grid-template(根本)

```tsx
<div className="grid grid-cols-[240px_1fr] h-screen gap-3">
  <Sidebar />
  <main className="overflow-y-auto p-6">
    <Outlet />
  </main>
</div>
```

| 优点 | Grid 自动对齐 |
| 缺点 | 改 layout 结构,影响 T1 traffic light 让位 |

## 四、推荐

**ML-1 + ML-3 组合**:ML-3 长期(CSS Grid 重构),ML-1 短期(加 padding)。

## 五、自检

| 检查项 | 方法 |
|---|---|
| Sidebar 内容左 = Main 内容左(28px vs 28px) | dev tools 量 |
| Main 最后内容距 `mb-3` 边缘有 ≥ 16px 间距 | dev tools |
| 滚动到底部,视觉有呼吸空间 | 视觉 |

---

**引用源**:
- 设计规范 — [`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三 + [`1-design/00-design-principles.md`](../../1-design/00-design-principles.md) §四
- 原始资料 — `0-originals/apple/hig/05-split-views.md`