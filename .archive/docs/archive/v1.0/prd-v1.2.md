---
title: projects V1.2 PRD — 极简记录 APP（PC 端优先）
version: V1.2
date: 2026-06-14
status: active
supersedes: V1.1
target_release: 2026-09-14 (3 个月内)
---

# Mindtap · 轻念 — V1.2 PRD

> **V1.2 相对 V1.1 的核心变化**：
> 1. 平台范围从 4 端（iOS+Android+Mac+Windows）**砍到 2 端**（Mac+Windows），PC 端优先
> 2. iOS + Android 移到 **V2.0 候选**（不立即执行）
> 3. 数据策略**完全本地**（无导出/无导入/无同步）
> 4. Mac 端 Liquid Glass 用 **SwiftUI 嵌入混合架构**（Tauri WebView + NSHostingView）
> 5. V1.0 上线时间从 6 个月**激进到 3 个月**
>
> 7 大功能域 + "3 秒/1 秒/0 思考"铁律 + 6 条非范围边界**全部沿用 V1.1**。

---

## 一、项目定位

### 1.1 一句话定义
> 为 ENFP 等创意人群提供"3 秒记录、1 秒查看、0 思考成本"的极简记录工具。

### 1.2 V1.2 跨平台范围（**重大变更**）
- **V1.0（本次）**：
  - ✅ **macOS 26+** （Apple Silicon + Intel 通用）
  - ✅ **Windows 11 / Windows 12** （x64 + ARM64 通用）
  - ❌ iOS / iPadOS / Android（**移至 V2.0**）
- **V2.0（后续，不在本次范围）**：
  - iOS / iPadOS（SwiftUI 复用 V1.0 视图代码）
  - Android（技术栈待定：Tauri 移动端 或 Kotlin/Jetpack Compose）

### 1.3 范围变更理由
- **降低 V1.0 复杂度**：4 端 → 2 端，节省 ~30% 工作量
- **降低 Liquid Glass 实施风险**：Web 模拟只在 Windows 端，Mac 端用 SwiftUI 嵌入保证 95% 还原度
- **复用 Tauri 2 桌面端成熟度**：Tauri 2 在 macOS + Windows 桌面端是 1 等公民，移动端相对较新
- **保护 V2.0 投资**：V1.0 的 SwiftUI 视图代码可直接复用到 iOS 端

### 1.4 核心原则（**铁律，不可妥协**）
- **3 秒记录**：任何记录操作全程 ≤ 3 秒
- **1 秒查看**：概览页加载 ≤ 1 秒
- **0 思考成本**：操作路径符合直觉，无需教程

---

## 二、用户与场景

### 2.1 目标用户
- **主用户群**：ENFP 等创意人群（灵感爆发、易遗忘、难坚持记录）
- **场景特征**：PC 端长时间使用 + 偶尔移动端碎片记录
- **次用户群**：习惯打卡、待办管理、轻量追踪的轻量生产力用户

### 2.2 核心使用场景（V1.0 优先 PC 端）
- **工作日 9-18 点**：在 Mac/Windows 上做完整记录（项目灵感、习惯打卡、待办、消费）
- **下班后 19-23 点**：在 Mac 上做每日复盘（3 词总结）
- **周末全天**：跨场景记录，PC 端为主

### 2.3 暂不支持的场景（V2.0 才考虑）
- ❌ 通勤路上的语音快速记录（移动端缺失）
- ❌ 实时同步多端数据（V1.0 数据全本地）
- ❌ 团队共享 / 社交（不在范围）

---

## 三、技术架构

### 3.1 V1.2 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│  Tauri 2 桌面应用 (Rust 主进程)                              │
│  ├─ 窗口管理 (macOS NSWindow / Windows HWND)                │
│  ├─ 菜单栏 / Dock / 全局快捷键                              │
│  └─ IPC 桥 (Rust ↔ Web ↔ Swift)                            │
├─────────────────────────────────────────────────────────────┤
│  WebView 层 (WKWebView / WebView2)                          │
│  ├─ React 18 + TypeScript + Vite                            │
│  ├─ 80% 通用 UI (列表、表单、设置、内容)                     │
│  └─ CSS Liquid Glass (Windows 端主用 + Mac 端兜底)          │
├─────────────────────────────────────────────────────────────┤
│  SwiftUI 嵌入层 (仅 macOS)                                  │
│  ├─ NSHostingView 容器                                      │
│  ├─ 复杂 Liquid Glass 区:                                    │
│  │    ├─ 侧栏 (sidebar) - 100% 玻璃                          │
│  │    ├─ 模态对话框 (modal) - 100% 玻璃                       │
│  │    ├─ 工具栏 (toolbar) - 100% 玻璃                         │
│  │    └─ 卡片/列表项 (card) - 100% 玻璃                       │
│  └─ SwiftUI ↔ React IPC (Tauri command/event)               │
├─────────────────────────────────────────────────────────────┤
│  数据层 (Rust + SQLite)                                     │
│  └─ 本地 SQLite (~/Library/Application Support/projects/)   │
│     AppData/Roaming/projects/ (Windows)                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 技术栈选型

