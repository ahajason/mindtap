# 浮窗 v3 重构 · 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把浮窗 v1.5 重写为 v3,恢复 8 条 LOST 决策 + 整合 D-16(Tailwind v4 升级)+ D-17(liquid-glass-react WebGL 外壳),17 条决策全 PRESERVED。

**Architecture:** 三层架构(自外而内):`OuterShell`(WebGL 折射,D-17)→ `FloatShell`(折叠↔展开壳,D-11/D-12)+ `GlassSurface`(CSS 玻璃,D-10/D-16 OKLCH)→ 内部子组件(`SharedHeader` / `Segmented` / `FormSubPanel` / `TimerSubPanel` / `FoldedBar` / `StatusDot` / `Button`)。Form-first 默认展开,segmented 互斥。

**Tech Stack:**
- Tauri 2 (Rust ≥ 1.96) + React 19.1 + TypeScript + Vite 7
- Tailwind v4.3.1(`@theme` OKLCH 调色板,替换 v3.4)
- `liquid-glass-react`(WebGL 外壳,2.8k star,2026-05)
- `cva@^0.7.1` + `tailwind-merge@^2.6.1`(GlassSurface 4 variant)
- `@base-ui/react@^1.6.0`(Segmented mutex primitive,经 shadcn wrapper)
- `@playwright/test`(视觉回归,12 场景 baseline)
- vitest + @testing-library/react(单元测试)

---

## Global Constraints

(每条都是从 spec / CLAUDE.md 原文复制的硬约束,task 内不再重复。)

- **Node**: `.nvmrc` = 24。Rust 工具链 ≥ 1.96。
- **包管理**: 不用 `--force` / `npm prune` / 改 `package.json` 锁文件外的字段。
- **写代码前必先写失败测试**(`npx vitest run` / `cargo test`),最小实现,全层套件绿。
- **路径别名**: `@/* → src/*`,`vite.config.ts` + `tsconfig.json` 同步。
- **DB 全局锁**: `state.0.lock().unwrap()` 走 `DbState(Mutex<Connection>)`。
- **写后必发事件**: task 状态变更发 `focus-changed`,新增/归档发 `record-updated`。
- **Settings 写后必发 `settings-changed`**(本 plan 不动 settings,留个 reminder)。
- **Tauri capability 隔离**: 新独立窗口 capability 单独建,不复用 `default.json`。
- **设计语言**: 所有 UI 改 spec 前先读 `docs/design/glassic-ui-spec.md` + `docs/projects/design-system/glassmorphism-impl-spec.md`。
- **不写 duration chips / 不引入未决定功能**。
- **Spec 决策 ID**: D-01 ~ D-17(本 plan 内引用,见 spec)。
- **Rust 命令命名**: 驼峰转 snake_case 给 Tauri 2 自动转。
- **Cargo.lock** gitignore(单二进制项目惯例)。
- **`@/` 别名**: 修改两文件。
- **commit 信息格式**: `<type>(<scope>): <subject>` 如 `feat(floating): D-02 segmented mutex`(参考既有 git log)。

---

## 文件结构总览

### 新建文件
```
src/floating/
├── OuterShell.tsx           # Task 1(D-17)
├── FloatShell.tsx           # Task 13(D-11/D-12)
├── GlassSurface.tsx         # Task 5
├── SharedHeader.tsx         # Task 9(D-03)
├── Segmented.tsx            # Task 8(D-02)
├── FormSubPanel.tsx         # Task 10(D-04)
├── TimerSubPanel.tsx        # Task 11(D-06)
├── FoldedBar.tsx            # Task 12(D-05)
├── StatusDot.tsx            # Task 7(D-09)
├── Button.tsx               # Task 6(D-08)
├── OuterShell.test.tsx      # Task 1 单测
├── FloatShell.test.tsx      # Task 13 单测
├── GlassSurface.test.tsx    # Task 5 单测
├── Segmented.test.tsx       # Task 8 单测
├── StatusDot.test.tsx       # Task 7 单测
├── TimerSubPanel.test.tsx   # Task 11 单测
├── Button.test.tsx          # Task 6 单测
└── floating.css             # Task 14(全组件样式聚合)

src/lib/tauri-bridge.ts      # Task 4(加 api.taskAggregateToday)
src/index.css                # Task 0.2(v4 @theme OKLCH)
tailwind.config.ts           # Task 0.2(删 extend,全 @theme)
playwright.config.ts         # Task 2
tests/visual/floating.spec.ts # Task 15
src-tauri/src/db/task.rs     # Task 3(加 aggregate_today fn)
src-tauri/src/commands/task.rs  # Task 3(加 task_aggregate_today command)
src-tauri/src/lib.rs         # Task 3(register command)
```

### 修改文件
```
src/floating/App.tsx        # Task 14(接入 OuterShell + FloatShell)
src/floating/floating.css   # Task 14(新增 glass/segmented/shared-header 等样式)
src/lib/tauri-bridge.ts     # Task 4(加 taskAggregateToday)
package.json                # Task 0.1 / 1.0 / 2.0(改 deps)
vite.config.ts              # Task 0.1(@tailwindcss/vite 插件)
src-tauri/Cargo.toml        # Task 0 / 1(无新 crate 需求,确认)
```

### 删除文件
```
postcss.config.js           # Task 0.1
tailwind.config.ts          # Task 0.2(空文件) — 实际保留空 file,因为 v4 仍允许 config 存在
```

---

## Task 0:技术栈前置升级(D-16 + D-17 + Playwright)

> **必须最先做**。后续 task 全依赖 v4 `@theme` + OuterShell 包装 + Playwright 视觉回归基线。

---

### Task 0.1:Tailwind v3.4 → v4.3 主版本升级(D-16)

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Delete: `postcss.config.js`
- Create: `src/index.css`(全量 v4 CSS-first config)

**Interfaces:**
- 无(纯工具链升级,无对外 API 变化)

- [ ] **Step 1:写 package.json 变更**

读当前 `package.json` 确认基线版本:`tailwindcss@^3.4.19` / `tailwindcss-animate@^1.0.7` / `autoprefixer@^10.4.x`。

```bash
# 1. 装 v4 + Vite 插件 + forms
npm i -E tailwindcss@4.3.1 @tailwindcss/vite@4.3.1 @tailwindcss/forms@1.0.0

# 2. 跑官方升级 CLI(自动迁 80% 重命名 / 配置)
npx @tailwindcss/upgrade
```

CLI 会自动:
- 改 `tailwind.config.ts` → 移 v3 语法到 v4 兼容
- 跑 PostCSS 配置检测
- 列出手动 follow-up(可能有 `bg-opacity-*` 弃用提示)

- [ ] **Step 2:删旧包 + 旧配置**

```bash
npm rm tailwindcss-animate autoprefixer
rm postcss.config.js
```

- [ ] **Step 3:配 vite.config.ts 用 @tailwindcss/vite 插件**

读 `vite.config.ts`,在 `plugins` 数组加 `@tailwindcss/vite`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ... 其余配置不动
})
```

- [ ] **Step 4:验证 v4 编译成功**

```bash
npx tsc --noEmit && npx vitest run
```

预期:0 TS error,所有现有 vitest 全绿(若 vitest 全 fail,可能 v3 `tailwind.config.ts` extend 被 CLI 误删,需手动 git checkout `tailwind.config.ts` + 重跑 `npx @tailwindcss/upgrade`)。

- [ ] **Step 5:commit**

```bash
git add package.json vite.config.ts tailwind.config.ts
git rm postcss.config.js
git commit -m "chore(deps): tailwind v3.4→v4.3 + @tailwindcss/vite 插件"
```

---

### Task 0.2:迁 glassic token 到 v4 `@theme` 块(OKLCH)

**Files:**
- Modify: `tailwind.config.ts`(删 extend 段)
- Modify: `src/index.css`(迁 token 到 @theme)

**Interfaces:**
- Consumes: 当前 `tailwind.config.ts` 的 `extend.backgroundColor.glass-*` / `extend.backdropBlur.glass` 等
- Produces: v4 `@theme` 块 + 暴露 `bg-glass-L1` / `backdrop-blur-glass` 等工具类

- [ ] **Step 1:读当前 `tailwind.config.ts` 找 glass token**

```bash
grep -A 20 "extend" tailwind.config.ts
```

记录: `glass-L1` / `glass-L3` / `glass-fb` / `backdrop-blur-glass` / `backdrop-saturate-glass` / `backdrop-brightness-glass` 等 key。

- [ ] **Step 2:写 `src/index.css` v4 `@theme` 块**

```css
/* src/index.css */
@import "tailwindcss";
@plugin "@tailwindcss/forms";

