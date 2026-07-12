# L3 Gating — Windows 实测强制规则

> **生效日期**: 2026-07-13
> **触发**: V0.2.5~V0.2.7 共 12 commit 自报"已修",但 Windows 端实测仍 FAIL——L3 没卡,所有 P0 反复修
> **状态**: ✅ 已立(rule,非 task)

## 一、什么是 L3

```
L1: vitest + happy-dom(单元 + 集成测试)
L2: cargo test + tsc --noEmit + cargo clippy + cargo fmt
L3: Windows 端 npm run tauri dev 实际跑 — 用户视角验证
```

**L3 是 hard gate**。L1 + L2 全 PASS 但 L3 FAIL → 不允许 commit 标 "已修"。

## 二、为什么要 L3

V0.2.5/V0.2.6/V0.2.7 的反模式沉淀里,反模式 15(commit message 撒谎)的根因之一是:

> Playwright e2e + vitest 都用 `window.__TAURI_INTERNALS__.invoke = mock` 绕过 Tauri runtime。
> 任何"WebView2 transparent / 原生菜单 / Overlay titleBar / setFocusable 闪退"这类 **Windows-only 行为**,
> mock 测试 100% PASS,但 Windows 端 100% FAIL。

也就是说:**只有 L3 才能验证 Tauri 2 + WebView2 的真实行为**。L1/L2 都不行。

## 三、L3 必查清单(7 层 + 行为契约)

任何对 Windows-side runtime(Tauri / WebView2 / 原生菜单 / Rust 后端)的改动后,commit 前必跑:

| 层 | 检查项 | 验证方式 | 失败症状 |
|---|---|---|---|
| **1** | Tauri 进程存活 | Task Manager `mindtap.exe` PID + WorkingSet | 进程崩溃 / 退出 |
| **2** | webview 已创建 | tauri.conf.json `windows[1].label=floating` + DevTools 无 "window load failed" | `ensure_window` 失败 |
| **3** | webview visible | 启动后浮窗显示在右下角 | 浮窗被 `hide()` 后没回 show |
| **4** | webview 内容加载 | DevTools 无 error;React mount 成功(useActiveTask 无 unhandled rejection) | floating.html 加载失败 / React crash |
| **5** | 物理尺寸正确 | DevTools 检查浮窗 DOM 320×36(折叠)/ 360×280(展开);setSize 后 outerSize 同步 | 展开态被裁 |
| **6** | 物理位置避系统 chrome | 浮窗 y ≥ 主屏高度 - 36 - 100(避 Win 11 任务栏 48px) | 浮窗被任务栏遮 |
| **7** | 视觉样式挂载 | 浮窗顶层 div `className` 含 `glass-l2` / `glass-l3` token | 玻璃外观失效 |

### 行为契约(每个 feature 的 DoD §5 单独列)

PRD §3 列出的每个用户场景都要在 L3 跑一遍,确认用户视角不破。

## 四、L3 实操流程

### 改代码后

```bash
# 1. WSL 内 push
cd /home/jason/workspace/mindtap
git commit -m "fix(floating): V0.2.0.6 右键被折叠态根 div 抢占"
git push origin develop

# 2. D:\ 端 pull(强制 — 详见 .claude/rules/dev-sync-before-windows-verify.mdc)
cd D:\workspace\mindtap
git pull

# 3. D:\ 端跑 dev
scripts\dev.bat
# 或:npm run tauri dev

# 4. 手工跑 7 层 checklist + PRD 用户场景
# 5. 在 docs/tasks/<task>/evidence.md 写实测截图 + 步骤
```

### D:\ 端不可达时(罕见)

如 D:\ 端不可达,**严禁** commit `chore(release):` 或合并 release 分支。
可以在 commit message 里写 `[L3-deferred]` 但必须:
1. 同时开 follow-up task 跟踪 L3
2. release notes 里标注"待 L3 验证"
3. 不允许这个版本号被其他人复用

## 五、L3 失败的处理

L3 FAIL 不要"假装没看见":

1. **不**允许把 L3 FAIL 写进 commit message 当作"已知问题"放过
2. **不**允许 L3 FAIL 的 commit 进 release 分支
3. **不**允许 L3 FAIL 后只改 L1/L2 让它"通过"
4. 必须回到 `systematic-debugging` Phase 1 重新枚举 root cause,见 `.claude/rules/`

如果 L3 FAIL 但 L1/L2 PASS,**100% 是 L1/L2 测试覆盖错了**——参见 V0.2.7 retro §3 反模式 16(测试只覆盖字面包含,漏断行为生效)。

## 六、反模式对应(为什么 L3 必须强制)

| 反模式 | 表现 | L3 gating 防御 |
|---|---|---|
| **14 反复修最多次** | 同组 P0 fail V0.2.5/V0.2.6 各打一次都没真修 | L3 hard gate 拦住,失败不能 commit |
| **15 commit 撒谎** | 33 commit 中 14 个 claim/实际不一致 | L2 grep 反模式 15 + L3 实测双卡 |
| **16 测试字面断言** | regex 命中注释行,行为没生效测试仍 PASS | L1 行为断言 + L3 实测双卡 |

## 关联

- [versioning-rule.md](./versioning-rule.md) — bug 归属 + PATCH 命名
- [doc-layers.md](./doc-layers.md) — L2 Tech §5 DoD 是 L3 验证的来源
- `.claude/rules/dev-verify-before-commit.mdc` — 本规则的 agent 强制入口
- `.claude/rules/dev-sync-before-windows-verify.mdc` — WSL → D:\ 同步
- V0.2.7 retro §3 反模式 14/15/16 触发本规则