| 层级 | 技术 | 理由 |
|---|---|---|
| 应用壳 | **Tauri 2.x** | 单代码库覆盖 Mac + Windows；bundle 5-15MB；冷启动 < 500ms |
| 前端框架 | **React 18 + TypeScript** | 组件生态最成熟；类型推断最佳 |
| 构建工具 | **Vite** | 启动 < 1s；HMR < 100ms |
| 状态管理 | **Zustand** | 0.3KB；无 boilerplate；并发模式兼容 |
| 路由 | **React Router v6** | 仅 2 tab + 3 子页面，路由简单 |
| 持久层 | **SQLite**（单表 + JSON payload） | 跨平台一致；查询快；单文件易备份 |
| Mac 增强 | **SwiftUI 嵌入**（NSHostingView） | Liquid Glass 100% 原生；glassEffect API |
| 语音 | **平台原生**（暂不实现） | 推迟到 V2.0 移动端再做 |

### 3.3 平台差异化

| 维度 | macOS 26+ | Windows 11/12 |
|---|---|---|
| Liquid Glass 还原度 | **95%**（SwiftUI 嵌入 + 边缘 Web 兜底）| **80%**（backdrop-filter + CSS 渐变） |
| 玻璃方案 | NSVisualEffectView + SwiftUI `glassEffect` | CSS `backdrop-filter: blur(20px)` |
| 窗口装饰 | macOS 红绿灯按钮 | Windows 标准标题栏 |
| 系统集成 | Dock + 菜单栏 + Spotlight | 系统托盘 + 任务栏 |
| 性能 | 原生 + WebView | WebView2 |

### 3.4 数据存储

#### 3.4.1 存储策略（**V1.2 重大变更**）
- ✅ **本地 SQLite 单一文件**
- ❌ **无导出**（用户选择 A. 不做）
- ❌ **无导入**
- ❌ **无云同步**
- ❌ **无 iCloud/OneDrive 监听**
- ❌ **多设备迁移**（通过手动拷贝 SQLite 文件，仅极客用户）

#### 3.4.2 Schema 设计
```sql
CREATE TABLE records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,           -- 'mood' | 'sleep' | 'water' | 'med' | 'idea' | 'todo' | 'habit' | 'spend' | 'review'
  payload JSON NOT NULL,         -- 类型相关字段
  created_at INTEGER NOT NULL,   -- Unix timestamp (ms)
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_records_created_at ON records(created_at);
CREATE INDEX idx_records_type ON records(type);
```

#### 3.4.3 数据位置
- **macOS**: `~/Library/Application Support/com.projects.app/projects.db`
- **Windows**: `%APPDATA%\com.projects.app\projects.db`

---

## 四、7 大功能域（**沿用 V1.1**）

### 4.1 基础存储
- 数据**仅本地存储**，无云端同步、无云端备份

### 4.2 全局入口
1. 首页顶部固定「+快速记录」按钮 → 点击弹出分类弹窗，无页面跳转
2. 底部导航仅「记录」「概览」两栏
3. **V1.2 增量**：浮动 + 可任意拖动（桌面端）

### 4.3 高频状态一键打卡（纯点击/滑动，无需文字输入）
1. **情绪/能量**：1-10 分滑动选择，默认 5 分，操作后自动保存
2. **作息**：「入睡」「起床」双按钮，点击自动记录当前时间
3. **饮水**：「+1 杯 / -1 杯」计数器，单杯默认 200ml
4. **服药/保健品**：「已服用 / 未服用」一键勾选，最多添加 2 个常用品类

### 4.4 灵感捕捉 & 核心待办
1. **创意/梦境/金句**：单输入框，**支持关键词输入**（V1.2 暂不做语音转文字，移至 V2.0 移动端）
2. **待办闪念（核心 Todo）**
   - 字段：仅**事项内容 + 截止时间**
   - 时间选项：今天 / 明天 / 自定义
   - **完成状态一键标记**
   - 无优先级、无标签、无复杂分组

### 4.5 轻量化追踪
1. **习惯打卡**：最多添加 3 个自定义习惯
2. **消费速记**：金额 + 固定分类（必要 / 非必要 / 意外）

### 4.6 查看与复盘
1. **概览页**：仅展示当日所有记录，按时间倒序排列
2. **每日复盘**：底部固定输入框，限 3 个关键词

### 4.7 简易设置
1. 支持修改现有标签名称
2. 最多设置 2 组定时提醒

---

## 五、非功能性需求

