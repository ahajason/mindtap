# 浮窗样式反复修复根因与最佳实践报告

> **类型**：L5 Retrospective（证据文档，非需求真值）
> **日期**：2026-07-28
> **范围**：V0.2.0.3 ~ V0.2.0.16 浮窗 PATCH 链

---

## 摘要

V0.2.0 浮窗经历了十几轮"单测通过、Windows WebView2 仍复现"的 PATCH。根因不是一个孤立的 CSS 值，而是 **需求真值、原生窗口、React 布局、玻璃材质、测试证据、历史文档、工作方式** 七层同时漂移。每次修复只触及症状层，下一轮又从旧文档或旧基线回流错误结论，导致同一系列问题反复出现。

本报告记录 9 类根因、对应证据和可执行的防复发 gate。

---

## 根因一：需求真值漂移

**触发条件**：PRD、spec、release notes、旧 design doc 各自定义一套尺寸、状态数、展开方向、active 行为，互相冲突。

**错误结果**：
- 尺寸：`320×36`（V0.2.0 PRD §3.1）vs `360×36`（后续 PATCH 实际值）
- 展开方向："向上展开"（PRD §3.2）vs 位置不变、窗口向下扩展（实际实现）
- 状态数：三态（active/done/empty）vs 四 UI 状态（空闲/活动 × 折叠/展开）
- 空状态交互："显示新建按钮"（PRD §3.8）vs 点击折叠栏直接展开（实际实现）
- active controls 可见性：曾假设活动折叠态也显示控制按钮

每次新 session 读不同入口，得到不同需求真值，修复方向自然不同。

**证据**：
- `docs/prd/v0.2.0-floating-window-prd.md` v1.0 §3.1 写 `320×36`
- `docs/prd/v0.2.3-floating-window-native-menu-prd.md` 独立定义一套业务规则
- `docs/specs/2026-07-11-v0.2.0-floating-window-design.md` 又有自己的状态描述
- `src-tauri/tauri.conf.json` 曾为 `320×36`，后在 PATCH 中改为 `360×36`

**防复发 gate**：
- 浮窗只有一个 L0 PRD：`docs/prd/v0.2.0-floating-window-prd.md`
- 任何需求变更只改这一个文件
- 被完整吸收且会误导的旧入口直接删除；仍有证据价值的旧 PRD/Tech 明确标记 `SUPERSEDED`

---

## 根因二：平台边界误判

**触发条件**：把 Windows DWM / WebView2 合成层的问题，当成 CSS 或 React 问题来修。

**错误结果**：
- 黑边 / 灰边问题：反复调 `box-shadow`、`border-radius`、`outline`，实际是 WebView2 透明窗口边缘合成问题
- 右键菜单被折叠态根 div 抢占：用 CSS `pointer-events` 绕，实际应该走 Rust 原生菜单
- 物理 resize：用 React state + CSS transition 模拟，实际窗口尺寸没变，任务栏避让、DWM 阴影都是错的
- 焦点问题：在 React 层用 `blur()` 处理，实际是 Tauri `focus: false` 和 `setFocusable` 的边界

**证据**：
- V0.2.0.6 PATCH Issue A：右键不被折叠态根 div 抢占，根因是 HTML 菜单 vs 原生菜单的边界错误
- V0.2.0.10 PATCH：黑边真根因是 FoldedBar inline `box-shadow` 覆盖 root 样式，而不是 root 的 border
- V0.2.0.4 retro 记录的 33 个 commit 中，大量是在 CSS 层调边框/阴影，实际根因在更底层

**防复发 gate**：
- 涉及透明合成、原生菜单、物理尺寸、焦点、拖动的问题，先判定归属层
- Windows-only 视觉问题，先开 Windows 实机，不在 WSL 里猜
- 修前问：这是 compositor 的问题、Rust 的问题、还是 CSS 的问题？

---

## 根因三：生产实现多 owner

**触发条件**：同一个事实（窗口尺寸 / 玻璃材质 / 可见性）同时由多个地方控制。

**错误结果**：
- 窗口尺寸同时由：`tauri.conf.json` 启动配置、`setSize` JS API、Rust `set_floating_size` command、React `useEffect`、CSS width/height 五处管理
- 玻璃材质同时由：React inline `PANEL_STYLE`、`.floating-root` CSS、`.glass-l1/l2/l3` utility、Tailwind class 四处管理
- 可见性同时由：CSS `display`、`opacity`、`visibility`、Tauri `show/hide` 控制
- 改 A 处被 B 处覆盖，下一轮又改 B 处被 C 处覆盖

