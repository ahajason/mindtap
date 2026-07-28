# feat(floating): 平台原生动态材质与能力复用（旧立项入口）

> **SUPERSEDED / REFERENCE ONLY — 2026-07-28**
> 本任务已正式分配为 V0.2.1；当前任务入口为 `docs/tasks/v0.2.1-feat-native-dynamic-material/task.md`。
> 以下内容保留为立项前证据，不再作为状态、范围或 Done when 真值。

> 状态：superseded
> 版本：待产品路线确定（不属于 V0.2.0.x PATCH）
> 范围：后续版本调研、设计与 Windows 实机验证；当前不实现

## Why

Windows 实机反馈确认：当前浮窗表面仍可能呈现扁平泛灰，现有静态 CSS 不能作为 Apple Liquid Glass 或 Windows 原生动态材质已经实现的证据。该问题不影响 V0.2.0 已完成的四状态、窗口几何和交互收口，应独立进入后续 feature，禁止回流为当前 PATCH 的继续调参。

## 已知事实

- 当前锁定的 Tauri `2.11.5` 提供 `windowEffects` 配置和 `Acrylic` 效果。
- Tauri 内部通过 `window-vibrancy` 应用 Windows Acrylic；后续应先复用框架内建能力，不能默认新增重复依赖或自写 Win32 FFI。
- 当前 `floating` 窗口未接入 `windowEffects`，当前表面由透明 WebView 和 CSS 组合承担。
- CSS `backdrop-filter` 的静态声明不能证明已采样 Windows 桌面或后方原生窗口。
- Windows Acrylic 是平台候选能力，不等同于 Apple 平台的 Liquid Glass；产品目标应以目标平台可实现且可实机验收的效果表述。

## 必须先回答的问题

1. 盘点 Tauri 内建 API、项目已安装依赖和间接依赖，确认最小复用路径。
2. 明确 ownership：平台材质负责环境采样与平台 tint；CSS 只负责 Web 内容形状、圆角、闭合高光和不可用时的 fallback。
3. 定义能力不可用、应用失败和低版本 Windows 下的降级行为。
4. 评估动态材质在拖动、折叠/展开 resize 和长期置顶时的性能与稳定性。
5. 将产品视觉目标转换为 Windows 可观察的验收条件，不以 Apple 私有实现名称代替验收标准。

## 验证边界

- L1 生产契约只验证配置接线、owner 唯一性和失败降级存在。
- L2 验证类型、构建和 Rust 编译，不把通过结果表述为视觉完成。
- L3 必须在 Windows 11 WebView2 对照折叠/展开、聚焦/未聚焦以及 100% / 125% / 150% DPI。
- L3 同时检查拖动与 resize 性能、黑边/灰边、漏底、顶部白线和材质不再扁平泛灰。

## Done when

- [ ] 独立 PRD、Tech、Design 明确需求、平台边界和 fallback
- [ ] 完成已有能力与依赖盘点，并记录选择依据
- [ ] 生产实现只有一个原生材质接线 owner 和一个 CSS fallback owner
- [ ] L1/L2 回归通过
- [ ] Windows L3 全矩阵通过并留存对照证据

## 明确不做

- 不在 V0.2.0.x 中接入或调试原生动态材质。
- 不因静态 CSS 或单元测试通过宣称 Liquid Glass / Acrylic 已实现。
- 不在依赖盘点前新增材质库或自写平台 bridge。