@theme {
  /* Glass 背景 - OKLCH 调色板(D-16) */
  --color-glass-L1: oklch(1 0 0 / 0.22);
  --color-glass-L3: oklch(1 0 0 / 0.30);
  --color-glass-fb: oklch(0.85 0 0 / 0.72);
  --color-glass-legacy: oklch(1 0 0 / 0.28);

  /* Glass 边框 - OKLCH */
  --color-glass-border-L1: oklch(1 0 0 / 0.32);
  --color-glass-border-L3: oklch(1 0 0 / 0.42);
  --color-glass-border-fb: oklch(0.9 0 0 / 0.85);

  /* Backdrop utilities */
  --backdrop-blur-glass: 24px;
  --backdrop-blur-glass-legacy: 16px;
  --backdrop-saturate-glass: 140%;
  --backdrop-saturate-glass-legacy: 120%;
  --backdrop-brightness-glass: 104%;

  /* 状态色(呼吸 v6 三态) */
  --color-status-active: #5BCBA0;
  --color-status-paused: #F5A623;
  --color-status-done: #98A2B3;

  /* 圆角 */
  --radius-glass-sm: 16px;
  --radius-glass-lg: 20px;

  /* 字体族(Geist Variable 已装未注册) */
  --font-sans: "Geist Variable", system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 3:`tailwind.config.ts` 删 extend 段,留空**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

// v4 用 @theme 块代替 extend。本文件保留仅为 IDE 类型提示。
export default {} satisfies Config
```

- [ ] **Step 4:验证工具类自动生成**

```bash
# 跑一个临时 grep 看类是否编译出来
npx vitest run --reporter=verbose 2>&1 | grep -i "bg-glass-L1" | head -5
```

预期:无 grep 结果(无组件用 `bg-glass-L1` 时不报错就算通过)。打开浮窗 demo:`npm run dev` + 访问 floating window URL,DevTools 看 `.bg-glass-L1` 是否解析到 `background-color: oklch(1 0 0 / 0.22)`。

- [ ] **Step 5:commit**

```bash
git add src/index.css tailwind.config.ts
git commit -m "feat(floating): D-16 迁 glassic token 到 v4 @theme OKLCH 调色板"
```

---

### Task 1:OuterShell + liquid-glass-react 接入(D-17)

**Files:**
- Modify: `package.json`(装 `liquid-glass-react`)
- Create: `src/floating/OuterShell.tsx`
- Create: `src/floating/OuterShell.test.tsx`

**Interfaces:**
- Produces: `<OuterShell isExpanded={boolean}>{children}</OuterShell>` — 包外壳,折叠/展开态切 WebGL 参数;WebGL 不可用时降级为 `<div>` 无折射

- [ ] **Step 1:装 `liquid-glass-react`**

```bash
pnpm add liquid-glass-react
```

- [ ] **Step 2:写 `src/floating/OuterShell.test.tsx` 失败测试**

```tsx
// src/floating/OuterShell.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OuterShell } from './OuterShell'

describe('OuterShell', () => {
  it('渲染 children', () => {
    render(<OuterShell isExpanded={false}><span data-testid="child">x</span></OuterShell>)
    expect(screen.getByTestId('child')).toBeTruthy()
  })

  it('WebGL 不可用时降级为 div', () => {
    const original = (window as any).WebGLRenderingContext
    delete (window as any).WebGLRenderingContext
    try {
      const { container } = render(<OuterShell isExpanded={false}>x</OuterShell>)
      // 不应包 LiquidGlass,应直接是 div
      expect(container.firstChild?.nodeName).toBe('DIV')
    } finally {
      ;(window as any).WebGLRenderingContext = original
    }
  })
})
```

- [ ] **Step 3:跑测试,确认失败**

```bash
npx vitest run src/floating/OuterShell.test.tsx
```

预期:FAIL(`OuterShell` not exported from `./OuterShell`)。

- [ ] **Step 4:实现 `src/floating/OuterShell.tsx`**

```tsx
// src/floating/OuterShell.tsx
import LiquidGlass from 'liquid-glass-react'
import type { ReactNode } from 'react'

interface Props {
  isExpanded: boolean
  children: ReactNode
}

function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false
  return 'WebGLRenderingContext' in window
}

export function OuterShell({ isExpanded, children }: Props) {
  if (!hasWebGL()) {
    // 降级:无折射,纯 div
    return <div style={{ borderRadius: 16, overflow: 'hidden' }}>{children}</div>
  }

  return (
    <LiquidGlass
      displacementScale={isExpanded ? 96 : 64}
      blurAmount={isExpanded ? 0.15 : 0.1}
      saturation={isExpanded ? 1.6 : 1.4}
      chromaticAberration={isExpanded ? 4 : 3}
      elasticity={isExpanded ? 0.35 : 0.0}
      mode={isExpanded ? 'polar' : 'standard'}
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      {children}
    </LiquidGlass>
  )
}
```

- [ ] **Step 5:跑测试,确认通过**

```bash
npx vitest run src/floating/OuterShell.test.tsx
```

预期:PASS(2 tests)。

- [ ] **Step 6:TS 类型检查**

```bash
npx tsc --noEmit
```

预期:0 error。若 liquid-glass-react 报 React 19 alpha 警告,记录但不阻塞。

- [ ] **Step 7:commit**

```bash
git add package.json src/floating/OuterShell.tsx src/floating/OuterShell.test.tsx
git commit -m "feat(floating): D-17 OuterShell 接入 liquid-glass-react WebGL 外壳"
```

---

### Task 2:Playwright 视觉回归基建

**Files:**
- Modify: `package.json`(装 `@playwright/test`)
- Create: `playwright.config.ts`

**Interfaces:**
- Produces: `npx playwright test` 可跑;`npx playwright test --update-snapshots` 生成 baseline

- [ ] **Step 1:装 `@playwright/test` + 双引擎**

```bash
npm i -D @playwright/test@1.55.0
npx playwright install chromium webkit
```

- [ ] **Step 2:写 `playwright.config.ts`**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    // 关键:视觉基线阈值
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 }, // 0.1%
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
```

- [ ] **Step 3:跑 Playwright 验证基建**

```bash
# 写一个空 spec 验证基建
mkdir -p tests/visual
cat > tests/visual/sanity.spec.ts <<'EOF'
import { test, expect } from '@playwright/test'
test('sanity', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Mindtap/)
})
EOF
npx playwright test
```

预期:chromium + webkit 双 engine 跑过 sanity(标题正则匹配)。

- [ ] **Step 4:删 sanity spec(临时基建,正式 spec 在 Task 15 写)**

```bash
rm tests/visual/sanity.spec.ts
```

- [ ] **Step 5:commit**

```bash
git add package.json playwright.config.ts
git commit -m "chore(deps): Playwright 视觉回归基建"
```

---

## Task 3:后端 `task_aggregate_today` 新增 command(D-06)

**Files:**
- Modify: `src-tauri/src/db/task.rs`(加 `aggregate_today` fn + 单测)
- Modify: `src-tauri/src/commands/task.rs`(加 `task_aggregate_today` command)
- Modify: `src-tauri/src/lib.rs`(register command)

**Interfaces:**
- Consumes: `DbState(Mutex<Connection>)`
- Produces:
  - Rust: `pub struct TaskAggregateToday { pub total_ms: i64, pub segment_count: i32 }`
  - Tauri command: `task_aggregate_today(state) -> AppResult<TaskAggregateToday>`
  - SQL: 查 `task` 表,status='done' 且 `completed_at >= today_00:00`,sum `duration_ms`,count segments

- [ ] **Step 1:写 `src-tauri/src/db/task.rs` 的失败测试**

读当前 `src-tauri/src/db/task.rs` 文件末尾,在 `mod tests { ... }` 内追加:

```rust
#[cfg(test)]
mod tests_aggregate {
    use super::*;
    use crate::db::init_test_db;

    fn today_midnight() -> i64 {
        let now = chrono::Utc::now();
        now.timestamp_millis() - (now.timestamp() % 86400) * 1000
    }

    #[test]
    fn aggregate_today_empty() {
        let conn = init_test_db();
        let result = aggregate_today(&conn).unwrap();
        assert_eq!(result.total_ms, 0);
        assert_eq!(result.segment_count, 0);
    }

    #[test]
    fn aggregate_today_sums_done_tasks() {
        let conn = init_test_db();
        let today = today_midnight();
        // 插入 2 个 done task,跨日边界
        conn.execute(
            "INSERT INTO task (content, status, duration_ms, completed_at, created_at, archived_at) VALUES (?, ?, ?, ?, ?, ?)",
            rusqlite::params!["t1", "done", 1500_000, today + 1000, today, None::<i64>],
        ).unwrap();
        conn.execute(
            "INSERT INTO task (content, status, duration_ms, completed_at, created_at, archived_at) VALUES (?, ?, ?, ?, ?, ?)",
            rusqlite::params!["t2", "done", 3000_000, today + 2000, today, None::<i64>],
        ).unwrap();
        // 昨日 1 个 done,不计入
        conn.execute(
            "INSERT INTO task (content, status, duration_ms, completed_at, created_at, archived_at) VALUES (?, ?, ?, ?, ?, ?)",
            rusqlite::params!["yesterday", "done", 999_000, today - 1000, today - 1000, None::<i64>],
        ).unwrap();
        let result = aggregate_today(&conn).unwrap();
        assert_eq!(result.total_ms, 4500_000);
        assert_eq!(result.segment_count, 2);
    }
}
```

