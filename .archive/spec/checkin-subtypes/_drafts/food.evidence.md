# 饮食打卡 探索证据表

> Created: 2026-06-20
> Task type: full
> Target spec: spec/checkin-subtypes/food.md

## 维度 1：用户行为

### 已有证据
- 网络资料:[黑马健康饮食记录](https://blog.csdn.net/2301_79814091/article/details/139633433) — 餐次分段 + 食物 PO 模型
- 网络资料:[膳食日记 app](https://m.duote.com/android/1121277.html) — 分类为主食/主菜/配菜
- 网络资料:[饮食记录业务层开发](https://blog.csdn.net/m0_74318513/article/details/139883537) — RecordType/RecordVO/RecordPO 三层结构

### 明确缺口
- Mindtap 项目内无现有饮食子场景实现

## 维度 2：数据

### 已有证据
- check_in 现有字段(见 `src-tauri/src/db/check_in.rs`)
- 网络资料共识:餐次 + 食物项(名 + 量 + 估算卡路里)

### 明确缺口
- 卡路里是否必填(网络资料两派)

## 维度 3：流程

### 已有证据
- 网络资料典型流程:主窗选餐次 + 加条目 + 时间线
- 黑马健康:餐次分段列表

### 明确缺口
- v1 是否做定时提醒(早午晚)

## 维度 4：边界

### 已有证据
- `spec/_index.md` §A 占位
- 网络资料共识:食物数据库价值高,纯记录端无差异

### 明确缺口
- v1 是否纳入饮食(网络资料显示纯记录价值低)

## 维度 5：不确定项

### 三方冲突
- 无

### 已问用户 (closed loop)
- 无

### 通用规则 (no question needed)
- 餐次分早/午/晚/加餐四档
- 食物条目 = 名(必填)+ 量(可选)+ 卡路里(可选)
- 卡路里合计 = 当日所有已填卡路里的合计
- 删除不可恢复

### 待业务方确认 (small business impact)
- v1 是否纳入饮食(本 spec 选择纳入,作为基础记录场景之一;业务方后续可决定是否降级到 v2)
- 卡路里是否必填(本 spec 选择可选,以降低录入门槛)

### 仍待澄清 (large business impact, blocking)
- 无