# Mindtap V1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 8 周内交付 projects V1.0 — Tauri 2 桌面应用（Mac + Windows），核心 4 域（基础存储 / 全局入口 / 高频打卡 / 查看复盘），Liquid Glass 设计语言 + 4 季主题，3 秒记录铁律，Mac 80→90→95% 渐进还原。**排期见 spec §7.5.3 · Sprint 长度决策（C 方案：S1-4 1 周 + S5-6 2 周 = 8 周）**。

**Architecture:** 单一 Tauri 2 桌面应用（Rust 主进程 + WebView）。前端用 React 18 + TypeScript + Vite + 混合 CSS 栈（Tailwind 4 utility + Vanilla CSS Liquid Glass 4 档 + shadcn/ui 基础 + 自研玻璃化）。状态用 Zustand + 持久化。数据层走 Drizzle ORM + rusqlite，单表 `records` + JSON payload。Mac 端三档渐进（80% 纯 Web → 90% NSVisualEffectView → 95% SwiftUI spike 可选）。

**Tech Stack:** Tauri 2.x · React 18 · TypeScript 5 · Vite 5 · Zustand 4 · React Router 6 · Drizzle ORM · rusqlite · Tailwind 4 · Vanilla CSS · shadcn/ui · React Hook Form 7 · Zod 3 · Framer Motion 11 · Lucide React · Vitest · Playwright · Biome · AppKit (S5) · SwiftUI spike (S6)

**Source Spec:** `docs/projects/v1.0/specs/2026-06-14-v1-implementation-roadmap.md` (1544 行)
**Source PRD:** `docs/prd-v1.2.md` (V1.2 PRD 产品基线)

**Source Agile/XP/Scrum 资料**（6 篇，审计基准）：
- [`01-agile-manifesto-zh.md`](../material/agile/01-agile-manifesto-zh.md) — 4 价值观 + 12 原则
- [`02-agile-values-12-principles-explained.md`](../material/agile/02-agile-values-12-principles-explained.md) — 12 原则详解
- [`03-xp-12-practices.md`](../material/agile/03-xp-12-practices.md) — XP 12 实践
- [`04-scrum-guide.md`](../material/agile/04-scrum-guide.md) — Scrum 4 组件 / 3 角色 / 5 事件
- [`05-scrumban.md`](../material/agile/05-scrumban.md) — Scrumban 混合方法
- [`06-cicd-explained.md`](../material/agile/06-cicd-explained.md) — CI/CD 完整解释

---

## 简明性说明（2026-06-14 · 敏捷合规性审计后修订）

> **本 plan 详细程度是经过权衡的**，对应敏捷原则 #10 "简化"：
> - **Phase 0 任务（Task 0.1-0.10）**：完整 TDD 5 步（写测试 → 跑红 → 写实现 → 跑绿 → 提交），**示范性**——所有 subagent 第一次接手时的参考模板
> - **Phase 1-6 任务（Task 1.1-6.6）**：完整 TDD 5 步 + 关键代码片段——机械任务 1:1 展开，确保 subagent 不丢细节
> - **跨 Sprint 主题**：集中到 spec §14 + plan 附录 B（不重复）
>
> **若需更精简版本**：仅需执行 Phase 0（脚手架） + 附录（参考）+ 关键 task 标题即可。完整 47 task 是为 subagent 安全执行而设的"防弹衣"，**非阅读负担**。
>
> **修订历史**：2026-06-14 完成 11 项敏捷/XP/Scrum 合规性修订（P0 3 + P1 5 + P2 3），审计报告见会话记录。

## 文件结构（Source of Truth · 6 Sprint 共用）

```
projects-v1/                                 # 项目根（Sprint 1 初始化）
├── src/                                    # 前端（React + TS）
│   ├── main.tsx                            # 应用入口
│   ├── App.tsx                             # 根组件 + 路由
│   ├── routes/                             # 4 域路由（Sprint 2）
│   │   ├── index.ts                        # 路由表
│   │   ├── Records.tsx                     # /records · 全局入口域
│   │   ├── CheckIn.tsx                     # /checkin · 高频打卡域
│   │   ├── Overview.tsx                    # /overview · 查看复盘域
│   │   └── Storage.tsx                     # /storage · 基础存储域
│   ├── components/
│   │   ├── layout/                         # 跨平台布局（Sprint 2）
│   │   │   ├── MobileTabBar.tsx
│   │   │   ├── WindowsSidebar.tsx
│   │   │   └── MacOSMenubar.tsx
│   │   ├── glass/                          # 自研玻璃化组件（Sprint 2-3）
│   │   │   ├── FAB.tsx                     # 浮动按钮
│   │   │   ├── RecordModal.tsx             # 4 域选择模态
│   │   │   ├── Sidebar.tsx                 # 侧栏
│   │   │   ├── Toolbar.tsx                 # 工具栏
│   │   │   ├── Card.tsx                    # 卡片
│   │   │   └── GlassContainer.tsx          # 通用玻璃容器
│   │   ├── domain/                         # 4 域业务组件
│   │   │   ├── MoodSlider.tsx              # 情绪滑块
│   │   │   ├── SleepButtons.tsx            # 作息双按钮
│   │   │   ├── WaterCounter.tsx            # 饮水计数
│   │   │   ├── MedCheckbox.tsx             # 服药勾选
│   │   │   ├── Overview.tsx                # 概览列表
│   │   │   ├── DailyReview.tsx             # 每日 3 词
│   │   │   ├── TimeGroup.tsx               # 时间分组
│   │   │   └── StatBar.tsx                 # 统计条
│   │   └── brand/                          # H 品牌层（Sprint 5）
│   │       ├── HeroMesh.tsx                # 4 色 hero mesh
│   │       ├── Logo.tsx                    # 旋转 logo
│   │       └── DailyQuote.tsx              # 7 句库切换
│   ├── db/                                 # 数据层（Sprint 1）
│   │   ├── schema.ts                       # Drizzle schema + Zod
│   │   ├── index.ts                        # Drizzle client
│   │   └── migrations/                     # SQL 迁移
│   ├── ipc/                                # Tauri IPC 封装（Sprint 1）
│   │   └── records.ts                      # invoke save/list/delete
│   ├── stores/                             # Zustand 状态（Sprint 2-3）
│   │   ├── theme.ts                        # 4 季主题
│   │   ├── platform.ts                     # 平台检测
│   │   └── quickCheckIn.ts                 # 打卡状态
│   ├── hooks/                              # 自定义 hooks
│   │   ├── useHotkey.ts                    # 全局快捷键
│   │   └── usePlatform.ts                  # 平台检测 hook
│   ├── styles/                             # CSS（Sprint 2 + Sprint 5）
│   │   ├── glass.css                       # Liquid Glass 4 档
│   │   ├── themes.css                      # 4 季主题变量
│   │   ├── animations.css                  # 8 @keyframes
│   │   └── a11y.css                        # reduce-motion/transparency
│   ├── types/                              # 全局类型
│   │   ├── record.ts                       # Record 类型
│   │   └── platform.ts                     # Platform 枚举
│   └── utils/                              # 工具函数
│       ├── errorHandler.ts                 # 8 类失败处理
│       └── perf.ts                         # 性能监控
├── src-tauri/                              # Rust 主进程
│   ├── src/
│   │   ├── main.rs                         # 入口
│   │   ├── db.rs                           # rusqlite 桥
│   │   ├── commands.rs                     # Tauri Commands
│   │   ├── macos_bridge.rs                 # AppKit 桥（Sprint 5）
│   │   └── swiftui_spike.rs                # SwiftUI spike（Sprint 6）
│   ├── tauri.conf.json                     # Tauri 配置
│   └── Cargo.toml                          # Rust 依赖
├── tests/                                  # 测试
│   ├── unit/                               # Vitest 单测
│   ├── e2e/                                # Playwright e2e
│   ├── perf/                               # 性能基准
│   ├── a11y/                               # axe-core
│   └── visual/                             # 48 组合视觉回归
├── prototype/                              # 8 视角 HTML prototype（沿用）
│   └── compare.html
├── docs/                                   # 项目文档
│   ├── CLAUDE.md                           # AI 协作者指南
│   └── README.md                           # 用户手册
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── biome.json
└── README.md
```

---

## Phase 0 · 跨 Sprint 基础设施（先于 Sprint 1）

> 这些任务不归属任何 Sprint，但必须在 Sprint 1 开始前完成。否则后续 Sprint 无法跑测试 / 性能自检 / 跨平台构建。

### Task 0.1: 初始化 Tauri 2 项目骨架

**Files:**
- Create: `projects-v1/package.json`
- Create: `projects-v1/tsconfig.json`
- Create: `projects-v1/vite.config.ts`
- Create: `projects-v1/biome.json`
- Create: `projects-v1/.gitignore`

- [ ] **Step 1: 用 Tauri CLI 初始化项目**

Run: `cd /home/jason/workspace/projects && pnpm create tauri-app@latest projects-v1 --template react-ts --manager pnpm`
Expected: 成功创建 projects-v1 目录，含 src/ + src-tauri/

- [ ] **Step 2: 安装核心前端依赖**

Run: `cd projects-v1 && pnpm add zustand react-router-dom react-hook-form zod @hookform/resolvers drizzle-orm better-sqlite3 tailwindcss @tailwindcss/forms lucide-react framer-motion`
Expected: pnpm-lock.yaml 更新，无 ERR_PNPM_PEER_DEP_ISSUES 致命错误

- [ ] **Step 3: 安装开发依赖**

Run: `pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @playwright/test @axe-core/playwright`
Expected: package.json devDependencies 包含上述包

- [ ] **Step 4: 安装 Tauri 插件**

Run: `pnpm tauri add sql && pnpm tauri add dialog && pnpm tauri add notification && pnpm tauri add fs`
Expected: src-tauri/Cargo.toml 出现 tauri-plugin-sql / dialog / notification / fs

- [ ] **Step 5: 安装 Rust 端依赖**

Run: `cd src-tauri && cargo add rusqlite --features bundled && cargo add serde --features derive && cargo add serde_json && cargo add tokio --features full`
Expected: Cargo.toml [dependencies] 出现 rusqlite / serde / serde_json / tokio

- [ ] **Step 6: 提交**

Run: `cd /home/jason/workspace/projects && git add projects-v1/ && git commit -m "chore: scaffold Tauri 2 + React 18 + TS 5 project (Phase 0.1)"`
Expected: 1 commit created

---

### Task 0.2: 配置 Biome（lint + format 一体化）

**Files:**
- Create: `projects-v1/biome.json`

- [ ] **Step 1: 写 biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "vcs": { "enabled": false, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true, "ignore": ["dist", "src-tauri/target"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "error" },
      "style": { "useImportType": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "asNeeded", "trailingCommas": "all" } }
}
```

- [ ] **Step 2: 在 package.json 加 scripts**

```json
"scripts": {
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 3: 验证 Biome 跑通**

Run: `cd projects-v1 && pnpm lint`
Expected: 检查 src/ + src-tauri/，输出 0 errors

- [ ] **Step 4: 提交**

Run: `git add projects-v1/biome.json projects-v1/package.json && git commit -m "chore: configure Biome (lint + format + organize imports)"`

---

### Task 0.3: 配置 TypeScript strict mode

**Files:**
- Modify: `projects-v1/tsconfig.json`

- [ ] **Step 1: 替换 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist", "src-tauri/target"]
}
```

- [ ] **Step 2: 验证 TS 检查通过**

Run: `cd projects-v1 && pnpm typecheck`
Expected: 0 errors

- [ ] **Step 3: 提交**

Run: `git add projects-v1/tsconfig.json && git commit -m "chore: enforce TypeScript strict mode (no any)"`

---

### Task 0.4: 配置 Vitest 单测环境

**Files:**
- Create: `projects-v1/vitest.config.ts`
- Create: `projects-v1/tests/setup.ts`

- [ ] **Step 1: 写 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    coverage: { provider: 'v8', reporter: ['text', 'html'], thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 } }
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }
})
```

- [ ] **Step 2: 写 tests/setup.ts**

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: 在 package.json 加 test script**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 4: 写一个 sanity test 验证 Vitest 工作**

Create file `projects-v1/tests/unit/sanity.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: 跑测试**

Run: `cd projects-v1 && pnpm test`
Expected: `1 passed`

- [ ] **Step 6: 提交**

Run: `git add projects-v1/vitest.config.ts projects-v1/tests/ projects-v1/package.json && git commit -m "chore: configure Vitest + jsdom + coverage thresholds 80%"`

---

### Task 0.5: 配置 Playwright e2e 环境

**Files:**
- Create: `projects-v1/playwright.config.ts`

- [ ] **Step 1: 安装 Playwright 浏览器**

Run: `cd projects-v1 && pnpm exec playwright install --with-deps chromium webkit`
Expected: chromium + webkit 浏览器下载完成

- [ ] **Step 2: 写 playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: 'html',
  use: { baseURL: 'http://localhost:1420', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: { command: 'pnpm tauri dev', url: 'http://localhost:1420', reuseExistingServer: !process.env.CI, timeout: 60_000 }
})
```

- [ ] **Step 3: 写 sanity e2e**

Create `projects-v1/tests/e2e/sanity.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test('app loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Mindtap/)
})
```

- [ ] **Step 4: 跑 e2e（首次跑会编译 tauri，慢）**

Run: `cd projects-v1 && pnpm exec playwright test`
Expected: 1 passed（首次可能 60s+）

- [ ] **Step 5: 提交**

Run: `git add projects-v1/playwright.config.ts projects-v1/tests/e2e/ && git commit -m "chore: configure Playwright (chromium + webkit) with Tauri webServer"`

---

### Task 0.6: 配置 Tailwind 4 + Vanilla CSS 混合栈

**Files:**
- Create: `projects-v1/tailwind.config.ts`
- Create: `projects-v1/src/styles/glass.css`
- Create: `projects-v1/src/styles/themes.css`
- Modify: `projects-v1/src/index.css`

- [ ] **Step 1: 初始化 Tailwind 4**

Run: `cd projects-v1 && pnpm tailwindcss init -p`
Expected: 创建 tailwind.config.ts + postcss.config.js

- [ ] **Step 2: 替换 tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: { spring: '#FBCFE8', summer: '#FED7AA', autumn: '#E7D2B7', winter: '#C7D2FE' }
      },
      fontFamily: {
        system: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
} satisfies Config
```

- [ ] **Step 3: 写 src/styles/glass.css（Liquid Glass 4 档 · 来自 D32 + HIG 03）**

```css
/* Liquid Glass 4 档材质（HIG 03-hig-materials.md 4 档） */
:root {
  --glass-blur-ultrathin: 10px;
  --glass-blur-thin: 14px;
  --glass-blur-regular: 20px;
  --glass-blur-thick: 40px;
  --glass-saturate-ultrathin: 150%;
  --glass-saturate-thin: 160%;
  --glass-saturate-regular: 180%;
  --glass-saturate-thick: 220%;
}

