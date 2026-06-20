# Findings & Decisions

> projects 项目的知识沉淀。所有需求、研究发现、技术决策、问题均在此积累。
> 
> **当前基线：V1.0（闪念 / FlashMind，2026-06-14 晚 brainstorm 锁定）**  
> **上游基线：V1.2（Mindtap · 轻念）**——保留为决策审计日志

---

## 🚀 V1.0 补全需求（2026-06-14 晚 brainstorm 锁定）

> **触发**：用户提出"补全需求# 闪念（推荐英文名：FlashMind）完整功能需求总结"，并明确"v1.0版本仅保留闪念和点念有交集、最核心、而且最通用的功能"。
> 
> **闪念 × 点念 交集过滤后，V1.0 = 3 模块 + 纯 Web 简化架构**

### V1.0 三大核心模块

| 模块 | 来源（闪念 / 点念）| 核心交互 | 3 秒铁律验证 |
|---|---|---|---|
| **灵感速记** | 闪念 #1 + 点念 #4 灵感捕捉 | 浮窗单行 textarea → Enter 保存 | ✅ 1 步 |
| **TODO（待办项）** | 闪念 #4 学习项目（**简化**）+ 点念 #4 核心 Todo | 浮窗输入名称 → Enter；主窗点击勾选 | ✅ 1 步 |
| **每日复盘** | 闪念 #8 + 点念 #6 每日 3 词 | 浮窗 3 关键词输入框（1-3 词均可） → Enter | ✅ 1 步 |

### V1.0 数据模型（3 payload schemas + is_hidden 软状态）

```sql
CREATE TABLE records (
  id          TEXT PRIMARY KEY,          -- UUID v4
  module      TEXT NOT NULL,             -- 'inspiration' | 'todo' | 'review'
  payload     TEXT NOT NULL,             -- JSON 字符串
  created_at  INTEGER NOT NULL,          -- Unix ms，自动生成
  updated_at  INTEGER NOT NULL,          -- Unix ms，每次更新刷新
  is_hidden   INTEGER NOT NULL DEFAULT 0 -- 长按隐藏（软状态，可恢复）
);

CREATE INDEX idx_records_created ON records(created_at DESC);
CREATE INDEX idx_records_module  ON records(module, created_at DESC);
```

**3 种 payload schema：**

```typescript
// 1) 灵感速记
interface InspirationPayload { text: string; }

// 2) TODO（待办项，无截止日期）
interface TodoPayload {
  name: string;
  done: boolean;
  done_at: number | null;
}

// 3) 每日复盘（1-3 关键词）
interface ReviewPayload {
  keywords: [string?, string?, string?];
}
```

### V1.0 UX 关键决策（D30 / D33-D41）

| 决策 | 取值 | 理由 |
|---|---|---|
| 入口模式 | **最小浮动面板（200×80）+ 主窗口（1280×800+）** | 浮动 = 随时记录；主窗 = 完整查看 |
| 浮窗 tab 切换 | **点击 + 快捷键**（Cmd+1/2/3 Mac, Ctrl+1/2/3 Win）| 冗余设计，不同场景最优 |
| 浮窗角标 | **显示"未完成 TODO 数量"** | 嵌入"被动查看"到"主动记录" |
| TODO 字段 | **name + done + done_at**（无截止日期）| 截止日期增加思考成本 |
| TODO 已完成 | **默认折叠**，显示"已完成 N 条 ▼" | 减少视觉噪音 |
| 长按条目 | **隐藏（is_hidden=1）**，非删除 | 软状态可恢复 |
| 隐藏恢复入口 | **仅设置面板**（无快速入口）| 用户决策"不需要更快的入口" |
| 复盘频次 | **允许一天多次** | 支持多角度总结 |
| 复盘关键词 | **1-3 个均可** | 不强制 3 个 |

### V1.2 → V1.0 变化清单（**重大范围重定**）

| 维度 | V1.2 (Mindtap · 轻念) | V1.0 (闪念 / FlashMind) | 变化原因 |
|---|---|---|---|
| **项目命名** | Mindtap · 轻念 | **闪念 / FlashMind** | 新一代产品命名 |
| **产品定位** | V1.2 7 大功能域（基础存储 / 全局入口 / 高频打卡 / 灵感捕捉&核心 Todo / 轻量追踪 / 查看与复盘 / 简易设置）| **3 模块**（灵感 / TODO / 复盘）| 用户"闪念×点念交集"过滤 |
| **平台** | Mac + Windows | Mac + Windows（沿用）| 无变化 |
| **架构** | Tauri 2 + React + TS + SQLite + **SwiftUI 嵌入混合** | **Tauri 2 + React + TS + SQLite（纯 Web）** | 3 模块 + 3 个月 → SwiftUI 复杂度不划算；V1.4 再加 |
| **入口** | 全局浮动可拖动按钮 | **最小浮动面板 + 主窗口** | 兼顾随时记录 + 完整查看 |
| **模块数** | 7 大功能域 | **3 模块** | 闪念×点念交集 |
| **学习项目** | V1.2 核心待办 | **V1.4+ 延后** | 5 档进度交互与 3 秒铁律张力大 |
| **语音** | V1.2 暂不做 | **V1.0 仍不做，V1.4+** | 沿用 V1.2 决策 |
| **数据** | 全本地，无导出/导入/同步 | 全本地，无导出/导入/同步（**新增 is_hidden 软状态**）| 沿用 + 软隐藏 |
| **OCR + 日历** | 不在 V1.2 | **V1.4+**（依赖物品管理）| 物品管理不在 V1.0 |
| **人脉 / 手账 / 物品 / 身体运动 / 收支** | 分散在 V1.2 7 域中 | **V1.4+ 全部延后** | 非交集核心 |
| **3 个月时间表** | 沿用 V1.2 激进排期 | **沿用** | 3 模块 + 纯 Web 3 个月可达 |

