# check_in 子场景扩展 · 设计 spec (v0 草稿)

> **状态**: v0 草稿 ⚠️ 基于网络资料整合,**未与业务方核对意图**
> **创建**: 2026-06-20
> **覆盖**: 7 个 check_in sub_type(情绪 / 作息 / 饮水 / 服药 / 习惯 / 饮食 / 复盘)
> **下一步**: 业务方对每条 `🟡 待你定` 给出答复 → 出 v1 → 进 writing-plans
> **关联**:
> - 上游:`spec/_index.md §A` 占位条目 `check_in + [sub_type] [需扩展]`
> - 数据来源:7 轮并行 web search 结果(情绪 / 作息 / 饮水 / 服药 / 习惯 / 饮食 / 复盘)

---

## §0 文档立场

**目标**: 把 7 类打卡场景的"行业共识形态"整合成一份 Mindtap 可落地的需求 spec 草稿。

**关键立场**:
- 网络资料(Loop Habit Tracker / Apple Health / WaterMinder / 吃药啦 / 情绪 emoji 模式 / 复盘模板库等)被视为"客观现实参考",**不视为业务方决策**。
- 任何用户尚未明确表态的设计点,一律标 `🟡 待你定`,**不替用户做选择**。
- 涉及 schema 变更的部分(7 类需扩展的字段)用 `[需扩展]` 标记,**不在本文档落代码**。
- 本草稿仅描述业务规则与 UI 形态;具体 IPC 命令 / DB schema DDL / React 组件拆分,等 v1 定稿后由 writing-plans 阶段产出。

---

## §1 共享基础(7 类共性)

### §1.1 共享数据模型

**提议**:`check_in` 表扩展一个 `meta JSON` 字段,7 类各自填充专属数据(比"每类加 N 个独立字段"灵活,比"新建 7 张表"轻量)。`[需扩展]` schema 层面。

```
check_in(id, content, status, created_at, ...)  -- 现有,不动
  + sub_type  TEXT NOT NULL     -- 7 选 1: emotion | sleep | water | med | habit | food | review
  + meta      TEXT              -- JSON,sub_type 专属字段(见 §2-§8)
  + intensity INTEGER?          -- 可选,通用 1-10 / 1-5(情绪 / 习惯满意度等)
  + note      TEXT?             -- 可选自由文本(原 content 字段保留兼容)
  + tags      TEXT?             -- 可选,JSON 数组,标签
  + remind_at INTEGER?          -- 可选,关联提醒的本地时间戳
```

**🟡 待你定**:
- D1: `meta JSON` 方案 vs 每 sub_type 独立字段方案 — 后者类型安全但迁移成本高
- D2: `intensity` 字段对所有 sub_type 通用,还是仅部分(情绪 / 习惯)用 — 通用简单但语义模糊

### §1.2 共享 UI 入口

7 类统一走浮窗(StatusDot → 子场景 picker),不另开入口(避免主窗入口爆炸)。

**picker 形态建议**:
- 浮窗 StatusDot 长按 / 点击展开 → 7 个 emoji + 中文标签横向排列
- 选中 sub_type 后,展开对应的极简表单(1-3 字段)
- 一键提交 → 双写 `check_in` + `record` 视图

**🟡 待你定**:
- D3: 7 个全部启用,还是用户可勾选启用哪些?(推荐后者,避免一次性塞太满)

### §1.3 共享触发模型

**通用提醒框架**(服药最复杂,见 §5):

| 频率类型 | 适用场景 | 复杂度 |
|---|---|---|
| 每日定时 | 服药 / 饮水 / 作息 | 低 |
| 每 N 天 | 服药 / 习惯 | 低 |
| 每周 X 天 | 习惯 / 复盘 | 中 |
| 循环 N 天开 / M 天关 | 服药(避孕药等) | 高 |
| 阶梯增减 | 服药(剂量调整) | 高 |

**🟡 待你定**:
- D4: v1 是否做"服药阶梯定时"?还是先只做"每日定时 + 每 N 天 + 每周"?
- D5: 提醒走 OS 通知(Notification API),还是浮窗内嵌?(后者更轻但 OS 通知能跨窗口)

### §1.4 共享视图

| 视图 | 形态 | 数据源 |
|---|---|---|
| 全部记录 | `record(kind='check_in')` 跨 sub_type 列表,带 sub_type 标签 | record 视图 |
| 按 sub_type 过滤 | 同上 + 顶部 chip 过滤 | record 视图 |
| 日历热力图 | 按 sub_type 分组,每日格子按强度/次数着色 | 聚合 check_in |
| 详情 | 单条 check_in 完整内容 + meta 展开 | check_in |

