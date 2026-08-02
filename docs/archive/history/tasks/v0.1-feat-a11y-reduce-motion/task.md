# feat(a11y): Reduce Transparency + Reduce Motion 降级

> 创建: 2026-06-21

## Why
macOS 系统设置 Accessibility > Display 提供 Reduce transparency / Reduce motion
两个开关,App 应当尊重系统偏好(V0.1.1 交付的样式未响应这两个 media query)。

不修:开启 Reduce transparency 用户看到的玻璃材质仍 vibrate / 开启 Reduce motion 用户仍受 spring/scale 反馈干扰。

## What
两个 `@media` 降级:Reduce transparency → 实色 95% alpha 锚点 + focus offset +1px;
Reduce motion → 去全部 animation/transition/scale 反馈(focus ring 仍显示,无障碍优先)。

## Done when
- [x] @media (prefers-reduced-transparency: reduce): glass backdrop-filter none, background 95% alpha
- [x] focus-visible outline-offset 2px → 3px(对比强化)
- [x] @media (prefers-reduced-motion: reduce): 全部 animation/transition duration → 0.01ms
- [x] scroll-behavior → auto
- [x] focus-visible transition → none(但 ring 仍可见)