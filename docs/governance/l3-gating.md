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
# 1. 提交
cd /path/to/project
git commit -m "fix(floating): V0.2.0.6 右键被折叠态根 div 抢占"

# 2. 跑 dev（Windows 侧）
npm run tauri dev
# 或: npm run dev（仅前端）

# 3. 手工跑 7 层 checklist + PRD 用户场景
# 4. 在 docs/<需求>/tasks/<task>/evidence.md 写实测截图 + 步骤
```

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

## 七、视觉/原生窗口回归修复流程(2026-08-02 并入,原 ui-native-window-regression.md)

> UI 样式错乱、透明原生窗口、尺寸/焦点/拖动等跨平台边界问题,以及经历多轮症状修复仍重复出现的回归,按本节流程执行。

### 7.1 开始前:冻结基线与需求

- **基线 gate**:确认工作分支包含最新开发基线;记录工作树状态与最近提交,避免把旧快照当生产现状;并行分支先整合再分析。
- **需求 gate**:只写用户可观察事实(用户做什么 / 看到什么 / 哪些结果明确禁止 / 哪个真实平台负责最终验收)。尺寸/状态/交互冲突时先修正唯一 PRD,再改实现。

### 7.2 按层归因

| 事实或症状 | 默认 owner | 禁止的跨层绕法 |
|---|---|---|
| 原生窗口尺寸、透明、阴影、焦点 | 原生窗口配置与平台命令 | 用 CSS 尺寸/透明度/阴影模拟 |
| UI 状态和内容可见性 | 应用状态与公共组件行为 | 用 CSS 独立创造第五种状态 |
| 排版、颜色、模糊、圆角 | CSS 与共享 token | 组件内联样式建立第二材质 owner |
| 原生菜单、拖动、系统快捷键 | 平台 API | 页面元素模拟系统窗口能力 |
| DPI、合成黑边、聚焦边缘 | 目标平台 compositor | 用 DOM 测试宣称视觉已通过 |
| 测试缺字段/缺 export/泄漏 mock | 测试基础设施 | 修改生产逻辑迎合错误 fixture |

归因不明确时,先构造最小观测:生产配置、公共 DOM、平台调用参数、实机截图四者中,哪一层最先偏离契约就是首个修复点。

### 7.3 生产契约先判红

测试只建立在 4 类 seam:

1. **生产 artifact**:直接读真实配置、CSS、共享 token、平台命令注册;
2. **公共 UI 行为**:从用户动作观察可见内容与状态转换;
3. **平台调用边界**:断言发送给原生层的命令与参数;
4. **目标平台实机**:验证 compositor、DPI、焦点和拖动手感。

禁止:在测试里重写一份 CSS 再断言它 / 用源码公式代替公共行为 / 在不加载生产 CSS 的 DOM 环境宣称视觉正确 / 无 assertion 的轮询 callback / 用不完整 fixture 制造假红。若旧实现无法让新契约判红,说明 seam 或断言无效,不进入产品代码修改。

### 7.4 最小根因修复与测试收口

- 只修改失败证据指向的 owner;同一事实多 owner 时优先删除重复 owner,不加优先级覆盖。
- 修复后先重跑最窄测试,再跑功能专项;目标平台才可观察的事实,不在本地模拟环境猜测最终参数。
- 每个保留测试对应一个独立故障模式(锁定生产 artifact 不变量 / 覆盖用户关键路径 / 覆盖高风险分支或 a11y / 覆盖平台调用参数或降级)。
- 删除按 PATCH 编号堆积的叙事测试、依赖源码公式的实现耦合断言、已被关键路径覆盖的薄渲染测试、happy-dom 无法证明的像素断言。
- 测试文件按稳定职责命名(`*.window-contract.test.*` / `*.behavior.test.*`),不用历史修复编号。

### 7.5 完成判定

只有以下条件全部满足才能宣称回归已修复:当前需求无冲突 / 每个关键事实只有一个 owner / L1 与 L2 通过 / L3 目标平台证据通过 / 失效测试与误导入口已清理 / 根因报告记录实际结果与剩余限制。没有 L3 证据时,完成状态只能写「代码与静态验证完成,视觉待实机验收」。

## 关联

- [versioning-rule.md](./versioning-rule.md) — bug 归属 + PATCH 命名
- [doc-layers.md](./doc-layers.md) — 文档分层
- `.claude/rules/git-verify.mdc` — 本规则的 agent 强制入口（dev 实测 gate）
- V0.2.7 retro §3 反模式 14/15/16 触发本规则