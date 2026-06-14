---
title: projects V1.2 敏捷 Sprint 排期（6 个 2 周 Sprint）
source: 基于 agile/ 6 文档综合分析 + task_plan.md P3-P9 重构
fetched: 2026-06-14
tags: [projects, sprint-plan, scrum, xp, v1.2]
status: pending user approval（D28 提议）
---

# projects V1.2 敏捷 Sprint 排期

> **D28 提议**（2026-06-14）：把 task_plan.md 的 P3-P9（6 个瀑布阶段）改造为 **6 个 2 周 Sprint + Week 0 技术 Spike**
> **核心理由**：① D25 承诺 3 个月（≈ 12 周）→ 6 个 Sprint 完美对齐 ② 欢迎需求变更（敏捷原则 #2）→ V1.0 上线后反馈能进 V1.1 ③ 持续可工作软件（敏捷原则 #3）→ 每 Sprint 末有可截图 demo ④ 40h 节奏（XP）→ 避免单人 burnout

---

## 一、敏捷原则在 projects 的落地映射

> 引自 docs/material/agile-agile-manifesto-zh.md（4 价值观 + 12 原则）

| 原则 | projects 落地 |
|---|---|
| #1 客户满意通过早期持续交付 | 每 Sprint 末录 1 分钟 demo，让"用户（你自己/朋友）"能用 |
| #2 欢迎变更 | V1.0 → V1.1 之间的功能增删 = "新信息"，重排 Product Backlog |
| #3 频繁交付 | 每 2 周 1 个 git tag（`v0.1` / `v0.2` / ... / `v1.0`）|
| #4 业务与开发每日协作 | Daily Standup 用 `journal.md`（昨日/今日/障碍）|
| #5 项目围绕有动机个体 | 给自己写"个人 OKR" + 动机自评 |
| #6 面对面沟通 | 卡住时开 10 分钟 voice 跟 Claude 实时对 |
| #7 可工作软件是进度度量 | Sprint 末必有可运行 build（不是 wireframe）|
| #8 可持续开发 | 保护 40h/周 + 20% buffer |
| #9 技术卓越 | 10% Sprint 时间留给重构/补测试 |
| #10 简洁 | V1.0 不上搜索/标签/云同步/分享 |
| #11 自组织团队 | 挑战"默认最复杂实现"，选最简可行方案 |
| #12 定期反思 | Sprint Retrospective → retro.md |

---

## 二、改造前后对比

| 维度 | 旧 P3-P9（瀑布） | **新 6 Sprint（敏捷）** |
|---|---|---|
| **总时长** | 12 周一次规划 | **13 周**（Week 0 spike + 6×2 周 Sprint）|
| **风险可见性** | 后期才暴露 | **每 2 周可见**（Review + Retro）|
| **需求变更** | 难（冻结计划）| **欢迎**（下个 Sprint 重排）|
| **Demo 节奏** | 12 周 1 次（V1.0 末） | **每 2 周 1 次**（共 6 次）|
| **技术债** | 后期集中处理 | **每 Sprint 10% buffer** |
| **反馈循环** | 无（瀑布）| **2 周 1 循环**（Plan → Build → Review → Retro → Adapt）|
| **可发布状态** | 12 周末才可用 | **Sprint 3 末已有"可记录 + 可看" MVP** |
| **工具** | 无明确指定 | **GitHub Issues + Project Board + Actions + TestFlight** |

---

## 三、新排期（13 周）

### 📅 Week 0：技术 Spike（4 天）+ Sprint 0 启动

> **目标**：go/no-go 决策点（混合架构可行性）

| 工作日 | 任务 | 验证 |
|---|---|---|
| Day 1-2 | 初始化最小 Tauri 2 + SwiftUI 嵌入示例 | `cargo tauri dev` 跑通 |
| Day 3 | SwiftUI ↔ Rust ↔ React IPC 走通 | 双工通信 demo |
| Day 4 | 4 个 Liquid Glass modifier 测试 | `glassEffect` / `GlassEffectContainer` / `backgroundExtensionEffect` / `glassEffectID` |
| Day 5 | 写**混合架构可行性报告** | D28 决策：go / no-go / partial |

**Spike 失败 → Fallback**：
- go 部分：用 NSVisualEffectView（90% 还原）替代 SwiftUI 嵌入
- 仍 3 个月内可上线（损失 5% 还原度）