| 指标 | 目标 | 备注 |
|---|---|---|
| 冷启动 | ≤ 2 秒 | Tauri 2 + 系统 WebView，理论 < 500ms |
| 快速记录弹窗响应 | ≤ 0.3 秒 | WebView 内 React 渲染 |
| 概览加载 | ≤ 1 秒 | SQLite 单表 + 索引 |
| 离线可用 | 100% | 无任何网络请求 |
| 单条记录体积 | ≤ 1KB | JSON payload 设计 |
| bundle 体积 | 5-15MB | Tauri 2 典型 |
| 内存占用 | < 150MB | WebView 共享 |

---

## 六、验收标准

- 5 类核心记录操作随机抽测 < 3 秒
- 概览页 1 秒内完整展示当日记录
- 全程无需用户思考操作路径
- macOS 26 端 Liquid Glass 视觉还原度 ≥ 95%
- Windows 11 端 Liquid Glass 视觉还原度 ≥ 80%

---

## 七、非范围（**严格边界**）

> 来自 V1.1 PRD §6，**V1.2 完全沿用**，新增 2 条（来自 V1.2 范围收缩）

1. ❌ 批量标签管理、多级分类、自定义字段
2. ❌ 数据图表、多维统计、趋势分析、对比报表
3. ❌ 社交分享、社区、好友互动
4. ❌ 复杂筛选、全文检索、多日期回溯
5. ❌ 新手引导、教程、成就、打卡激励
6. ❌ 多设备实时同步、跨端联动
7. ❌ **数据导出、导入、跨设备迁移**（V1.2 新增）
8. ❌ **iOS / iPadOS / Android 移动端**（V1.2 新增，移至 V2.0）

---

## 八、V1.2 决策清单（**新增**）

| # | 决策 | 理由 |
|---|---|---|
| D21 | 平台范围：V1.0 = Mac + Windows（PC 端优先）| 降低 V1.0 复杂度；Tauri 桌面端成熟 |
| D22 | 平台范围：V2.0 = iOS + Android（移动端补齐）| V1.0 完成后启动 |
| D23 | 数据策略：全本地 SQLite，无导出/无导入/无同步 | 用户决策 A. 不做；符合"无云"原则 |
| D24 | Mac 端 Liquid Glass：SwiftUI 嵌入（混合架构） | 用户决策 C. SwiftUI 嵌入；Mac 95% 还原 |
| D25 | V1.0 上线时间：3 个月内 | 用户决策 PC 端优先后允许激进排期 |
| D26 | iOS 端技术：SwiftUI（V2.0 沿用 V1.0 SwiftUI 视图） | Apple 平台统一；glassEffect API 跨端一致 |
| D27 | Android 端技术：V2.0 决策（候选：Tauri 移动端 / Kotlin） | 暂不决定 |

---

## 九、V1.2 风险登记

| # | 风险 | 等级 | 缓解 |
|---|---|---|---|
| R1 | Tauri 2 + SwiftUI 嵌入无官方示例 | 🔴 高 | Phase 1 必须做 spike 验证；fallback 到 NSVisualEffectView（90% 还原）|
| R2 | 3 个月时间表激进 | 🟡 中 | 优先做 P0 功能；Liquid Glass 先保 70% 再迭代到 95% |
| R3 | SwiftUI ↔ React IPC 复杂 | 🟡 中 | 限制 SwiftUI 嵌入区数量（仅 4 个核心区）|
| R4 | macOS 26 Liquid Glass API 稳定性 | 🟡 中 | 苹果 Beta API 在 macOS 26 正式版（2025 秋）后稳定 |
| R5 | Windows 端 SwiftUI 不可用 | 🟢 低 | 走 Web 模拟（80% 还原度已够用）|

---

## 十、V1.2 → V2.0 演进路径

```
V1.0 (本次, 3 个月内)
├─ Mac + Windows PC 端
├─ Tauri 2 + SwiftUI 混合
├─ 全本地，无导出
└─ SwiftUI 视图代码 100% 复用

V2.0 (后续, 暂不规划)
├─ iOS 端: SwiftUI (复用 V1.0 视图)
├─ Android 端: Tauri 移动端 or Kotlin (D27 决策)
├─ 语音转文字: iOS Speech + Android SpeechRecognizer
├─ 数据互通: 暂不要求（V1.0 数据全本地）
└─ V1.0 SwiftUI 投资 100% 复用 → 实施成本最低
```

---

## 十一、变更历史

| 版本 | 日期 | 变化 | 决策 |
|---|---|---|---|
| V1.0 | 2026-06-14 上午 | 8 章 PRD 初版 | — |
| V1.1 | 2026-06-14 下午 | 删账号/删云端/加语音/待办加强 | D13-D17 |
| **V1.2** | **2026-06-14 晚** | **PC 端优先 + 混合架构 + 无导出** | **D21-D25** |

---

*本文件是 projects V1.2 的产品需求基线。任何功能/设计/工程变更必须先修订本文件，再进入实现。*