### V1.0 决策幂等性矩阵

| 决策类型 | V1.0 决策 |
|---|---|
| **沿用 V1.2**（无变化）| D3 / D5 / D6 / D9 / D11 / D12 / D14 / D16 / D17 / D21 / D22 / D23 / D25 |
| **覆盖 V1.2** | D31（移除 SwiftUI 嵌入）/ D37（学习项目延后）|
| **新增 V1.0** | D29（3 模块）/ D30（双窗口入口）/ D32（语音再延后）/ D33（TODO 字段）/ D34（折叠已完成）/ D35（长按隐藏）/ D36（is_hidden 软状态）/ D38（tab 切换冗余）/ D39（浮窗角标）/ D40（复盘频次）/ D41（隐藏恢复入口）|

### V1.0 → V1.4+ 路线图（候选清单）

| 优先级 | 模块 / 能力 | 触发条件 | 备注 |
|---|---|---|---|
| 🔴 高 | **学习项目**（5 档进度）| V1.0 上线后 | 用户决策"后续再考虑" |
| 🟡 中 | **语音转文字** | V1.0 上线后 | 全模块；Mac/Win 离线方案 |
| 🟡 中 | **SwiftUI 嵌入**（Mac 95% 还原）| V1.4 启动 | 重做 Mac 端 Liquid Glass |
| 🟢 低 | **OCR + 日历同步**（依赖物品管理）| V1.5+ | 跨系统日历 |
| 🟢 低 | **人脉维护** / **手账日记** / **物品管理** / **身体运动** / **收支速记** | V1.5+ | 闪念独家模块，按需回归 |
| 🟢 低 | **首页按钮自定义**（拖拽/隐藏）| V1.5+ | 8 模块后才有意义 |
| 🟢 低 | **极简数据汇总**（收支月度 / 运动总时长）| V1.5+ | V1.0 严格无图表 |
| 🟢 低 | **本地加密备份** | V1.5+ | 与"无导出"边界需要再评估 |
| 🟢 低 | **轻量提醒**（人脉/学习）| V1.5+ | 需本地通知权限 |
| 🟢 低 | **iOS + Android 移动端** | V2.0 | 沿用 V1.2 D22 / D26 / D27 决策 |

---

## 闪念原始需求摘要（V1.0 brainstorm 输入存档）

> **目的**：完整记录用户 2026-06-14 提供的"补全需求# 闪念完整功能需求总结"，作为后续 V1.4+ 设计的参考。  
> **标注规则**：✅ V1.0 已采纳 / ⏳ V1.4+ 候选 / ❌ V1.0 决策放弃

### 一、MVP 第一阶段：8 个核心记录模块（原始提案）

| # | 模块 | V1.0 状态 | 原始规格要点 | 备注 |
|---|---|---|---|---|
| 1 | **灵感速记** | ✅ V1.0 已纳入 | 单输入框、文字/语音转文字、点击确认即保存、自动时间戳、无排版/分类/字数限制 | 整合"创意 + 梦境" |
| 2 | **收支速记** | ⏳ V1.4+ 候选 | 金额输入框（数字键盘）+ 必要/非必要 2 分类按钮、点击分类自动保存、无备注字段 | 3 秒铁律可达 |
| 3 | **身体运动** | ⏳ V1.4+ 候选 | 体重记录（kg 默认）+ 4 类运动标签（跑步/健身/散步/其他）+ 4 档时长按钮（10/20/30/60 分钟）、一键组合 | 无消耗计算/统计 |
| 4 | **学习项目** | ⏳ V1.4+ 候选 | 名称输入框 + 5 档进度条（0/25/50/75/100%）、滑动自动保存、无任务分解/截止时间 | 5 档交互略复杂；V1.0 用简化版 TODO 替代 |
| 5 | **人脉维护** | ⏳ V1.4+ 候选 | 联系人名称 + 上次联系时间（默认当前日期）+ 认识场景预设 4 标签（工作会议/朋友聚会/行业活动/线上交流）+ 语音/图片/3 个高频联系人 | 字段多、V1.0 不做 |
| 6 | **手账日记** | ⏳ V1.4+ 候选 | 文字/语音转文字、点击保存、自动时间、无排版/配图编辑 | 与"灵感"重叠度高 |
| 7 | **物品管理** | ⏳ V1.4+ 候选 | 物品名称 + 存放位置（双输入框）、点击空白处自动保存、无分类/搜索 | V1.0 不做 |
| 8 | **每日复盘** | ✅ V1.0 已纳入 | 固定 3 个关键词输入框（强制 ≤3）、提交后自动关联当日记录、无复盘分析/长文 | 与点念"复盘 3 词"对应 |

**第一阶段其他原始要求**：

- ❌ **启动直达全屏、无过渡页/引导/广告** — V1.0 决策 D30 改为"最小浮动 + 主窗口"（折中）
- ⏳ **首页固定 8 核心按钮** — V1.0 仅 3 模块，3 个 tab；8 按钮布局延后
- ⏳ **通用语音转文字工具** — V1.0 不做（沿用 V1.2 D32）
- ✅ **本地 SQLite 数据存储** — V1.0 沿用
- ✅ **自动时间戳生成** — V1.0 沿用
- ⏳ **基础设置：长按首页按钮改名称** — V1.0 不做（V1.0 无首页按钮重命名需求）

