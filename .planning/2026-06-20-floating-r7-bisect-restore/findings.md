# Findings · 浮窗 R7 + bisect + macOS 圆角

## 1. R7 防御层 — Tauri 2 IPC runtime 注入时序问题

### 现象
浮窗在 Vite dev 模式下,React `useEffect` 挂时 `getCurrentWindow()` / `events.onFocusChanged()`
同步抛错或返 rejected Promise,React 默认错误处理 unmount 整个 App = 浮窗"闪退"。
生产 build 走 `tauri://` URL 不触发(runtime 必然就绪)。

### 根因
- `window.__TAURI_INTERNALS__.invoke` / `.transformCallback` 在 Vite dev + jsdom 环境下不可用
- 同步 throw → React unmount
- rejected Promise 未挂 `.catch()` → unhandled rejection → React unmount

### 防御(双层)
**Defense 1** — `useWindowPosition.ts`:
```ts
let win: ReturnType<typeof getCurrentWindow> | null = null
try {
  win = getCurrentWindow()
} catch { return }                      // 同步 throw
if (!win || typeof win.setPosition !== 'function' || typeof win.onMoved !== 'function') {
  return                                  // 缺方法
}
```

**Defense 2** — `useActiveTask.ts`:
```ts
const unlisten = events.onFocusChanged(() => refresh()).catch(() => null)
// ↑ 初始 rejected Promise 不挂 catch = unhandled rejection
return () => {
  unlisten.then((u) => { if (typeof u === 'function') u() }).catch(() => {})
}
```

### 测试覆盖
- `useWindowPosition.test.ts` R7 describe:3 个 case(抛错 / 返 undefined / 缺方法)
- `useActiveTask.test.ts` R7 describe:4 个 case(正常 / api 抛 / events rejected / 全不可用)
- 全 7 个 case 都用 `vi.hoisted(() => vi.fn())` 模式 + 独立 `beforeEach` 清理 mock

### 局限
- **不是根因解**。闪退用户报告"Defense 1+2 后仍闪退" → 真崩溃源不在 IPC 防御
  能 cover 的范围。bisect 继续。

## 2. macOS WKWebView 圆角不完整

### 现象
Web CSS `.floating-root { border-radius: 14px }` 只 round web 内容,NSWindow 本身四角直角
→ 浮窗"圆角不完整",内容被 round 但 webview 物理边界是方的。

### 根因
- CSS `border-radius` 不能 round native NSWindow
- macOS 上 NSPanel / NSWindow 的圆角必须用 `NSView.layer.cornerRadius` + `masksToBounds`
  (CALayer 私有 API)

### 修法 — `src-tauri/src/floating/mod.rs::apply_macos_corner_radius`
```rust
#[cfg(target_os = "macos")]
fn apply_macos_corner_radius(w: &tauri::WebviewWindow) {
    let _ = w.with_webview(|webview| {
        use objc2::msg_send;
        use objc2::runtime::AnyObject;
        let wk = webview.inner() as *mut AnyObject;
        unsafe {
            let layer: *mut AnyObject = msg_send![&*wk, layer];
            let _: () = msg_send![&*layer, setCornerRadius: 14.0_f64];
            let _: () = msg_send![&*layer, setMasksToBounds: true];
        }
    });
}
```

### 关键点
- 值 14 跟 `src/floating/styles/floating.css` 同步
- CGFloat 在 64-bit macOS = f64
- BOOL 用 `true`(objc2 自动 encode)
- `objc2` 是 tauri 2 的 transitive dep,版本 0.6.4 匹配
- 加为直接 dep 让代码能 import
- `#[cfg(not(target_os = "macos")))]` no-op 兜底,Windows/Linux 不变

### 参考
- `docs/competitors/taskisland/source/Sources/TaskIsland/IslandPanelController.swift`:
  - `layer.cornerRadius = radius`
  - `layer.isOpaque = false`
  - `animateHostingCornerRadius(to: cornerRadius(for: contentSize))`

## 3. Click → expand 闪退 — 未定位

### 已确认
- Phase A(最小折叠态,无 click):smoke 7/7 + 用户视觉 OK
- Phase B(完整 App+click):用户 click 闪退

### 假设未验证
- **怀疑 A**:`OuterShell isExpanded=true` → 切到 `<LiquidGlass>` 路径
  - Phase B' 设计就是隔离这个(OuterShell 硬编码 false,FloatShell 仍跟 state)
  - 未跑用户视觉测试
- **怀疑 B**:`FloatShell` 展开槽 grid-template-rows 1fr 动画
- **怀疑 C**:`useEffect` 触发 `win.setSize(new LogicalSize(360, 280))` IPC
  - 这个是 async + `.catch()`,本身不抛
- **怀疑 D**:`GlassSurface variant` 切换(L1 → L3)触发重新 cva 类合并
  - 纯 CSS,不太可能

### 修法(未做)
- 加 ErrorBoundary 包 `<App>`,捕 JS 错 + log
- macOS 物理 log:`~/Library/Logs/mindtap/*.log` + `lldb` attach webview 进程
- 区分 JS 错 vs webview native crash:如果 ErrorBoundary 抓到 → JS 错;
  抓不到 + webview 进程死了 → native 错
- 进一步 bisect 走完 Phase B' → Phase D' (OuterShell 跟 state)→ Phase E (GlassSurface)→ ...

## 4. bisect 工作流学到的

### "按阶段降级"在 webview 项目里的特殊点
- vitest/jsdom 绕开 Tauri runtime,**vitest 数字不够证据** — 必须真 webview 跑
- smoke 7 层能验 webview 启动 + 浮窗可见,但**验不了 click 行为**
- 真测试:用户手动 `npm run tauri dev` + click

### 备份策略
- bisect 阶段开 backup 文件 `App.full.tsx`,完成时删
- 回滚靠 git(用户硬约束"不主动 commit",所以 backup 文件是唯一快速回滚)

### 防御层 vs 根因解
- 防御层(try/catch / .catch())是安全网,**永远不能替代根因调查**
- 真崩溃时,防御层顶多阻止 unmount,但 bug 仍在 — 用户报"还是闪退"是预期

## 5. 跨上下文复检 — 文件归位

| 类型 | 去处 |
|---|---|
| React 防御代码 | `src/floating/hooks/useWindowPosition.ts` / `useActiveTask.ts` |
| Rust 圆角修复 | `src-tauri/src/floating/mod.rs::apply_macos_corner_radius` |
| 防御测试 | `src/floating/hooks/useWindowPosition.test.ts` / `useActiveTask.test.ts` |
| Cargo dep | `src-tauri/Cargo.toml` `[target.'cfg(target_os = "macos")'.dependencies]` |
| Session 记录 | `.planning/2026-06-20-floating-r7-bisect-restore/` |

## 6. 给下次 debug 这个崩溃的人

1. **先跑** `npm run tauri dev`,确认能复现 click 闪退
2. **加 ErrorBoundary** 包 `<App>` 捕 JS 错
3. **看 mindtap.log**(R4 `floating webview state` 行附近) + `~/Library/Logs/mindtap/*.log`
4. **如果 ErrorBoundary 抓到** → JS 错,看 stack trace 定位
5. **如果 ErrorBoundary 抓不到 + webview 死了** → native 错,`lldb` attach
6. **继续 bisect**:Phase B' = FloatShell 展开槽,OuterShell 固定 false
7. **不要重复**:不要 git checkout 一个个试回退,直接 in-place 编辑 App.tsx,
   backup 写成 `App.full.tsx`
