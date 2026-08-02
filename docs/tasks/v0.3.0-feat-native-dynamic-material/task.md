# feat(floating): V0.3.0 平台原生动态材质

> 创建: 2026-08-02
> 版本: V0.3.0
> 优先级: P1
> 归属判定: 见 `docs/tech/v0.3.0-native-dynamic-material-tech.md` §6
> 关联 ADR: `docs/domain/adr/0010-v0.3.0-native-dynamic-material.md`
> 前置: V0.2.0 浮动窗四状态与交互基线

## Why

浮窗的 CSS fallback 不能证明 Windows 桌面环境层次已被正确采样；必须在不破坏 V0.2.0 窗口与交互基线的前提下，以单候选和 Windows 实机证据确定生产方案。这是独立的大完整需求，归 V0.3.0（避免随零散小需求频繁改版本号）。

## What

仅为 `floating` 验证平台动态材质与固定 CSS fallback，不扩展任务复用、窗口几何或既有交互。

### 候选验证顺序
1. Tauri `2.11.5` 内建 Acrylic；
2. 未通过候选淘汰门槛后，Tauri 内建 Mica；
3. 两者均未通过，或一个 React 候选在同一 Windows L3 矩阵有明确更优证据时，才评估该 React 候选。

每一候选只进行一轮接线和一轮完整 L3；淘汰时先恢复 CSS fallback 并复验基础行为，再进入下一候选。禁止并存多个可生效候选或在同一次运行中动态竞选。

### 已完成的基线（V0.2.1 阶段，保留）
- Windows 100% DPI 四状态、几何、拖动、resize、焦点、原生菜单、计时与持久化通过；
- 旧 fallback 的闭合内高光形成四周白线 → 已移除根表面实体白色内轮廓；
- 28% 根表面过透 → 已改局部 80% fallback 密度 + 输入提示提升到次级文字色；
- 共享 G3 token 不变。

### 未实现（V0.3.0 本期做）
- [ ] 盘点 Tauri 内建 API、已装依赖与间接依赖，确认最小复用路径
- [ ] Acrylic 候选接线 + 完整 Windows L3 矩阵
- [ ] 未通过则 Mica 候选接线 + 完整矩阵
- [ ] React 候选仅在两原生候选均未通过或有更优证据时评估
- [ ] 125% / 150% DPI 全矩阵 + 浅色/深色/高对比/纹理背景
- [ ] 最终生产方案与 CSS fallback 的截图/录屏证据索引

## Done when

- [ ] 一个生产方案和 CSS fallback 均通过约定的 L1/L2/L3 验收
- [ ] 单一材质 owner、单次运行固定选择与 V0.2.0 回归基线得到证据确认
- [ ] Acrylic / Mica / React 候选有同矩阵验证结果
- [ ] 125% / 150% DPI 全矩阵通过；浅色/深色/高对比/纹理背景通过
- [ ] 淘汰候选有对应失败步骤和证据
- [ ] 最终生产方案与 CSS fallback 的截图/录屏索引完整 + 环境信息
- [ ] L1 生产契约：效果接线只作用 `floating`、owner 唯一、fallback 路径存在
- [ ] L2 工程回归：vitest / tsc / build / cargo check 全 PASS
- [ ] L3 Windows 11 WebView2 hard gate 全 PASS
- [ ] 沉淀:task.md 跟业务代码同 commit;写一行到对应 retro

## 明确不做

- 不修改主窗口、其他弹窗或全局视觉风格
- 不修改浮窗四状态、尺寸、拖动、右键菜单、不抢焦或计时持久化行为
- 不提供用户可见的材质开关、持久化选择或运行中手动切换
- 不将 Apple 平台名称或任一具体技术名作为验收结果
- 不在未完成比较与实机验证前引入新的替代视觉方案

## 关联

- PRD: `docs/prd/v0.3.0-native-dynamic-material-prd.md`
- Domain ADR: `docs/domain/adr/0010-v0.3.0-native-dynamic-material.md`
- Tech: `docs/tech/v0.3.0-native-dynamic-material-tech.md`
- Design: `docs/design/v0.3.0-native-dynamic-material-design.md`
- L3 证据: `docs/tasks/v0.3.0-chore-material-l3-evidence/task.md`
