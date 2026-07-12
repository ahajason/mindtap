
# 归档仅作参考 — .archive/ 与 V1.0 PRD 不是绝对标准

## 核心规则

**V1.0 PRD (`.archive/docs/projects/v1.0/prd-v1.2.md`) 及其衍生内容 (`.archive/src/`、`.archive/docs/`、`feat/floating-auto-collapse` 分支) 是已归档的历史快照。**

**仅作参考。不能作为当前版本的绝对标准、默认值、产品/设计/架构决策的依据。**

任何**非事实**内容 (设计意图、产品定位、决策取舍、计划排期、术语定义、架构选型、状态机不变量、用户画像、Sprint 计划) 在作为 Agent 行动依据之前，**必须经用户显式确认并记录为事实**，才能引用。

## 反模式

```text
1. 读到 .archive/docs/projects/v1.0/prd-v1.2.md 第 §2.1 节
2. 直接引用 "目标用户是 ENFP 创意人群" 作为用户画像依据
3. 写 plan / spec / docs 时把归档内容当作 "项目当前状态"
```

或者:

```text
1. AGENTS.md 写 "17 IPC 命令、18 Rust 测试"
2. Agent 看到这些数字就当真
3. 在 plan 里按这个数量去规划
```

**事实**: 这些数字是 AGENTS.md 从 `.archive/` 抄过来的快照，实际当前 develop (V0.1.6 Style Guide) 没有业务命令、0 个 Rust 测试。

## 事实 vs 非事实

| 类型 | 例子 | 处理 |
|---|---|---|
| **事实** | 提交 hash、文件存在与否、API 调用签名、SQLite 表名、技术栈版本号、commit 验证段 | 可直接引用 (但仍以 git / 文件读到的当前值为准) |
| **非事实** | 设计意图、产品定位、术语含义、状态机不变量、计划日期、用户画像、Sprint 排期、决策理由 | 必须用户确认后才能作为依据 |

## 触发条件 — 出现以下任一情况必须先停下来问用户

- 引用 `.archive/docs/projects/v1.0/prd-v1.2.md` 任何**非事实**段落作为产品 / 设计 / 架构依据
- 复用 `.archive/src/` 或 `.archive/src-tauri/src/` 代码到当前分支时 (即使原意清楚，也应说明 "从归档复用" + 用户确认)
- 把 `.archive/` 内容描述成 "项目当前状态"、"已经做的"、"现有的"
- AGENTS.md 描述与 `.archive/` / 当前代码 冲突时，默认以 **用户当前口径** 为准 (AGENTS.md 自身可能失同步)

## 正确做法 (引用归档前)

```text
1. 读到 .archive/ 内容
2. 分类: 这是事实 (commit hash / 文件存在) 还是非事实 (设计意图 / 决策)
3. 事实 → 直接引用 + 标注 "来源: .archive/..."
4. 非事实 → 停下来问用户:
   "我在 .archive/ 看到 X。V0.2 立项时 (2026-07-11) 未确认。
    V0.2 是否沿用 X? 还是有新的口径?"
5. 用户确认 → 记到 `docs/domain/v0.2-domain-model.md` 续段 / `docs/domain/adr/<NNN>-<topic>.md` ADR 落地(V0.2 `docs/projects/v0.2/` 已于 2026-07-13 整体迁移到 prd/domain 后废弃该路径)
6. 未确认 → 不引用,标记 "候选" 或 "待 V0.2 立项时确认"
```

## 跟其他规则关系

| 规则 | 关系 |
|---|---|
| `first-step-research.mdc` | 该规则说 "调研优先级 `.archive/src/` > docs"。本规则说 "查到后必须验证事实性"。**互补**: 先查，再验证 |
| `decision-method.mdc` | L2 (项目设计) 引用时，必须先确认 "这个设计是当前版本 (V0.x) 立项时确认的，不是从 .archive/ 抄过来的" |
| `dev-verify-before-commit.mdc` | 同源: 该规则说 "症状消失 ≠ 修复成功"。本规则说 "归档内容消失 (到 develop) ≠ 归档内容无效"。反向证据不等于有效证据 |
| `self-apply-after-write.mdc` | 本规则本身就是新规则，写完必须跑 7 项 self-apply 检验 (见下) |

## Self-Apply 7 项检验

| # | 检验项 | 本规则 |
|---|---|---|
| 1 | 关键路径列全了吗? | `.archive/src/` `.archive/src-tauri/src/` `.archive/docs/` `.archive/docs/projects/v1.0/` AGENTS.md `feat/floating-auto-collapse` worktree |
| 2 | 有具体执行步骤吗? | "分类 (事实/非事实) → 非事实问用户 → 用户确认 → 落到 CONTEXT.md / ADR → 才能引用" |
| 3 | 有触发条件吗? | 见 "触发条件" 节 (4 条) |
| 4 | 有反模式例子吗? | 见 "反模式" 节 (3 个) |
| 5 | 跟其他规则交叉引用了吗? | 见 "跟其他规则关系" 节 (4 条) |
| 6 | 有验证机制吗? | "每次引用 .archive/ 做依据前问: 这是事实吗? 用户确认过吗? 没确认就停" |
| 7 | 当下能说 "下次出现 X，我会自动做 Y" 吗? | "下次读到 .archive/ 内容做依据，我会先分类，非事实先问用户。AGENTS.md 描述与 .archive/ 冲突时，以用户当前口径为准" |

## 关联

- `docs/reports/v0.1.6-retrospective.md` — V0.1.6 retro 沉淀的 "反向症状消失 ≠ 修复生效" 教训 (本规则同源)
- `.archive/docs/projects/v1.0/prd-v1.2.md` — V1.0 时代产品宪法，已归档
- `docs/prd/v0.2.0-floating-window-prd.md` (基线 spec, 内容散拆自原 `docs/projects/v0.2/README.md`) — V0.2 立项文档，本规则首次应用场景
- `AGENTS.md` § "项目" 段当前描述的是 `.archive/` V1.0 状态，与 develop 失同步 (本规则适用)

## 首次应用案例

V0.2 立项 (2026-07-11) 时，README 草稿引用了 V1.0 PRD 的多项 "非事实" 内容 (3-1-0 铁律 / 7 大功能域 / 用户画像 / Sprint 排期等)。按本规则:
- **沿用不需重新确认**: 3-1-0 铁律 / 无导出 (V1.0 PRD D23) / 平台范围 (V1.0 PRD D21) 等**用户已多次表态**的硬约束 — 可作事实引用
- **必须 V0.2 立项时重新确认**: V0.2 是否仍以 ENFP 创意人群为目标用户 / V0.2 范围是否仍按 7 功能域组织 / Sprint 节奏是否沿用 — README §6.2 列为待用户拍板的开放问题