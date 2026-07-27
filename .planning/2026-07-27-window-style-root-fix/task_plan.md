# Task Plan: Window Style Root Fix

## Goal
重新整理用户对 floating window 的真实需求，基于历史失败证据制定根因修复与 Windows WebView2 验收方案；本轮不修改产品代码。

## Current Phase
Complete

## Phases

### Phase 1: Build red-capable feedback loop
- [x] 阅读历史报告、当前窗口实现与测试
- [x] 找到可捕获用户症状的跨层契约检查
- [x] 记录基线结果
- **Status:** complete

### Phase 2: Synthesize real requirements and root causes
- [x] 整理物理窗口、DOM 几何、材质样式、交互状态四层契约
- [x] 确认历史补丁反复失败模式
- [x] 区分 P0 根因和非本轮症状
- **Status:** complete

### Phase 3: Repair plan
- [x] 指定最小改动层和文件范围
- [x] 定义先判红后修复顺序
- [x] 定义停止与回滚条件
- **Status:** complete

### Phase 4: Verification plan
- [x] 定义自动回归矩阵
- [x] 定义 Windows WebView2 前后视觉对照验收
- [x] 明确证据和通过标准
- **Status:** complete

### Phase 5: Delivery and cleanup
- [x] 复核方案与 `develop` 历史证据一致
- [x] 确认未修改产品代码
- [x] 交付需求重述与修复方案
- **Status:** complete

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 以 local `develop` 为权威，不以 worktree 的 `origin/main` 为当前实现 | 当前 PATCH chain 到 `37d080e` 位于 develop |
| 维持 360×36 / 360×280 等宽两态 | V0.2.0.16 最新用户 L3 验收结论覆盖旧 320×36 spec |
| 把四状态而非两个页面作为验收模型 | empty/active × folded/expanded 的内容和控制不同 |
| P0 先修几何数学矛盾和双重材质 owner | 36px 高度与 24px padding + 36px row 不可同时成立；双 blur/background/shadow 级联不稳定 |
| G3 视觉值不再重选 | 用户已在 2026-07-13 对照中选择 fill 0.22/0.28/0.36 + 中性黑 shadow |
| 测试必须读取生产 artifact | 现有手写 CSS 字符串测试无法因生产代码变化而失败 |

## Errors Encountered
| Error | Resolution |
|-------|------------|
| 初始 worktree 从 `origin/main` 创建，缺少 develop PATCH chain | 发现后所有结论改为读取 `/home/jason/workspace/mindtap` local develop |
| 在错误基线运行 report `rg` 导致 develop-only 文件不存在 | 停止重试错误路径，改用绝对 develop 路径 Read |
