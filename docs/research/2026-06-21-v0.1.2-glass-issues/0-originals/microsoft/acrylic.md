# Microsoft Learn — Acrylic material [VERBATIM]

> **Source URL**: https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic
> **Fetched**: 2026-06-21 (V0.1.2 设计总纲 — 三层目录重建)
> **Method**: WebFetch
> **License**: Microsoft Docs (CC BY 4.0)
> **本文档为 verbatim 抓取,Markdown 标签已去除,正文一字不改**

---

# Acrylic material - Windows apps | Microsoft Learn

Acrylic is a type of [Brush](/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.media.brush) that creates a translucent texture. You can apply acrylic to app surfaces to add depth and help establish a visual hierarchy.

> **Important APIs**: [AcrylicBrush class](/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.media.acrylicbrush), [Background property](/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.control.background), [Window.SystemBackdrop property](/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.window.systembackdrop), [DesktopAcrylicBackdrop class](/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.media.desktopacrylicbackdrop)

## Acrylic and the Fluent Design System

The Fluent Design System helps you create modern, bold UI that incorporates light, depth, motion, material, and scale. Acrylic is a Fluent Design System component that adds physical texture (material) and depth to your app. To learn more, see [Fluent Design - Material](https://fluent2.microsoft.design/material).

## Acrylic blend types

Acrylic's most noticeable characteristic is its transparency. There are two acrylic blend types that change what's visible through the material:

- **Background acrylic** reveals the desktop wallpaper and other windows that are behind the currently active app, adding depth between application windows while celebrating the user's personalization preferences.
- **In-app acrylic** adds a sense of depth within the app frame, providing both focus and hierarchy.

Avoid layering multiple acrylic surfaces: multiple layers of background acrylic can create distracting optical illusions.

## When to use acrylic

Consider the following usage patterns to decide how best to incorporate acrylic into your app.

### Transient surfaces

- Use **background acrylic** for transient UI elements.

For apps with context menus, flyouts, non-modal popups, or light-dismiss panes, we recommend that you use background acrylic, especially if these surfaces draw outside the frame of the main app window. Using acrylic in transient scenarios helps maintain a visual relationship with the content that triggered the transient UI.

Many XAML controls draw acrylic by default. [MenuFlyout](../controls/menus), [AutoSuggestBox](../controls/auto-suggest-box), [ComboBox](../controls/combo-box), and similar controls with light-dismiss popups all use acrylic while open.

### Supporting UI and vertical panes

- Use **in-app acrylic** for supporting UI, such as on surfaces that may overlap content when scrolled or interacted with.

If you are using in-app acrylic on navigation surfaces, consider extending content beneath the acrylic pane to improve the flow in your app. Using [NavigationView](../controls/navigationview) will do this for you automatically. However, to avoid creating a striping effect, try not to place multiple pieces of acrylic edge-to-edge - this can create an unwanted seam between the two blurred surfaces. Acrylic is a tool to bring visual harmony to your designs, but when used incorrectly can result in visual noise.

For vertical panes or surfaces that help section off content of your app, we recommend you use an opaque background instead of acrylic. If your vertical panes open on top of content, like in NavigationView's **Compact** or **Minimal** modes, we suggest you use in-app acrylic to help maintain the page's context when the user has this pane open.

Note

Rendering acrylic surfaces is GPU-intensive, which can increase device power consumption and shorten battery life. Acrylic effects are automatically disabled when a device enters Battery Saver mode. Users can disable acrylic effects for all apps by turning off *Transparency effects* in Settings > Personalization > Colors.

## Usability and adaptability

Acrylic automatically adapts its appearance for a wide variety of devices and contexts.

In High Contrast mode, users continue to see the familiar background color of their choosing in place of acrylic. In addition, both background acrylic and in-app acrylic appear as a solid color:

- When the user turns off *Transparency effects* in Settings > Personalization > Colors.
- When Battery Saver mode is activated.
- When the app runs on low-end hardware.

In addition, only background acrylic will replace its translucency and texture with a solid color:

- When an app window on desktop deactivates.
- When the app is running on Xbox, HoloLens, or in tablet mode.

### Legibility considerations

It's important to ensure that any text your app presents to users meets contrast ratios (see [Accessible text requirements](../accessibility/accessible-text-requirements)). We've optimized the acrylic resources such that text meets contrast ratios on top of acrylic. We don't recommend placing accent-colored text on your acrylic surfaces because these combinations are likely to not pass minimum contrast ratio requirements at the default 14px font size. Try to avoid placing [hyperlinks](../controls/hyperlinks) over acrylic elements. Also, if you choose to customize the acrylic tint color or opacity level, keep the impact on legibility in mind.

## Apply acrylic in your app

To learn how to apply background acrylic or in-app acrylic in your app, including how to create custom acrylic brushes, see [Apply Mica or Acrylic materials in desktop apps for Windows 11](/en-us/windows/apps/develop/ui/system-backdrops).

## Do's and don'ts

- **Do** use acrylic on transient surfaces.
- **Do** extend acrylic to at least one edge of your app to provide a seamless experience by subtly blending with the app's surroundings.
- **Don't** put desktop acrylic on large background surfaces of your app.
- **Don't** place multiple acrylic panes next to each other because this results in an undesirable visible seam.
- **Don't** place accent-colored text over acrylic surfaces.

## How we designed acrylic

We fine-tuned acrylic's key components to arrive at its unique appearance and properties. We started with translucency, blur, and noise to add visual depth and dimension to flat surfaces. We added an exclusion blend mode layer to ensure contrast and legibility of UI placed on an acrylic background. Finally, we added color tint for personalization opportunities. In concert these layers add up to a fresh, usable material.

The acrylic recipe: background, blur, exclusion blend, color/tint overlay, noise

## Examples

> The **WinUI 3 Gallery** app includes interactive examples of WinUI controls and features. Get the app from the [Microsoft Store](https://apps.microsoft.com/detail/9P3JFPWWDZRC) or browse the source code on [GitHub](https://github.com/microsoft/WinUI-Gallery).