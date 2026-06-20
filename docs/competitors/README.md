# competitors/

竞品与参考项目的本地沙盒。**仅供设计/工程参考,不引入代码,不上游同步**。

## 用途

| 场景 | 用什么 |
|---|---|
| 写新 spec 前,看同赛道产品怎么建模、怎么画 UI、怎么拆状态机 | `_analysis.md` |
| 排查"这个交互/状态为什么长这样"的历史脉络 | `source/` 里的原始代码 |
| 给团队做横向对比、汇报、决策参考 | 每个子目录的 `_analysis.md` 一图速览表 |

## Entry 模板

每个竞品一个子目录,结构固定:

```text
<product-slug>/
├── _analysis.md    # 分析文档(下划线前缀:字母排序始终置顶)
└── source/         # git clone --depth 1 的源仓库
```

### 命名约定

| 文件/目录 | 约定 | 例子 |
|---|---|---|
| 子目录 | `<product-slug>/`,kebab-case | `taskisland/`、`things-3/` |
| 分析文档 | `_analysis.md`,**下划线前缀**保证排序置顶 | `_analysis.md` |
| 源仓库 | `source/`,浅克隆 (`--depth 1`) | `source/` |

### `_analysis.md` 必含

按本仓库约定采用四段式:

1. **一图速览表**——能力矩阵,行=维度,列=双方,让读者 30 秒内抓到差异
2. **逐条理由**——每个维度一段,讲清楚"它怎么做的、我们怎么做、差距在哪"
3. **统计**——行数、字段数、commit 数等可量化数据
4. **跨上下文复检**——显式列"未改的 + 为什么",防止沉默保留

## 注意事项

- `source/` 是上游代码的快照,**禁止直接编辑**(改了就没法 diff 后续版本)
- 引用源码位置用 `source/<相对路径>:<行号>`,例如 `source/Sources/TaskIslandCore/TaskStore.swift:343`
- `_analysis.md` 不是上游归档,是本仓库的产物,按 `docs/` 常规 docs 流程维护
- 新增竞品前先在 GitHub 验证**唯一性**——同名项目众多,确认描述(口号/功能/平台)再克隆

## 当前收录

| Slug | 产品 | 平台 | 收录日期 | 分析文档 |
|---|---|---|---|---|
| `taskisland` | 任务岛 TaskIsland | macOS (SwiftUI) | 2026-06-20 | [taskisland/_analysis.md](taskisland/_analysis.md) |
