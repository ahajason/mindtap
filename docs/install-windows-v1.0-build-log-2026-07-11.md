---
title: Windows 端 Mindtap V0.1.6 完整安装实战记录
date: 2026-07-11
author: AhaJason
tags: [windows, tauri, build, install, v0.1.6]
status: ✅ Complete
---

# Windows 端 Mindtap V0.1.6 完整安装实战记录

> **范围**：在 Windows 11 上从零跑通 `npm run tauri build`，产出裸 `.exe` + NSIS `.exe` 安装包，并创建桌面快捷方式验证应用可运行。
>
> **目标版本**：GitHub `main` 分支 = V0.1.6（commit `8af219a` "V0.1.6 drag region 改用专用 handle 落地"）。
>
> **跨环境策略**：D43 — Windows 端独立项目目录（不软链、不与 WSL 端共享）。
>
> **本文位置**：`docs/install-windows-v1.0-build-log-2026-07-11.md`（不在 `projects/v1.0/` 下，作为 V0.1.x release-install 通用记录）。

---

## 0. 结论（TL;DR）

| 项 | 状态 | 详情 |
|---|---|---|
| Git clone | ✅ | `D:\workspace\mindtap` （V0.1.6） |
| Node 24.9.0 | ✅ | nvm-windows 1.2.2 + npmmirror 镜像 |
| Cargo 1.96 + rsproxy 镜像 | ✅ | 第一次拉依赖 < 1 min |
| MSVC BuildTools 2022 | ✅ | 静默安装 C++ workload + Win10SDK 10.0.26100 |
| `npm install` | ✅ | 542 packages / 6s（npmmirror 加速） |
| `npm run tauri build`（裸 .exe）| ✅ | `mindtap.exe` 8.4 MB / 22.13s 增量 |
| NSIS 安装包 | ✅ | `mindtap_0.1.0_x64-setup.exe` 2.0 MB |
| 桌面快捷方式 ×2 | ✅ | `mindtap.lnk` + `安装 mindtap.lnk` |
| 应用启动验证 | ✅ | 窗口标题"轻念 · Mindtap"，PID 15768，26 MB，Responding=True |

**总耗时**：~45 分钟（含 MSVC BuildTools 下载安装 ~20 min）。

---

## 1. 起始环境（Before）

| 维度 | 状态 |
|---|---|
| OS | Windows 11 24H2 |
| 用户 | Administrator（`C:\Users\Administrator.DESKTOP-08FNQ8U`） |
| Git | 2.54.0.windows.1 ✅ |
| SSH | `id_ed25519` 已配 GitHub 认证 ✅ |
| Node | v25.2.1 ❌（项目要求 `>=24 <25`） |
| npm | 11.6.2 |
| Rust / cargo | 1.96.0 / MSVC toolchain ✅ |
| MSVC BuildTools | ❌ 缺失（PATH 中路径是 stale，VC 目录不存在）|
| Windows SDK 10.0.26100 | ❌ 缺失 |
| nvm-windows | ❌ 未装 |
| Tauri CLI | ❌ 未装 |
| Cargo 镜像 | ❌ 未配（直连 crates.io）|
| npm 镜像 | ❌ 未配（直连 registry.npmjs.org）|

**关键观察**：
- `where link` 时 PATH 同时含 MSVC link 和 Git Bash link（`D:\Program Files\Git\usr\bin\link.exe`）—— **E22 反向 E15**
- PATH 中 MSVC bin 路径 stale（`C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64`），实际目录不存在

---

## 2. 执行时间线

### 阶段 A：仓库准备（5 min）

| # | 操作 | 命令 | 结果 |
|---|---|---|---|
| A1 | 验证 GitHub SSH | `ssh -T git@github.com` | ✅ `Hi ahajason!` |
| A2 | Git clone | `git clone git@github.com:ahajason/mindtap.git D:\workspace\mindtap` | ✅ V0.1.6 main 分支，clean tree |
| A3 | 确认 `bundle.targets` | 读 `src-tauri\tauri.conf.json` | 默认 `"all"`（不是空数组）→ 需显式配 |

