# scripts/

Windows 侧开发脚本胶水。**从 Windows 原生 PowerShell 跑,不要在 WSL 里跑**。

| 文件 | 何时用 |
|---|---|
| `dev.bat` | 在 Windows Explorer 里双击;等价于 `dev.ps1` 但绕开执行策略限制 |
| `dev.ps1` | 在 PowerShell 里跑:`.\scripts\dev.ps1`,加 `-Reinstall` 重新装 deps |
| `build-windows.bat` | 双击跑生产打包;等价于 `build-windows.ps1` |
| `build-windows.ps1` | Windows 生产打包 → 产物写入项目根 `build\`（已 gitignore） |
| `verify-install-data-safety.ps1` | 隔离验收：NSIS 静态断言 + 静默装/卸不删 SQLite（不碰真实 AppData） |
| `repro-review-state.mjs` | release EXE 主窗启动冒烟（`npm run test:release-startup`） |
| `pull-and-dev.bat` / `pull-and-dev.ps1` | `git pull origin develop` 后立刻起 dev |

---

## 一次性环境准备(Windows 侧)

```powershell
# 1. Rust + cargo-tauri CLI
winget install Rustlang.Rustup
rustup default stable
cargo install tauri-cli --version "^2.0" --locked

# 2. MSVC 编译器 + WebView2 Runtime
#    - Visual Studio Build Tools 2022,勾选 "使用 C++ 的桌面开发" 工作负载
#    - WebView2 Runtime 已在 Win11 预装;Win10 用 npx playwright install msedge 或官网下载

# 3. (可选) Node.js -- 只有在不用 cargo tauri、想用 npm run tauri dev 时才需要
winget install OpenJS.NodeJS.LTS
```

完成后验证:

```powershell
cargo --version
cargo tauri --version
```

---

## 日常使用

**方式 1:双击**(最省事)

```
在 Windows 资源管理器里打开项目 scripts\,
双击 dev.bat
```

**方式 2:命令行**

```powershell
cd <项目根>
.\scripts\dev.ps1
# 或带参数:
.\scripts\dev.ps1 -Reinstall
```

**Pin 到任务栏**:右键 `dev.bat` → 创建快捷方式 → 拖到任务栏。

---

## 生产打包（Windows）

**前置**：与开发相同（Node 24 / Rust / MSVC C++ workload / WebView2）。`tauri.conf.json` 的 `bundle.targets` 已固定为 `["nsis"]`。

```powershell
cd <项目根>

# 默认：release 构建 + 收集产物到 build\
.\scripts\build-windows.ps1

# 重装依赖 + 清空 build\ 再打包
.\scripts\build-windows.ps1 -Reinstall -Clean

# 只要裸 exe，不要 NSIS 安装包
.\scripts\build-windows.ps1 -SkipBundle

# 强制全量重编 cargo release（慢）
.\scripts\build-windows.ps1 -CleanTarget
```

或双击 `scripts\build-windows.bat`。

**产物**（均在项目根 `build\`，已写入 `.gitignore`）：

| 文件 | 说明 |
|---|---|
| `mindtap.exe` | 便携裸二进制，可直接 `Start-Process` |
| `mindtap_<version>_x64-setup.exe` | NSIS 安装包 |
| `build-info.txt` | 版本 / git sha / 构建时间戳 |

脚本会优先 `cargo tauri build`，没有 cargo-tauri 时 fallback 到 `npm run tauri -- build`；`beforeBuildCommand` 会自动跑 `npm run build`（tsc + 边界检查 + vite）。

### 安装数据保护验收（隔离）

**不启动**真实用户 profile 下的 mindtap.exe（Tauri 走 Known Folder，忽略 `APPDATA` 环境变量重定向）。

```powershell
# 先有 build\mindtap_*_x64-setup.exe
npm run build:win
.\scripts\verify-install-data-safety.ps1
```

覆盖：生成 NSIS 无 AppData 删除路径；沙箱 fixture → 静默安装/完整卸载字节不变；`init_connection` 语义保留。

---

## 它在做什么

1. **拒绝在 WSL 里运行**:脚本第一件事就是检测 `WSL_DISTRO_NAME` 环境变量,误运行会立即报错避免你在错误的 namespace 里执行。
2. **定位项目根**:脚本不一定非要放在 `scripts/` 里——它向上找 `package.json`,找到即停。
3. **工具探测**:优先 `cargo tauri` > `npm run`。装过 cargo-tauri 后无平台二进制坑。
4. **CARGO_TARGET_DIR 落到 Windows fs**:默认 `~/AppData/Local/mindtap-target/`,Rust 编译产物不再走 `\\wsl$`(否则首次 build 慢 5-10×)。
5. **清理陈旧端口**:`:1420`(Vite)和 `:1421`(HMR WS)上残留的进程会被 kill。
6. **启动 Tauri dev**:跑 `cargo tauri dev`(或 fallback),`Ctrl+C` 一次取消 cargo / node,不会留后台进程。

---

## 已知坑

| 现象 | 原因 + 解法 |
|---|---|
| 双击 `.bat` 闪一下就没了 | 终端关了。把 `dev.bat` 创建快捷方式并设 "起始位置" 为项目根,或从 PowerShell 里跑 `.ps1`。 |
| 首次 build 几分钟 | `\\wsl$` 文件系统慢。脚本已经自动把 `CARGO_TARGET_DIR` 改到 Windows fs,缓解;但 `cargo fetch` 阶段仍可能慢。 |
| WebView2 窗口显示 "ERR_CONNECTION_REFUSED" | Vite 还没起来,或在 WSL 里跑过 vite 后停了。等 5-10s 刷新窗口;或运行 `Get-NetTCPConnection -LocalPort 1420` 看 Vite 是否真监听了。 |
| `cargo tauri --version` 找不到 | `cargo install tauri-cli --version "^2.0" --locked` 没跑;脚本会自动 fallback 到 `npm run tauri dev`。 |
| Tauri 报 `error: linker not found` | MSVC toolchain 没装。装 "使用 C++ 的桌面开发" 工作负载后重启 PowerShell。 |
| `npm run tauri dev` 启动时找不到 `@tauri-apps/cli-win32-x64-msvc` | 之前在 WSL 里跑过 `npm install`,导致装的是 Linux 平台 binary。在 PowerShell 里重跑 `npm install`(参 `-Reinstall` 参数)。 |

---

## 为什么不用 WSLg 直接在 WSL 里跑 tauri dev?

理论上可以,但不推荐:
- WebView2 是 Windows 原生 COM 组件,WSLg 转发只在 Linux 进程里塞一个 stub,事件/IPC 多一跳
- macOS 透明 / overlay / 原生右键菜单这类 Windows-only 行为,在 WSL 里复现不到(WSLg 用的是 Linux Wayland 抽象)
- 一旦遇到 panic / freeze,Windows 进程栈在 WSL 那边看不到,debug 信号直接断

这条路**不值得**——脚本帮你把"开发态"留在 WSL,把"调试态"留在 Windows 两侧,各司其职。
