# P2-2 · 玻璃元素未用 GlassEffectContainer 批处理

> **优先级**: 🟡 P2(性能优化,非阻塞)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/08-performance.md`](../../1-design/08-performance.md) §二铁律
> **关联原始**:
> - `0-originals/apple/swiftui/01-key-apis.md` §2(`GlassEffectContainer` 性能铁律)
> - `0-originals/apple/liquid-glass/02-adopting.md` §9(平台考量 - 性能)
> - `0-originals/microsoft/acrylic.md` §"Note"("Rendering acrylic surfaces is GPU-intensive")
> - `0-originals/mdn/backdrop-filter.md`(Backdrop root 性能)

---

## 一、问题表现

当前 `glass-l1` / `glass-l2` / `glass-l3` 各自独立使用 `backdrop-filter`,没有 batched / container 机制。

每个独立 glass 元素都创建独立的 backdrop 采样通道,GPU 开销 = N × 单个 glass 开销。

## 二、根因

Web 平台没有原生 `GlassEffectContainer` API(那是 SwiftUI 26+ 专属),Web 只能用 CSS containment 近似。

## 三、设计匹配

[`1-design/08-performance.md`](../../1-design/08-performance.md) §二 5 条铁律:

| 铁律 | 当前违反 |
|---|---|
| **1. 同时显示 glass 数量 ≤ 5** | 一屏可能 > 5(Sidebar + Toolbar + 3 Card + PageHeader) |
| **2. 避免多层嵌套** | Card 内嵌套 Section 是多层 |
| **3. CSS containment** | 未使用 `contain: layout paint` |
| **4. backdrop root 限定** | 部分父元素 opacity < 1 限制 backdrop 范围 |
| **5. 滚动不重算 backdrop** | 滚动列表未触发独立层 |

**权威源**(`0-originals/apple/swiftui/01-key-apis.md` §2):

> ⚠️ **性能铁律**:自定义 Liquid Glass 效果**必须**用 `GlassEffectContainer` 组合,否则渲染性能差。

**Microsoft Acrylic Note**:

> Rendering acrylic surfaces is GPU-intensive, which can increase device power consumption and shorten battery life.

## 四、解决路径

### 路径 P-1:CSS Containment 隔离(立即)

```css
.glass-l1, .glass-l2, .glass-l3 {
  contain: layout paint;
}
```

| 改动量 | 1 行 CSS |
|---|---|
| 优点 | webview 重绘时不连带重算 glass |
| 缺点 | 不解决 glass 数量问题 |

### 路径 P-2:玻璃元素合并(后续)

```css
/* Card 容器 → 单个 backdrop-filter */
/* 内部 Card 用 opacity / box-shadow 模拟层次 */
.card-container {
  backdrop-filter: blur(20px);  /* 一次 */
}
.card {
  background: rgba(255,255,255,0.5);  /* 不再加 backdrop-filter */
}
```

| 优点 | 减少独立 glass 数 |
| 缺点 | 失去 Card 独立 vibrance |

### 路径 P-3:Reduce Transparency 触发时降级(已规范)

已写入 [`1-design/07-accessibility.md`](../../1-design/07-accessibility.md) §二 + [`1-design/08-performance.md`](../../1-design/08-performance.md) §六。

## 五、推荐

**P-1 立即 + P-2 视情况**

P-1 是低风险高收益;P-2 是视觉 vs 性能 trade-off,需用户决策。

## 六、自检

| 检查项 | 方法 |
|---|---|
| `contain: layout paint` 加到 glass class | grep `src/index.css` |
| 一屏独立 glass 元素 ≤ 5 | DOM count |
| DevTools Performance:glass 重绘不触发整个 webview | 录一段操作,看 paint 时间 |
| Reduce Transparency 触发后 blur 关闭 | 系统设置开启后观察 |
| Battery Saver 触发后玻璃降级 | macOS Battery Saver 模式 |

---

**引用源**:
- 设计规范 — [`1-design/08-performance.md`](../../1-design/08-performance.md) §二
- 原始资料 — `0-originals/apple/swiftui/01-key-apis.md` §2 + `0-originals/apple/liquid-glass/02-adopting.md` §9 + `0-originals/microsoft/acrylic.md` + `0-originals/mdn/backdrop-filter.md`