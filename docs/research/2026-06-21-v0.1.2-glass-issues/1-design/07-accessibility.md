# 07 · Accessibility 设计规范

> **层级**: 1-design / Accessibility
> **创建**: 2026-06-21
> **作用**: 无障碍规范 — WCAG 2.2 AA + Apple HIG Accessibility
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/hig/08-accessibility.md`(Reduce Transparency / Reduce Motion)
> - `0-originals/wcag/`(全章)
> - `0-originals/microsoft/acrylic.md`(High Contrast / Battery Saver)

---

## 一、WCAG 2.2 AA 必备(权威源:WCAG 全章)

| 类别 | 要求 | 阈值 |
|---|---|---|
| 1.1 Non-text Content | 图标 / button 必须有 `aria-label` | 必需 |
| 1.3.1 Info and Relationships | DOM 结构反映视觉层级 | 必需 |
| 1.4.3 Contrast (Minimum) | 文字 ≥ 4.5:1,大字 ≥ 3:1 | 强制 |
| 1.4.11 Non-text Contrast | UI 组件 ≥ 3:1 | 强制 |
| 2.1.1 Keyboard | 所有交互可键盘完成 | 强制 |
| 2.4.7 Focus Visible | 焦点指示器清晰可见 | 强制 |
| 2.5.5 Target Size | 触摸目标 ≥ 44x44pt | 推荐 |
| 4.1.2 Name, Role, Value | ARIA 正确 | 强制 |

## 二、Reduce Transparency(权威源:Apple HIG Accessibility)

**触发条件**:用户在系统设置开启 Reduce Transparency。

**降级规则**:

| 元素 | 正常 | Reduce Transparency |
|---|---|---|
| Sidebar | glass depth-2 | `rgba(245,249,255,0.95)` 实色 |
| Toolbar | glass depth-2 | `rgba(245,249,255,0.95)` 实色 |
| Card | glass depth-3 | `rgba(255,255,255,0.95)` 实色 |
| Modal | glass depth-4 | `rgba(255,255,255,0.98)` 实色 |
| Button(plain) | transparent | `rgba(0,0,0,0.05)` |
| Backdrop-filter | blur 启用 | `none` |

> 实现方式:
> - macOS 自动检测(系统设置)
> - CSS: `@media (prefers-reduced-transparency: reduce)`(Web 标准,2025+)
> - JS:`window.matchMedia('(prefers-reduced-transparency: reduce)')`

## 三、Reduce Motion(权威源:Apple HIG Accessibility)

**触发条件**:用户在系统设置开启 Reduce Motion。

**降级规则**:

| 元素 | 正常 | Reduce Motion |
|---|---|---|
| spring 动画 | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `linear` 200ms |
| scale 反馈 | `scale(0.98)` | 无 |
| 形变 | spring | fade 200ms |
| 渐显 | fade-in 300ms | fade-in 150ms |

## 四、High Contrast(权威源:Microsoft Acrylic / Apple HIG)

**触发条件**:High Contrast mode 开启。

**降级规则**:
- 玻璃 → 完全实色
- Border → 2px
- Focus ring → 3px
- 文字 → 系统高对比色(`--text-1`)

## 五、Battery Saver(权威源:Microsoft Acrylic)

**触发条件**:笔记本进入 Battery Saver 模式。

**降级规则**:
- 玻璃 → 实色(同 Reduce Transparency)
- 原因:blur 是 GPU intensive,节电时关闭

## 六、键盘导航规范

| 模式 | 键位 |
|---|---|
| 焦点移动 | Tab / Shift+Tab |
| Sidebar 切换 | ↑↓ |
| Tab bar 切换 | ←→ |
| 激活 | Enter / Space |
| 取消 | Esc |
| 关闭弹窗 | Esc |
| 提交表单 | Cmd+Enter |
| 全局搜索 | Cmd+K |

## 七、VoiceOver / Screen Reader

| 元素 | aria 属性 |
|---|---|
| Button | `aria-label="新建笔记"` |
| Icon-only button | 必填 `aria-label` |
| Navigation | `role="navigation"` + `aria-label="主导航"` |
| Tab | `role="tab"`,`aria-selected="true"` |
| List | `role="list"` + `role="listitem"` |
| Modal | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` |
| Live region | `aria-live="polite"` |

## 八、Focus 指示器(权威源:WCAG 1.4.11)

| 属性 | 值 |
|---|---|
| 颜色 | brand color |
| 宽度 | 2px |
| Offset | 2px(组件外) |
| 对比度 | ≥ 3:1 vs 周围背景 |

```css
:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 2px;
}
```

## 九、触摸目标(权威源:Apple HIG Buttons / WCAG 2.5.5)

| 类型 | 最小尺寸 |
|---|---|
| Apple HIG 触摸目标 | 44x44pt |
| WCAG 2.5.5 AAA | 44x44 CSS px |

> 即使 icon 只有 16x16,容器也要 44x44pt。

## 十、Reduced Data(预留)

未来支持:
- 字体大小:支持系统字体缩放
- 不依赖颜色:所有状态都有非颜色指示

---

**引用源**:
- Apple HIG Accessibility — `0-originals/apple/hig/08-accessibility.md`
- WCAG 2.2 全文 — `0-originals/wcag/`
- Microsoft Acrylic(High Contrast / Battery Saver)— `0-originals/microsoft/acrylic.md`