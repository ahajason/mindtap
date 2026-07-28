# feat(floating): 平台原生动态材质与能力复用

> 状态：pending（文档与候选边界已冻结，产品实现未开始）
> 版本：V0.2.1 MINOR
> 范围：`floating` 原生窗口的候选验证、生产方案选择与 CSS fallback
> 归属判定：`docs/tech/v0.2.1-native-dynamic-material-tech.md` §1

## Why

Windows 实机反馈确认：当前浮窗表面仍可能呈现扁平泛灰。现有静态 CSS 不能证明已经采样 Windows 桌面或后方原生窗口，因此该问题不能继续作为 V0.2.0.x 的 CSS 参数 PATCH 处理。

## What

1. 盘点 Tauri `2.11.5` 内建窗口效果和现有依赖；
2. 按 Acrylic → Mica 的顺序逐个完成单候选接线与 Windows L3；
3. 原生候选均未达标或 React 候选有同矩阵更优证据时，才评估一个 React 液态玻璃组件库；
4. 保留可独立恢复的 CSS fallback；
5. 应用启动时固定本次运行的材质路径，不在状态切换中重新探测。

## Windows 基线（2026-07-28，100% DPI）

- 通过：四状态、360×36 / 360×280 几何、拖动、resize、焦点、原生菜单、计时与持久化；
- 失败：旧 fallback 的闭合内高光形成四周白线；28% 根表面在浅色、深色和纹理背景下过透，取消与输入提示不可稳定阅读；
- 本轮修复：移除根表面的实体白色内轮廓，使用局部 80% fallback 密度，并将输入提示提升到次级文字色；共享 G3 token 不变；
- 待复验：Windows 100% 的白线与三背景可读性；
- 延后：125% / 150% 与最终截图/录屏证据由 `docs/tasks/v0.2.1-chore-material-l3-evidence/task.md` 跟踪；
- 独立问题：主窗口启动首帧透明闪烁不属于本期，见 `docs/tasks/v-next-fix-main-window-startup-flash/task.md`。

## Done when

- [ ] 已有能力、依赖和最小接线位置有可复核记录；
- [ ] 每个候选都有同一 Windows 环境与同一 L3 矩阵证据；
- [ ] 生产实现只有一个生效材质 owner 和一个 CSS fallback owner；
- [ ] 系统偏好、能力缺失及获选 React 候选失败时的降级路径通过；
- [ ] L1 生产契约与 V0.2.0 既有行为回归通过；
- [ ] L2 单测、类型、构建和 Rust 编译通过；
- [ ] Windows 11 的背景、焦点、四状态及 100% / 125% / 150% DPI 全矩阵通过；
- [ ] 验收报告记录最终选择、淘汰候选、环境和截图/录屏索引。

## 明确不做

- 不修改主窗口、其他弹窗、共享 token 或 V0.2.0 窗口行为；
- 不因静态 CSS、Vitest 或构建通过宣称动态材质完成；
- 不并行接线多个候选；
- 不在依赖盘点前新增材质库或自写 Win32 FFI；
- 不提供用户可见的材质选择或运行期手动切换。

## 关联

- PRD: `docs/prd/v0.2.1-native-dynamic-material-prd.md`
- Domain ADR: `docs/domain/adr/0010-v0.2.1-native-dynamic-material.md`
- Tech: `docs/tech/v0.2.1-native-dynamic-material-tech.md`
- Design: `docs/design/v0.2.1-native-dynamic-material-design.md`
- Plan: `docs/plans/2026-07-28-v0.2.1-native-dynamic-material.md`
