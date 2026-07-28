# L2 Tech — 技术方案(模板)

> **本文件夹**: `docs/tech/`
> **职责**: 每个 feature 一份。含接口契约、数据模型、模块边界、DoD、**bug 归属边界**
> **严禁出现**: 用户故事、产品愿景、视觉稿、字体大小

## 一、命名

```
docs/tech/v<MAJOR>.<MINOR>-<feature>-tech.md
```

例:
- `docs/tech/v0.2.0-floating-window-tech.md`
- `docs/tech/v0.2.1-native-dynamic-material-tech.md`
- `docs/tech/v0.2.1-task-switching-tech.md`（历史参考，已 superseded）

## 二、模板

```markdown
# V<X.Y> <feature> — 技术方案

> 对应 PRD: `docs/prd/v<X.Y>-<feature>-prd.md`
> 范围: <一句话范围描述>
> 不在范围: <不在范围内的清单,会进 PATCH 归属判断>

## 1. 范围边界(bug 归属用)

### 1.1 在范围内(本方案管)
- <业务功能 X>
- <业务功能 Y>
- ...

### 1.2 不在范围内(归其他方案/版本)
- <业务功能 A> → V<X'.Y'>
- <业务功能 B> → V<X'.Y'>

### 1.3 bug 归属规则
任何 §1.1 列出的代码/UI/数据/事件路径上的 bug → 本版本 PATCH(V<X.Y>.0.<N+1>)。
任何 §1.2 列出的 → 不归本版本,另开 task + 版本号。
判断不出来时:问"修这个 bug 不修,本方案 §5 DoD 哪一条会 FAIL?"——能定位到任一条 → 在范围内;否则 → 不在。

---

## 2. 接口契约

### 2.1 Rust → JS(invoke)
| Command | 输入 | 输出 | 异常 |
|---|---|---|---|
| `<command_name>` | `{field: type}` | `<ReturnType>` | <error conditions> |

### 2.2 JS → OS(Tauri 2 Window API / DOM API)
| API | 用途 | 不变量 |
|---|---|---|

### 2.3 IPC seam
**唯一 seam**: `<seam path>`。新增命令必须三处都改:① Rust/Backend ② bridge.ts 包装 ③ 调用点。
任何不经过 seam 的调用都是反模式。

---

## 3. 数据模型

### 3.1 <表名> 表
| 字段 | 类型 | 约束 | 业务含义 |
|---|---|---|---|
| | | | |

### 3.2 索引
- `<index_name>`: <索引策略>

### 3.3 业务不变量(由 db 强制)
1. ...
2. ...

---

## 4. 模块边界

### 4.1 Backend(`<path>`)
- `<file 1>`: <职责>
- `<file 2>`: <职责>

### 4.2 Frontend(`<path>`)
- `<file 1>`: <职责>

### 4.3 配置(`<path>`)
- ...

---

## 5. DoD(验收清单)

### L1: vitest
- [ ] <N> tests PASS
- [ ] happy-dom(非 jsdom,因为 jsdom 不渲染 layout)
- [ ] 行为断言(`expect(api.x).toHaveBeenCalled()`)优于源码 regex 断言

### L2: 静态检查
- [ ] `cargo test` PASS
- [ ] `cargo clippy --all-targets` 无 warning
- [ ] `cargo fmt --check` PASS
- [ ] `npx tsc --noEmit` PASS

### L3: Windows 实测(hard gate — 见 `docs/governance/l3-gating.md`)
- [ ] 7 层 visibility checklist 全 PASS
- [ ] PRD §3.1-3.x 全部用户场景实测通过
- [ ] 双屏实测:IDE 输入时浮窗不弹(不抢焦)
- [ ] ...

### 反模式防御
- [ ] 反模式 14:同组 P0 fail 一次修完(不要分散 commit)
- [ ] 反模式 15:commit message claim 跟代码一致(写完 grep 自查)
- [ ] 反模式 16:行为断言 > 源码 regex 断言(排除注释行)

---

## 6. bug 归属边界(本方案生效后)

### 6.1 → 本版本 PATCH
任何下列路径的 bug,直接开 `docs/tasks/v<X.Y>.0.<N>-fix-<topic>/`:
- ...

### 6.2 → 另开版本
任何下列路径的 bug,不开本版本 PATCH:
- ...

---

## 7. 关联文档
- PRD: `docs/prd/v<X.Y>-<feature>-prd.md`
- 领域模型: `docs/domain/v<X.Y>-domain-model.md`
- 设计 spec: `docs/design/v<X.Y>-<feature>-design.md`
- 实施 plan: `docs/plans/YYYY-MM-DD-v<X.Y>-<feature>.md`
- 验收报告: `docs/reports/v<X.Y>-<feature>-windows-qa.md` + `v<X.Y>-<feature>-retrospective.md`
```

## 三、§1 范围边界是本层最重要的章节

`§1 范围边界` 是技术方案的**唯一不可省**章节:

- 决定 bug 归属(见 `docs/governance/versioning-rule.md` §二)
- 决定 PRD 引用时该引哪些
- 决定 L3 实测时该测哪些
- 决定 review 时该查哪些

写技术方案的第一步:**先写 §1,问用户拍板,再写其他章节**。

## 四、写作纪律

1. **可以出现**:命令名、表名、字段、模块路径、API 名、DoD 测试项
2. **严禁出现**:用户故事("Alice 早晨...")、产品愿景、视觉稿、字体大小
3. **§1 范围边界**必须写"在范围内"+"不在范围内"+"判断不出来怎么办"三段
4. **§6 bug 归属边界** 是 §1 的镜像,前者是设计时,后者是维护时

## 五、关联

- [doc-layers.md](../governance/doc-layers.md) — 文档分层总规则
- [versioning-rule.md](../governance/versioning-rule.md) — PATCH 命名 + 流程
- [l3-gating.md](../governance/l3-gating.md) — L3 Windows 实测强制