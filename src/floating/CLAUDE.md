# src/floating/CLAUDE.md

This file is for the floating window only. Loaded when files in `src/floating/**` are read.

## Window role

- **floating** (`label: floating`, `floating.html` → `src/floating/main.tsx` → `src/floating/App.tsx`)
- 折叠态 320×36,展开态 360×280(最大 480×460)
- 设计语言:Liquid Glass;macOS 走 NSVisualEffectView set_as_panel,其他平台靠 transparent + alwaysOnTop + Web Liquid Glass
- 与主窗是两份独立 React 入口,由 `vite.config.ts` 的 `rollupOptions.input` 打包

## Window 尺寸三源(关键不变量)

V1.5+ 浮窗高度上限写死在三处,改一处必须改另外两处:
- `src-tauri/src/commands/floating_cmd.rs` 的 `MIN_H/MAX_H/EXPAND_W` 常量
- `tauri.conf.json` 的 `min/maxInnerSize`
- `src/floating/App.tsx` 顶部的 `MIN_H/MAX_H/EXPAND_W` 常量

宽度由 expanded 切换 useEffect 显式 setSize(FOLD_W 或 EXPAND_W),高度由 MutationObserver + rAF + scrollHeight 测内容后调 `floatingSetHeight` 自适应。手动 resize 已删除。

## 浮窗交互主路径

```
用户按 Cmd/Ctrl+Shift+Space
  → global-shortcut plugin 触发
  → commands::floating_cmd::floating_toggle
  → get_webview_window("floating").show() / .hide()

用户在浮窗右键
  → api.showFloatingContextMenu()
  → commands::floating_cmd::show_floating_context_menu
  → tray::menu::build_main_menu
  → window.on_menu_event(...)
  → tray::menu::handle_action
```

V1.4 spec §5.1 / §5.2 落地:浮窗右键、主窗右键、未来托盘图标三处复用同一 `handle_action` 分发。

## 折叠 ↔ 展开状态机

- 200ms hover-out 延迟折叠(防误触)
- MutationObserver + rAF + scrollHeight 内容自适应(取代 ResizeObserver——后者依赖 root box size 但根容器无显式 width 约束时不撑开,observer 永不触发;openless LessComputerPanel 同款范式)
- 长按拖拽封装在 `useDragLongPress` hook(`src/floating/hooks/`)
- V1.5+ DEBUG=true / patchWinForDebug mock 已删除(`dlog` 保留为 no-op stub)
