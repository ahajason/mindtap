# WSL 侧执行边界与 D:\ 交接清单

> 2026-08-01 建立。V0.2.1 工作台账核心各批次开发过程中,WSL 与 D:\ 的职责边界。
> **2026-08-02 重大更新**:WSL 已能跑 Rust 编译验证(`cargo test` 40 passed / `cargo clippy`),详见 §七;WSL 只差 Tauri dev + 实机视觉验证。
> **2026-08-01 更新**:三个开发批次已完成并合并,QA 交接清单见 §六。

## 一、WSL 能做什么(已验证)

| 能力 | 命令 | 状态 |
|---|---|---|
| 前端 vitest | `npm test` | ✅ 27 文件 / 93 测试通过(含批次1-3 新增 23 个) |
| 前端类型检查 | `npx tsc --noEmit` | ✅(build 一部分) |
| 模块边界检查 | `npm run lint:boundaries` | ✅ |
| **前端完整 build** | `npm run build` | ✅ tsc + vite + boundaries 一体化,双入口产出 dist/ |
| **Rust 格式检查** | `cargo fmt --check` | ✅ **纯语法检查,不需编译链接**——WSL 可跑;已修 item.rs 16 处 |
| **Rust 单测** | `cargo test` | ✅ **2026-08-02 突破**:40 测试全过(假 cc 修复后,见 §七) |
| **Rust lint** | `cargo clippy --all-targets` | ✅ 可跑,4 个 `let _ =` warning(待修) |
| 写代码 / 写文档 | — | ✅ |
| git commit / push | — | ✅ |
| 前端 TDD 红绿循环 | vitest watch | ✅ 可即时闭环 |

## 二、WSL 不能做什么(已验证)

| 能力 | 失败原因 | 处理 |
|---|---|---|
| ~~`cargo test` / `cargo check`(Rust 编译)~~ | ✅ **已修复(2026-08-02)**——见 §七;根因是 `/home/jason/.local/bin/cc` 假编译器,已用 gcc 链接器持久化修复,现在 WSL 直接 `cargo test` 40 passed | WSL 可跑 |
| `cargo clippy` | ✅ **WSL 可跑**(2026-08-02,exit 0,4 个 `let _ =` warning) | WSL 可跑 |
| `cargo fmt --check` | ✅ **可用**(纯语法,不需编译) | WSL 已跑通 |
| `npm run tauri dev` | Tauri 需 Windows WebView2 | D:\ 端跑 |
| vitest coverage | `@vitest/coverage-v8` 未装(收益低,未装) | 跳过 |
| 视觉 / 交互实测 | Windows-only 透明/菜单/焦点 | D:\ 端跑 |

> **结论**:Rust 后端 TDD 的"红→绿"闭环在 WSL **已可用**(2026-08-02 起,cargo test 40 passed)——WSL 可直接写测试跑测试;`cargo clippy` 也可跑。Tauri dev / 实机视觉验证仍是 WSL 唯一不可做的部分(D:\ 端)。前端 vitest 照旧。

## 三、D:\ 端执行清单(每次批次交付后)

> 在 D:\ 端 `D:\workspace\mindtap` 执行,验证后把结果反馈回 WSL。

### 3.1 同步
```
# WSL 内(已 commit)
git push origin develop
# D:\ 端
git pull
```

### 3.2 Rust 后端验证
```
cd src-tauri
cargo test          # db 状态机 + 不变量(WSL 即可跑,2026-08-02 起,见 §七)
cargo clippy --all-targets   # 无 warning(WSL 可跑)
cargo fmt --check   # 格式化(WSL 可跑)
```

> **2026-08-02 更新**:Rust 验证已不再强依赖 D:\,WSL 直接跑即可。D:\ 端保留为「实机验证 + Tauri dev」。

### 3.3 前端验证
```
cd D:\workspace\mindtap
npm test            # vitest
npx tsc --noEmit    # 类型检查
npm run lint:boundaries
```

