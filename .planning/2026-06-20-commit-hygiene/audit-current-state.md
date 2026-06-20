# 当前 Commit 卫生审计报告（2026-06-20）

## 1. 最近 30 commit 量化统计

样本：`git log -30`（HEAD = `d533a5d`，时间范围 2026-06-20 当日）。

| 指标 | 值 |
|------|---|
| 平均 commit 文件数 | 3.10 |
| 平均 commit 行数（ins+del） | 234.7 |
| 平均 commit 插入行数 | 198.0 |
| 改 ≥3 个顶层目录的 commit 占比 | 5/30 = **16.7%** |
| 改 ≥5 个文件的 commit 占比 | 4/30 = **13.3%** |
| 改 ≤1 行的 commit 占比 | 3/30 = **10.0%** |
| 平均顶层目录数 / commit | 1.50 |
| 顶层目录跨度 ≥2 的 commit 数 | 6/30（含跨 `src` + `src-tauri` 4 次） |

### 重点观察

- **50% 的 commit 是「双胞胎」模式**（1 实现 + 1 测试对，2 文件），适合 TDD 节奏，但缺乏「业务打包」意识
- **跨层 commit 全部集中在 floating 域**（`src/floating/` + `src-tauri/src/floating/`），是合乎预期的"前端 + Rust 配套"，但**频繁在落 commit 前没有做最终跨层合并**
- **.gitignore 出现在 `40ae426` 的目录里**（`['.gitignore', 'tests', 'vite.config.ts']`）—— 这个 commit 同时改 `.gitignore` + 15 个 `tests/visual/**` snapshot + `vite.config.ts`，混了"基础设施变更"和"测试快照"两件事
- **510c494 / 6c0f404 / cbe44d4 在 `--name-only` 视图里显示空 stat**（实际是 1 文件 / 1 文件 / 1 文件），被统计为 0 文件 → 拉低了平均值 0.3

## 2. 同一业务被拆成多 commit 的案例

### 案例 A：浮窗 webview 尺寸自适应（D-13 + F4'）

涉及 commit：

| 哈希 | 主题 | 文件数 | ins | del |
|------|------|--------|-----|-----|
| `6055c2e` | fix(floating): D-13 webview 物理尺寸自适应 — 展开时调 `floating_set_height` | 3 | 75 | 0 |
| `737ede3` | **Revert** D-13（capability 缺失） | 7 | 2 | 184 |
| `??` 当前未提交 | App.tsx 改用 `win.setSize(new LogicalSize(...))` 走 V1.5 webview API 路径 + 配 test | — | — | — |

**问题**：
- 一个"展开时 webview 撑大"的需求，被拆成 **`6055c2e`（失败方案）→ `737ede3`（revert）→ 当前未提交的 F4'（V1.5 路径回归）**
- 5 个小时（20:01 → 20:26 → 21:50）内三态反复，最终正确实现还在 working tree 里
- 第一次提交时**没补 capability**（`floating_set_height` 需要 capability），commit 拆得太细，revert 又把测试一起删了，造成 churn

### 案例 B：浮窗菜单栏位置兜底（F3'）

涉及 commit：

| 哈希 | 主题 | 文件数 | ins | del |
|------|------|--------|-----|-----|
| `75d394b` | fix(floating): useWindowPosition 首次启动挪浮窗到 (100, 60) 避 macOS 菜单栏 | 6 | 99 | 10 |
| `d533a5d` | **Revert** F3' useWindowPosition | 6 | 26 | 87 |
| `??` 当前未提交 | useWindowPosition.ts 加 P1 clamp 屏外 + 配 test | — | — | — |

**问题**：
- 跟案例 A **完全同构**：`fix` → `revert` → 新 `fix`（带更复杂逻辑：P1 clamp 屏外）
- 13 分钟（20:13 → 20:26）内 revert，回滚原因未在 commit body 写清楚（根据 git log 看是策略调整，但读者无法从 commit 看到）
- 当前 working tree 里的实现**比被 revert 的版本更大**（+67 行 vs 之前 +12 行），已经和"被 revert 的同一文件"形成新的 delta

### 案例 C：floating capability 创建