> **决策 D46**：在 `D:\workspace\mindtap\`（不在 `C:\Users\…\workspace\`），按用户偏好。

### 阶段 B：Node 24 LTS（5 min）

| # | 操作 | 命令 | 结果 |
|---|---|---|---|
| B1 | 装 nvm-windows | `winget install --id CoreyButler.NVMforWindows -e --silent` | ✅ v1.2.2 |
| B2 | 配 nvm 镜像 | 写 `C:\Users\Administrator.DESKTOP-08FNQ8U\AppData\Local\nvm\settings.txt`：<br>`node_mirror: https://npmmirror.com/mirrors/node/`<br>`npm_mirror: https://registry.npmmirror.com/npm/` | ✅（解决 **E21**） |
| B3 | 装 Node 24 | `nvm install 24` → 24.9.0 | ✅ |
| B4 | 激活 Node 24 | `nvm use 24.9.0` | ✅ `Now using node v24.9.0 (64-bit)` |

### 阶段 C：Rust + npm 镜像（1 min）

| # | 操作 | 结果 |
|---|---|---|
| C1 | 写 `C:\Users\…\.cargo\config.toml` 配 rsproxy | ✅ |
| C2 | `npm config set registry https://registry.npmmirror.com` | ✅ |

### 阶段 D：npm install（30s）

```
added 542 packages in 6s
151 packages are looking for funding
```

- tauri-cli 2.11.3 已就位 ✅
- 警告 `node-domexception@1.0.0 deprecated` —— jsdom 间接依赖，无害

### 阶段 E：MSVC BuildTools 安装（~20 min）🔴 关键阻塞

| # | 操作 | 结果 |
|---|---|---|
| E1 | 首次 `cargo build` sanity（hello world） | ❌ `link.exe` extra operand（**E22**） |
| E2 | 查 PATH 中 MSVC 路径 | ❌ stale（`Test-Path` False）|
| E3 | 下载 `vs_BuildTools.exe` | ✅ 4.4 MB |
| E4 | 静默安装 C++ workload | `vs_BuildTools.exe --quiet --wait --norestart --nocache --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended` |
| E5 | 验证 `vcvars64.bat` 存在 | ✅ `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat` |
| E6 | 验证 `cl.exe` / `link.exe` / `rc.exe` | ✅ MSVC 14.44.35228 / SDK 10.0.26100 |
| E7 | 重跑 cargo sanity | ✅ `Hello, world!` → `hello.exe` 125 KB |

### 阶段 F：tauri build（22s 增量）

第一次跑（targets = "all"）：

```
Compiling mindtap v0.1.0 (D:\workspace\mindtap\src-tauri)
Finished `release` profile [optimized] target(s) in 1m 23s
   Built application at: D:\workspace\mindtap\src-tauri\target\release\mindtap.exe
    Info Patching …with bundle type information: msi
    Info Verifying wix package
 Downloading https://github.com/wixtoolset/wix3/releases/download/wix3141rtm/wix314-binaries.zip
failed to bundle project: `Peer disconnected`         ← **E24**
```

**修复**：把 `bundle.targets` 改为 `["nsis"]`（NSIS 已在 Tauri 缓存 `C:\Users\…\AppData\Local\tauri\NSIS` 完整就位，不需要下载）。

```json
// src-tauri/tauri.conf.json
"bundle": {
  "active": true,
  "targets": ["nsis"],
  ...
}
```

第二次跑：

```
Built application at: D:\workspace\mindtap\src-tauri\target\release\mindtap.exe
 Info Patching …with bundle type information: nsis
Running makensis to produce …\bundle\nsis\mindtap_0.1.0_x64-setup.exe
Finished 1 bundle at:
   D:\workspace\mindtap\src-tauri\target\release\bundle\nsis\mindtap_0.1.0_x64-setup.exe
```

