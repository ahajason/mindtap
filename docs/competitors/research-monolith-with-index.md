# 单体应用 + 顶层 Docs 索引 调研（2026-06-20）

> 目的：调研 3 个真实开源项目（Discourse / GitLab / PostgreSQL）的"单体应用 + 顶层 `docs/` 索引"风格，回答 mindtap「业务代码跨多个目录散落」痛点该怎么用文档机制解。

---

## 1. 调研对象

| 项目 | 类型 | 文档化程度 | 业务索引形式 | 新人 onboarding 文档 |
|------|------|-----------|-------------|-------------------|
| **Discourse** | Rails 单体（emails + posts + plugins 全在 1 仓） | 高 — 27 个 code-internals 文档 | `docs/developer-guides/docs/03-code-internals/<NN>-<feature>.md`，每个 feature 文件里**显式列出对应代码路径**（`app/services/...`） | `docs/INSTALL.md` + `docs/TESTING.md` + `developer-guides/docs/01-introduction/` |
| **GitLab** | Rails + Go 多语言 mega-mono | 极高 — `doc/development/` 数十个分类 | 双层索引：(a) `doc/development/architecture.md` 全局层拓扑；(b) `doc/user/<feature>/` 用户视角，间接索引代码 | `doc/development/`，内含 `architecture.md` / `feature_development.md` / `code_review.md` |
| **PostgreSQL** | C 单体 | 极高 — SGML 拆到 100+ 文件，**按功能区**而非按层 | 顶层 `doc/src/sgml/` 一级目录即目录：客户端 API、SQL、索引类型、性能、contrib 模块 — **每块对应一个 sgml 文件**，文件名 = 功能名 | `INSTALL` / `installation.sgml` / `docguide.sgml`（如何写文档） |

调研跳过项：
- **Mastodon**：`docs/DEVELOPMENT.md` 只讲环境搭建（vagrant / docker / macOS），无代码层索引；`app/` 是标准 Rails 布局（controllers/models/services/...），业务跨层靠"约定 + 服务对象"。**对 mindtap 参考价值低**。
- **Redis**：`src/` 平铺 200+ C 文件，仅靠文件名约定分类（`networking.c` / `cluster.c` / `dict.c`），无 `docs/` 索引；用户向文档在 `redis.io` 独立站。**与 mindtap 业务跨层痛点无关**。

---

## 2. 项目 1：Discourse

### 真实目录结构（API 抓取）

```
discourse/
├── app/                       # Rails 业务（controllers / models / services / jobs ...）
├── plugins/                   # 官方插件子项目（chat / discourse-ai ...）
├── lib/
├── config/
├── db/
├── spec/
└── docs/
    ├── ADMIN-QUICK-START-GUIDE.md
    ├── INSTALL.md
    ├── TESTING.md
    ├── PLUGINS.md
    └── developer-guides/      # 开发者入口
        ├── README.md
        ├── docs/
        │   ├── index.md
        │   ├── 01-introduction/
        │   ├── 02-development-environments/
        │   ├── 03-code-internals/      # ★ 业务跨层索引的主战场
        │   │   ├── 11-dmodal-api.md
        │   │   ├── 16-authentication-method.md
        │   │   ├── 19-service-objects.md
        │   │   ├── 22-app-events-triggers.md
        │   │   ├── 23-transformers.md
        │   │   └── ...（27 个文件）
        │   ├── 04-plugins/
        │   ├── 05-themes-components/
        │   ├── 06-general-guides/
        │   └── 07-theme-developer-tutorial/
        ├── assets/
        ├── lib/                # 文档站点本身有 Ruby 渲染器
        └── sync_docs           # 同步脚本
```

### 核心组织哲学（一句话）

> **代码按 Rails 标准分（app / lib / config），文档按"代码关心的事"分（service-objects / authentication / events），每个文档 = 1 个可被 1 个 commit 改完的认知单元。**

### `docs/developer-guides/docs/03-code-internals/19-service-objects.md` 真实内容节选

```markdown
---
title: Using service objects in Discourse
short_title: Service objects
id: service-objects
---

## Overview

A service is a small object that encompasses business logic for a given action...
You can think of a service as a conductor of an orchestra...

## Why?

The most common place where to use a service object is in a controller action...

## Getting started

Here's a simplified service to update a user's username which demonstrates most available steps:

class User::UpdateUsername
  include Service::Base
  ...
end

## Files
A typical service lives in `app/services/`, for example:

- `app/services/user/update_username.rb`
- `app/services/user/action/trigger_post_action.rb`
- `plugins/chat/app/services/chat/update_channel.rb`
- `plugins/chat/app/services/chat/create_message.rb`
- `plugins/chat/app/services/chat/direct_message_channel/policy/max_users_excess.rb`
```

