# feat(floating): V0.2.1 平台原生动态材质

> 创建: 2026-07-28

## Why

浮窗的 CSS fallback 不能证明 Windows 桌面环境层次已被正确采样；必须在不破坏 V0.2.0 窗口与交互基线的前提下，以单候选和 Windows 实机证据确定生产方案。

## What

仅为 `floating` 验证平台动态材质与固定 CSS fallback，不扩展任务复用、窗口几何或既有交互。

## Done when

- [ ] 一个生产方案和 CSS fallback 均通过约定的 L1/L2/L3 验收
- [ ] 单一材质 owner、单次运行固定选择与 V0.2.0 回归基线得到证据确认