### 3.4 实机验证(L3 hard gate)
```
scripts\dev.bat     # Tauri dev(Windows 侧)
```
按 `docs/tech/v0.2.1-workbench-core-tech.md` §5 DoD L3 逐条实测。

## 四、交接约定

- **WSL 只负责**:写代码 + 文档 + 前端测试 + git 提交
- **D:\ 只负责**:Rust 编译/测试 + 实机视觉验证 + 反馈
- **错误反馈格式**:D:\ 端 `cargo test` 具体失败输出 + 复现步骤 → 回传 WSL 修
- **不得**:在 WSL 假装 `cargo test` 通过;不得把 D:\ 验证结果写进 WSL 的 commit(反模式 15)

## 五、并行开发切分(基于以上边界)

| 批次 | 模块 | WSL 能否 TDD | 验证端 |
|---|---|---|---|
| 批次1 | 后端 ItemRepo + item 表 + 命令 | ❌ 只能写代码 | D:\ `cargo test` |
| 批次2 | 前端展开态 + 并行任务卡 | ✅ vitest | WSL `npm test` + D:\ 实测 |
| 批次3 | 快捷键 + 失真气泡 | ⚠️ 前端部分 vitest;Rust 部分 D:\ | 混合 |

> 批次 1(后端)现已可在 **WSL 完整红绿闭环**(cargo test 40 passed,见 §七);批次 2(前端)可 WSL 完整 TDD。

## 六、QA 交接清单(2026-08-01,D:\ 端执行)

> **背景**:matt code-review + grilling 已在 WSL 完成并修复全部硬问题(编译断裂/双重结算/bubble死路/红测试 + 时长滚动/重复提示/历史迁移/运行期检测)。
> gstack qa 是浏览器级 web QA,需要能运行的 app——WSL 无法启动 Tauri,故按 gstack qa 的 health score 框架,把浏览器级验证交接给 D:\ 端。

### 6.1 Rust 后端硬验证(最高优先级)

> **2026-08-02 更新**:WSL 已能跑 Rust 编译(cargo test 40 passed / clippy),见 §七。以下命令 **WSL 直接可跑**,D:\ 不再作为 Rust 验证的必需端。

```
cd src-tauri
cargo test        # db/item.rs 约 20 个测试(状态机/多并行/结算/待确认/失真/重复/跨天)
cargo clippy --all-targets
cargo fmt --check
```

**若 cargo test 红,回传 WSL**:具体失败输出 + 复现步骤。

### 6.2 实机验证清单(L3 hard gate,按 tech §5 DoD)

```
scripts\dev.bat   # Tauri dev
```

| # | 场景 | 验收 |
|---|---|---|
| 1 | **全局快捷键捕获**(PRD 1.1) | 任意应用内 Ctrl+Shift+Space → 浮窗展开+输入框聚焦 → 输入回车 → 保存进收件箱+浮窗收起。全程 ≤3 秒 |
| 2 | **焦点归还** | 捕获后焦点回到原窗口,连续捕获 10 条不打断输入流 |
| 3 | **并行任务卡**(PRD 1.2) | 展开态显示全部进行中卡+收件箱项;每卡内容/累计时长实时滚动/进度备注直接显示 |
| 4 | **5 卡并行** | 5 个并行任务同时计时互不干扰;全屏应用下浮窗置顶可见 |
| 5 | **并行开始** | 点 B 卡「开始」→ A 保持进行中并行计时,B 也进入进行中,一步完成;手动暂停 A 退回待办 |
| 6 | **失真气泡** | 冷却 2h(可临时把 DISTORTION_IDLE_MS 调小验证)→ 独立气泡弹出 → 5s 无操作自动暂停 → 回来[记入]/[丢弃] |
| 7 | **跨天停表** | 昨晚 active 今早启动 → 退回待办,时长不膨胀 |
| 8 | **重复捕获轻提示** | 捕获同名任务 → 输入框下方提示「已有同名任务」,不阻止 |
| 9 | **V0.2.0 不回归** | 折叠/展开/拖动/位置记忆/原生菜单/快捷键 toggle |