### 二、MVP 第二阶段：4 大类共 11 项优化（原始提案）

#### （一）记录效率提升

| # | 特性 | V1.0 状态 | 原始规格 | 备注 |
|---|---|---|---|---|
| P2-1 | **自定义预设模板** | ⏳ V1.4+ | 收支 3 个常用金额快捷按钮；运动自定义标签；人脉扩充高频联系人 | 收支 3 秒交互需要快捷化 |
| P2-2 | **记录关联** | ⏳ V1.4+ | 手账日记一键关联当日任意 1 条其他记录 | 减少复制粘贴 |
| P2-3 | **输入偏好设置** | ⏳ V1.4+ | 灵感/手账默认唤起语音或文字 | V1.0 仍纯文字 |

#### （二）个性化适配

| # | 特性 | V1.0 状态 | 原始规格 | 备注 |
|---|---|---|---|---|
| P2-4 | **首页按钮自定义** | ⏳ V1.4+ | 拖拽调整顺序、隐藏不常用按钮 | 8 模块后才有意义 |
| P2-5 | **规则微调** | ⏳ V1.4+ | 学习项目节点自定义；复盘关键词放宽到 5 个；体重单位切换 | V1.0 复盘强制 1-3 词 |

#### （三）轻量查看增强

| # | 特性 | V1.0 状态 | 原始规格 | 备注 |
|---|---|---|---|---|
| P2-6 | **分类筛选** | ⏳ V1.4+ | 8 大模块 + 近 7/30 天时间筛选 | V1.0 仅 3 模块 + 倒序 |
| P2-7 | **极简数据汇总** | ⏳ V1.4+ | 收支月度总额、运动月度总时长、学习进度排序（仅数字、无图表）| V1.2 非范围"无图表"需要重新评估 |
| P2-8 | **人脉升级：核心交集** | ⏳ V1.4+ | 可选字段，关联收支/物品 | V1.0 无人脉 |

#### （四）工具补充

| # | 特性 | V1.0 状态 | 原始规格 | 备注 |
|---|---|---|---|---|
| P2-9 | **本地数据管理** | ⏳ V1.4+ | 按分类/时间批量删除；本地加密备份 | 批量删除与 V1.0 软隐藏是不同范式 |
| P2-10 | **轻量提醒** | ⏳ V1.4+ | 人脉下次联系本地通知；学习项目进度提醒 | 需系统通知权限 |
| P2-11 | **物品管理升级** | ⏳ V1.4+ | 物品搜索 + 状态标签（在用/闲置/丢失）| V1.0 无物品模块 |

### 三、MVP 第三阶段：物品过期提醒（OCR + 日历）

| # | 特性 | V1.0 状态 | 原始规格 | 备注 |
|---|---|---|---|---|
| P3-1 | **拍照识期** | ⏳ V1.4+ | 拍摄商品包装自动识别名称 + 过期/限用日期；识别失败手动选日期 | 需要 OCR（系统 API / 云端）|
| P3-2 | **自动同步系统日历** | ⏳ V1.4+ | 保存后自动同步到系统日历（macOS EventKit / Windows Calendar）、创建过期提醒事件、支持提前 3/7/30 天 | 跨系统日历集成 |
| P3-3 | **状态展示** | ⏳ V1.4+ | 物品列表标注剩余天数；颜色区分（正常/临期/过期）| 需 P2-11 物品状态标签 |

### 四、查看与基础设置（原始要求）

| # | 特性 | V1.0 状态 | 原始规格 | 备注 |
|---|---|---|---|---|
| V-1 | **记录列表：底部唯一查看入口** | ❌ 决策放弃 | 按时间倒序、点击编辑、长按删除（二次确认）| V1.0 改为"主窗口查看" + "长按隐藏"（软状态）|
| V-2 | **基础设置：长按首页按钮改名称** | ⏳ V1.4+ | 修改持久化存储 | V1.0 无此功能 |

---

## Requirements（V1.1 精简 PRD：Mindtap · 轻念，V1.0 上游基线）

> ⚠️ V1.1 7 大功能域在 V1.0（闪念）中**已收缩为 3 模块**。本节作为上游基线保留。

> 📌 注：原 PRD V1.0（2026-06-14 上午版）已被 V1.1 精简版取代。V1.1 删除了整个 3.1 账号与初始化章节、删除了云端备份、加回了语音转文字、强化了待办。本节以 V1.1 为准。

### 一、基础存储
- 数据**仅本地存储**，无云端同步、无云端备份（D17）

### 二、全局入口
1. 首页顶部固定「+快速记录」按钮 → 点击弹出分类弹窗，无页面跳转
2. 底部导航仅「记录」「概览」两栏

### 三、高频状态一键打卡（纯点击/滑动，无需文字输入）
1. **情绪/能量**：1-10 分滑动选择，默认 5 分，操作后自动保存
2. **作息**：「入睡」「起床」双按钮，点击自动记录当前时间，支持小幅手动调整
3. **饮水**：「+1 杯 / -1 杯」计数器，单杯默认 200ml，点击即时更新
4. **服药/保健品**：「已服用 / 未服用」一键勾选，最多添加 2 个常用品类

