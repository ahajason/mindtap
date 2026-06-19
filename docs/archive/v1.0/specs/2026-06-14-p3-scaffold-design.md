---
title: P3 项目脚手架 — Tauri 2 + React + 1 个 Surface demo
date: 2026-06-14
version: V1.0
status: pending-review
tags: [v1.0, scaffold, tauri, react, liquid-glass, wsl, windows]
parent: task_plan.md (Phase P3)
related: [prd-v1.2.md, agile-sprint-plan.md, ../../material/apple/liquid-glass/01-overview.md]
---

# P3 项目脚手架 — Tauri 2 + React + 1 个 Surface demo

> **定位**：V1.0 Phase P3 脚手架的设计 spec，定义"最小可跑通"目标。
> **状态**：⏳ pending user review
> **下一步**：spec 批准 → writing-plans 技能制定 17 步实施计划 → 实施

---

## 1. 背景（Why）

V1.0 上线倒计时 12 周（D25），但 `/home/jason/workspace/mindtap/` 当前仅有 `docs/` 和 `.claude/`，**没有可运行的项目骨架**。Phase P3（task_plan.md §"Phase P3: 项目脚手架"）明确交付物是"可运行的 Tauri 2.x 项目骨架 + `npm run tauri dev` 起 Mac 端 demo 窗口"。

但 D31 推翻了 V1.2 混合架构（SwiftUI 嵌入延后到 V1.4），所以 P3 实际范围比原描述更小：**纯 Web Tauri + React + 1 个 Surface demo**。本 spec 落地这一调整。

**为什么 WSL/Windows 双侧**：
- 项目文件在 WSL（Linux fs），开发体验更好
- V1.0 目标平台是 Mac + Windows（D21），需要产 Windows `.exe`
- WSL 2 默认是 NAT 网络，**Linux ELF 不能直接在 Windows 跑** — 必须 Windows 工具链 build

---

## 2. 目标 & Definition of Done

### 2.1 目标

在 Windows 11 机器上跑通一个**能看见苹果 Liquid Glass 玻璃感**的 Tauri 桌面窗口。

### 2.2 DoD（6 项全部满足才算 P3 完成）

| # | 项 | 验证方法 |
|---|---|---|
| 1 | **WSL 端**：`npm run tauri dev` 起 WSLg 窗口 | WSL 终端无报错，弹出窗口 |
| 2 | **Windows 端**：`npm run tauri build` 产出 `.exe` | PowerShell 跑通，产物在 `src-tauri/target/release/mindtap.exe` |
| 3 | Windows 端通过 UNC 路径访问 WSL 项目 | `cd \\wsl$\Ubuntu\home\jason\workspace\mindtap` 成功 |
| 4 | 窗口里 1 个 Surface 玻璃组件 + "你好 Mindtap" 文案 | **Windows 端跑 .exe** 肉眼验证（不只看 WSLg） |
| 5 | 二次启动正常 | Windows 端双击 .exe 无残留进程 |
| 6 | git init + 首次 commit | 仓库在 WSL 路径下，1 个 commit |

### 2.3 Non-Goals（P3 明确不做）

- ❌ SQLite 集成（DB 留到 Sprint 1）
- ❌ 多窗口（浮动面板 + 主窗口）— 留到 Sprint 1
- ❌ 4 个核心组件（Surface/Modal/Toolbar/Sidebar）— 只做 Surface
- ❌ GitHub Actions CI
- ❌ 代码签名 / 公证
- ❌ SwiftUI 嵌入（D31 移至 V1.4）

---

## 3. 工具链清单

### 3.1 WSL 侧（开发模式 — `tauri dev`）

| 工具 | 状态 | 安装命令 |
|---|---|---|
| Node 20+ | ✅ 已装 | — |
| Rust stable | ⏳ 装 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| apt 系统依赖 | ⏳ 装 | `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev` |
| Tauri CLI（项目内 npm） | ⏳ 装 | `npm install --save-dev @tauri-apps/cli@^2.0`（在 `npm create tauri-app` 之后装） |
| WSLg | ✅ Win11 默认 | — |

**WSL 侧只做**：`npm create tauri-app@latest` 一步建项目 + `npm run tauri dev` 看 WSLg 效果。