---

### 🚀 Sprint 0 — 脚手架 + 4 个核心组件（第 1-2 周）

> **Sprint Goal**：可跑通的 Tauri 2 项目 + 4 个核心 Liquid Glass 组件 demo
> **Sprint Backlog**：
- [ ] Tauri 2 + React 18 + TS + Vite 项目脚手架
- [ ] SQLite 集成（rusqlite + 迁移）
- [ ] SwiftUI 嵌入子工程模板（macOS 端）
- [ ] **P0** 4 个核心组件：Surface / Modal / Toolbar / Sidebar
- [ ] GitHub Actions CI 配置（build + test + lint）
- [ ] 配 4 个核心 Liquid Glass modifier（参考 docs/material/apple/swiftui/01-key-apis.md）

**Definition of Done**：
- `npm run tauri dev` 启动 demo 窗口
- 4 个组件可单独 import + 预览
- CI 全绿（编译 + 单测 + SwiftLint）
- 录 1 分钟 demo 视频

**Demo 物**：可截图的 demo 窗口（macOS）+ CI 截图

---

### 🎯 Sprint 1 — 锚点 1：高频打卡（第 3-4 周）

> **Sprint Goal**：4 项打卡功能全可用，单项操作 ≤ 3 秒
> **Sprint Backlog**：
- [ ] 情绪/能量打卡（1-10 slider，参考 docs/material/apple/hig/09-sliders.md）
- [ ] 作息打卡（起床/睡眠时间）
- [ ] 饮水打卡（杯数 +1）
- [ ] 服药打卡（药名 + 时间）
- [ ] 数据模型 + 迁移
- [ ] 浮动 + 可拖动 [+] 按钮（D18）

**Definition of Done**：
- 4 项打卡均 ≤ 3 秒
- 浮动按钮可拖动
- 数据持久化到 SQLite
- 关闭重开数据保留

**Demo 物**：录 30 秒 4 项打卡操作 + 数据持久化测试

---

### 💡 Sprint 2 — 锚点 2：灵感捕捉（第 5-6 周）

> **Sprint Goal**：灵感文字记录 + 核心 Todo
> **Sprint Backlog**：
- [ ] 灵感文字记录（极简编辑器）
- [ ] 退出自动保存
- [ ] 核心 Todo：事项 + 截止 + 完成状态
- [ ] 待办一键完成（动画 + 状态切换）
- [ ] 数据模型 + 迁移

**Definition of Done**：
- 灵感输入：Cmd+N 唤起 → 输入 → 关闭 = 自动保存
- Todo 列表按截止日期排序
- 完成态有视觉反馈
- 关闭重开数据保留

**Demo 物**：录 30 秒灵感 + Todo 完整流程

---

### 🌟 Sprint 3 — 锚点 3 + 概览（第 7-8 周）⭐ **V1.0 内部 MVP**

> **Sprint Goal**：习惯/消费/复盘 + 概览页 = V1.0 内部 MVP
> **Sprint Backlog**：
- [ ] 习惯打卡（最多 3 个）
- [ ] 消费速记（金额 + 类别）
- [ ] 每日 3 词复盘
- [ ] 概览页（今日 5 类记录总览）
- [ ] 概览页加载 < 1 秒（PRD V1.2 §6）

**Definition of Done**：
- 5 类核心操作随机抽测 ≤ 3 秒
- 概览页点击后 1 秒内展示
- 概览加载 < 1 秒
- 全程无需思考操作路径

**Demo 物**：**🎉 录 1 分钟完整 V1.0 内部 MVP 流程**（这个 demo 可以发给朋友/潜在用户收反馈）

> ⭐ **这是 V1.0 第一个完整可发布的内部版本** — 反馈循环起点

---

### 🎨 Sprint 4 — Liquid Glass 视觉打磨（第 9-10 周）

> **依赖**：Sprint 3 完成（功能完备）
> **Sprint Goal**：macOS 95% / Windows 80% 视觉还原
> **Sprint Backlog**：
- [ ] SwiftUI 嵌入区上线（sidebar / modal / toolbar / card）
- [ ] 4 个核心效果：
  - [ ] Background Extension（背景延伸）
  - [ ] Scroll Edge（滚动边缘）
  - [ ] Glass Morphing（玻璃形变）
  - [ ] Concentric Corners（同心圆角）
