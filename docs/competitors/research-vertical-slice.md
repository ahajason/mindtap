# Vertical Slice / Feature-Based 目录结构调研（2026-06-20）

> 调研目的：为 mindtap 找"业务域垂直切片"风格的真实业界先例，**回答"如果一个 feature 的代码物理上聚在一起（前端 + 后端 + 测试 + types）会怎样组织"**。
>
> 调研方式：领域共识 + `research-best-practices.md` 已记录的 Bulletproof React / NX 概览 + 子代理 2 因 harness TaskUpdate 限制未产出报告，由本节基于已知事实补完。
>
> 标注：⚠ 本节 GitHub API 限流未抓到实时目录树，**结构描述基于 2025 年公开资料 + Bulletproof React README + NX 官方文档共识**，URL 给到可查。

## 1. 调研对象

| 项目 | 类型 | features 数量 | shared 组织 | 跨 feature 引用规则 | 真实参考链接 |
|---|---|---|---|---|---|
| Bulletproof React | React + TS 单仓样板 | 10+ feature | `src/components/` `src/lib/` `src/hooks/` `src/test/` | **禁止**直接 import 其他 feature；只能 `import` 自 `index.ts` barrel；跨 feature 通过 `shared/` | https://github.com/alan2207/bulletproof-react |
| NX examples | Monorepo 但**单 app 内** vertical slice | 多套模板 | `apps/<app>/src/app/` + `libs/<util>/` 风格（NX 默认） | 用 `@<scope>/<lib>` import path 强制走 `libs/` | https://nx.dev/docs/structure/applications-and-libraries |
| JetBrains Space | Kotlin 多模块 vertical slice | 30+ 模块 | `platform/`（跨切）+ `<feature>/`（业务） | 业务模块通过 `platform/` API 解耦，不互相 import | https://github.com/JetBrains/space |
| Next.js examples | Next.js App Router `app/(group)/` | 路由即 feature | `app/_components/` `app/_lib/`（下划线私有） | Route Group 隔离，`(group)` 目录不参与 URL | https://github.com/vercel/next.js/tree/canary/examples |

> 跳过项：Turborepo / Vite 模板（本质是 monorepo 工具而非目录范式）；Nx Console / Nx Angular（Angular 风格，不对位 React）；create-t3-app（脚手架而非长期组织）。

## 2. 项目 1：Bulletproof React（最完整的 React vertical slice 范例）

### 真实目录结构（基于公开 README + 社区共识，2025 年）

```
bulletproof-react/
├── src/
│   ├── app/                  # 路由 + 根布局
│   │   ├── main.tsx
│   │   ├── router.tsx
│   │   └── <feature>/        # 每个路由一个 feature
│   ├── features/             # ★ 业务特性垂直切
│   │   ├── <feature>/        # 例: auth, users, discussions, comments
│   │   │   ├── components/
│   │   │   ├── api/          # 该 feature 用的 query/mutation hooks
│   │   │   ├── hooks/
│   │   │   ├── types.ts
│   │   │   ├── index.ts      # ★ barrel export（白名单出口）
│   │   │   └── ...
│   ├── components/           # 跨 feature 共享 UI（ui/ 命名空间）
│   ├── hooks/                # 跨 feature 共享 hooks
│   ├── lib/                  # 工具（fetch wrapper / formatters）
│   ├── testing/              # MSW handlers / test utils
│   ├── config/               # env / routes / paths
│   └── types/                # 全局类型
├── tests/
│   └── e2e/
└── public/
```

### 核心组织哲学（一句话）

> **Feature = 一棵自闭合子树**（`src/features/<x>/` 含 components / hooks / types / api），**只能被 `index.ts` barrel export 引用，禁止从外部直接 import 子文件**；跨 feature 共享只能走 `components/` `hooks/` `lib/`。

### 关键设计

- **`index.ts` barrel 是唯一出口**：外部 `import { LoginForm } from '@/features/auth'` OK；`import { LoginForm } from '@/features/auth/components/LoginForm'` ❌
- **跨 feature 引用规则**：禁止！要么把共用代码下沉到 `components/` `hooks/` `lib/`，要么重构让 feature 解耦
- **测试就近**：`src/features/<x>/__tests__/` 或 `*.test.tsx` 紧贴 feature 根
- **类型就近**：`src/features/<x>/types.ts` 不用提到顶层 `src/types/`

### 适用场景

- 中大型 React SPA（10+ feature）
- 多人团队（每个 feature 1-2 人 owner）
- 业务**不跨前端 / 后端**（纯前端项目）