| 产物 | 大小 | 路径 |
|---|---|---|
| 裸 `.exe` | 8,778,240 B (8.4 MB) | `src-tauri\target\release\mindtap.exe` |
| NSIS 安装包 | 2,004,325 B (2.0 MB) | `src-tauri\target\release\bundle\nsis\mindtap_0.1.0_x64-setup.exe` |

### 阶段 G：应用启动验证

```powershell
Start-Process 'D:\workspace\mindtap\src-tauri\target\release\mindtap.exe' -PassThru
# PID=15768
# MainWindowTitle = '轻念 · Mindtap'
# MainWindowHandle = 11143126
# Responding = True
# WorkingSet64 = 26.1 MB
```

✅ 窗口正常创建，UI 响应。

### 阶段 H：桌面快捷方式（PowerShell COM）

WScript.Shell COM 在 PowerShell 5.1 下保存中文字面量会乱码（ANSI codepage 936 GBK）→ 用 `[char]0x5B89 + [char]0x88C5` 构造"安装"两字（**E23**）。

```powershell
$cn = [char]0x5B89 + [char]0x88C5   # 安 装
$cnName = $cn + ' mindtap.lnk'        # "安装 mindtap.lnk"
```

最终桌面：

| 文件 | 大小 | 目标 |
|---|---|---|
| `mindtap.lnk` | 1,208 B | `D:\workspace\mindtap\src-tauri\target\release\mindtap.exe` |
| `安装 mindtap.lnk` | 1,468 B | `D:\workspace\mindtap\src-tauri\target\release\bundle\nsis\mindtap_0.1.0_x64-setup.exe` |

图标：`src-tauri\icons\icon.ico,0`（两个都用项目图标）

---

## 3. 关键决策与错误（追加到 task_plan.md）

### 新决策

- **D46**: Windows 端独立项目目录从 `C:\Users\…\workspace\` 改为 `D:\workspace\`（D 盘更通用，不绑定用户名）。
- **D47**: 当 `bundle.targets = "all"` 时，Tauri 试图同时下载 WiX（生成 MSI）+ NSIS（生成 NSIS exe），WiX 下载在中国大陆易失败 → 默认改用 `["nsis"]`（仅 NSIS，~2 MB，免下载，Tauri 缓存自带 NSIS 3.x）。
- **D48**: 桌面快捷方式文件名需 Unicode → 必须用 `[char]` cast 构造，**不能**直接 PowerShell 字符串字面量（ANSI cp936 编码）。

### 新错误

- **E20**：`PATH stale MSVC` —— VS BuildTools 2022 已"装"但 VC 目录实际缺失；PATH 是历史残留。**现象**：cargo 调 link.exe 时落到 Git Bash 的 link。**根因**：可能是 BuildTools 半装/卸载后 PATH 没刷新。**解决**：用 `Test-Path` 验证关键工具链目录；用 `vs_BuildTools.exe --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended` 重装。
- **E21**：`nvm-windows 默认从 nodejs.org 下载 Node 二进制，国内网络不稳`。**根因**：nvm-windows 的 `NVM_NODEJS_ORG_MIRROR` 环境变量不生效（settings.txt 才生效）。**解决**：编辑 `settings.txt` 加 `node_mirror: https://npmmirror.com/mirrors/node/` + `npm_mirror: https://registry.npmmirror.com/npm/`。
- **E22**：cargo 在 PATH 含 MSVC + Git 双重 link 时调 link.exe 报 "extra operand"。**根因**：E15 反向 —— vcvars64.bat 不在 PATH 时，Git Bash 的 `ln`（即 link.exe）排在前面被 cargo 选中。**解决**：build.bat 先 `call vcvars64.bat` 再调 cargo，确保 MSVC link 在 PATH 最前。
- **E23**：PowerShell 5.1 + WScript.Shell COM 创建中文字符 .lnk 文件名乱码。**根因**：PS 5.1 默认 ANSI codepage (cp936 GBK) 解析源码字面量；COM CreateShortcut 内部用 ANSI 传字符串。**解决**：用 `[char]0x5B89 + [char]0x88C5` 构造"安装"，绕开源码字面量。
- **E24**：`failed to bundle project: Peer disconnected`。**根因**：Tauri 内部 reqwest 拉 WiX 时连接 GitHub release 失败（默认无代理，AGENTS.md E19 同类问题）。**解决**：把 `bundle.targets` 从 `"all"` 改为 `["nsis"]`，NSIS 在本地 Tauri 缓存完整就位，免下载。

