# References — 外部参考 + 我们的分析

> `source/` 子目录是**上游代码快照**,只读参考用,不入仓(见 `.gitignore` L69)。
> 本目录所有内容不入仓分析,但可以引用。

## 当前引用

- `taskisland.md` — 我们对 TaskIsland 的分析(active 入口,V1.0 视角,V0.1.0 暂沿用)
- `source/taskisland/` — TaskIsland 完整上游快照(github.com/howardrock88/TaskIsland),git ignore

## 使用规则

- ✅ 可: 查阅我们的分析 + 上游源码/资源/文档
- ❌ 不可: 编辑 `source/` 下任何文件
- ❌ 不可: 复制 source/ 里的样式/色值/参数到 active 规范(走 `_design/_references/`)
- ❌ 不可: 提交 source/ 的变更(在 ignore 内)

## 维护

- 重拉 taskisland: `rm -rf source/taskisland && git clone git@github.com:howardrock88/TaskIsland.git source/taskisland`
- 重写我们的分析: 直接编辑 `taskisland.md`(.archive 那边是 V1.0 历史快照,不动)