### 3.2 Windows 侧（构建模式 — `tauri build` → `.exe`）

| 工具 | 状态 | 安装命令 |
|---|---|---|
| Rust stable (MSVC) | ⏳ 装 | `winget install Rustlang.Rustup` + `rustup default stable-msvc` |
| VS Build Tools 2022 | ⏳ 装 | `winget install Microsoft.VisualStudio.2022.BuildTools`（勾选 "C++ build tools" + "Windows 11 SDK"） |
| WebView2 Runtime | ✅ Win11 默认 | — |
| Tauri CLI | ⏳ 装 | `cargo install tauri-cli --version "^2.0" --locked` |
| Node | ❌ **不装** | 前端 build 走 WSL 路径的 Node |

**Windows 侧只做**：`cd` 到软链路径 → `npm run tauri build` → 产 `.exe`。

### 3.3 网络模式决策

**保持 NAT 模式（默认）** — Windows 浏览器访问 WSL 的 1420 端口要走 WSL IP（不是 localhost）。代价：每次 WSL 重启 IP 可能变。

**前端解决**：`vite.config.ts` 配 `server.host: '0.0.0.0'`，dev server 监听全网接口。

**人工解决**：`scripts/dev-url.sh` 自动打印 WSL IP 给用户复制粘贴。

---

## 4. 目录结构（项目初始化后的目标态）

### 4.1 跨平台架构决策：不分目录

**决策**：V1.0（Mac + Windows）以及未来 V2.0（+ iOS + Android）**不按平台分目录**，统一一棵 `src/` + `src-tauri/`。

**理由**：Tauri 2 核心设计目标 = 单一代码库覆盖多平台；分目录会带来代码同步成本（同一逻辑改 2 份）+ 跨平台调用复杂化。

| 层 | 平台差异处理 | 目录结构 |
|---|---|---|
| **前端**（`src/`）| CSS `@media` + JS `navigator.platform` + Tauri `os` API | 单一 `src/` |
| **Rust 后端**（`src-tauri/`）| `#[cfg(target_os = "macos")]` / `#[cfg(target_os = "windows")]` 条件编译 | 单一 `src-tauri/`，可选用 `src-tauri/src/platform/{macos,windows}.rs` 子模块 |
| **构建配置** | `tauri.conf.json` 内 `bundle.macOS` / `bundle.windows` 分支；或 `tauri.macos.conf.json` / `tauri.windows.conf.json` 覆盖 | 主配置 + 可选覆盖 |
| **Tauri mobile**（V2.0+）| `Cargo.toml` 内 `[target.'cfg(target_os = "ios")'.dependencies]` | 同一棵树 |

**V1.0 实际场景**（Mac + Windows）：
- 唯一平台差异点：`bundle.macOS.icon` vs `bundle.windows.icon`（图标路径）
- Liquid Glass Web 模拟（V1.0 路径）：两端都是 `backdrop-filter`，源码**完全一致**
- 真正需要 SwiftUI 嵌入（V1.4）：届时**单独**抽出 SwiftUI 子工程，不影响 Web 端代码

**反例（什么时候才分目录）**：
- 完全不同的产品线（如同一仓库打包 2 个独立 app）— 不属于本项目
- 完全不同的技术栈（如某模块用 Rust + 某模块用 C++）— 也不属于本项目

```
mindtap/                                  # 项目根 = /home/jason/workspace/mindtap/
├── .git/                                 # git init 后生成
├── docs/                                 # 已存在，本 spec 落盘位置
│   └── projects/v1.0/specs/
│       └── 2026-06-14-p3-scaffold-design.md  # 本文件
├── src/                                  # React 前端（步骤 4-5 创建）
│   ├── main.tsx
│   ├── App.tsx                           # 渲染 <Surface/>
│   ├── components/
│   │   └── Surface.tsx                   # ⭐ 1 个 Liquid Glass 玻璃组件
│   ├── styles/
│   │   └── glass.css                     # 玻璃样式（backdrop-filter）
│   └── vite-env.d.ts
├── src-tauri/                            # Rust 后端（步骤 7 创建）
│   ├── src/main.rs
│   ├── src/lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── icons/
│   └── target/release/
│       └── mindtap.exe                   # ⭐ Windows 端产物（步骤 15）
├── index.html
├── package.json
├── vite.config.ts                        # server.host: '0.0.0.0'
├── tsconfig.json
├── tsconfig.node.json
├── .gitignore
├── README.md
└── scripts/
    └── dev-url.sh                        # ⭐ 打印 WSL IP:1420
```