---

## 4. 复现步骤（Next Time 30 min 装机）

> 假设已有 Git + SSH key + 已认证 GitHub。

```powershell
# 1. 装 nvm-windows（如未装）
winget install --id CoreyButler.NVMforWindows -e --silent

# 2. 配 nvm 国内镜像（避免 E21）
$env:NVM_HOME = 'C:\Users\Administrator.DESKTOP-08FNQ8U\AppData\Local\nvm'
$nvmSettings = "$env:NVM_HOME\settings.txt"
@'
root: C:\Users\Administrator.DESKTOP-08FNQ8U\AppData\Local\nvm
path: C:\nvm4w\nodejs
node_mirror: https://npmmirror.com/mirrors/node/
npm_mirror: https://registry.npmmirror.com/npm/
'@ | Set-Content -Path $nvmSettings -Encoding ascii

# 3. 装 Node 24
& "$env:NVM_HOME\nvm.exe" install 24.9.0
& "$env:NVM_HOME\nvm.exe" use 24.9.0

# 4. 装 MSVC BuildTools（如未装）—— 30-90 min，最重
Invoke-WebRequest -Uri 'https://aka.ms/vs/17/release/vs_BuildTools.exe' -OutFile $env:TEMP\vs_BuildTools.exe
& "$env:TEMP\vs_BuildTools.exe" --quiet --wait --norestart --nocache `
    --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended

# 5. 配 cargo + npm 国内镜像
$cargoConfig = @'
[source.crates-io]
replace-with = 'rsproxy-sparse'

[source.rsproxy-sparse]
registry = 'sparse+https://rsproxy.cn/index/'

[net]
git-fetch-with-cli = true
'@
Set-Content -Path "$env:USERPROFILE\.cargo\config.toml" -Value $cargoConfig -Encoding utf8
npm config set registry https://registry.npmmirror.com

# 6. 克隆仓库
git clone git@github.com:ahajason/mindtap.git D:\workspace\mindtap
cd D:\workspace\mindtap

# 7. 改 bundle.targets 为 nsis（如要完整安装包）
# 手动编辑 src-tauri/tauri.conf.json: "targets": ["nsis"]

# 8. 写 build.bat（vcvars64 + nvm use + tauri build）
# 详见 build.bat 内容（见 phase F）

# 9. 跑 build
cmd.exe /c build.bat
# 产物：src-tauri\target\release\mindtap.exe (8.4 MB)
#       src-tauri\target\release\bundle\nsis\mindtap_0.1.0_x64-setup.exe (2.0 MB)

# 10. 桌面快捷方式
$ws = New-Object -ComObject WScript.Shell
$cn = [char]0x5B89 + [char]0x88C5
$desktop = [Environment]::GetFolderPath('Desktop')

$s = $ws.CreateShortcut("$desktop\mindtap.lnk")
$s.TargetPath = 'D:\workspace\mindtap\src-tauri\target\release\mindtap.exe'
$s.IconLocation = 'D:\workspace\mindtap\src-tauri\icons\icon.ico,0'
$s.Save()

