# 轻念 · Mindtap

> 极简记录 APP · V1.0 闪念

**跨平台桌面应用**：Tauri 2 + React 19 + TypeScript + Vite

---

## 🚀 快速开始

### 前置依赖

| 平台 | 工具 |
|---|---|
| **任意** | Rust 1.96+ · Node.js 24 LTS |
| **Windows** | MSVC Build Tools 2022 + Windows SDK 10.0.26100+ |
| **macOS** | Xcode Command Line Tools |
| **Linux** | libwebkit2gtk-4.1-dev · libssl-dev · libayatana-appindicator3-dev |

### 开发（WSL / Linux / macOS）

```bash
npm install
npm run tauri dev
```

### 构建（Windows .exe）

```powershell
# 1. 开 cmd
# 2. 跑 vcvars64.bat 设 MSVC 环境
"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

# 3. 改目录
cd /d C:\path\to\mindtap

# 4. build
npm run tauri build
# 产物: src-tauri\target\release\mindtap.exe
```

> **macOS / Linux** 同样命令生成对应平台 .app / 可执行文件。
>
> **安装包**（MSI / NSIS / DMG / deb）需 `tauri.conf.json` `bundle.targets` 配置 + 各自工具链（WiX / NSIS / 等）。V1.0 P3 默认跳过（**只**生成裸 `.exe`）。

---

## 📁 目录结构

```
mindtap/
├── src/                    # React 前端
│   ├── App.tsx            # 主组件（用户自有资产）
│   ├── components/        # UI 组件
│   └── styles/            # 全局样式
├── src-tauri/              # Rust 后端 + Tauri 2
│   ├── src/
│   │   ├── lib.rs         # 入口
│   │   └── main.rs        # binary 入口
│   ├── tauri.conf.json    # Tauri 配置
│   └── Cargo.toml         # Rust 依赖
├── docs/projects/v1.0/     # 项目文档 + 设计资产
│   ├── task_plan.md       # 任务拆解（强制规则：顶层先于零散）
│   ├── progress.md        # 会话日志
│   ├── findings.md        # 调研发现
│   ├── prototype/         # V2 视觉对比原型（4 方向）
│   └── specs/             # 设计 spec
├── scripts/                # 工具脚本
└── README.md              # 本文件
```

---

## 🎯 V1.0 范围

**灵感 + TODO + 复盘** 3 模块（用户决策 D29）

- ✅ **跨平台**：单代码库（WSL / Windows / macOS / Linux）
- ✅ **本地存储**：SQLite，全本地无后端
- ✅ **Liquid Glass 设计**：Apple HIG Materials 原则
- ❌ 语音输入（V1.4 再加）
- ❌ 导出 / 导入 / 同步（V1.0 全本地）

详细见 `docs/projects/v1.0/specs/`。

---

## 🛠️ 工具链版本

| 工具 | 版本 | 备注 |
|---|---|---|
| Tauri | 2.11.2 | Tauri 2.x |
| React | 19.1.0 | 最新 stable |
| TypeScript | 5.8.3 | strict mode |
| Vite | 7.3.5 | HMR dev server 1420 |
| Rust | 1.96.0 | rustc 1.96.0 |
| Node.js | 24.16.0 | LTS |
| MSVC | 14.44.35207 | Visual Studio 2022 Build Tools |
| Windows SDK | 10.0.26100.0 |  |
| WebView2 | Latest | Windows 11 预装 |

---

## 🧭 跨平台架构

**单代码库 + 条件编译**：

```rust
// src-tauri/src/lib.rs
#[cfg(target_os = "macos")]
fn platform_specific() { /* NSVisualEffectView */ }

#[cfg(target_os = "windows")]
fn platform_specific() { /* webview2-com */ }

#[cfg(target_os = "linux")]
fn platform_specific() { /* gtk4-layer-shell */ }
```

无 `src-tauri/src-tauri-macos/` 之类**按平台拆目录**（§4.1 决策）。

---

## 📋 P3 脚手架 DoD 验收

| 项 | 状态 |
|---|---|
| WSL `npm run tauri dev` 跑通 | ✅ commit 4b3f847 |
| Windows `npm run tauri build` 跑通 | ✅ 21.39s 增量 |
| `mindtap.exe` 生成 | ✅ 9 MB |
| `.exe` 启动不崩 | ✅ 弹窗 OK |
| Liquid Glass demo 渲染 | ✅（App.tsx 资产）|
| Tauri 2 + React 19 + TS 栈 | ✅ |

---

## 📜 License

TBD（V1.0 上线前定）
