# Changelog

发布记录正式档存于 `docs/reports/`,按 SemVer-mindtap `V<MAJOR>.<MINOR>.<PATCH>` 命名(见 `docs/governance/versioning-rule.md` §一 + §四):

- **MINOR release notes**:`docs/reports/v<MAJOR>.<MINOR>-release-notes.md`
- **PATCH release notes**:`docs/reports/v<MAJOR>.<MINOR>.<PATCH>-release-notes.md`
- **MINOR retro**:`docs/reports/v<MAJOR>.<MINOR>-retrospective.md`(阶段收尾沉淀反模式 + 下 MINOR 输入)
- **无 PATCH retro**(按当前 governance §四,仅 MINOR 收尾时生成 retro;PATCH bug fix 不单开 retro,合入下个 MINOR 收尾时)
- **未交付/计划文件**:标 ⛔ banner(如 `docs/reports/v0.2.1-release-notes.md`),不视作已发布版本。

## 当前已发布版本(2026-07-13)

| 版本 | 发布日 | 范围 |
|---|---|---|
| V0.2.0.12 PATCH | 2026-07-13 | 浮窗 4 对象并行恢复 V1.0 archive 设计(transparent + Rust 原生菜单 + StatusDot inline + focus: false) |
| V0.2.0.10 PATCH | 2026-07-13 | (已被 V0.2.0.12 替代,仅修黑边局部根因) |
| V0.2.0.11 PATCH | 2026-07-13 | (已被 V0.2.0.12 替代,A/B 段基于 HTML React ContextMenu 误前提被回退) |
| V0.2.0      | 2026-07-12 | 浮窗最小可用(Windows 11 锁平台;折叠 320×36 + 展开 360×280 + Ctrl+Shift+Space + SQLite timer_session) |
| V0.1.6      | 2026-06-22 | Style Guide 设计系统(11 UI + Tailwind tokens + Liquid Glass + vitest,无业务) |

详见 `docs/reports/` 完整 release notes。

## 增量维护规则

任何新的 PATCH / MINOR 发布时,同步 bump:
1. `package.json` `version` 字段
2. `src-tauri/Cargo.toml` `[package]` `version` 字段
3. `src-tauri/tauri.conf.json` `version` 字段
4. 上面 4-segment 版本号表(本文件)

任一未同步 → 视为发版硬约束违反(见 `docs/governance/versioning-rule.md` §六 约束 #6)。