$s = $ws.CreateShortcut("$desktop\$cn mindtap.lnk")
$s.TargetPath = 'D:\workspace\mindtap\src-tauri\target\release\bundle\nsis\mindtap_0.1.0_x64-setup.exe'
$s.IconLocation = 'D:\workspace\mindtap\src-tauri\icons\icon.ico,0'
$s.Save()
```

---

## 5. 工具链版本快照（2026-07-11）

| 工具 | 版本 |
|---|---|
| Windows | 11 24H2 |
| Git | 2.54.0.windows.1 |
| Node | v24.9.0 (64-bit) via nvm-windows 1.2.2 |
| npm | 11.6.0 |
| Rust | 1.96.0 (stable-x86_64-pc-windows-msvc) |
| cargo | 1.96.0 |
| MSVC | 14.44.35228 (BuildTools 2022) |
| Windows SDK | 10.0.26100.0 |
| NSIS | 3.x（Tauri 缓存 `AppData\Local\tauri\NSIS`）|
| Tauri CLI | 2.11.3 (devDep) |
| Tauri runtime | 2.11.5 |

---

## 6. 待办（未来可优化）

- [ ] **D49 候选**：让 Tauri 走国内代理重试 WiX（恢复 `targets = "all"`）—— `$env:HTTPS_PROXY` 不被 Tauri 内部 reqwest 读（E19），需要给 reqwest 打 patch 或换镜像源（如 aliyun wix 镜像）。
- [ ] **D50 候选**：把 setup 流程写成 `scripts/install-windows.ps1`（一键：装 nvm + 镜像 + MSVC + clone + build + 快捷方式），让任何 Windows 用户零基础跑通。
- [ ] **D51 候选**：CI 在 GitHub Actions 的 `windows-latest` runner 跑同样的 build，每发版自动出 `.exe` + `.msi` + 自动 release。

---

**记录时间**：2026-07-11
**记录人**：AhaJason（Agent 协作）
**产物 MD5**：（待补；可用 `Get-FileHash D:\workspace\mindtap\src-tauri\target\release\mindtap.exe -Algorithm MD5`）

---

## 7. 后续清理（2026-07-11 同一 session）

### 7.1 发现：桌面有 4 个 mindtap 相关快捷方式

调查后发现是**同一个 mindtap 项目的两个不同时期安装**：

| 项 | 旧版 `tauri-app` | 新版 `mindtap`（今天装的）|
|---|---|---|
| 安装时间 | 2026-06-14 16:42 | 2026-07-11 17:51 |
| productName（exe metadata）| `tauri-app` | `mindtap` |
| FileVersion / ProductVersion | 0.1.0 / 0.1.0 | 0.1.0 / 0.1.0 |
| CompanyName | mindtap | mindtap |
| 安装目录 | `%LOCALAPPDATA%\tauri-app\` | `%LOCALAPPDATA%\mindtap\` |
| `.exe` 大小 | 9,031,168 B | 8,778,240 B |
| 卸载注册表键 | `HKCU\…\Uninstall\tauri-app` | `HKCU\…\Uninstall\mindtap` |

**结论**：两个都是同一个项目（CompanyName=mindtap），只是 `tauri.conf.json` 的 `productName` 字段在不同时期不同（6/14 时是默认脚手架名 `tauri-app`，V0.1.6 已改为 `mindtap`）。

### 7.2 桌面 4 个快捷方式来源解读

```
🖥️ 桌面：
  ├─ tauri-app.lnk        ← 旧版安装产物（6/14 NSIS 创建）
  ├─ mindtap.lnk          ← 新版安装产物（今天 NSIS 创建）
  └─ 安装 mindtap.lnk     ← 我留的 setup.exe 入口

📋 开始菜单：
  └─ mindtap              ← 新版安装产物（同桌面 mindtap.lnk 同一文件）