**证据**：
- V0.2.0.14 PATCH 之前，`App.tsx` 有 `PANEL_STYLE` inline style 管背景和模糊
- `floating.css` 的 `.glass-l1/l2/l3` 又有 hard-coded 的 `0.35/0.42/0.50` fill 值
- `src/index.css` 也定义了一套 `.glass-l1/l2/l3`
- `tauri.conf.json` 启动尺寸和运行时 `setSize` 曾经不一致（`320×36` vs `360×36`）

**防复发 gate**：
- 每个事实只有一个 owner：
  - 物理窗口尺寸 → Rust/Tauri 配置和 command
  - React UI 状态 → `App.tsx` 的 state 和 class
  - V0.2.0 CSS 保底表面 → `.floating-root::before` CSS pseudo-element
  - 设计 token → `src/styles/theme.css` + `docs/design/glassic-ui-spec.md`
- 新增任何控制同一事实的代码，必须先删旧的

---

## 根因四：不可满足的折叠几何

**触发条件**：36px 折叠态窗口，叠加了内部 padding、多行内容，数学上装不下。

**错误结果**：
- 旧实现：`p-3`（垂直 24px padding）+ 36px 行高 + active 控制第二行 = 至少 60px+
- 窗口物理高度是 36px，内容必然被裁剪
- 症状表现为"折叠态内容显示不全"、"active 时按钮看不到"
- 修复方向错误：调 font-size、调 padding、调 line-height，试图在 36px 里塞进更多东西

**证据**：
- `App.tsx` 旧版 root class 含 `p-3`
- active folded 状态下曾渲染控制按钮行
- 数学验算：36px - 12px 上 padding - 12px 下 padding = 12px 内容高度，连一行文字都放不下

**防复发 gate**：
- 折叠态（36px）只允许一行内容：状态点 + 任务名 + 计时
- 活动折叠态不渲染控制按钮
- folded 状态不加垂直 padding（由展开态才加）
- 写样式前先算：内容高度 + padding ≤ 物理窗口高度

---

## 根因五：测试假绿

**触发条件**：用 `css: false` 的 jsdom/happy-dom 测试和手写 CSS 字符串断言，宣称"视觉修复已验证"。

**错误结果**：
- 测试通过了，但生产 CSS 根本没加载到测试环境里
- 测试复制 CSS 片段、源码公式或宽泛字面模式，只证明测试构造与源码形状匹配，不能证明公共行为或像素结果
- mock 可以验证发送给平台层的命令和参数，但不能验证 WebView2、DWM 或原生菜单的真实表现
- 结论："测试全绿 → 视觉已修"，实际上 Windows WebView2 里照样坏

**证据**：
- Vitest 配置禁用 CSS 加载（`css: false` 或等效配置）
- 旧测试曾在测试内重写 CSS、断言源码实现公式或依赖宽泛字面模式；这些断言不经过生产视觉行为
- 反模式 16：字面量断言（用测试构造或实现细节代替公共行为）

**防复发 gate**：
- 配置、尺寸、CSS ownership 等结构不变量直接读取生产 artifact
- 行为测试走公共 DOM 接口（render + fireEvent + 断言可见元素）
- mock 只证明平台调用边界，不证明目标平台实际效果
- `css: false` 的测试不得作为像素级视觉证据
- 生产契约测试存在：`src/floating/App.window-contract.test.tsx`

---

## 根因六：测试假红

**触发条件**：测试基础设施（fixture、mock）有缺陷，产生的错误行为被归因于生产代码。

**错误结果**：
- `TimerSession` fixture 只返回 `{ id, task_title, status }`，缺 `focus_ms` 等字段
- `useFocusTicker` 读到 `undefined`，显示 `NaN:NaN:NaN`
- 被当成"计时逻辑 bug"去修组件，实际是测试数据不完整
- `availableMonitors` 未在全局 mock 中 export，stderr 噪音干扰真实失败判断

