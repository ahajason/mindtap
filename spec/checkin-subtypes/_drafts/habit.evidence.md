# 习惯打卡 探索证据表

> Created: 2026-06-20
> Task type: full
> Target spec: spec/checkin-subtypes/habit.md

## 维度 1：用户行为

### 已有证据
- 网络资料:[Loop Habit Tracker 开源标杆](https://blog.csdn.net/gitblog_00518/article/details/160980905) — 日历热力图 + streak + 最佳连续
- 网络资料:[允许放弃的自愈程序](https://blog.csdn.net/2301_82202864/article/details/161392858) — 反例参考,把放弃当一等公民
- 网络资料:[Streaks Android](https://www.docin.com/p-2146588381.html) — 21 天理论 + 简单模型

### 明确缺口
- Mindtap 项目内无现有习惯子场景实现

## 维度 2：数据

### 已有证据
- check_in 现有字段(见 `src-tauri/src/db/check_in.rs`)
- 网络资料共识:两层结构 — habit 目标 + 打卡记录

### 明确缺口
- habit 是否独立表 vs check_in meta

## 维度 3：流程

### 已有证据
- 网络资料典型流程:主窗配 habit + 每日勾选 + 日历热力图 + streak
- Loop 模型:每日完成 + 连续天数

### 明确缺口
- v1 是否做"跳过"机制

## 维度 4：边界

### 已有证据
- `spec/_index.md` §A 占位
- 网络资料共识:不做习惯关联 / 成就系统 / 社交

### 明确缺口
- 无

## 维度 5：不确定项

### 三方冲突
- 无

### 已问用户 (closed loop)
- 无

### 通用规则 (no question needed)
- 两层结构:habit 配置 + 打卡记录(行业共识)
- 每日仅可勾选一次,二次点击取消
- 连续天数按"连续完成日"计算,中断从 0 重新累计
- 删除 habit 保留历史记录

### 待业务方确认 (small business impact)
- habit 是否独立表(本 spec 选择不强制独立表,作为 v1 简化版;实际可能需要在 v1.1 升独立表)
- "跳过"机制是否进入 v1(本 spec 选择引入,作为反 streak 焦虑的设计)

### 仍待澄清 (large business impact, blocking)
- 无