| 哈希 | 主题 | 文件数 | ins | del |
|------|------|--------|-----|-----|
| `4c66e25` | fix(capability): create floating.json for floating window webview | 2 | 61 | 0 |
| `737ede3` | revert 时把 `floating.json` 的 +10 行删了 | 7 | 2 | 184 |

**问题**：
- `4c66e25` 创建 `src-tauri/capabilities/floating.json` 是 **D-13 修复的前置依赖**（`floating_set_height` command 需要 capability）
- **但 D-13 提交 (`6055c2e`) 时 capability 还没建**（建 capability 的 commit 在 6055c2e 之后）
- commit `4c66e25` 自身独立可读，但放在时间线里看是「为了补 D-13 的窟窿」，属于**没有按业务打包的零散提交**

### 案例 D：浮窗 V3 重构（D-01 ~ D-17 编号系）

最近 30 commit 中有 **19 个 `feat(floating): D-XX`**，每个 commit 是 1-2 个新组件 / 1 个新原子能力：

```
f8cd487 D-02 Segmented mutex ⏱/＋
844d674 D-03 SharedHeader 头 A 方案 + 退化
a0c7e27 D-04 FormSubPanel 解耦 submit + type chips
73cd521 D-05 FoldedBar 5 元素
8deaf03 D-06/D-02 TimerSubPanel action pair + 副标题
ec38896 D-08 B 方案 Button 组件
b407b55 D-09 StatusDot 3 态呼吸 v6
0e1e0ad D-10/D-01/D-16 GlassSurface 4 variant OKLCH 玻璃
642faf9 D-11/D-12 FloatShell grid-rows + 4px drag
6c0f404 D-13 App.tsx 接入 FloatShell + OuterShell + GlassSurface
de31c2d D-17 OuterShell 接入 liquid-glass-react WebGL 外壳
```

**问题**：
- 这 19 个 commit 是 **「floating V3 重构」一个业务**，但被拆成 19 个 commit
- 每个 commit 单独能跑（这是好的），但合在一起后**没有「V3 floating 重构交付」这种汇总 commit**（如 `c1d98b2` 的 spec/plan 是设计文档，不是 commit）
- 读者看 log 只能看到"D-02 / D-03 / D-04 / ..."，需要外部 spec 才知道全貌
- D-13 在 commit body 里出现**两次**（`6c0f404` 接 FloatShell + `6055c2e` 物理尺寸），不同含义 → 编号冲突

## 3. 当前未提交改动分析

### 改动清单（按 git status + diff --stat）

| 状态 | 路径 | 改动规模 | 业务领域 |
|------|------|----------|----------|
| M | `CLAUDE.md` | +14 行 | 项目规约（浮窗 DoD） |
| M | `package.json` | +1 行（`smoke:floating` script） | 工具脚本 |
| M | `src-tauri/src/floating/mod.rs` | +6 行（`.position(100.0, 60.0)`） | 浮窗 Rust 兜底 |
| M | `src/floating/App.test.tsx` | +50 行 | 浮窗测试 |
| M | `src/floating/App.tsx` | +38 行（useWindowPosition + setSize） | 浮窗前端 |
| M | `src/floating/FloatShell.test.tsx` | +24 行 | 浮窗测试 |
| M | `src/floating/FloatShell.tsx` | +13 行（floating-root 类名修复） | 浮窗前端 |
| M | `src/floating/hooks/useWindowPosition.ts` | +67 行（DEFAULT + P1 clamp） | 浮窗 hook |
| M | `src/floating/liveDurationMs.test.tsx` | +17 行（mock 完善） | 浮窗测试 |
| ?? | `src/floating/hooks/useWindowPosition.test.ts` | 新文件 ~150 行 | 浮窗测试 |
| ?? | `.planning/` | 新目录（floating-redesign 规划） | 过程文档 |
| ?? | `SKILLS/` | 新目录（specs-writer 技能） | 基础设施 |
| ?? | `docs/architecture/floating-visibility-checklist.md` | 新文件 | 项目文档 |
| ?? | `docs/competitors/` | 新目录（taskisland 调研） | 调研文档 |
| ?? | `docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md` | 新 spec | 设计文档 |
| ?? | `scripts/floating-smoke.sh` | 新脚本（7546 字节） | 工具脚本 |
| ?? | `spec/` | 新目录（checkin-subtypes spec） | 设计文档 |