---

## §2 情绪 (emotion)

### 数据
- 必备:`sub_type=emotion` + `meta.mood TEXT`(7-9 个 emoji 之一,如:开心/喜欢/平静/思考/焦虑/伤心/生气/犯困/庆祝)
- 可选:`intensity`(1-10 强度)、`note`(自由短文本)、`tags`(数组,如"工作"/"人际"/"健康")

### UI 入口
- 浮窗:选"情绪" → 9 个 emoji 横排 → 单击提交,可展开"加备注"
- 主窗历史:emoji + 时间 + note 预览

### 触发
- 可选每日 1-2 次提醒(晨 / 晚),默认关闭

### 边界
- 不做:情绪曲线图 / AI 情绪分析 / 社区分享(均超 MVP 范围)

### 🟡 待你定
- D6: emoji 枚举选哪几个?(推荐 7-9 个,见 §0 网络资料里的常见集合)
- D7: 是否支持"情绪自由文本"(不选 emoji 直接写文字)?
- D8: `intensity` 是否对情绪开放?(选 emoji 时一并选,还是只针对自由文本?)

---

## §3 作息 (sleep)

### 数据
- 必备:`sub_type=sleep` + `meta.bedtime TEXT`(HH:MM) + `meta.wake_time TEXT`(HH:MM)
- 派生:`meta.duration_min INTEGER`(自动 = wake - bed,跨午夜特殊处理)
- 可选:`meta.quality 1-5`(睡眠质量)、`meta.weekday_mask`(默认全选,可分平日/周末)

### UI 入口
- 浮窗:选"作息" → 双滑块(就寝 / 起床)或两个 time-picker → 提交
- 主窗历史:就寝 → 起床时间线,质量评分可选

### 触发
- 就寝前提醒 + 起床闹钟(可选)

### 边界
- 不做:自动睡眠监测(需穿戴设备)、睡眠分期分析、Apple Health 集成

### 🟡 待你定
- D9: 双滑块 vs 两个 time-picker?前者快速但精度低,后者精确但步骤多
- D10: `weekday_mask`(分平日 / 周末)是否 v1 必做?还是先固定每日?
- D11: `quality`(1-5 分)是否进入 v1?(国内 app 多不做,但 Apple Health 有)

---

## §4 饮水 (water)

### 数据
- 必备:`sub_type=water` + `meta.amount_ml INTEGER`(本次饮水量)
- 派生:每日累计 vs `meta.target_ml`(每日目标)
- 可选:从杯型预设中选(150ml 杯 / 250ml 杯 / 500ml 瓶 / 自定义)

### UI 入口
- 浮窗:选"饮水" → 杯型快捷按钮(150/250/500) + "+自定义" → 提交
- 主窗:进度环 + 今日累计 / 目标

### 触发
- 每 1-2h 提醒(睡眠时段静音,默认 22:00-08:00)
- 可关闭

### 边界
- 不做:智能水杯硬件联动、Apple Watch 同步、体重/性别目标自动计算(v1 用户手填目标即可)

### 🟡 待你定
- D12: 杯型预设选哪几档?(推荐 4 档:150 / 250 / 500 / 自定义)
- D13: `target_ml` 每日固定,还是用户可分日配置?
- D14: 是否做"饮品种类"(白水 / 茶 / 咖啡 / 含糖)?(影响"健康统计"语义)

---

## §5 服药 (med)

### 数据
- 必备:`sub_type=med` + `meta.drug_name TEXT` + `meta.dosage TEXT`(如 "1 片")
- 关联:每个药品 = 一条 "drug" 定义(check_in 的另一种 sub_type,或独立存 settings?)`[需扩展]` 架构决策
- 时间表:`meta.schedule JSON`(每日 / 每 N 天 / 每周 / 循环开-停 / 阶梯)
- 依从日志:每次实际服药 = 一条 check_in,关联到 drug_id,记录 `meta.taken_at INTEGER` + `meta.skipped BOOLEAN`

### UI 入口
- 浮窗:选"服药" → 药品列表 → 选药品 → 勾选时段 → 提交
- 主窗:今日药品时间表 + 漏服警告

### 触发
- 多时间点定时 + 漏服提醒("X 分钟后还没吃,提醒一下")

### 边界
- 不做:药品数据库 / 处方识别 / 与医院系统对接 / 多用户家庭共享(均超 MVP)