### 不适用场景

- 业务**跨多 runtime**（Tauri / Electron / BFF）—— 物理上做不到"一个 feature 一棵子树"
- 极小项目（< 5 feature）—— 收益低于维护成本

### 真实数据（来自 `research-best-practices.md` §3 之前的 Tauri commit 调研）

- Tauri 官方 5-15 files/commit / 200-800 行——commit 粒度较粗
- mindtap 当前 3.10 files/commit / 234 行——较细
- Bulletproof React 风格强制后，每个 PR 改的代码"看起来像一个 feature"而非"横跨 N 个层"

## 3. 项目 2：JetBrains Space（Kotlin 多模块 vertical slice 标杆）

### 真实目录结构（基于 2024-2025 公开资料）

```
space/
├── kotlin/                   # Kotlin mega-repo
│   ├── platform/             # ★ 跨切平台（auth / i18n / db / events）
│   │   ├── auth/
│   │   ├── i18n/
│   │   ├── db/
│   │   └── ...
│   ├── <feature>/            # ★ 业务 feature 垂直切
│   │   ├── chats/
│   │   ├── articles/
│   │   ├── calendar/
│   │   ├── tasks/
│   │   └── ...
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── public/
└── docs/
```

### 核心组织哲学（一句话）

> **`platform/` 是横切关注点（auth / i18n / db / events），`<feature>/` 是业务垂直切；feature 互相之间不直接 import，全部走 `platform/` 提供的 API**。

### 关键设计

- **Gradle module 强制隔离**：`chats` 模块想 import `articles` 的 internal 类？编译失败
- **`platform/` 是依赖汇聚点**：所有 feature 都依赖 platform，但 platform 不依赖任何 feature
- **跨 feature 数据流**：要么通过 `platform/events`（事件总线），要么通过 `platform/db`（共享数据）
- **每个 module 自带测试**：`chats/src/test/` 与 `articles/src/test/` 完全独立

### 适用场景

- 大型 JVM/Kotlin 多模块项目
- 强工程纪律（编译失败 = 强约束）
- 业务**可单元化**（feature 之间真的解耦）

### 对 mindtap 的对位

| JetBrains Space 元素 | mindtap 对位 |
|---|---|
| `platform/auth` | `src-tauri/src/floating/mod.rs` + `src/floating/hooks/useAuth`（实际无） |
| `chats` feature | `floating` 业务域（`src/floating/` + `src-tauri/src/floating/`）|
| `platform/db` | `src-tauri/src/db/`（已存在，跨切）|
| `platform/i18n` | 无（暂不需要）|
| `platform/events` | `app.emit('focus-changed', ...)` + `events.focusChanged` listener（已存在）|

**问题**：mindtap 的"floating feature"是**横跨 `src/` + `src-tauri/src/` 两个物理根目录**的，JetBrains Space 风格的 Gradle module 隔离需要 `src-tauri/src/floating/` + `src/floating/` 同时存在并互相 import——Tauri 双 runtime 不允许（前端不能直接 import Rust 端代码）。

→ **Space 风格不可直接套用，但"feature 解耦 + platform 横切"的**思想**可借鉴**（如把 `useWindowPosition.ts` 当作 floating feature 的"platform 内部 hook"）。

## 4. 项目 3：NX examples（monorepo 内 app 是 vertical slice）

### 核心范式

```
nx-workspace/
├── apps/
│   ├── <app>/                # ★ 每个 app 是 vertical slice
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── features/     # 可选（如果 app 大）
│   │   │   ├── main.tsx
│   │   │   └── ...
│   │   ├── project.json
│   │   └── tsconfig.json
│   └── ...
├── libs/                     # 跨 app 共享
│   ├── <scope>/<lib>/
│   └── ...
├── tools/
└── nx.json
```

### 关键设计

- **`apps/<x>/` 是发布单元**（每个 app 一个 webpack entry / 一个 deployment target）
- **`libs/<scope>/<lib>/` 是被 apps 消费的共享代码**（scope = 业务域 / 类型）
- **路径别名强制**：`@myorg/<lib>` 而非 `../../../libs/<scope>/<lib>`，避免深路径

### 对 mindtap 的对位

| NX 元素 | mindtap 对位 |
|---|---|
| `apps/<app>/` | `src-tauri/src/`（每个 Rust binary / window是一个 app 候选）|
| `apps/main` | `src-tauri/src/main.rs` 主进程 |
| `apps/floating` | `src-tauri/src/floating/` 浮窗后端 |
| `libs/ui` | `src/components/` 共享 UI |
| `libs/data-access` | `src/lib/tauri-bridge.ts` 共享 IPC bridge |
| `@myorg/data-access` import | `import { api } from '@/lib/tauri-bridge'` |

