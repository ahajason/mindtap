# fix(drag): drag region 缩到专用 handle,子元素 button 阻断 bug 收口

<!-- scope 取业务名, 不是版本号 -->

> 创建: 2026-06-22
> Plan: docs/plans/2026-06-22-v0.1.6-drag-handle-fix.md
> 根因 commit: `20e9ac9`(V0.1.4)

## Why

V0.1.4 commit `20e9ac9` 把窗口拖动从 NSWindow 切到 web 侧 `data-tauri-drag-region`,目的是修 V0.1.1 retro 暴露的 3 症状(文字选不中 / resize 失效 / cursor 不变)。

**切方案时漏了 Layer 3 反向副作用枚举**:`data-tauri-drag-region` 底层是 webkit CSS `-webkit-app-region: drag`,会被 button / input / a 自动 reset 成 no-drag。当前 `<div data-tauri-drag-region>` 包住整个窗口,主内容里全是 button / nav → 用户视觉上的"空白处"实际命中 button → drag 失效。

不修:整窗拖动不可用,违背 V0.1.4 retro 的根本目标(避免全局 drag 副作用)。

## What

拆整窗 drag region 到两个专用 drag handle:Sidebar header + Main 顶部固定条。其他区域不加 drag region,自然恢复交互。

## Attempt Log(失败也是数据,append-only)

### Attempt 1 — 2026-06-22(我接到"拖不动"反馈)
- **假设**: V0.1.4 commit 切方案时漏了 L3 反向副作用枚举(`data-tauri-drag-region` 被 button/input 自动 reset 成 no-drag)
- **依据**: commit diff 显示整窗加了 `data-tauri-drag-region`,主内容 button 多
- **改动**: 缩 drag region 到 Sidebar header + Main 顶部 36px handle
- **结果**: 用户实测失败(光标 grab 但不能拖)
- **推翻原因**: drag region 从未生效(V0.1.4 当时就缺 CSS + 缺权限)。"button 阻断"是基于"drag region 在工作"的假设,假设前提就错。
- **教训**: 反向症状消失 ≠ drag 在工作;不要基于 commit diff 推断 platform API 行为

### Attempt 2 — 2026-06-22(用户报"光标 grab 但不能拖")
- **假设**: macOS WKWebView 需要 `-webkit-app-region: drag` CSS
- **依据**: 之前 web search 看到的兼容性资料
- **改动**: 加 `-webkit-app-region: drag` + `app-region: drag` 到 index.css
- **结果**: 用户实测失败(grab 还在但不能拖)
- **推翻原因**: macOS WKWebView 不读 app-region CSS,Tauri 走 drag.js IPC。"grab 还在"只是 CSS 视觉生效,跟 IPC 是否通过 capability 无关
- **教训**: 不要混"CSS 视觉生效"和"IPC 通过 capability gate";同一表面症状可能是多个独立机制各自的局部表现

### Attempt 3 — 2026-06-22(用户报"main 顶部能拖,sidebar header 不能")
- **假设**: Sidebar header 需要 `data-tauri-drag-region="deep"`,因为 h1 子元素阻断
- **依据**: drag.js 源码 isDragRegion() 逻辑 — `attr === ''` 只认 `el === composedPath[0]`,header 含 h1 子元素点 h1 时不命中
- **改动**: aside header 加 `data-tauri-drag-region="deep"`
- **结果**: 用户实测部分成功(header 能拖,padding 仍不行)
- **真因**: 真因命中,但只解决 header 一处,aside margin/traffic light 让位区还在父 div
- **教训**: drag region 真因找到后,还要枚举所有 drag region 应当工作的区域(整窗 14 个 user-facing interaction)

### Attempt 4 — 2026-06-22(用户报"sidebar padding 不能拖")
- **假设**: aside 整体加 `deep` 即可
- **依据**: outer wrap 一层 deep 把整个 aside 包住
- **改动**: aside 整体 `data-tauri-drag-region="deep"` + nav `false`
- **结果**: 用户实测仍不行(让位区 mt-10 在父 div 内)
- **真因**: traffic light 让位区(0,0)~(252,40) = aside 的 mt-10 区,在父 div 内,不在 aside 内,deep 不到
- **教训**: 父 div 的 margin/padding 区不是 aside 的区域,drag region 父继承不到

### Attempt 5 — 2026-06-22(我意识到让位区归属)
- **假设**: 在 StyleGuideLayout 加独立 drag strip 覆盖 (0,0)~(252,40)
- **改动**: `<div data-tauri-drag-region="deep" className="absolute top-0 left-0 w-[252px] h-10" />` 覆盖 mt-10 让位区
- **结果**: 应能 work(等桌面 #15 实测)
- **真因**: drag region 在元素边界内,要让位区可拖必须有显式 drag handle 覆盖

### Attempt 6 — 2026-06-22(用户反馈"macOS drag 光标不该变")
- **假设**: 我加 `cursor: grab / grabbing` 是合理视觉反馈
- **依据**: web 习惯(可拖元素加 grab/grabbing)
- **改动**: 删 `cursor: grab/grabbing` CSS
- **真因**: macOS HIG 共识 — drag 时光标保持普通箭头,AppKit 系统 drag session 决定 cursor,wry 0 处 NSCursor 调用。我在 drag region 内加 cursor CSS 反 HIG
- **教训**: 任何 platform-specific 自加行为先查 HIG/官方规范,不要从 web 习惯套用

### Attempt 7 — 2026-06-22(用户反馈"复盘也没真正派 subagent 查 .archive/")
- **假设**: 沉淀几条 rule + retro 写完就够
- **依据**: V0.1.6 retro lesson 5 已列 6 项漏看的内部调研
- **真因**: 我自己写的 `first-step-research` 规则只列 `.archive/docs/` 6 路径,**完全没列 `.archive/src/`** — 规则漏写;且 retro 时没真正派 subagent 系统扫 `.archive/`,只口头说"应该查"
- **用户反馈原文**: ".archive/ 这个目录下的相关内容,你即使是在复盘的时候,也没有真正的去派子 agent 去查询、排查问题"
- **教训**: 规则漏写 + 规则没 self-apply 双重错误;下次沉淀必须先 verify 规则是否真的能触发我去查关键路径

## Done when

- [ ] Sidebar header 区域按下能拖窗口
- [ ] Main 顶部 drag handle 条按下能拖窗口
- [ ] Sidebar nav 链接可正常点击 / hover
- [ ] Main 内容里 button / link / input 可正常点击
- [ ] 文本可选中(双击 / 拖蓝)
- [ ] 窗口 resize handle 正常工作
- [ ] macOS 桌面实测拖窗口位置真的变(desktop 验证清单见 [[dev-verify-before-commit]])
- [ ] `.archive/src/floating/useDragLongPress.ts` 走对 IPC 的实现模式被 grep 引用 + spec 沉淀
- [ ] `npx tsc --noEmit` 通过
- [ ] `cd src-tauri && cargo check` 通过
- [ ] 提交 commit message 含 "**验证: ...**" 段(参考 V0.1.1 commit `8622a47` 格式)
