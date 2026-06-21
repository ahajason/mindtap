# Microsoft Fluent 2 — Material [VERBATIM]

> **Source URL**: https://fluent2.microsoft.design/material
> **Fetched**: 2026-06-21 (V0.1.2 设计总纲 — 三层目录重建)
> **Method**: WebFetch
> **License**: Microsoft Fluent 2 Design (开放)
> **本文档为 verbatim 抓取,正文一字不改**

---

# Material definitions

- **Solid:** "Solid is the most common material. It's an opaque material that uses color and elevation."
- **Acrylic:** "Acrylic is a semi-transparent material that replicates the effect of frosted glass."
- **Mica:** "Mica is an opaque material that is subtly tinted with someone's desktop background color when used on an active window."
- **Smoke:** "Smoke emphasizes an important surface by dimming the interface beneath it so that they recede into the background."

# When to use each

- **Solid:** "Solid is the most common material."
- **Acrylic:** "Use it for transient, light-dismiss surfaces such as popovers and menus."
- **Mica:** "Occluding materials, like Acrylic and Mica, appear widely on Windows as base layers beneath interactive UI components."
- **Smoke:** "It signals blocking interactions below a modal component, like a dialog."

# Fallback behavior

The source does not describe any fallback behavior for the materials.

# Light/Dark-mode behavior

- **Solid:** "Solid is mode aware; it supports both light and dark mode."
- **Acrylic:** "Acrylic is mode aware; it supports both light and dark mode."
- **Mica:** "Mica is mode aware; it supports light and dark mode."
- **Smoke:** "Smoke is not a mode-aware material. Because it's meant to obscure the interface behind it, it's always translucent black."