**总规模**：modified 9 个文件 + 222 ins / 10 del；untracked 7 个目录或顶层文件。

### 业务归类建议

#### 业务组 1：浮窗 V3 可见性修复（核心 fix）

涉及文件（modified + untracked）：

| 文件 | 角色 | 业务 |
|------|------|------|
| `src-tauri/src/floating/mod.rs` | Rust 兜底 `.position(100, 60)` | F5' 启动期位置兜底 |
| `src/floating/hooks/useWindowPosition.ts` | hook + P1 clamp 屏外 | F3' 位置兜底（V1.5 路径回归 + 加强） |
| `src/floating/hooks/useWindowPosition.test.ts` | hook 测试 | F3' 配套 |
| `src/floating/App.tsx` | 接入 useWindowPosition + setSize on expand | F3' + F4' |
| `src/floating/App.test.tsx` | 接入 + setSize 测试 | F3' + F4' 配套 |
| `src/floating/FloatShell.tsx` | `floating-root` 类名修复 | L5 挂载契约 |
| `src/floating/FloatShell.test.tsx` | 挂载契约测试 | L5 配套 |
| `src/floating/liveDurationMs.test.tsx` | mock 完善 | 支撑 F3' + F4' |

**建议 commit 拆分**（不是 1 个，因为逻辑可分层）：

1. **commit A（fix(floating)）**：F3' 位置兜底 — hook + Rust `.position` 兜底 + App.tsx wire + 配套测试
   - 文件：`src-tauri/src/floating/mod.rs` + `useWindowPosition.{ts,test.ts}` + `App.{tsx,test.tsx}` + `liveDurationMs.test.tsx`（mock）
   - 目录：`src/` + `src-tauri/`
   - 规模：~180 ins / ~5 del