> **关键观察**：文档里**直接给出文件路径**（`app/services/...`、`plugins/chat/app/services/...`），把"业务跨多层"这件事转成"看这一个文件就找到所有相关源"。

### 业务跨层索引机制

- 27 个 code-internals 文档**文件名即主题**：`dmodal-api` / `authentication-method` / `service-objects` / `app-events-triggers` / `transformers`。
- 每个文档开篇讲"为什么这样设计"，中段给代码示例，**结尾列文件路径清单**。
- 编号前缀（`01-` ~ `07-`）决定阅读顺序，但**编号内文件之间无序** — 加新主题就加新文件，不重排。
- 文档**独立于代码存在**（在 `docs/` 而非 `app/services/README.md`），避免散在子目录里难搜。

---

## 3. 项目 2：GitLab

### 真实目录结构（API 抓取）

```
gitlabhq/
├── app/                       # Rails 主应用
├── lib/
├── workhorse/                 # Go 写的反向代理
├── gitaly/                   # Go 写的 Git 存储
├── db/
├── spec/
└── doc/                       # ★ 独立 docs 站（被 docs.gitlab.com 渲染）
    ├── AGENTS.md              # 写给 AI agent 的项目总览
    ├── CLAUDE.md
    ├── _index.md
    ├── architecture.md
    ├── administration/
    ├── api/
    ├── user/                  # 用户向（features / project / issues ...）
    │   ├── project/
    │   │   ├── merge_requests/   # ★ 一个 feature 跨多文档
    │   │   └── issues/
    │   └── ...
    ├── development/           # 开发者向
    │   ├── architecture.md    # 全局层拓扑
    │   ├── ai_architecture.md
    │   ├── gitaly.md
    │   ├── feature_development.md
    │   ├── code_review.md
    │   ├── database/
    │   ├── fe_guide/
    │   ├── backend/
    │   ├── graphql_guide/
    │   └── ...
    ├── installation/
    ├── integrations/
    └── operations/
```

### 核心组织哲学（一句话）

> **docs 与代码同仓但独立编译**：文档有完整目录树（`doc/user/<feature>/` 用户向 + `doc/development/<topic>/` 开发者向），文档**文件名 = 业务特性名**，不按层切。

### `doc/development/architecture.md` 真实内容节选

```markdown
---
title: GitLab architecture overview
stage: none
---

## Software delivery
There are two software distributions: CE + EE (now single codebase).

## Components
A typical install uses NGINX → GitLab Workhorse (Go) → Puma (Rails) → PostgreSQL.
- Workhorse accesses the `gitlab/public` directory, bypassing the Puma application server
  to serve static pages, uploads, and pre-compiled assets.
- Sidekiq as job queue, Redis for non-persistent metadata.
- Gitaly (Go) executes Git operations, accessed via gRPC API.
- GitLab Shell serves repos over SSH, talks to Redis + Gitaly.

## Adapting existing and introducing new components
- Kubernetes first: services that need shared files must exchange info through APIs.
- New features must be written to consider Kubernetes compatibility first.
```

> **关键观察**：`doc/development/architecture.md` 是**层拓扑视角**（"Workhorse 在哪、Puma 在哪、Gitaly 在哪"），**不是按业务特性切** — 业务特性切法落在 `doc/user/<feature>/`。

### 业务跨层索引机制

GitLab 是**双索引**：

1. **层拓扑索引**（`doc/development/architecture.md`）— 回答"这一坨代码在系统里是什么位置"。举例：读到 `app/services/...` 时知道背后是 Puma，连到 PostgreSQL；读到 `gitaly/` 时知道是 Go 写的 gRPC 服务。
2. **特性索引**（`doc/user/<feature>/`）— 回答"用户看到的 MR 流程涉及哪些子系统"。这是**业务跨多层的视角**，但 GitLab 把这种文档放在 `doc/user/` 面向最终用户，**不直接索引代码**。

> **GitLab 的取舍**：文档体系庞大但偏向**用户向 + 架构向**，**不强制要求**每个 PR 配套"这个特性跨哪些代码"文档。业务跨层靠**代码分层**（`app/controllers/` / `app/services/` / `app/models/`）+ 大型工程师的领域知识。