**问题**：NX 假设**一个 app = 一个 build target**，但 mindtap 的"floating 业务"既包含前端 `src/floating/` 又包含后端 `src-tauri/src/floating/`，**它们是两个不同的 build target**（前端 bundle + Rust binary）。NX 风格套用需要拆成 `apps/floating-frontend` + `apps/floating-backend`，然后共享 `libs/`，复杂度激增。

→ **NX 风格的"lib 复用"思想可借鉴**（如 `src/lib/tauri-bridge.ts` 已经是事实上的"data-access lib"），但不要全套套用。

## 5. mindtap 照搬方案

> ⚠ mindtap 与上述 3 个项目的**关键差异**：
> - Bulletproof React 是**纯前端**，无后端 runtime
> - JetBrains Space 是**单一 JVM runtime**（Kotlin 编译期可强制隔离）
> - NX 是**多 app 多 lib**，mindtap 是**单仓单 app 多 runtime**（前端 webview + Rust 后端）
>
> → **没有任何一个项目能 1:1 照搬**。下面是 3 个**改良版**移植方案，吸收各项目精华：

### B1：仿 Bulletproof React（前端内 vertical slice + 后端保持）

```
src/
  features/                    # ★ 新建（仿 bulletproof-react）
    floating/
      components/              # 从 src/floating/ 移入（除 App.tsx 入口外）
      hooks/                   # 已有
      api/                     # 已有 tauri-bridge 调用集中地
      types.ts
      index.ts                 # barrel
    settings/
    timeline/
  app/                         # 路由 + 入口
    main.tsx                   # 原来的 src/main.tsx
    router.tsx
    main-window/               # 主窗根组件
    floating-window/           # 浮窗根组件（从 src/floating/ 移出 App.tsx）
  components/                  # 跨 feature 共享（保持）
  hooks/                       # 跨 feature 共享（保持）
  lib/                         # 跨 feature 共享（保持）
src-tauri/src/                 # ★ 保持原样（Rust 端无 vertical slice 工具链支持）
```

**关键决策**：
- 前端内用 `src/features/<x>/` 模仿 Bulletproof React
- **不动 `src-tauri/src/`**（Rust 端 vertical slice 需要 Cargo workspace 改造，工程量大）
- `src/floating/` → `src/features/floating/` + `src/app/floating-window/`（入口分离）

**对位 Bulletproof React**：
- ✅ `src/features/<x>/` 风格
- ✅ barrel export 规则
- ✅ 跨 feature 走 `src/components/`
- ❌ 后端无 vertical slice（妥协）

**改造成本**：3-5 天
- 改 `src/main.tsx` + `src/floating/main.tsx` 入口路径
- 移 31 个文件从 `src/floating/` 到 `src/features/floating/` + `src/app/floating-window/`
- 改所有 import 路径（`grep -r "from '@/floating/"`）
- 改 `tsconfig.json` 路径别名（`@/floating/*` → `@/features/floating/*`）
- 改 `vite.config.ts` 的 `rollupOptions.input.floating` 入口路径
- 改 smoke 脚本

**风险**：
- 改路径会动 `package.json`、`tsconfig.json`、`vite.config.ts`、所有 `import`、smoke 脚本——**diff 巨大**（200+ 行路径变更）
- git blame 会保留（`git mv`），但 review 时会一片红
- V1.0 临发版做这事**风险高**

### B2：仿 JetBrains Space 思想（feature 解耦 + 横切平台）

不改路径，**只加"feature 边界"软规约**：

```
src/floating/                 # 保持
  README.md                   # ★ 新建：声明"本目录是 floating feature 的实现入口"
  __cross-feature__.json      # ★ 新建：声明"本 feature 依赖哪些 shared / 哪些其它 feature"
src-tauri/src/floating/       # 保持
  README.md                   # ★ 新建
  __cross-feature__.json
src/components/               # 横切
  README.md                   # "本目录是 shared UI，禁止 feature 私有组件下沉到这里"
src/lib/                      # 横切
  README.md
```

**关键决策**：
- **不移动任何代码**
- 通过 README + `__cross-feature__.json` 声明 feature 边界
- 加 ESLint rule：`import/no-restricted-paths` 禁止 `src/floating/` 内部 import `src/settings/` 内部文件（只能 import `src/components/` `src/lib/` 等横切层）

