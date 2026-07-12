# fix(floating): 黑边仍有 — V0.2.6 fix (border:0) 没拦干净回归

> 创建: 2026-07-13

## Why

V0.2.6 commit 48f4dbd 报过"1px 黑边" P0, 用 `.floating-root { border: 0 }` + `.glass-l1/l2/l3 { border: 0 }` 修。App.test.tsx 还有 5 处 border:0 断言。但用户 D:\ 端实测发现黑边**仍在** —— CSS border:0 测试拦不住 outline / box-shadow inset / WebView2 system window chrome。算 P1 已知问题回归必修。

详细 root cause 假设 + 歧义澄清 + 排查命令: `docs/reports/2026-07-13-v0.2.7-l3-findings.md` §二 C (5 假设 + 4 歧义点)

## What

修 floating.css / StatusDot.css / tauri.conf.json: 排查 box-shadow inset 模拟边框, tauri.conf.json 主窗 decorations:true 是否生效, backdrop-filter blur 边缘亚像素渲染, 或 .floating-root 没显式 background-color 让 WebView2 transparent 浮窗填 #000。最终行为: 浮窗 4 边无可见黑边框 (玻璃边缘和窗口外背景平滑过渡)。

## Done when

- [ ] DevTools (D:\ 端 F12) 选中 .floating-root + .glass-l1/l2/l3, computed `border / outline / box-shadow` 都无可见描边
- [ ] 截图浮窗 4 角像素 RGB 检查, 边缘非黑色 (RGB 各通道 > 30)
- [ ] tauri.conf.json 主窗 `decorations: false` 验过; 或浮窗段确实独立无 OS chrome
- [ ] App.test.tsx 加 vitest 测试: floating.css 不含任何 `border: 1px` / `outline: ` / `box-shadow: inset` 字样 (CSS 字符串扫描)
- [ ] L1 vitest 全套 PASS
- [ ] L3 D:\ 用户实测: 单屏 + 4K 缩放 + 副屏 3 环境下浮窗都无黑边
- [ ] 沉淀: task.md 跟业务代码同 commit