### 四、灵感捕捉 & 核心待办
1. **创意/梦境/金句**：单输入框，支持关键词输入 + **10 秒语音转文字**（D15），退出自动保存，无格式编辑、无手动保存按钮
2. **待办闪念（核心 Todo）**
   - 字段：仅**事项内容 + 截止时间**
   - 时间选项：今天 / 明天 / 自定义
   - **完成状态一键标记**（V1.1 新增）
   - 无优先级、无标签、无复杂分组

### 五、轻量化追踪
1. **习惯打卡**：最多添加 3 个自定义习惯，仅「已完成 / 未完成」一键标记
2. **消费速记**：金额 + 固定分类（必要 / 非必要 / 意外），金额配备 50、100 快捷输入按钮

### 六、查看与复盘
1. **概览页**：仅展示当日所有记录，按时间倒序排列，无筛选、检索、图表
2. **每日复盘**：底部固定输入框，限 3 个关键词（逗号分隔），提交后关联当日记录

### 七、简易设置
1. 支持修改现有标签名称（例：饮水 → 咖啡）
2. 最多设置 2 组定时提醒

---

## 非功能性需求（沿用原 PRD §4 + 跨平台扩展）

- 冷启动 ≤ 2 秒
- 快速记录弹窗响应 ≤ 0.3 秒
- 概览加载 ≤ 1 秒
- 离线可用，本地优先
- 单条记录 ≤ 1KB
- **跨 4 端**（iOS + Android + Mac + Windows，单代码库）

## 验收标准（沿用原 PRD §5）

- 5 类核心记录操作随机抽测 < 3 秒
- 概览 1 秒内完整展示
- 直觉即可完成记录

## 非范围（沿用原 PRD §6 — 6 条严格边界）

1. ❌ 批量标签管理、多级分类、自定义字段
2. ❌ 数据图表、多维统计、趋势分析、对比报表
3. ❌ 社交分享、社区、好友互动
4. ❌ 复杂筛选、全文检索、多日期回溯
5. ❌ 新手引导、教程、成就、打卡激励
6. ❌ 多设备实时同步、跨端联动

## V1.0 → V1.1 PRD 变化清单（用户主动演进）

| 维度 | V1.0 | V1.1（当前） | 变化原因 |
|---|---|---|---|
| 账号与初始化 | 3 种登录（手机号/微信/Apple ID） | **整章删除** | 用户决定全平台无登录 |
| 云端备份 | "本地 + 静默云端" | **删除** | 无后端决策落地 |
| 语音输入 | "10 秒语音转文字" | 保留 | V1.0 PRD 写了但用户曾犹豫；V1.1 明确要 |
| 待办 | 待办闪念 | **核心 Todo**（含完成状态） | 加强轻量任务管理 |
| 产品名 | 未定（建议灵感匣） | **Mindtap · 轻念**（双名） | 用户定名 |

## V1.1 PRD 后续增量（用户口头补充）

| 维度 | 增量内容 | 影响 |
|---|---|---|
| **快速记录按钮位置** | **悬浮 + 可任意拖动**（不固定在顶部） | 取消"顶部固定"约束；类似 Things 3 / Bear 的浮动按钮；移动端可保留顶部固定，桌面端可拖动 |
| **目标平台 UX 偏好** | "**Mac 原生感**" | 桌面端不走"iPad 大屏模式"，走 macOS 设计语言（菜单栏 vibrancy + 浮动侧栏） |
| **用户身份** | "**跨端重度用户**" | 用户本人 iOS + Mac + Windows 多端使用；目标用户群应包含这类人群 |
| **新待澄清** | "Mac 原生感" = 各平台原生（Win 用 Mica）vs 全平台统一 Liquid Glass？ | 这是 Q2-B 与 Q2-C 的分水岭 |

## V1.1 → V1.2 变化清单（**用户主动演进**）

> 📌 V1.2 是 2026-06-14 晚的**重大决策收尾**，基于 docs-collector 探索 Apple Liquid Glass 资源后用户提出"是否可以用 SwiftUI"引出。

| 维度 | V1.1 | V1.2（当前） | 变化原因 |
|---|---|---|---|
| **平台范围** | iOS + Android + Mac + Windows 4 端 | **Mac + Windows 2 端**（PC 端优先）| 用户决策"V1.0 优先 PC 端"；降低 V1.0 复杂度 |
| **iOS 端** | V1.0 必做 | **V2.0 才做** | 移动端碎片化场景延后 |
| **Android 端** | V1.0 必做 | **V2.0 才做** | 同上 |
| **数据策略** | 数据本地（无云同步） | **数据本地 + 无导出/无导入/无同步** | 用户决策 A. 不做；进一步收紧"无云"原则 |
| **多设备迁移** | 留口子（V1.1 隐含支持） | **明确不做**（即使手动拷贝 .db）| 用户决策 A. 不做 |
| **Mac 端 Liquid Glass** | NSVisualEffectView（80% 还原）| **SwiftUI 嵌入混合架构（95% 还原）**| 用户决策 C. SwiftUI 嵌入；glassEffect API 原生 |
| **Windows 端 Liquid Glass** | CSS 模拟（70% 还原）| **CSS 模拟（80% 还原）**（沿用）| 已是最优 CSS 方案 |
| **语音转文字** | V1.0 实现 | **V2.0 移动端才做** | 平台范围收缩，PC 端优先文字 |
| **V1.0 上线时间** | 6 个月 | **3 个月**（激进）| PC 端优先允许激进排期 |
| **架构** | Tauri 2 纯 Web | **Tauri 2 + SwiftUI 嵌入**（混合）| Mac 95% 还原；V2.0 iOS 复用 SwiftUI 视图 |
| **D6 技术栈** | Tauri + React + TS + SQLite | **Tauri + React + TS + SQLite + SwiftUI 嵌入** | 扩展为混合架构 |

