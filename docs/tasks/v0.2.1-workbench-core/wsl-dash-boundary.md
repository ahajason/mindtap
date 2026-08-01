# WSL 侧执行边界与 D:\ 交接清单

> 2026-08-01 建立。V0.2.1 工作台账核心各批次开发过程中,WSL 与 D:\ 的职责边界。
> **核心结论**:WSL 不跑完整项目(Rust 编译 / Tauri dev / 视觉验证),只写代码 + 文档 + 前端 vitest;Rust 后端验证 + 实机验证全部交 D:\ 端执行。
> **2026-08-01 更新**:三个开发批次已完成并合并,QA 交接清单见 §六。

## 一、WSL 能做什么(已验证)

| 能力 | 命令 | 状态 |
|---|---|---|
| 前端 vitest | `npm test` | ✅ 27 文件 / 93 测试通过(含批次1-3 新增 23 个) |
| 前端类型检查 | `npx tsc --noEmit` | ✅(build 一部分) |
| 模块边界检查 | `npm run lint:boundaries` | ✅ |
| **前端完整 build** | `npm run build` | ✅ tsc + vite + boundaries 一体化,双入口产出 dist/ |
| **Rust 格式检查** | `cargo fmt --check` | ✅ **纯语法检查,不需编译链接**——WSL 可跑;已修 item.rs 16 处 |
| 写代码 / 写文档 | — | ✅ |
| git commit / push | — | ✅ |
| 前端 TDD 红绿循环 | vitest watch | ✅ 可即时闭环 |

## 二、WSL 不能做什么(已验证)

| 能力 | 失败原因 | 处理 |
|---|---|---|
| `cargo test` / `cargo check`(Rust 编译) | `tauri-plugin-autostart` build script 失败,`could not execute process ... build-script-build (No such file)`;`--lib` 也会编译整个 crate,无法隔离 | **必须 D:\ 端跑** |
| `cargo clippy` | 依赖编译 | D:\ 端跑 |
| `cargo fmt --check` | ✅ **可用**(纯语法,不需编译) | WSL 已跑通 |
| `npm run tauri dev` | Tauri 需 Windows WebView2 | D:\ 端跑 |
| vitest coverage | `@vitest/coverage-v8` 未装(收益低,未装) | 跳过 |
| 视觉 / 交互实测 | Windows-only 透明/菜单/焦点 | D:\ 端跑 |

> **结论**:Rust 后端 TDD 的"红→绿"闭环在 WSL 不可用,只能 WSL 写代码 → D:\ 端 `cargo test` 验证 → 反馈回 WSL 修。前端 vitest 是 WSL 唯一即时闭环;`cargo fmt --check` 是 Rust 侧唯一可跑的检查(已用于格式修复)。

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
cd D:\workspace\mindtap\src-tauri
cargo test          # db 状态机 + 不变量
cargo clippy --all-targets   # 无 warning
cargo fmt --check   # 格式化
```

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

> 批次 1(后端)在 WSL 无法红绿闭环,建议 **WSL 写完整后端 → 一次 D:\ cargo test 验证 → 修正**;批次 2(前端)可 WSL 完整 TDD。

## 六、QA 交接清单(2026-08-01,D:\ 端执行)

> **背景**:matt code-review + grilling 已在 WSL 完成并修复全部硬问题(编译断裂/双重结算/bubble死路/红测试 + 时长滚动/重复提示/历史迁移/运行期检测)。
> gstack qa 是浏览器级 web QA,需要能运行的 app——WSL 无法启动 Tauri,故按 gstack qa 的 health score 框架,把浏览器级验证交接给 D:\ 端。

### 6.1 Rust 后端硬验证(最高优先级)

> ⚠️ **WSL 从未编译过 Rust**。审查修复了编译断裂(删除 timer_session 引用链),但需 D:\ `cargo test` 证实无其它编译错误。这是唯一未验证的风险点。

```
cd D:\workspace\mindtap\src-tauri
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
| 5 | **切换零成本** | 点 B 卡「开始」→ A 自动退回待办,B 开始计时,一步完成 |
| 6 | **失真气泡** | 冷却 2h(可临时把 DISTORTION_IDLE_MS 调小验证)→ 独立气泡弹出 → 5s 无操作自动暂停 → 回来[记入]/[丢弃] |
| 7 | **跨天停表** | 昨晚 active 今早启动 → 退回待办,时长不膨胀 |
| 8 | **重复捕获轻提示** | 捕获同名任务 → 输入框下方提示「已有同名任务」,不阻止 |
| 9 | **V0.2.0 不回归** | 折叠/展开/拖动/位置记忆/原生菜单/快捷键 toggle |

### 6.3 gstack qa health score 交接

> WSL 已完成的测试视为「代码级 health」,实机验证后补「浏览器级 health」。

| 维度 | WSL 已验 | D:\ 待验 | 依据 |
|---|---|---|---|
| 单元测试 | ✅ 93 vitest | ⏳ cargo test | 27 文件全过 |
| 类型/边界 | ✅ tsc + boundaries | — | 全绿 |
| 功能正确性 | ✅ 逻辑修复 | ⏳ 实机 | 审查修复已提交 |
| 视觉/交互 | ⏳ | ⏳ | Liquid Glass 铁律需实机 |
| Windows-only | ⏳ | ⏳ | 焦点归还/还原/透明 |

### 6.4 反馈闭环

- D:\ 端验证后,把 `cargo test` 结果 + 实机 QA 结果反馈回 WSL;
- 若有 bug:回传复现步骤 → WSL 修 → 重新 push → D:\ 复验;
- **不得**把「D:\ 验证通过」写进 WSL 的 commit(反模式 15)。

## 关联
- CLAUDE.md「双工作树」段(同步流向)
- `docs/tech/v0.2.1-workbench-core-tech.md` §5 DoD
- `docs/governance/l3-gating.md`(L3 实测硬约束)
