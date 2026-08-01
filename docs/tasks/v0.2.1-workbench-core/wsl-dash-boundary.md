# WSL 侧执行边界与 D:\ 交接清单

> 2026-08-01 建立。V0.2.1 工作台账核心各批次开发过程中,WSL 与 D:\ 的职责边界。
> **核心结论**:WSL 不跑完整项目(Rust 编译 / Tauri dev / 视觉验证),只写代码 + 文档 + 前端 vitest;Rust 后端验证 + 实机验证全部交 D:\ 端执行。

## 一、WSL 能做什么(已验证)

| 能力 | 命令 | 状态 |
|---|---|---|
| 前端 vitest | `npm test` | ✅ 21 文件 / 70 测试通过(基线绿) |
| 前端类型检查 | `npx tsc --noEmit` | ✅(build 一部分) |
| 模块边界检查 | `npm run lint:boundaries` | ✅ |
| 写代码 / 写文档 | — | ✅ |
| git commit / push | — | ✅ |
| 前端 TDD 红绿循环 | vitest watch | ✅ 可即时闭环 |

## 二、WSL 不能做什么(已验证)

| 能力 | 失败原因 | 处理 |
|---|---|---|
| `cargo test`(Rust 编译) | `tauri-plugin-autostart` build script 失败,`could not execute process ... build-script-build (No such file)` | **必须 D:\ 端跑** |
| `cargo clippy` / `cargo fmt` | 同上,依赖编译 | D:\ 端跑 |
| `npm run tauri dev` | Tauri 需 Windows WebView2 | D:\ 端跑 |
| 视觉 / 交互实测 | Windows-only 透明/菜单/焦点 | D:\ 端跑 |

> **结论**:Rust 后端 TDD 的"红→绿"闭环在 WSL 不可用,只能 WSL 写代码 → D:\ 端 `cargo test` 验证 → 反馈回 WSL 修。前端 vitest 是 WSL 唯一即时闭环。

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

## 关联
- CLAUDE.md「双工作树」段(同步流向)
- `docs/tech/v0.2.1-workbench-core-tech.md` §5 DoD
- `docs/governance/l3-gating.md`(L3 实测硬约束)