### V1.2 新增技术决策（D21-D27）

| # | 决策 | 技术原理 | 替代方案 |
|---|---|---|---|
| T8 | Mac 端 SwiftUI 嵌入（NSHostingView 容器）| Tauri 2 macOS 端基于 WKWebView，可叠加 NSHostingView 渲染 SwiftUI 视图；通过 Tauri IPC（command/event）双向通信 | A. 全 Web 70%；B. Rust + NSVisualEffectView 90% |
| T9 | SwiftUI 嵌入区限定 4 个：sidebar/modal/toolbar/card | 限制 IPC 复杂度；80% UI 走 Web | 全部 Web / 全部 SwiftUI |
| T10 | SwiftUI ↔ React IPC 协议：Tauri command (invoke) + event (emit/listen) | Rust 端做协议网关，SwiftUI 和 React 都通过 Rust 通信 | 直接 IPC（复杂）|
| T11 | 4 个核心 Liquid Glass modifier：`glassEffect(_:in:)`、`GlassEffectContainer`、`glassEffectID(_:in:)`、`backgroundExtensionEffect()` | Apple 官方 SwiftUI API；iOS 26 + macOS 26 一致 | UIVisualEffectView（更老）|

### V1.2 → V2.0 演进路径

```
V1.0 (3 个月内, 文档基线 = docs/projects/v1.0/prd-v1.2.md)
├─ 平台: macOS 26+ + Windows 11/12
├─ 架构: Tauri 2 + SwiftUI 嵌入
├─ 数据: 全本地 SQLite (无导出/无同步)
├─ SwiftUI 视图代码: 100% 沉淀
└─ 交付物: 可分发的 Mac + Windows 应用

V2.0 (后续, 暂不规划时间)
├─ 平台: + iOS + iPadOS + Android
├─ iOS 端: SwiftUI 复用 V1.0 视图 (D26)
├─ Android 端: 候选 Tauri 移动端 / Kotlin (D27 决策)
├─ 语音转文字: iOS Speech + Android SpeechRecognizer
├─ 数据互通: 暂不要求 (V1.0 数据全本地)
└─ 实施成本: 最低（SwiftUI 视图 100% 复用）
```

### V1.2 风险登记（**新增**）

| # | 风险 | 等级 | 缓解 |
|---|---|---|---|
| R1 | Tauri 2 + SwiftUI 嵌入**无官方示例** | 🔴 高 | Phase 1 spike 必做；fallback 到 NSVisualEffectView |
| R2 | 3 个月时间表激进 | 🟡 中 | 优先 P0 功能；Liquid Glass 先 70% 再 95% |
| R3 | SwiftUI ↔ React IPC 复杂 | 🟡 中 | 限制 SwiftUI 嵌入区数量（4 个核心区）|
| R4 | macOS 26 Liquid Glass API 稳定性 | 🟡 中 | 苹果 Beta API 在 macOS 26 正式版（2025 秋）后稳定 |
| R5 | Windows 端 SwiftUI 不可用 | 🟢 低 | 走 Web 模拟（80% 还原度已够用）|

### V1.2 沉没成本保护（**好消息**）

| 沉没资产 | V1.2 是否沿用 | 备注 |
|---|---|---|
| 22 个 Liquid Glass 文档 | ✅ 100% 沿用 | `docs/material/apple/liquid-glass/`, `docs/material/apple/swiftui/`, `docs/material/apple/hig/`, `docs/material/apple/wwdc/` |
| 现有 D1-D20 决策 | ✅ 90% 沿用 | 仅 D6 扩展为 Tauri + SwiftUI 嵌入 |
| PRD V1.1 7 大功能域 | ✅ 100% 沿用 | 范围不收缩，只砍平台 |
| 3 秒/1 秒/0 思考铁律 | ✅ 100% 沿用 | 不可妥协 |
| 6 条非范围边界 | ✅ 沿用 + 新增 2 条 | 新增：无导出、无移动端 |
| Tauri 2.x 技术栈 | ✅ 沿用 | 仅增加 SwiftUI 嵌入层 |
| SQLite 单表 + JSON payload | ✅ 沿用 | schema 不变 |
| Liquid Glass Web 模拟 CSS | ✅ 沿用（Windows 端主用）| Mac 端升级为 SwiftUI 嵌入 |

---

## Research Findings

### Tauri 2.x 跨平台能力（关键技术调研）

- **移动端支持**：Tauri 2.0（2024 年发布）正式支持 iOS 和 Android，单代码库可构建 4 端
- **桌面端**：macOS / Windows / Linux 一等公民
- **bundle 体积**：5-15MB（vs Electron 100MB+）
- **冷启动**：< 500ms（Rust 编译型 + 系统 WebView）
- **macOS 玻璃特效**：`tauri::window_vibrancy` crate 支持 NSVisualEffectView（vibrancy: 'sidebar' | 'header' | 'menu' | 'popover' | 'titlebar' | 'selection' | 'window' | 'hud' | 'fullscreen-ui' | 'tooltip' | 'content' | 'under-window' | 'under-page'）
- **移动端限制**：iOS 构建需要 Xcode + Mac 物理机；Android 可在任意平台构建

### Liquid Glass（Apple 设计语言）