### 🟡 待你定
- D15: drug 是独立表(类似 `idea` 的轻量表),还是塞 `settings.json`?(独立表更灵活但 schema 多一)
- D16: 6 种提醒类型全做,还是先做 3 种(每日 / 每 N 天 / 每周)?(阶梯 + 循环开停是天花板)
- D17: "漏服"是自动判断(`now > schedule_time + 30min` 还是手工勾选"我跳过了")?

---

## §6 习惯 (habit)

### 数据
- **两层结构**(与现有 check_in 不同):
  - 第一层:`habit` 目标定义(name + 频率 + 目标次数 + 提醒时间)`[需扩展]` 新表
  - 第二层:`check_in(sub_type=habit, meta.habit_id)` 打卡记录
- 必备:`meta.habit_id INTEGER` + `meta.value INTEGER`(本次值,可 1 表示完成 / 大于 1 表示次数)

### UI 入口
- 浮窗:选"习惯" → 当前所有 habit 列表 → 圆圈勾选
- 主窗:每个 habit 一行 + 日历热力图 + streak 计数 + 最佳连续

### 触发
- 每日定时提醒(每个 habit 独立配置)

### 边界
- 不做:habit 关联(做完 A 再做 B)、成就系统、社交排行榜、惩罚机制(放弃记录)

### 🟡 待你定
- D18: `habit` 独立表 vs check_in meta 里存定义?(独立表清晰但 schema 多一)
- D19: streak 强制显示,还是用户可关(避免"中断焦虑")?
- D20: 是否记录"放弃" / "跳过"?(反例参考:Loop Habit Tracker 不区分,允许放弃程序反其道)

---

## §7 饮食 (food)

### 数据
- 必备:`sub_type=food` + `meta.meal TEXT`(早 / 午 / 晚 / 加餐)
- 食物项:`meta.items JSON` 数组,每项:`{ name TEXT, amount TEXT?, calorie INTEGER? }`
- 派生:每日卡路里小计

### UI 入口
- 浮窗:选"饮食" → 选餐次 → 输入食物名(可选搜本地缓存) → 提交
- 主窗:今日 4 餐时间线 + 每日卡路里

### 触发
- 早 / 午 / 晚定时提醒

### 边界
- **不做**:食物数据库 / 营养分析 / 卡路里目标 / 拍照识别(价值在数据库,纯记录端无差异;MVP 大概率超范围)

### 🟡 待你定
- D21: 饮食 v1 是否纳入?还是 v2?(网络资料显示这块价值靠食物库,纯记录没差异)
- D22: `items` 里每项必须填卡路里,还是可选?(后者轻但统计没意义)
- D23: 食物名是自由文本,还是用户先建一个本地小库(可选)?

---

## §8 复盘 (review)

### 数据
- 必备:`sub_type=review` + `meta.template TEXT`(模板标识,如 "日三件事" / "晨间日记" / "KPT")
- 模板字段:`meta.fields JSON`,如 `{"achievements": [...], "reflections": "...", "tomorrow": "..."}`
- 可选:关联当日情绪(`meta.mood_link_id INTEGER`)

### UI 入口
- 浮窗:选"复盘" → 选模板 → 模板字段表单 → 提交
- 主窗:历史复盘卡片列表 + 模板库管理

### 触发
- 晚间定时提醒(默认 21:00)

### 边界
- 不做:AI 自动生成复盘、模板分享社区、跨日聚合视图

### 🟡 待你定
- D24: v1 提供几个模板?固定 3 个(晨间 / 日三件事 / KPT)还是用户自定义?(自定义 = 又一层抽象)
- D25: 模板是 settings 里写死,还是 check_in meta 里存字段定义?(后者灵活但 DB 杂)
- D26: 是否支持关联当日情绪 / 任务?

---

## §9 决策日志 / 待你拍板汇总

### 架构层(影响 schema)
| 编号 | 决策 | 选项 |
|---|---|---|
| D1 | `meta JSON` vs 独立字段 | (a) JSON 灵活 / (b) 独立字段类型安全 |
| D2 | `intensity` 通用 vs 部分 | (a) 通用简单 / (b) 部分语义清晰 |
| D15 | `drug` 独立表 vs settings | (a) 独立表 / (b) settings |
| D18 | `habit` 独立表 vs meta | (a) 独立表 / (b) meta |

### 范围层(影响 v1 包含哪些)
| 编号 | 决策 | 选项 |
|---|---|---|
| D3 | 7 类全启用 vs 用户勾选 | (a) 全启用 / (b) 用户勾选 |
| D4 | 提醒类型 v1 范围 | (a) 只 3 种基础 / (b) 6 种全做 |
| D5 | 提醒走 OS 还是浮窗 | (a) OS Notification / (b) 浮窗内嵌 |
| D21 | 饮食是否进 v1 | (a) 进 / (b) 留 v2 |
| D24 | 复盘模板 v1 数量 | (a) 固定 3 个 / (b) 用户可自定义 |

