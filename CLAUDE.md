## What this is

轻念 · Mindtap — 极简记录桌面应用。Tauri 2 (Rust) + React 19 + TypeScript + Vite 7。本地 SQLite，无云同步。

### 设计语言

所有 UI 改动必须参考 `docs/design/glassic-ui-spec.md`（项目自有 Liquid Glass 视觉 spec）。组件落地策略：shadcn 源码拷 + Tailwind token + Radix primitive。**不要**自创颜色 / 阴影 / 模糊 token——查 spec 拿现有值。

### 文件归位

| 内容类型 | 去处 |
|---|---|
| 新功能「做什么」 | `docs/specs/YYYY-MM-DD-<topic>-design.md` |
| 新功能「怎么做」 | `docs/plans/YYYY-MM-DD-<topic>.md` |
| 阶段交付报告 | `docs/reports/` |
| 已交付版本的完整沙盒 | `docs/archive/v<version>/` |

## 文档与规划文件

按**类型**组织(active 内容),版本进 `archive/`。详见 [`docs/README.md`](docs/README.md)。

- `docs/design/` — 项目自有设计(design system 等)。
- `docs/material/apple/` — Apple HIG Materials 参考。
- `docs/plans/` — 实施 plans。
- `docs/specs/` — 实施 specs。
- `docs/reports/` — 阶段性报告。
- `docs/archive/v1.0/` — V1.0 完整沙盒(已交付)。
- `.planning/YYYY-MM-DD-<topic>/` — 单次规划会话产物(task_plan / progress / findings),属于过程文档。
