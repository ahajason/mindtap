# feat(floating): V0.2.1 平台原生动态材质

> 创建: 2026-07-28

## Why

浮窗的 CSS fallback 不能证明 Windows 桌面环境层次已被正确采样；必须在不破坏 V0.2.0 窗口与交互基线的前提下，以单候选和 Windows 实机证据确定生产方案。

## What

仅为 `floating` 验证平台动态材质与固定 CSS fallback，不扩展任务复用、窗口几何或既有交互。

## Windows 基线（2026-07-28，100% DPI）

- 通过：四状态、360×36 / 360×280 几何、拖动、resize、焦点、原生菜单、计时与持久化；
- 失败：旧 fallback 的闭合内高光形成四周白线；28% 根表面在浅色、深色和纹理背景下过透，取消与输入提示不可稳定阅读；
- 本轮修复：移除根表面的实体白色内轮廓，使用局部 80% fallback 密度，并将输入提示提升到次级文字色；共享 G3 token 不变；
- 待复验：Windows 100% 的白线与三背景可读性；
- 延后：125% / 150% 与最终截图/录屏证据由 `docs/tasks/v0.2.1-chore-material-l3-evidence/task.md` 跟踪；
- 独立问题：主窗口启动首帧透明闪烁不属于本期，见 `docs/tasks/v-next-fix-main-window-startup-flash/task.md`。

## Done when

- [ ] 一个生产方案和 CSS fallback 均通过约定的 L1/L2/L3 验收
- [ ] 单一材质 owner、单次运行固定选择与 V0.2.0 回归基线得到证据确认