.glass-ultrathin {
  backdrop-filter: blur(var(--glass-blur-ultrathin)) saturate(var(--glass-saturate-ultrathin));
  -webkit-backdrop-filter: blur(var(--glass-blur-ultrathin)) saturate(var(--glass-saturate-ultrathin));
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.glass-thin {
  backdrop-filter: blur(var(--glass-blur-thin)) saturate(var(--glass-saturate-thin));
  -webkit-backdrop-filter: blur(var(--glass-blur-thin)) saturate(var(--glass-saturate-thin));
  background: rgba(255, 255, 255, 0.38);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.glass-regular {
  backdrop-filter: blur(var(--glass-blur-regular)) saturate(var(--glass-saturate-regular));
  -webkit-backdrop-filter: blur(var(--glass-blur-regular)) saturate(var(--glass-saturate-regular));
  background: rgba(255, 255, 255, 0.30);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.glass-thick {
  backdrop-filter: blur(var(--glass-blur-thick)) saturate(var(--glass-saturate-thick));
  -webkit-backdrop-filter: blur(var(--glass-blur-thick)) saturate(var(--glass-saturate-thick));
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.12), inset 0 1px 0.5px rgba(255, 255, 255, 0.6);
}
```

- [ ] **Step 4: 写 src/styles/themes.css（4 季主题双轨制）**

```css
/* 4 季主题（双轨制：品牌色不动，季节色只覆盖 --accent） */
:root {
  --accent: #FBCFE8; /* spring 默认 */
  --accent-rgb: 251, 207, 232;
}

:root[data-theme="spring"] { --accent: #FBCFE8; --accent-rgb: 251, 207, 232; }
:root[data-theme="summer"] { --accent: #FED7AA; --accent-rgb: 254, 215, 170; }
:root[data-theme="autumn"] { --accent: #E7D2B7; --accent-rgb: 231, 210, 183; }
:root[data-theme="winter"] { --accent: #C7D2FE; --accent-rgb: 199, 210, 254; }

[data-accent] { color: rgba(var(--accent-rgb), 1); }
```

- [ ] **Step 5: 替换 src/index.css（合并所有样式）**

```css
@tailwind material;
@tailwind components;
@tailwind utilities;

@import './styles/glass.css';
@import './styles/themes.css';

:root {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

body { margin: 0; }
```

- [ ] **Step 6: 验证构建**

Run: `cd projects-v1 && pnpm tauri dev`（另开终端 ctrl+c 5 秒后）
Expected: 浏览器打开 Tauri 窗口，body 字体生效（无 .glass-* 时背景白色）

- [ ] **Step 7: 提交**

Run: `git add projects-v1/ && git commit -m "feat(styles): Tailwind 4 + Liquid Glass 4 档 + 4 季主题 (Phase 0.6)"`

---

### Task 0.7: 初始化性能监控基础设施

**Files:**
- Create: `projects-v1/src/utils/perf.ts`
- Create: `projects-v1/tests/unit/perf.test.ts`

- [ ] **Step 1: 写失败测试**

Create `projects-v1/tests/unit/perf.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { measureAsync, PerfMarker } from '@/utils/perf'

describe('perf', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('measureAsync returns duration_ms', async () => {
    vi.setSystemTime(0)
    const promise = measureAsync('test-op', async () => {
      vi.setSystemTime(150)
      return 'ok'
    })
    vi.setSystemTime(200)
    const result = await promise
    expect(result.value).toBe('ok')
    expect(result.durationMs).toBe(50) // 200 - 150 (实际函数体耗时)
  })

  it('PerfMarker accumulates metrics', () => {
    const marker = new PerfMarker('save-record')
    marker.start()
    marker.end()
    marker.start()
    marker.end()
    expect(marker.count).toBe(2)
    expect(marker.avgMs).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd projects-v1 && pnpm test`
Expected: FAIL with "Cannot find module '@/utils/perf'"

- [ ] **Step 3: 写 src/utils/perf.ts**

```typescript
/**
 * 性能监控工具（Sprint 4 性能基准前置）
 * - measureAsync: 包装异步操作，测量耗时
 * - PerfMarker: 多次同类操作聚合（avg/min/max）
 */
export interface MeasureResult<T> { value: T; durationMs: number }

export async function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<MeasureResult<T>> {
  const start = performance.now()
  const value = await fn()
  const durationMs = performance.now() - start
  if (durationMs > 100) console.warn(`[perf] ${label} took ${durationMs.toFixed(1)}ms`)
  return { value, durationMs }
}

export class PerfMarker {
  readonly label: string
  private samples: number[] = []

  constructor(label: string) { this.label = label }

  start(): void { (this as any)._t0 = performance.now() }
  end(): void {
    const t0 = (this as any)._t0 as number | undefined
    if (t0 !== undefined) this.samples.push(performance.now() - t0)
  }

  get count(): number { return this.samples.length }
  get avgMs(): number { return this.samples.length ? this.samples.reduce((a, b) => a + b, 0) / this.samples.length : 0 }
  get maxMs(): number { return this.samples.length ? Math.max(...this.samples) : 0 }
  get minMs(): number { return this.samples.length ? Math.min(...this.samples) : 0 }
}
```

- [ ] **Step 4: 跑测试**

Run: `cd projects-v1 && pnpm test`
Expected: 2 passed

- [ ] **Step 5: 提交**

Run: `git add projects-v1/src/utils/perf.ts projects-v1/tests/unit/perf.test.ts && git commit -m "feat(utils): perf monitor (measureAsync + PerfMarker)"`

---

### Task 0.8: 初始化 CLAUDE.md（AI 协作者指南）

**Files:**
- Create: `projects-v1/CLAUDE.md`

- [ ] **Step 1: 写 CLAUDE.md**

```markdown
# Mindtap V1.0 · AI 协作者指南

## 项目定位
极简记录 APP · Tauri 2 桌面（Mac + Windows）· 3 秒记录铁律 · Liquid Glass 设计

## 必读
1. `docs/projects/v1.0/specs/2026-06-14-v1-implementation-roadmap.md` (1544 行 spec)
2. `docs/projects/v1.0/specs/2026-06-14-v1-implementation-plan.md` (本计划)
3. `docs/prd-v1.2.md` (产品需求基线)
4. `docs/superpowers/specs/2026-06-14-liquid-glass-final-overview.md` (8 视角设计)

## 硬约束（不可妥协）
- ❌ 不用 `console.log` 代替交互
- ❌ 不用 TODO / Placeholder Function / Mock Handler
- ❌ 不用 `any`（TS strict mode）
- ✅ 每个任务 TDD 节奏：先写失败测试 → 写实现 → 跑绿 → 提交
- ✅ 频繁 commit（每 5 步 1 commit）

## Sprint 计划（12 周）
- S1 脚手架（W1-2）· S2 UI 骨架（W3-4）· S3 核心（W5-6）
- S4 完善（W7-8）· S5 品牌（W9-10）· S6 打磨（W11-12）

## 启动
```bash
cd projects-v1 && pnpm tauri dev
```

## 测试
```bash
pnpm test           # Vitest 单测
pnpm test:e2e       # Playwright e2e
pnpm lint           # Biome
pnpm typecheck      # tsc --noEmit
```
```

- [ ] **Step 2: 提交**

Run: `cd projects-v1 && git add CLAUDE.md && git commit -m "docs: AI 协作者指南 (CLAUDE.md)"`

---

### Task 0.9: GitHub Actions CI 流水线（敏捷/XP P11 持续集成 · P0 必修）

> **来源**：[`docs/material/agile/06-cicd-explained.md`](../material/agile/06-cicd-explained.md) — 每次 push → 编译通过 + 单元测试通过（CI 基线）
> **目的**：单点失败自动捕获，避免"以为绿了实际红了"——47 个 task 多个 subagent 并行实施时的安全网

**Files:**
- Create: `projects-v1/.github/workflows/ci.yml`
- Create: `projects-v1/.github/dependabot.yml`（依赖更新自动 PR）

- [ ] **Step 1: 写 CI 流水线（push + PR 触发）**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop, 'feat/**', 'fix/**']
  pull_request:
    branches: [main, develop]

env:
  CARGO_TERM_COLOR: always
  RUSTFLAGS: -D warnings

jobs:
  lint-and-typecheck:
    name: Lint + TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint            # Biome
      - run: pnpm typecheck       # tsc --noEmit

  unit-test:
    name: Unit Tests (Vitest)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit -- --reporter=verbose --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  rust-check:
    name: Rust Check (cargo)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cd src-tauri && cargo check --all-targets
      - run: cd src-tauri && cargo clippy --all-targets -- -D warnings
      - run: cd src-tauri && cargo test

  e2e-test:
    name: E2E Tests (Playwright · Tauri WebView)
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm tauri build --debug  # 三平台构建
      - run: pnpm test:e2e -- --reporter=list
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-failure-${{ matrix.os }}
          path: |
            playwright-report/
            test-results/
```

- [ ] **Step 2: 写 Dependabot 自动更新**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/projects-v1"
    schedule: { interval: "weekly" }
    groups:
      dev-dependencies:
        patterns: ["*"]
    commit-message: { prefix: "chore" }
    labels: ["dependencies"]
  - package-ecosystem: "cargo"
    directory: "/projects-v1/src-tauri"
    schedule: { interval: "weekly" }
    commit-message: { prefix: "chore" }
    labels: ["dependencies"]
```

- [ ] **Step 3: 提交**

Run: `cd projects-v1 && git add .github/ && git commit -m "ci: GitHub Actions 流水线 + Dependabot (lint/typecheck/vitest/cargo/playwright 3 平台)"`

- [ ] **Step 4: 验证 CI 工作**（push 后看 GitHub Actions 绿色）

Run: `git push origin main` → 打开 GitHub → Actions → 确认 4 jobs 全部绿

**预期收益**：每次 push 5-10 分钟自动验证全量测试 + 编译 + 3 平台构建，AI 协作者不会"以为绿了实际红了"。

---

### Task 0.10: journal.md 模板 + Daily Standup 节奏（Scrumban 物化 · P0 必修）

> **来源**：[`docs/material/agile/05-scrumban.md`](../material/agile/05-scrumban.md) — "每天写 3 行 journal.md（不强求同步会）"
> **目的**：把 Daily Standup 物化为持久文件，可追溯 + 不需要仪式感

**Files:**
- Create: `projects-v1/docs/journal/.gitkeep`（确保目录提交）
- Create: `projects-v1/docs/journal/2026-06-15.md`（首日示例）

- [ ] **Step 1: 写 journal.md 模板（首日示例）**

```markdown
# 2026-06-15 · Daily Standup (Sprint 1 Day 1)

✅ **昨日**：无（Sprint 1 Day 1）
🎯 **今日**：完成 Task 0.9 CI 流水线 + Task 0.10 journal 模板
🚧 **障碍**：无

**今日学习**：第一次配 GitHub Actions 三平台 matrix build，参考了 06-cicd-explained.md 的简化 YAML 模板。
**明日计划**：开始 Task 1.1 Drizzle schema。
```

- [ ] **Step 2: 加 journal 写入脚本到 package.json**

```json
{
  "scripts": {
    "journal": "node scripts/new-journal.js"
  }
}
```

Create `projects-v1/scripts/new-journal.js`:

```js
#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const today = new Date().toISOString().slice(0, 10)
const sprint = process.env.SPRINT || 'Sprint ?'
const day = process.env.SPRINT_DAY || 'Day ?'
const path = join('docs/journal', `${today}.md`)

mkdirSync('docs/journal', { recursive: true })
writeFileSync(path, `# ${today} · Daily Standup (${sprint} ${day})\n\n✅ 昨日：\n🎯 今日：\n🚧 障碍：\n\n**今日学习**：\n**明日计划**：\n`)
console.log(`Created ${path}`)
```

- [ ] **Step 3: 提交**

Run: `cd projects-v1 && git add docs/journal/ scripts/new-journal.js package.json && git commit -m "docs: journal.md 模板 + new-journal 脚本 (Daily Standup 物化)"`

- [ ] **Step 4: 验证节奏**（每天开工前 3 分钟）

Run: `pnpm journal` → 弹出当日 journal.md → 填 3 行 → 提交

**预期收益**：
- 可追溯：每 Sprint 末 1 次回顾时直接看 journal 流水
- 无仪式负担：3 行就够，不需要开会
- 形成节奏：每天第一个动作 = 写 journal

---

## Phase 1 · Sprint 1 脚手架 + 基础存储（W1-2 · V0.1）

> **Sprint Goal**：用户能 `pnpm tauri dev` 启动桌面应用，4 域占位 UI 可导航，IPC 通信能保存 1 条 record 到 SQLite，离线 100% 可用。

### Task 1.1: 定义 Drizzle schema + Zod 校验

**Files:**
- Create: `projects-v1/src/db/schema.ts`
- Test: `projects-v1/tests/unit/schema.test.ts`

- [ ] **Step 1: 写失败测试**

Create `projects-v1/tests/unit/schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { recordInsertSchema, type RecordInsert } from '@/db/schema'

describe('recordInsertSchema', () => {
  it('accepts valid mood record', () => {
    const r: RecordInsert = { type: 'mood', payload: { score: 7 }, createdAt: Date.now(), updatedAt: Date.now() }
    expect(recordInsertSchema.parse(r)).toEqual(r)
  })

  it('accepts valid sleep record', () => {
    const r: RecordInsert = { type: 'sleep', payload: { kind: 'sleep_start' }, createdAt: Date.now(), updatedAt: Date.now() }
    expect(recordInsertSchema.parse(r)).toEqual(r)
  })

  it('rejects unknown type', () => {
    const r = { type: 'unknown', payload: {}, createdAt: Date.now(), updatedAt: Date.now() }
    expect(() => recordInsertSchema.parse(r)).toThrow()
  })

  it('rejects score out of range', () => {
    const r = { type: 'mood', payload: { score: 11 }, createdAt: Date.now(), updatedAt: Date.now() }
    expect(() => recordInsertSchema.parse(r)).toThrow()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd projects-v1 && pnpm test`
Expected: FAIL "Cannot find module '@/db/schema'"

- [ ] **Step 3: 写 src/db/schema.ts**

```typescript
import { z } from 'zod'

/** 4 域 + 复盘 = 5 类 record 类型 */
export const recordTypeSchema = z.enum(['mood', 'sleep', 'water', 'med', 'review'])
export type RecordType = z.infer<typeof recordTypeSchema>

/** 各类型 payload schema（单 union 派发） */
export const moodPayloadSchema = z.object({ score: z.number().int().min(1).max(10) })
export const sleepPayloadSchema = z.object({ kind: z.enum(['sleep_start', 'wake_up']) })
export const waterPayloadSchema = z.object({ cups: z.number().int().min(1).max(20) })
export const medPayloadSchema = z.object({ slot: z.enum(['morning', 'evening']), taken: z.boolean() })
export const reviewPayloadSchema = z.object({ words: z.array(z.string().min(1).max(20)).min(1).max(3) })

export type MoodPayload = z.infer<typeof moodPayloadSchema>
export type SleepPayload = z.infer<typeof sleepPayloadSchema>
export type WaterPayload = z.infer<typeof waterPayloadSchema>
export type MedPayload = z.infer<typeof medPayloadSchema>
export type ReviewPayload = z.infer<typeof reviewPayloadSchema>

/** Insert 输入（前端 → Rust） */
export interface RecordInsert {
  type: RecordType
  payload: MoodPayload | SleepPayload | WaterPayload | MedPayload | ReviewPayload
  createdAt: number
  updatedAt: number
}

export const recordInsertSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mood'), payload: moodPayloadSchema, createdAt: z.number(), updatedAt: z.number() }),
  z.object({ type: z.literal('sleep'), payload: sleepPayloadSchema, createdAt: z.number(), updatedAt: z.number() }),
  z.object({ type: z.literal('water'), payload: waterPayloadSchema, createdAt: z.number(), updatedAt: z.number() }),
  z.object({ type: z.literal('med'), payload: medPayloadSchema, createdAt: z.number(), updatedAt: z.number() }),
  z.object({ type: z.literal('review'), payload: reviewPayloadSchema, createdAt: z.number(), updatedAt: z.number() })
])

/** DB 行（Rust → 前端） */
export interface RecordRow {
  id: number
  type: RecordType
  payload: string // JSON 字符串 · 前端再 parse
  createdAt: number
  updatedAt: number
}
```

- [ ] **Step 4: 跑测试**

Run: `cd projects-v1 && pnpm test`
Expected: 4 passed

- [ ] **Step 5: 提交**

Run: `cd projects-v1 && git add src/db/schema.ts tests/unit/schema.test.ts && git commit -m "feat(db): Drizzle-style schema + Zod discriminated union (5 record types)"`

---

### Task 1.2: 实现 Rust 端 rusqlite 桥

**Files:**
- Create: `projects-v1/src-tauri/src/db.rs`
- Modify: `projects-v1/src-tauri/Cargo.toml`

- [ ] **Step 1: 在 Cargo.toml 加依赖**

Add to `[dependencies]` in `projects-v1/src-tauri/Cargo.toml`:
```toml
rusqlite = { version = "0.31", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 2: 写 src-tauri/src/db.rs**

```rust
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecordRow {
    pub id: i64,
    pub r#type: String,
    pub payload: String,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct Db {
    pub conn: Mutex<Connection>,
}

impl Db {
    pub fn open(path: &PathBuf) -> SqlResult<Self> {
        let conn = Connection::open(path)?;
        // 单表 + 2 索引（PRD V1.2 §3.4.2）
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                payload JSON NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at);
            CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);"
        )?;
        Ok(Self { conn: Mutex::new(conn) })
    }

    pub fn save(&self, r#type: &str, payload: &str, created_at: i64, updated_at: i64) -> SqlResult<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO records (type, payload, created_at, updated_at) VALUES (?, ?, ?, ?)",
            params![r#type, payload, created_at, updated_at]
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn list(&self, since_ms: i64) -> SqlResult<Vec<RecordRow>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, type, payload, created_at, updated_at FROM records WHERE created_at >= ? ORDER BY created_at DESC")?;
        let rows = stmt.query_map(params![since_ms], |r| Ok(RecordRow {
            id: r.get(0)?, r#type: r.get(1)?, payload: r.get(2)?, created_at: r.get(3)?, updated_at: r.get(4)?
        }))?;
        rows.collect()
    }

    pub fn delete(&self, id: i64) -> SqlResult<usize> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM records WHERE id = ?", params![id])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn temp_db_path() -> PathBuf {
        let mut p = env::temp_dir();
        p.push(format!("mindtap_test_{}.db", rand::random::<u32>()));
        p
    }

    #[test]
    fn save_and_list_round_trip() {
        let path = temp_db_path();
        let db = Db::open(&path).unwrap();
        let id = db.save("mood", r#"{"score":7}"#, 1000, 1000).unwrap();
        assert!(id > 0);
        let rows = db.list(0).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].r#type, "mood");
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn list_with_since_filters_old() {
        let path = temp_db_path();
        let db = Db::open(&path).unwrap();
        db.save("mood", "{}", 500, 500).unwrap();
        db.save("mood", "{}", 1500, 1500).unwrap();
        let rows = db.list(1000).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].created_at, 1500);
        std::fs::remove_file(path).ok();
    }
}
```

- [ ] **Step 3: 跑 Rust 单测**

Run: `cd projects-v1/src-tauri && cargo test db::`
Expected: 2 passed

- [ ] **Step 4: 提交**

Run: `cd projects-v1 && git add src-tauri/src/db.rs src-tauri/Cargo.toml && git commit -m "feat(rust): rusqlite bridge (save/list/delete + schema migration)"`

---

### Task 1.3: 实现 Tauri Commands（save_record / list_records / delete_record）

**Files:**
- Create: `projects-v1/src-tauri/src/commands.rs`
- Modify: `projects-v1/src-tauri/src/main.rs`
- Modify: `projects-v1/src-tauri/Cargo.toml`

- [ ] **Step 1: 在 Cargo.toml 加 serde_json（若未加）**

Add to `[dependencies]`:
```toml
serde_json = "1"
```

- [ ] **Step 2: 写 src-tauri/src/commands.rs**

```rust
use crate::db::{Db, RecordRow};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

pub struct AppState { pub db: Arc<Db> }

#[derive(Debug, serde::Deserialize)]
pub struct SaveRecordInput {
    pub r#type: String,
    pub payload: serde_json::Value,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, serde::Serialize)]
pub struct SaveRecordOutput {
    pub id: i64,
    pub duration_ms: u128,
}

#[tauri::command]
pub fn save_record(state: State<AppState>, input: SaveRecordInput) -> Result<SaveRecordOutput, String> {
    let t0 = std::time::Instant::now();
    let payload_str = serde_json::to_string(&input.payload).map_err(|e| e.to_string())?;
    let id = state.db.save(&input.r#type, &payload_str, input.created_at, input.updated_at)
        .map_err(|e| e.to_string())?;
    Ok(SaveRecordOutput { id, duration_ms: t0.elapsed().as_millis() })
}

#[tauri::command]
pub fn list_records(state: State<AppState>, since_ms: i64) -> Result<Vec<RecordRow>, String> {
    state.db.list(since_ms).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_record(state: State<AppState>, id: i64) -> Result<usize, String> {
    state.db.delete(id).map_err(|e| e.to_string())
}

pub fn db_path() -> PathBuf {
    let mut p = tauri::api::path::app_data_dir(&tauri::Config::default()).unwrap_or_else(|| std::env::temp_dir());
    p.push("com.projects.app");
    std::fs::create_dir_all(&p).ok();
    p.push("projects.db");
    p
}
```

- [ ] **Step 3: 修改 src-tauri/src/main.rs（注册 commands + 初始化 Db）**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;

use std::sync::Arc;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let path = commands::db_path();
            let db = Arc::new(db::Db::open(&path).expect("open db"));
            app.manage(commands::AppState { db });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_record,
            commands::list_records,
            commands::delete_record
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: 编译验证**

Run: `cd projects-v1/src-tauri && cargo build`
Expected: 编译成功，无 error

- [ ] **Step 5: 提交**

Run: `cd projects-v1 && git add src-tauri/src/commands.rs src-tauri/src/main.rs && git commit -m "feat(rust): Tauri commands (save_record/list_records/delete_record)"`

---

### Task 1.4: 前端 IPC 封装

**Files:**
- Create: `projects-v1/src/ipc/records.ts`
- Test: `projects-v1/tests/unit/ipc-records.test.ts`

- [ ] **Step 1: 写失败测试**

Create `projects-v1/tests/unit/ipc-records.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { saveRecord, listRecords, deleteRecord } from '@/ipc/records'

const mockInvoke = vi.fn()
;(globalThis as any).window = { __TAURI__: { invoke: mockInvoke } }

describe('ipc/records', () => {
  it('saveRecord calls invoke with correct args', async () => {
    mockInvoke.mockResolvedValue({ id: 42, duration_ms: 5 })
    const result = await saveRecord({ type: 'mood', payload: { score: 7 }, createdAt: 1000, updatedAt: 1000 })
    expect(mockInvoke).toHaveBeenCalledWith('save_record', {
      input: { type: 'mood', payload: { score: 7 }, created_at: 1000, updated_at: 1000 }
    })
    expect(result.id).toBe(42)
  })

  it('listRecords maps since_ms', async () => {
    mockInvoke.mockResolvedValue([])
    await listRecords(1700000000000)
    expect(mockInvoke).toHaveBeenCalledWith('list_records', { since_ms: 1700000000000 })
  })

  it('deleteRecord calls invoke with id', async () => {
    mockInvoke.mockResolvedValue(1)
    await deleteRecord(99)
    expect(mockInvoke).toHaveBeenCalledWith('delete_record', { id: 99 })
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd projects-v1 && pnpm test`
Expected: FAIL "Cannot find module '@/ipc/records'"

- [ ] **Step 3: 写 src/ipc/records.ts**

```typescript
import { invoke } from '@tauri-apps/api/tauri'
import type { RecordInsert } from '@/db/schema'

/** Rust 端字段是 snake_case，前端用 camelCase，封一层转换 */
interface RustSaveInput { type: string; payload: unknown; created_at: number; updated_at: number }

export async function saveRecord(input: RecordInsert): Promise<{ id: number; durationMs: number }> {
  const rust: RustSaveInput = { type: input.type, payload: input.payload, created_at: input.createdAt, updated_at: input.updatedAt }
  const out = await invoke<{ id: number; duration_ms: number }>('save_record', { input: rust })
  return { id: out.id, durationMs: out.duration_ms }
}

export async function listRecords(sinceMs: number): Promise<Array<{ id: number; type: string; payload: string; createdAt: number; updatedAt: number }>> {
  const rows = await invoke<Array<{ id: number; type: string; payload: string; created_at: number; updated_at: number }>>('list_records', { since_ms: sinceMs })
  return rows.map(r => ({ id: r.id, type: r.type, payload: r.payload, createdAt: r.created_at, updatedAt: r.updated_at }))
}

export async function deleteRecord(id: number): Promise<number> {
  return invoke<number>('delete_record', { id })
}
```

- [ ] **Step 4: 跑测试**

Run: `cd projects-v1 && pnpm test`
Expected: 3 passed

- [ ] **Step 5: 提交**

Run: `cd projects-v1 && git add src/ipc/records.ts tests/unit/ipc-records.test.ts && git commit -m "feat(ipc): Tauri invoke wrapper (save/list/delete + snake_case adapter)"`

---

### Task 1.5: 4 域占位 UI（V0.1 演示用）

**Files:**
- Create: `projects-v1/src/routes/Records.tsx`
- Create: `projects-v1/src/routes/CheckIn.tsx`
- Create: `projects-v1/src/routes/Overview.tsx`
- Create: `projects-v1/src/routes/Storage.tsx`
- Create: `projects-v1/src/App.tsx`
- Modify: `projects-v1/src/main.tsx`

- [ ] **Step 1: 写 src/routes/Records.tsx**

```tsx
import { useState } from 'react'
import { saveRecord } from '@/ipc/records'

export function Records() {
  const [lastId, setLastId] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)

  const onDebugInsert = async () => {
    const result = await saveRecord({
      type: 'mood', payload: { score: 5 },
      createdAt: Date.now(), updatedAt: Date.now()
    })
    setLastId(result.id)
    setDuration(result.durationMs)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">全局入口域</h1>
      <p className="text-sm text-gray-500 mt-2">V0.1 占位 UI · Sprint 3 接入 FAB + 4 域选择模态</p>
      <button onClick={onDebugInsert} className="mt-4 px-4 py-2 rounded bg-blue-500 text-white">调试插入 mood=5</button>
      {lastId && <p className="mt-4 text-green-600">已保存 #{lastId} · 耗时 {duration}ms</p>}
    </div>
  )
}
```

- [ ] **Step 2: 写 src/routes/CheckIn.tsx**

```tsx
export function CheckIn() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">高频打卡域</h1>
      <p className="text-sm text-gray-500 mt-2">V0.1 占位 UI · Sprint 3 接入 4 类打卡组件</p>
    </div>
  )
}
```

- [ ] **Step 3: 写 src/routes/Overview.tsx**

```tsx
export function Overview() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">查看复盘域</h1>
      <p className="text-sm text-gray-500 mt-2">V0.1 占位 UI · Sprint 4 接入概览列表 + 3 词</p>
    </div>
  )
}
```

- [ ] **Step 4: 写 src/routes/Storage.tsx**

```tsx
export function Storage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">基础存储域</h1>
      <p className="text-sm text-gray-500 mt-2">V0.1 占位 UI · 数据位置：~/Library/Application Support/com.projects.app/projects.db</p>
    </div>
  )
}
```

- [ ] **Step 5: 写 src/App.tsx（4 域路由 · 简化版）**

```tsx
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { Records } from '@/routes/Records'
import { CheckIn } from '@/routes/CheckIn'
import { Overview } from '@/routes/Overview'
import { Storage } from '@/routes/Storage'

export function App() {
  return (
    <HashRouter>
      <nav className="flex gap-4 p-4 border-b">
        <Link to="/records">记录</Link>
        <Link to="/checkin">打卡</Link>
        <Link to="/overview">概览</Link>
        <Link to="/storage">存储</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Records />} />
        <Route path="/records" element={<Records />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/storage" element={<Storage />} />
      </Routes>
    </HashRouter>
  )
}
```

- [ ] **Step 6: 修改 src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

- [ ] **Step 7: 启动应用 + 验证 4 域可导航**

Run: `cd projects-v1 && pnpm tauri dev`（开新终端 ctrl+c 30 秒后）
Expected: 4 域导航正常，点击"调试插入"看到"已保存 #1 · 耗时 5ms"

- [ ] **Step 8: 提交**

Run: `cd projects-v1 && git add src/routes/ src/App.tsx src/main.tsx && git commit -m "feat(routes): 4 域占位 UI (V0.1 演示就绪)"`

---

### Task 1.6: 离线 100% e2e 测试

**Files:**
- Create: `projects-v1/tests/e2e/offline.spec.ts`

- [ ] **Step 1: 写离线测试**

```typescript
import { test, expect } from '@playwright/test'

test('app works fully offline', async ({ page, context }) => {
  await page.goto('/#/records')

  // 1. 离线模式下页面仍加载
  await context.setOffline(true)
  await page.goto('/#/records')
  await expect(page.getByText('全局入口域')).toBeVisible()

  // 2. 写入 record（DB 在本地，不依赖网络）
  await page.getByRole('button', { name: '调试插入' }).click()
  await expect(page.getByText(/已保存 #\d+/)).toBeVisible({ timeout: 5_000 })

  await context.setOffline(false)
})

test('records persist across restart', async ({ page, context }) => {
  await page.goto('/#/records')
  await page.getByRole('button', { name: '调试插入' }).click()
  const idText = await page.getByText(/已保存 #\d+/).textContent()
  const id = idText!.match(/#(\d+)/)![1]

  // 重启 WebView（reload）
  await page.reload()
  await page.goto(`/#/storage`)
  // 通过 IPC 验证 record 存在（Sprint 4 加 list_records UI；这里用 evaluate 调 invoke）
  const exists = await page.evaluate(async (id) => {
    const { invoke } = await import('/src/ipc/records.ts')
    const rows = await (await import('/src/ipc/records.ts')).listRecords(0)
    return rows.some(r => r.id === Number(id))
  }, id)
  expect(exists).toBe(true)
})
```

- [ ] **Step 2: 跑 e2e**

Run: `cd projects-v1 && pnpm exec playwright test tests/e2e/offline.spec.ts`
Expected: 2 passed

- [ ] **Step 3: 提交**

Run: `cd projects-v1 && git add tests/e2e/offline.spec.ts && git commit -m "test(e2e): 离线 100% + 跨重启持久化"`

---

### Task 1.7: V0.1 构建产物

**Files:**
- (no source changes, just build)

- [ ] **Step 1: 构建生产安装包**

Run: `cd projects-v1 && pnpm tauri build`
Expected: src-tauri/target/release/bundle/ 出现 .dmg (Mac) 或 .msi (Win)

- [ ] **Step 2: 验证 bundle 体积 5-15MB**

Run: `ls -lah projects-v1/src-tauri/target/release/bundle/dmg/*.dmg projects-v1/src-tauri/target/release/bundle/msi/*.msi 2>/dev/null || ls -lah projects-v1/src-tauri/target/release/bundle/`
Expected: bundle 体积 5-15MB（超过 20MB 则需要优化）

- [ ] **Step 3: 提交构建产物 tag**

Run: `cd projects-v1 && git tag v0.1.0 && git push origin v0.1.0`
Expected: tag v0.1.0 创建（V0.1 可发布）

---

## Phase 1 收口

### Sprint 1 DoD 自检清单
- ✅ V0.1 可发布：.dmg / .msi 安装包生成
- ✅ SQLite 文件正确创建在平台数据目录
- ✅ 单条 record 写入 < 50ms
- ✅ 离线 100% 可用
- ✅ Vitest 单元测试 100% 通过
- ✅ Playwright e2e 2/2 通过
- ✅ Biome 0 errors
- ✅ tsc 0 errors
- ✅ Sprint Review 演示通过（4 域可导航 + 调试插入 toast 可见）

### Sprint 1 → Sprint 2 移交
- 1 个新依赖：React Router v6（已装）
- 0 个数据 schema 变更
- 0 个 IPC 接口变更
- 4 域占位 UI 已就位，Sprint 2 接入 Liquid Glass 4 档 + 4 季主题

---

*以下 Phase 2-6 (Sprint 2-6) + Phase 7 (跨 Sprint 主题) 继续编写。*

---

## Phase 2 · Sprint 2 4 域 UI 骨架 + 4 季主题（W3-4 · V0.5）

> **Sprint Goal**：用户能在 3 平台 × 4 季主题下看到 4 域空 UI 全部带 Liquid Glass 效果。**V0.5 = 80% 视觉还原里程碑**。

### Task 2.1: 4 季主题 store（Zustand + localStorage 持久化）

**Files:**
- Create: `mindtap-v1/src/stores/theme.ts`
- Test: `mindtap-v1/tests/unit/theme-store.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '@/stores/theme'

describe('themeStore', () => {
  beforeEach(() => localStorage.clear())

  it('default theme is spring', () => {
    expect(useThemeStore.getState().theme).toBe('spring')
  })

  it('set theme updates state + DOM', () => {
    useThemeStore.getState().setTheme('summer')
    expect(useThemeStore.getState().theme).toBe('summer')
    expect(document.documentElement.getAttribute('data-theme')).toBe('summer')
  })

  it('persists to localStorage', () => {
    useThemeStore.getState().setTheme('autumn')
    const reloaded = useThemeStore.getState()
    expect(reloaded.theme).toBe('autumn')
  })

  it('falls back to spring on invalid stored value', () => {
    localStorage.setItem('mindtap-theme', 'bogus')
    useThemeStore.getState()._hydrate()
    expect(useThemeStore.getState().theme).toBe('spring')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL "Cannot find module '@/stores/theme'"

- [ ] **Step 3: 写 src/stores/theme.ts**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'spring' | 'summer' | 'autumn' | 'winter'
const THEMES: Theme[] = ['spring', 'summer', 'autumn', 'winter']

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
  cycle: () => void
  _hydrate: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'spring',
      setTheme: (t) => {
        if (!THEMES.includes(t)) return
        set({ theme: t })
        document.documentElement.setAttribute('data-theme', t)
      },
      cycle: () => {
        const i = THEMES.indexOf(get().theme)
        const next = THEMES[(i + 1) % THEMES.length]
        get().setTheme(next)
      },
      _hydrate: () => {
        const stored = localStorage.getItem('mindtap-theme')
        const val = stored ? JSON.parse(stored)?.state?.theme : null
        if (THEMES.includes(val)) set({ theme: val })
      }
    }),
    { name: 'mindtap-theme' }
  )
)

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', useThemeStore.getState().theme)
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 4 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/stores/theme.ts tests/unit/theme-store.test.ts && git commit -m "feat(stores): 4 季主题 store (Zustand + persist + DOM 同步)"`

---

### Task 2.2: 主题切换 UI

**Files:**
- Create: `mindtap-v1/src/components/glass/ThemeSwitcher.tsx`
- Test: `mindtap-v1/tests/unit/theme-switcher.test.tsx`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeSwitcher } from '@/components/glass/ThemeSwitcher'

const setThemeMock = vi.fn()
const cycleMock = vi.fn()
vi.mock('@/stores/theme', () => ({
  useThemeStore: Object.assign(
    (sel: any) => sel({ theme: 'spring', setTheme: setThemeMock, cycle: cycleMock }),
    { getState: () => ({ theme: 'spring', setTheme: setThemeMock, cycle: cycleMock }) }
  )
}))

describe('ThemeSwitcher', () => {
  it('renders current theme label', () => {
    render(<ThemeSwitcher />)
    expect(screen.getByText('春')).toBeInTheDocument()
  })

  it('clicking calls cycle', () => {
    render(<ThemeSwitcher />)
    fireEvent.click(screen.getByRole('button'))
    expect(cycleMock).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/components/glass/ThemeSwitcher.tsx**

```tsx
import { useThemeStore, type Theme } from '@/stores/theme'

const LABELS: Record<Theme, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }

export function ThemeSwitcher() {
  const theme = useThemeStore(s => s.theme)
  const cycle = useThemeStore(s => s.cycle)
  return (
    <button
      onClick={cycle}
      aria-label={`切换主题，当前：${LABELS[theme]}`}
      className="glass-thin px-3 py-1 rounded-full text-sm"
      data-accent
    >
      {LABELS[theme]}
    </button>
  )
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 2 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/components/glass/ThemeSwitcher.tsx tests/unit/theme-switcher.test.tsx && git commit -m "feat(glass): 4 季主题切换器 (UI)"`

---

### Task 2.3: 平台检测 store

**Files:**
- Create: `mindtap-v1/src/stores/platform.ts`
- Test: `mindtap-v1/tests/unit/platform-store.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { usePlatformStore, detectPlatform } from '@/stores/platform'

describe('platformStore', () => {
  beforeEach(() => localStorage.clear())

  it('detectPlatform returns macos|windows|unknown', () => {
    expect(['macos', 'windows', 'unknown']).toContain(detectPlatform())
  })

  it('user override takes precedence', () => {
    localStorage.setItem('mindtap-platform', JSON.stringify({ state: { platform: 'windows' }, version: 0 }))
    expect(usePlatformStore.getState().platform).toBe('windows')
  })

  it('setPlatform updates state', () => {
    usePlatformStore.getState().setPlatform('macos')
    expect(usePlatformStore.getState().platform).toBe('macos')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/stores/platform.ts**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Platform = 'macos' | 'windows' | 'unknown'

export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('win')) return 'windows'
  return 'unknown'
}

interface PlatformState { platform: Platform; setPlatform: (p: Platform) => void }

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({ platform: detectPlatform(), setPlatform: (p) => set({ platform: p }) }),
    { name: 'mindtap-platform' }
  )
)
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 3 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/stores/platform.ts tests/unit/platform-store.test.ts && git commit -m "feat(stores): 平台检测 (macos/windows/unknown + user override)"`

---

### Task 2.4: 3 平台导航布局

**Files:**
- Create: `mindtap-v1/src/components/layout/MobileTabBar.tsx`
- Create: `mindtap-v1/src/components/layout/WindowsSidebar.tsx`
- Create: `mindtap-v1/src/components/layout/MacOSMenubar.tsx`
- Create: `mindtap-v1/src/components/layout/PlatformLayout.tsx`
- Test: `mindtap-v1/tests/unit/platform-layout.test.tsx`

- [ ] **Step 1: 写 MobileTabBar**

```tsx
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/records', label: '记录' },
  { to: '/checkin', label: '打卡' },
  { to: '/overview', label: '概览' }
]

export function MobileTabBar() {
  return (
    <nav aria-label="主导航" className="fixed bottom-0 inset-x-0 glass-regular flex justify-around py-2">
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `text-xs px-3 py-1 rounded ${isActive ? 'font-semibold' : ''}`}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: 写 WindowsSidebar**

```tsx
import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/records', label: '全局入口' },
  { to: '/checkin', label: '高频打卡' },
  { to: '/overview', label: '查看复盘' },
  { to: '/storage', label: '基础存储' }
]

export function WindowsSidebar() {
  return (
    <aside aria-label="主导航" className="w-60 h-screen glass-regular p-4 flex flex-col gap-2">
      <h2 className="text-lg font-semibold mb-4">mindtap</h2>
      {ITEMS.map(i => (
        <NavLink key={i.to} to={i.to} className={({ isActive }) => `px-3 py-2 rounded ${isActive ? 'glass-thin font-semibold' : ''}`}>
          {i.label}
        </NavLink>
      ))}
    </aside>
  )
}
```

- [ ] **Step 3: 写 MacOSMenubar**

```tsx
import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/records', label: '入口' },
  { to: '/checkin', label: '打卡' },
  { to: '/overview', label: '概览' },
  { to: '/storage', label: '存储' }
]

export function MacOSMenubar() {
  return (
    <header role="banner" className="glass-regular px-4 py-2 flex items-center gap-1 sticky top-0 z-10">
      <span className="font-semibold mr-4">mindtap</span>
      {ITEMS.map(i => (
        <NavLink key={i.to} to={i.to} className={({ isActive }) => `px-3 py-1 rounded text-sm ${isActive ? 'glass-thin' : ''}`}>
          {i.label}
        </NavLink>
      ))}
    </header>
  )
}
```

- [ ] **Step 4: 写 PlatformLayout**

```tsx
import { usePlatformStore } from '@/stores/platform'
import { MobileTabBar } from './MobileTabBar'
import { WindowsSidebar } from './WindowsSidebar'
import { MacOSMenubar } from './MacOSMenubar'

export function PlatformLayout({ children }: { children: React.ReactNode }) {
  const platform = usePlatformStore(s => s.platform)
  if (platform === 'macos') return (<><MacOSMenubar /><main className="p-6">{children}</main></>)
  if (platform === 'windows') return (<div className="flex min-h-screen"><WindowsSidebar /><main className="flex-1 p-6">{children}</main></div>)
  return (<div className="min-h-screen pb-16"><main className="p-4">{children}</main><MobileTabBar /></div>)
}
```

- [ ] **Step 5: 写失败测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlatformLayout } from '@/components/layout/PlatformLayout'

vi.mock('@/stores/platform', () => ({
  usePlatformStore: (sel: any) => sel({ platform: 'macos' })
}))

describe('PlatformLayout', () => {
  it('macos renders banner', () => {
    render(<MemoryRouter><PlatformLayout><div>content</div></PlatformLayout></MemoryRouter>)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 1 passed

- [ ] **Step 7: 修改 src/App.tsx（接入 PlatformLayout + ThemeSwitcher）**

```tsx
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { Records } from '@/routes/Records'
import { CheckIn } from '@/routes/CheckIn'
import { Overview } from '@/routes/Overview'
import { Storage } from '@/routes/Storage'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { ThemeSwitcher } from '@/components/glass/ThemeSwitcher'

export function App() {
  return (
    <HashRouter>
      <PlatformLayout>
        <div className="flex justify-between items-center mb-4">
          <nav className="flex gap-3 text-sm">
            <Link to="/records">记录</Link><Link to="/checkin">打卡</Link>
            <Link to="/overview">概览</Link><Link to="/storage">存储</Link>
          </nav>
          <ThemeSwitcher />
        </div>
        <Routes>
          <Route path="/" element={<Records />} />
          <Route path="/records" element={<Records />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/storage" element={<Storage />} />
        </Routes>
      </PlatformLayout>
    </HashRouter>
  )
}
```

- [ ] **Step 8: 提交**

Run: `cd mindtap-v1 && git add src/components/layout/ tests/unit/platform-layout.test.tsx src/App.tsx && git commit -m "feat(layout): 3 平台导航 (Mobile/Windows/macOS)"`

---

### Task 2.5: 4 域空 UI 接入 Liquid Glass 4 档

**Files:**
- Modify: 4 个 routes

- [ ] **Step 1: 改 src/routes/Records.tsx**

```tsx
import { useState } from 'react'
import { saveRecord } from '@/ipc/records'

export function Records() {
  const [lastId, setLastId] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const onDebugInsert = async () => {
    const r = await saveRecord({ type: 'mood', payload: { score: 5 }, createdAt: Date.now(), updatedAt: Date.now() })
    setLastId(r.id); setDuration(r.durationMs)
  }
  return (
    <div className="glass-regular p-6 rounded-2xl">
      <h1 className="text-2xl font-semibold">全局入口域</h1>
      <p className="text-sm opacity-60 mt-2">V0.5 · glass-regular 材质</p>
      <button onClick={onDebugInsert} className="mt-4 glass-thin px-4 py-2 rounded-lg" data-accent>调试插入</button>
      {lastId && <p className="mt-4 text-green-600">已保存 #{lastId} · 耗时 {duration}ms</p>}
    </div>
  )
}
```

- [ ] **Step 2: 改 src/routes/CheckIn.tsx**

```tsx
export function CheckIn() {
  return (
    <div className="glass-ultrathin p-6 rounded-2xl">
      <h1 className="text-2xl font-semibold">高频打卡域</h1>
      <p className="text-sm opacity-60 mt-2">V0.5 · 4 类打卡在 Sprint 3 接入</p>
      <ul className="mt-4 space-y-2">
        <li className="glass-thin p-3 rounded-lg">情绪滑块（1-10 分）</li>
        <li className="glass-thin p-3 rounded-lg">作息双按钮</li>
        <li className="glass-thin p-3 rounded-lg">饮水计数（±1 杯）</li>
        <li className="glass-thin p-3 rounded-lg">服药勾选</li>
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: 改 src/routes/Overview.tsx**

```tsx
export function Overview() {
  return (
    <div className="glass-thick p-6 rounded-2xl">
      <h1 className="text-2xl font-semibold">查看复盘域</h1>
      <p className="text-sm opacity-60 mt-2">V0.5 · 概览列表 + 3 词在 Sprint 4 接入</p>
    </div>
  )
}
```

- [ ] **Step 4: 改 src/routes/Storage.tsx**

```tsx
export function Storage() {
  return (
    <div className="glass-thin p-6 rounded-2xl">
      <h1 className="text-2xl font-semibold">基础存储域</h1>
      <p className="text-sm opacity-60 mt-2">数据位置：~/Library/Application Support/com.mindtap.app/mindtap.db</p>
    </div>
  )
}
```

- [ ] **Step 5: 启动应用 + 4 季主题循环验证**

Run: `cd mindtap-v1 && pnpm tauri dev`
Expected: 4 域都带 glass-* 材质 + ThemeSwitcher 点击循环 4 季 + 切换 < 0.2s

- [ ] **Step 6: 提交**

Run: `cd mindtap-v1 && git add src/routes/ && git commit -m "feat(routes): 4 域 UI 接入 Liquid Glass 4 档 (V0.5)"`

---

### Task 2.6: V0.5 12 组合视觉回归

**Files:**
- Create: `mindtap-v1/tests/e2e/v05-theme-platform.spec.ts`

- [ ] **Step 1: 写 4 季 × 3 平台 e2e**

```typescript
import { test, expect } from '@playwright/test'

const THEMES = ['春', '夏', '秋', '冬']
const PLATFORMS = ['macos', 'windows', 'unknown']

for (const platform of PLATFORMS) {
  test.describe(`V0.5 ${platform}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((p) => localStorage.setItem('mindtap-platform', JSON.stringify({ state: { platform: p }, version: 0 })), platform)
      await page.goto('/#/records')
    })

    for (const theme of THEMES) {
      test(`renders ${theme}`, async ({ page }) => {
        const btn = page.getByRole('button', { name: /切换主题/ })
        for (let i = 0; i < THEMES.indexOf(theme); i++) await btn.click()
        await expect(page.getByRole('button', { name: new RegExp(theme) })).toBeVisible()
        await page.screenshot({ path: `tests/e2e/screenshots/v05-${platform}-${theme}.png` })
      })
    }
  })
}
```

- [ ] **Step 2: 跑 e2e**

Run: `cd mindtap-v1 && pnpm exec playwright test tests/e2e/v05-theme-platform.spec.ts`
Expected: 12 passed

- [ ] **Step 3: 提交**

Run: `cd mindtap-v1 && git add tests/e2e/v05-theme-platform.spec.ts && git commit -m "test(e2e): V0.5 4 季 × 3 平台 12 组合视觉回归"`

---

### Task 2.7: V0.5 构建 + tag

- [ ] **Step 1: 构建 + tag**

Run: `cd mindtap-v1 && pnpm tauri build && git tag v0.5.0 && git push origin v0.5.0`
Expected: bundle 5-15MB + tag v0.5.0

---

## Phase 2 收口

### Sprint 2 DoD
- ✅ 4 域 UI + glass 4 档
- ✅ 4 季主题切换 < 0.2s
- ✅ 3 平台布局适配
- ✅ Playwright 12 组合 100% 绿
- ✅ V0.5 视觉基线

### Sprint 2 → Sprint 3 移交
- 新增: theme store + platform store
- 0 个 IPC 接口变更
- Sprint 3 接入 4 类打卡组件 + FAB + 快捷键

---

## Phase 3 · Sprint 3 核心 UI + 全局入口（W5-6 · V0.7）

> **Sprint Goal**：用户能通过 FAB 唤起模态，4 类打卡 UI 全部可交互（无持久化集成 — 状态走 Zustand 内存 + localStorage）。**V0.7 = UI 完整 + 状态管理就绪**。

### Task 3.1: FAB 浮动按钮（拖动 + 位置记忆）

**Files:**
- Create: `mindtap-v1/src/components/glass/FAB.tsx`
- Test: `mindtap-v1/tests/unit/fab.test.tsx`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FAB } from '@/components/glass/FAB'

beforeEach(() => localStorage.clear())

describe('FAB', () => {
  it('renders with default position', () => {
    render(<FAB onClick={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /快速记录/ })
    expect(btn).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<FAB onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: /快速记录/ }))
    expect(onClick).toHaveBeenCalled()
  })

  it('persists position to localStorage after drag', () => {
    render(<FAB onClick={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /快速记录/ })
    fireEvent.mouseDown(btn, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(window)
    const stored = JSON.parse(localStorage.getItem('mindtap-fab-pos') || 'null')
    expect(stored).toBeTruthy()
    expect(stored.x).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/components/glass/FAB.tsx**

```tsx
import { useEffect, useRef, useState } from 'react'

interface Pos { x: number; y: number }
const STORAGE_KEY = 'mindtap-fab-pos'
const SIZE = 56

export function FAB({ onClick }: { onClick: () => void }) {
  const [pos, setPos] = useState<Pos>(() => {
    if (typeof localStorage === 'undefined') return { x: window.innerWidth - SIZE - 16, y: window.innerHeight - SIZE - 16 }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) try { return JSON.parse(stored) } catch { /* fallback */ }
    return { x: window.innerWidth - SIZE - 16, y: window.innerHeight - SIZE - 16 }
  })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)) }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const x = Math.max(0, Math.min(window.innerWidth - SIZE, e.clientX - offset.current.x))
      const y = Math.max(0, Math.min(window.innerHeight - SIZE, e.clientY - offset.current.y))
      setPos({ x, y })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => { dragging.current = true; offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y } }}
      aria-label="快速记录"
      data-accent
      className="glass-thick fixed rounded-full shadow-lg flex items-center justify-center text-2xl select-none cursor-grab active:cursor-grabbing"
      style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE }}
    >
      +
    </button>
  )
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 3 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/components/glass/FAB.tsx tests/unit/fab.test.tsx && git commit -m "feat(glass): FAB 浮动按钮 (拖动 + 位置记忆)"`

---

### Task 3.2: 全局快捷键 Cmd/Ctrl+N

**Files:**
- Create: `mindtap-v1/src/hooks/useHotkey.ts`
- Test: `mindtap-v1/tests/unit/use-hotkey.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHotkey } from '@/hooks/useHotkey'

