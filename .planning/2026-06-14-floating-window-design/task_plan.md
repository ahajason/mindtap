# Task Plan: Mindtap 浮动窗口快速记录设计
<!--
  WHAT: 持久化 Mindtap v1.3 浮动窗口快速记录功能的头脑风暴成果
  WHY: 避免上下文丢失、保持 13 轮迭代结论的可追溯性
  WHEN: 2026-06-14 创建立即记录，节 1 UI 已锁定，节 2-5 待呈现
-->

## Goal
通过 Tauri 2 多窗口架构（Mac + Windows）实现"3 秒记录 / 1 秒查看 / 0 思考成本"的常驻浮动窗口，作为 Mindtap v1.3 核心交互载体；并扩展 4 状态 TODO 状态机（未开始/进行中/暂停/完成）。

## Current Phase
Phase 5 — 分节呈现设计中（节 1 UI 已锁定 v13 方案 A，节 2-5 待呈现）

## Phases

### Phase 1: 需求澄清 & 战略定位
- [x] 理解核心痛点（多维度记录繁琐，灵感流失）
- [x] 识别目标用户（ENFP 创意型，易分心）
- [x] 确认 3 个设计铁律（3 秒/1 秒/0 思考）
- [x] 确认 4 个基础特性（无登录、本地存储、重记录轻查看、无冗余）
- [x] 发现 TODO 状态机缺失（V1.2 只有完成/未开始）
- [x] 确认跨平台（Mac + Windows 浮动窗）
- **Status:** complete

### Phase 2: 视觉探索 (mockup v1-v5)
- [x] v1：3 种窗体形态（药丸/极简卡/灵动岛）
- [x] v2：修正卡高
- [x] v3：A/B/C 含展开态
- [x] v4：5 种轻透明变体（被否定：图标外框累赘）
- [x] v5：3 种紧凑单行药丸
- **Status:** complete

### Phase 3: 逻辑探索 (mockup v6-v7)
- [x] v6：保存 = 开始计时（合并动作）
- [x] v7：Focus 标签 + 呼吸灯
- [x] 关键决策：进行中的任务 ≠ TODO，必须改称 Focus
- **Status:** complete

### Phase 4: 状态机 + 折叠态锁定 (mockup v8-v10)
- [x] v8：4 种展开布局
- [x] v9：整合 4 个产品洞察（含切换语义）
- [x] v10：修正暂停颜色（浅蓝非亮蓝）+ 恢复绿色暂停图标
- [x] **折叠态定稿**：320×36px，flex 弹性，右侧时间 + 暂停
- **Status:** complete

### Phase 5: 上下分栏 + 顶部下拉 (mockup v11-v13)
- [x] v11：上下分栏 + 下栏 Tab
- [x] v12：下栏 2 Tab vs 右栏 2 Tab 对比
- [x] v13：去掉 Tab，改用文字按钮 + 顶部靠右下拉 ⇄▼
- [x] **方案 A 定稿**：360×280，上下分栏，文字按钮，⇄▼ 顶靠右下拉
- **Status:** in_progress
- [ ] 呈现节 2：数据模型（4 状态机）
- [ ] 呈现节 3：架构（Tauri 2 多窗口）
- [ ] 呈现节 4：核心交互流程
- [ ] 呈现节 5：视觉/动画规范

### Phase 6: 设计文档
- [ ] 写 `docs/superpowers/specs/2026-06-14-浮动窗口快速记录-design.md`
- [ ] 自审（占位/矛盾/范围/模糊）
- [ ] 用户审阅文档
- **Status:** pending

### Phase 7: 转到 writing-plans
- [ ] 调用 writing-plans 技能
- **Status:** pending

## Key Decisions (不可逆决策)

| # | 决策 | 原因 | 锁定版本 |
|---|------|------|----------|
| D1 | 浮动窗口为 V1.3 核心 | PC 端不应"像后台 app" | 战略 |
| D2 | TODO 4 状态机：未开始/进行中/暂停/完成 | V1.2 2 状态不足以支持计时 | v6-v7 |
| D3 | 进行中任务改称 **Focus**（视觉用绿色标签） | 进行中 ≠ 待办 | v7 |
| D4 | "保存"按钮语义 = "开始计时"（合并） | 0 思考成本 | v6 |
| D5 | 折叠态 320×36，时间 + 暂停靠右 | 用户确认 | v8 修正 |
| D6 | 暂停图标绿色 ⏸ / 暂停文字按钮浅蓝底 | 颜色权重：蓝>绿 | v10 |
| D7 | 完成按钮淡绿底（视觉上比暂停轻） | 暂停能继续 > 完成消失 | v10 |
| D8 | 上下分栏结构（无 Tab） | 用户最新要求 | v13 |
| D9 | 切换/清单用顶靠右下拉 ⇄▼ | 用户最新要求 | v13 |
| D10 | 截止按钮：📅 稍后 + 📅 明天（次要灰底） | 快捷但不抢 CTA | v13 |
| D11 | 方案 A：360×280，textarea 中等，下拉在主窗内 | 用户选定 | v13 |

## Architectural Pillars

1. **多窗口架构**：Tauri 2 同时管理主窗（设置/统计）+ 浮动窗（计时/记录）
2. **跨平台浮动窗**：Mac `alwaysOnTop: true, transparent: true, decorations: false`；Windows 同上（需 Tauri 2 windows 实现）
3. **Liquid Glass**：rgba(255,255,255,0.32-0.42) + blur(30-32px) + saturate(180-200%) + 1px 白色内边框
4. **本地存储**：SQLite（与 V1.2 共享），单表 record + JSON 扩展字段

## Mockup 文件索引

| 路径 | 用途 |
|------|------|
| `floating-form-factor.html` | v1 探索（药丸/卡/灵动岛） |
| `floating-form-factor-v2.html` | v2 修正卡高 |
| `floating-form-factor-v3.html` | v3 A/B/C |
| `floating-form-factor-v4.html` | v4 5 轻透明变体（已弃） |
| `floating-form-factor-v5.html` | v5 3 紧凑单行 |
| `floating-logic-v6.html` | v6 保存=计时 |
| `floating-focus-v7.html` | v7 Focus 标签 |
| `floating-expand-v8.html` | v8 4 展开布局 |
| `floating-switch-v9.html` | v9 整合 4 洞察 |
| `floating-revised-v10.html` | v10 修正暂停色 |
| `floating-tabbar-v11.html` | v11 上下分栏 + Tab |
| `floating-lr-vs-tb-v12.html` | v12 左右 vs 上下 |
| `floating-dropdown-v13.html` | **v13 定稿**（A/B/C） |

所有文件位于 `.superpowers/brainstorm/150600-1781431421/content/`