2. **commit B（fix(floating)）**：F4' 尺寸自适应 — 走 V1.5 webview API `setSize(LogicalSize)` + FloatShell `floating-root` 类名修复 + 配套测试
   - 文件：`FloatShell.{tsx,test.tsx}` + `App.{tsx,test.tsx}` (F4' 那部分) + `liveDurationMs.test.tsx`（mock 完善）
   - 目录：`src/`
   - 规模：~85 ins / ~5 del

3. **commit C（chore + docs）**：CLAUDE.md DoD 段 + package.json `smoke:floating` script + 新增 `scripts/floating-smoke.sh` + 新增 `docs/architecture/floating-visibility-checklist.md`
   - 文件：3 modified + 2 new
   - 目录：`docs/` + `scripts/` + `package.json`
   - 规模：~80 ins

> **如果接受 "floating V3 交付" 是 1 个业务**：可以合成 1 个 commit `fix(floating): V3 可见性修复 (F3'+F4'+L5)`，但会失去"独立可回滚"的粒度。

#### 业务组 2：基础设施 / 调研素材

| 路径 | 业务 | 建议 |
|------|------|------|
| `.planning/2026-06-20-floating-redesign/` | 过程文档 | **gitignore** 或打 1 个 `chore(planning): add floating-redesign planning` |
| `SKILLS/` | specs-writer 技能资源 | **gitignore** 或 1 个 `chore(skills): add specs-writer` |
| `docs/competitors/` | TaskIsland 调研 | 1 个 `docs(competitors): add taskisland research` |
| `docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md` | 签到子类型设计 | 1 个 `docs(specs): add checkin-subtypes design` |
| `spec/` | 同样的签到子类型 spec（与 `docs/superpowers/specs/` 重复？） | 1 个 `docs(spec): add checkin-subtypes spec` —— **需澄清** `spec/` vs `docs/superpowers/specs/` 谁是真源 |

**疑问**：`spec/checkin-subtypes/` 和 `docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md` 是同一份还是两份独立 spec？两个目录并存暗示流程不统一（见 CLAUDE.md 规定 `docs/specs/`，本仓库还有 `docs/superpowers/specs/` 和 `spec/` 三处）。

### 打包前后 commit 数对比

| 方案 | commit 数 |
|------|----------|
| 不打包（按文件散开） | 9 modified + 7 untracked 块 → **16+ 个 commit** |
| 按业务打包（建议） | 业务组 1 = 2-3 个 + 业务组 2 = 4-5 个 = **6-8 个 commit** |
| 极限打包（floating = 1） | 业务组 1 = 1 个 + 业务组 2 = 2-3 个 = **3-4 个 commit** |

## 4. 现状问题诊断

### 4.1 「fix → revert → 新 fix」模式反复出现

**证据**：
- `6055c2e` (fix D-13) → `737ede3` (revert) → ?? (V1.5 路径新 fix)
- `75d394b` (fix F3') → `d533a5d` (revert) → ?? (F3' P1 clamp 增强版)
- `4c66e25` (建 capability) → `737ede3` (随 revert 删了 10 行) —— **churn 信号**：capability 创建和 revert 间只差几小时

**根因**：
- 单个 commit 不做"端到端验证"（vitest + build + smoke + cargo check 四件套不齐）
- commit body 写"全测 X/X 0 errors"是虚的，**实际 runtime（capability 缺失）没验**
- 按"原子能力"切 commit（一次一个 hook、一个 setSize 调用），但缺乏"原子业务"切分

### 4.2 业务被拆成多 commit 的具体案例汇总

| 业务 | 实际 commit 数 | 理想 commit 数 | 散度 |
|------|----------------|----------------|------|
| floating V3 重构（D-01 ~ D-17） | 19 | 1 个 tag commit + 1 个总集 / 或按模块 4-5 个 | 19× |
| F3' 位置兜底 | 2 + ?? = 3 | 1 | 3× |
| F4' 尺寸自适应 | 2 + ?? = 3 | 1 | 3× |
| Playwright 视觉回归基建 | 3（gitignore / playwright.config / floating spec）| 2（config 合并 / spec）| 1.5× |

### 4.3 当前未提交改动如果不打包

- 9 modified + 1 untracked 测试文件 + 6 untracked 目录或文件 = **16+ 个散 commit**
- 实际可归并成 **6-8 个业务 commit**
- **额外的「业务组 2 基础设施」如果散开每个新目录各 1 个 = 6 个零散 commit**，可压成 2 个

## 5. 量化建议目标

### 5.1 未来 commit 目标规格

| 维度 | 目标值 | 当前 30 commit 实测 | 改进 |
|------|--------|----------------------|------|
| 1 commit = 1 业务 | 100% | ~50%（其余是 V3 拆解） | 合并 V3 提交到按模块汇总 |
| 文件数 / commit | 1-5（多文件可，但同业务） | 3.10 中位数 | 维持 |
| 顶层目录数 / commit | 1-2 | 1.50 | 维持 |
| 行数 / commit | 50-500 | 234.7 平均 | 维持 |
| 「改 ≤1 行」commit 占比 | 0% | 10% | **降 0**（这些是 typo / 注释）|
| 「fix → revert」配对 | ≤1 对 / 业务 | 已出现 2 对 | **降到 0**（靠四件套预防）|

### 5.2 强制约束（建议写入 CLAUDE.md）

1. **四件套全绿才允许 commit**（已有，需严格执行）
2. **单个 commit 必须能用一句话说清业务**（不是"改了 X"，而是"修了 F3' 位置兜底"）
3. **跨层（`src/` + `src-tauri/`）的 commit 必须配套**（不允许 capability / Rust 端和前端拆开）
4. **禁止 "改 ≤1 行" 单独 commit**（除非 typo 修复，但应和同一文件改动合并）
5. **V-N 编号系列重构，每模块（不是每组件）合 1 个 commit**，D-XX 编号写到 commit body 不写主题
6. **新基础设施（`.planning/` / `SKILLS/` / `spec/`）必须有 `.gitignore` 决策**——临时过程文件全部 gitignore，正式文档走 `docs/`

### 5.3 立刻可执行的下一步

- **当前 working tree 整理成 3-4 个 commit**（floating fix 拆 2-3 + 基础设施 1）
- **决定 `.planning/` 和 `SKILLS/` 的 git 命运**（`.gitignore` 或独立 commit）
- **复盘 `fix → revert` 根因**：四件套是否真的每次都跑了？capability 检查是否进了 DoD？
- **3 处 spec 目录收敛**（`docs/specs/` vs `docs/superpowers/specs/` vs `spec/`）—— 选 1 个，git mv 合并
