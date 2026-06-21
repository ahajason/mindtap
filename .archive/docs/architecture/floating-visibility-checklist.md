# 浮窗可见性 7 层 Checklist

> 任何浮窗改动后必须**自上而下逐层 PASS**,才能算"完成"。漏掉任何一层 → 用户看不到浮窗 → 返工。

## 7 层 + 验证手段

| # | 层 | 验证手段 | 失败症状 |
|---|---|---|---|
| 1 | **Tauri 进程存活** | `pgrep -f 'target/debug/mindtap'` | 进程崩溃/退出 |
| 2 | **webview 已创建** | `mindtap.log` 含 `floating geometry applied: min=320x36` | `ensure_window` 失败 |
| 3 | **webview 状态 visible** | SettingsPage "浮窗状态: ■ 显示中"(`floating_is_visible` 返回 true) | NSWindow 不可见 |
| 4 | **webview 内容加载** | DevTools console 无 error,React mount 成功(`useActiveTask` 没抛 unhandled) | floating.html 加载失败 / React crash |
| 5 | **物理尺寸正确** | `mindtap.log` 含 `floating_set_height` 调用;展开态 `apply_floating_geometry: max=480x460` | webview 卡 320×36,展开态被裁 |
| 6 | **物理位置避开系统 chrome** | macOS 顶栏 ~25px,Dock 区域 ~80px;位置 y ≥ 50 且不在 Dock 区域 | 浮窗被菜单栏/Dock 遮住 |
| 7 | **视觉样式挂载** | FloatShell 顶层 div `className` 含 `floating-root folded/expanded` | 玻璃外观失效(透明不可见) |

## 已知盲区(commit 前必查)

| 盲区 | 原因 | 防御 |
|---|---|---|
| **Playwright e2e 用 Tauri mock 完全绕过 capability/物理层** | `window.__TAURI_INTERNALS__.invoke = mock` 不触发 Tauri runtime | **任何浮窗改动必须跑 `npm run smoke:floating`,不只 vitest** |
| **CSS 契约测试 ≠ 挂载测试** | `floating.test.ts` 测 CSS 文件包含 `.floating-root`,不测组件挂载 | 改用 `expect(root.className).toMatch(/floating-root/)`(见 `FloatShell.test.tsx`) |
| **macOS 顶栏 ~25px 遮默认 (0,0)** | `tauri.conf.json` floating 没指定 x/y | `useWindowPosition` 首次启动 setPosition(100, 60) |
| **rust command + frontend wrapper 已实现 ≠ 已 wire** | D-13 `floating_set_height` + tauri-bridge wrapper,App.tsx 没调 | hook / useEffect 验证:grep `api.\|invoke(` 后必须有调用点 |
| **jsdom 不渲染 layout,scrollHeight=0** | clampHeight(0, bounds) → 36,测试通过但真机 ≠ | smoke 测试用真 Tauri runtime,不走 jsdom |

## 修改浮窗的完成定义(DoD)

```bash
# 1. 静态检查 — vitest 100% green
npx vitest run

# 2. 编译检查 — build clean
npm run build

# 3. 运行时检查 — smoke 7 层 PASS(必须,不接受 mock)
npm run smoke:floating

# 4. cargo check 干净
cargo check --manifest-path src-tauri/Cargo.toml
```

**任何一项 FAIL → 不得 commit**,继续修。

## 实施脚本

- `scripts/floating-smoke.sh` — 一键跑 7 层验证,输出 PASS/FAIL + 失败层
- `npm run smoke:floating` — 包装上面脚本
- 见 [`docs/architecture/runtime-verification.md`](./runtime-verification.md) 了解 runtime 验证设计原则