#### 8 个核心维度（用户已详述）
1. **4 层动态玻璃结构**：玻璃基底 + 折射模糊 + 动态高光 + 环境阴影
2. **统一大圆角**：与 Mac 机身圆弧对齐
3. **组件玻璃化**：菜单栏/侧栏/工具栏/弹窗/Dock
4. **图标 4 种样式**：浅色/深色/着色/透明
5. **3 级 Z 轴分层**：内容层 → 操作控件层 → 导航/弹窗层
6. **动效**：光流动效、液化过渡、微视差
7. **色彩**：动态着色（提取背景色）、对比度自适应
8. **Mac 专属**：放大红绿灯按钮、macOS 风格通知中心

#### Web 近似实现方案
- `backdrop-filter: blur(20px) saturate(180%)` — 玻璃模糊
- `mix-blend-mode: plus-lighter` — 折射近似
- `box-shadow: inset 0 1px 0 rgba(255,255,255,0.3)` — 内部高光
- `box-shadow: 0 8px 32px rgba(0,0,0,0.2)` — 环境阴影
- `mask-image` + `transform` — 视差效果

#### 平台分级实施
- **macOS**：原生 NSVisualEffectView（最真实）
- **iOS/iPadOS**：iOS 15+ 的 UIVisualEffectView（通过 WKWebView 暴露给 Web）
- **Windows 11**：Mica/Acrylic（CSS 配合 `prefers-color-scheme`）
- **Android**：Material You 动态色 + CSS 玻璃

### React 18 + Vite + TypeScript 组合

- **冷启动**：Vite 启动 < 1 秒（HMR < 100ms）
- **TypeScript**：编译时类型检查，避免运行时错误
- **Zustand 状态管理**：0.3KB（vs Redux 5KB+）
- **零 boilerplate**：相比 Redux，Zustand 不需要 actions/reducers/store 三件套

### SQLite 单表 + JSON payload 模式

- **优势**：单表设计简单；JSON payload 灵活应对 7 种记录类型（V1.1 后）；查询时单 `WHERE date(created_at) = today` 即可
- **索引**：`CREATE INDEX idx_records_created_at ON records(created_at)` 保证概览页 < 50ms
- **单条记录 < 1KB**：JSON payload 内单字段（1-10 数字、金额数字、3 词字符串）通常 < 100B

### 语音转文字方案（V1.1 引入）

- **iOS / iPadOS / macOS**：系统原生 `Speech.framework`（免费、离线、支持中文）
- **Android**：系统原生 `SpeechRecognizer`（免费、离线、支持中文，需 RECORD_AUDIO 权限）
- **Windows**：系统原生 `System.Speech` 或 `Windows.Media.SpeechRecognition`
- **Web（兜底）**：`Web Speech API`（仅 Web 平台，浏览器支持有限）
- **Tauri 集成**：Rust 端通过 `tauri-plugin-speech` 或自写 JNI/Objective-C 桥接
- **关键限制**：10 秒内的语音录制（PRD 约束），避免长录音占用存储

---

## Technical Decisions（架构级，区别于 task_plan.md 的"决策"—— 此处是技术原理性决策）

| # | 决策 | 技术原理 | 替代方案 |
|---|---|---|---|
| T1 | Tauri 2.x 而非 Electron | Rust 编译型 + 系统 WebView = 体积小、启动快 | Electron（100MB+，冷启动 3-5s）|
| T2 | React 18 而非 Vue 3/Svelte | 组件生态最成熟；类型推断最佳 | Vue（学习曲线低但生态弱）|
| T3 | Vite 而非 Webpack/Turbopack | 启动 < 1s；HMR < 100ms | Webpack（启动 10s+）|
| T4 | Zustand 而非 Redux/Jotai | 0.3KB；无 boilerplate；并发模式兼容 | Jotai（atom 思维略复杂）|
| T5 | SQLite 单表 + JSON payload | 简化 schema；查询快；类型通过 JSON 区分 | 多表设计（schema 复杂、查询需 JOIN）|
| T6 | 自研 Liquid Glass 组件库 | 第三方库无 Apple 真·Liquid Glass | shadcn/ui（无玻璃效果）|
| T7 | React Router v6 | 仅 2 tab + 3 子页面，路由简单 | 无路由（用 Zustand 状态）|

---

## Issues Encountered

| # | 问题 | 解决方式 |
|---|---|---|
| I1 | PRD 描述移动 App 但用户最初答"Web 应用" | 以 PRD 为准，澄清后扩展为 4 端 |
| I2 | 移动端 3 种登录方式（手机号/微信/Apple ID）在桌面端无意义 | 桌面端无登录（D5）|
| I3 | "基础产品纲领"提"支持语音"与用户明确"暂不实现"冲突 | 以决策回答为准（D4）|
| I4 | "基础产品纲领"提"进度条/可视化"与 PRD"不做图表"冲突 | 列入 Q1 决策点待用户决定 |
| I5 | iOS/Mac 构建需要 Mac 物理机，用户在 WSL2 | 列入 Q5 决策点 |
| I6 | 用户多次拒绝多选题（3 次） | 改为开放式讨论（I1 解决方式已记录）|

---

## 🚨 V1.0 P3 / P3.5 阶段踩坑日志（跨环境脚手架 + Windows NSIS Build）

> **阶段**：V1.0 P3 项目脚手架 + P3.5 Windows NSIS Build  
> **时间**：2026-06-14 中午 - 晚（约 4 小时）  
> **核心矛盾**：WSL（Linux dev 环境） + Windows（native build）跨环境开发 + Tauri 2 NSIS 工具链自动下载  
> **累计踩坑数**：10 个（E11-E20）

