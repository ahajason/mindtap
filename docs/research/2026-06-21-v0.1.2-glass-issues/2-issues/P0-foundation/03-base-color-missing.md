# P0-3 · 缺少 base color 锚点(Glass 失去基础)

> **优先级**: 🔴 P0(根因,跟 P0-1 共生)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/09-transparency-tier.md`](../../1-design/09-transparency-tier.md) §六
> **关联原始**:
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(vibrancy 在 base color 上工作)
> - `0-originals/microsoft/acrylic.md`(recipe: background → blur → exclusion → tint → noise)

---

## 一、问题表现

`body { background: transparent }` + `transparent: true`,导致 webview 完全无 base color。这让:
- vibrancy / glass 没有"低频锚点"
- 后面窗口内容直接穿透
- Light/Dark mode 切换时,玻璃材质无法跟随(因 webview 没东西可以 tint)

## 二、根因

```
vibrancy 设计前提:
  background (低频) → blur → tint → noise → 最终视觉
       ↑
   这个 background 不存在!
```

**Apple HIG Materials 原文**:vibrancy 在 base color 上工作,不是替代它。

**Microsoft Acrylic 原文**:`The acrylic recipe: background, blur, exclusion blend, color/tint overlay, noise` — background 是第一层。

## 三、设计匹配

[`1-design/09-transparency-tier.md`](../../1-design/09-transparency-tier.md) §六 Tier 5 决策树:

> Tier 5 + body 半透明 base color = 短期过渡方案
> 没有 base color 的 Tier 5 = 不可用方案

## 四、解决路径(跟 P0-1 共用)

| 路径 | 跟 P0-1 关系 |
|---|---|
| B-1 body 半透明 base color | 一并解决 P0-1 + P0-3 |
| B-2 NSVisualEffectView | 完全替代(base color 由系统提供) |
| B-3 放弃 transparent | 一并解决 |

## 五、base color 选色建议

### Light mode

| Token | 值 | 出处 |
|---|---|---|
| 系统 background | `#F5F9FF` | macOS systemBackground |
| vibrancy anchor | `rgba(245, 249, 255, 0.92)` | Apple HIG |
| 半透明 | `rgba(245, 249, 255, 0.85)` | 过渡 |

### Dark mode

| Token | 值 |
|---|---|
| 系统 background | `#1A1A1A` |
| vibrancy anchor | `rgba(20, 20, 20, 0.92)` |

### 高对比 / Accessibility

| 模式 | base color |
|---|---|
| Reduce Transparency | `rgba(245, 249, 255, 0.98)` |
| Increase Contrast | `#FFFFFF`(实色) |
| High Contrast mode | 系统色 |

**权威源**:Apple HIG Color + WCAG 1.4.3 + Microsoft Acrylic Battery Saver

## 六、自检

| 检查项 | 方法 |
|---|---|
| `body` 有 background color(非 transparent) | dev tools 查 `getComputedStyle.backgroundColor` |
| Light/Dark 切换时,玻璃 tint 跟随 | 切系统外观观察 |
| 后面窗口穿透不再可见 | 视觉对比 |
| 文字在 base + glass 上对比度 ≥ 4.5:1 | WebAIM checker |

---

**引用源**:
- 设计规范 — [`1-design/09-transparency-tier.md`](../../1-design/09-transparency-tier.md)
- 原始资料 — `0-originals/apple/liquid-glass/03-hig-materials.md` + `0-originals/microsoft/acrylic.md`