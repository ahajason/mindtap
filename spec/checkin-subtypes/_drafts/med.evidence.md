# 服药打卡 探索证据表

> Created: 2026-06-20
> Task type: full
> Target spec: spec/checkin-subtypes/med.md

## 维度 1：用户行为

### 已有证据
- 网络资料:[吃药啦](https://itunes.apple.com/cn/app/id1503146809) — 每日/每天/每 n 天模式
- 网络资料:[药点点](https://apps.apple.com/cn/app/id6746477348) — 6 种提醒类型(阶梯/循环开停/周期等)
- 网络资料:[老人服药提醒 APP 字段](https://blog.csdn.net/2401_89210028/article/details/145815376) — 字段最完整(药名/用途/剂量/时间/方式/频率)
- 网络资料:[服药提醒 APP 使用流程](https://jingyan.baidu.com/article/2f9b480db97efa41cb6cc2f9.html) — 药品管理 + 服用计划两步流程

### 明确缺口
- Mindtap 项目内无现有服药子场景实现

## 维度 2：数据

### 已有证据
- check_in 现有字段(见 `src-tauri/src/db/check_in.rs`)
- 网络资料共识:药品名 + 剂量 + 时间表 + 依从性日志

### 明确缺口
- drug 是否独立表(check_in 关联 drug_id) vs 全部塞 check_in meta

## 维度 3：流程

### 已有证据
- 网络资料典型流程:主窗配药 + 浮窗勾服用
- 药点点:灵活调度 + 依从性统计

### 明确缺口
- v1 支持哪几种提醒类型

## 维度 4：边界

### 已有证据
- `spec/_index.md` §A 占位
- 网络资料共识:不做药品数据库 / 医院系统 / 多用户家庭

### 明确缺口
- 无

## 维度 5：不确定项

### 三方冲突
- 无

### 已问用户 (closed loop)
- 无

### 通用规则 (no question needed)
- v1 支持 3 种重复模式:每日定时、每 N 天、每周固定日(行业基础)
- 药品配置走主窗,服用勾选走浮窗(配置 vs 行动分离)
- 依从性日志 = check_in,关联 drug_id 与时点
- 跳过与服用互斥

### 待业务方确认 (small business impact)
- drug 是否独立表(本 spec 选择用 check_in meta 承载 drug_id + 时点,作为通用规则的简化版)
- 阶梯 / 循环开停是否进入 v1(本 spec 选择不做,留 v2)

### 仍待澄清 (large business impact, blocking)
- 无