- [ ] Reduce Transparency / Reduce Motion 响应（参考 docs/material/apple/hig/08-accessibility.md）
- [ ] Liquid Glass 配色规则（参考 docs/material/apple/hig/07-color.md）
- [ ] Liquid Glass 按钮规范（参考 docs/material/apple/hig/01-buttons.md）

**Definition of Done**：
- macOS 26 还原 ≥ 95%
- Windows 11 还原 ≥ 80%
- 无障碍 2 项（Reduce Transparency / Reduce Motion）全覆盖
- 配色规则全应用

**Demo 物**：录 1 分钟 macOS 端完整流程 + 1 分钟 Windows 端对比

---

### 🌍 Sprint 5 — 跨平台 + 验收（第 11-12 周）

> **Sprint Goal**：2 端发布准备 + V1.0 上线
> **Sprint Backlog**：
- [ ] macOS 构建配置（NSVisualEffectView + SwiftUI 嵌入 + 代码签名 + 公证）
- [ ] Windows 11/12 构建配置（backdrop-filter + CSS 渐变 + 签名）
- [ ] TestFlight 集成（macOS beta 分发）
- [ ] Fastlane 自动构建（可选，参考 docs/material/agile-cicd-explained.md V1.1 路线）
- [ ] PRD V1.2 §6 全部验收项
- [ ] 性能调优（启动 < 2s / 内存 < 200MB）
- [ ] 错误处理 + 用户友好提示

**Definition of Done**：
- macOS 端 .app 可双击启动
- Windows 端 .msi/.exe 可安装
- PRD V1.2 §6 全部验收项 ✅
- 5 类核心操作 ≤ 3 秒
- 概览页 < 1 秒
- Liquid Glass 还原度达标

**Demo 物**：**🎉 V1.0 正式发布候选** + 上线公告

---

## 四、工具链（单人 Scrum 完整配置）

> 引自 docs/material/agile-scrum-guide.md + docs/material/agile-scrumban.md + docs/material/agile-cicd-explained.md

### 1. Product Backlog 管理

- **GitHub Issues** + 标签 `priority: P0/P1/P2` + `epic: scaffold/打卡/灵感/复盘/视觉/跨平台`
- 每个 Issue 写 User Story 格式（As a / I want / So that）

### 2. Sprint Backlog 管理

- **GitHub Project Board**（Kanban 风格）：
  ```
  📥 Backlog      （WIP = ∞）
  🎯 Selected     （WIP = 3，本 Sprint 选）
  🛠 In Progress  （WIP = 1，单人只做 1 个）
  👀 In Review    （WIP = 1，AI 反馈）
  ✅ Done         （WIP = ∞，按 Sprint 分组）
  📦 Released     （已发布版本）
  ```

### 3. Daily Standup（≤ 5 分钟）

- **journal.md**（项目根目录）：
  ```markdown
  ## 2026-06-14（Week 0 Day 1）
  ✅ 昨日：Tauri 2 init 成功
  🎯 今日：SwiftUI 嵌入子工程模板
  🚧 障碍：WKWebView 黑屏，待排查
  ```

### 4. Sprint Planning（周一 09:00，≤ 1 小时）

- 从 Product Backlog 选 ≤ 5 个 P0 Issue 进 Sprint Backlog
- 输出到 `sprint_NN_plan.md`

### 5. Sprint Review（隔周周五 16:00，≤ 1 小时）

- 录 1 分钟 demo 视频
- 写 `sprint_NN_review.md`（完成了什么 / 演示给谁 / 收到什么反馈）

### 6. Sprint Retrospective（隔周周五 17:00，≤ 30 分钟）

- 写 `sprint_NN_retro.md`（什么做得好 / 什么做得差 / 下 Sprint 改什么）
- **3 个问题**：
  1. What went well?（保留）
  2. What didn't go well?（改进）
  3. What will I change next sprint?（承诺 1-2 个具体改动）

### 7. CI/CD（GitHub Actions）

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: xcodebuild -scheme MindTap -destination 'platform=iOS Simulator' build
      - name: Test
        run: xcodebuild test -scheme MindTap -destination 'platform=iOS Simulator'
      - name: Lint
        run: swiftlint lint --strict
      - name: Type Check
        run: npm run typecheck
