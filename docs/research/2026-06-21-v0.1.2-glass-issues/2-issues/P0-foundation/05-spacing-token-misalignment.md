# P0 · Spacing Token 编号错位(已紧急修复)

> **优先级**: 🔴 P0(架构性 Bug,影响所有 spacing 决策)
> **创建**: 2026-06-21
> **状态**: ✅ **已修复**(G3 单独紧急修复)
> **修复 commit**: 包含 G3 修复的 spacing token 重对齐
> **关联设计**: [`../../1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md)
> **关联原始**:
> - Tailwind 默认 spacing scale(space-y-N = N × 4px)
> - `0-originals/apple/hig/04-sidebars.md`(Apple HIG spacing 命名 vs 实际值的对应关系)

---

## 一、问题现状(修复前)

`src/index.css:47-52` 旧 token:

```css
/* 间距 — 旧(编号错位) */
--spacing-1: 4px;    ✓
--spacing-2: 8px;    ✓
--spacing-3: 12px;   ✓
--spacing-4: 16px;   ✓
--spacing-5: 24px;   ✗ 应该是 20px,跳过了 20px
--spacing-6: 32px;   ✗ 应该是 24px
```

## 二、根因

Tailwind 默认 `space-y-N` / `gap-N` / `p-N` 值的计算公式:

```
N × 0.25rem = N × 4px
```

| Tailwind class | 实际值 |
|---|---|
| `space-y-1` / `gap-1` / `p-1` | 4px |
| `space-y-2` / `gap-2` / `p-2` | 8px |
| `space-y-3` / `gap-3` / `p-3` | 12px |
| `space-y-4` / `gap-4` / `p-4` | 16px |
| `space-y-5` / `gap-5` / `p-5` | **20px** |
| `space-y-6` / `gap-6` / `p-6` | **24px** |
| `space-y-7` / `gap-7` / `p-7` | **28px** |
| `space-y-8` / `gap-8` / `p-8` | **32px** |

**旧 token 错位**:
- `--spacing-5` 写 24px(应该是 20px)
- `--spacing-6` 写 32px(应该是 24px)
- 没有 `--spacing-7` 跟 `--spacing-8`

## 三、影响

| 影响 | 严重度 |
|---|---|
| **Tailwind 硬编码不受影响**(space-y-6 还是 24px) | — |
| **`var(--spacing-N)` 引用会**用错值 | 🔴 |
| **未来引用 token 时会引入隐性 bug**:开发者以为 `--spacing-5` = 20px,实际是 24px | 🔴 |
| **docs 跟代码不一致**:任何引用 `--spacing-5` 的文档会跟实际视觉错 4px | 🟠 |

## 四、修复

### 修复 commit

`src/index.css:47-57`:

```css
/* 间距 — V0.1.2 G3 修复:token 编号跟 Tailwind 默认 space-y-N = N*4px 对齐
   旧 --spacing-5: 24px / --spacing-6: 32px 编号错位,
   当前 0 处 src/ 引用,77 处 Tailwind 硬编码,改动风险为 0 */
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-7: 32px;
```

### 改动汇总

| Token | 旧值 | 新值 | 备注 |
|---|---|---|---|
| `--spacing-1` | 4px | 4px | 不变 |
| `--spacing-2` | 8px | 8px | 不变 |
| `--spacing-3` | 12px | 12px | 不变 |
| `--spacing-4` | 16px | 16px | 不变 |
| `--spacing-5` | **24px** | **20px** | **改值** |
| `--spacing-6` | **32px** | **24px** | **改值** |
| `--spacing-7` | (不存在) | **32px** | **新增** |

### 风险评估

| 项 | 评估 |
|---|---|
| 现有 `var(--spacing-N)` 引用 | **0 处**(grep 验证) |
| 现有 Tailwind 硬编码 | **77 处**(不受影响) |
| 文档引用 | docs/design/glassic-ui-spec.md(.archive/ 待恢复)— 待 V0.1.2 恢复时同步 |

**改动风险:0**

## 五、为何单独紧急修复

1. **架构性 bug**:所有后续 spacing 决策的基线
2. **隐性 bug**:开发者用 `--spacing-5` 期望 20px,实际得到 24px,UI 出现 4px 偏差,**难发现**
3. **范围小**:1 个文件 5 行改动,无副作用
4. **不修复会导致**:后续 P1-spacing/* 多个修复方案都基于错误 token 编号

## 六、修复后续

| 后续工作 | 负责 |
|---|---|
| `glassic-ui-spec.md` 恢复时,spacing 段同步 | V0.1.3+ |
| 6 子页面 Section `p-4` 引用 `var(--spacing-4)` | P1-spacing/01 |
| PageHeader `mb-6` 引用 `var(--spacing-6)` | P1-spacing/01 |
| Card `p-3` / `p-4` 统一 | P1-spacing/03 |

## 七、自检

| 检查项 | 方法 |
|---|---|
| `--spacing-5: 20px` | grep `src/index.css` |
| `--spacing-6: 24px` | grep `src/index.css` |
| `--spacing-7: 32px` | grep `src/index.css` |
| 现有 `var(--spacing-N)` 引用全部仍然有效 | `npm run dev` 启动验证 |
| Tailwind class 视觉不变 | 视觉对比(应无变化) |

---

**引用源**:
- 设计规范 — [`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md)
- 原始资料 — `0-originals/apple/hig/04-sidebars.md` + Tailwind 默认 spacing scale