---

## 5. 10 + 7 步执行计划

> **完整 17 步分两阶段执行**：WSL（步骤 1-11）+ Windows（步骤 12-16）+ git（步骤 17）

### 5.1 WSL 阶段（步骤 1-11，~65 min）

| 步骤 | 命令 | 预期输出 |
|---|---|---|
| 1 | 装 Rust（§3.1） | `rustc --version` → `rustc 1.xx.x` |
| 2 | 装 apt 依赖（§3.1） | 无报错 |
| 3 | `cd /home/jason/workspace/mindtap && git init` | 仓库初始化 |
| 4 | `npm create tauri-app@latest .`（交互：React + TS 模板 + 项目名 `mindtap`） | Vite + Tauri 模板一步到位（`src/` + `src-tauri/` + `package.json` + `vite.config.ts`） |
| 5 | `npm install` | node_modules 装好（含 Tauri CLI） |
| 6 | **跳过**（Tauri CLI 已包含在 create-tauri-app 模板的 devDependencies） | — |
| 7 | **跳过**（`src-tauri/` 已由 create-tauri-app 自动创建） | — |
| 8 | 写 `src/components/Surface.tsx`（见 §6.1）+ `src/styles/glass.css`（见 §6.2）+ 改 `src/App.tsx`（见 §6.3） | 文件就位 |
| 9 | 改 `vite.config.ts`（见 §6.4）加 `server.host: '0.0.0.0'` | dev server 监听全网 |
| 10 | 写 `scripts/dev-url.sh`（见 §6.5） | 跑出 IP |
| 11 | `npm run tauri dev` | WSLg 弹窗口，Surface 可见 |

### 5.2 Windows 阶段（步骤 12-16，~1.5 hour）

| 步骤 | 命令 | 预期输出 |
|---|---|---|
| 12 | 装 Rust + VS Build Tools（§3.2） | `rustc --version` OK |
| 13 | `cargo install tauri-cli --version "^2.0" --locked` | CLI 就位 |
| 14 | PowerShell `cd \\wsl$\Ubuntu\home\jason\workspace\mindtap` | 切到项目 |
| 15 | `npm run tauri build` | 产出 `src-tauri/target/release/mindtap.exe` |
| 16 | 双击 .exe 跑 | WebView2 弹窗，Surface 可见 |

### 5.3 Git 阶段（步骤 17，~1 min）

| 步骤 | 命令 |
|---|---|
| 17 | `git add . && git commit -m "P3: 脚手架 + 1 个 Surface demo"` |

---

## 6. 关键代码骨架

### 6.1 `src/components/Surface.tsx`

```tsx
// 一个最小 Liquid Glass 玻璃容器
// Apple HIG: 玻璃只用于功能层（controls/navigation），不用于内容
// 此处作为脚手架 demo 临时使用，Sprint 4 视觉打磨时再细化
interface SurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export function Surface({ children, className = '' }: SurfaceProps) {
  return <div className={`surface ${className}`}>{children}</div>;
}
```

### 6.2 `src/styles/glass.css`

```css
/* 苹果 Liquid Glass Web 近似实现
   关键属性：backdrop-filter blur + saturate + 半透明背景 + 圆角 + 边框高光 */
.surface {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 28px 32px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  color: #1d1d1f;
  max-width: 480px;
}

.surface h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.surface p {
  margin: 0;
  font-size: 15px;
  opacity: 0.7;
}

/* 背景渐变 — 没有背景，玻璃效果看不见 */
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  min-height: 100vh;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
```

### 6.3 `src/App.tsx`

```tsx
import { Surface } from './components/Surface';
import './styles/glass.css';

function App() {
  return (
    <Surface>
      <h1>你好 Mindtap · 轻念</h1>
      <p>P3 脚手架完成。V1.0 启动中 🚀</p>
    </Surface>
  );
}

export default App;
```