```

**附录**：用户问到的 `瀹夎 闆嗘墖 mindtap.lnk` —— PowerShell 5.1 在 cp936 (GBK) codepage 下读 UTF-16 文件名 `安装` 时显示的乱码，**不是独立文件**。文件本身正确，是 `安装 mindtap.lnk`。可在资源管理器（用 Unicode）看到正确名。

### 7.3 清理动作

**用户要求**：保留 1 个安装 + 1 个运行快捷方式，删除旧的全部。

执行（`cleanup-old-tauri-app.ps1`）：

1. 静默卸载旧版：`uninstall.exe /S _?="$installDir"` → exit code 2（NSIS 提示但未清干净）
2. 强制清理兜底：
   - `Remove-Item -Recurse -Force %LOCALAPPDATA%\tauri-app\`
   - `Remove-Item %USERPROFILE%\Desktop\tauri-app.lnk`
   - `Remove-Item "%APPDATA%\Microsoft\Windows\Start Menu\Programs\tauri-app.lnk"`
   - `Remove-Item HKCU:\…\Uninstall\tauri-app`（注册表键）
3. 最终验证：5 个目标全部 `Test-Path` 返回 False ✅

### 7.4 清理后状态

| 位置 | 项 | 状态 |
|---|---|---|
| 桌面 | `mindtap.lnk` | ✅ 保留（运行入口） |
| 桌面 | `安装 mindtap.lnk` | ✅ 保留（安装入口） |
| 桌面 | `tauri-app.lnk` | ❌ 已删 |
| 开始菜单 | `mindtap` | ✅ NSIS 标准产物 |
| `%LOCALAPPDATA%\tauri-app\` | 8.6 MB | ❌ 已删（回收 8.6 MB） |
| `HKCU\…\Uninstall\tauri-app` | 注册表键 | ❌ 已删 |
| `HKCU\…\Uninstall\mindtap` | 注册表键 | ✅ 保留 |
| `%LOCALAPPDATA%\mindtap\` | 8.4 MB | ✅ 保留 |

### 7.5 决策与错误追加

- **D52 决策**：V0.1.x 的 NSIS 默认 per-user 安装到 `%LOCALAPPDATA%\<productName>\`（不需要 admin）。如需系统级安装到 `C:\Program Files\`，改 `tauri.conf.json` 的 `bundle.windows.nsis.installMode = 'perMachine'` 或在 setup.exe 传 `/allusers`。
- **D53 决策**：清理 NSIS 卸载残留时**不要只信 uninstall.exe 的退出码**（silent mode 下 exit code 可能非 0 但清理仍部分成功），需要 force delete 兜底验证所有目标路径。
- **E25 错误**：PowerShell 5.1 + ANSI codepage (cp936 GBK) 解读 NTFS UTF-16 文件名 → 显示成乱码 `瀹夎 闆嗘墖`。**误解**：用户可能以为桌面上有个乱码快捷方式。**正解**：乱码是 PowerShell 显示问题，文件本身是正确中文名，资源管理器 + .NET FileSystem 都显示正确。

### 7.6 复现完整清理命令

```powershell
# 卸载旧版（不靠谱，兜底用）
& "C:\Users\…\AppData\Local\tauri-app\uninstall.exe" /S _?="C:\Users\…\AppData\Local\tauri-app"

# 强制清理所有痕迹
Remove-Item -LiteralPath "$env:LOCALAPPDATA\tauri-app" -Recurse -Force
Remove-Item -LiteralPath "$env:USERPROFILE\Desktop\tauri-app.lnk" -Force
Remove-Item -LiteralPath "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\tauri-app.lnk" -Force
Remove-Item -LiteralPath "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\tauri-app" -Recurse -Force

# 验证
Test-Path "$env:LOCALAPPDATA\tauri-app"   # False
Test-Path "$env:USERPROFILE\Desktop\tauri-app.lnk"   # False
Test-Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\tauri-app"   # False
```

---

**清理记录时间**：2026-07-11
**最终快捷方式数**：桌面 2 个（运行 + 安装）+ 开始菜单 1 个（NSIS 标准）