### 新人 onboarding

`doc/development/` 是入口，文件名即任务：
- `architecture.md` — 先读
- `feature_development.md` — 怎么提 feature
- `code_review.md` — 怎么过 review
- `database/`, `fe_guide/`, `backend/` — 按栈选
- 单独 `gitaly.md` 解释 Go 子系统

---

## 4. 项目 3：PostgreSQL

### 真实目录结构（API 抓取）

```
postgres/
├── src/
│   ├── backend/               # C 业务（300+ 文件，平铺）
│   ├── include/
│   ├── interfaces/            # libpq / ecpg
│   ├── bin/                   # psql / pg_dump / initdb
│   ├── pl/                    # PL/pgSQL / PL/Tcl
│   ├── port/
│   └── test/
└── doc/
    ├── src/
    │   └── sgml/              # ★ 100+ .sgml 文件，**按功能区切**
    │       ├── intro.sgml
    │       ├── features.sgml
    │       ├── config.sgml              # 601KB 服务端配置参考
    │       ├── catalogs.sgml            # 363KB 系统表
    │       ├── libpq.sgml               # 455KB C 客户端
    │       ├── indices.sgml
    │       │   ├── btree.sgml
    │       │   ├── hash.sgml
    │       │   ├── gin.sgml
    │       │   ├── gist.sgml
    │       │   ├── brin.sgml
    │       │   └── bloom.sgml
    │       ├── contrib.sgml
    │       │   ├── pgcrypto.sgml
    │       │   ├── hstore.sgml
    │       │   ├── ltree.sgml
    │       │   └── cube.sgml
    │       ├── perform.sgml             # 性能调优
    │       ├── arch-dev.sgml            # 内部架构
    │       ├── mvcc.sgml
    │       ├── parallel.sgml
    │       ├── jit.sgml
    │       └── ...
    │   ├── images/
    │   ├── func/                # 函数参考（按目录分）
    │   └── keywords/
    └── FAQ
```

### 核心组织哲学（一句话）

> **代码平铺按层（backend/ / interfaces/ / bin/），文档**按功能主题**（btree 索引 / mvcc / contrib 模块）深切 — 文件名即主题，一个文件可跨多目录讲一件事**。

### 业务跨层索引机制

- `indices/btree.sgml` 一个文件讲完 B-tree 索引的**所有相关层**：磁盘格式、查询算子、WAL 行为、参数调优、SQL 接口。读者不必跳代码目录。
- `contrib/pgcrypto.sgml`、`contrib/hstore.sgml` 一个文件讲完一个 contrib 模块的**用户面 + 实现入口**（`contrib/pgcrypto/` 在哪、相关 hook）。
- `arch-dev.sgml` 是层拓扑总览（"backend/ 怎么分 parser / planner / executor"），但**仍是文档驱动**，不靠代码内注释。
- **文件大但粒度粗**：`config.sgml` 601KB、`catalogs.sgml` 363KB。读者用 `grep` + 编辑器目录导航，不需要再开 N 个子文件。

### 新人 onboarding

- `installation.sgml` — 怎么装
- `docguide.sgml` — 怎么写文档（自身有元文档）
- `intro.sgml` — 概念入门
- `tutorial/` — 跟着练

> **没有"代码跨层索引"概念** — 业务跨层靠**文档自顶向下**消化，不靠"找代码"。

---

## 5. mindtap 照搬方案

> 母项目背景：Tauri 2 + React 19 + TS + Rust 单仓，业务横跨 `src/`（React + hook + IPC bridge）和 `src-tauri/src/`（db / commands / floating / tray / diagnostics / settings）。已有 `docs/specs/` + `docs/plans/` + `docs/reports/` + `docs/architecture/` + `docs/design/`。

### C1: 仿 Discourse（业务特性 + 代码路径直链）

```
docs/
  architecture/                 # ★ 新增
    index.md                    # 业务特性总览（按特性不按层切）
    floating.md                 # 浮窗: src/floating/* + src-tauri/src/floating/*
    task-lifecycle.md           # 任务状态机: src-tauri/src/db/task.rs + src/...
    settings.md                 # settings: src/settings/* + src-tauri/src/settings/*
    diagnostics.md              # 诊断: src/diagnostics/* + src-tauri/src/diagnostics/*
    checkin-subtypes.md         # 子特性（已存在 spec，照搬成 architecture entry）
  development/
    contributing.md             # PR / commit 规约（从 CLAUDE.md 抽出）
    testing.md                  # vitest / cargo test / smoke:floating
    debugging.md                # log ring 怎么读
  specs/                        # 已有，保留
  plans/                        # 已有
  design/                       # 已有
  reports/                      # 已有
src/                            # 保持原样
src-tauri/src/                  # 保持原样
```

