# 作息打卡 探索证据表

> Created: 2026-06-20
> Task type: full
> Target spec: spec/checkin-subtypes/sleep.md

## 维度 1：用户行为

### 已有证据
- 网络资料:[Apple Health 睡眠定时](https://support.apple.com/zh-cn/guide/iphone/iph304a683a0/ios) — 双滑块 + 助眠 + 目标三段模型
- 网络资料:[Smart Nora 睡眠监测合集](https://blog.csdn.net/Forever_wj/article/details/120741966) — 12 款睡眠 app 设计案例
- 网络资料:[睡觉宝](https://m.tujixiazai.com/biaozhunguifan/v328868.html) — 制定高效作息大师
- 项目约定:浮窗快速记录走 StatusDot 入口

### 明确缺口
- Mindtap 项目内无现有作息子场景实现 — 全新场景

## 维度 2：数据

### 已有证据
- check_in 现有字段:id / content / status / created_at / archived_at(见 `src-tauri/src/db/check_in.rs`)
- 网络资料共识:就寝时间 + 起床时间 + 派生睡眠时长 + 可选质量评分

### 明确缺口
- 质量评分(1-5)是否引入(网络资料两派:Apple Health 有,国内 app 多无)

## 维度 3：流程

### 已有证据
- 网络资料典型流程:浮窗选时间 → 一键提交 → 时间线查看
- Apple Health 模型:定时 + 助眠 + 睡眠目标

### 明确缺口
- v1 是否做定时(就寝提醒 + 起床闹钟)

## 维度 4：边界

### 已有证据
- `spec/_index.md` §A:check_in + [sub_type] [需扩展] 占位条目
- 网络资料共识:不做自动睡眠监测 / 分期分析

### 明确缺口
- 无

## 维度 5：不确定项

### 三方冲突
- 无

### 已问用户 (closed loop)
- 无

### 通用规则 (no question needed)
- 双 time-picker 而非双滑块(精度优先;Apple Health 双滑块是渐进式升级)
- 就寝与起床均必填(跨午夜由系统计算处理)
- 睡眠时长 = 自动派生,不需用户填
- 删除不可恢复

### 待业务方确认 (small business impact)
- 质量评分 1-5 是否引入(本 spec 选择不引入,作为 v2 选项)
- 定时/闹钟是否进入 v1(本 spec 选择不做,留 v2)

### 仍待澄清 (large business impact, blocking)
- 无