### 6.4 `vite.config.ts`（NAT 模式关键配置）

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri 2 官方推荐模板（让 WSL 2 NAT 模式下 Windows 也能访问）
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || '0.0.0.0',       // 关键：监听所有接口
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
});
```

### 6.5 `scripts/dev-url.sh`

```bash
#!/bin/bash
IP=$(hostname -I | awk '{print $1}')

echo "=================================="
echo "🌐 WSL IP: $IP"
echo "👉 Windows 浏览器打开: http://${IP}:1420"
echo "=================================="

# 检测 dev server 是否在跑
if ss -tln 2>/dev/null | grep -q ':1420 '; then
  echo "✅ Vite dev server 正在跑 (port 1420)"
else
  echo "⏳ Vite dev server 未启动 — 先跑: npm run tauri dev"
fi
```

> **用法**：WSL 跑 `npm run tauri dev` 启动后，另开一个 WSL 终端跑 `bash scripts/dev-url.sh` 拿到 IP。

---

## 7. 验证步骤

### 7.1 三层验证

```
┌────────────────────────────────────────────────────────────┐
│ Layer 1: WSL dev（开发期，主战场）                           │
│  - WSL 跑: npm run tauri dev                                │
│  - 预期: WSLg 弹窗 + Surface 玻璃可见                         │
├────────────────────────────────────────────────────────────┤
│ Layer 2: Windows web（NAT 模式开发预览）                     │
│  - Windows 浏览器打开: http://<WSL_IP>:1420                  │
│  - 预期: 看到 web 端 Surface（WebKitGTK ≠ WebView2 渲染）      │
│  - 用法: bash scripts/dev-url.sh 拿 IP                       │
├────────────────────────────────────────────────────────────┤
│ Layer 3: Windows .exe（最终验收）                            │
│  - PowerShell 跑: cd \\wsl$\...\mindtap && npm run tauri build│
│  - 双击产物: src-tauri/target/release/mindtap.exe            │
│  - 预期: WebView2 弹窗 + Surface 玻璃可见（V1.0 目标平台）    │
└────────────────────────────────────────────────────────────┘
```

**关键**：Layer 1 + Layer 2 跑通 ≠ P3 完成。**必须 Layer 3 跑通才算 P3 done**（V1.0 平台是 Windows + Mac，.exe 才是真目标）。

### 7.2 验证清单（4 项必须全 ✅）

| # | 项 | 怎么验 | 期望 |
|---|---|---|---|
| V1 | WSL 端 dev 弹窗 | `npm run tauri dev` | WSLg 弹窗，看到 "你好 Mindtap" |
| V2 | Windows web 端 | `http://<WSL_IP>:1420` | 同 V1 效果 |
| V3 | Windows .exe 端 | 双击 `mindtap.exe` | WebView2 弹窗，同效果 |
| V4 | git 1 commit | `git log` | 1 个 commit，message 含 "P3: 脚手架 + 1 个 Surface demo" |

---

## 8. 错误处理（P3 失败模式 + 应对）

| # | 失败模式 | 触发条件 | 症状 | 应对 |
|---|---|---|---|---|
| E1 | Rust 未装 | WSL 跳步骤 1 | `cargo: command not found` | 回到步骤 1 装 Rust |
| E2 | apt 依赖缺失 | 跳步骤 2 | `tauri dev` 报 `webkit2gtk not found` | 装 `libwebkit2gtk-4.1-dev` |
| E3 | Tauri 端口冲突 | 1420 被占 | `Address already in use` | `lsof -i :1420` 查进程，杀掉或改 `vite.config.ts` 端口 |
| E4 | WSLg 黑屏 | Win 10/旧 WSL | dev 启动但 WSLg 弹窗失败 | 升级 Win 11 22H2+；或忽略 WSLg，**只看 Windows 浏览器 web 端** |
| E5 | Windows 端 build 缺 MSVC | 跳步骤 12 | `link.exe not found` | 装 VS Build Tools 2022 C++ workload |
| E6 | Windows 端缺 WebView2 | Win 10 N/KN | 双击 .exe 黑屏 | 装 Microsoft Edge WebView2 Runtime |
| E7 | Tauri CLI 版本错 | 默认装 v1 | 命令行无 `dev` 子命令 | 显式 `@^2.0`：`npm install --save-dev @tauri-apps/cli@^2.0` |
| E8 | UNC 路径权限 | Win 首次访问 | `Access Denied` | PowerShell 管理员：`netsh advfirewall firewall add rule ...`（极少） |
| E9 | vite dev 跨网访问 | 默认 `localhost` | Windows 浏览器连不上 | 已配 `host: '0.0.0.0'`（§6.4） |
| E10 | Liquid Glass 视觉差异 | WSLg vs WebView2 | WSL 看着模糊，Windows 清晰（或反之） | **以 Windows 端 .exe 效果为最终验收** |
| E11 | `winget` 不可用 | Win 10 早期版本 | `winget : The term 'winget' is not recognized` | 手动下载安装：① rustup-init.exe ② VS Build Tools 离线 ISO |
| E12 | `create-tauri-app` 拉模板失败 | GitHub 网络不通 | `Failed to download template` | 配 `GIT_TERMINAL_PROMPT=0` 重试；或手动 clone `tauri-apps/create-tauri-app` 模板 |

