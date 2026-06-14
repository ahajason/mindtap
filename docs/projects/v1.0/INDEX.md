---
title: projects V1.0 项目资料
fetched: 2026-06-14
tags: [index, projects, v1.0]
---

# projects V1.0 项目资料（`docs/projects/v1.0/`）

> **当前状态**：✅ Active（D25 = 3 个月内上线）
> **V1.0 范围**：macOS 26+ + Windows 11/12（PC 端优先）
> **设计语言**：Apple Liquid Glass
> **Sprint 节奏**：6 个 2 周 Sprint + Week 0 技术 Spike（详见 [agile-sprint-plan.md](agile-sprint-plan.md)）

---

## 一、核心文档（3 个）

| 文件 | 用途 | 状态 |
|---|---|---|
| [prd-v1.2.md](prd-v1.2.md) | **产品需求文档 V1.2** — 290 行基线，V1.0 上线的"宪法" | ✅ Final |
| [agile-sprint-plan.md](agile-sprint-plan.md) | **敏捷 Sprint 排期** — 6 个 2 周 Sprint + Week 0 Spike | ⏳ Pending D28 |
| [INDEX.md](INDEX.md) | 本文件 — V1.0 项目资料索引 | ✅ Final |

---

## 二、specs/ — 深度规格文档（5 个）

> 探索性 / 决策性 spec 文档。specs 不是代码规范，是"问题 + 多视角分析 + 决策建议"。

| 文件 | 主题 | 关键产出 |
|---|---|---|
| [2026-06-14-liquid-glass-final-overview.md](specs/2026-06-14-liquid-glass-final-overview.md) | Liquid Glass 8 维度最终总览 | 8 维度材料/动效/组件全图 |
| [2026-06-14-liquid-glass-8-perspective-validation.md](specs/2026-06-14-liquid-glass-8-perspective-validation.md) | Liquid Glass 8 视角验证 | 8 视角交叉验证 |
| [2026-06-14-glass-2x2-matrix.md](specs/2026-06-14-glass-2x2-matrix.md) | Glass 2×2 矩阵决策 | Mac/Win × 原生/模拟 的 4 组合选择 |
| [2026-06-14-goal-view-audit.md](specs/2026-06-14-goal-view-audit.md) | 目标/视图审计 | "极简"目标的实现路径审计 |
| [2026-06-14-v1-implementation-roadmap.md](specs/2026-06-14-v1-implementation-roadmap.md) | V1.0 实施路线图（瀑布版，已被 Sprint 排期替代）| 12 周瀑布排期（旧版）|

> **D28 影响**：`v1-implementation-roadmap.md` 是瀑布版，被 `agile-sprint-plan.md` 替代，保留作为"决策审计日志"。

---

## 三、与其他文件的关系

```
docs/projects/v1.0/                ← V1.0 项目沙盒
├── prd-v1.2.md                  ← 产品宪法
├── agile-sprint-plan.md         ← 开发排期（敏捷版，待批准）
├── specs/                       ← 探索性分析（决策审计）
│
docs/material/                        ← 跨项目通用知识
├── agile/                       → 方法论（排期背后的原则）
└── apple/                       → Apple 设计/API 参考
    ├── liquid-glass/
    ├── swiftui/ + landmarks/
    ├── hig/
    └── wwdc/
```

---

## 四、Sprint 排期速查（6 Sprint）

> 详见 [agile-sprint-plan.md](agile-sprint-plan.md)

| Sprint | 周 | Sprint Goal | 关键交付 | 状态 |
|---|---|---|---|---|
| Week 0 | 第 0 周 | 技术 Spike | go/no-go 决策（4 天）| ⏳ |
| Sprint 0 | 第 1-2 周 | 脚手架 + 4 核心组件 | Tauri 2 + 4 Glass 组件 + CI | ⏳ |
| Sprint 1 | 第 3-4 周 | 锚点 1（高频打卡）| 情绪/作息/饮水/服药 4 项 | ⏳ |
| Sprint 2 | 第 5-6 周 | 锚点 2（灵感捕捉）| 灵感文字 + 核心 Todo | ⏳ |
| Sprint 3 | 第 7-8 周 | 锚点 3 + 概览 | 习惯/消费/复盘 + 概览页 ⭐ 内部 MVP | ⏳ |
| Sprint 4 | 第 9-10 周 | Liquid Glass 视觉打磨 | Mac 95% / Win 80% 还原 | ⏳ |
| Sprint 5 | 第 11-12 周 | 跨平台 + 验收 | V1.0 正式发布 | ⏳ |

---

## 五、关键决策（D1-D28）

> 完整决策链见顶层 `task_plan.md`

| # | 决策 | 状态 |
|---|---|---|
| D6 | 技术栈：Tauri 2 + React 18 + TS + Vite + Zustand + SQLite | ✅ |
| D14 | 项目名：Mindtap · 轻念 | ✅ |
| D21 | V1.0 平台：Mac + Windows（PC 端优先）| ✅ |
| D22 | V2.0 平台：iOS + Android（移动端）| ✅ |
| D23 | 数据策略：全本地 SQLite，无导出/无导入/无同步 | ✅ |
| D24 | Mac 端 Liquid Glass：SwiftUI 嵌入（混合架构）| ✅ |
| D25 | V1.0 上线时间：3 个月内（激进）| ✅ |
| D26 | iOS 端技术：SwiftUI（V2.0 复用 V1.0 SwiftUI 视图）| ✅ |
| D27 | Android 端技术：V2.0 决策 | ⏳ |
| **D28** | **敏捷 Sprint 排期：6 个 2 周 Sprint** | **⏳ Pending** |

---

## 六、关键沉淀物交叉引用

| 类别 | 位置 |
|---|---|
| **产品宪法** | `docs/projects/v1.0/prd-v1.2.md` |
| **敏捷排期** | `docs/projects/v1.0/agile-sprint-plan.md` |
| **工作记忆磁盘化** | `task_plan.md`（项目根） |
| **每日进度跟踪** | `progress.md`（项目根） |
| **设计参考（基础）** | `docs/material/apple/liquid-glass/` `docs/material/apple/hig/` `docs/material/apple/swiftui/` |
| **方法论参考（基础）** | `docs/material/agile/` |
| **Liquid Glass Web 原型** | `prototype/index.html`（项目根） |

---

## 维护说明

- **更新日期**：2026-06-14（随 Sprint 推进持续更新）
- **Sprint 进行中**：D28 状态变更时同步更新本 INDEX
- **新文档添加规则**：
  - V1.0 期间新 spec → `docs/projects/v1.0/specs/YYYY-MM-DD-{topic}.md`
  - V1.0 完成后启动 V1.1 → 建 `docs/projects/v1.1/`
