# 10 · Focus 状态统一规范

> **层级**: 1-design / Focus State
> **创建**: 2026-06-21
> **作用**: 统一 focus / active / inactive 三态行为 — 解决 #53 "focus 状态混乱" 问题
> **不带具体 mindtap 问题分析** — 见 `2-issues/P1-active-inactive/00-focus-state-chaos.md`
> **原始资料**:
> - `0-originals/mdn/focus-visible.md`(CSS :focus-visible 规范)
> - `0-originals/apple/liquid-glass/02-adopting.md`(adopting §3 controls 形变行为)
> - `0-originals/apple/hig/08-accessibility.md`(Reduce Transparency / Reduce Motion)
> - `0-originals/wcag/1.4.11-non-text-contrast.md`(3:1 非文本对比)
> - `0-originals/apple/swiftui/01-key-apis.md` §11 Focus

---

## 一、问题定义(为什么需要统一)

Focus 状态混乱通常表现为:

1. **键盘 focus** 和 **鼠标 hover** 行为不一致(键盘无 visible ring)
2. **窗口 active** 和 **窗口 inactive** 视觉不一致(Sidebar 高亮但 chrome 已 inactive)
3. **路由 active** 和 **键盘 focus active** 冲突(视觉指示重叠 / 矛盾)
4. **玻璃状态**(vibrance / blur)在 active / inactive 间切换不自然
5. **focus ring** 跟玻璃材质冲突(ring 被 blur 吞掉)

## 二、3 层 Focus 状态模型(权威源:综合)

```
┌─────────────────────────────────────────────┐
│  Layer 1: 系统级(Window active/inactive)     │  ← macOS keyWindow 概念
│  来源:macOS NSWindow / webview document.hasFocus()
├─────────────────────────────────────────────┤
│  Layer 2: 容器级(Navigation active)         │  ← 当前路由 / 当前 tab
│  来源:React Router useLocation()
├─────────────────────────────────────────────┤
│  Layer 3: 控件级(Keyboard focus / hover)    │  ← 键盘 / 鼠标
│  来源:CSS :focus-visible / :hover
└─────────────────────────────────────────────┘
```

> **铁律**:3 层**独立但可同时存在**,每层用**独立 CSS 变量**控制,互不污染。

## 三、Layer 1:Window active/inactive(系统级)

### macOS 范式(权威源:Apple Liquid Glass adopting §3)

| 状态 | 触发 | 视觉 |
|---|---|---|
| **Window active**(keyWindow) | 窗口获得焦点 | 玻璃 full vibrance + system tint |
| **Window inactive** | 窗口失焦 | 玻璃降 vibrance + tint 变淡 |

**Web 模拟**(本项目 Tier 5):
```css
/* 通过 webview document.hasFocus() 或 visibilitychange */
:has(.window-active) .glass-l2 {
  --glass-tint: rgba(255,255,255,0.55);
  --glass-blur: 20px;
}
:has(.window-inactive) .glass-l2 {
  --glass-tint: rgba(255,255,255,0.35);
  --glass-blur: 14px;
}
```

**未来 Tier 2 升级**:Rust 端 NSVisualEffectView `.followsWindowActiveState` 自动处理。

## 四、Layer 2:Navigation active(容器级)

### 规则

| 元素 | active 指示器 |
|---|---|
| **Sidebar NavLink** | 背景 brand color + 文字 white + 字重 semibold |
| **Tab bar tab** | icon/label brand color + 字重 semibold(**禁用色块**) |
| **Breadcrumb current** | 文字 `--text-1`,前面 chevron + label |
| **Page header 当前页** | H1 `--text-1`,其他 `--text-2` |

**铁律**(权威源:Apple HIG Sidebars):
- 不允许用色块 / 描边表示 active
- active 视觉 = tint + 加粗 + (可选)inset left border 2px brand
- **任何 active 都必须有非颜色指示**(色盲友好,WCAG 1.4.1)

### 数据流

```typescript
// 当前路由作为 single source of truth
const { pathname } = useLocation();
const isActive = (href: string) =>
  pathname === href || pathname.startsWith(href + '/');
```

## 五、Layer 3:Keyboard focus / hover(控件级)

### :focus-visible 范式(权威源:`0-originals/mdn/focus-visible.md`)

| 输入方式 | :focus | :focus-visible |
|---|---|---|
| **键盘 Tab** | ✅ 触发 | ✅ 触发(显示 ring) |
| **鼠标 click** | ✅ 触发 | ❌ 不触发(隐藏 ring) |
| **触摸** | ✅ 触发 | ❌ 不触发 |
| **脚本 focus** | ✅ 触发 | ✅ 触发 |

**铁律**:**用 `:focus-visible` 而非 `:focus`** — 鼠标点击后视觉干扰。

### Focus Ring 规范(权威源:WCAG 1.4.11)

