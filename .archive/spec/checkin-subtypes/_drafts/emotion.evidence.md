# 情绪打卡 探索证据表

> Created: 2026-06-20
> Task type: full (first scene of new topic — check_in sub_types)
> Target spec: spec/checkin-subtypes/emotion.md

## 维度 1：用户行为

### 已有证据
- 网络资料:[Flutter Emoji 选择器实战](https://blog.csdn.net/2302_80329073/article/details/161432161) — 9 种情绪枚举(开心/喜欢/伤心/生气/焦虑/犯困/平静/思考/庆祝)
- 网络资料:[NAJI 情绪记录 APP](https://github.com/Stefaray/NAJI_AppVersion) — emoji + 时间 + note 三段结构
- 项目约定:浮窗快速记录走 StatusDot 入口,见 `docs/specs/2026-06-14-浮动窗口快速记录-design.md`

### 明确缺口
- Mindtap 项目内无现有情绪子场景实现 — 全新场景,无源码可对照

## 维度 2：数据

### 已有证据
- check_in 现有字段:id / content / status / created_at / archived_at(见 `src-tauri/src/db/check_in.rs`)
- 网络资料共识:emoji 枚举 + 可选 note + 可选 intensity

### 明确缺口
- emoji 枚举具体值集合(行业 7-9 种,具体取舍待业务方确认)
- intensity 字段是否引入

## 维度 3：流程

### 已有证据
- 网络资料典型流程:浮窗点 emoji → 一键提交 → 列表/日历查看
- 项目约定:check_in 提交后双写统一记录视图(见 `src-tauri/src/db/check_in.rs` 与 `record.rs`)

### 明确缺口
- 浮窗 7 子场景并存时的 picker 形态(横排 emoji / 下拉 / 长按展开)

## 维度 4：边界

### 已有证据
- `spec/_index.md` §A:check_in + [sub_type] [需扩展] 占位条目
- 网络资料共识:不做情绪分析 / 曲线图 / 社交

### 明确缺口
- 无

## 维度 5：不确定项

### 三方冲突
- 无(项目无现有实现,无三方对照)

### 已问用户 (closed loop)
- 无

### 通用规则 (no question needed)
- emoji 集合 = 预定义枚举,行业 7-9 种,具体取值集合已写入 spec R-1.1
- 提交后记录出现在列表顶部 = 默认时间倒序排列
- 删除操作不可恢复 = 行业惯例

### 待业务方确认 (small business impact)
- emoji 具体取值集合(本 spec R-1.1 给行业常见集合作通用规则,业务方可调整)
- intensity 字段是否引入(本 spec 选择不强制引入,留业务方后续决定)

### 仍待澄清 (large business impact, blocking)
- 无