# L3 Design — 设计 spec(模板)

> **本文件夹**: `docs/design/`
> **职责**: 视觉稿 / 组件契约 / 交互细节 / token 引用 / a11y 注解
> **严禁出现**: 表名、字段、IPC 命令、SQL 语句、模块文件路径

## 一、命名

```
docs/design/
├── glassic-ui-spec.md          # 全局视觉规范(已有,横跨所有版本)
├── glass-tokens.md             # Tailwind tokens + CSS(已有)
├── component-format.md         # 组件格式约定(已有)
└── v<X.Y>-<feature>-design.md  # 每个 feature 一份
```

## 二、Feature 设计 spec 模板

```markdown
# V<X.Y> <feature> — 设计 spec

> 对应 PRD: `docs/prd/v<X.Y>-<feature>-prd.md`
> 对应 Tech: `docs/tech/v<X.Y>-<feature>-tech.md`
> 视觉规范: 全局遵守 `docs/design/glassic-ui-spec.md`(token / glass 等级 / 组件格式)

## 1. 屏幕 + 状态

### 1.1 屏幕列表
| 屏幕 | 路径 | 触发 |
|---|---|---|
| | | |

### 1.2 状态列表
| 状态 | 触发条件 | 视觉差异 |
|---|---|---|
| | | |

## 2. 组件契约

### 2.1 <组件名>
**职责**: ...
**Props**(语义级,不绑具体 React props 名):
- ...
**视觉规范**:
- glass 等级: L0 / L1 / L2 / L3
- 颜色 token: `bg-glass-l2-emphasis` 等(查 `glass-tokens.md`)
- 圆角: `<X>px`
- 阴影: `<token>`
**交互状态**:
- default / hover / active / focus / disabled
**a11y**:
- role: ...
- aria-*: ...

## 3. 交互细节

### 3.1 <交互名>
**触发**: ...
**动效**: ...(缓动函数 + 时长)
**响应**: ...

## 4. 视觉稿链接
- Figma: <link>
- 截图: `<path>`

## 5. 关联
- 视觉规范: `docs/design/glassic-ui-spec.md`
- PRD: `docs/prd/v<X.Y>-<feature>-prd.md`
- Tech: `docs/tech/v<X.Y>-<feature>-tech.md`
```

## 三、写作纪律

1. **可以出现**:颜色 token、glass 等级、组件名(语义级)、交互描述、a11y 注解
2. **严禁出现**:表名、字段、IPC 命令、模块路径、`useState`、`useEffect`
3. **组件契约只讲语义**:写"输入字段上限 50 字符"而不是"`maxLength={50}`"
4. **每个组件标 a11y**:role、aria-*、键盘操作——可访问性是设计的一部分,不是附加
5. **视觉规范优先查 token**:任何颜色/圆角/阴影先查 `glassic-ui-spec.md`,不自己造

## 四、关联

- [doc-layers.md](../governance/doc-layers.md)
- `docs/design/glassic-ui-spec.md` — 视觉规范真值
- `docs/design/glass-tokens.md` — token 真值