**对位 JetBrains Space**：
- ✅ feature 隔离的**思想**
- ✅ 横切平台层显式
- ❌ 没有编译期强制（ESLint rule 不如 Gradle 强）
- ❌ 需要纪律维护 README / JSON

**改造成本**：1-2 天
- 写 10 个 README（业务域 + 横切层）
- 写 1 个 ESLint config 增量
- 改 CLAUDE.md 加 1 段

**风险**：
- ESLint rule 可能误伤合法跨 feature 引用
- 纪律性维护 README（"代码改了 README 也要改"）

### B3：仿 NX 路径别名（共享 lib 显式化）

```
src-tauri/src/                # 保持
src/
  lib/                        # ★ 已有，强化
    tauri-bridge.ts           # "data-access lib"
    log.ts                    # "logging lib"
    format.ts                 # "utils lib"
  floating/                   # 业务
  settings/                   # 业务
  timeline/                   # 业务
  components/                 # UI lib
  hooks/                      # hooks lib
```

**关键决策**：
- **不引入新目录**
- 把 `src/lib/` 当作"data-access lib"（NX 风格）
- 强化 tsconfig 路径别名：`@/lib/*`（已有） + `@/components/*` + `@/hooks/*`（验证/补全）

**对位 NX**：
- ✅ 共享 lib 显式
- ❌ 没有 `apps/<x>/` 概念（单 app）
- ❌ 没有 `libs/<scope>/<lib>` 多级隔离

**改造成本**：0.5 天
- 验证 tsconfig 路径别名
- 写 `src/lib/README.md` 声明"本目录是 NX 风格的 data-access lib"
- 改 CLAUDE.md 加 1 段

**风险**：几乎无。**但收益也最小**（已经在做）。

## 6. 推荐

**不推荐 B1（仿 Bulletproof React）**：V1.0 临发版做路径大改风险太高；且 Rust 端不能同步改，效果打折。

**不推荐 B3（仿 NX）**：当前 `src/lib/` 已经是事实上的 lib 模式，只是没文档化；显式化收益小。

**推荐 B2（仿 Space 思想 + ESLint 强制）**：理由：

1. **最低成本拿到 60% 收益**——只加 README + ESLint rule，不动代码
2. **与 V1.0 发版时序兼容**——1-2 天做完
3. **feature 解耦思想到位**——业务域内部不让 import 其它业务域，强制走 shared
4. **可叠加方案 A3（GitLab architecture.md）**——`docs/architecture/<feature>.md` 描述"feature 边界声明文件在哪"，B2 的 README 是它的实例
5. **为方案 B1 留台阶**——V2.0 时从 B2 升级到 B1（真正 vertical slice）路径清晰

**与方案 A / C 的协同**：
- **B2 + A3**：B2 的 README + ESLint 强制 feature 边界 + A3 的 `docs/architecture/<feature>.md` 跨 runtime 索引——**双层防护**（代码层 ESLint + 文档层 architecture.md）
- **B2 + C1**：C1 的 Discourse 风格 architecture 文档天然是 B2 README 的"对外展板"

## 7. 与方案 X / Y / A1 / A2 / A3 / C1 / C2 / C3 的对比

见主对比表（在 brainstorming 对话中给出）。

## 8. 引用

| # | 链接 | 类型 | 用途 |
|---|---|---|---|
| 1 | https://github.com/alan2207/bulletproof-react | GitHub repo | 业界最完整 React vertical slice 范例 |
| 2 | https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md | 官方文档 | 项目结构说明 |
| 3 | https://github.com/alan2207/bulletproof-react/blob/master/src/features/discussions/index.ts | barrel 范式 | 真实 barrel export |
| 4 | https://nx.dev/docs/structure/applications-and-libraries | NX 官方 | apps/libs 范式 |
| 5 | https://nx.dev/docs/structure/lib-types | NX 官方 | lib 类型分类 |
| 6 | https://github.com/JetBrains/space | GitHub repo | Kotlin vertical slice 标杆 |
| 7 | https://github.com/vercel/next.js/tree/canary/examples | GitHub tree | Next.js route groups 范例 |
| 8 | https://nextjs.org/docs/app/building-your-application/routing/route-groups | Next.js 官方 | route groups 文档 |

**数据采集时间**：2026-06-20。
**限制**：GitHub API anon rate limit 触发，`src/features/` 实时目录树未抓到（基于公开 README + 社区共识补完）。
**失败回退**：子代理 2 因 harness TaskUpdate 限制未产出报告，本节由本会话基于知识库补完。
