# P2 · Sidebar header 跟 nav 之间缺 divider

> **优先级**: 🟢 P2(视觉细节,辅助信息层级)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §七 Section Header 规范
> **关联原始**:
> - `0-originals/apple/hig/04-sidebars.md`(Section header 清晰,不用 divider)
> - `0-originals/microsoft/acrylic.md`(避免多个 acrylic edge-to-edge 接缝)

---

## 一、问题现状(代码实测)

`src/components/layout/Sidebar.tsx:14-19`:

```tsx
<aside className="w-60 ml-3 mt-10 mb-3 rounded-xl glass-l2 p-4 flex flex-col gap-3 shrink-0">
  <header>
    <h1 className="text-sm font-medium text-text-2">轻念 · Mindtap</h1>
  </header>

  <nav className="flex flex-col gap-1">
    {navOrder.map((item) => (...))}
  </nav>
</aside>
```

**问题**:
1. `<header>` 跟 `<nav>` 之间用 `gap-3`(12px)— 但视觉上**完全断开**,没有"标题 → 导航"层级感
2. 整个 Sidebar 内容目前只有 1 个 section(`navOrder` 全部扁平),未来若加分组,需要明确 section header 规范

## 二、范式匹配

[`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §七 Section Header 规范:

| 元素 | 规范 |
|---|---|
| 字号 | 11-12pt |
| 字重 | semibold(600) |
| 颜色 | `tertiaryLabel`(系统级灰色) |
| transform | uppercase 或 sentence case |
| 上下间距 | 上 16px / 下 6px |
| **左对齐** | 跟 row 文字左边缘对齐(共享 grid) |

**Apple HIG 4-sidebars §3 隐含**:Sidebar 标题跟第一个 section header **应该有视觉层级差异**,目前都是 "轻念 · Mindtap"(text-sm font-medium)— 没有 section header。

## 三、视觉选项

### 方案 A:加 divider 横线

```tsx
<header>
  <h1 className="text-sm font-medium text-text-2">轻念 · Mindtap</h1>
</header>
<hr className="border-t border-white/30" />  {/* 新增 */}
<nav>...</nav>
```

| 优点 | 视觉分隔清晰 |
| 缺点 | 多一个 divider,在 glass 上可能不明显 |

### 方案 B:section header 文字规范(推荐)

如果未来 navOrder 分组,加 section header:

```tsx
<div className="text-[11px] font-semibold uppercase tracking-wide text-text-3 px-2 mb-1.5">
  Modules
</div>
<nav className="flex flex-col gap-1">
  {navOrder.map((item) => (...))}
</nav>
```

| 优点 | 符合 Apple HIG §7 Section header 规范 |
| 缺点 | 当前 navOrder 不分组,加 section header 是空架子 |

### 方案 C:不加 divider,增大 gap

```tsx
<aside className="... gap-5 ...">  {/* gap-3 → gap-5 */}
```

| 优点 | 1 字符改动 |
| 缺点 | 治标不治本 |

## 四、推荐

**B**(未来 navOrder 分组时启用 section header;当前 gap-3 已是合理视觉间距)

**延后触发**:当 navOrder 第一次出现分组时(预计 V0.1.3+ 增加浮窗 / 设置等模块),同时实施方案 B。

## 五、自检

| 检查项 | 方法 |
|---|---|
| 当前 Sidebar 视觉无明显残缺 | 视觉 |
| navOrder 增长到 ≥ 2 组时,自动加 section header | 触发后再评估 |

---

**引用源**:
- 设计规范 — [`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §七
- 原始资料 — `0-originals/apple/hig/04-sidebars.md` + `0-originals/microsoft/acrylic.md`