# MDN — backdrop-filter CSS property [VERBATIM]

> **Source URL**: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
> **Fetched**: 2026-06-21 (V0.1.2 设计总纲 — 三层目录重建)
> **Method**: WebFetch
> **License**: CC BY-SA 2.5
> **本文档为 verbatim 抓取,正文一字不改**

---

# MDN Documentation: `backdrop-filter` CSS Property

## Overview

The `backdrop-filter` CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element. Because it applies to everything *behind* the element, to see the effect the element or its background needs to be transparent or partially transparent.

---

## Baseline Status

> **Baseline 2024** — Newly available  
> Since September 2024, this feature works across the latest devices and browser versions. This feature might not work in older devices or browsers.

---

## Full Syntax Reference

```css
/* Keyword value */
backdrop-filter: none;

/* URL to SVG filter */
backdrop-filter: url("common-filters.svg#filter");

/* <filter-function> values */
backdrop-filter: blur(2px);
backdrop-filter: brightness(60%);
backdrop-filter: contrast(40%);
backdrop-filter: drop-shadow(4px 4px 10px blue);
backdrop-filter: grayscale(30%);
backdrop-filter: hue-rotate(120deg);
backdrop-filter: invert(70%);
backdrop-filter: opacity(20%);
backdrop-filter: sepia(90%);
backdrop-filter: saturate(80%);

/* Multiple filters */
backdrop-filter: url("filters.svg#filter") blur(4px) saturate(150%);

/* Global values */
backdrop-filter: inherit;
backdrop-filter: initial;
backdrop-filter: revert;
backdrop-filter: revert-layer;
backdrop-filter: unset;
```

---

## All Filter Functions with Exact Syntax

| Function | Syntax |
|----------|--------|
| `blur()` | `blur( [<length>?] )` |
| `brightness()` | `brightness( [[<number> \| <percentage>] ?] )` |
| `contrast()` | `contrast( [[<number> \| <percentage>] ?] )` |
| `drop-shadow()` | `drop-shadow( [[<color>? && <length>{2,3}] ] )` |
| `grayscale()` | `grayscale( [[<number> \| <percentage>] ?] )` |
| `hue-rotate()` | `hue-rotate( [[<angle> \| <zero>] ?] )` |
| `invert()` | `invert( [[<number> \| <percentage>] ?] )` |
| `opacity()` | `opacity( [[<number> \| <percentage>] ?] )` |
| `sepia()` | `sepia( [[<number> \| <percentage>] ?] )` |
| `saturate()` | `saturate( [[<number> \| <percentage>] ?] )` |

**`<filter-value-list>`** = `[ <filter-function> | <url> ]+`

---

## Values

- **`none`**: No filter is applied to the backdrop.
- **`<filter-value-list>`**: A space-separated list of `<filter-function>`s or an SVG filter that will be applied to the backdrop.

---

## Backdrop Root

A backdrop root is an element that establishes a boundary for `backdrop-filter` effects. The following elements are backdrop roots:

- The root element (`<html>`)
- An element with a `filter` value other than `none`
- An element with an `opacity` value less than `1`
- An element with a `mask`, `mask-image`, `mask-border`, or `clip-path` value other than `none`
- An element with a `backdrop-filter` value other than `none`
- An element with a `mix-blend-mode` value other than `normal`
- An element with `will-change` set to any of the above properties

> **Note:** If a parent element has `opacity: 0.9`, it becomes a backdrop root and any child's `backdrop-filter` will only blur the content between that parent and the child—not the content behind the parent.

---

## Formal Definition

| Property | Value |
|----------|-------|
| **Initial value** | `none` |
| **Applies to** | All elements; In SVG, it applies to container elements excluding the `<defs>` element and all graphics elements |
| **Inherited** | No |
| **Computed value** | As specified |
| **Animation type** | A filter function list |

---

## Examples

### Basic Blur Example

**CSS:**
```css
.box {
  background-color: rgb(255 255 255 / 30%);
  backdrop-filter: blur(10px);
}

body {
  background-image: url("anemones.jpg");
}
```

**HTML:**
```html
<div class="container">
  <div class="box">
    <p>backdrop-filter: blur(10px)</p>
  </div>
</div>
```

### Multiple Filters

```css
backdrop-filter: url("filters.svg#filter") blur(4px) saturate(150%);
```

### Backdrop Root Demonstration

```html
<div class="parent backdrop-root">
  <div class="text">Text</div>
  <div class="square"></div>
  <div class="overlay"></div>
</div>
<div class="parent">
  <div class="text">Text</div>
  <div class="square"></div>
  <div class="overlay"></div>
</div>
```

```css
body {
  display: flex;
  column-gap: 16px;
  padding: 16px;
  background-image: conic-gradient(
    gray 90deg,
    silver 90deg 180deg,
    gray 180deg 270deg,
    silver 270deg
  );
  background-size: 32px 32px;
}

.parent {
  position: relative;
  width: 256px;
  height: 256px;
}

.backdrop-root {
  outline: 2px solid crimson;
  will-change: opacity;
}

.overlay {
  position: absolute;
  top: 25%;
  left: 50%;
  width: 50%;
  height: 50%;
  outline: 3px solid gainsboro;
  border-radius: 9999px;
  backdrop-filter: blur(10px);
}
```

---

## Browser Compatibility

Browser compatibility information was present but truncated in the provided content. The baseline status indicates broad support across modern browsers since September 2024.

---

## Specifications

Specification: [Filter Effects Module Level 2 — BackdropFilterProperty](https://drafts.fxtf.org/filter-effects-2/#BackdropFilterProperty)

---

## See Also

- [`filter`](/en-US/docs/Web/CSS/Reference/Properties/filter)
- [`<filter-function>`](/en-US/docs/Web/CSS/Reference/Values/filter-function)
- [`background-blend-mode`](/en-US/docs/Web/CSS/Reference/Properties/background-blend-mode), [`mix-blend-mode`](/en-US/docs/Web/CSS/Reference/Properties/mix-blend-mode)
- [CSS filter effects](/en-US/docs/Web/CSS/Guides/Filter_effects)
- [CSS compositing and blending](/en-US/docs/Web/CSS/Guides/Compositing_and_blending)