### 10 大坑（按出现顺序）

#### E11: Rust crates.io 官方源极慢（5h ETA）

- **现象**：`cargo build` 拉依赖 3.86 KiB/s，5h ETA
- **根因**：crates.io 在中国大陆**无** CDN 加速；GitHub raw 资源也走境外
- **解决**：D45：换 `rsproxy.cn` 镜像
- **配置**：`C:\Users\Administrator\.cargo\config.toml`
  ```toml
  [source.crates-io]
  replace-with = "rsproxy-sparse"

  [source.rsproxy-sparse]
  registry = "sparse+https://rsproxy.cn/index/"

  [net]
  git-fetch-with-cli = true
  ```
- **效果**：依赖下载从 5h → ~10min

#### E12: 9P 软链 + npm symlink 三重冲突（`npm error EISDIR`）

- **现象**：WSL 端 `npm install` 在 `node_modules/.bin/` 软链处失败，错误 `EISDIR`（是目录不是文件）
- **根因**：WSL 2 用 9P 协议访问 Windows 文件系统；Windows NTFS 软链与 WSL POSIX 软链**不**互通；npm symlink 在 9P 边界上嵌套失败
- **尝试**：
  1. ❌ `npm install --no-bin-links` — **不**解决问题
  2. ❌ 在 WSL 端建软链到 Windows 项目目录 — SymbolicLink 失败
- **解决**：D43：放弃 WSL 软链到 Windows 目录，WSL + Windows **双端独立项目目录**
  - WSL: `/home/jason/workspace/mindtap/`
  - Windows: `C:\Users\Administrator.DESKTOP-08FNQ8U\workspace\mindtap\`
  - git 推拉同步（WSL 端 `receive.denyCurrentBranch=ignore`）

#### E13: cmd UNC path 不支持 CWD

- **现象**：cmd 中 `cd "C:\Users\Administrator.DESKTOP-08FNQ8U\workspace\mindtap"` 报错（UNC path 不是 CWD 候选）
- **根因**：cmd 的 CWD 必须是**本地盘符**路径（`C:\` `D:\`），不能是 UNC `\\?\` 或过长路径
- **解决**：D43：先 `cd C:\` 再 `pushd "C:\Users\...\mindtap"`（pushd 自动映射盘符）

#### E14: SymbolicLink + 9P + Windows 边界

- **现象**：在 WSL 端建 `ln -s /mnt/c/...` 软链，Windows 端访问提示"权限不足"
- **根因**：Windows 10/11 默认**不**允许普通用户创建软链到非 Administrator Owned 目录；WSL 端 mnt 又是 9P 边界
- **解决**：D43：放弃跨边界软链

#### E15: vcvars64.bat 在 Git Bash 中破坏 `ln` 命令

- **现象**：Git Bash 跑 `source vcvars64.bat` 后，cargo build 链 Rust crate 失败（"extra operand `link.exe`"）
- **根因**：vcvars64.bat 设置 MSVC 环境变量时把 Windows `C:\Program Files\...\link.exe` 放到 PATH **最前**；Git Bash 的 `ln` 是 POSIX 命令，参数格式不同（`ln -s src dst`）；cargo 调 link.exe 时实际调用了 Git Bash 的 `ln`
- **解决**：改用 PowerShell 跑 vcvars64.bat + npm run tauri build（PowerShell **不**重写 `ln` 别名）

#### E16: PowerShell `cd /d` 不支持

- **现象**：PowerShell 5.x 跑 `cd /d C:\path` 报错 "找不到接受实际参数...的位置形式参数"
- **根因**：`cd /d` 是 cmd 的语法（/d 切盘符），PowerShell 5.x **不**支持
- **解决**：PowerShell 用 `cd`（不带 /d），或用 `Set-Location -Path "C:\path"`

#### E17: PowerShell `Set-Content` 多参数 error

- **现象**：一行写 `Set-Content "path"Get-Content "path" | Select-String` 报错
- **根因**：PowerShell 一行 2 个命令没用 `;` 分隔，解析器把 2 个命令拼成一个
- **解决**：用 `;` 或换行分隔：`Set-Content "path"; Get-Content "path" | Select-String`

#### E18: curl 301 重定向只 14 bytes

- **现象**：`curl -O https://raw.githubusercontent.com/...installer.nsi` 只得 14 bytes（HTML 301 Moved）
- **根因**：GitHub raw 走 `Location: https://.../` 重定向，curl **不**默认跟
- **解决**：加 `-L` 跟重定向
- **但**实际**不**需要手动下载 installer.nsi — Tauri 2 已编译嵌入 NSIS 模板，**不**暴露给用户

#### E19: Tauri 2 NSIS 内部 reqwest 默认不读 env vars（**关键突破**）

- **现象**：Tauri 2 build 时下载 NSIS 工具链（`makensis.exe` + `nsis_tauri_utils.dll`），无代理下 timeout "Peer disconnected"
- **根因**：Tauri 2 内部 reqwest 客户端**不**默认读系统代理；v2ray/clash 的 7890 端口在 Windows 上是 system proxy
- **解决**：PowerShell 显式设环境变量
  ```powershell
  $env:HTTP_PROXY="http://127.0.0.1:7890"
  $env:HTTPS_PROXY="http://127.0.0.1:7890"
  npm run tauri build
  ```
