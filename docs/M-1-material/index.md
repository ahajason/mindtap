# Material — 平台原生动态材质（V0.3.0）

> 大需求唯一入口。平台原生动态材质的完整需求链：需求 + 决策 + 设计契约。

## 目录内文档

| 文档 | 职责 |
|---|---|
| [prd.md](prd.md) | 需求：浮窗获得可感知后方环境层次的动态材质，保持可读 / 边缘稳定 / 交互正确 |
| [domain.md](domain.md) | 决策（ADR-0010）：候选验证顺序（Acrylic→Mica→React）、单次运行固定选择、基础表面降级 |
| [design.md](design.md) | 设计契约：视觉目标 / 材质层次 / 运行期行为 / 淘汰信号 / L3 视觉矩阵 |

## 关联

- 产品真值：`../轻念Mindtap产品需求文档.md`（材质是独立视觉能力）
- 玻璃规范：`../design-system/glassic-ui-spec.md`
- 进行中任务：`tasks/feat-native-dynamic-material/` + `tasks/chore-material-l3-evidence/`
