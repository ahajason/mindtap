# 版本号治理规则(Versioning Rule)

> **生效日期**: 2026-07-13
> **触发**: V0.2.3~V0.2.8 共 6 个版本号全是 bug fix patch,版本号失去 feature 语义;agent 无法根据版本号判断"我在开发什么"
> **状态**: ✅ 已立(rule,非 task)

## 一、版本号语义(SemVer 适配)

格式:`V<MAJOR>.<MINOR>.<PATCH>`(`MAJOR=0`,所以 MINOR 即"功能切片")

| 段 | 何时 bump | 例 |
|---|---|---|
| **MAJOR** | 1.0 之前不 bump(永远 0) | 0 → 1(产品上线) |
| **MINOR** | 新 feature 切片落地(过 L3 实测验收) | 0.2 → 0.3 |
| **PATCH** | 同一 feature 范围内的 bug fix | 0.2.0 → 0.2.0.1 |

### 关键约定

1. **每个 MINOR 版本 = 一个完整 feature 切片**,有独立 PRD + Tech + Design + Plan + Reports
2. **PATCH 版本 = 该 MINOR 范围内的 bug fix**,不开新 PRD,只开 task
3. **跨 MINOR 的 bug → 不属于任何 PATCH**,要么进新 MINOR,要么修复时扩展原 MINOR 的范围

## 二、bug 归属判断流程(每个 issue 出现时必走)

```
发现 bug
  ↓
问:这个 bug 的"代码/UI/数据/事件"在哪一层 feature 的范围内?
  │
  ├─ 读对应版本的 docs/<需求>/tasks/<name>/task.md 「范围边界」段
  │
  ├─ "在范围内" → 本 MINOR 的 PATCH
  │   └─ 版本号:V<MINOR>.0.<N+1>(N 是该 MINOR 已发的 PATCH 数)
  │
  └─ "不在范围内" → 不归本 MINOR
      ├─ 是另一个 MINOR 范围内的 → 那个 MINOR 的 PATCH
      └─ 是跨 MINOR 的 → 重新评估归属,可能需要新 MINOR
  ↓
开 docs/<需求>/tasks/<name>/task.md
  ↓
按 L1 + L2 + L3 三层验证修
  ↓
修完跑完 3 层,合 develop,发 release notes
```

### 判断不出来时

**反向问**:"修这个 bug 不修,对应 task 的 Done when 哪一条会 FAIL?"
- 能定位到任一条 → 在范围内
- 定位不到 → 不在范围内,需要新 MINOR 或归其他 MINOR

## 三、当前版本归属历史(V0.2 项目)

按本规则回看,V0.2.3~V0.2.8 都应回退为 V0.2.0.x PATCH(因为全是 V0.2.0 surface 的回归):

| 旧版本号 | 实际 bug | 应归属版本 | 命名 |
|---|---|---|---|
| V0.2.3 | (V0.2.0 surface bug) | V0.2.0.1 | `v0.2.0.1-fix-<topic>` |
| V0.2.4 | capability windows 黑边 | V0.2.0.2 | `v0.2.0.2-fix-black-border` |
| V0.2.5 | setFocusable 闪退 + status dot | V0.2.0.3 | `v0.2.0.3-fix-setfocusable-panic` |
| V0.2.6 | 13 commit 浮窗修复(部分 commit 撒谎) | V0.2.0.4~0.5 | 拆 2 个 PATCH |
| V0.2.7 | 5 bug 真根因 | V0.2.0.5~0.6 | 拆 2 个 PATCH(已含 V0.2.6 漏修) |
| V0.2.8 Issue A [V0.2.0 误导] | 右键被折叠态根 div 抢占 | V0.2.0.6 | `v0.2.0.6-fix-contextmenu-right-click` | (V0.2.0.6 整文件基于 HTML ContextMenu 误前提,V0.2.0.12 改 V1.0 archive Rust 原生 Menu)|
| V0.2.8 Issue B | 呼吸灯错位 | V0.2.0.7 | `v0.2.0.7-fix-statusdot-displacement` |
| V0.2.8 Issue C | 黑边仍有 | V0.2.0.8 | `v0.2.0.8-fix-black-border-regression` |
| V0.2.8 Bug 5 | 展开态不等宽 + 无下拉动画(cosmetic) | V0.2.0.9 | `v0.2.0.9-fix-expanded-asymmetry` |

