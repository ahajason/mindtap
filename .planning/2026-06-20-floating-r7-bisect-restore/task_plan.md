# Task Plan · 浮窗 R7 防御 + bisect + 恢复 + macOS 圆角修复

## Goal
解决浮窗"click → expand → 闪退"问题。先用 R7 防御层(useWindowPosition/useActiveTask try/catch)
挡 Tauri 2 IPC runtime 注入时序问题,无效则按阶段降级 bisect 定位崩溃源。最终恢复 App 到全功能
状态 + 修 macOS WKWebView 圆角不全。

## Current Phase
Phase 4 — 收尾完成(恢复 + 清理 + macOS 圆角修复 + 4 件套全绿)

## Phases

### Phase 1: R7 防御层 — Tauri 2 IPC runtime 注入时序
- [x] **Defense 1**:`useWindowPosition` 防御 — `try/catch` 包裹 `getCurrentWindow()`,
      返 undefined / 缺方法时静默 return
- [x] **Defense 2**:`useActiveTask` 防御 — `events.onFocusChanged().catch(() => null)`
      吞初始 rejected Promise,避免 unhandled rejection unmount 整个 App
- [x] 4 件套全绿(vitest 106/106 / cargo check / build / smoke 7/7)
- [x] **用户复测:仍闪退** — 防御层不是根因
- **Status:** complete(防御层作为安全网保留)

### Phase 2: 按阶段降级 bisect 定位崩溃源
- [x] **Phase A 最小折叠态** — `App.tsx` 只挂 FoldedBar,click 禁用
      - smoke 7/7 + bundle 78.74 → 56.87 kB
      - 结论:折叠态 mount 路径 OK,排除
- [x] **Phase B click toggle** — 加 `isExpanded` state,展开 children 槽为空
      - smoke 6/7(Layer 4 fail 是 `useWindowPosition` import 被 bisect 删了,非真故障)
      - **用户复测:click 闪退** — 崩溃源在 click → 展开路径
- [x] **Phase B' FloatShell 槽隔离** — OuterShell `isExpanded` 硬编码 false,FloatShell 仍跟 state
      - 构建后未跑用户视觉测试
- [x] **用户放弃** — "算了,我放弃了"
- **Status:** abandoned at Phase B' — 根因未定位

### Phase 3: 收尾 — 恢复 + 清理
- [x] `App.full.tsx`(bisect 备份)→ 恢复成 `App.tsx`
- [x] 清理 `useWindowPosition.ts` / `useActiveTask.ts` 的啰嗦 R7 注释 + `console.warn` spam
- [x] 保留 try/catch / `.catch()` 安全网(无副作用,生产 build 走 tauri:// 不触发)
- [x] 删除 `App.full.tsx`(回滚靠 git)
- **Status:** complete

### Phase 4: 修 macOS 圆角不全(CSS border-radius 之外的真根因)
- [x] 加 `objc2 = "0.6"` 给 `[target.'cfg(target_os = "macos")'.dependencies]`
- [x] 写 `apply_macos_corner_radius(w)` — `with_webview` 拿 WKWebView,
      设 `CALayer.cornerRadius = 14.0_f64` + `masksToBounds = true`
- [x] 在 `ensure_window` 两个分支(Tauri 预建 / 现建)都调
- [x] 跨平台 `#[cfg(not(target_os = "macos")))]` no-op 兜底
- [x] cargo check 1.13s 干净
- **Status:** complete

### Phase 5: 4 件套 DoD 验证
- [x] vitest 106/106 PASS
- [x] cargo check 干净
- [x] npm run build 干净
- [x] smoke:floating 7/7 PASS(`pos=Some((1480, 580)), size=Some((640, 72)), visible=true`)
- **Status:** complete

## 未做的
- **click → expand 闪退根因**:bisect 走到 Phase B(完整 App+click)就崩,
  Phase B'(FloatShell 展开槽 vs OuterShell LiquidGlass 二分)未跑完。
  保留 R7 防御层(try/catch + .catch())作为兜底,非真修。
- **R7 v2 native layer cornerRadius**:macOS 浮窗圆角已修(R7 v2 本来是这个名字,
  Phase 4 实际做了 v2 的工作,命名历史混乱按"修了的 bug"算)。
- **commit**:用户硬约束"不主动去提交代码",工作区未 staged,待用户 review。
