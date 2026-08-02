# PM-客户沟通 PRD — 工作协议与需求沉淀

> 本文档是 **@PM（产品经理）与 @Customer（客户）** 之间的沟通记录与需求沉淀。
> **只有 @PM 更新本文档**，@Developer 不直接修改。
>
> @Developer 请阅读 `docs/plans/developer-task-board.md` 查看任务跟踪状态。

---

## 一、角色与职责

| 角色 | 对应 | 职责 |
|---|---|---|
| **@Customer** | 客户（即提出需求的人） | 提出需求、反馈问题、确认方案、验收交付 |
| **@PM** | 产品经理（当前会话的 Claude Code） | 与 @Customer 沟通确认需求，沉淀到本文档，交给 @Developer 执行 |
| **@Developer** | 程序员（其他 Agent） | 读取本文档 §三 了解需求，在 `docs/plans/developer-task-board.md` 记录实现进度 |

## 二、协作流程

```
@Customer 提出需求/反馈问题
    ↓
@PM 与 @Customer 沟通确认（澄清范围、术语对齐、版本归属）
    ↓
@PM 将确认后的需求沉淀到本文档 §三「需求沉淀」
    ↓
@PM 将本文档交给 @Developer
    ↓
@Developer 读取 §三，按步骤实现修复
    ↓
@Developer 更新 docs/plans/developer-task-board.md 任务跟踪表
    ↓
@Developer 通知 @PM 或 @Customer 交付验收
    ↓
@Customer 验收，如有新问题回到第一步
```

### 关键规则

1. **@PM 只做需求确认与沉淀**，不做代码实现；
2. **@Developer 只做代码实现与任务跟踪**，不擅自变更需求范围；
3. 每次 @PM 与 @Customer 沟通后，**必须更新 §三**，保证需求沉淀最新；
4. 每次 @Developer 完成一个任务步骤后，**必须更新 `docs/plans/developer-task-board.md`**，标记完成情况并写备注；
5. 需求模糊点先评审再开发，@Developer 不得私自超需求开发；
6. 所有改动可追溯到业务价值与对应版本的原始设计文档。

### 沟通与验收规范

#### 沟通交互方式

@PM 与 @Customer 之间的每次沟通遵循以下模式：

1. **@Customer 提出需求/反馈问题** — 描述原始诉求，可能是模糊的、非技术性的
2. **@PM 澄清确认** — @PM 负责：
   - 将模糊描述转化为明确需求（术语对齐、版本归属、范围边界）
   - 主动枚举所有 user-facing 副作用（不只用户说的）
   - 对于有歧义的选择，给出 2-4 个离散选项让 @Customer 选择
   - 对于有明确默认值的决策，直接选择并说明理由
3. **@Customer 确认/调整** — @Customer 确认或修改 @PM 的理解
4. **@PM 沉淀到文档** — 将达成共识的需求写入 §3.2 沟通记录
5. **@PM 输出提示词** — 从 §3 提炼出给 @Developer 的可执行提示词

#### 验收反馈流程

@Developer 完成实现后，进入 @Customer 验收环节：

1. **@Customer 验收** — 在实机环境测试，反馈发现的问题
2. **@PM 分析归类** — 将问题归类为：样式问题 / 功能问题 / 体验问题 / 需求变更
3. **@PM 更新文档** — 在 §3.2 新增沟通记录，更新 §3.4 状态
4. **@PM 输出验收提示词** — 格式如下：

```
本文档是 @Customer 对 REQ-XX 的验收反馈，请修复。

读取文档：
1. `docs/governance/pm-customer-dialogue-prd.md` §3.2 最新沟通记录
2. `docs/plans/developer-task-board.md` 任务跟踪表

## 需修复的问题

### 问题 N：<标题>

- 现象描述（所见）
- 原因分析（如已知）
- 修复要求（期待效果）

**参考**：相关设计文档或代码路径

**修复方向**（任选其一）：
1. 方案一
2. 方案二

## 修复后更新

完成修复后，在 `docs/plans/developer-task-board.md` 中更新 REQ-XX 的备注。
```

5. **@Developer 修复并更新** — 修复后更新任务跟踪表备注
6. **循环** — 回到步骤 1，直到 @Customer 验收通过

## 三、需求沉淀（@PM 维护，每次沟通后更新）

### 3.1 当前版本背景

| 项 | 值 |
|---|---|
| 项目 | 轻念 · Mindtap |
| 当前版本 | V0.2.1 工作台（开发中）+ V0.2.2 可信台账与复盘（部分实现） |
| 技术栈 | Tauri 2 + React 19 + TypeScript 5.8 + Vite 7 + Rust 1.96+ |
| 数据库 | SQLite（rusqlite bundled），3 表：item / focus_interval / app_setting |
| 窗口 | 主窗（main）、浮窗（floating）、气泡窗口（bubble） |

### 3.2 沟通记录