- **效果**：NSIS 工具链自动下载 + 验证 + 解压 100% 成功；`tauri-app_0.1.0_x64-setup.exe` ~20MB 生成
- **关键洞察**：Tauri 2 内部 reqwest **实际**读 env vars（**不是** 默认）— 这是文档未明确的"半官方"行为

#### E20: NSIS v0.5.3 仓库根目录结构与 Tauri 2 预期不符

- **现象**：手动复制 v0.5.3 时，`Copy-Item "$utilsSrc\Plugins\x86-ansi"` 路径不存在
- **根因**：`nsis-tauri-utils-nsis_tauri_utils-v0.5.3/` 是 GitHub 仓库根目录（`.cargo/`、`.changes/`、`.github/`、`.scripts/`、Plugins/），**不**是 Tauri 2 期望的 `Plugins/x86-ansi/` 子目录
- **解决**：D44：放弃手动复制，让 Tauri 2 自己下载 + 验证 + 解压

### 跨环境开发的 3 大原则（D43 沉淀）

1. **WSL 端**：纯 dev（编辑代码 + 跑 `tauri dev`），**不**做 build
2. **Windows 端**：纯 build（PowerShell + vcvars64.bat + `tauri build`），**不**做编辑
3. **两端独立项目目录**：
   - WSL: `/home/jason/workspace/mindtap/`
   - Windows: `C:\Users\Administrator.DESKTOP-08FNQ8U\workspace\mindtap\`
   - git 推拉同步（WSL 端 `receive.denyCurrentBranch=ignore`）

### macOS / Linux 端 build（V1.0 P3 范围外，但作为对比记录）

- **macOS**：V1.0 后续才用（用户有 Mac 机器，D25）；`xcode-select --install` 即可
- **Linux**：V1.0 范围外；需 `libwebkit2gtk-4.1-dev` `libssl-dev` `libayatana-appindicator3-dev`
- **关键 macOS 兼容性决策**：
  - 个人开发者**最高**兼容 = Apple Developer ID 签名 + 公证（$99/年）
  - **中**兼容 = ad-hoc 签名（免费；首次打开需"系统设置 → 隐私与安全性 → 仍要打开"）
  - **最低** = 无签名（每次下载都被 Gatekeeper 拦截）

---

## Resources

### Tauri 2.x
- 官网：https://tauri.app/
- 移动端文档：https://tauri.app/start/migrate/from-tauri-1/
- `tauri-plugin-sql`：https://github.com/tauri-apps/tauri-plugin-sql
- `tauri::window_vibrancy`（macOS）：https://docs.rs/tauri/latest/tauri/window/index.html

### React 生态
- React 18：https://react.dev/
- Vite：https://vitejs.dev/
- Zustand：https://github.com/pmndrs/zustand
- React Router v6：https://reactrouter.com/

### Apple Liquid Glass
- WWDC 2025 设计语言介绍：https://developer.apple.com/wwdc25/
- macOS 26 HIG：https://developer.apple.com/design/human-interface-guidelines/macos
- Liquid Glass 总览：https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- Adopting Liquid Glass：https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- Landmarks 示例代码：https://developer.apple.com/tutorials/data/documentation/swiftui/landmarks-building-an-app-with-liquid-glass.md

#### 6 大核心原则（来自 Apple 官方 Adopting Liquid Glass 文档）

1. **"Reduce your use of custom backgrounds in controls and navigation elements"** — 控件和导航应减少自定义背景，让系统玻璃接管
2. **"Avoid overusing Liquid Glass effects"** — 玻璃要克制，过度使用会分散对内容的注意力
3. **"Be judicious with your use of color"** — 颜色克制，让内容能"infuse"（渗透）控件
4. **"larger row height and padding"** — 列表行高和内边距加大，给内容"呼吸"
5. **"concentric corner radii"** — 嵌套圆角要同心（容器与子元素圆角成比例）
6. **"fluidly morphing Liquid Glass shapes"** — 通过 `GlassEffectContainer` 优化性能并实现形状间液化过渡

#### 3 大关键技术效果

1. **Background Extension Effect** — 侧栏/检视器下方内容视觉延伸（实际不滚动内容，用镜像+模糊）
2. **Scroll Edge Effect** — 滚动时控件下方内容渐隐，保对比度
3. **Glass Morphing** — 形状间液化过渡（如 FAB 变 modal）

#### 原型 V3.0 落地策略

- **玻璃只用于 4 个功能层元素**：menubar / sidebar / FAB / modal
- **内容（records / stats / review）保持纯净** — 背景透出 + 简化悬浮反馈
- **侧栏 background extension** — `mask-image` 实现右侧内容视觉延伸
- **主内容 scroll edge** — sticky 顶部渐变 + 滚动时触发
- **FAB→Modal 液化** — JS 读取 FAB 中心 → 设置 modal `transform-origin` → 同步动画
- **title-style 取代 uppercase** — 所有大写标签改为 title case

### 用户工作环境
- WSL2（Windows Subsystem for Linux 2）：可直接开发 Windows 应用
- iOS/Mac 构建需 Mac 物理机（待确认 Q5）

---

## 待研究（按需执行）

- [ ] Tauri 2.x 移动端的已知限制（性能、API 覆盖度）
- [ ] SQLite 在 Tauri 移动端的兼容性与性能基准
- [ ] Liquid Glass CSS 实现的具体浏览器兼容性
- [ ] `tauri-plugin-sql` 的多端一致性
- [ ] iOS App Store 上架对第三方登录的要求

---

*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