### UI 层(影响交互形态)
| 编号 | 决策 | 选项 |
|---|---|---|
| D6 | 情绪 emoji 枚举 | 列 7-9 个 |
| D7 | 情绪自由文本 | (a) 支持 / (b) 强制选 emoji |
| D8 | 情绪 intensity | (a) 支持 / (b) 关闭 |
| D9 | 作息 time-picker | (a) 双滑块 / (b) 两 time-picker |
| D10 | 作息 weekday_mask | (a) v1 必做 / (b) 固定每日 |
| D11 | 作息 quality | (a) 进入 / (b) v1 不做 |
| D12 | 饮水杯型预设 | 列 4 档 |
| D13 | 饮水 target 分日 | (a) 固定 / (b) 分日 |
| D14 | 饮品种类 | (a) 仅水 / (b) 区分茶/咖啡等 |
| D16 | 服药提醒类型 | (a) 3 种 / (b) 6 种 |
| D17 | 服药漏服判断 | (a) 自动超时 / (b) 手工勾 |
| D19 | 习惯 streak 强制 | (a) 强制显示 / (b) 可关 |
| D20 | 习惯放弃记录 | (a) 记录 / (b) 不区分 |
| D22 | 饮食 calorie | (a) 必填 / (b) 可选 |
| D23 | 饮食食物库 | (a) 自由文本 / (b) 本地小库 |
| D25 | 复盘模板存储 | (a) settings / (b) meta |
| D26 | 复盘关联情绪 | (a) 关联 / (b) 独立 |

---

## §10 不在本 spec 范围(明示排除)

- 跨 sub_type 统计聚合(每月 7 类总打卡次数图等)— 单 sub_type 视图已覆盖,跨视图留 v2
- 语音 / 图片附件(`[需扩展]` IPC + 权限)— 见 `spec/_index.md §C`,独立 spec 跟进
- 数据导入 / 导出 — 见 `spec/_index.md §6 设置中心 · 数据节`,独立 spec
- 跨设备同步 / 云备份 — 本地 SQLite 原则不变
- 多用户 / 家庭共享 — 单用户产品定位不变

---

## §11 引用资料(网络搜索汇总)

| 场景 | 关键参考 | 备注 |
|---|---|---|
| 情绪 | [Flutter Emoji 选择器](https://blog.csdn.net/2302_80329073/article/details/161432161) | 9 种情绪枚举代码级示范 |
| 作息 | [Apple Health 睡眠定时](https://support.apple.com/zh-cn/guide/iphone/iph304a683a0/ios) | 双滑块 + 助眠 + 目标三段模型 |
| 饮水 | [WaterMinder / 喝水时间](http://www.ddooo.com/softdown/50749.htm) | 杯型预设 + 目标拆分 6-8 时段 |
| 服药 | [吃药啦](https://itunes.apple.com/cn/app/id1503146809) / [药点点](https://apps.apple.com/cn/app/id6746477348) | 6 种提醒类型 + 依从性日志 |
| 习惯 | [Loop Habit Tracker](https://blog.csdn.net/gitblog_00518/article/details/160980905) | 开源标杆,字段 / 视图 / 触发全可参考 |
| 习惯 | [允许放弃的自愈程序](https://blog.csdn.net/2301_82202864/article/details/161392858) | 反例:streak 焦虑,放弃当一等公民 |
| 饮食 | [黑马健康饮食记录](https://blog.csdn.net/2301_79814091/article/details/139633433) | 餐次分段 + 食物 PO 模型 |
| 复盘 | [日周月年复盘模板](https://zhuanlan.zhihu.com/p/596782008) | 多模板可选 |
| 复盘 | [复盘五模板 PDF](https://wendang.xuehi.cn/doc/h0cy70kyk02a0099odja4c17o1cgkdn9.html) | KPT / AAR / 6 步法 / 晨间 |

---

## §12 下一步

1. **业务方过一遍 §9 决策表** → 对每条 D-N 给答案 → 更新本文档为 v1
2. v1 定稿后 → 用 `writing-plans` skill 拆实施步骤
3. 实施走 TDD 硬约束(项目 CLAUDE.md 规定)
4. 涉及 schema 变更的 D1 / D15 / D18 等,需另起 "schema migration spec" 评估向后兼容