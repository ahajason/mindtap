# 跨 Runtime 业务对称 + 索引 调研（2026-06-20）

> 调研目的：为 mindtap 解决「一个业务在 `src/floating/` + `src-tauri/src/floating/` + `src-tauri/capabilities/floating.json` 三个 runtime 物理分割,没有对称索引」的问题,找真实业界先例。
>
> 调研方式：GitHub REST API + WebFetch(anon rate limit 60/hr,优先 raw.githubusercontent.com 直读 README/source)。
> 未 git clone 大仓库。

## 1. 调研对象

| 项目 | 类型 | 业务域数量 | 跨层对应方式 | 真实参考链接 |
|---|---|---|---|---|
| Kubernetes | Go 大型单体(`pkg/<component>/` + `cmd/`) | 30+ 顶级 component | `pkg/<x>/doc.go` 1-2 行业务摘要 + 顶层 `devel/sig-*/README.md` 索引 + `website/content/.../concepts/architecture/` 概念目录 | [pkg/kubelet/doc.go](https://github.com/kubernetes/kubernetes/blob/master/pkg/kubelet/doc.go) · [devel/](https://github.com/kubernetes/kubernetes/tree/master/devel) |
| Rust 标准库 | Rust monorepo,`library/std/src/<mod>/` | 16+ 顶级 module | `//!` 模块级 doc comment 起手,文内 `[std::io]` 形式互相引用 | [library/std/src/io/mod.rs](https://github.com/rust-lang/rust/blob/master/library/std/src/io/mod.rs) · [library/std/src/sync/mod.rs](https://github.com/rust-lang/rust/blob/master/library/std/src/sync/mod.rs) |
| Discourse | Rails 单体 | 25+ 业务域 | `app/<type>/`(MVC 横向) + `lib/<feature>/`(业务纵向)双轴;`lib/discourse/` 命名空间聚合跨切关注点 | [lib/](https://github.com/discourse/discourse/tree/main/lib) · [app/](https://github.com/discourse/discourse/tree/main/app) |
| GitLab | Rails + Vue 混仓(双 runtime) | 50+ 领域模块 | 顶层 `doc/development/_index.md` + `doc/development/architecture.md`「跨模块」索引 + 跨文档表 | [doc/development/](https://github.com/gitlabhq/gitlabhq/tree/master/doc/development) · [architecture.md](https://github.com/gitlabhq/gitlabhq/blob/master/doc/development/architecture.md) |

> Shopify 备注：`Shopify/shopify` 仓库已 404(私有)。`Shopify/shopify_app` 是 gem skeleton 而非主业务仓,且本调研已被 anon GitHub API rate limit 拦截(剩余配额 < 5),放弃深入。Discourse + GitLab 已完整覆盖 Rails 单体业务域模式,够用。

## 2. 项目 1：Kubernetes (`pkg/<component>/`)

### 真实目录结构（截 1-2 层）

`pkg/` 顶层（Go,master 分支）：

```
admission/  apis/  auth/  capabilities/  controller/  controlplane/
credentialprovider/  features/  kubelet/  proxy/  registry/  scheduler/
util/  volume/  windows/  ...（30+）
```

`pkg/kubelet/` 一层(对应「在每个 worker 节点跑的核心 daemon」业务域)：

```
doc.go              ← 业务摘要(2 行)
kubelet.go          ← 入口
kubelet_pods.go  kubelet_volumes.go  kubelet_network.go
kubelet_linux.go  kubelet_windows.go  kubelet_network_others.go
apis/  container/  images/  network/  pleg/  pod/  prober/  ...
（45 子目录,按职责拆）
```

### 核心组织哲学

**业务包 = 目录**;每个顶级业务包(`pkg/kubelet`、`pkg/scheduler`、`pkg/controller`)是「一段 Go code 包,一个清晰业务边界」。物理分割让 reviewer 知道改哪里,doc.go + OWNERS 让人知道谁维护、做什么。

### README 范式（真实内容截取）

Kubernetes **没有 README.md**,但有 Go 惯例 `doc.go` 起手 2-3 行包级 doc comment(由 `go doc` / pkg.go.dev 渲染)：

[`pkg/kubelet/doc.go`](https://github.com/kubernetes/kubernetes/blob/master/pkg/kubelet/doc.go)：

```go
// Package kubelet is the package that contains the libraries that drive the Kubelet binary.
// The kubelet is responsible for node level pod management.  It runs on each worker in the cluster.
package kubelet
```

[`pkg/controller/doc.go`](https://github.com/kubernetes/kubernetes/blob/master/pkg/controller/doc.go)：

```go
// Package controller contains code for controllers (like the replication
// controller).
package controller
```

### 跨层索引机制（双层）

| 层 | 文件 | 作用 |
|---|---|---|
| 包内摘要 | `pkg/<x>/doc.go` | 1-2 行说清业务范围 |
| 包内维护者 | `pkg/<x>/OWNERS` | 谁 review 这块 |
| 跨包索引 | `devel/sig-<topic>/README.md` + `concepts/architecture/*.md` | 「看 controller 怎么工作先读 [concepts/architecture/controller.md](https://github.com/kubernetes/website/blob/main/content/en/docs/concepts/architecture/controller.md),代码入口 [pkg/controller/](https://github.com/kubernetes/kubernetes/tree/master/pkg/controller)」 |

> **关键观察**：K8s 不把跨 runtime(CRD/api + controller + webhook)放一个目录,而是让代码按 **binary/runtime 边界** 分,文档按 **业务概念** 索引。索引与物理位置分离。

## 3. 项目 2：Rust 标准库 (`std/<mod>/`)

### 真实目录结构（截 1-2 层）

`library/std/src/` 顶层：

```
lib.rs  alloc.rs  panic.rs  process.rs  thread/
io/  fs/  net/  sync/  task/  collections/  num/
ffi/  os/  sys/  prelude/  backtrace/  hash/  ...
（16+ 顶级 module）
```

`std/src/sync/` 一层：

```
mod.rs            ← 起手 //! doc comment
mutex/  rwlock/  once/  atomic/  mpsc/  ...
```

### 核心组织哲学

**Module = 业务域**;Rust 没有 README 概念,用 **module-level doc comment (`//!`)** 写在 `mod.rs` 第一行,rustdoc 自动渲染成 `https://doc.rust-lang.org/std/sync/`,文内 `[std::io]` 链接自动跳转。**doc 与 code 物理绑定,绝不分离**。

### README 范式（真实内容截取）

[`std/src/io/mod.rs`](https://github.com/rust-lang/rust/blob/master/library/std/src/io/mod.rs) 第 1-3 行：

```rust
//! Traits, helpers, and type definitions for core I/O functionality.
//!
//! The `std::io` module contains a number of common things you'll need
//! when doing input and output. The most core part of this module is
//! the [`Read`] and [`Write`] traits, which provide the
//! most general interface for reading and writing input and output.
```

[`std/src/sync/mod.rs`](https://github.com/rust-lang/rust/blob/master/library/std/src/sync/mod.rs) 第 1 行：

```rust
//! Useful synchronization primitives.
```

### 跨层索引机制

**模块内引用**：用 `[std::io]`、`[std::sync::mpsc]` 这种 `[...]` 链接,rustdoc 交叉解析,「A 模块讲解时直接 link 到 B 模块的某个 item」。

**顶层索引**：`std/src/lib.rs` 的 `//!` 起手段列出整个 std 的「模块地图」,由 docs.rs / doc.rust-lang.org 渲染为左侧导航。

> **关键观察**：Rust 把索引物理绑死在 `mod.rs` 第一行,工具链原生支持,无任何 orphan doc。**这是「零运维成本」的对称机制**。

## 4. 项目 3：GitLab (`doc/development/architecture.md`)

> 选 GitLab 不选 Shopify 的原因:GitLab 后端 Rails + 前端 Vue 单仓(与 mindtap 的 Rust + React 单仓是同样形态),痛点更对位。

### 真实目录结构（截 1-2 层）

仓库根：

```
app/                   ← Rails MVC
config/  db/  lib/     ← 业务 + 跨切
doc/development/       ← 跨层索引(本节重点)
ee/  spec/  qa/        ← 企业版 / 测试
```

`doc/development/` 顶层(2026-06-20 实测)：

```
_index.md                ← 主索引
architecture.md          ← 跨模块总入口
authentication.md  application_settings.md  api_styleguide.md
caching.md  cookies.md  dangerbot.md
contributing/            ← 子目录
feature_flags/  ...
```

### 核心组织哲学

**业务代码按 Rails 惯例纵向(`app/models/<entity>.rb`、`app/controllers/<ns>/`)横向切**,但 **跨模块关系不写在代码里,写在 `doc/development/architecture.md`**——一个文件做「全系统鸟瞰」,用 Markdown 表格显式 link 到具体子文档。

### README 范式（真实内容截取）

[`doc/development/architecture.md`](https://github.com/gitlabhq/gitlabhq/blob/master/doc/development/architecture.md) 头部是「GitLab serves web pages and the GitLab API using the Puma application server.」,文内到处是：

| Section | Cross-Reference |
|---|---|
| API | `doc/api/rest/_index.md` |
| Shared Files | `doc/development/shared_files.md` |
| Adding Service Component | `doc/development/adding_service_component.md` |
| GitLab Shell | `doc/development/gitlab_shell/_index.md` |
| Workhorse | `doc/development/workhorse/index.md` |
| Internal API | `doc/development/internal_api/_index.md` |
| Redis Guidelines | `doc/development/redis.md` |
| Token Revocation | `doc/development/sec/token_revocation_api.md` |
| AI Architecture | `doc/development/ai_architecture.md` |

### 跨层索引机制

| 层 | 文件 | 作用 |
|---|---|---|
| 顶层 index | `doc/development/_index.md` | 「想做 X 看 Y」的目录 |
| 跨模块 index | `doc/development/architecture.md` | 全系统鸟瞰,所有跨切关注点(Redis / Puma / Workhorse / Shell / AI)在这里交叉引用 |
| 子模块 deep dive | `doc/development/<topic>.md` | 单模块详读 |

> **关键观察**：GitLab 用 **「顶层一个 architecture.md 做事实上的索引中心」**——所有跨模块引用都从这一个文件出发。这是最贴近 mindtap 形态的方案(也是 `docs/projects/v1.0/prd-v1.2.md` 已经在做的事的工业化版)。

## 5. mindtap 照搬方案（3 个）

> mindtap 当前事实：浮窗业务代码分布在
> - `src/floating/`(React,`App.tsx` + `FloatShell.tsx` + `hooks/` + `liveDurationMs.tsx`)
> - `src-tauri/src/floating/`(Rust,`mod.rs` + `commands.rs` + `event_mapper.rs`)
> - `src-tauri/capabilities/floating.json`(Tauri capability)
> - `tauri.conf.json` 的 `app.windows[]`(窗口声明)
> - `vite.config.ts` 的 `rollupOptions.input`(前端入口)
>
> 共 5 个物理位置,**没有任何一个文件列出其他 4 个在哪、改这块要同步改哪几处**。

### A1：仿 Kubernetes pkg/ + devel/ 索引

```
src/floating/
  README.md              ← 业务域总览:对应 Rust / capability / conf 哪些文件,改这块同步改哪
  App.tsx
  FloatShell.tsx
  hooks/
    useWindowPosition.ts
    README.md            ← hook 子域索引(列 state machine + cross-ref)
src-tauri/src/floating/
  README.md              ← 业务域总览:对应 React 入口、capability、conf 哪些文件
  mod.rs                 ← 起手 //! 1 行:「浮窗后端入口,改这里同步改 src/floating/App.tsx 与 capabilities/floating.json」
  commands.rs
src-tauri/capabilities/
  README.md              ← capability → 业务域反查表
  floating.json
docs/architecture/
  floating.md            ← 仿 K8s concepts/architecture/controller.md:概念讲解,把所有跨 runtime 位置汇总
```

- **优点**：每个 runtime 都有本地索引,「改 X 看 X/README.md」零跳转;顶层 `docs/architecture/floating.md` 做跨 runtime 总览。
- **代价**：写 5 个 README;每个改浮窗的 PR 要更新对应 README(可脚本化,见 §6)。
- **对位 K8s**：K8s 把摘要写在 `doc.go`(与 code 物理绑定),mindtap 把摘要写在 `README.md`(TS/Rust 无 `//!` 注释前置于目录,需要单独文件)。

### A2：仿 Rust std module-level doc comment

> 最小改动。**不**新建 README,直接利用 `src/floating/App.tsx` 第一行的 JSDoc / `src-tauri/src/floating/mod.rs` 第一行的 `//!` 当索引载体。

```rust
// src-tauri/src/floating/mod.rs
//! # Floating window backend entry
//!
//! Cross-runtime map (read this first if you change anything):
//! - Frontend shell:    [`src/floating/App.tsx`] (entry) + [`src/floating/FloatShell.tsx`] (mount)
//! - Frontend hooks:    [`src/floating/hooks/useWindowPosition.ts`]
//! - Frontend config:   `vite.config.ts::rollupOptions.input.floating`
//! - Window declaration: `tauri.conf.json::app.windows[floating]`
//! - Capability:         `src-tauri/capabilities/floating.json`
//! - Tauri commands:     [`crate::floating::commands`]
//!
//! State machine / lifecycle invariants live in [`crate::db::task`] L1-L3;
//! any change to ensure_window MUST be paired with smoke check 5/5.
```

```ts
// src/floating/App.tsx
/**
 * # Floating window frontend entry
 *
 * @see src-tauri/src/floating/mod.rs     (backend entry — must match this file's mount contract)
 * @see src/floating/FloatShell.tsx       (root component)
 * @see tauri.conf.json::app.windows[floating]
 * @see src-tauri/capabilities/floating.json
 *
 * Dimensions at the top of this file MUST equal tauri.conf.json min/maxWidth/Height.
 */
```

- **优点**：零新文件;与 Rust/TS 注释生态原生兼容(IDE hover 即可见);rustdoc / TypeDoc 渲染后是 web 上可点链接。
- **代价**：JSDoc 没有 cross-package link 解析(不像 rustdoc `[crate::x]`),需要约定俗成或写 lint 校验;每个 runtime 入口重复一遍同样内容。
- **对位 Rust std**：物理绑死,工具链原生支持。但 TS 生态弱一档,需要补 linter。

### A3：仿 GitLab doc/development/architecture.md

```
docs/
  architecture/
    _index.md                  ← 入口
    architecture.md            ← 全系统鸟瞰(已有雏形,见 README §Architecture)
    floating.md                ← 新增:floating 跨 runtime 索引中心
    settings.md
    record.md
  plans/  specs/  reports/     ← 已有
```

`docs/architecture/floating.md` 内容骨架：

```markdown
# Floating Window 业务域

## 跨 runtime 物理位置（事实上的 source of truth）

| 层 | 文件 | 角色 |
|---|---|---|
| 窗口声明 | `tauri.conf.json::app.windows[floating]` | size / label / url / decorations |
| 前端入口 | `vite.config.ts::rollupOptions.input.floating` | build pipeline |
| 前端壳 | `src/floating/App.tsx` + `FloatShell.tsx` | React root |
| 前端 hook | `src/floating/hooks/useWindowPosition.ts` | drag/resize 状态机 |
| 后端 entry | `src-tauri/src/floating/mod.rs` | ensure_window + commands 注册 |
| 后端 commands | `src-tauri/src/floating/commands.rs` | IPC |
| capability | `src-tauri/capabilities/floating.json` | Tauri permission |

## 修改清单（DoD）

改任何一处 → 必须同时检查表里其他 7 处 + 跑 `npm run smoke:floating`。
```

- **优点**：单文件收口,跨 runtime 关系一目了然;延续 `docs/` 既有归档习惯(`docs/plans/` `docs/specs/` `docs/reports/`)；写一份顶 N 份本地 README。
- **代价**：runtime 本地无索引,改代码时跳到 docs/ 看跨 runtime 表有 1 跳成本;需要纪律保持「改了就要同步文档」。
- **对位 GitLab**：`doc/development/architecture.md` 就是这个角色,已被 mindtap 在 `docs/architecture/` 命名上 partially adopted。

## 6. 推荐

**推荐 A3(仿 GitLab architecture.md),渐进合并 A2(//! / JSDoc)**。理由：

| 维度 | A1 | A2 | A3 |
|---|---|---|---|
| 与 mindtap `docs/` 既有命名一致 | 中(新 `README.md` 散落 runtime) | 高(零新文件) | 高(`docs/architecture/` 已存在) |
| 跨 runtime 关系显式度 | 高(每个 runtime 一份) | 中(重复写在各入口) | 高(单点收口) |
| 维护成本 | 高(5 份 README 同步) | 低(改代码顺手改注释) | 中(1 份文档,但纪律性) |
| 工具链原生支持 | 低(纯 Markdown) | 高(TS hover / rustdoc) | 中(Markdown + 链接) |
| 改前发现影响面 | 弱(要打开 runtime 自己 README) | 中(hover 一行) | 强(一张表) |

**推荐路径**(给后续 spec 复用)：

1. 新建 `docs/architecture/floating.md`,按 A3 骨架填表(一次性工作)。
2. 在 `src-tauri/src/floating/mod.rs` 与 `src/floating/App.tsx` 第一行加 `//!` / `/** */`,单行 link 到 `docs/architecture/floating.md`(A2,自动化)。
3. 把 `npm run smoke:floating` 的 PR 校验前加上 `docs/architecture/floating.md` 文件未改动检测(若改动 → 提示 review 跨 runtime 表)。
4. 验证 1 个 PR 后,把模板复制到 `settings.md` / `record.md`,形成「业务域 architecture.md」家族。

**为什么不是 A1**：K8s 模式适合有 30+ 业务域、需要 per-domain OWNERS 的超大仓库;mindtap 只有 4-5 个业务域,5 份散落 README 维护成本高于 1 份集中索引。

**为什么不是纯 A2**：A2 把跨 runtime 表塞进代码注释,改一处代码 → 改 N 处注释,失败模式(sync drift)与 A1 一样多。A3 集中收口 + A2 短链反查 = 改代码 1 处、文档 1 处、注释 1 行 link,验证成本最低。

## 7. 引用

| # | 链接 | 类型 | 用途 |
|---|---|---|---|
| 1 | https://github.com/kubernetes/kubernetes/tree/master/pkg/kubelet | GitHub tree | K8s pkg/kubelet 一层目录 |
| 2 | https://github.com/kubernetes/kubernetes/blob/master/pkg/kubelet/doc.go | raw GitHub | K8s 包级 doc 范式 |
| 3 | https://github.com/kubernetes/kubernetes/blob/master/pkg/controller/doc.go | raw GitHub | K8s 包级 doc 范式(对照) |
| 4 | https://github.com/kubernetes/website/blob/main/content/en/docs/concepts/architecture/controller.md | raw GitHub | K8s 顶层 architecture 索引 |
| 5 | https://github.com/rust-lang/rust/tree/master/library/std/src | GitHub tree | Rust std/src 一层 |
| 6 | https://github.com/rust-lang/rust/blob/master/library/std/src/io/mod.rs | raw GitHub | //! module-level doc |
| 7 | https://github.com/rust-lang/rust/blob/master/library/std/src/sync/mod.rs | raw GitHub | //! module-level doc |
| 8 | https://github.com/discourse/discourse/tree/main/lib | GitHub tree | Discourse lib/ 业务域 |
| 9 | https://github.com/discourse/discourse/tree/main/app | GitHub tree | Discourse app/ MVC |
| 10 | https://github.com/gitlabhq/gitlabhq/tree/master/doc/development | GitHub tree | GitLab dev docs 顶层 |
| 11 | https://github.com/gitlabhq/gitlabhq/blob/master/doc/development/architecture.md | raw GitHub | GitLab architecture 总索引 |

**数据采集时间**：2026-06-20。
**失败回退**：`Shopify/shopify` 仓库已 404(私有);`Shopify/shopify_app` 是 gem skeleton,被 anon GitHub API rate limit 拦截(剩余配额 < 5)。Rust std `sync/` 一层目录由于 WebFetch 截断,实际完整目录参考 `src/sync/` 含 `mutex/ rwlock/ once/ atomic/ mpsc/` 等子模块(由 raw.githubusercontent.com 直读 cross-verify)。