**证据**：
- 旧 e2e 测试 fixture 创建 session 时只补了 3 个字段
- `TimerSession` 类型定义有 10+ 字段，fixture 不满足类型契约
- `src/test/setup.ts` 曾缺 `availableMonitors` export
- `invoke` mock 使用 `mockReset()` 后未恢复默认 implementation，造成跨测试污染
- 轮询 callback 曾只返回 boolean 而不执行 assertion，条件为假时也可能结束等待

**防复发 gate**：
- 测试 fixture 必须满足生产类型契约（用 `TimerSession` 类型约束 fixture）
- 全局 mock 缺失 export 先补 mock，再归因生产代码
- `mockReset()` 后显式恢复跨测试需要的默认 implementation
- 轮询 callback 必须包含 assertion，不返回 boolean 代替断言
- 测试输出不得出现 `NaN`、缺 export 警告、未处理异常

---

## 根因七：验证层错配

**触发条件**：把 Vitest / cargo check / tsc 通过，当作"Windows 视觉已验证"。

**错误结果**：
- 每轮 PATCH 都宣称"测试通过"，但 Windows 实机上样式仍然错乱
- 完成 gate 设成了 L1/L2 工程回归，而不是 L3 Windows WebView2 实机
- 透明度、圆角边缘、DWM 合成、拖动手感这些 WebView2 特有的问题，WSL 环境根本复现不了

**证据**：
- V0.2.0.3 ~ V0.2.0.14 每轮 release notes 都写"测试通过"，但下一轮又发现新的视觉问题
- Windows QA 报告（`docs/reports/2026-07-11-v0.2.0-windows-qa*.md`）发现的问题，在 WSL 单测里全部通过

**防复发 gate**：
- L1 生产契约 + L2 工程回归通过 → 只能标记"代码完成"
- 视觉修复必须有 L3 Windows WebView2 实机证据才能宣称完成
- L3 验收清单：四状态截图 + 三档 DPI + 拖动 + 右键菜单 + 不抢焦 + 重启恢复

---

## 根因八：历史文档回流

**触发条件**：旧 spec、plan、QA、release notes 没有明确降级，后续 session 搜索时找到它们，把旧结论当当前真值。

**错误结果**：
- 读到 `docs/specs/2026-07-11-v0.2.0-floating-window-design.md` 里的 `320×36`，又把尺寸改回去
- 读到 V0.2.3 PRD 里的独立需求，开始实现新分支，跟当前 V0.2.0.x PATCH 链脱节
- 读到旧 release notes 里的"已修复"结论，以为某个问题已经修好了
- 每次都在"发现旧值 → 修复 → 下次又从旧文档读回旧值"的循环里

**证据**：
- `docs/specs/`、`docs/architecture/`、`docs/plans/` 下有多份浮窗相关文档，各自维护一套真值
- `docs/reports/` 下十几个 release notes / QA / retro，内容互相重叠
- 没有统一的"当前真值入口"清单

**防复发 gate**：
- 浮窗功能真值只由 L0 PRD、L2 Tech、L3 Design 三份活文档维护
- 已被完整吸收且会误导的旧 spec、architecture checklist 和 plan 直接删除
- 仍有证据价值的 V0.2.3 PRD/Tech 明确标记 `SUPERSEDED`
- 历史报告保持原貌，不回写、不修改，只从根因报告引用
- 新 session 读浮窗需求，只从 L0 PRD 开始

---

## 根因九：工作树基线错误

**触发条件**：新 worktree 默认从 `origin/main` 或旧 commit 创建，不含当前 `develop` 的最新改动，调查基于旧快照。

**错误结果**：
- 读到的代码是旧版本（还带 `PANEL_STYLE`、`320×36` 等）
- 测试数量不对（少了后面 PATCH 新增的测试）
- 文档结论过时
- 基于错误基线做的根因分析和修复方案都是错的

**证据**：
- 某次 worktree 基于 `origin/main` 创建，而当前开发在 `develop` 上领先几十个 commit
- 调查结论声称"当前仍有 PANEL_STYLE"，实际 `develop` 上已经删了

**防复发 gate**：
- 调查前先校验基线：`git merge-base --is-ancestor develop HEAD`
- 不满足先对齐，禁止基于旧快照下结论
- 后续不再使用 worktree，统一在 `develop` 上工作

---

## 最佳实践与长期流程

以下 7 条是本轮提炼出的 gate；后续跨功能执行步骤以 `docs/governance/ui-native-window-regression.md` 为唯一流程入口，本报告不复制维护完整步骤。

### 1. 先校验基线