### 6.3 gstack qa health score 交接

> WSL 已完成的测试视为「代码级 health」,实机验证后补「浏览器级 health」。

| 维度 | WSL 已验 | D:\ 待验 | 依据 |
|---|---|---|---|
| 单元测试 | ✅ 93 vitest | ✅ **40 cargo test(WSL 已跑,2026-08-02)** | 27 文件全过 |
| 类型/边界 | ✅ tsc + boundaries | — | 全绿 |
| 功能正确性 | ✅ 逻辑修复 | ⏳ 实机 | 审查修复已提交 |
| 视觉/交互 | ⏳ | ⏳ | Liquid Glass 铁律需实机 |
| Windows-only | ⏳ | ⏳ | 焦点归还/还原/透明 |

### 6.4 反馈闭环

- D:\ 端验证后,把 `cargo test` 结果 + 实机 QA 结果反馈回 WSL;
- 若有 bug:回传复现步骤 → WSL 修 → 重新 push → D:\ 复验;
- **不得**把「D:\ 验证通过」写进 WSL 的 commit(反模式 15)。

## 七、重大突破:WSL 跑通 cargo test / clippy(2026-08-02)

> **一句话**:此前「WSL 不能跑 Rust 编译」的根因不是 WSL 环境限制,而是 **PATH 里排前面的假编译器**挡住了 build-script;换用 gcc 链接器后,`cargo test` 在 WSL 全绿(40 passed)。

### 7.1 现象

- `cargo test` 能下载依赖、编译大部分 crate,但撞在 build-script 边界:`tauri-plugin-autostart` / `getrandom v0.3.4` 的 `build-script-build` 报 `No such file or directory (os error 2)` / `could not execute process ... (never executed)`;每次重试都在同一处失败。

### 7.2 根因

- `PATH` 中 `/home/jason/.local/bin` 排在 `/usr/bin` 前,`cc` 解析到 `/home/jason/.local/bin/cc`——一个**假编译器**(含 Node.js ABI 符号 napi_*/uv_*,编译时弹交互式「Select Language」UI,产物直接丢失)。
- rustc / cargo / cc-rs 全部用 `cc`,所以 build-script 一碰 cc 就失败;`cargo clean` 后仍失败,排除残留。

### 7.3 修复(持久化,用户级)

`~/.cargo/config.toml`(家庭目录,不入仓库):

```toml
[env]
CC = "/usr/bin/gcc"

[target.x86_64-unknown-linux-gnu]
rustflags = ["-C", "linker=/usr/bin/gcc"]
linker = "/usr/bin/gcc"
```

> 先试 `[env] RUSTFLAGS` 不生效,改用 `[target]` + `rustflags` + `linker` + `[env] CC` 组合;验证:`cargo test` 不带任何 env 变量 → **40 passed, 0 failed**。

### 7.4 意义

- **推翻旧边界**:WSL 不再只是「写代码 + 前端 vitest」,Rust 后端 TDD 的「红→绿」闭环现在 WSL 可独立完成;
- `cargo clippy --all-targets` 也可跑(4 个 `let _ =` warning 待修,exit 0);
- **仍然 D:\ 的**:Tauri dev / WebView2 / 透明 / 焦点 / 原生菜单这类 Windows-only 实机验证(WebView2 是 Windows 原生 COM 组件,WSL 复现不到)。

### 7.5 防复发

- 遇到任何「build-script 报 No such file or directory」,先查 `which cc` / `cc --version` 是不是真编译器;不要默认 WSL 环境限制;
- 此修复已写入 `~/.cargo/config.toml` 持久化,后续 session 直接可用。

## 关联
- CLAUDE.md「双工作树」段(同步流向)
- `docs/tech/v0.2.1-workbench-core-tech.md` §5 DoD
- `docs/governance/l3-gating.md`(L3 实测硬约束)
