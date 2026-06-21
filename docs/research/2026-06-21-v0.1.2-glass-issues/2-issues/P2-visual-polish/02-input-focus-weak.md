# P2 · `<input>` focus-visible 仅改 background,缺 ring

> **优先级**: 🟡 P2(可访问性边界,WCAG 边界)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/10-focus-state-spec.md`](../../1-design/10-focus-state-spec.md) §五 Focus Ring
> **关联原始**:
> - `0-originals/mdn/focus-visible.md`(WCAG 1.4.11 3:1 强制)
> - `0-originals/wcag/1.4.11-non-text-contrast.md`
> - `0-originals/apple/hig/08-accessibility.md`

---

## 一、问题现状(代码实测)

`src/components/ui/input.tsx:6`:

```tsx
'glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-3 transition-all duration-base focus-visible:outline-none focus-visible:bg-white/55'
```

`src/components/ui/textarea.tsx:6`:

```tsx
'glass-l1 rounded-[var(--radius-input)] text-sm text-text-1 placeholder:text-text-3 p-3 transition-all duration-base focus-visible:outline-none focus-visible:bg-white/55 resize-none'
```

**问题**:`focus-visible:outline-none` + `focus-visible:bg-white/55`,只改 background,**没有 ring / outline**,keyboard 用户难以识别 focus 位置。

**对比**:`src/components/ui/button.tsx:6`:

```tsx
'inline-flex ... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ...'
```

✅ Button 用 `ring-2 ring-primary`,input 反而没有 — 不一致。

## 二、规范违反

[`1-design/10-focus-state-spec.md`](../../1-design/10-focus-state-spec.md) §五 Focus Ring 规范:

| 属性 | 值 |
|---|---|
| 颜色 | `--brand-500`(`#165DFF`) |
| 宽度 | **2px** |
| Offset | **2px** |
| 对比度 | **≥ 3:1** vs 周围背景(WCAG 1.4.11 强制) |
| 圆角 | 跟随组件圆角(同心) |

**WCAG 1.4.11 Non-text Contrast 强制**:UI 组件视觉信息(包含 focus indicator)必须 ≥ 3:1 对比度。

当前 input 的 focus 仅是 `bg-white/55`(比默认 50% alpha 浅 5%),在玻璃背景下**对比度增量 < 1.5:1**,WCAG 失败边界。

## 三、设计匹配

[`1-design/10-focus-state-spec.md`](../../1-design/10-focus-state-spec.md) §五:

```css
:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 2px;
}
```

## 四、解决路径

### 路径 IF-1:input 改 ring-2 ring-primary + 保持 glass(推荐)

```tsx
className="glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-2 transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white/55"
```

| 改动 | `placeholder:text-text-3` → `text-text-2` + `focus-visible:ring-2 focus-visible:ring-primary` |
| 优点 | 跟 Button 一致;WCAG 1.4.11 通过 |
| 缺点 | ring 套在 glass 容器上,可能被 blur 吞掉一部分,需要 offset |

### 路径 IF-2:input 改 box-shadow 内阴影(避免 ring 跟 glass 冲突)

```tsx
className="glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-2 transition-all duration-base focus-visible:bg-white/95 focus-visible:shadow-[inset_0_0_0_2px_var(--color-primary)]"
```

| 优点 | inset shadow 不会被 blur 吞掉,对比度 100% |
| 缺点 | 不是标准 ring,屏幕阅读器识别差 |

### 路径 IF-3:input 升 text-2 placeholder + 留 focus bg 改动(最简)

```tsx
className="glass-l1 rounded-[var(--radius-input)] px-3 text-sm text-text-1 placeholder:text-text-2 transition-all duration-base focus-visible:outline-none focus-visible:bg-white/70 focus-visible:shadow-[0_0_0_2px_var(--color-primary)]"
```

| 优点 | shadow 替代 outline,glass 友好 |
| 缺点 | 不是标准 ring |

## 五、推荐

**IF-1**(跟 Button 视觉一致,WCAG 通过,标准 outline 模式)

## 六、自检

| 检查项 | 方法 |
|---|---|
| 键盘 Tab 聚焦 input,ring 2px brand 清晰可见 | 视觉 |
| ring 对比度 ≥ 3:1 vs 周围背景 | WebAIM checker |
| 鼠标点击 input,无 ring 残留(用 :focus-visible) | 鼠标点击观察 |
| placeholder 文字对比度 ≥ 4.5:1 | WebAIM checker |

---

**引用源**:
- 设计规范 — [`1-design/10-focus-state-spec.md`](../../1-design/10-focus-state-spec.md) §五
- 原始资料 — `0-originals/mdn/focus-visible.md` + `0-originals/wcag/1.4.11-non-text-contrast.md` + `0-originals/apple/hig/08-accessibility.md`