| 属性 | 值 |
|---|---|
| 颜色 | `--brand-500`(`#165DFF`) |
| 宽度 | **2px**(最小,WCAG 2.2 推荐 ≥ 2px) |
| Offset | **2px**(组件外) |
| 对比度 | **≥ 3:1** vs 周围背景(WCAG 1.4.11 强制) |
| 圆角 | 跟随组件圆角(同 concentric) |
| 动画 | 仅透明度淡入 150ms,**无 scale / 移动** |

```css
:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 2px;
  transition: outline-color 150ms ease;
}

:focus:not(:focus-visible) {
  outline: none;  /* 鼠标点击不显示 ring */
}
```

### Hover 规范

| 元素 | hover 行为 |
|---|---|
| **NavLink** | 背景 `rgba(0,0,0,0.04)`,文字 `--text-1` |
| **Button(filled)** | 背景 -8% lightness,scale 1.0(无变化) |
| **Button(plain)** | 背景 `rgba(0,0,0,0.04)` |
| **Icon button** | 背景 `rgba(0,0,0,0.06)`,圆角 6px |
| **Card** | 边框 +1px brand tint,**不**抬升(避免重排) |

### Hover vs Focus 冲突

| 场景 | 解决方案 |
|---|---|
| hover 跟 focus 同时存在 | focus ring 在 hover 背景之上,优先级靠 outline |
| active 跟 focus 同时存在 | active 的 brand 背景足够强,focus ring 可省略(但需 inset border 维持可见) |
| disabled 跟 hover | disabled 状态禁用 hover 反馈 |

## 六、3 层状态合并矩阵

| Window | Nav | Focus | 视觉 |
|---|---|---|---|
| active | inactive | no | 玻璃 full + row 默认色 |
| active | inactive | yes(keyboard) | 玻璃 full + row focus ring |
| active | active | no | 玻璃 full + row brand bg + white text |
| active | active | yes | 玻璃 full + row brand bg + inset ring |
| inactive | inactive | no | 玻璃降 vibrance + row 默认 |
| inactive | active | no | 玻璃降 + row brand bg(略降饱和) |
| inactive | * | yes | 玻璃降 + row 灰色 ring(降饱和) |

## 七、Reduce Motion 下的 focus(权威源:Apple HIG Accessibility)

```css
@media (prefers-reduced-motion: reduce) {
  :focus-visible {
    transition: none;
  }
}
```

> Reduce Motion 不影响 focus ring 本身(用户仍需要可见指示),只影响动画过渡。

## 八、Reduce Transparency 下的 focus

```css
@media (prefers-reduced-transparency: reduce) {
  .glass-l2 {
    background: rgba(245,249,255,0.95);  /* 实色锚点 */
  }
  /* focus ring 仍用 brand color,但 offset 增加到 3px(对比强化) */
  :focus-visible {
    outline-offset: 3px;
  }
}
```

## 九、统一 CSS 变量

```css
:root {
  /* Window state */
  --glass-tint: rgba(255,255,255,0.55);
  --glass-blur: 20px;
  --glass-saturation: 180%;
  --text-primary: #1D2939;
  --text-secondary: #475467;
  
  /* Focus */
  --focus-color: var(--brand-500);
  --focus-width: 2px;
  --focus-offset: 2px;
  
  /* Navigation active */
  --nav-active-bg: var(--brand-500);
  --nav-active-text: white;
  --nav-active-border: 2px solid var(--brand-500);
}

.window-inactive {
  --glass-tint: rgba(255,255,255,0.35);
  --glass-blur: 14px;
  --glass-saturation: 140%;
}
```

## 十、JS Hook(window active 检测)

```typescript
// 检测 webview 窗口是否 active
function useWindowActive() {
  const [active, setActive] = useState(document.hasFocus());
  
  useEffect(() => {
    const onFocus = () => setActive(true);
    const onBlur = () => setActive(false);
    const onVisibility = () => setActive(!document.hidden);
    
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  
  return active;
}
```

## 十一、铁律汇总

1. **3 层独立**:Window / Nav / Focus 不互相覆盖
2. **`:focus-visible` 优先**:不用 `:focus`(避免鼠标点击后 ring 残留)
3. **focus ring 必可见**:≥ 3:1 对比 / ≥ 2px / offset 2px
4. **active ≠ focus**:active 是路由状态,focus 是键盘状态,二者视觉指示分开
5. **Reduce Motion 不影响 focus**:用户仍需可见指示,只去动画
6. **Reduce Transparency 加强 focus**:offset +1px,实色背景
7. **色盲友好**:active 不能仅靠颜色,加 inset border / 字重变化

---

**引用源**:
- MDN `:focus-visible` — `0-originals/mdn/focus-visible.md`
- WCAG 1.4.11 — `0-originals/wcag/1.4.11-non-text-contrast.md`
- Apple Liquid Glass adopting §3 Controls — `0-originals/apple/liquid-glass/02-adopting.md`
- Apple HIG Accessibility — `0-originals/apple/hig/08-accessibility.md`
- Apple SwiftUI Focus API — `0-originals/apple/swiftui/01-key-apis.md` §11
- Apple HIG Sidebars(active 规范)— `0-originals/apple/hig/04-sidebars.md`