#### 2026-08-03（第一轮）

**客户原始诉求**：有一段关于「确认卡片」的提示词需要整理，纠正语病和逻辑不一致，使其更符合当前系统描述。

**PM 确认后修正**：
- 项目内无「确认卡片」术语 → 改为「失真确认气泡」（Bubble 组件）+「待确认结算」（confirmPending 命令）
- 「任务浮窗」→ 「浮窗」（floating window）
- 「独立任务窗口」→ 「气泡窗口」（bubble window）
- 版本归属：失真确认闭环属 V0.2.1 工作台（ADR-0012），主窗管理/删除流程属 V0.2.2 可信台账与复盘（P4）
- 主窗口 `DormantConfirmDialog` 已返回 null，不再监听事件；主窗待确认通过 Review 页面 stale 列表按钮处理

**客户新增要求**：
1. 手动触发失真确认气泡（测试辅助）
2. 设置页面增加失真检测周期控制
3. 活动监听必要性评估
4. 删除按钮层级优化
5. 跨窗口通讯确认
6. 全量回溯 Spec

**客户确认已实现**：
- Style Guide 返回按钮 ✅（`StyleGuideLayout.tsx` 第 29-37 行已有）

#### 2026-08-04（第二轮 — 验收反馈）

**背景**：@Developer 已完成 REQ-03 和 REQ-11 的实现，@Customer 验收后反馈以下问题：

**问题 1：开发者选项开关按钮样式不可见**
- 开关按钮颜色太白，浮窗背景是玻璃透明效果，按钮在透明背景上几乎看不见
- 需要调整开关按钮的对比度/颜色，使其在玻璃透明背景上清晰可见

**问题 2：开关展开/收起导致窗口抖动**
- 点击开发者选项总开关后，面板内容展开/收起 → 窗口高度变化 → 出现滚动条 → 页面宽度变化 → 内容整体抖动
- 滚动条本身没问题，但宽度变化导致的抖动影响体验
- 需要：开关展开/收起时窗口高度不变，或内容区域预留足够空间防止抖动，或滚动条始终显示（`overflow-y: scroll`）避免宽度突变

**第二轮修复反馈（2026-08-04 续）**：@Developer 尝试修复后，抖动问题仍然存在：

- 外层容器 `flex-1 mr-3 mt-3 mb-3 overflow-y-auto p-[var(--spacing-6)]` 的 `overflow-y: auto` 导致滚动条在有/无之间切换，宽度仍会变化
- 内层有一个 `overflow-y-scroll` 的容器，但没有任何实际滚动作用，应移除

**第三轮沟通（2026-08-04 续）**：@Customer 进一步明确需求方向：

- 不要 `overflow-y: scroll` 始终显示滚动条（太丑）
- 不要 `overflow: hidden` 一刀切隐藏（会截断内容，无法滚动查看）
- 要 **Mac 风格滚动条**：
  - 滚动条有固定宽度，无论显示还是隐藏，内容区域宽度都不变 → 使用 CSS `scrollbar-gutter: stable` 预留滚动条空间
  - 保持 `overflow-y: auto`，内容溢出时可滚动
  - 用 `::-webkit-scrollbar` 系列伪元素美化成细窄、半透明、圆角的 Mac 风格（参考项目现有滚动条样式，如 ReviewPage 或 ManagePage）
  - 滚动条悬停时变亮，不使用时淡出，但始终保留空间
- 同时移除内层无用的 `overflow-y: scroll`

### 3.3 代码探查结果（@PM 完成，2026-08-03）

PM 探查代码后，发现部分需求已实现或部分实现，更新如下：

| 条目 | 探查结论 |
|---|---|
| **REQ-02** 触发载体规则修正 | ✅ **后端已全部实现**。`emit_dormant` 含 `bubble.show()`，BubbleApp 监听事件正常，`DormantConfirmDialog` 已返回 null，所有写操作均 emit `floating:data_changed` |
| **REQ-03** 手动触发气泡 | ✅ **已修复**。链路核实完整：`item_trigger_dormant` emit `floating:dormant` + `bubble.show()` 正常。按钮保护已从 `import.meta.env.DEV` 改为受 `developerMode` prop 控制（读取 `developer_mode_enabled` 设置）。后端加运行时检查 `developer_mode_enabled` |
| **REQ-04** 周期控制 | ⚠️ **后端参数读取已实现，设置页缺 UI**。`dormant.rs` 的 `get_cooling_ms()` 和 `idle.rs` 的 `get_idle_ms()` 已从 `app_setting` 读取（key: `dormant_cooling_min` / `idle_auto_pause_min`），但 Settings.tsx 没有对应的 UI 控件 |
| **REQ-07** 删除按钮层级优化 | ❌ **未实现**。Manage.tsx 当前直接平铺「删除」按钮，没有三点菜单 |
| **REQ-09** 跨窗口通讯 | ✅ **已全部实现**。`commands/item.rs` 中所有写操作均 emit `floating:data_changed`；`commands/review.rs` 的 `associate_gap` 也 emit；前端 Manage/Review 均已监听并自动刷新 |
| **REQ-10** 全量回溯 Spec | ❌ 未开始，需 @Customer 指明具体哪些交互不合理 |
| **REQ-11** 设置页「开发者选项」面板 | ❌ **抖动修复方案需调整**。@Customer 确认：不要 `overflow-y:scroll` 始终显示（太丑），改用 `scrollbar-gutter: stable` 预留空间 + `overflow-y: auto` + `::-webkit-scrollbar` Mac 风格美化。同时移除内层多余 `overflow-y:scroll` |

