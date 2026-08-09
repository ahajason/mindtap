# 浮窗约束

- 浮窗入口 HTML 必须位于项目根目录，和 `index.html` 同级；否则构建输出路径会与 Tauri 配置不匹配。
- 状态切换以显式 native resize 为准；`ResizeObserver` 只做运行时自适应。手动拖拽必须阻断 resize 反馈循环。
- `resizable: false` 时必须提供拖拽手柄；尺寸上限要同时更新 Tauri 配置与 Rust 实现。
- 面板收起使用根级外部点击判断；不要退回 input blur 方案，避免事件竞态。
