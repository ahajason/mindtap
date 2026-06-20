# 业务场景索引

> Created: 2026-06-20
> 任务类型: 骨架(全场景清单,无 F/R/B 正文)
> 说明: 枚举本项目所有用户可感的业务功能;每条 1-2 句定位,标注是否已存在 spec。

## 已存在 spec(`docs/specs/`)

| 文件 | 覆盖场景 | 状态 |
|---|---|---|
| `2026-06-14-浮动窗口快速记录-design.md` | §5 浮窗快速记录 | 已有,可作正文基础 |
| `2026-06-14-浮动窗口与托盘管理-design.md` | §5 浮窗外壳 + §7 托盘 | 已有,可作正文基础 |
| `2026-06-19-主窗改造为设置页-design.md` | §6 设置中心 | 已有,可作正文基础 |

## 业务场景(共 10)

### 业务域 A: 记录核心(4 场景)

1. **任务管理** — 5 态状态机 `pending → active ↔ paused → done`,任意态可 `archived`;全局唯一 active(L1);暂停保留时长累加(L2);非法转换拒绝(L3)
2. **想法捕捉** — 单字段 idea;无状态机;创建 / 查看 / 软删
3. **每日打卡** — check_in;按 `created_at` 日期聚合;创建 / 查看 / 删除
4. **记录统一视图** — `record` 视图跨 3 源表展示,按 `created_at DESC`;含类型 / 状态 / 摘要

### 业务域 B: 浮窗(1 场景)

5. **浮窗快速记录** — OuterShell 玻璃外壳 + StatusDot 状态点;Timer / Form / Folded 三模式;提交走对应源表(task / idea / check_in),双写 `record` 视图

### 业务域 C: 主窗设置(1 聚合场景)

6. **设置中心** — 单列滚动,9 节按以下顺序:`外观 → 浮窗 → 数据 → 快捷键 → 启动 → 窗口状态 → 日志 → 诊断 → 关于`
   - 外观 / 浮窗:主题 + 玻璃强度
   - 数据:导入 / 导出 / 归档 / 删除
   - 快捷键:全局快捷键绑定(显示主窗、显示浮窗)
   - 启动:autostart 开关(OS LaunchAgent / Registry / .desktop)
   - 窗口状态:记住主窗尺寸 / 位置
   - 日志:级别 / 文件路径显示
   - 诊断:日志 ring(200 条)+ 文件路径 + 系统信息(3s 轮询)
   - 关于:版本号 / 项目链接

### 业务域 D: 系统集成(4 场景)

7. **托盘菜单** — 三入口(浮窗右键 / 主窗右键 / 托盘图标)共用 `handle_action` 路由;菜单按 autostart 实时状态重建;退出走确认对话框
8. **全局快捷键** — 注册 `toggle_main` / `toggle_floating`;冲突时退回默认;运行时变更后重新注册
9. **自启动** — OS truth(LaunchAgent / Registry / .desktop),`settings.json` 仅 UI 镜像;UI 操作 → `autostart` plugin → 写 OS
10. **诊断面板** — `useDiagnostics` hook mount + focus 刷新;`LogViewer` 组件 3s 轮询 ring;聚合字段以 Rust `Diagnostics` struct 为准

## 不在本骨架范围(后续可加)

- 数据导入 / 导出(DataSection 内部子项;若要做可独立成场景)
- 归档 / 删除策略(软删 vs 硬删;跨场景复用规则)
- 日志基建 / DB schema 演进 / `AppError` 类型映射 → **非业务**,仅 evidence.md 引用,不入 spec

## 下一步建议

深挖顺序(挑 1-2 个先动):

| 优先级 | 场景 | 理由 |
|---|---|---|
| ★★★ | §1 任务管理 | 5 态状态机 + L1/L2/L3 三条不变量,最复杂也最易错,spec 价值最高 |
| ★★ | §5 浮窗快速记录 | 已有 2 份 design,接续最省力;但需先合并去重 |
| ★★ | §6 设置中心 | 已有 design,但 9 节聚合,正文要拆 §6.1-§6.9 |
| ★ | §4 / §7 / §10 | 规则相对简单,后做 |

