# P1 · Label + Input 之间 gap-1(4px)偏紧

> **优先级**: 🟠 P1(WCAG / Apple HIG 偏紧,影响表单可读性)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/06-color-and-contrast.md`](../../1-design/06-color-and-contrast.md)
> **关联原始**:
> - `0-originals/apple/hig/01-buttons.md`(控件间距规范)
> - `0-originals/apple/hig/08-accessibility.md`(控件可读性)

---

## 一、问题现状(代码实测)

`src/routes/Input.tsx:24,28,32`:

```tsx
<div className="flex flex-col gap-1 w-64">  // gap-1 = 4px,偏紧
  <Label required>姓名</Label>
  <Input placeholder="输入姓名" />
</div>
```

**问题**:Label + Input 之间只有 4px 间距,Apple HIG 推荐 **6-8px**(权威源:`0-originals/apple/hig/01-buttons.md`)。

视觉上 Label 跟 Input "粘"在一起,不利于眼睛区分。

## 二、规范要求

**Apple HIG Buttons 控件间距**:控件之间的距离应当至少 **6pt**(macOS 标准)。

**Material Design 3 控件间距**(参考):Label + Input 间距 = 4-8dp。

**iOS Human Interface Guidelines Form**:Label + Input 间距 = 8pt。

## 三、设计匹配

[`1-design/06-color-and-contrast.md`](../../1-design/06-color-and-contrast.md) §四 Color Token:

| Token | 值 |
|---|---|
| `--spacing-2` | 8px |
| `--spacing-3` | 12px |

## 四、解决路径

### 路径 LI-1:gap-1 → gap-2(8px,推荐)

```tsx
<div className="flex flex-col gap-2 w-64">
  <Label required>姓名</Label>
  <Input placeholder="输入姓名" />
</div>
```

| 优点 | 1 行 / 3 处改动,符合 Apple HIG 6-8pt 间距 |
| 缺点 | 比当前多 4px,可能改变 PageHeader 视觉密度 |

### 路径 LI-2:gap-1 → gap-1.5(6px)

```tsx
<div className="flex flex-col gap-1.5 w-64">
```

| 优点 | 介于 4-8px 之间,折中 |
| 缺点 | 6px 不在 `--spacing-N` token 体系(奇数) |

## 五、推荐

**LI-1**(token 化 + Apple HIG 合规)。

## 六、自检

| 检查项 | 方法 |
|---|---|
| Label + Input 视觉间距 ≥ 6px | dev tools 量 |
| 跟其他 form 控件间距一致 | 视觉对比 |
| 引用 `gap-2` 而非 `gap-1` | grep |

---

**引用源**:
- 设计规范 — [`1-design/06-color-and-contrast.md`](../../1-design/06-color-and-contrast.md) §四
- 原始资料 — `0-originals/apple/hig/01-buttons.md` + `0-originals/apple/hig/08-accessibility.md`