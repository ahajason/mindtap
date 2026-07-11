# V0.2.1 9.9 SwitchDropdown overlay — 3-variant prototype

> 状态: throwaway · 用于 9.9 grill · 选完后此目录移到 `prototype/.archive/`

## 文件

- `index.html` — 3 variant 并排 live mockup（A 不折叠 / B 替换 InputBar / C popover 浮层）
- `previews/full.png` — 1320×920 整图截图

## 3 个 variant 描述

### A · 垂直堆叠（不折叠 InputBar）
- 浮窗 360×280 内: 顶部状态条 32px + SwitchDropdown section (关闭 38px / 打开 5 列表项约 200px) + InputBar 36px
- **关闭态**: 32 + 38 + 36 = 106px, 富余 → 浮窗不变
- **打开态**: 32 + 200 + 36 = 268px → 列表内部滚动 (overflow-y)
- 输入始终可用, 直接看 280px
- 缺点: 5 列表项全开后 InputBar 会贴底, 视觉紧张

### B · 替换（SwitchDropdown 打开时 InputBar 隐藏）
- 浮窗 360×280
- 关闭态: 顶部状态 + SwitchDropdown trigger 36px + InputBar 36px = 104px
- 打开态: 顶部状态 + SwitchDropdown list 5 项 200px (InputBar **隐藏**)
- 切换时 InputBar fade-out 200ms, 列表 fade-in
- 优点: 列表项完整无滚动, 280px 富余
- 缺点: 选了之后想再编辑 task_title, 必须先关闭 SwitchDropdown

### C · 浮层 popover
- 浮窗 360×280
- InputBar + "开始" 始终在底部 (固定)
- "或选择已有任务" 触发按钮在中部 (折叠态)
- SwitchDropdown 列表 = popover, 绝对定位浮在 trigger 上方, **覆盖 InputBar 上沿**
- 优点: InputBar 始终可见可输入
- 缺点: popover 重叠 InputBar 上沿, 视觉层叠复杂

## 9.6 + 9.7 默认值

- 9.6 = C (引导新建气泡:"👋 还没有历史任务, 先新建一个试试?")
- 9.7 = A (不引入 pending 态, V0.2.0 3 态锁定)

## 选完后

- 把选中 variant 的 CSS 用 `Edit` 工具写到 V0.2.1 实施的 `<SwitchDropdownSection>` 组件里
- 此 prototype/ 目录 commit 后推到 origin (临时存档, 选完后移 `prototype/.archive/`)