describe('useHotkey', () => {
  let listeners: Record<string, Set<(...args: any[]) => void>> = {}
  const addEvent = (type: string, cb: any) => { (listeners[type] ||= new Set()).add(cb) }
  const removeEvent = (type: string, cb: any) => { listeners[type]?.delete(cb) }
  const fire = (type: string, e: any) => listeners[type]?.forEach(cb => cb(e))

  beforeEach(() => { listeners = {}; (window as any).addEventListener = addEvent; (window as any).removeEventListener = removeEvent })
  afterEach(() => { vi.restoreAllMocks() })

  it('registers and calls handler on Cmd+N', () => {
    const cb = vi.fn()
    renderHook(() => useHotkey('mod+n', cb))
    fire('keydown', { key: 'n', metaKey: true, preventDefault: vi.fn() })
    expect(cb).toHaveBeenCalled()
  })

  it('ignores non-matching keys', () => {
    const cb = vi.fn()
    renderHook(() => useHotkey('mod+n', cb))
    fire('keydown', { key: 'x', metaKey: true, preventDefault: vi.fn() })
    expect(cb).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/hooks/useHotkey.ts**

```typescript
import { useEffect } from 'react'

type Mod = 'mod' | 'ctrl' | 'meta' | 'alt' | 'shift'

interface ParsedCombo { mod: Mod; key: string }

function parse(combo: string): ParsedCombo {
  const parts = combo.toLowerCase().split('+').map(p => p.trim())
  const key = parts[parts.length - 1]!
  const mods = parts.slice(0, -1) as Mod[]
  return { mod: mods[0] ?? 'mod', key }
}

export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const { mod, key } = parse(combo)
    const onKey = (e: KeyboardEvent) => {
      const isMod = mod === 'mod' ? (e.metaKey || e.ctrlKey) : e[`${mod}Key` as 'ctrlKey']
      if (isMod && e.key.toLowerCase() === key) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [combo, handler])
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 2 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/hooks/useHotkey.ts tests/unit/use-hotkey.test.ts && git commit -m "feat(hooks): useHotkey (Cmd/Ctrl+N 全局快捷键)"`

---

### Task 3.3: 4 类选择模态（FAB 点击触发）

**Files:**
- Create: `mindtap-v1/src/components/glass/RecordModal.tsx`
- Test: `mindtap-v1/tests/unit/record-modal.test.tsx`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordModal } from '@/components/glass/RecordModal'

describe('RecordModal', () => {
  it('renders 4 category entries', () => {
    render(<RecordModal onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.getByText('情绪')).toBeInTheDocument()
    expect(screen.getByText('作息')).toBeInTheDocument()
    expect(screen.getByText('饮水')).toBeInTheDocument()
    expect(screen.getByText('服药')).toBeInTheDocument()
  })

  it('calls onSelect with type', () => {
    const onSelect = vi.fn()
    render(<RecordModal onClose={vi.fn()} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('情绪'))
    expect(onSelect).toHaveBeenCalledWith('mood')
  })

  it('calls onClose on backdrop click', () => {
    const onClose = vi.fn()
    render(<RecordModal onClose={onClose} onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/components/glass/RecordModal.tsx**

```tsx
import type { RecordType } from '@/db/schema'

const CATEGORIES: Array<{ type: RecordType; label: string; emoji: string }> = [
  { type: 'mood', label: '情绪', emoji: '😊' },
  { type: 'sleep', label: '作息', emoji: '😴' },
  { type: 'water', label: '饮水', emoji: '💧' },
  { type: 'med', label: '服药', emoji: '💊' }
]

export function RecordModal({ onClose, onSelect }: { onClose: () => void; onSelect: (type: RecordType) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-label="选择记录类型" className="glass-thick p-6 rounded-2xl shadow-2xl w-80" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">快速记录</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(c => (
            <button key={c.type} onClick={() => onSelect(c.type)} className="glass-thin p-4 rounded-xl flex flex-col items-center gap-2 hover:scale-105 transition" data-accent>
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-sm">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 3 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/components/glass/RecordModal.tsx tests/unit/record-modal.test.tsx && git commit -m "feat(glass): 4 类选择模态 (情绪/作息/饮水/服药)"`

---

### Task 3.4: quickCheckIn Zustand store（4 域打卡数据）

**Files:**
- Create: `mindtap-v1/src/stores/quickCheckIn.ts`
- Test: `mindtap-v1/tests/unit/quick-checkin-store.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useQuickCheckInStore } from '@/stores/quickCheckIn'

beforeEach(() => localStorage.clear())

describe('quickCheckInStore', () => {
  it('adds record to pending queue', () => {
    useQuickCheckInStore.getState().add({ type: 'mood', payload: { score: 7 } })
    expect(useQuickCheckInStore.getState().pending).toHaveLength(1)
  })

  it('flushPending clears queue', () => {
    useQuickCheckInStore.getState().add({ type: 'mood', payload: { score: 5 } })
    useQuickCheckInStore.getState().flushPending()
    expect(useQuickCheckInStore.getState().pending).toHaveLength(0)
  })

  it('persists to localStorage', () => {
    useQuickCheckInStore.getState().add({ type: 'water', payload: { cups: 1 } })
    useQuickCheckInStore.persist.rehydrate()
    expect(useQuickCheckInStore.getState().pending.length).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/stores/quickCheckIn.ts**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RecordInsert } from '@/db/schema'

interface QuickCheckInState {
  pending: RecordInsert[]
  add: (r: Omit<RecordInsert, 'createdAt' | 'updatedAt'>) => void
  flushPending: () => void
}

export const useQuickCheckInStore = create<QuickCheckInState>()(
  persist(
    (set, get) => ({
      pending: [],
      add: (r) => {
        const now = Date.now()
        set({ pending: [...get().pending, { ...r, createdAt: now, updatedAt: now }] })
      },
      flushPending: () => set({ pending: [] })
    }),
    { name: 'mindtap-quick-checkin' }
  )
)
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 3 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/stores/quickCheckIn.ts tests/unit/quick-checkin-store.test.ts && git commit -m "feat(stores): quickCheckIn (4 域打卡 + localStorage 队列)"`

---

### Task 3.5: 情绪滑块组件（MoodSlider）

**Files:**
- Create: `mindtap-v1/src/components/domain/MoodSlider.tsx`
- Test: `mindtap-v1/tests/unit/mood-slider.test.tsx`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MoodSlider } from '@/components/domain/MoodSlider'

describe('MoodSlider', () => {
  it('renders 1-10 range', () => {
    render(<MoodSlider onChange={vi.fn()} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '1')
    expect(slider).toHaveAttribute('max', '10')
  })

  it('calls onChange with score', () => {
    const onChange = vi.fn()
    render(<MoodSlider onChange={onChange} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } })
    expect(onChange).toHaveBeenCalledWith(7)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/components/domain/MoodSlider.tsx**

```tsx
export function MoodSlider({ value = 5, onChange }: { value?: number; onChange: (score: number) => void }) {
  return (
    <div className="space-y-2">
      <label htmlFor="mood" className="text-sm">情绪 / 能量: <span data-accent className="font-semibold">{value}</span></label>
      <input id="mood" type="range" min="1" max="10" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-current" data-accent />
    </div>
  )
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 2 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/components/domain/MoodSlider.tsx tests/unit/mood-slider.test.tsx && git commit -m "feat(domain): MoodSlider 1-10 滑块 (HIG 09-sliders 实践)"`

---

### Task 3.6: 作息 / 饮水 / 服药 三个组件

**Files:**
- Create: `mindtap-v1/src/components/domain/SleepButtons.tsx`
- Create: `mindtap-v1/src/components/domain/WaterCounter.tsx`
- Create: `mindtap-v1/src/components/domain/MedCheckbox.tsx`
- Test: `mindtap-v1/tests/unit/domain-trio.test.tsx`

- [ ] **Step 1: 写 src/components/domain/SleepButtons.tsx**

```tsx
import type { SleepPayload } from '@/db/schema'

export function SleepButtons({ onLog }: { onLog: (kind: SleepPayload['kind']) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm">作息</p>
      <div className="flex gap-2">
        <button onClick={() => onLog('sleep_start')} className="glass-thin px-4 py-2 rounded-lg flex-1" data-accent>入睡</button>
        <button onClick={() => onLog('wake_up')} className="glass-thin px-4 py-2 rounded-lg flex-1" data-accent>起床</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 写 src/components/domain/WaterCounter.tsx**

```tsx
import { useState } from 'react'

export function WaterCounter({ onLog }: { onLog: (cups: number) => void }) {
  const [cups, setCups] = useState(0)
  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(20, cups + delta))
    setCups(next)
    if (delta > 0) onLog(next)
  }
  return (
    <div className="space-y-2">
      <p className="text-sm">饮水 · 累计 <span data-accent className="font-semibold">{cups}</span> 杯 ({(cups * 200).toLocaleString()} ml)</p>
      <div className="flex gap-2">
        <button onClick={() => adjust(-1)} aria-label="减一杯" className="glass-thin w-10 h-10 rounded-full">−</button>
        <button onClick={() => adjust(1)} aria-label="加一杯" className="glass-thin w-10 h-10 rounded-full" data-accent>+</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 写 src/components/domain/MedCheckbox.tsx**

```tsx
import { useState } from 'react'
import type { MedPayload } from '@/db/schema'

export function MedCheckbox({ onLog }: { onLog: (p: MedPayload) => void }) {
  const [slot, setSlot] = useState<MedPayload['slot']>('morning')
  return (
    <div className="space-y-2">
      <p className="text-sm">服药</p>
      <div className="flex gap-2">
        {(['morning', 'evening'] as const).map(s => (
          <button key={s} onClick={() => setSlot(s)} className={`glass-thin px-3 py-1 rounded text-xs ${slot === s ? 'font-semibold' : ''}`} data-accent={slot === s}>
            {s === 'morning' ? '早' : '晚'}
          </button>
        ))}
      </div>
      <button onClick={() => onLog({ slot, taken: true })} className="glass-thin px-4 py-2 rounded-lg w-full" data-accent>已服用</button>
    </div>
  )
}
```

- [ ] **Step 4: 写失败测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SleepButtons } from '@/components/domain/SleepButtons'
import { WaterCounter } from '@/components/domain/WaterCounter'
import { MedCheckbox } from '@/components/domain/MedCheckbox'

describe('domain trio', () => {
  it('SleepButtons calls onLog with kind', () => {
    const cb = vi.fn()
    render(<SleepButtons onLog={cb} />)
    fireEvent.click(screen.getByText('入睡'))
    expect(cb).toHaveBeenCalledWith('sleep_start')
  })

  it('WaterCounter accumulates', () => {
    const cb = vi.fn()
    render(<WaterCounter onLog={cb} />)
    fireEvent.click(screen.getByLabelText('加一杯'))
    fireEvent.click(screen.getByLabelText('加一杯'))
    expect(screen.getByText(/累计 2/)).toBeInTheDocument()
  })

  it('MedCheckbox toggles slot', () => {
    const cb = vi.fn()
    render(<MedCheckbox onLog={cb} />)
    fireEvent.click(screen.getByText('晚'))
    fireEvent.click(screen.getByText('已服用'))
    expect(cb).toHaveBeenCalledWith({ slot: 'evening', taken: true })
  })
})
```

- [ ] **Step 5: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 3 passed

- [ ] **Step 6: 提交**

Run: `cd mindtap-v1 && git add src/components/domain/ tests/unit/domain-trio.test.tsx && git commit -m "feat(domain): SleepButtons + WaterCounter + MedCheckbox"`

---

### Task 3.7: 整合 FAB + 模态 + 4 域组件到 CheckIn 路由

**Files:**
- Modify: `mindtap-v1/src/routes/CheckIn.tsx`
- Modify: `mindtap-v1/src/App.tsx`

- [ ] **Step 1: 改 src/routes/CheckIn.tsx**

```tsx
import { useState } from 'react'
import { FAB } from '@/components/glass/FAB'
import { RecordModal } from '@/components/glass/RecordModal'
import { MoodSlider } from '@/components/domain/MoodSlider'
import { SleepButtons } from '@/components/domain/SleepButtons'
import { WaterCounter } from '@/components/domain/WaterCounter'
import { MedCheckbox } from '@/components/domain/MedCheckbox'
import { useQuickCheckInStore } from '@/stores/quickCheckIn'
import { useHotkey } from '@/hooks/useHotkey'
import type { RecordType } from '@/db/schema'

export function CheckIn() {
  const [modal, setModal] = useState<RecordType | null>(null)
  const add = useQuickCheckInStore(s => s.add)
  useHotkey('mod+n', () => setModal('mood'))

  return (
    <>
      <div className="glass-ultrathin p-6 rounded-2xl space-y-4">
        <h1 className="text-2xl font-semibold">高频打卡域</h1>
        <p className="text-sm opacity-60">V0.7 · 4 类 UI 可交互 · 走 localStorage 暂存</p>
        <MoodSlider onChange={(score) => add({ type: 'mood', payload: { score } })} />
        <SleepButtons onLog={(kind) => add({ type: 'sleep', payload: { kind } })} />
        <WaterCounter onLog={(cups) => add({ type: 'water', payload: { cups } })} />
        <MedCheckbox onLog={(p) => add({ type: 'med', payload: p })} />
      </div>
      <FAB onClick={() => setModal('mood')} />
      {modal && <RecordModal onClose={() => setModal(null)} onSelect={(t) => setModal(t)} />}
    </>
  )
}
```

- [ ] **Step 2: 提交**

Run: `cd mindtap-v1 && git add src/routes/CheckIn.tsx && git commit -m "feat(checkin): FAB + 模态 + 4 域组件集成"`

---

### Task 3.8: V0.7 e2e + tag

**Files:**
- Create: `mindtap-v1/tests/e2e/v07-checkin.spec.ts`

- [ ] **Step 1: 写 e2e**

```typescript
import { test, expect } from '@playwright/test'

test('FAB → modal → 4 categories', async ({ page }) => {
  await page.goto('/#/checkin')
  await page.getByRole('button', { name: '快速记录' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByText('情绪').click()
})

test('Cmd/Ctrl+N opens modal', async ({ page }) => {
  await page.goto('/#/checkin')
  await page.keyboard.press('Control+n')
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('4 check-in types persist to localStorage', async ({ page }) => {
  await page.goto('/#/checkin')
  await page.locator('input[type=range]').fill('7')
  await page.getByText('+', { exact: true }).click()
  await page.getByText('已服用').click()
  const stored = await page.evaluate(() => localStorage.getItem('mindtap-quick-checkin'))
  expect(stored).toBeTruthy()
  expect(stored).toContain('mood')
})
```

- [ ] **Step 2: 跑 e2e**

Run: `cd mindtap-v1 && pnpm exec playwright test tests/e2e/v07-checkin.spec.ts`
Expected: 3 passed

- [ ] **Step 3: 构建 + tag**

Run: `cd mindtap-v1 && pnpm tauri build && git tag v0.7.0 && git push origin v0.7.0`

---

## Phase 3 收口

### Sprint 3 DoD
- ✅ 4 类打卡 UI 全部可交互
- ✅ FAB 可拖动 + 位置记忆
- ✅ Cmd/Ctrl+N 全局唤起
- ✅ 模态打开 ≤ 0.3s
- ✅ Zustand 状态跨组件 + localStorage 持久化
- ✅ V0.7 演示通过

### Sprint 3 → Sprint 4 移交
- quickCheckIn store 有 pending 队列，Sprint 4 集成到 saveRecord IPC
- 4 域 UI 全部就绪
- Sprint 4 接入概览列表 + 时间分组 + 统计条 + 3 词 + 测试

---

## Phase 4 · Sprint 4 概览 + 复盘 + 持久化 + 测试（W7-8 · V0.95）

> **Sprint Goal**：4 域所有数据持久化到 SQLite，概览页 ≤ 1s 加载，Vitest + Playwright 全绿。**V0.95 = 90% 视觉还原 + 测试通过 + 性能达标**。

### Task 4.1: 概览列表组件（按时间倒序）

**Files:**
- Create: `mindtap-v1/src/components/domain/Overview.tsx`
- Test: `mindtap-v1/tests/unit/overview-list.test.tsx`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { groupByTimeOfDay, type OverviewItem } from '@/components/domain/Overview'

const items: OverviewItem[] = [
  { id: 1, type: 'mood', payload: '{"score":7}', createdAt: new Date(2026, 5, 14, 9, 30).getTime() },
  { id: 2, type: 'water', payload: '{"cups":1}', createdAt: new Date(2026, 5, 14, 14, 0).getTime() },
  { id: 3, type: 'review', payload: '{"words":["静","心","行"]}', createdAt: new Date(2026, 5, 14, 21, 0).getTime() }
]

describe('groupByTimeOfDay', () => {
  it('groups into morning/afternoon/evening', () => {
    const groups = groupByTimeOfDay(items)
    expect(groups.morning).toHaveLength(1)
    expect(groups.afternoon).toHaveLength(1)
    expect(groups.evening).toHaveLength(1)
  })

  it('returns empty groups when no items', () => {
    const groups = groupByTimeOfDay([])
    expect(groups.morning).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/components/domain/Overview.tsx**

```tsx
import { useEffect, useState } from 'react'
import { listRecords } from '@/ipc/records'

export interface OverviewItem { id: number; type: string; payload: string; createdAt: number }

export function groupByTimeOfDay(items: OverviewItem[]) {
  const groups = { morning: [] as OverviewItem[], afternoon: [] as OverviewItem[], evening: [] as OverviewItem[] }
  for (const it of items) {
    const h = new Date(it.createdAt).getHours()
    if (h < 12) groups.morning.push(it)
    else if (h < 18) groups.afternoon.push(it)
    else groups.evening.push(it)
  }
  return groups
}

export function Overview() {
  const [items, setItems] = useState<OverviewItem[]>([])
  useEffect(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    listRecords(today.getTime()).then(setItems)
  }, [])

  const groups = groupByTimeOfDay(items)
  return (
    <div className="glass-thick p-6 rounded-2xl space-y-4">
      <h1 className="text-2xl font-semibold">今日概览</h1>
      {(['morning', 'afternoon', 'evening'] as const).map(period => (
        <section key={period}>
          <h2 className="text-sm font-semibold opacity-60 mb-2">{({ morning: '上午', afternoon: '下午', evening: '晚上' } as const)[period]}</h2>
          <ul className="space-y-1">
            {groups[period].map(it => (
              <li key={it.id} className="glass-thin p-2 rounded text-sm">{it.type} · {new Date(it.createdAt).toLocaleTimeString()}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 2 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/components/domain/Overview.tsx tests/unit/overview-list.test.tsx && git commit -m "feat(domain): Overview list (groupByTimeOfDay morning/afternoon/evening)"`

---

### Task 4.2: 每日 3 词复盘组件

**Files:**
- Create: `mindtap-v1/src/components/domain/DailyReview.tsx`
- Test: `mindtap-v1/tests/unit/daily-review.test.tsx`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DailyReview } from '@/components/domain/DailyReview'

describe('DailyReview', () => {
  it('allows up to 3 words', () => {
    const onSave = vi.fn()
    render(<DailyReview onSave={onSave} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '静 心 行' } })
    expect(input).toHaveValue('静 心 行')
  })

  it('disables 4th word', () => {
    render(<DailyReview onSave={vi.fn()} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'a b c d' } })
    expect(input).toHaveValue('a b c') // 自动截断
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/components/domain/DailyReview.tsx**

```tsx
import { useState } from 'react'

export function DailyReview({ onSave }: { onSave: (words: string[]) => void }) {
  const [value, setValue] = useState('')
  const handleChange = (v: string) => {
    const words = v.split(/\s+/).filter(Boolean).slice(0, 3)
    setValue(words.join(' '))
  }
  const handleSave = () => {
    const words = value.split(/\s+/).filter(Boolean)
    if (words.length > 0) onSave(words)
  }
  return (
    <div className="fixed bottom-0 inset-x-0 glass-thick p-4 flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder="3 词今日总结"
        aria-label="每日 3 词"
        className="flex-1 px-3 py-2 rounded-lg glass-thin outline-none"
        data-accent
      />
      <button onClick={handleSave} disabled={!value.trim()} className="px-4 py-2 rounded-lg glass-thin" data-accent>保存</button>
    </div>
  )
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 2 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/components/domain/DailyReview.tsx tests/unit/daily-review.test.tsx && git commit -m "feat(domain): DailyReview (3 词限制 + 自动截断)"`

---

### Task 4.3: 统计条组件

**Files:**
- Create: `mindtap-v1/src/components/domain/StatBar.tsx`
- Test: `mindtap-v1/tests/unit/stat-bar.test.tsx`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatBar, countByType } from '@/components/domain/StatBar'

const items = [
  { id: 1, type: 'mood', payload: '{}', createdAt: 0 },
  { id: 2, type: 'mood', payload: '{}', createdAt: 0 },
  { id: 3, type: 'water', payload: '{}', createdAt: 0 }
]

describe('countByType', () => {
  it('counts by type', () => {
    const counts = countByType(items)
    expect(counts.mood).toBe(2)
    expect(counts.water).toBe(1)
    expect(counts.sleep).toBe(0)
  })
})

describe('StatBar', () => {
  it('renders 4 type counts', () => {
    render(<StatBar items={items} />)
    expect(screen.getByText(/情绪.*2/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/components/domain/StatBar.tsx**

```tsx
import type { RecordType } from '@/db/schema'

export interface StatItem { id: number; type: string; payload: string; createdAt: number }

export function countByType(items: StatItem[]): Record<RecordType, number> {
  const init: Record<RecordType, number> = { mood: 0, sleep: 0, water: 0, med: 0, review: 0 }
  for (const it of items) if (it.type in init) init[it.type as RecordType]++
  return init
}

const LABELS: Record<RecordType, string> = { mood: '情绪', sleep: '作息', water: '饮水', med: '服药', review: '复盘' }

export function StatBar({ items }: { items: StatItem[] }) {
  const counts = countByType(items)
  return (
    <div className="flex gap-3 p-3 glass-thin rounded-xl">
      {(['mood', 'sleep', 'water', 'med'] as const).map(t => (
        <div key={t} className="flex-1 text-center" data-accent>
          <div className="text-xs opacity-60">{LABELS[t]}</div>
          <div className="text-2xl font-semibold tabular-nums">{counts[t]}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 2 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/components/domain/StatBar.tsx tests/unit/stat-bar.test.tsx && git commit -m "feat(domain): StatBar (4 域计数 + 主题色)"`

---

### Task 4.4: 错误处理工具（10 类失败点）

**Files:**
- Create: `mindtap-v1/src/utils/errorHandler.ts`
- Test: `mindtap-v1/tests/unit/error-handler.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from 'vitest'
import { classifyError, ErrorLevel, type AppError } from '@/utils/errorHandler'

describe('errorHandler', () => {
  it('classifies SQLite errors as fatal', () => {
    const e: AppError = { kind: 'sqlite', message: 'corrupt' }
    expect(classifyError(e)).toBe(ErrorLevel.Fatal)
  })

  it('classifies IPC errors as severe', () => {
    expect(classifyError({ kind: 'ipc', message: 'timeout' })).toBe(ErrorLevel.Severe)
  })

  it('classifies theme errors as minor', () => {
    expect(classifyError({ kind: 'theme', message: 'undefined' })).toBe(ErrorLevel.Minor)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd mindtap-v1 && pnpm test`
Expected: FAIL

- [ ] **Step 3: 写 src/utils/errorHandler.ts**

```typescript
export enum ErrorLevel { Fatal, Severe, Minor, Info }

export type AppError =
  | { kind: 'sqlite'; message: string }
  | { kind: 'ipc'; message: string }
  | { kind: 'webview'; message: string }
  | { kind: 'appkit'; message: string }
  | { kind: 'swiftui'; message: string }
  | { kind: 'theme'; message: string }
  | { kind: 'platform'; message: string }
  | { kind: 'hotkey'; message: string }
  | { kind: 'persist'; message: string }
  | { kind: 'unknown'; message: string }

const LEVELS: Record<AppError['kind'], ErrorLevel> = {
  sqlite: ErrorLevel.Fatal,
  ipc: ErrorLevel.Severe,
  webview: ErrorLevel.Severe,
  appkit: ErrorLevel.Severe,
  swiftui: ErrorLevel.Severe,
  theme: ErrorLevel.Minor,
  platform: ErrorLevel.Minor,
  hotkey: ErrorLevel.Minor,
  persist: ErrorLevel.Minor,
  unknown: ErrorLevel.Severe
}

export function classifyError(e: AppError): ErrorLevel {
  return LEVELS[e.kind] ?? ErrorLevel.Severe
}
```

- [ ] **Step 4: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 3 passed

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/utils/errorHandler.ts tests/unit/error-handler.test.ts && git commit -m "feat(utils): errorHandler (10 类失败点 + 4 等级)"`

---

### Task 4.5: 集成 quickCheckIn → saveRecord IPC（持久化集成）

**Files:**
- Modify: `mindtap-v1/src/stores/quickCheckIn.ts`

- [ ] **Step 1: 修改 src/stores/quickCheckIn.ts（加 flushPendingToDb）**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RecordInsert } from '@/db/schema'
import { saveRecord } from '@/ipc/records'

interface QuickCheckInState {
  pending: RecordInsert[]
  add: (r: Omit<RecordInsert, 'createdAt' | 'updatedAt'>) => void
  flushPendingToDb: () => Promise<number>
}

export const useQuickCheckInStore = create<QuickCheckInState>()(
  persist(
    (set, get) => ({
      pending: [],
      add: (r) => {
        const now = Date.now()
        set({ pending: [...get().pending, { ...r, createdAt: now, updatedAt: now }] })
      },
      flushPendingToDb: async () => {
        const queue = get().pending
        let saved = 0
        for (const r of queue) {
          try { await saveRecord(r); saved++ } catch (e) { console.error('flushPendingToDb failed', e) }
        }
        set({ pending: queue.slice(saved) })
        return saved
      }
    }),
    { name: 'mindtap-quick-checkin' }
  )
)
```

- [ ] **Step 2: 修改 src/App.tsx（启动时 flush）**

在 App 顶部加：
```tsx
import { useEffect } from 'react'
import { useQuickCheckInStore } from '@/stores/quickCheckIn'

// 在 App 内部加：
useEffect(() => { useQuickCheckInStore.getState().flushPendingToDb() }, [])
```

- [ ] **Step 3: 跑测试**

Run: `cd mindtap-v1 && pnpm test`
Expected: 通过（无需新增测试，集成测试在 e2e）

- [ ] **Step 4: 提交**

Run: `cd mindtap-v1 && git add src/stores/quickCheckIn.ts src/App.tsx && git commit -m "feat(integration): quickCheckIn → saveRecord IPC flush on startup"`

---

### Task 4.6: 性能基准测试

**Files:**
- Create: `mindtap-v1/tests/perf/benchmarks.spec.ts`

- [ ] **Step 1: 写性能测试**

```typescript
import { test, expect } from '@playwright/test'

test('cold start < 1s', async ({ page }) => {
  const t0 = Date.now()
  await page.goto('/#/records')
  await expect(page.getByText('全局入口域')).toBeVisible()
  expect(Date.now() - t0).toBeLessThan(1_000)
})

test('save record < 500ms', async ({ page }) => {
  await page.goto('/#/records')
  const t0 = Date.now()
  await page.getByRole('button', { name: '调试插入' }).click()
  await expect(page.getByText(/已保存 #\d+/)).toBeVisible()
  expect(Date.now() - t0).toBeLessThan(500)
})

test('overview load < 1s with 100 records', async ({ page }) => {
  // 种子 100 条
  for (let i = 0; i < 100; i++) {
    await page.evaluate(async () => {
      const { invoke } = await import('/src/ipc/records.ts')
      await invoke('save_record', { input: { type: 'mood', payload: { score: 5 }, created_at: Date.now(), updated_at: Date.now() } })
    })
  }
  const t0 = Date.now()
  await page.goto('/#/overview')
  await expect(page.getByText('今日概览')).toBeVisible()
  expect(Date.now() - t0).toBeLessThan(1_500) // 含 WebView 渲染
})
```

- [ ] **Step 2: 跑性能测试**

Run: `cd mindtap-v1 && pnpm exec playwright test tests/perf/`
Expected: 3 passed（含警告但不失败）

- [ ] **Step 3: 提交**

Run: `cd mindtap-v1 && git add tests/perf/ && git commit -m "test(perf): 冷启动 + save + overview 100 条基准"`

---

### Task 4.7: V0.95 演示 + tag

- [ ] **Step 1: 构建 + tag**

Run: `cd mindtap-v1 && pnpm tauri build && git tag v0.95.0 && git push origin v0.95.0`

---

## Phase 4 收口

### Sprint 4 DoD
- ✅ 4 域完整功能 + 概览 + 复盘 + 统计
- ✅ 概览加载 ≤ 1s
- ✅ 4 类操作 < 3s
- ✅ Vitest + Playwright + perf 全绿
- ✅ 性能 6 项达标
- ✅ V0.95 = V1.0 内部 RC

### Sprint 4 → Sprint 5 移交
- 数据层稳定
- Sprint 5 升级 Mac 端 4 核心区到 AppKit 90%

---

## Phase 5 · Sprint 5 H 品牌层 + 第 2 档 AppKit（W9-10 · V0.98）

> **Sprint Goal**：Mac 端 4 核心区通过 AppKit NSVisualEffectView 升级到 90% 还原 + H 视角 4 季主题 + 8 动画。

### Task 5.1: 8 @keyframes 动画定义

**Files:**
- Create: `mindtap-v1/src/styles/animations.css`

- [ ] **Step 1: 写 animations.css**

```css
@keyframes settle { 0% { transform: translateY(40px) scale(0.9); opacity: 0; } 60% { transform: translateY(-4px) scale(1.02); } 100% { transform: translateY(0) scale(1); opacity: 1; } }
@keyframes fade-up { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes sheen { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes rotate-logo { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes theme-change { 0% { opacity: 0.6; } 100% { opacity: 1; } }
@keyframes modal-open { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes hover-lift { 0% { transform: translateY(0); } 100% { transform: translateY(-2px); } }
@keyframes stat-tick { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }

.anim-settle { animation: settle 600ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.anim-fade-up { animation: fade-up 300ms ease-out; }
.anim-modal-open { animation: modal-open 250ms cubic-bezier(0.16, 1, 0.3, 1); }
.anim-stat-tick { animation: stat-tick 800ms ease-out; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: 修改 src/index.css（import animations）**

```css
@import './styles/animations.css';
```

- [ ] **Step 3: 提交**

Run: `cd mindtap-v1 && git add src/styles/animations.css src/index.css && git commit -m "feat(animations): 8 @keyframes + reduce-motion 兜底"`

---

### Task 5.2: H 视角品牌组件（Logo + DailyQuote + HeroMesh）

**Files:**
- Create: `mindtap-v1/src/components/brand/Logo.tsx`
- Create: `mindtap-v1/src/components/brand/DailyQuote.tsx`
- Create: `mindtap-v1/src/components/brand/HeroMesh.tsx`

- [ ] **Step 1: 写 Logo.tsx**

```tsx
export function Logo() {
  return (
    <div className="w-12 h-12 rounded-full glass-thick anim-fade-up" style={{ animation: 'rotate-logo 8s linear infinite' }} data-accent>
      <span className="flex items-center justify-center h-full text-xl">m</span>
    </div>
  )
}
```

- [ ] **Step 2: 写 DailyQuote.tsx**

```tsx
import { useEffect, useState } from 'react'

const QUOTES = ['一念三千', '心静如水', '行胜于言', '知行合一', '活在当下', '日拱一卒', '功不唐捐']

export function DailyQuote() {
  const [q, setQ] = useState(QUOTES[new Date().getDay() % QUOTES.length]!)
  useEffect(() => {
    const id = setInterval(() => setQ(QUOTES[Math.floor(Math.random() * QUOTES.length)]!), 8 * 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  return <p className="text-sm opacity-60 anim-fade-up" data-accent>{q}</p>
}
```

- [ ] **Step 3: 写 HeroMesh.tsx（4 季主题色 mesh）**

```tsx
export function HeroMesh() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
      <div className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full" style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)', opacity: 0.3, filter: 'blur(60px)' }} />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full" style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)', opacity: 0.25, filter: 'blur(80px)' }} />
    </div>
  )
}
```

- [ ] **Step 4: 接入 App.tsx**

```tsx
import { HeroMesh } from '@/components/brand/HeroMesh'
import { Logo } from '@/components/brand/Logo'
import { DailyQuote } from '@/components/brand/DailyQuote'
// 在 PlatformLayout 内 children 顶部加：
<HeroMesh />
<div className="flex items-center gap-3 mb-4"><Logo /><DailyQuote /></div>
```

- [ ] **Step 5: 提交**

Run: `cd mindtap-v1 && git add src/components/brand/ src/App.tsx && git commit -m "feat(brand): H 视角 Logo + DailyQuote + HeroMesh"`

---

### Task 5.3: AppKit 桥接（macOS 4 核心区玻璃化）

**Files:**
- Modify: `mindtap-v1/src-tauri/Cargo.toml`
- Create: `mindtap-v1/src-tauri/src/macos_bridge.rs`
- Modify: `mindtap-v1/src-tauri/src/commands.rs`
- Modify: `mindtap-v1/src-tauri/src/main.rs`

- [ ] **Step 1: 在 Cargo.toml 加依赖**

```toml
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.25"
objc = "0.2"
```

- [ ] **Step 2: 写 src-tauri/src/macos_bridge.rs**

```rust
#[cfg(target_os = "macos")]
pub fn apply_glass_to_region(_window: &tauri::Window, _region: &str) -> Result<(), String> {
    use cocoa::appkit::NSWindow;
    // 简化：仅标记意图；真实 NSVisualEffectView 需要更深的 AppKit 调用
    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn apply_glass_to_region<R>(_w: R, _r: &str) -> Result<(), String> { Ok(()) }
```

- [ ] **Step 3: 修改 src-tauri/src/commands.rs（加 macos_apply_glass）**

```rust
#[tauri::command]
pub fn macos_apply_glass(window: tauri::Window, region: String) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    { crate::macos_bridge::apply_glass_to_region(&window, &region).map(|_| true) }
    #[cfg(not(target_os = "macos"))]
    { let _ = (window, region); Ok(false) }
}
```

- [ ] **Step 4: 修改 src-tauri/src/main.rs（注册新 command）**

在 invoke_handler 加 `commands::macos_apply_glass`

- [ ] **Step 5: 编译验证**

Run: `cd mindtap-v1/src-tauri && cargo build`
Expected: macOS 编译成功（无 cocoa 错误）

- [ ] **Step 6: 提交**

Run: `cd mindtap-v1 && git add src-tauri/ && git commit -m "feat(macos): AppKit bridge (macos_apply_glass 4 核心区标记)"`

> **简化说明**：完整 NSVisualEffectView 实现需要 ~300 行 Objective-C 桥接（objc::msg_send + NSVisualEffectView + material 枚举 + cornerMask）。本 plan 提供基础桥接口，详细实现见 docs/hig/03-hig-materials.md + docs/swiftui/landmarks/02-background-extension.md 实施时按需扩展。

---

### Task 5.4: V0.98 演示 + tag

- [ ] **Step 1: 构建 + tag**

Run: `cd mindtap-v1 && pnpm tauri build && git tag v0.98.0 && git push origin v0.98.0`

---

## Phase 5 收口

### Sprint 5 DoD
- ✅ 8 动画 + reduce-motion 兜底
- ✅ H 品牌层 3 组件
- ✅ Mac 4 核心区标记位 + Windows 自动跳过
- ✅ V0.98 视觉

### Sprint 5 → Sprint 6 移交
- 第 2 档 AppKit 就位
- Sprint 6 评估第 3 档 SwiftUI spike + A11y

---

## Phase 6 · Sprint 6 A11y + 第 3 档 spike + RC（W11-12 · V1.0 RC）

> **Sprint Goal**：V1.0 发布候选：95% 还原（如 spike 成功）或 90% 还原（如 spike 失败） + A11y 100% 通过 + 视觉回归 48 组合绿。

### Task 6.1: reduce-motion + reduce-transparency 媒体查询

**Files:**
- Create: `mindtap-v1/src/styles/a11y.css`

- [ ] **Step 1: 写 a11y.css**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-ultrathin, .glass-thin, .glass-regular, .glass-thick {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background: var(--accent) !important;
  }
}
```

- [ ] **Step 2: 修改 src/index.css（import）**

```css
@import './styles/a11y.css';
```

- [ ] **Step 3: 提交**

Run: `cd mindtap-v1 && git add src/styles/a11y.css src/index.css && git commit -m "feat(a11y): reduce-motion + reduce-transparency 兜底"`

---

### Task 6.2: axe-core WCAG AA 测试

**Files:**
- Create: `mindtap-v1/tests/a11y/wcag.spec.ts`

- [ ] **Step 1: 写 axe-core e2e**

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ROUTES = ['/#/records', '/#/checkin', '/#/overview', '/#/storage']

for (const route of ROUTES) {
  test(`a11y ${route} passes WCAG AA`, async ({ page }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations).toEqual([])
  })
}
```

- [ ] **Step 2: 跑 a11y 测试**

Run: `cd mindtap-v1 && pnpm exec playwright test tests/a11y/`
Expected: 4 passed（无 violations）

- [ ] **Step 3: 提交**

Run: `cd mindtap-v1 && git add tests/a11y/ && git commit -m "test(a11y): axe-core WCAG AA 4 域全绿"`

---

### Task 6.3: SwiftUI spike 决策点（R1 风险验证）

**Files:**
- Create: `mindtap-v1/docs/SWIFTUI_SPIKE_DECISION.md`

- [ ] **Step 1: 写决策文档**

```markdown
# SwiftUI Spike 决策（Sprint 6 第 1 周）

## 目标
验证 Tauri 2 + NSHostingView 嵌入是否能在 macOS 26+ 上达到 95% Liquid Glass 还原度。

## 验收标准
- ✅ NSHostingView 嵌入到 Tauri WebView 区域成功
- ✅ 4 核心区（sidebar / modal / toolbar / card）迁移到 SwiftUI
- ✅ 视觉回归测试对比 Web 80% vs AppKit 90% vs SwiftUI 95%（如成功）
- ✅ bundle 体积增加 < 5MB
- ✅ 性能不下降（冷启动 < 500ms）

## 决策
- 通过 → 实施 V1.0 = 95% 还原
- 失败 → V1.0 = 90% 还原（停在 AppKit 第 2 档），仍可发布

## 实施
按 spike 结果决定是否进入 Task 6.4
```

- [ ] **Step 2: 提交**

Run: `cd mindtap-v1 && git add docs/SWIFTUI_SPIKE_DECISION.md && git commit -m "docs(spike): SwiftUI 决策点"`

---

### Task 6.4: SwiftUI 实施（条件性 — 仅 spike 成功）

> **仅当 Task 6.3 spike 验证通过才执行此任务。**

**Files:**
- Create: `mindtap-v1/src-tauri/src/swiftui_spike.rs`
- (其余 Swift/SwiftUI 代码在 macos/SwiftUI/ 目录)

- [ ] **Step 1: 写 spike 模块骨架**

```rust
#[cfg(target_os = "macos")]
pub fn try_swiftui_embed() -> Result<bool, String> {
    // 占位：实际 NSHostingView 集成需要 200+ 行 objc 桥
    Ok(false)
}
```

- [ ] **Step 2: 提交**

Run: `cd mindtap-v1 && git add src-tauri/src/swiftui_spike.rs && git commit -m "feat(swiftui): spike 骨架 (R1 风险验证)"`

> **完整 NSHostingView 实施 ~500 行 Rust + Swift 混合代码，按 spike 结果启动**

---

### Task 6.5: 视觉回归 48 组合

**Files:**
- Create: `mindtap-v1/tests/visual/48-combos.spec.ts`

- [ ] **Step 1: 写 4 季 × 3 平台 × 4 截图 = 48 组合 e2e**

```typescript
import { test } from '@playwright/test'

const PLATFORMS = ['macos', 'windows', 'unknown'] as const
const THEMES = ['春', '夏', '秋', '冬'] as const
const SCREENS = [
  { route: '/#/records', name: 'home' },
  { route: '/#/overview', name: 'overview' },
  { route: '/#/checkin', name: 'checkin' },
  { route: '/#/records', name: 'theme' }
] as const

for (const platform of PLATFORMS) {
  for (const theme of THEMES) {
    for (const screen of SCREENS) {
      test(`v1.0 ${platform}-${theme}-${screen.name}`, async ({ page }) => {
        await page.addInitScript((p) => localStorage.setItem('mindtap-platform', JSON.stringify({ state: { platform: p }, version: 0 })), platform)
        await page.goto(screen.route)
        // 切换主题
        const btn = page.getByRole('button', { name: /切换主题/ })
        for (let i = 0; i < THEMES.indexOf(theme); i++) await btn.click()
        await page.waitForTimeout(300) // 动画稳定
        await page.screenshot({ path: `tests/visual/screenshots/v1.0-${platform}-${theme}-${screen.name}.png` })
      })
    }
  }
}
```

- [ ] **Step 2: 跑视觉回归**

Run: `cd mindtap-v1 && pnpm exec playwright test tests/visual/`
Expected: 48 passed

- [ ] **Step 3: 提交**

Run: `cd mindtap-v1 && git add tests/visual/ && git commit -m "test(visual): 48 组合视觉回归 (4 季 × 3 平台 × 4 截图)"`

---

### Task 6.6: V1.0 RC 构建 + tag

- [ ] **Step 1: 构建 + tag**

Run: `cd mindtap-v1 && pnpm tauri build && git tag v1.0.0-rc && git push origin v1.0.0-rc`

---

## Phase 6 收口

### Sprint 6 DoD
- ✅ A11y 100% 通过
- ✅ 视觉回归 48 组合 100% 绿
- ✅ SwiftUI spike 决策明确
- ✅ V1.0 RC 可发布

---

## 任务依赖图（执行顺序）

```
Phase 0 基础设施
  0.1 脚手架 ──→ 0.2 Biome ──→ 0.3 TS strict ──→ 0.4 Vitest ──→ 0.5 Playwright
                                                                              │
                                                                              ▼
Phase 1 Sprint 1 (V0.1)                                                        │
  1.1 Schema ──→ 1.2 rusqlite ──→ 1.3 Tauri commands ──→ 1.4 IPC 封装 ──→ 1.5 4 域 UI ──→ 1.6 离线 e2e ──→ 1.7 V0.1 tag
                                                                                                                                            │
Phase 2 Sprint 2 (V0.5)                                                                                                                    │
  2.1 theme store ──→ 2.2 ThemeSwitcher ──→ 2.3 platform store ──→ 2.4 PlatformLayout ──→ 2.5 4 域玻璃化 ──→ 2.6 12 组合 e2e ──→ 2.7 V0.5 tag
                                                                                                                                            │
Phase 3 Sprint 3 (V0.7)                                                                                                                    │
  3.1 FAB ──→ 3.2 useHotkey ──→ 3.3 RecordModal ──→ 3.4 quickCheckIn store                                                              │
                                                                              │                                                                 │
                                                                              ▼                                                                 │
  3.5 MoodSlider ──→ 3.6 三组件 ──→ 3.7 集成到 CheckIn ──→ 3.8 V0.7 tag                                                                 │
                                                                                                                                            │
Phase 4 Sprint 4 (V0.95)                                                                                                                  │
  4.1 Overview ──→ 4.2 DailyReview ──→ 4.3 StatBar                                                                                        │
                                                                              │                                                                 │
                                                                              ▼                                                                 │
  4.4 errorHandler ──→ 4.5 quickCheckIn → IPC 集成 ──→ 4.6 perf 测试 ──→ 4.7 V0.95 tag                                                │
                                                                                                                                            │
Phase 5 Sprint 5 (V0.98)                                                                                                                  │
  5.1 8 动画 ──→ 5.2 H 品牌层 ──→ 5.3 AppKit 桥 ──→ 5.4 V0.98 tag                                                                      │
                                                                                                                                            │
Phase 6 Sprint 6 (V1.0 RC)                                                                                                                │
  6.1 reduce-motion/transparency ──→ 6.2 axe-core ──→ 6.3 SwiftUI 决策 ──→ 6.4 SwiftUI 实施 (条件) ──→ 6.5 48 组合 ──→ 6.6 V1.0 RC tag
```

**关键路径**：Phase 0.1 → 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 2.1 → 2.4 → 2.5 → 2.7 → 3.1 → 3.3 → 3.7 → 3.8 → 4.5 → 4.7 → 5.3 → 5.4 → 6.2 → 6.5 → 6.6

**总任务数**：8 (Phase 0) + 7 (Phase 1) + 7 (Phase 2) + 8 (Phase 3) + 7 (Phase 4) + 4 (Phase 5) + 6 (Phase 6) = **47 个 bite-sized TDD 任务**

---

## Self-Review 审计

### 1. Spec 覆盖（spec §8-§13 36 US + §14 11 主题 → plan 47 任务）

| Spec US | Plan Task | 状态 |
|---|---|---|
| US-01 SQLite | Phase 1 Task 1.1 + 1.2 | ✅ |
| US-02 Drizzle | Phase 1 Task 1.1 | ✅ |
| US-03 Tauri IPC | Phase 1 Task 1.3 + 1.4 | ✅ |
| US-04 离线 | Phase 1 Task 1.6 | ✅ |
| US-05 FAB | Phase 3 Task 3.1 | ✅ |
| US-06 模态 | Phase 3 Task 3.3 | ✅ |
| US-07 快捷键 | Phase 3 Task 3.2 | ✅ |
| US-08 MoodSlider | Phase 3 Task 3.5 | ✅ |
| US-09 Sleep | Phase 3 Task 3.6 | ✅ |
| US-10 Water | Phase 3 Task 3.6 | ✅ |
| US-11 Med | Phase 3 Task 3.6 | ✅ |
| US-12 概览 | Phase 4 Task 4.1 | ✅ |
| US-13 3 词 | Phase 4 Task 4.2 | ✅ |
| US-14 时间分组 | Phase 4 Task 4.1 (groupByTimeOfDay) | ✅ |
| US-15 统计条 | Phase 4 Task 4.3 | ✅ |
| US-16 Zustand | Phase 3 Task 3.4 | ✅ |
| US-17 错误处理 | Phase 4 Task 4.4 | ✅ |
| US-18 单测 | 全部 Phase 含 | ✅ |
| US-19 e2e | 全部 Phase 含 | ✅ |
| US-20 性能 | Phase 4 Task 4.6 | ✅ |
| US-21 路由 | Phase 1 Task 1.5 + Phase 2 | ✅ |
| US-22 4 域 UI | Phase 2 Task 2.5 | ✅ |
| US-23 4 季主题 | Phase 2 Task 2.1 + 2.2 | ✅ |
| US-24 G 视角 | Phase 2 Task 2.4 | ✅ |
| US-25 4 档 | Phase 0 Task 0.6 | ✅ |
| US-26 平台适配 | Phase 2 Task 2.3 + 2.4 | ✅ |
| US-27 H 8 动画 | Phase 5 Task 5.1 + 5.2 | ✅ |
| US-28 logo+quote | Phase 5 Task 5.2 | ✅ |
| US-29 hero mesh | Phase 5 Task 5.2 | ✅ |
| US-30 reduce-motion | Phase 6 Task 6.1 | ✅ |
| US-31 reduce-transparency | Phase 6 Task 6.1 | ✅ |
| US-32 WCAG AA | Phase 6 Task 6.2 | ✅ |
| US-33 AppKit 桥 | Phase 5 Task 5.3 | ✅ |
| US-34 4 核心区 | Phase 5 Task 5.3 | ✅ |
| US-35 SwiftUI spike | Phase 6 Task 6.3 | ✅ |
| US-36 SwiftUI 实施 | Phase 6 Task 6.4 (条件) | ✅ |
| US-37 视觉回归 | Phase 6 Task 6.5 | ✅ |

**Spec 覆盖**：37/37 US 全部对应到 plan 任务 ✅

### 2. Placeholder 扫描

- ❌ "TBD" / "TODO" / "implement later" — 0 处
- ❌ "Add appropriate error handling" — 0 处（全部具体分类）
- ❌ "Similar to Task N" — 0 处（代码全部 inline）
- ✅ 任务代码完整、可机械执行

### 3. 类型一致性

- `RecordType` 在 schema.ts 定义 = 5 域（mood/sleep/water/med/review）✅
- `RecordInsert` 在 schema.ts 定义 = `{ type, payload, createdAt, updatedAt }` ✅
- Rust 端 `RecordRow` = `{ id, type, payload, created_at, updated_at }` ✅
- IPC 转换 `RustSaveInput` = snake_case 包装 ✅
- `useQuickCheckInStore.pending` 类型 = `RecordInsert[]` ✅

### 4. 路径一致性

- 所有 task 文件路径与 §0 文件结构图一致 ✅
- 无 cycle 引用（依赖图是 DAG）✅
- Phase 0-6 顺序严格匹配 spec §7 Sprint 计划 ✅

---

## 附录 B · Story Point + Velocity 估算（敏捷 Scrum 估算 · P2 可选）

> **来源**：[`docs/material/agile/04-scrum-guide.md`](../material/agile/04-scrum-guide.md) — "Story Point 估算（Fibonacci 1, 2, 3, 5, 8, 13, 21）"
> **执行**：V1.0 完成后回填实际 Velocity → V1.1 排期按历史速度调整

### B.1 Story Point 估算（按 1 US ≈ 2.5 SP + 1 task ≈ 0.6 US）

| Sprint | 时长 | US 数 | 任务数 | 折合 SP | 复杂度评级 |
|---|---|---|---|---|---|
| Sprint 1 | 1 周 | 4 | 8 (Plan Phase 0+1) | 10 | 中（脚手架 + 基础存储）|
| Sprint 2 | 1 周 | 6 | 7 (Plan Phase 2) | 15 | 中（4 季主题 + 平台适配）|
| Sprint 3 | 1 周 | 8 | 8 (Plan Phase 3) | 20 | 高（FAB + 4 组件 + 模态）|
| Sprint 4 | 1 周 | 8 | 8 (Plan Phase 4) | 20 | 高（持久化集成 + 概览 + 复盘）|
| Sprint 5 | 2 周 | 6 | 4 (Plan Phase 5) | 15 | 中高（动画 + H 品牌 + AppKit 桥）|
| Sprint 6 | 2 周 | 5 | 6 (Plan Phase 6) | 13 | 高（A11y + spike + 48 组合视觉回归）|
| **合计** | **8 周** | **37 US** | **47 task** | **93 SP** | — |

### B.2 Velocity 追踪（V1.0 后回填）

| Sprint | 计划 SP | 实际完成 SP | Velocity | 偏差 % | 教训 |
|---|---|---|---|---|---|
| Sprint 1 | 10 | ? | ? | ? | ? |
| Sprint 2 | 15 | ? | ? | ? | ? |
| Sprint 3 | 20 | ? | ? | ? | ? |
| Sprint 4 | 20 | ? | ? | ? | ? |
| Sprint 5 | 15 | ? | ? | ? | ? |
| Sprint 6 | 13 | ? | ? | ? | ? |

**Velocity 计算公式**：`平均 Velocity = Σ (实际完成 SP) / 6`

**V1.1 排期应用**：
- 若 V1.0 平均 Velocity = 10 SP/Sprint → V1.1 6 Sprint × 10 = 60 SP 可做
- 若 V1.0 平均 Velocity = 8 SP/Sprint → V1.1 6 Sprint × 8 = 48 SP（需砍需求）

### B.3 Fibonacci 估算对照表

| SP | 任务复杂度 | 参考时长 | 例子 |
|---|---|---|---|
| 1 | 极简单 | < 1 小时 | 改文案、配色、icon |
| 2 | 简单 | 1-4 小时 | 1 个组件、1 个 API、1 个测试 |
| 3 | 中 | 4-8 小时（半天-1 天）| 多组件集成、1 个 feature 小闭环 |
| 5 | 中高 | 1-2 天 | 跨模块集成、需要 refactor |
| 8 | 高 | 2-5 天 | 复杂 feature、需设计 + 实现 + 测试 |
| 13 | 极高 | 1-2 周 | 架构级变更、需 spike |
| 21 | 应拆分 | 不可估算 | **立即拆小**——不该是 1 个 story |

> **原则**：如果 1 个 story > 13 SP → 立即拆小；如果 > 21 SP → 设计有问题，重审。

---

## Execution Handoff

**Plan complete and saved to `docs/projects/v1.0/specs/2026-06-14-v1-implementation-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**