> 选好后:读对应 design → 在 `spec/<scene>.evidence.md` 填 5 维度 → 编辑/新建 `<scene>.md` 正文(F/R/B) → 跑 7 项自检。

## 业务扩展(2026-06-20 纳入外部 MVP 业务功能)

> 来源:外部 MVP 设计(8 模块 / 移动端 / ENFP / "3 秒记录" 准则)
> 约束:**仅业务功能入 spec**;架构改动(schema / commands / permissions)在 spec 中标 `[需扩展]`,**不直接落 `src-tauri/`**
> 映射策略:优先复用现有 4 表(`task` / `idea` / `check_in` / `record`);需新字段/新表的,显式标出

### A. 复用现有表(schema 微改或 0 改)

| 新 MVP 模块 | 映射 | 备注 |
|---|---|---|
| 灵感速记(创意/梦境) | `idea.content` | 现有;语音/图片能力 [需扩展] |
| 手账日记 | `idea` + `[record_type]` | 区分靠 record_type [需扩展] |
| 创意关联笔记 / 困惑速记 / 视觉灵感 / 声音记忆 | `idea` + `[tags]` | 关联关键词靠 tag [需扩展] |
| 待办闪念(1 核心 + 截止) | `task` + `[due_at]` | 简单待办模型 [需扩展] |
| 学习/项目进度(0/25/50/75/100) | `task` + `[progress]` | ⚠️ 与 5 态状态机不兼容,**需业务方决策** |
| 情绪 / 作息 / 饮水 / 服药 / 习惯 / 饮食 / 复盘 7 类打卡 | `check_in` + `[sub_type]` | 7 子类聚合 [需扩展] |

### B. 需新增表(架构影响:`db/schema.rs` 加 CREATE TABLE)

| 模块 | 拟新表 | 关键字段 |
|---|---|---|
| 收支速记 | `expense` | `amount REAL`, `category TEXT`(必要/非必要/意外), `created_at` |
| 体重 + 运动 | `body_sports` | `record_type`(weight/sports), `weight_value?`, `sports_type?`, `duration_min?` |
| 人脉维护 | `contacts` | `name`, `contact_time`, `scene?`, `voice_path?`, `image_path?`, `is_frequent` |
| 物品管理 | `item_manage` | `item_name`, `location` |

> ⚠️ 4 张新表**不**进当前 schema,作为 v2 spec 候选项;落地需另起 plan/spec 阶段。

### C. 需新增能力(架构影响:新 IPC + Tauri permission)

| 能力 | 用途 | 备注 |
|---|---|---|
| 语音转文字 | 全模块复用 | Tauri 语音插件或 OS API |
| 图片附件 | 人脉 / 视觉灵感 / 手账 | DB 存路径,二进制存本地 |
| 联系人语音 | 人脉维护 | 同上 |

### D. 关键决策项(spec 层需用户拍板)

| 编号 | 决策 | 选项 |
|---|---|---|
| D-1 | 新 MVP 的"任务"(1 项 + 截止) vs Mindtap `task`(5 态计时) | (a) 新建 `todo` 表并行 / (b) 改 `task` 表结构(破坏兼容)/ (c) 暂不纳入 |
| D-2 | `record` 统一视图是否扩到含 expense / body_sports / contacts / item_manage | (a) 扩,统一列表 / (b) 不扩,各表独立列表 |
| D-3 | 语音/图片能力首批覆盖哪些模块 | (a) 仅人脉 + 视觉灵感 / (b) 全模块通用 |

### E. 优先级(合并后,先深挖)

| 优先级 | 场景 | 备注 |
|---|---|---|
| ★★★ | §A `check_in` sub_type 扩展(7 子类) | 影响场景最多 |
| ★★★ | §B 4 张新表(expense / body_sports / contacts / item_manage) | schema 改动必经 |
| ★★ | §A `idea` record_type + tags 扩展 | 区分手账/灵感/视觉/声音 |
| ★★ | §C 语音转文字 + 图片附件(IPC + 权限) | 跨模块能力 |
| ★ | §D-1 task 模型决策 | 决策后才能动 `task` 表 |
| ★ | §D-2 record 视图扩域 | 决策后才能动 `record` 视图 |