```

### 8. 燃尽图

- 简单 Markdown 表格（每日更新剩余 SP）：
  ```markdown
  | Day | 剩余 SP |
  |---|---|
  | Day 1 | 30 |
  | Day 2 | 28 |
  | Day 3 | 24 |
  ...
  ```

---

## 五、节奏（每周模板）

> 保护 40h/周 + 20% buffer + 10% 重构/学习

| 星期 | 时间 | 活动 |
|---|---|---|
| **周一** | 09:00-10:00 | **Sprint Planning**（每 2 周一次，间隔周做 Backlog Refinement）|
| | 10:00-12:00 | 深度工作（无 Slack/邮件/会议）|
| | 14:00-17:00 | 深度工作 |
| **周二-周四** | 09:00-12:00 | 深度工作 |
| | 14:00-17:00 | 深度工作 |
| | 17:00-17:05 | **Daily Standup**（写 journal.md）|
| **周五** | 09:00-12:00 | 深度工作 |
| | 14:00-16:00 | 深度工作 / Buffer（修 bug / 补测试）|
| | 16:00-17:00 | **Sprint Review**（每 2 周一次，间隔周做 Code Review）|
| | 17:00-17:30 | **Sprint Retrospective**（每 2 周一次）|

> **关键**：每天 ≤ 6h 深度工作 + 1h 杂事 = 40h 节奏
> **Buffer**：每周五 14-16 点 = 修 bug / 补测试 / 学新东西
> **不要**周末加班（XP 40 小时工作制）

---

## 六、风险与应对

| 风险 | 概率 | 应对 |
|---|---|---|
| Week 0 Spike 失败 | 30% | Fallback 到 NSVisualEffectView（90% 还原），Sprint 4 重新规划 |
| Sprint 3 估时偏低 | 40% | 砍 P2 任务（消费速记/每日 3 词可推到 V1.1） |
| Liquid Glass 还原不达标 | 30% | Sprint 4 拉长 1 周，从 Sprint 5 借 1 周 |
| 单人 burnout | 50% | 严格 40h 节奏 + 周末不加班 + 必要时 Sprint 5 砍 Windows 端 |
| 需求大改 | 30% | 欢迎变更（敏捷原则 #2）→ 进 Product Backlog 重排 |

---

## 七、V1.0 → V1.1 反馈循环（Sprint 5 末启动）

> **关键洞察**：V1.0 上线**不是结束**，是**反馈循环起点**

1. **Sprint 5 末**：V1.0 发布
2. **V1.1 Sprint 0**（Week 13）：收集首批用户反馈（朋友/家人 5-10 人）
3. **V1.1 Sprint 1-3**（Week 14-19）：基于反馈排优先级
4. **V1.1 Sprint 4-5**（Week 20-23）：发布 V1.1

> 引自 docs/material/agile-agile-values-12-principles-explained.md 的"应用检查清单"，每 Sprint 末自评 12 项

---

## 八、决策请求（D28）

> **建议 D28 决策**（替换或叠加 D25）：
> 1. **采用本敏捷 Sprint 排期**（推荐）→ 把 task_plan.md 的 P3-P9 标记为"v1 瀑布版（已废弃）"，改用本文件为基线
> 2. **保留 P3-P9 作 phase 命名，新 Sprint 挂在 P 编号下**（保守）→ P10 = Sprint 0，P11 = Sprint 1 ...
> 3. **暂不改造**（不推荐）→ 维持瀑布，承担 3 个月内无 demo 的风险

**推荐选项 1**（更彻底地拥抱敏捷）

---

## 九、文件交叉引用

- 4 价值观 + 12 原则：[01-agile-manifesto-zh.md](./01-agile-manifesto-zh.md)
- 12 原则详解（带 12 条检查清单）：[02-agile-values-12-principles-explained.md](./02-agile-values-12-principles-explained.md)
- XP 12 实践（TDD / CI / 简单设计）：[03-xp-12-practices.md](./03-xp-12-practices.md)
- Scrum 完整指南（角色/事件/工件）：[04-scrum-guide.md](./04-scrum-guide.md)
- Scrumban 混合方法（看板 + WIP 限制）：[05-scrumban.md](./05-scrumban.md)
- CI/CD 完整解释（GitHub Actions + TestFlight）：[06-cicd-explained.md](./06-cicd-explained.md)
