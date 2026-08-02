# fix(floating): 黑边真根因修复 — FoldedBar inline style box-shadow 挪到 CSS

> 创建: 2026-07-13
> 旧目录: 无(新发现 — V0.2.0.8 黑边修复漏掉 FoldedBar inline style 这个真根因)
> 版本: **V0.2.0.10**(V0.2.0 的第 10 个 PATCH)
> 优先级: **P1**(V0.2.0.8 黑边修复的 v7 回归,真根因漏修)
> **归属判定**: 见 [`docs/tech/v0.2.0-floating-window-tech.md` §1.3 + §6.1`](../../tech/v0.2.0-floating-window-tech.md) — 折叠态视觉规范在范围内
> **关联 PRD**: [`docs/prd/v0.2.0-floating-window-prd.md` §3.1 折叠态](../../prd/v0.2.0-floating-window-prd.md)
> **关联 retro**: [`docs/reports/v0.2.0-retrospective.md`](../../reports/v0.2.0-retrospective.md)(待补)

## Why

V0.2.0.8(原 V0.2.8 Issue C 黑边修复)声称"删 .floating-root inset highlight 模拟边框",代码改了,但用户 D:\ 端实测 DevTools `computed box-shadow` 仍含 `inset 0 1px 0 ...` — 修复没生效。

**真根因**:`FoldedBar.tsx:31` 有 inline style `style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.6), ..." }}`,inline style 优先级最高(1000),覆盖 `.floating-root` CSS 类里所有 `box-shadow` 改动。V0.2.0.8 反复修的是 `.floating-root` CSS,**完全漏看了 FoldedBar 的 inline style** — 修错地方。

**反模式 14(反复修)+ 反模式 15(commit 谎改)双触发**:
- V0.2.0.6~0.9 四个 PATCH 都涉及浮窗表面 CSS,但**没人穷举所有 box-shadow 来源**(CSS 1 处 + FoldedBar inline style 1 处 = 至少 2 处),导致反复修都在错的层
- V0.2.0.8 commit message 写"删 .floating-root inset",但实际渲染的 box-shadow 是 FoldedBar inline style 提供的,**commit claim 与代码不一致**

**业务影响**:浮窗折叠态边缘仍出现灰色描边,用户感知为"黑边没修好",破坏 Liquid Glass 视觉一致性的核心承诺。

## What

修 `src/floating/components/FoldedBar.tsx` + `src/floating/styles/floating.css`:

1. **FoldedBar.tsx**:删 line 31 inline style `boxShadow` 字段,保留 `background` 半透明,内层 div 加 `folded-bar-inner` className
2. **floating.css**:在末尾追加 `.folded-bar-inner` 块,只保留 drop shadow(`box-shadow: 0 4px 16px rgba(0, 30, 80, 0.06)`),去掉 inset highlight — 跟 `.floating-root` 同思路(透明 + inset 在某些 DPI 合成出灰色描边)
3. **App.fix.test.tsx**:加 4 个 vitest 锁住防御未来回归:
   - FoldedBar.tsx 不含 inline style `boxShadow`(反模式 14/15 防御,剥注释后 grep)
   - FoldedBar.tsx 含 `folded-bar-inner` className(修复形态锁定)
   - floating.css 含 `.folded-bar-inner` 块
   - `.folded-bar-inner` 块的 `box-shadow` 不含 `inset`(反模式 16 防御:剥注释 + 剥 @media 嵌套)

## Done when

- [x] FoldedBar.tsx 内层 div 加 `folded-bar-inner` className,inline style 不再有 `boxShadow` 字段(只留 `background`)
- [x] floating.css 末尾加 `.folded-bar-inner` 块,box-shadow 仅保留 drop shadow,无 inset
- [x] App.fix.test.tsx 加 4 个锁住测试
- [x] **L1 vitest 全套 PASS**: 132/132 (24 files,新增 4 个 V0.2.0.10 测试 + V0.2.0.6~9 全部 22 个 + 其他 106 个)
- [x] **L2 grep 自查**:`grep -n "boxShadow" src/floating/components/FoldedBar.tsx` = 0 hits(commit claim 跟代码一致,反模式 15 防御)
- [ ] **L3 D:\ 端实测**(user 必走): Ctrl+C 重启 `scripts\dev.bat` → 浮窗折叠态 → DevTools F12 → 选中 `.folded-bar-inner` → Computed → `box-shadow` 不含 `inset` 关键词 + 浮窗边缘无灰色描边
- [ ] 沉淀:`docs/reports/v0.2.0.10-release-notes.md`(用户视角 5 行摘要)
- [ ] 通知 user D:\ `git pull origin develop`

## 反模式防御

- **反模式 14(反复修)**:列 root cause 一次修完 — 本次穷举所有 box-shadow 来源(CSS class + inline style),不再漏看 FoldedBar inline style 这层
- **反模式 15(commit 谎改)**:`grep -n "boxShadow" src/floating/components/FoldedBar.tsx` 验证 commit claim "删 inline style boxShadow" 真在源码落地
- **反模式 16(测试字面断言)**:剥 CSS 注释 + 剥 `@media` 嵌套后 match `.folded-bar-inner` 块;FoldedBar 源码 grep 排除 `//` + `*` 注释行后再断言
- **反模式 17**:不用 gh CLI / GitHub MCP 写 issue/PR,走纯 git + ssh(`git push origin develop` + D:\ `git pull`)
- **反模式 18**:CSS 静态扫描 regex 剥 `@media` / `@supports` / `@keyframes` 嵌套块后再 match 选择器,跟 V0.2.0.9 同思路

## 跨 task 依赖

- **阻塞 V0.2.0.6~0.9 retro 收口**: V0.2.0.10 修 V0.2.0.8 漏掉的真根因,V0.2.0.8 retro 段需要补一行"V0.2.0.10 才是 Issue C 真正修好"
- **影响 V0.2.0-retrospective §二 Bug 表**: C 行从"未完全修好"更新为"V0.2.0.10 PATCH 修复"

## 关联

- Tech §1 范围边界: [`docs/tech/v0.2.0-floating-window-tech.md`](../../tech/v0.2.0-floating-window-tech.md)
- PRD §3.1 折叠态: [`docs/prd/v0.2.0-floating-window-prd.md`](../../prd/v0.2.0-floating-window-prd.md)
- V0.2.0.8 黑边(漏修的真根因): [`../v0.2.0.8-fix-black-border/task.md`](../v0.2.0.8-fix-black-border/task.md)
- L3 findings 来源: [`docs/reports/2026-07-13-v0.2.7-l3-findings.md`](../../reports/2026-07-13-v0.2.7-l3-findings.md) §二 B (5 假设 + 5 歧义点) + §三 C 段
- 治理规则: [`docs/governance/versioning-rule.md`](../../governance/versioning-rule.md) §三 + [`docs/governance/l3-gating.md`](../../governance/l3-gating.md)
- 沉淀到 retro: [`docs/reports/v0.2.0-retrospective.md`](../../reports/v0.2.0-retrospective.md)(待补)