### 3.4 需求条目清单

> 编号规则：`REQ-<序号>`。@PM 新增，状态由 @PM 维护。

| 编号 | 描述 | 优先级 | 版本归属 | 状态 |
|---|---|---|---|---|
| REQ-01 | 失真确认气泡业务分析 & 偏差定位（产出文档） | P1 | V0.2.1 | 待实现 |
| REQ-02 | 触发载体规则修正：主窗不弹、BubbleApp 正常触发 | P1 | V0.2.1 | ✅ 后端已实现，PM 核查确认 |
| REQ-03 | 手动触发失真确认气泡（测试辅助入口） | P2 | V0.2.1 | ✅ 已修复：按钮保护从 `import.meta.env.DEV` 改为受 `developerMode` prop 控制 |
| REQ-04 | 设置页增加失真检测周期控制（4 项参数） | P1 | V0.2.2(P6) | ⚠️ 后端参数读取已实现，设置页缺 UI |
| REQ-05 | 任务级跳过失真确认设置项（评估，需评审） | P3 | V0.2.2 | 待评审 |
| REQ-06 | 气泡文案体验优化 | P2 | V0.2.1 | 待实现 |
| REQ-07 | 删除按钮展示层级优化：移入三点菜单 | P1 | V0.2.2(P4) | ❌ 未实现 |
| REQ-08 | 活动监听必要性评估（产出评估结论） | P1 | V0.2.2(P5) | 待评估 |
| REQ-09 | 跨窗口通讯确认：`floating:data_changed` 事件覆盖 | P1 | V0.2.2 | ✅ 已全部实现，PM 核查确认 |
| REQ-10 | 全量回溯 Spec，整改不合理/超需求内容 | P2 | V0.2.2 | 待明确具体项 |
| REQ-11 | 设置页增加「开发者选项」面板（类比 Android）：总开关控制调试模式，包含手动触发失真气泡、冷却阈值临时覆盖、轮询间隔等调试功能。调试模式开启后，浮窗任务卡上的「失真」按钮（当前仅 dev 模式可见）应改为受此开关控制 | P2 | V0.2.2(P6) | ❌ 抖动方案需调整：不要 `overflow-y:scroll`，改成 `scrollbar-gutter:stable` + Mac 风格滚动条样式 |

## 四、参考文档

| 文档 | 用途 |
|---|---|
| `docs/plans/developer-task-board.md` | @Developer 任务跟踪状态 |
| `docs/L-1-workbench/domain.md` | V0.2.1 领域模型（Item 三态、失真确认闭环） |
| `docs/L-1-workbench/design.md` | V0.2.1 设计契约（浮窗、气泡） |
| `docs/L-2-review/design.md` | V0.2.2 设计契约（复盘、活动信号、主窗管理） |
| `docs/L-2-review/adr.md` | ADR-0014 阶段二范围决策 |
| `docs/L-2-review/dormant-analysis.md` | 失真确认闭环偏差分析 |
| `docs/plans/2026-08-02-v0.2.2-phase2-plan.md` | V0.2.2 实施计划 |
| `docs/governance/versioning-rule.md` | 版本号治理规则 |
| `docs/CLAUDE.md` | Agent 工作流铁律 |

---

## 附录：本文档维护规则

1. **本文档只有 @PM 可以修改**，@Developer 和 @Customer 不直接编辑；
2. @PM 每次与 @Customer 沟通后，更新 §三（需求沉淀）和 §四（参考文档）；
3. @Developer 的任务跟踪记录在 `docs/plans/developer-task-board.md`，不在本文档中记录；
4. 本文档不替代 `docs/` 下的设计文档和领域文档——它是沟通层面的跟踪器，详细设计仍以对应版本的设计文档为准。

### 文档结构总览

```
§一 角色与职责           — @Customer / @PM / @Developer 角色定义
§二 协作流程             — 工时图 + 关键规则 + 沟通验收规范（含验收提示词模板）
§三 需求沉淀             — 3.1 版本背景 / 3.2 沟通记录（按时间） / 3.3 代码探查 / 3.4 需求条目清单
§四 参考文档             — 关联文档索引
附录 维护规则 + 结构总览
```