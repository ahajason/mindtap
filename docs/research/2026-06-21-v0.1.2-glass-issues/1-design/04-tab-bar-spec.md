# 04 · Tab bar 设计规范

> **层级**: 1-design / Tab bar
> **创建**: 2026-06-21
> **作用**: Tab bar 必须遵守的规范
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/hig/03-tab-bars.md`(Tab bar 6 最佳实践)

---

## 一、Tab bar 在分层中的归属

**Tab bar 是 L2 容器层,使用玻璃材质。** 通常在窗口底部(macOS 也允许顶部),用于同等地位的主导航切换。

## 二、6 最佳实践(权威源:Apple HIG Tab bars)

| # | 原则 | 规范 |
|---|---|---|
| 1 | **3-5 个 tab** | 过多失去焦点,过少显得空 |
| 2 | **同等地位** | Tab 之间是平等切换,不是层级关系 |
| 3 | **图标 + 文字** | 必须同时显示;不能只有 icon |
| 4 | **当前 tab 清晰** | tint + 加粗 + 不需要色块 |
| 5 | **避免 scroll** | 5 个以内,fit 一行,不要横向滚动 |
| 6 | **不要用 tab 隐藏主操作** | tab 是导航,主操作应该放 toolbar / button |

## 三、几何规范

| 维度 | 值 |
|---|---|
| **高度** | 44-50pt |
| **Tab 最小宽度** | 64px |
| **Tab padding** | 12px(左右)/ 4px(上下) |
| **Icon + Label 间距** | 4px |
| **Icon 尺寸** | 24x24pt |
| **Label 字号** | 10-11pt |

## 四、玻璃规范

| 属性 | 值 |
|---|---|
| Material depth | `--glass-depth-3`(标准玻璃) |
| Backdrop-filter | `blur(30px) saturate(180%)` |
| Background | `rgba(255, 255, 255, 0.65)`(Light) |
| Border top | `1px solid rgba(0, 0, 0, 0.06)` |
| Inset bottom highlight | `inset 0 -1px 0 rgba(255, 255, 255, 0.7)` |

> Tab bar 比 Sidebar 玻璃更深,因为它常承载当前页面的"主操作"焦点。

## 五、active/inactive 状态

| 状态 | 视觉 |
|---|---|
| **default** | icon `tertiaryLabel`,label 同色 |
| **selected** | icon `brand`,label `brand`,字重 semibold |
| **hover** | 背景 `rgba(0,0,0,0.04)` |

**不允许**:用色块 / badge 表示 selected tab(违反 Apple HIG §4)。

## 六、图标样式

| 场景 | 样式 |
|---|---|
| selected | `Hierarchical`(自动渲染 active tint) |
| default | `Hierarchical` 但 alpha 50% |
| 强调(罕见) | `Palette` 染色 |

## 七、Split View 中的角色

| 模式 | Tab bar 出现位置 |
|---|---|
| **Sidebar + Content** | 不出现(Sidebar 已是导航) |
| **Content only** | 窗口底部 |
| **Content + Detail** | 不出现(Detail 是导航) |

> **核心规则**:Tab bar 跟 Sidebar 不同时出现 —— 二选一。

## 八、无障碍

| 维度 | 规范 |
|---|---|
| Reduce Transparency | 95% alpha 实色 |
| VoiceOver | `role="tablist"`,每个 tab `role="tab"` + `aria-selected` |
| 键盘 | Tab 进入,← → 切换 |
| Focus ring | 2px brand color,≥ 3:1 |

---

**引用源**:
- Apple HIG Tab bars — `0-originals/apple/hig/03-tab-bars.md`
- WCAG / Apple HIG Accessibility — `0-originals/wcag/` + `0-originals/apple/hig/08-accessibility.md`