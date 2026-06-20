# check_in 子场景扩展 · 主题规格

> 7 个 check_in 子场景(情绪 / 作息 / 饮水 / 服药 / 习惯 / 饮食 / 复盘)的设计规格,含共享基础 + 子场景专属 + 跨场景策略。

## 文件结构

| 路径 | 用途 |
|---|---|
| `emotion.md` | 情绪打卡的专属功能与规则 |
| `sleep.md` | 作息打卡的专属功能与规则 |
| `water.md` | 饮水打卡的专属功能与规则 |
| `med.md` | 服药打卡的专属功能与规则 |
| `habit.md` | 习惯打卡的专属功能与规则 |
| `food.md` | 饮食打卡的专属功能与规则 |
| `review.md` | 复盘打卡的专属功能与规则 |
| `_cross/foundation.md` | 共享数据模型 / 浮窗入口 / 统一记录视图 |
| `_cross/privacy.md` | 跨子场景隐私策略(启动锁 / 浮窗 note 隐藏 / 导出 note 范围) |
| `_cross/timezone.md` | 自然日 / DST / 跨时区处理 |
| `_cross/notifications.md` | 安静时段 / 同日合并 / 全局 DND |

## 上下游关系

- 上游入口:浮窗 StatusDot(点击展开子场景 picker)
- 下游视图:主窗"全部记录"列表 + 子场景过滤
- 数据库:check_in 记录 + 统一记录视图双写(详见 `_cross/foundation.md §2`)

## 状态

- v1.0 草稿,7 scene + 4 cross + 1 README = 12 文件
- 自检通过(specs-writer 7-item §4)
- 待用户审
