# chore(floating): 完成 V0.2.1 多 DPI 与最终证据矩阵

> 状态：pending（延后到 100% CSS fallback 复验通过后）
> 版本：V0.2.1
> 优先级：P1
> 归属判定：`docs/tech/v0.2.1-native-dynamic-material-tech.md` §6
> 阻塞关系：不阻塞当前 100% fallback 修复；阻塞原生候选完整 L3 与 V0.2.1 发布

## Why

首轮 Windows 基线只覆盖 100% DPI，125% / 150% 尚未执行，且用户明确本轮不提供截图。当前文字反馈足以判定旧 CSS fallback 在四周白线和复杂背景可读性上失败，但不足以作为最终候选选择和发布证据。

## What

在 100% CSS fallback 修复复验通过后执行：

1. CSS fallback 的 125% / 150% 四状态、边缘、位置、拖动与可读性；
2. Acrylic、必要时 Mica 的同一完整矩阵；
3. 浅色、深色、高对比或纹理背景；
4. 聚焦与非聚焦；
5. 最终方案与 fallback 的截图/录屏索引及环境信息。

## Done when

- [ ] CSS fallback 在 100% / 125% / 150% 下基础可用且边缘稳定；
- [ ] 实际评估的每个原生候选都有同矩阵结果；
- [ ] 四状态、拖动、resize、原生菜单、不抢焦和重启恢复均有结论；
- [ ] 淘汰候选有对应失败步骤和证据；
- [ ] 最终生产方案与 CSS fallback 的截图/录屏索引完整；
- [ ] L5 验收报告记录 Windows、WebView2、DPI、背景和 commit；
- [ ] 未完成本清单前不更新 V0.2.1 release notes 为已完成。

## 当前状态

- 100%：旧 fallback 已完成人工基线；交互与几何通过，四周白线和复杂背景可读性失败，修复待复验；
- 125%：NOT TESTED；
- 150%：NOT TESTED；
- 截图/录屏：NOT PROVIDED；
- Acrylic / Mica：NOT STARTED。
