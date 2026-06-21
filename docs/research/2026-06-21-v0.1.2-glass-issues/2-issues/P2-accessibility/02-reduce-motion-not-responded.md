# P2-4 · 未响应 Reduce Motion 系统设置

> **优先级**: 🟡 P2(无障碍合规,Apple HIG 强制响应)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/07-accessibility.md`](../../1-design/07-accessibility.md) §三
> **关联原始**:
> - `0-originals/apple/hig/08-accessibility.md` §"Reduce Motion"

---

## 一、问题表现

用户在系统设置开启 "Reduce Motion"(减少动效)后,所有 spring 动画 / scale 反馈 / 形变仍按 spring 曲线播放。

这违反:
- **Apple HIG Accessibility**(形变动画响应 Reduce Motion)
- 前庭功能障碍用户偏好

## 二、根因

CSS 动画 / transition 未使用 `@media (prefers-reduced-motion: reduce)`。

React 组件中的 framer-motion / spring 动画未读取 `useReducedMotion()` hook。

## 三、设计匹配

[`1-design/07-accessibility.md`](../../1-design/07-accessibility.md) §三 Reduce Motion 降级规则:

| 元素 | 正常 | Reduce Motion |
|---|---|---|
| spring 动画 | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `linear` 200ms |
| scale 反馈 | `scale(0.98)` | 无 |
| 形变 | spring | fade 200ms |
| 渐显 | fade-in 300ms | fade-in 150ms |

**权威源**(`0-originals/apple/hig/08-accessibility.md`):

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

withAnimation(reduceMotion ? .none : .spring) {
    isExpanded.toggle()
}
```

## 四、解决路径

### 路径 M-1:CSS `prefers-reduced-motion`(立即)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

| 优点 | 1 行 CSS,关闭所有动画 |
| 缺点 | 过于激进,可能影响希望保留的淡入 |

### 路径 M-2:CSS 细粒度(推荐)

```css
@media (prefers-reduced-motion: reduce) {
  /* 移除 spring 曲线 */
  .glass-animated {
    transition: opacity 150ms linear;
  }
  /* 移除 scale 反馈 */
  button:active {
    transform: none;
  }
}
```

| 优点 | 保留必要的淡入,只去 spring |
| 缺点 | 需要分类动画 |

### 路径 M-3:React `useReducedMotion()`(如果用了 framer-motion)

```jsx
import { useReducedMotion } from 'framer-motion';
const reduceMotion = useReducedMotion();
<motion.div
  animate={reduceMotion ? { opacity: 1 } : { scale: 1 }}
/>
```

## 五、推荐

**M-2 立即**(粒度合适,符合 Apple HIG 规范"降低而非完全关闭")

## 六、自检

| 检查项 | 方法 |
|---|---|
| `@media (prefers-reduced-motion: reduce)` 加到 `src/index.css` | grep 验证 |
| 系统设置开启后,button 点击无 scale 反馈 | macOS 设置 → 辅助功能 → 显示器 → 减少动效 |
| glass transition 仍存在(opacity 淡入)但无 spring | 视觉 |
| 关闭 reduce 后立即恢复 | 切换测试 |

---

**引用源**:
- 设计规范 — [`1-design/07-accessibility.md`](../../1-design/07-accessibility.md) §三
- 原始资料 — `0-originals/apple/hig/08-accessibility.md`