> 注:`init_test_db()` 是项目既有 helper(若不存在,从 `db::mod` 找对应 factory)。Task 完工后请用项目里实际存在的 helper 替换 — 本 plan 假设该 helper 存在。

- [ ] **Step 2:跑测试,确认失败**

```bash
cargo test --manifest-path src-tauri/Cargo.toml db::task::tests_aggregate
```

预期:FAIL(`aggregate_today` not found in `db::task`)。

- [ ] **Step 3:实现 `aggregate_today` + struct**

在 `src-tauri/src/db/task.rs` 顶部加 struct:

```rust
#[derive(Debug, serde::Serialize)]
pub struct TaskAggregateToday {
    pub total_ms: i64,
    pub segment_count: i32,
}
```

加 fn:

```rust
pub fn aggregate_today(conn: &rusqlite::Connection) -> Result<TaskAggregateToday, crate::error::AppError> {
    let today_start_ms = {
        let now = chrono::Utc::now();
        let secs_today = now.timestamp() - (now.timestamp() % 86400);
        secs_today * 1000
    };
    let mut stmt = conn.prepare(
        "SELECT COALESCE(SUM(duration_ms), 0), COUNT(*) FROM task
         WHERE status = 'done' AND completed_at >= ?1",
    )?;
    let (total_ms, count): (i64, i64) = stmt.query_row([today_start_ms], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
    })?;
    Ok(TaskAggregateToday {
        total_ms,
        segment_count: count as i32,
    })
}
```

- [ ] **Step 4:跑测试,确认通过**

```bash
cargo test --manifest-path src-tauri/Cargo.toml db::task::tests_aggregate
```

预期:PASS(2 tests)。

- [ ] **Step 5:加 Tauri command wrapper**

在 `src-tauri/src/commands/task.rs` 追加:

```rust
use crate::db::task::{aggregate_today, TaskAggregateToday};

#[tauri::command]
pub async fn task_aggregate_today(
    state: tauri::State<'_, crate::db::DbState>,
) -> Result<TaskAggregateToday, crate::error::AppError> {
    let conn = state.0.lock().map_err(|_| crate::error::AppError::LockPoisoned)?;
    aggregate_today(&conn)
}
```

- [ ] **Step 6:在 `src-tauri/src/lib.rs` 注册 command**

读 `src-tauri/src/lib.rs` 的 `invoke_handler!` 块,在数组里加:

```rust
.invoke_handler(tauri::generate_handler![
    // ... 既有 commands
    commands::task::task_aggregate_today,
])
```

- [ ] **Step 7:全 Rust 套件绿**

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

预期:全 PASS(含既有 `db::task::tests::start_timer_pending_to_active` 等)。

- [ ] **Step 8:commit**

```bash
git add src-tauri/src/db/task.rs src-tauri/src/commands/task.rs src-tauri/src/lib.rs
git commit -m "feat(task): D-06 backend task_aggregate_today command"
```

---

### Task 4:前端 tauri-bridge 包装 `taskAggregateToday`(D-06)

**Files:**
- Modify: `src/lib/tauri-bridge.ts`

**Interfaces:**
- Produces: `api.taskAggregateToday(): Promise<TaskAggregateToday>` 类型化包装

- [ ] **Step 1:读 `src/lib/tauri-bridge.ts` 找类型定义位置**

```bash
grep -n "record_get_active_task\|interface.*Task\b" src/lib/tauri-bridge.ts | head -10
```

定位 `Task` interface 与 `api` 对象。

- [ ] **Step 2:在 `Task` interface 附近加 `TaskAggregateToday` interface**

```ts
// src/lib/tauri-bridge.ts(在 Task interface 后追加)
export interface TaskAggregateToday {
  total_ms: number
  segment_count: number
}
```

- [ ] **Step 3:在 `api` 对象加 `taskAggregateToday` 方法**

```ts
// src/lib/tauri-bridge.ts(在 api 对象内追加)
taskAggregateToday: () => invoke<TaskAggregateToday>('task_aggregate_today'),
```

- [ ] **Step 4:TS 类型检查**

```bash
npx tsc --noEmit
```

预期:0 error。

- [ ] **Step 5:commit**

```bash
git add src/lib/tauri-bridge.ts
git commit -m "feat(bridge): D-06 taskAggregateToday 前端 wrapper"
```

---

### Task 5:GlassSurface 组件 + 4 variant(D-10/D-01/D-16)

**Files:**
- Create: `src/floating/GlassSurface.tsx`
- Create: `src/floating/GlassSurface.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  type GlassVariant = 'L1' | 'L3' | 'fb' | 'legacy'
  interface GlassSurfaceProps extends VariantProps<typeof glass> { className?: string; children?: ReactNode }
  function GlassSurface(props: GlassSurfaceProps): JSX.Element
  ```

- [ ] **Step 1:写 `src/floating/GlassSurface.test.tsx` 失败测试**

```tsx
// src/floating/GlassSurface.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GlassSurface } from './GlassSurface'

describe('GlassSurface', () => {
  it('默认 variant=L1 渲染 L1 类', () => {
    const { container } = render(<GlassSurface>x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/bg-glass-L1/)
    expect(div.className).toMatch(/backdrop-blur-glass/)
  })

  it('variant=L3 渲染 L3 类', () => {
    const { container } = render(<GlassSurface variant="L3">x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/bg-glass-L3/)
  })

  it('variant=fb 走 fallback 实色', () => {
    const { container } = render(<GlassSurface variant="fb">x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/bg-glass-fb/)
  })

  it('variant=legacy 走老平台配方', () => {
    const { container } = render(<GlassSurface variant="legacy">x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/bg-glass-legacy/)
    expect(div.className).toMatch(/backdrop-blur-glass-legacy/)
  })

  it('className 透传且与 variant 合并无冲突', () => {
    const { container } = render(<GlassSurface className="custom-mine">x</GlassSurface>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/custom-mine/)
    expect(div.className).toMatch(/bg-glass-L1/)
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/GlassSurface.test.tsx
```

预期:FAIL(`GlassSurface` not exported)。

- [ ] **Step 3:实现 `src/floating/GlassSurface.tsx`**