**整体回退**（P3 失败时）：
- 退回零代码状态，`docs/` 目录 + 仓库结构保留
- 等工具链就位后重试

---

## 9. 时间估算

| 阶段 | 时长 | 备注 |
|---|---|---|
| WSL 工具链（步骤 1-3） | ~30 min | rustup + apt 下载 |
| 项目初始化（步骤 4-7） | ~10 min | Vite 模板 + Tauri init |
| 写 Surface + 配置（步骤 8-10） | ~20 min | 代码 + CSS + 脚本 |
| WSL dev 跑通（步骤 11） | ~5 min | 首次 cargo build 慢 |
| Win 工具链（步骤 12-13） | ~1.5 hour | VS Build Tools 大，下载慢 |
| Win build 跑通（步骤 14-15） | ~10 min | 首次 build 慢（~5 min） |
| 双击 .exe 验证（步骤 16） | ~1 min | — |
| git commit（步骤 17） | ~1 min | — |
| **合计** | **~2.5 hour** | 主要是工具链下载等待 |

---

## 10. 候选方案对比与最终决策

### 10.1 候选方案（搭建方式）

| 方案 | 做法 | 优 | 劣 | 决策 |
|---|---|---|---|---|
| A 手动分步（推荐） | 一行一行手动执行 | 可见、可验证、调试易 | 10 步，~2.5h | ✅ **采用** |
| B 半自动脚本 | 写 `scripts/setup.ps1` 跑一次 | 未来重装易 | 写脚本本身 ~30min；首次跑错难定位 | ❌ |
| C Devcontainer | VSCode Devcontainer.json | 跨平台一致 | Windows Docker 性能差；单人过度工程 | ❌ |

### 10.2 候选方案（WSL 网络模式）

| 方案 | 做法 | 优 | 劣 | 决策 |
|---|---|---|---|---|
| Mirrored | `%UserProfile%\.wslconfig` 加 `networkingMode=mirrored` | Windows 直接 localhost | 需 Win 11 22H2+；破坏部分 IPv6 场景 | ❌ |
| **NAT 默认** | 维持默认 | 0 配置；不破坏现有网络 | 浏览器要走 WSL IP（`scripts/dev-url.sh` 解决） | ✅ **采用** |

### 10.3 候选方案（.exe 构建位置）

| 方案 | 做法 | 优 | 劣 | 决策 |
|---|---|---|---|---|
| **Windows PowerShell build** | Windows 装 Rust + MSVC；PowerShell 跑 build | 真实 PE 格式 .exe | 工具链安装 ~1.5h | ✅ **采用** |
| WSL 交叉编译到 Windows | WSL 装 `mingw-w64`/`cargo-xwin` + Windows target | 少装 Windows 工具链 | Tauri 2 交叉编译坑多；不稳定 | ❌ |
| 跳过 P3 build | 只 dev，不产 .exe | 少装工具链 | Sprint 5 跨平台构建时还要装；P3 验收不完整 | ❌ |

---

## 11. 决策记录