**核心约定**：每篇 `docs/architecture/<feature>.md` 头部**显式列代码路径**，中段讲跨层流转，结尾给 commit 触发规则（哪个文件动要改哪段）。例：

```markdown
# floating

> 业务边界：浮窗 = 独立 webview 窗口，跨 src/floating/ + src-tauri/src/floating/

## 涉及文件
- `src/floating/App.tsx` — 入口 + 尺寸常量
- `src/floating/FloatShell.tsx` — 折叠/展开容器
- `src/floating/hooks/useWindowPosition.ts` — 位置持久化
- `src-tauri/src/floating/mod.rs` — ensure_window 幂等创建
- `src-tauri/src/floating/dimensions.rs` — 折叠/展开物理尺寸
- `src-tauri/capabilities/floating.json` — 权限
- `tauri.conf.json` → `app.windows[floating]` — 窗口声明

## 改这个特性的 checklist
- 尺寸常量改了 → 同步 `tauri.conf.json` 的 min/max + smoke
- 加新 webview 子窗口 → 同步 vite.config.ts + 新 capability
```

**优点**：
- 文档**直接服务 PR**："我要改 X，先看 docs/architecture/x.md 怎么讲"
- 索引深度足够，但**不强制按文档重写代码**（docs 与 code 解耦）
- 跟 Discourse 一样**用编号/排序无关**，加新特性只加新文件

**缺点**：
- 需要**持续维护**（代码路径变了要改文档），跟 Discourse 一样靠 reviewer
- 没有"系统自检"，纯靠纪律

### C2: 仿 GitLab（双索引：层拓扑 + 特性入口）

```
docs/
  development/                  # ★ 新增
    architecture.md             # 全局层拓扑（讲 Tauri / React / IPC / DB 怎么拼）
    feature-development.md      # 提新特性的流程
    code-review.md              # review checklist
    debugging.md                # 看 log ring / 跑 smoke
    testing.md                  # vitest + cargo + smoke 4 件套
  architecture/                 # 跟 C1 一样，特性索引
    index.md
    floating.md
    task-lifecycle.md
    ...
src/                            # 保持原样
src-tauri/src/                  # 保持原样
```

**核心约定**：`docs/development/architecture.md` 讲**层拓扑**（"lib.rs 装配点 / db/ 共享连接 / commands/ 一领域一文件 / tauri-bridge.ts 唯一 IPC 入口"），不按业务切；`docs/architecture/<feature>.md` 按业务切。**两层索引都看，PR 才能完整**。

**优点**：
- 拓扑视角适合**新人快速建脑图**
- 跟 GitLab `doc/development/` + `doc/user/<feature>/` 一样的成熟范式

**缺点**：
- **重复维护两层文档**（拓扑 + 特性），对单仓 Tauri 应用偏重
- GitLab 自己靠 100+ 工程师维护，对小项目性价比低

### C3: 仿 PostgreSQL（按功能主题深切 + 大文档）

```
docs/
  architecture/                 # ★ 一个大文件
    mindtap.md                  # 单文件，包含所有业务主题章节
  # 或者拆成：
  architecture/
    floating.md
    task-lifecycle.md
    settings.md
    # 没有 index.md
src/                            # 保持原样
src-tauri/src/                  # 保持原样
```

**核心约定**：参考 PG 的 `config.sgml` / `catalogs.sgml`，**一个特性 = 一个超长 md**，从用户行为一直讲到后端实现，**不另起 index**。读者靠编辑器目录树 + 搜索跳。

**优点**：
- 维护最简单（少文件）
- 一个特性一篇，**写完就完整**

**缺点**：
- 不利于**多人协作**（同时改一文件冲突）
- 跟现有 `docs/architecture/` 已有的少量文件（`floating-visibility-checklist.md` 等）能直接合并，但**需要重写大块**
- 不便于"改 X → 改 Y → 改 Z"这种跨特性联动

---

## 6. 推荐

**采用 C1（仿 Discourse），理由如下**：