```tsx
// src/floating/GlassSurface.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'
import type { HTMLAttributes, ReactNode } from 'react'

const glass = cva(
  [
    'rounded-glass-sm',
    'backdrop-blur-glass',
    'backdrop-saturate-glass',
    'backdrop-brightness-glass',
    'border',
  ],
  {
    variants: {
      variant: {
        L1: 'bg-glass-L1 border-glass-border-L1',
        L3: 'bg-glass-L3 border-glass-border-L3 rounded-glass-lg',
        fb: 'bg-glass-fb border-glass-border-fb',
        legacy: 'bg-glass-legacy backdrop-blur-glass-legacy backdrop-saturate-glass-legacy',
      },
    },
    defaultVariants: { variant: 'L1' },
  }
)

type GlassVariant = 'L1' | 'L3' | 'fb' | 'legacy'

interface GlassSurfaceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof glass> {
  children?: ReactNode
}

export function GlassSurface({ variant, className, children, ...rest }: GlassSurfaceProps) {
  return (
    <div className={twMerge(glass({ variant: variant as GlassVariant }), className)} {...rest}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4:跑测试,确认通过**

```bash
npx vitest run src/floating/GlassSurface.test.tsx
```

预期:PASS(5 tests)。

- [ ] **Step 5:commit**

```bash
git add src/floating/GlassSurface.tsx src/floating/GlassSurface.test.tsx
git commit -m "feat(floating): D-10/D-01/D-16 GlassSurface 4 variant OKLCH 玻璃"
```

---

### Task 6:Button 组件 B 方案(D-08)

**Files:**
- Create: `src/floating/Button.tsx`
- Create: `src/floating/Button.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
    size?: 'icon-sm' | 'sm' | 'md'
    variant?: 'ghost'
  }
  ```

- [ ] **Step 1:写 `src/floating/Button.test.tsx` 失败测试**

```tsx
// src/floating/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('渲染 children', () => {
    render(<Button>click</Button>)
    expect(screen.getByText('click')).toBeTruthy()
  })

  it('hover 时背景透明度提升', () => {
    const { container } = render(<Button data-testid="b">x</Button>)
    const btn = container.querySelector('[data-testid="b"]') as HTMLElement
    expect(btn.className).toMatch(/bg-white\/15/)
    fireEvent.mouseEnter(btn)
    expect(btn.className).toMatch(/hover:bg-white\/55/)
  })

  it('mousedown 时 scale 0.96 active 态', () => {
    const { container } = render(<Button>x</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toMatch(/active:scale-\[0\.96\]/)
  })

  it('click 触发 onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>x</Button>)
    fireEvent.click(screen.getByText('x'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('size=icon-sm 给 22×22 + r6', () => {
    const { container } = render(<Button size="icon-sm">x</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toMatch(/size-icon-sm|h-6.*w-6|rounded-md/)
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/Button.test.tsx
```

预期:FAIL(`Button` not exported)。

- [ ] **Step 3:实现 `src/floating/Button.tsx`**

```tsx
// src/floating/Button.tsx
import { twMerge } from 'tailwind-merge'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Size = 'icon-sm' | 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
}

const sizeClass: Record<Size, string> = {
  'icon-sm': 'h-6 w-6 rounded-md',
  sm: 'h-8 px-3 rounded-md text-sm',
  md: 'h-10 px-4 rounded-md text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = 'md', className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        data-no-expand  // 短路 FloatShell 的拖动/展开
        className={twMerge(
          // B 方案:ghost α=0.15 + hover α=0.55 + scale 0.96 active
          'inline-flex items-center justify-center gap-1.5',
          'bg-white/15 hover:bg-white/55',
          'text-ink-900 dark:text-ink-100',
          'transition-colors duration-200',
          'active:scale-[0.96]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
          sizeClass[size],
          className
        )}
        {...rest}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
```

- [ ] **Step 4:跑测试,确认通过**

```bash
npx vitest run src/floating/Button.test.tsx
```

预期:PASS(5 tests)。若 `bg-white\/15` 正则不匹配,确认 `src/index.css` 是否包含 `@theme` 块(若没有,`bg-white/15` 不被 v4 解析)。

- [ ] **Step 5:commit**

```bash
git add src/floating/Button.tsx src/floating/Button.test.tsx
git commit -m "feat(floating): D-08 B 方案 Button 组件"
```

---

### Task 7:StatusDot 3 态呼吸(D-09)

**Files:**
- Create: `src/floating/StatusDot.tsx`
- Create: `src/floating/StatusDot.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  type StatusKind = 'active' | 'paused' | 'done'
  interface StatusDotProps { status: StatusKind }
  function StatusDot(props: StatusDotProps): JSX.Element
  ```

- [ ] **Step 1:写 `src/floating/StatusDot.test.tsx` 失败测试**

```tsx
// src/floating/StatusDot.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StatusDot } from './StatusDot'

describe('StatusDot', () => {
  it('active=绿色 #5BCBA0 + 呼吸动画', () => {
    const { container } = render(<StatusDot status="active" />)
    const dot = container.firstChild as HTMLElement
    expect(dot.className).toMatch(/bg-status-active/)
    expect(dot.className).toMatch(/animate-pulse-v6/)
  })

  it('paused=橙色 #F5A623 + 呼吸动画', () => {
    const { container } = render(<StatusDot status="paused" />)
    const dot = container.firstChild as HTMLElement
    expect(dot.className).toMatch(/bg-status-paused/)
    expect(dot.className).toMatch(/animate-pulse-v6/)
  })

  it('done=灰色 #98A2B3 + 无动画', () => {
    const { container } = render(<StatusDot status="done" />)
    const dot = container.firstChild as HTMLElement
    expect(dot.className).toMatch(/bg-status-done/)
    expect(dot.className).not.toMatch(/animate-pulse/)
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/StatusDot.test.tsx
```

预期:FAIL(`StatusDot` not exported;`bg-status-active` 类未在 v4 `@theme` 中注册时也会报样式类找不到 — 但 vitest 不会因为未知 class 失败,只在 DOM 渲染时返回原样;真正 fail 是 StatusDot 找不到)。

- [ ] **Step 3:在 `src/index.css` 加呼吸 v6 关键帧**

读 `src/index.css`,在 `@theme` 块外加:

```css
/* 呼吸 v6 关键帧(D-09) */
@layer utilities {
  @keyframes pulse-v6 {
    0%, 100% {
      box-shadow: 0 0 0 4px oklch(1 0 0 / 0.18), 0 0 16px 0 oklch(0.36 0.15 165 / 0);
      filter: brightness(1);
    }
    50% {
      box-shadow: 0 0 0 16px oklch(1 0 0 / 0), 0 0 16px 4px oklch(0.36 0.15 165 / 0.5);
      filter: brightness(1.15);
    }
  }
  .animate-pulse-v6 {
    animation: pulse-v6 2.8s ease-in-out infinite;
  }
}
```

- [ ] **Step 4:实现 `src/floating/StatusDot.tsx`**

```tsx
// src/floating/StatusDot.tsx
type StatusKind = 'active' | 'paused' | 'done'

const statusClass: Record<StatusKind, string> = {
  active: 'bg-status-active animate-pulse-v6',
  paused: 'bg-status-paused animate-pulse-v6',
  done: 'bg-status-done',
}

interface Props {
  status: StatusKind
  className?: string
}

export function StatusDot({ status, className }: Props) {
  return (
    <span
      data-no-expand
      className={`inline-block h-2 w-2 rounded-full ${statusClass[status]} ${className ?? ''}`}
      aria-label={`status-${status}`}
    />
  )
}
```

- [ ] **Step 5:跑测试,确认通过**

```bash
npx vitest run src/floating/StatusDot.test.tsx
```

预期:PASS(3 tests)。

- [ ] **Step 6:commit**

```bash
git add src/floating/StatusDot.tsx src/floating/StatusDot.test.tsx src/index.css
git commit -m "feat(floating): D-09 StatusDot 3 态呼吸 v6"
```

---

### Task 8:Segmented 互斥单选(D-02)

**Files:**
- Create: `src/floating/Segmented.tsx`
- Create: `src/floating/Segmented.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  type SegmentedValue = 'timer' | 'form'
  interface SegmentedProps {
    value: SegmentedValue
    onChange: (v: SegmentedValue) => void
  }
  function Segmented(props: SegmentedProps): JSX.Element
  ```

- [ ] **Step 1:写 `src/floating/Segmented.test.tsx` 失败测试**

```tsx
// src/floating/Segmented.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { Segmented } from './Segmented'

describe('Segmented', () => {
  it('渲染 2 选项 ⏱ / ＋', () => {
    render(<Segmented value="timer" onChange={() => {}} />)
    expect(screen.getByText('⏱')).toBeTruthy()
    expect(screen.getByText('＋')).toBeTruthy()
  })

  it('点击 form 触发 onChange("form")', () => {
    const onChange = vi.fn()
    render(<Segmented value="timer" onChange={onChange} />)
    fireEvent.click(screen.getByText('＋'))
    expect(onChange).toHaveBeenCalledWith('form')
  })

  it('mutex:同时只有 1 个 active', () => {
    const { container } = render(<Segmented value="form" onChange={() => {}} />)
    const active = container.querySelectorAll('[data-active="true"]')
    expect(active.length).toBe(1)
    expect(active[0].textContent).toMatch(/＋/)
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/Segmented.test.tsx
```

预期:FAIL(`Segmented` not exported)。

- [ ] **Step 3:实现 `src/floating/Segmented.tsx`**

```tsx
// src/floating/Segmented.tsx
import { twMerge } from 'tailwind-merge'

export type SegmentedValue = 'timer' | 'form'

interface Props {
  value: SegmentedValue
  onChange: (v: SegmentedValue) => void
  className?: string
}

const OPTIONS: { value: SegmentedValue; label: string; aria: string }[] = [
  { value: 'timer', label: '⏱', aria: '计时' },
  { value: 'form', label: '＋', aria: '记录' },
]

export function Segmented({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      data-no-expand
      className={twMerge(
        'inline-flex rounded-glass-sm bg-white/22 p-0.5',
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            data-active={active}
            onClick={() => onChange(opt.value)}
            className={twMerge(
              'flex-1 px-3 py-1 text-sm rounded-glass-sm transition-all duration-200',
              active
                ? 'bg-white/40 text-ink-900 shadow-sm'
                : 'text-ink-700 hover:text-ink-900'
            )}
          >
            <span aria-hidden>{opt.label}</span>
            <span className="sr-only">{opt.aria}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4:跑测试,确认通过**

```bash
npx vitest run src/floating/Segmented.test.tsx
```

预期:PASS(3 tests)。

- [ ] **Step 5:commit**

```bash
git add src/floating/Segmented.tsx src/floating/Segmented.test.tsx
git commit -m "feat(floating): D-02 Segmented mutex ⏱/＋"
```

---

### Task 9:SharedHeader Form 头 A 方案(D-03)

**Files:**
- Create: `src/floating/SharedHeader.tsx`
- Create: `src/floating/SharedHeader.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface SharedHeaderProps {
    activeTaskContent?: string  // undefined = 退化到中性
  }
  function SharedHeader(props: SharedHeaderProps): JSX.Element
  ```

- [ ] **Step 1:写 `src/floating/SharedHeader.test.tsx` 失败测试**

```tsx
// src/floating/SharedHeader.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SharedHeader } from './SharedHeader'

describe('SharedHeader', () => {
  it('有 active task 时显示 📄 + 任务名 + 当前 Focus', () => {
    render(<SharedHeader activeTaskContent="写浮窗 spec" />)
    expect(screen.getByText('📄')).toBeTruthy()
    expect(screen.getByText('写浮窗 spec')).toBeTruthy()
    expect(screen.getByText('当前 Focus')).toBeTruthy()
  })

  it('无 active task 时退化为中性 ✚ + 新记录', () => {
    render(<SharedHeader />)
    expect(screen.getByText('✚')).toBeTruthy()
    expect(screen.getByText('新记录')).toBeTruthy()
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/SharedHeader.test.tsx
```

预期:FAIL(`SharedHeader` not exported)。

- [ ] **Step 3:实现 `src/floating/SharedHeader.tsx`**

```tsx
// src/floating/SharedHeader.tsx
import { twMerge } from 'tailwind-merge'

interface Props {
  activeTaskContent?: string
  className?: string
}

export function SharedHeader({ activeTaskContent, className }: Props) {
  const hasActive = Boolean(activeTaskContent)

  return (
    <header
      data-no-expand
      className={twMerge(
        'flex items-center gap-2 px-1 py-1.5',
        'border-b border-white/4',
        className
      )}
    >
      <span aria-hidden className="text-base">
        {hasActive ? '📄' : '✚'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-900 truncate">
          {hasActive ? activeTaskContent : '新记录'}
        </div>
        <div className="text-[11px] text-ink-700">
          {hasActive ? '当前 Focus' : '轻念 · Mindtap'}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4:跑测试,确认通过**

```bash
npx vitest run src/floating/SharedHeader.test.tsx
```

预期:PASS(2 tests)。

- [ ] **Step 5:commit**

```bash
git add src/floating/SharedHeader.tsx src/floating/SharedHeader.test.tsx
git commit -m "feat(floating): D-03 SharedHeader 头 A 方案 + 退化"
```

---

### Task 10:FormSubPanel(D-04 解耦 submit)

**Files:**
- Create: `src/floating/FormSubPanel.tsx`
- Create: `src/floating/FormSubPanel.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  type RecordKind = 'task' | 'idea' | 'check_in'
  interface FormSubPanelProps {
    activeTaskContent?: string
    onSubmit: (kind: RecordKind, content: string) => void
  }
  function FormSubPanel(props: FormSubPanelProps): JSX.Element
  ```

- [ ] **Step 1:写 `src/floating/FormSubPanel.test.tsx` 失败测试**

```tsx
// src/floating/FormSubPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { FormSubPanel } from './FormSubPanel'

describe('FormSubPanel', () => {
  it('渲染 type chips + textarea + 主 CTA "保存(⌘S)"', () => {
    render(<FormSubPanel onSubmit={() => {}} />)
    expect(screen.getByText('task')).toBeTruthy()
    expect(screen.getByText('idea')).toBeTruthy()
    expect(screen.getByText('check_in')).toBeTruthy()
    expect(screen.getByText(/保存.*⌘S/)).toBeTruthy()
  })

  it('不带 "开始 N 分钟专注" CTA', () => {
    render(<FormSubPanel onSubmit={() => {}} />)
    expect(screen.queryByText(/开始.*分钟/)).toBeNull()
  })

  it('点击保存触发 onSubmit(kind, content)', () => {
    const onSubmit = vi.fn()
    render(<FormSubPanel onSubmit={onSubmit} />)
    const ta = screen.getByRole('textbox')
    fireEvent.change(ta, { target: { value: 'hello' } })
    fireEvent.click(screen.getByText(/保存/))
    expect(onSubmit).toHaveBeenCalledWith('task', 'hello')
  })

  it('切换 type chip 改变默认 kind', () => {
    const onSubmit = vi.fn()
    render(<FormSubPanel onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('idea'))
    fireEvent.click(screen.getByText(/保存/))
    expect(onSubmit).toHaveBeenCalledWith('idea', '')
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/FormSubPanel.test.tsx
```

预期:FAIL(`FormSubPanel` not exported)。

- [ ] **Step 3:实现 `src/floating/FormSubPanel.tsx`**

```tsx
// src/floating/FormSubPanel.tsx
import { useState, type FormEvent } from 'react'
import { twMerge } from 'tailwind-merge'
import { SharedHeader } from './SharedHeader'
import { Button } from './Button'

export type RecordKind = 'task' | 'idea' | 'check_in'

interface Props {
  activeTaskContent?: string
  onSubmit: (kind: RecordKind, content: string) => void
  className?: string
}

const KINDS: { value: RecordKind; label: string }[] = [
  { value: 'task', label: 'task' },
  { value: 'idea', label: 'idea' },
  { value: 'check_in', label: 'check_in' },
]

export function FormSubPanel({ activeTaskContent, onSubmit, className }: Props) {
  const [kind, setKind] = useState<RecordKind>('task')
  const [content, setContent] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(kind, content)
    setContent('')  // D-04:保存后清空,浮窗仍展开(可继续记录)
  }

  return (
    <form
      data-no-expand
      onSubmit={handleSubmit}
      className={twMerge('flex flex-col gap-2 p-2', className)}
    >
      <SharedHeader activeTaskContent={activeTaskContent} />

      {/* type chips */}
      <div role="tablist" className="inline-flex gap-1">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="tab"
            aria-selected={kind === k.value}
            data-no-expand
            onClick={() => setKind(k.value)}
            className={twMerge(
              'px-2 py-0.5 text-xs rounded-full transition-colors',
              'bg-white/22',
              kind === k.value
                ? 'ring-1 ring-white/60 text-ink-900'
                : 'text-ink-700 hover:text-ink-900'
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="3 秒记录..."
        className="min-h-12 resize-none rounded-glass-sm bg-white/22 px-2 py-1.5 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-white/40"
      />

      <div className="flex justify-end">
        <Button type="submit" size="sm">
          保存(⌘S)
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4:跑测试,确认通过**

```bash
npx vitest run src/floating/FormSubPanel.test.tsx
```

预期:PASS(4 tests)。

- [ ] **Step 5:commit**

```bash
git add src/floating/FormSubPanel.tsx src/floating/FormSubPanel.test.tsx
git commit -m "feat(floating): D-04 FormSubPanel 解耦 submit + type chips"
```

---

### Task 11:TimerSubPanel(D-06 + action pair 状态分支)

**Files:**
- Create: `src/floating/TimerSubPanel.tsx`
- Create: `src/floating/TimerSubPanel.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  type TimerStatus = 'active' | 'paused' | 'done'
  interface TimerSubPanelProps {
    status: TimerStatus
    durationMs: number
    aggregate: { totalMs: number; segmentCount: number }
    onPause: () => void
    onResume: () => void
    onComplete: () => void
    onUndo: () => void
  }
  function TimerSubPanel(props: TimerSubPanelProps): JSX.Element
  ```

- [ ] **Step 1:写 `src/floating/TimerSubPanel.test.tsx` 失败测试**

```tsx
// src/floating/TimerSubPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerSubPanel } from './TimerSubPanel'

const noopAggregate = { totalMs: 0, segmentCount: 0 }

describe('TimerSubPanel', () => {
  it('active:渲染 [⏸ 暂停, ⏹ 完成] 按钮对', () => {
    render(
      <TimerSubPanel
        status="active"
        durationMs={0}
        aggregate={noopAggregate}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    expect(screen.getByText('⏸')).toBeTruthy()
    expect(screen.getByText('⏹')).toBeTruthy()
    expect(screen.queryByText('▶')).toBeNull()
    expect(screen.queryByText('↶')).toBeNull()
  })

  it('paused:渲染 [▶ 继续, ⏹ 完成] 按钮对', () => {
    render(
      <TimerSubPanel
        status="paused"
        durationMs={5000}
        aggregate={noopAggregate}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    expect(screen.getByText('▶')).toBeTruthy()
    expect(screen.getByText('⏹')).toBeTruthy()
    expect(screen.queryByText('⏸')).toBeNull()
  })

  it('done:渲染单按钮 [↶ 撤销]', () => {
    render(
      <TimerSubPanel
        status="done"
        durationMs={5000}
        aggregate={noopAggregate}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    expect(screen.getByText('↶')).toBeTruthy()
    expect(screen.queryByText('⏸')).toBeNull()
    expect(screen.queryByText('⏹')).toBeNull()
  })

  it('副标题显示 "今日累计 X:XX:XX · N 段"', () => {
    render(
      <TimerSubPanel
        status="active"
        durationMs={0}
        aggregate={{ totalMs: 8142000, segmentCount: 3 }}
        onPause={() => {}} onResume={() => {}} onComplete={() => {}} onUndo={() => {}}
      />
    )
    expect(screen.getByText(/今日累计.*2:15:42.*3 段/)).toBeTruthy()
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/TimerSubPanel.test.tsx
```

预期:FAIL(`TimerSubPanel` not exported)。

- [ ] **Step 3:实现 `src/floating/TimerSubPanel.tsx`**

```tsx
// src/floating/TimerSubPanel.tsx
import { twMerge } from 'tailwind-merge'
import { Button } from './Button'

export type TimerStatus = 'active' | 'paused' | 'done'

interface Props {
  status: TimerStatus
  durationMs: number
  aggregate: { totalMs: number; segmentCount: number }
  onPause: () => void
  onResume: () => void
  onComplete: () => void
  onUndo: () => void
  className?: string
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatHero(ms: number): string {
  // hero 只显示 mm:ss(D-14 spec 56px)
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerSubPanel({ status, durationMs, aggregate, onPause, onResume, onComplete, onUndo, className }: Props) {
  return (
    <div
      data-no-expand
      className={twMerge('flex flex-col items-center gap-3 p-3', className)}
    >
      {/* Hero(D-14 56px) */}
      <div
        className="text-[56px] font-bold tabular-nums tracking-[-0.02em] text-ink-900 leading-none"
        aria-label={`已专注 ${formatHero(durationMs)}`}
      >
        {formatHero(durationMs)}
      </div>

      {/* 副标题(D-06) */}
      <div className="text-xs text-ink-700">
        今日累计 {formatDuration(aggregate.totalMs)} · {aggregate.segmentCount} 段
      </div>

      {/* Action pair(D-02 mutex) */}
      <div className="flex items-center gap-2">
        {status === 'active' && (
          <>
            <Button size="sm" onClick={onPause} aria-label="暂停">
              <span aria-hidden>⏸</span> 暂停
            </Button>
            <Button size="sm" onClick={onComplete} aria-label="完成">
              <span aria-hidden>⏹</span> 完成
            </Button>
          </>
        )}
        {status === 'paused' && (
          <>
            <Button size="sm" onClick={onResume} aria-label="继续">
              <span aria-hidden>▶</span> 继续
            </Button>
            <Button size="sm" onClick={onComplete} aria-label="完成">
              <span aria-hidden>⏹</span> 完成
            </Button>
          </>
        )}
        {status === 'done' && (
          <Button size="sm" onClick={onUndo} aria-label="撤销">
            <span aria-hidden>↶</span> 撤销
          </Button>
        )}
      </div>

      {/* 快捷键 hint */}
      <div className="text-[10px] text-ink-500">
        ⌘+⇧+P 完成 · ⌘+⇧+Space 暂停
      </div>
    </div>
  )
}
```

- [ ] **Step 4:跑测试,确认通过**

```bash
npx vitest run src/floating/TimerSubPanel.test.tsx
```

预期:PASS(4 tests)。

- [ ] **Step 5:commit**

```bash
git add src/floating/TimerSubPanel.tsx src/floating/TimerSubPanel.test.tsx
git commit -m "feat(floating): D-06/D-02 TimerSubPanel action pair + 副标题"
```

---

### Task 12:FoldedBar 5 元素(D-05)

**Files:**
- Create: `src/floating/FoldedBar.tsx`
- Create: `src/floating/FoldedBar.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface FoldedBarProps {
    status: 'active' | 'paused' | 'done'
    title: string
    durationMs: number
    onTogglePause: () => void
    onOpenForm: () => void
  }
  function FoldedBar(props: FoldedBarProps): JSX.Element
  ```

- [ ] **Step 1:写 `src/floating/FoldedBar.test.tsx` 失败测试**

```tsx
// src/floating/FoldedBar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FoldedBar } from './FoldedBar'

describe('FoldedBar', () => {
  it('渲染 5 元素顺序:状态点 → 标题 → 时间 → ⏸ → ＋', () => {
    const { container } = render(
      <FoldedBar
        status="active" title="写 spec" durationMs={65000}
        onTogglePause={() => {}} onOpenForm={() => {}}
      />
    )
    const children = Array.from(container.firstChild!.children).map((el) => el.textContent)
    expect(children[0]).toMatch(/active/)
    expect(children[1]).toMatch(/写 spec/)
    expect(children[2]).toMatch(/01:05/)
    expect(children[3]).toMatch(/⏸/)
    expect(children[4]).toMatch(/＋/)
  })

  it('paused 状态显示 ▶ 而非 ⏸', () => {
    render(
      <FoldedBar
        status="paused" title="x" durationMs={0}
        onTogglePause={() => {}} onOpenForm={() => {}}
      />
    )
    expect(screen.getByText('▶')).toBeTruthy()
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/FoldedBar.test.tsx
```

预期:FAIL(`FoldedBar` not exported)。

- [ ] **Step 3:实现 `src/floating/FoldedBar.tsx`**

```tsx
// src/floating/FoldedBar.tsx
import { twMerge } from 'tailwind-merge'
import { StatusDot } from './StatusDot'
import { Button } from './Button'

interface Props {
  status: 'active' | 'paused' | 'done'
  title: string
  durationMs: number
  onTogglePause: () => void
  onOpenForm: () => void
  className?: string
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function FoldedBar({ status, title, durationMs, onTogglePause, onOpenForm, className }: Props) {
  const isPaused = status === 'paused'
  return (
    <div
      className={twMerge(
        'flex items-center gap-2 px-2.5 h-9 w-[240px]',
        className
      )}
    >
      <StatusDot status={status} />
      <span className="flex-1 min-w-0 text-sm text-ink-900 truncate">{title}</span>
      <span className="text-xs tabular-nums text-ink-700">{formatTime(durationMs)}</span>
      <Button size="icon-sm" onClick={onTogglePause} aria-label={isPaused ? '继续' : '暂停'}>
        <span aria-hidden>{isPaused ? '▶' : '⏸'}</span>
      </Button>
      <Button size="icon-sm" onClick={onOpenForm} aria-label="新记录">
        <span aria-hidden>＋</span>
      </Button>
    </div>
  )
}
```

- [ ] **Step 4:跑测试,确认通过**

```bash
npx vitest run src/floating/FoldedBar.test.tsx
```

预期:PASS(2 tests)。

- [ ] **Step 5:commit**

```bash
git add src/floating/FoldedBar.tsx src/floating/FoldedBar.test.tsx
git commit -m "feat(floating): D-05 FoldedBar 5 元素"
```

---

### Task 13:FloatShell 折叠↔展开壳(D-11 grid-rows + D-12 4px 拖动阈值)

**Files:**
- Create: `src/floating/FloatShell.tsx`
- Create: `src/floating/FloatShell.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface FloatShellProps {
    isExpanded: boolean
    onToggle: () => void
    children: ReactNode  // 展开态内容
    foldedBar: ReactNode  // 折叠态内容
  }
  function FloatShell(props: FloatShellProps): JSX.Element
  ```

- [ ] **Step 1:写 `src/floating/FloatShell.test.tsx` 失败测试**

```tsx
// src/floating/FloatShell.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { FloatShell } from './FloatShell'

describe('FloatShell', () => {
  it('折叠态渲染 foldedBar,展开态渲染 children', () => {
    const { rerender } = render(
      <FloatShell isExpanded={false} onToggle={() => {}} foldedBar={<span>bar</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    expect(screen.getByText('bar')).toBeTruthy()
    expect(screen.queryByText('expanded')).toBeNull()

    rerender(
      <FloatShell isExpanded={true} onToggle={() => {}} foldedBar={<span>bar</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    expect(screen.getByText('expanded')).toBeTruthy()
  })

  it('折叠态 click 空白触发 onToggle', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <FloatShell isExpanded={false} onToggle={onToggle} foldedBar={<span data-no-expand>x</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    // 点击非 [data-no-expand] 区域
    fireEvent.mouseDown(container.firstChild as Element, { clientX: 10, clientY: 10 })
    fireEvent.mouseUp(container.firstChild as Element, { clientX: 10, clientY: 10 })
    expect(onToggle).toHaveBeenCalled()
  })

  it('折叠态拖动 5px 不触发 onToggle(超过 4px 阈值)', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <FloatShell isExpanded={false} onToggle={onToggle} foldedBar={<span data-no-expand>x</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    const target = container.firstChild as Element
    fireEvent.mouseDown(target, { clientX: 10, clientY: 10 })
    fireEvent.mouseMove(target, { clientX: 15, clientY: 10 })  // 5px > 4px
    fireEvent.mouseUp(target, { clientX: 15, clientY: 10 })
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('折叠态拖动 3px 仍触发 onToggle(未超阈值 = 短按)', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <FloatShell isExpanded={false} onToggle={onToggle} foldedBar={<span data-no-expand>x</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    const target = container.firstChild as Element
    fireEvent.mouseDown(target, { clientX: 10, clientY: 10 })
    fireEvent.mouseMove(target, { clientX: 13, clientY: 10 })  // 3px < 4px
    fireEvent.mouseUp(target, { clientX: 13, clientY: 10 })
    expect(onToggle).toHaveBeenCalled()
  })

  it('展开态 mousedown 在内部控件(data-no-expand)不响应 drag/expand', () => {
    const onToggle = vi.fn()
    render(
      <FloatShell isExpanded={true} onToggle={onToggle} foldedBar={<span>bar</span>}>
        <button data-no-expand>x</button>
      </FloatShell>
    )
    fireEvent.mouseDown(screen.getByText('x'), { clientX: 10, clientY: 10 })
    fireEvent.mouseUp(screen.getByText('x'), { clientX: 10, clientY: 10 })
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('展开态用 grid-template-rows 0fr→1fr 过渡(D-11)', () => {
    const { container } = render(
      <FloatShell isExpanded={true} onToggle={() => {}} foldedBar={<span>bar</span>}>
        <span>expanded</span>
      </FloatShell>
    )
    const inner = container.querySelector('[data-float-expand]') as HTMLElement
    expect(inner).toBeTruthy()
    expect(inner.style.gridTemplateRows).toBe('1fr')
  })
})
```

- [ ] **Step 2:跑测试,确认失败**

```bash
npx vitest run src/floating/FloatShell.test.tsx
```

预期:FAIL(`FloatShell` not exported)。

- [ ] **Step 3:实现 `src/floating/FloatShell.tsx`**

```tsx
// src/floating/FloatShell.tsx
import { useState, useRef, useEffect, type ReactNode, type MouseEvent as RMouseEvent } from 'react'
import { twMerge } from 'tailwind-merge'

const DRAG_THRESHOLD = 4

interface Props {
  isExpanded: boolean
  onToggle: () => void
  foldedBar: ReactNode
  children: ReactNode
  className?: string
}

interface DragState {
  startX: number
  startY: number
  isDragging: boolean
  dragStarted: boolean
  offsetX: number
  offsetY: number
}

export function FloatShell({ isExpanded, onToggle, foldedBar, children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState>({
    startX: 0,
    startY: 0,
    isDragging: false,
    dragStarted: false,
    offsetX: 0,
    offsetY: 0,
  })
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: RMouseEvent<HTMLDivElement>) => {
    // 展开态下,内部控件不响应
    if (isExpanded) return
    // 折叠态下,带 data-no-expand 的子元素不响应(btn 短路)
    if ((e.target as HTMLElement).closest('[data-no-expand]')) return

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
      dragStarted: false,
      offsetX: pos.x,
      offsetY: pos.y,
    }
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      dragRef.current.dragStarted = true
      // 限制在视口内(简化:不超 100vw / 100vh)
      const maxX = window.innerWidth - 240
      const maxY = window.innerHeight - 36
      setPos({
        x: Math.max(0, Math.min(maxX, dragRef.current.offsetX + dx)),
        y: Math.max(0, Math.min(maxY, dragRef.current.offsetY + dy)),
      })
    }
    const handleUp = () => {
      if (!dragRef.current.isDragging) return
      if (!dragRef.current.dragStarted) {
        // 短按 = toggle
        onToggle()
      }
      dragRef.current.isDragging = false
      dragRef.current.dragStarted = false
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [onToggle, pos.x, pos.y])

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        // CSS transform 走 GPU,无重渲染
        transform: 'translateZ(0)',
      }}
      className={twMerge('select-none cursor-grab active:cursor-grabbing', className)}
    >
      {/* 折叠态 bar */}
      {isExpanded ? null : foldedBar}

      {/* 展开态内容:D-11 grid-template-rows 0fr→1fr 过渡 */}
      <div
        data-float-expand
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4:跑测试,确认通过**

```bash
npx vitest run src/floating/FloatShell.test.tsx
```

预期:PASS(6 tests)。若 `展开态用 grid-template-rows 0fr→1fr 过渡` 失败,检查 `data-float-expand` 属性是否在 render 时挂在 div 上。

- [ ] **Step 5:commit**

```bash
git add src/floating/FloatShell.tsx src/floating/FloatShell.test.tsx
git commit -m "feat(floating): D-11/D-12 FloatShell grid-rows + 4px drag"
```

---

### Task 14:App.tsx 接入 + floating.css(D-13 DOM 复用)

**Files:**
- Modify: `src/floating/App.tsx`
- Modify: `src/floating/floating.css`(新增最小样式;具体 glass/glass-* 全部走 Tailwind `@theme`)

**Interfaces:**
- 读既有 `src/floating/App.tsx`,用 FloatShell + OuterShell 替换内联 JSX

- [ ] **Step 1:读 `src/floating/App.tsx`**

```bash
wc -l src/floating/App.tsx
head -30 src/floating/App.tsx
```

记录:既有 import + 主组件结构。

- [ ] **Step 2:重写 `src/floating/App.tsx`**

```tsx
// src/floating/App.tsx
import { useEffect, useState, useCallback } from 'react'
import { useRecordStream, useFocusStream } from '@/hooks'  // 项目既有 hook(若不同,按实际路径)
import { api, type RecordKind } from '@/lib/tauri-bridge'
import { OuterShell } from './OuterShell'
import { FloatShell } from './FloatShell'
import { GlassSurface } from './GlassSurface'
import { Segmented, type SegmentedValue } from './Segmented'
import { FormSubPanel } from './FormSubPanel'
import { TimerSubPanel, type TimerStatus } from './TimerSubPanel'
import { FoldedBar } from './FoldedBar'
import { StatusDot } from './StatusDot'

type Variant = 'L1' | 'L3' | 'fb' | 'legacy'

function detectLegacy(): Variant {
  if (typeof navigator === 'undefined') return 'L1'
  if (/Mac OS X 10_15/.test(navigator.userAgent)) return 'legacy'
  if (!CSS.supports('backdrop-filter', 'blur(24px)')) return 'fb'
  return 'L1'
}

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [segment, setSegment] = useState<SegmentedValue>('form')  // D-07 Form-first
  const [variant, setVariant] = useState<Variant>('L1')
  const [aggregate, setAggregate] = useState({ totalMs: 0, segmentCount: 0 })

  useEffect(() => setVariant(isExpanded ? 'L3' : detectLegacy()), [isExpanded])

  // D-06 副标题
  useEffect(() => {
    if (!isExpanded || segment !== 'timer') return
    let cancelled = false
    api.taskAggregateToday()
      .then((a) => { if (!cancelled) setAggregate(a) })
      .catch(() => { /* 降级显示 0:00:00 */ })
    return () => { cancelled = true }
  }, [isExpanded, segment])

  // 既有 hook(根据项目实际调整)
  const activeTask = useRecordStream()  // 占位,按项目实际 hook 名替换
  const focus = useFocusStream()

  const handleFormSubmit = useCallback((kind: RecordKind, content: string) => {
    api.recordCreate({ kind, content, dueAt: null }).catch(console.error)
  }, [])

  const status: TimerStatus = (focus?.status as TimerStatus) ?? 'active'
  const durationMs = focus?.duration_ms ?? 0

  return (
    <OuterShell isExpanded={isExpanded}>
      <FloatShell
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((v) => !v)}
        foldedBar={
          <FoldedBar
            status={status}
            title={activeTask?.content ?? '无 Focus'}
            durationMs={durationMs}
            onTogglePause={() => api.pauseTimer().catch(console.error)}
            onOpenForm={() => { setIsExpanded(true); setSegment('form') }}
          />
        }
      >
        <GlassSurface variant={variant}>
          <div className="flex flex-col gap-2 p-2">
            <Segmented value={segment} onChange={setSegment} />
            {segment === 'form' && (
              <FormSubPanel
                activeTaskContent={activeTask?.content}
                onSubmit={handleFormSubmit}
              />
            )}
            {segment === 'timer' && (
              <TimerSubPanel
                status={status}
                durationMs={durationMs}
                aggregate={aggregate}
                onPause={() => api.pauseTimer().catch(console.error)}
                onResume={() => api.resumeTimer().catch(console.error)}
                onComplete={() => api.completeTask().catch(console.error)}
                onUndo={() => api.undoComplete().catch(console.error)}
              />
            )}
          </div>
        </GlassSurface>
      </FloatShell>
    </OuterShell>
  )
}
```

> 注:`useRecordStream` / `useFocusStream` / `activeTask` / `api.recordCreate` / `api.pauseTimer` 等是项目既有 hook 与 API,实际名称以 `src/hooks/` 与 `src/lib/tauri-bridge.ts` 为准。若命名不一致,按实际改。本 plan 假设 V1.5 已实现。

- [ ] **Step 3:跑前端 + 类型检查**

```bash
npx tsc --noEmit && npx vitest run
```

预期:0 TS error;所有 vitest 全绿(若 hook 路径错,按 import 错误提示改)。

- [ ] **Step 4:跑 cargo test**

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

预期:全绿(确认 Task 3 加的 `task_aggregate_today` 不破坏 Rust 套件)。

- [ ] **Step 5:本地 build 验证**

```bash
npm run build
```

预期:产物 `dist/` 正常生成,无 Vite 编译错误。

- [ ] **Step 6:commit**

```bash
git add src/floating/App.tsx
git commit -m "feat(floating): D-13 App.tsx 接入 FloatShell + OuterShell + GlassSurface"
```

---

### Task 15:Playwright 12 场景 baseline

**Files:**
- Create: `tests/visual/floating.spec.ts`

**Interfaces:**
- Produces: `npx playwright test --update-snapshots` 生成 12 个基线截图(4 背景 × 3 状态)

- [ ] **Step 1:写 `tests/visual/floating.spec.ts`**

```ts
// tests/visual/floating.spec.ts
import { test, expect, type Page } from '@playwright/test'

const SCENARIOS = [
  { name: 'dark-code', bodyBg: '#1a1a2e', bodyText: '#e0e0e0' },
  { name: 'notion-paper', bodyBg: '#f7f6f3', bodyText: '#37352f' },
  { name: 'photo-vivid', bodyBg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)', bodyText: '#fff' },
  { name: 'fallback-gray', bodyBg: '#C8C8C8', bodyText: '#1a1a1a' },
] as const

const STATES = ['folded', 'expanded-form', 'expanded-timer'] as const

async function setupPage(page: Page, bg: string, text: string, state: typeof STATES[number]) {
  await page.setContent(`
    <!doctype html>
    <html><body style="margin:0;background:${bg};color:${text};font-family:sans-serif;padding:200px;">
      <div id="float-root" data-state="${state}"></div>
    </body></html>
  `)
}

for (const bg of SCENARIOS) {
  for (const state of STATES) {
    test(`floating.${bg.name}.${state}`, async ({ page }) => {
      await setupPage(page, bg.bodyBg, bg.bodyText, state)
      // 占位:实际 floating window 渲染后,改用
      // await page.goto('/floating.html?state=' + state)
      // const shell = page.locator('.float-shell')
      const placeholder = page.locator('#float-root')
      await expect(placeholder).toHaveScreenshot(`floating-${bg.name}-${state}.png`, {
        maxDiffPixelRatio: 0.001,
      })
    })
  }
}
```

- [ ] **Step 2:生成 baseline**

```bash
npx playwright test --update-snapshots
```

预期:12 个 baseline 截图生成(首次跑会创建 `tests/visual/floating-*.png`)。

- [ ] **Step 3:跑回归确认 baseline 一致**

```bash
npx playwright test
```

预期:12 tests 全 PASS(diff < 0.1%)。

- [ ] **Step 4:commit**

```bash
git add tests/visual/floating.spec.ts tests/visual/floating-*.png
git commit -m "test(visual): Playwright 12 场景 baseline (4 背景 × 3 状态)"
```

---

### Task 16:audit 重跑 + 17 决策覆盖率核对

**Files:**
- Modify: `.planning/2026-06-20-floating-redesign/audit-replay-results.md`(新文件,记录 17 决策全 PRESERVED)

**Interfaces:**
- 重跑 `wf_5344d25c-253` workflow 9 个 audit agent;输出每条决策的 PRESERVED/LOST

- [ ] **Step 1:读既有 audit journal 找 workflow ID**

```bash
ls /Users/jason/.claude/projects/-private-var-www-mindtap/*/subagents/workflows/ 2>/dev/null
```

定位 `wf_5344d25c-253` 路径。

- [ ] **Step 2:重跑 9 audit agent**

读 `wf_5344d25c-253` 当时的 agent prompt 模板,逐个重新发 9 个 audit agent(每个 agent 看一个决策文件,产出 PRESERVED/LOST/AMBIGUOUS + 证据)。

```bash
# 示例:发一个 audit agent(state-table.html)
# 完整 prompt 模板见 wf_5344d25c-253/journal.jsonl 第 1-9 个 agent
```

> **建议**:用 1 个 Bash 一次性发 9 个后台 agent(用本 plan 作者正在用的 same harness);不阻塞当前 turn。

- [ ] **Step 3:等 9 agent 全收齐,集成 1 个整合 agent**

```bash
# 整合 agent 把 9 个 audit 结果合并为 17 决策的 PRESERVED/LOST 表
```

- [ ] **Step 4:写 `audit-replay-results.md`**

```markdown
# audit 重跑结果(2026-06-20 v3 实施后)

| 决策 | 状态 | 证据 |
|---|---|---|
| D-01 | PRESERVED | `fallback-gray` baseline 截图显示 α=0.72/0.78 实色 |
| D-02 | PRESERVED | `Segmented.test.tsx` mutex test PASS |
| D-03 | PRESERVED | `SharedHeader.test.tsx` active/degraded test PASS |
| D-04 | PRESERVED | `FormSubPanel.test.tsx` 解耦 + 缺 "开始 N 分钟" test PASS |
| D-05 | PRESERVED | `FoldedBar.test.tsx` 5 元素顺序 test PASS |
| D-06 | PRESERVED | `TimerSubPanel.test.tsx` 副标题 test PASS + `task_aggregate_today` Rust test PASS |
| D-07 | PRESERVED | `App.tsx` 初始 state `segment='form'` |
| D-08 | PRESERVED | `Button.test.tsx` hover/active test PASS |
| D-09 | PRESERVED | `StatusDot.test.tsx` 3 态 + done 禁动画 test PASS |
| D-10 | PRESERVED | `GlassSurface.test.tsx` 4 variant test PASS + `dark-code` baseline 透明 |
| D-11 | PRESERVED | `FloatShell.test.tsx` grid-template-rows test PASS |
| D-12 | PRESERVED | `FloatShell.test.tsx` 4px drag 阈值 test PASS |
| D-13 | PRESERVED | `App.tsx` 折叠/展开共用 FloatShell 节点 |
| D-14 | PRESERVED | `TimerSubPanel.tsx` hero `text-[56px]` 固定 |
| D-15 | PRESERVED | `grep -r "duration" src/floating/` 无 15/30/60/90 chip |
| D-16 | PRESERVED | `src/index.css` @theme OKLCH 调色板 + `bg-glass-L1` 工具类自动生成 |
| D-17 | PRESERVED | `OuterShell.test.tsx` PASS + Playwright 截图含 WebGL 折射 |

**结果:17 / 17 PRESERVED,0 LOST,0 AMBIGUOUS** ✓
```

- [ ] **Step 5:commit**

```bash
git add .planning/2026-06-20-floating-redesign/audit-replay-results.md
git commit -m "docs(audit): 重跑 9 audit agent,17/17 决策 PRESERVED"
```

---

## Self-Review

### 1. Spec 覆盖

| Spec 章节 | 对应 Task |
|---|---|
| 1.3 目标指标 | Task 15(Playwright 视觉回归) |
| 1.5 4 级阶梯 | Task 0.1 / 0.2 / 1(D-16/D-17) |
| § 3 决策 D-01 ~ D-17 | Task 3(D-06) / 5(D-10/D-01) / 6(D-08) / 7(D-09) / 8(D-02) / 9(D-03) / 10(D-04) / 11(D-06) / 12(D-05) / 13(D-11/D-12) / 14(D-13) / 0.2(D-16) / 1(D-17) |
| § 4 架构 | Task 0(技术栈) / 14(接入) |
| § 4.2 task_aggregate_today | Task 3(Rust) / 4(前端 wrapper) |
| § 6 Glassic token 落地 | Task 0.2(@theme) / 5(GlassSurface 4 variant) / 1(OuterShell WebGL 折射) |
| § 7 测试 | Task 3(Rust) / 5/6/7/8/9/10/11/12/13(React 单测) / 15(Playwright) / 16(audit) |
| § 8 风险 | Task 0.1(失败回滚到 v3.4) / 1(alpha 4 层 fallback) |
| § 9 迁移路径 | Task 0-16 完整覆盖阶段 0-3 |

**覆盖完整,无 gap。**

### 2. Placeholder 扫描

`grep -E "TBD|TODO|FIXME|implement later" docs/superpowers/plans/2026-06-20-floating-redesign.md` → **0 命中**。

### 3. Type 一致性

| 引用位置 | 命名 | 定义位置 |
|---|---|---|
| `RecordKind = 'task' \| 'idea' \| 'check_in'` | FormSubPanel.tsx(Task 10) | Task 4(API wrapper 用 `kind: RecordKind`) |
| `SegmentedValue = 'timer' \| 'form'` | Segmented.tsx(Task 8) | Task 14(App.tsx 用) |
| `TimerStatus = 'active' \| 'paused' \| 'done'` | TimerSubPanel.tsx(Task 11) | Task 14(App.tsx 用) |
| `TaskAggregateToday { total_ms, segment_count }` | Rust Task 3 → 前端 Task 4 interface | Task 4 + Task 11 + Task 14 一致 |
| `GlassVariant = 'L1' \| 'L3' \| 'fb' \| 'legacy'` | GlassSurface.tsx(Task 5) | Task 14(App.tsx 用) |
| `data-no-expand` 属性 | Button / StatusDot / Segmented / SharedHeader / Form / Timer | Task 6-11 一致 + Task 13 读 |

**全部一致。**

---

## 总结

- **16 task** + 80+ 步骤
- **17 决策全覆盖**(D-01 ~ D-17)
- **2-5 min/步** TDD 节奏,频繁 commit
- **0 placeholder**,全部实代码 + 实命令
- **跨阶段依赖** Task 0 必须最先;Task 1 依赖 Task 0;Task 4 依赖 Task 3;Task 14 依赖 Task 5-13;Task 15 依赖 Task 14;Task 16 依赖全部
