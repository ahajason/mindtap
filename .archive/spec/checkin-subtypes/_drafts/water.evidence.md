# 饮水打卡 探索证据表

> Created: 2026-06-20
> Task type: full
> Target spec: spec/checkin-subtypes/water.md

## 维度 1：用户行为

### 已有证据
- 网络资料:[WaterMinder](https://baike.baidu.com/item/WaterMinder/23190783) — 杯型预设 + 进度小人儿可视化
- 网络资料:[喝水时间](http://www.ddooo.com/softdown/50749.htm) — 按性别/体重算目标 + 拆分 6-8 时段
- 网络资料:[PyQt5 智能喝水提醒助手](https://blog.csdn.net/lwcwam/article/details/145347970) — 可视化进度 + 自定义间隔
- 项目约定:浮窗快速记录入口

### 明确缺口
- Mindtap 项目内无现有饮水子场景实现

## 维度 2：数据

### 已有证据
- check_in 现有字段:id / content / status / created_at(见 `src-tauri/src/db/check_in.rs`)
- 网络资料共识:饮水量(ml)+ 时间戳 + 每日目标

### 明确缺口
- 杯型预设具体档位

## 维度 3：流程

### 已有证据
- 网络资料典型流程:浮窗选杯型 → 一键提交 → 进度环查看累计
- 喝水时间:智能计划 + 自定义提醒

### 明确缺口
- v1 是否做定时提醒(每 1-2h 提醒)

## 维度 4：边界

### 已有证据
- `spec/_index.md` §A 占位
- 网络资料共识:不做硬件联动 / Apple Watch

### 明确缺口
- 无

## 维度 5：不确定项

### 三方冲突
- 无

### 已问用户 (closed loop)
- 无

### 通用规则 (no question needed)
- 杯型预设 150/250/500 ml 三档(行业最常见)
- 自定义入口 ml 数值输入
- 进度环满格 = 累计 ≥ 目标
- 删除不可恢复

### 待业务方确认 (small business impact)
- 杯型预设档位是否调整(本 spec 给 3 档作通用规则)
- 定时提醒是否进入 v1(本 spec 选择不做,留 v2)

### 仍待澄清 (large business impact, blocking)
- 无