开始任何浮窗相关工作前：
```bash
git log -1 --oneline
git merge-base --is-ancestor develop HEAD
```
不满足 → 先对齐，再动手。

### 2. 先建立生产契约测试

修任何视觉/样式问题前，先写一个能在旧实现上判红的测试，直接读取生产文件（`tauri.conf.json`、`floating.css`、`theme.css`、`App.tsx`）。测试红了再改代码。

### 3. 先按层归属 bug

改代码前先判定：这是哪一层的问题？
- 窗口尺寸、透明度、阴影 → Rust/Tauri 配置层
- 状态切换、可见性 → React 层
- 颜色、模糊、圆角 → CSS 层
- 合成、DWM、DPI → Windows compositor 层

归属哪层改哪层，不跨层绕。

### 4. 每个事实只有一个 owner

同一事实（尺寸、材质、可见性）只能有一个地方控制。新增控制前先删旧的。

### 5. 历史证据不改写

旧 release notes、QA、retro 保持原貌。新结论写在新的报告里，通过引用关系建立关联，不回写旧文档。

### 6. Windows-only 结论必须实机

涉及透明合成、圆角边缘、拖动手感、焦点行为、DPI 缩放的结论，必须在 Windows 11 WebView2 实机上验证。WSL/jsdom/happy-dom 的结果不能替代。

### 7. 只有证据失败才改产品代码

先有测试失败的证据，再有代码修改。测试基础设施（fixture、mock）缺陷先修测试，再复验。复验通过了，就不要改生产代码。

---

## 测试收口结果

本轮先按故障模式审查测试价值，再删除或合并重复入口：

- 浮窗专项从 **11 个测试文件 / 73 项测试** 收敛为 **6 个测试文件 / 20 项测试**；
- 保留生产 artifact 契约、鼠标与原生菜单边界、任务关键路径、状态分支、键盘操作、可访问语义和错误降级；
- 删除按 PATCH 编号命名的叙事测试、精确 class/DOM child 顺序、依赖存在性、源码公式、重复配置字段和被父级关键路径覆盖的薄组件测试；
- `App.fix.test.tsx` 与 `App.v0.2.0.16.test.tsx` 中仍有效的行为合并到稳定职责入口 `App.behavior.test.tsx`；
- 生产配置与 CSS ownership 统一由 `App.window-contract.test.tsx` 验证。

测试减少约 73%，但保留的每项测试都对应一个独立故障模式；删除数量不作为质量目标，稳定 seam 和旧实现可判红才是保留依据。Windows 首轮 L3 发现状态条几何切换问题后，新增 1 项生产契约，因此当前专项总数为 20 项。

---

## 症状补丁 vs 根因修复对照表

| 历史 PATCH | 修复的症状 | 真正根因 | 根因修复版本 |
|---|---|---|---|
| V0.2.0.3 ~ V0.2.0.5 | 黑边 / 展开闪退 | `setFocusable(true)` panic + 平台边界误判 | V0.2.0.5 |
| V0.2.0.6 | 右键被抢占 | HTML 菜单 vs 原生菜单边界 | V0.2.0.6 + V0.2.0.12（Rust 原生菜单） |
| V0.2.0.7 | StatusDot 错位 | 多 owner 叠加 + inline style 优先级 | V0.2.0.12（恢复 V1.0 inline） |
| V0.2.0.8 ~ V0.2.0.10 | 黑边反复 | FoldedBar inline shadow 覆盖 root 样式 | V0.2.0.10（移到 CSS class） |
| V0.2.0.11 | 4 个 issue 同时修 | 需求漂移 + 多 owner | V0.2.0.11（部分） |
| V0.2.0.12 | StatusDot + ContextMenu | 对象 A/B 独立修复 | V0.2.0.12 |
| V0.2.0.13 ~ V0.2.0.14 | 多 root + active 折叠 | 不可满足的折叠几何 + 多 root | V0.2.0.14（单 root） |
| V0.2.0.15 | 位置 + 拖动 + resize | 平台边界 + 物理 resize 缺失 | V0.2.0.15 ~ V0.2.0.16 |
| V0.2.0.16 | 展开态拖动 + Rust resize | 拖动阈值 + 物理 resize 命令 | V0.2.0.16 |
| 本次收口 | 文档 + 测试 + 需求漂移 | 六层同时漂移 | 本次（文档整合 + 契约测试 + 最佳实践） |