## 四、版本命名规则(task 目录 + release notes)

### task 目录命名

```
docs/<需求>/tasks/
├── v<MINOR>.<PATCH>-fix-<topic>/          # 该 MINOR 的 PATCH bug fix
├── v<MINOR>.<PATCH>-feat-<topic>/         # 该 MINOR 的小特性增量(可选)
├── v<MINOR>-feat-<topic>/                 # 新 MINOR 的 feature
└── v<MINOR>-chore-<topic>/                # 该 MINOR 的非功能改动
```

例:
- `docs/<需求>/tasks/v0.2.0.6-fix-contextmenu-right-click/` — V0.2.0 第 6 个 PATCH
- `docs/<需求>/tasks/v0.3.0-feat-native-dynamic-material/` — V0.2.1 的 feature
- `docs/<需求>/tasks/v0.2-chore-ponytail-shrink/` — V0.2 阶段的杂项

### release notes 命名

```
docs/reports/
├── v<MAJOR>.<MINOR>.<PATCH>-release-notes.md    # PATCH 发版记录
├── v<MAJOR>.<MINOR>-release-notes.md            # MINOR 发版记录
└── v<MAJOR>.<MINOR>-retrospective.md            # MINOR 收尾 retro
```

例:
- `docs/reports/v0.2.0.6-release-notes.md` — V0.2.0 第 6 个 PATCH
- `docs/reports/v0.2.1-release-notes.md` — V0.2.1
- `docs/reports/v0.2.0-retrospective.md` — V0.2.0 整体收尾

## 五、版本号混淆的反模式(必须避免)

| 反模式 | 表现 | 后果 |
|---|---|---|
| **修复号当版本号** | V0.2.3/V0.2.4/V0.2.5 都是"修上个版本",没有新 feature | agent 看不到"在开发什么业务" |
| **PATCH 跨 MINOR** | V0.2.8 修 V0.2.0 surface 的 bug,但版本号写 V0.2.8(假象新 MINOR) | 后续 V0.2.0.x 真 bug 找不到版本号 |
| **MINOR 当 PATCH 用** | 同一 MINOR 的 bug 不打 PATCH，直接累积到下一个版本 | MINOR 内累积过多 bug |
| **commit 谎报版本** | commit message 写 "V0.2.7 修了" 但代码没改 | 见 V0.2.7 retro §3 反模式 15 |

## 六、发版硬约束(每次发版前必走)

1. `docs/reports/v<X>-release-notes.md` 写完(用户视角 5 行摘要)
2. `docs/reports/v<X>-retrospective.md` 写完(若为 MINOR 收尾)
3. 对应 task 的 `Done when` 全勾选(含 L1/L2/L3)
4. `docs/governance/l3-gating.md` §L3 全 PASS
5. D:\ 端 `npm run tauri dev` 实测签字
6. **同步 bump 3 个 config file `version` 字段**(在 lockstep 单个 commit 内):
   - `package.json` → `"version": "<new>"`
   - `src-tauri/Cargo.toml` → `[package] version = "<new>"`
   - `src-tauri/tauri.conf.json` → `"version": "<new>"`
   - 4-segment 标识 `V<MAJOR>.<MINOR>.<PATCH>` 对应 `0.<MAJOR>.<MINOR>.<PATCH>`(如 `V0.2.0.12` → `"0.2.0.12"`);cargo + npm + tauri 均接受
   - 同步 bump 后再 bump `CHANGELOG.md` 当前已发布版本表(避免下一发版看不到当前状态)

**任一项缺失 → 不允许 commit `chore(release): v<X>`**

## 关联

- [doc-layers.md](./doc-layers.md) — 文档分层
- [l3-gating.md](./l3-gating.md) — L3 Windows 实测强制规则
- V0.2.7 retro §3 反模式 14/15/16 触发本规则