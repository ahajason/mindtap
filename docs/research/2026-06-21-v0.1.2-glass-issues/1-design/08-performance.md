# 08 · Performance 性能铁律

> **层级**: 1-design / Performance
> **创建**: 2026-06-21
> **作用**: 玻璃材质的性能规范(GPU / 重绘 / 内存)
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(节制使用)
> - `0-originals/microsoft/acrylic.md`(GPU-intensive / Battery Saver)
> - `0-originals/mdn/backdrop-filter.md`(Backdrop root / GPU)

---

## 一、GPU 开销来源(权威源:Apple HIG + MDN)

| 元素 | GPU 开销 |
|---|---|
| `backdrop-filter: blur()` | **高** — 每帧重新采样背景 |
| `saturate()` | 中 — 颜色矩阵运算 |
| `drop-shadow()` | 中 — 多次采样 |
| `border-radius` | 低 |
| `inset box-shadow` | 低 |
| 普通 `background-color` | 极低 |

## 二、性能铁律 5 条

### 铁律 1:**限制同时显示的玻璃数量**

> 一屏内独立 glass 元素 **≤ 5 个**(Apple HIG §节制)

每个 glass 元素都创建独立的 backdrop 采样通道。

### 铁律 2:**避免多层嵌套 glass**

> 嵌套 glass 会有 reblur 开销 + 视觉 seam

如果必须嵌套:
- 外层用 depth-1(轻 blur)
- 内层用 depth-3(深 blur,但 tint 更实)

### 铁律 3:**大面积 glass 用 CSS containment**

```css
.glass {
  contain: layout paint;
}
```

让浏览器知道这块区域独立,避免触发整个 webview 的重绘。

### 铁律 4:**backdrop-filter 限定在 backdrop root**

(权威源:MDN — Backdrop Root)

> 触发 backdrop root 的属性:`filter` / `opacity` < 1 / `mask` / `backdrop-filter` / `mix-blend-mode` / `will-change`

**铁律**:不要在 `opacity` 已 < 1 的父元素内再用 `backdrop-filter` — 会限制 backdrop 范围。

### 铁律 5:**滚动时避免重算 backdrop**

- 使用 `will-change: backdrop-filter`(谨慎,过度使用反而慢)
- 滚动列表用 `transform: translateZ(0)` 触发独立层
- 避免 JS 触发布局抖动

## 三、Tauri 特定性能约束(权威源:`0-originals/tauri/v2-window-customization.md`)

| 约束 | 原因 |
|---|---|
| `transparent: true` 强制 WKWebView 离屏渲染 | NSWindow.backgroundColor = .clear |
| `backdrop-filter` 在 webview 内 vs NSVisualEffectView 系统级 | 系统级有 GPU 独立通道,webview 内会触发 webview 重绘 |
| `macOSPrivateApi: true` 才能用 NSVisualEffectView | 涉及 private API,需 opt-in |

> **结论**:`transparent: true` + CSS `backdrop-filter` 是 webview 内的近似实现,**不是** Apple 系统级 glass。性能 + 视觉都次优。

## 四、动画性能

| 动画类型 | GPU 加速 | 备注 |
|---|---|---|
| `transform: translate/scale` | ✅ | 首选 |
| `opacity` | ✅ | 备用 |
| `backdrop-filter` 值变化 | ❌ | 避免 |
| `width/height` | ❌ | 避免 |
| `background-position` | ❌ | 避免 |

## 五、监控指标(参考,不是硬性)

| 指标 | 目标 |
|---|---|
| FPS | ≥ 60 |
| 滚动时 FPS | ≥ 60(玻璃不卡顿) |
| 窗口 resize 时 FPS | ≥ 30 |
| 内存 | 玻璃元素数 × 1-2MB |

## 六、Battery Saver 自动降级(权威源:Microsoft Acrylic)

```css
/* Web 标准方式 */
@media (prefers-reduced-transparency: reduce) {
  .glass-l1, .glass-l2, .glass-l3 {
    backdrop-filter: none;
    background-color: var(--bg-solid-fallback);
  }
}
```

## 七、CSS Containment 进阶用法

```css
/* Sidebar 容器 */
.sidebar {
  contain: layout paint style;
}

/* 卡片 */
.card {
  contain: content;
}
```

---

**引用源**:
- Apple HIG Materials(节制使用)— `0-originals/apple/liquid-glass/03-hig-materials.md`
- Microsoft Acrylic(GPU-intensive)— `0-originals/microsoft/acrylic.md`
- MDN backdrop-filter(Backdrop Root)— `0-originals/mdn/backdrop-filter.md`
- Tauri v2 Window Customization — `0-originals/tauri/v2-window-customization.md`