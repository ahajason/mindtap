# 复盘打卡 探索证据表

> Created: 2026-06-20
> Task type: full
> Target spec: spec/checkin-subtypes/review.md

## 维度 1：用户行为

### 已有证据
- 网络资料:[日周月年复盘模板](https://zhuanlan.zhihu.com/p/596782008) — 多模板可选
- 网络资料:[复盘五模板 PDF](https://wendang.xuehi.cn/doc/h0cy70kyk02a0099odja4c17o1cgkdn9.html) — KPT / AAR / 6 步法 / 晨间
- 网络资料:[学生每日高效复盘模板](https://blog.csdn.net/qq_34823185/article/details/155125853) — 快照+任务+高光三段

### 明确缺口
- Mindtap 项目内无现有复盘子场景实现

## 维度 2：数据

### 已有证据
- check_in 现有字段(见 `src-tauri/src/db/check_in.rs`)
- 网络资料共识:模板 + 字段 + 提交时间

### 明确缺口
- 模板数量与具体字段定义

## 维度 3：流程

### 已有证据
- 网络资料典型流程:主窗选模板 + 填字段 + 卡片列表
- 多模板切换

### 明确缺口
- v1 是否支持用户自定义模板

## 维度 4：边界

### 已有证据
- `spec/_index.md` §A 占位
- 网络资料共识:不做 AI 自动生成 / 模板社区

### 明确缺口
- 无

## 维度 5：不确定项

### 三方冲突
- 无

### 已问用户 (closed loop)
- 无

### 通用规则 (no question needed)
- 模板为系统预定义,字段 3-7 个
- 字段分短文本与长文本两类
- 卡片列表按提交时间倒序
- 删除不可恢复

### 待业务方确认 (small business impact)
- v1 提供几个模板(本 spec 给"晨间日记/日三件事/KPT"作通用规则,业务方可调整)
- 用户自定义模板是否进入 v1(本 spec 选择不做,留 v2)

### 仍待澄清 (large business impact, blocking)
- 无