1. **粒度匹配**：Discourse 的「一个文档 = 一个认知单元」对应 mindtap 的「一个业务特性 = 一份索引」。`docs/architecture/floating.md` 这种文件**与现有 `docs/specs/2026-06-20-checkin-subtypes-design.md` 是一对**（spec 讲 what，architecture 讲 where）。

2. **维护成本可控**：相比 C2（双索引），C1 只维护一层 `docs/architecture/<feature>.md`。相比 C3（巨型 md），C1 文件间独立可并行改。

3. **可增量推进**：先把**痛点最强的 3 个特性**（floating / task-lifecycle / diagnostics）做成 architecture 文档，跑 1-2 周看 reviewer 是否真的依赖它决定 PR 路径，再决定要不要全量铺。

4. **CLAUDE.md 协同**：项目根的 `CLAUDE.md` 已说"本文件只补 README 没讲、靠读多份代码才能拼出来的事"，正好对应 `docs/architecture/<feature>.md` 的内容定位 — 文档**不抢 CLAUDE.md 的位置**（CLAUDE.md 讲规约，architecture 讲代码位置）。

5. **命名与现有体系不冲突**：
   - `docs/specs/` — 设计 what
   - `docs/plans/` — 实施 how
   - `docs/reports/` — 阶段交付
   - `docs/architecture/` — 业务特性在代码里长在哪（**新增**）
   - `docs/development/` — 新人 onboarding（**新增**，可放 C1 切线）

### 落地步骤（最小可行版）

1. **Day 1**：建 `docs/architecture/index.md` 模板（4 段：涉及文件 / 改这个特性的 checklist / 常见问题 / 关联 spec & plan）。
2. **Day 1**：挑 **floating** 写第一份（已有 `floating-visibility-checklist.md` 当素材，1 小时内能出）。
3. **Day 2**：再补 **task-lifecycle** 和 **settings** 两份。
4. **Day 3**：在 `CLAUDE.md` 加一段"新 PR 必查 docs/architecture/ 下对应文件"作为软规约。
5. **Day 7**：跑 1 周 review，看 reviewer 是不是真的引用 `docs/architecture/<feature>.md` 来定位代码 → 决定要不要继续铺。

---

## 7. 与方案 X / Y 的对比

| 维度 | C1 仿 Discourse | C2 仿 GitLab | C3 仿 PostgreSQL |
|------|----------------|--------------|-----------------|
| 索引粒度 | 每特性一文件 | 拓扑 + 特性双层 | 特性一篇超长 md |
| 维护成本 | 中（一层） | 高（两层） | 低（少文件） |
| 多人协作友好度 | 高（文件间独立） | 高 | 低（巨型 md 冲突） |
| 适合规模 | 中小团队 / 单仓 | 大团队 / mega-mono | 1-2 人 / 文档写完不变 |
| 新人 onboarding 友好度 | 中（按需查） | 高（先看 topology） | 低（自己翻巨型 md） |
| PR review 友好度 | 高（改 X 看 X 的 md） | 中（要跨两层找） | 低（一个 md 找特定章节） |
| 跟 mindtap 现状契合 | ★★★（specs/plans 已分层，缺的就是 code-where） | ★★（双层偏重） | ★（会动现有 architecture/） |

**C1 覆盖的痛点最直接**：mindtap 的 `CLAUDE.md` 已写了"业务代码跨多个目录散落"，**C1 的核心机制（"涉及文件"段落）正好是这句话的工程化落地**。C2 太重，C3 太粗，C1 刚好在中间。

---

## 8. 引用

- Discourse `docs/developer-guides/docs/03-code-internals/`：https://github.com/discourse/discourse/tree/main/docs/developer-guides/docs/03-code-internals
- Discourse `19-service-objects.md` 样例：https://github.com/discourse/discourse/blob/main/docs/developer-guides/docs/03-code-internals/19-service-objects.md
- GitLab `doc/development/architecture.md`：https://gitlab.com/gitlab-org/gitlab/-/blob/master/doc/development/architecture.md
- GitLab `doc/development/` 目录：https://gitlab.com/gitlab-org/gitlab/-/tree/master/doc/development
- PostgreSQL `doc/src/sgml/` 目录：https://github.com/postgres/postgres/tree/master/doc/src/sgml
- PostgreSQL `arch-dev.sgml`：https://github.com/postgres/postgres/blob/master/doc/src/sgml/arch-dev.sgml
- Mastodon `docs/DEVELOPMENT.md`（参考价值低，仅记录）：https://github.com/mastodon/mastodon/blob/main/docs/DEVELOPMENT.md

