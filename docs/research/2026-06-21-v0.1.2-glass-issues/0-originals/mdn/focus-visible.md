# MDN — `:focus-visible` CSS Pseudo-class [VERBATIM]

> **Source URL**: https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
> **Fetched**: 2026-06-21(V0.1.2 focus 状态统一设计 — 解决 #53 问题)
> **Method**: WebFetch
> **License**: CC BY-SA 2.5
> **本文档为 verbatim 抓取,正文一字不改**

---

# `:focus-visible` CSS Pseudo-class

## 1. Full Definition

The **`:focus-visible`** pseudo-class applies while an element matches the `:focus` pseudo-class and the UA (User Agent) determines via heuristics that the focus should be made evident on the element. (Many browsers show a "focus ring" by default in this case.)

**Syntax:**
```css
:focus-visible {
  /* ... */
}
```

## 2. Difference from `:focus`

| Aspect | `:focus` | `:focus-visible` |
|--------|----------|------------------|
| **Matching** | Always matches focused element | Matches only when user needs to be informed of focus |
| **Mouse click** | Shows focus ring | Generally hides focus ring |
| **Keyboard navigation** | Shows focus ring | Shows focus ring |
| **Customization** | Can be obtrusive when clicking | Respects browser heuristics while allowing style customization |

> "The `:focus-visible` pseudo-class respects user agents' selective focus indication behavior while still allowing focus indicator customization."

## 3. Browser Support / Baseline Status

**Baseline: Widely Available**

> "This feature is well established and works across many devices and browser versions. It's been available across browsers since March 2022."

## 4. Accessibility Best Practices

### Low Vision
- Make focus indicators visible to people with low vision
- Benefits users in brightly lit spaces (outdoor sunlight)
- **WCAG 2.1 SC 1.4.11** requires **3:1 minimum contrast** for non-text focus indicators

### Cognitive Concerns
- Inconsistent focus behavior (appearing/disappearing) may confuse users with cognitive concerns or those less technologically literate

## 5. When It Triggers

| Input Method | Focus Indicator |
|--------------|----------------|
| **Keyboard (Tab)** | ✅ Shown |
| **Mouse click** | ❌ Generally hidden |
| **Touch/finger** | ❌ Generally hidden |
| **Text input with focus** | ✅ Shown |
| **Script-managed focus** | ✅ Shown when needed |

### Example Code
```css
/* Custom focus styles that respect browser heuristics */
input:focus-visible {
  outline: 2px solid crimson;
  border-radius: 3px;
}

select:focus-visible {
  border: 2px dashed crimson;
  border-radius: 3px;
  outline: none;
}

/* Fallback for older browsers */
@supports not selector(:focus-visible) {
  .button:focus {
    outline: 3px solid deepskyblue;
    outline-offset: 3px;
  }
}
```