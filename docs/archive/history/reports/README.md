# L5 Reports — 验收报告 + retro + release notes(模板)

> **本文件夹**: `docs/reports/`
> **职责**: L1/L2/L3 三层证据 / release notes / retro / bug 列表
> **严禁出现**: 设计意图(已归档到 archive)

## 一、命名

```
docs/reports/
├── v<X.Y>.<Z>-release-notes.md    # PATCH 发版
├── v<X.Y>-release-notes.md        # MINOR 发版
├── v<X.Y>-retrospective.md        # MINOR 收尾 retro
├── v<X.Y>-<feature>-windows-qa.md # Windows 实测记录
├── v<X.Y>-<topic>-<date>.md       # 其他专题报告
```

例:
- `docs/reports/v0.2.0.6-release-notes.md`
- `docs/reports/v0.2.1-release-notes.md`
- `docs/reports/v0.2.0-retrospective.md`
- `docs/reports/2026-07-12-v0.2.0.5-windows-qa.md`

## 二、release notes 模板(PATCH 和 MINOR 通用)

```markdown
# V<X.Y>[.<Z>] Release Notes

> 发布日期: YYYY-MM-DD
> 上一版本: V<X.Y>[.<Z-1>]
> 对应 PRD: `docs/prd/v<X.Y>-<feature>-prd.md`

## 用户视角变更(5 行摘要)
1. <用户能看到的变更 1>
2. <用户能看到的变更 2>
3. ...

## 修复的 bug
| Bug | 描述 | task |
|---|---|---|

## 已知问题
- <issue> — <跟进版本>

## 验证证据
- L1 vitest: <N> tests PASS
- L2 静态: cargo/clippy/fmt/tsc PASS
- L3 实测: <evidence link>
```

## 三、retrospective 模板(MINOR 收尾)

```markdown
# V<X.Y> Retrospective

> 创建: YYYY-MM-DD
> 上一版本 retro: V<X.Y-1>
> 下一版本: V<X.Y+1>

## 1. 本版完成清单
- [ ] 功能 1
- [ ] 功能 2

## 2. 反模式沉淀
- 反模式 <N>: <表现> — 下版如何防御

## 3. 跨版本教训
- <lesson 1>

## 4. 待办 / carryover
- [ ] V<X.Y+1> 接收: <task>

## 5. 度量
- L1 测试数: <N>
- L3 实测覆盖: <X>/<Y> 用户场景
- commit 数 / commit 撒谎率: <N> / <X>%
```

## 四、Windows QA 实测报告模板

```markdown
# V<X.Y> <feature> — Windows QA 实测报告

> 实测日期: YYYY-MM-DD
> 实测人: <name>
> 设备: Win 11 24H2 x64
> 对应 PRD: `docs/prd/v<X.Y>-<feature>-prd.md`
> 对应 Tech: `docs/tech/v<X.Y>-<feature>-tech.md`(§5 L3 段)

## 1. 7 层 Visibility Checklist

| 层 | 状态 | 证据 |
|---|---|---|
| 1 Tauri 进程存活 | ✅/❌ | <evidence> |
| 2 webview 已创建 | ✅/❌ | <evidence> |
| 3 webview visible | ✅/❌ | <evidence> |
| 4 webview 内容加载 | ✅/❌ | <evidence> |
| 5 物理尺寸正确 | ✅/❌ | <evidence> |
| 6 物理位置避任务栏 | ✅/❌ | <evidence> |
| 7 视觉样式挂载 | ✅/❌ | <evidence> |

## 2. PRD 用户场景实测

| 场景 | 状态 | 备注 |
|---|---|---|
| §3.1 折叠态 | ✅/❌ | |
| §3.2 展开态 | ✅/❌ | |
| §3.3 状态机 | ✅/❌ | |

## 3. 实测截图 / 录屏
- <path>

## 4. 实测结论
- [ ] L3 PASS,可以发版
- [ ] L3 FAIL,不开 release;列出 follow-up
```

## 五、写作纪律

1. **release notes 必须 5 行摘要**:用户视角,不是技术视角
2. **retro 必须有反模式沉淀**:每个 MINOR 收尾必须挖出 N 个反模式进 `.claude/rules/` 或 memory
3. **Windows QA 报告 7 层全 ✅ 才能 release**:任一 ❌ → 不发版,开 follow-up task
4. **不做预测性结论**:"应该 PASS"不算 PASS,只有 ✅/❌ 二元

## 六、关联

- [doc-layers.md](../governance/doc-layers.md)
- [l3-gating.md](../governance/l3-gating.md) — L3 实测来源