| # | 决策 | 理由 |
|---|---|---|
| P3-D1 | P3 范围 = 最小跑通（不包含 SQLite / 4 组件 / CI） | 用户 2026-06-14 拍板"最小跑通" |
| P3-D2 | 平台 = 先 Windows 跑通 | 用户 2026-06-14 拍板（V1.0 目标 Mac+Win，Win 先跑） |
| P3-D3 | 工具链状态 = Node 已装 + Rust/Tauri/WebView2/MSVC 待装 | 用户 2026-06-14 回答 |
| P3-D4 | 视觉验证 = 1 个最简 Surface demo | 用户 2026-06-14 拍板（"马上看见苹果玻璃感"） |
| P3-D5 | SQLite 集成 = 不包含，DB 留后 | 用户 2026-06-14 拍板 |
| P3-D6 | 搭建方式 = 手动分步 | 用户 2026-06-14 拍板 |
| P3-D7 | WSL 网络模式 = NAT 默认 | 用户 2026-06-14 拍板 |
| P3-D8 | 必产 .exe（Windows 装工具链） | 用户 2026-06-14 拍板 |
| P3-D9 | Windows 访问方式 = UNC 路径（不建符号链接） | 默认推荐（A 方案） |
| P3-D10 | P3 DoD = 6 项（§2.2） | 本 spec 定义 |

---

## 12. 风险登记

| 风险 | 概率 | 影响 | 应对 |
|---|---|---|---|
| VS Build Tools 下载慢导致超时 | 30% | 步骤 12 阻塞 | 用国内镜像；或换 `Microsoft.VisualStudio.2022.BuildTools` 离线包 |
| WSL 2 IP 每次重启变 | 100% | 需每次跑 `dev-url.sh` | 文档化（§6.5 已是） |
| Tauri 2 文档与 v2.0.x 实际行为有偏差 | 20% | 步骤 7 init 失败 | 退回 v2 稳定版，参考 Tauri 官方 create-tauri-app 模板 |
| backdrop-filter 在老硬件/驱动不支持 | 10% | 玻璃效果降级为半透明 | 已有 fallback 视觉效果（仍可见 Surface） |
| Surface 视觉与 Apple 原版差异大 | 50% | Sprint 4 视觉打磨需返工 | **预期内** — P3 是"骨架"，Sprint 4 才视觉打磨 |

---

## 13. 与其他文档的关系

| 文档 | 关系 |
|---|---|
| `task_plan.md` §"Phase P3" | 上游基线，本 spec 是其细化 |
| `prd-v1.2.md` §3.3 | 技术架构对齐（Tauri 2 + React 18 + TS + SQLite） |
| `agile-sprint-plan.md` Sprint 0 | P3 是 Sprint 0 的子集（本 spec 不含 CI / 4 组件扩展） |
| `2026-06-14-glass-2x2-matrix.md` | Liquid Glass Mac/Win 决策：本 spec 走 Web 模拟（V1.0 路径） |
| `2026-06-14-liquid-glass-final-overview.md` | Liquid Glass 8 维度：Surface demo 用"半透明 + 模糊"维度 |
| `../../material/apple/liquid-glass/01-overview.md` | Liquid Glass 官方设计原则参考 |

---

## 14. 开放问题

| # | 问题 | 处理 |
|---|---|---|
| OQ1 | V1.0 上线后 Sprint 1 的 SQLite 集成是否要重新 brainstorm？ | 是（V1.0 上线后） |
| OQ2 | Surface 组件在 Sprint 4 视觉打磨时如何与 SwiftUI 嵌入协调（D31 推到 V1.4）？ | Sprint 4 启动时再决策 |
| OQ3 | Windows 端 WSL IP 不稳定问题，长期方案？ | 候选：写个 `wsl-bridge.ps1` 固定端口转发；Sprint 5 跨平台时再决策 |

---

## 15. 维护说明

- **更新日期**：2026-06-14
- **状态**：⏳ pending user review
- **下一步**：
  1. 用户审阅本 spec
  2. 审阅通过 → 移交 writing-plans 技能制定 17 步实施计划
  3. 实施 17 步 → P3 done
  4. Sprint 0 在 P3 基础上扩展（4 组件 + CI）
- **不收录**：移动端（V2.0）；SwiftUI 嵌入（V1.4）；SQLite 集成（Sprint 1）
