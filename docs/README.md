# docs/

项目文档根目录。按**类型**组织 active 内容;版本进 `archive/`。

## 结构

| 目录 | 用途 |
|---|---|
| `design/` | 项目自有设计(design system 等) |
| `material/` | 外部参考材料(Apple HIG / Liquid Glass / SwiftUI / WWDC) |
| `plans/` | 实施 plans |
| `specs/` | 实施 specs |
| `reports/` | 阶段性报告 |
| `archive/` | 已交付版本的完整沙盒 |

## archive/

已完成版本的项目沙盒。结构:`archive/<version>/`。

- `archive/v1.0/` — V1.0 完整沙盒(已交付)

## 命名约定

- plans/specs/reports 文件名:`YYYY-MM-DD-<topic>.md`
- archive 版本目录:`archive/v<major>.<minor>/`