---

## 验证结果索引

> 本节在 L1/L2/L3 验证完成后填充。

### L1：生产契约与公共行为

- [x] 生产配置：启动 `360×36`，透明/阴影/焦点字段一致
- [x] React：四状态可见内容、活动折叠单行、点击展开、完成后折叠
- [x] CSS：单一保底表面 owner、共享 G3 token、折叠态无不可满足 padding
- [x] IPC：expanded/folded 分别发出 `360×280` / `360×36` resize
- [x] 测试输出无 `NaN`、无缺 export 警告、无未处理异常
- [x] 浮窗专项：6 个测试文件、20 项测试全部通过

### L2：工程回归

- [x] `npm test -- --run`：20 个测试文件、62 项测试全部通过
- [x] `npx tsc --noEmit`：通过，无输出
- [x] `npm run build`：构建通过；保留既有 Tailwind 生成 CSS 的 `invalid-calc` minify warning，不阻断产物
- [x] `cargo check --manifest-path src-tauri/Cargo.toml`：通过；本机 `PATH` 中 `/home/jason/.local/bin/cc` 遮蔽系统编译器，复验时显式使用 `CC=/usr/bin/cc CXX=/usr/bin/c++ AR=/usr/bin/ar RUSTFLAGS='-C linker=/usr/bin/cc'`

Cargo 首轮失败属于本机工具链污染而非产品代码：错误的 `cc` 对链接调用返回成功但不生成目标文件，并进一步影响 `cc-rs` 编译 SQLite。显式固定系统工具后完整编译通过。本轮 Windows 复验反馈的未使用变量 warning 也已在错误日志中使用该变量后消除。

### L3：Windows WebView2 实机

> **当前状态**：第二轮 Windows 11 WebView2 实机验收已确认四状态、三档 DPI、窗口几何和完整交互链通过。顶部白边已完成局部根因修复，等待同一环境最终复验。本报告只宣称当前代码与静态回归收口；顶部边缘在 L3 复验通过前仍未完成视觉验收。

**首轮实机偏差与归因**：

- Rust 启动输出存在未使用变量 warning：错误变量未写入日志，已在 Rust owner 处补充错误详情；
- 折叠态左右留白失衡：状态条无水平 padding，标题还受 220px 上限约束，导致状态点贴左而计时整体偏左；
- 浮窗材质过透：浮窗实例使用 L1 token，已依据实机证据提升为 L2，未修改共享 token；
- 折叠/展开状态条观感不一致：展开 class 先给整个内容层增加 12px padding，原生 resize 后完成，切换瞬间状态条发生位移和挤压。已改为固定 36px 的共享状态条，展开间距只由其下方 body 管理；
- 展开控件间距偏离规范：输入框、历史任务入口与操作按钮统一到 32/36px 控件高度、10–12px 圆角和 13–14px 字号。

**第二轮实机偏差与归因**：

- 顶部可见白边不是窗口高度误差：`floating.html` 的不透明 `bg-neutral-50` 页面背景可能从透明圆角边缘漏出，同时根表面用 `inset 0 1px 0` 将预期的完整内高光描边错误实现为顶部水平白线；
- 已删除浮窗入口的不透明页面背景，并将根表面高光改为继承圆角的闭合 `inset 0 0 0 1px` 轮廓；生产契约分别在两个旧实现上判红后转绿。

- [x] 修复后四状态基准截图
- [x] 100% / 125% / 150% DPI
- [x] 折叠/展开物理尺寸、位置不跳、圆角无黑边/灰边、内容不裁剪
- [x] 折叠与展开拖动、点击展开、开始/暂停/恢复/完成
- [x] panel 外折叠、Esc/取消语义、右键原生菜单、不抢焦
- [x] 重启后 active session 与计时恢复
- [ ] 折叠与展开顶部无可见白边，聚焦/未聚焦及 100% / 125% / 150% DPI 表现一致

---

## 参考

- 当前 PRD：`docs/prd/v0.2.0-floating-window-prd.md`
- 当前 Tech：`docs/tech/v0.2.0-floating-window-tech.md`
- 当前 Design：`docs/design/v0.2.0-floating-window-design.md`
- 玻璃规范：`docs/design/glassic-ui-spec.md`
- 历史报告：`docs/reports/v0.2.0.*.md`（保留原貌，不回写）
