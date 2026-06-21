# P0-1 · 透明窗口穿透(WebView 完全透明,后面窗口穿透)

> **优先级**: 🔴 P0(根因,影响全部页)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/09-transparency-tier.md`](../../1-design/09-transparency-tier.md) §Tier 5 + §六决策树
> **关联原始**:
> - `0-originals/tauri/v2-window-customization.md`(`transparent: true` + `body { background: transparent }` 双 transparent)
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(vibrancy 设计前提)
> - `0-originals/microsoft/acrylic.md`(Background acrylic 适用场景)

---

## 一、问题表现(Image #4-#8 实测)

WebView 完全透明,后面用户工作窗口(终端、GitLab login、其他 app 文字)**直接穿透**到 Sidebar / Main 容器后面。Glass blur 后还是"灰色 + 透出文字",违背 vibrancy 的最基本假设(背景是低频内容)。

## 二、根因

```
tauri.conf.json transparent: true
       ↓
NSWindow.backgroundColor = .clear
       ↓
WKWebView 完全透明
       ↓
body { background: transparent }
       ↓
没有任何层提供 base color
       ↓
后面 macOS 窗口文字直接穿透
```

**权威源**:`0-originals/tauri/v2-window-customization.md` + `0-originals/apple/liquid-glass/03-hig-materials.md`

## 三、范式违反

| 范式 | 当前 | 违反 |
|---|---|---|
| Apple 自家应用 100% 用 NSVisualEffectView + base color | body transparent | ❌ |
| vibrancy 前提:背景是低频内容(纯色 / 渐变 / 模糊) | 后面是高对比窗口文字 | ❌ |
| Microsoft Acrylic:Background acrylic 需要 base color | 无 base color | ❌ |

**Apple 自家应用** — 系统设置 / Mail / Notes / Finder / Xcode:**没有任何应用让 webview 完全 transparent**。

## 四、解决路径

### 路径 B-1:Body 半透明 base color(短期)

```css
body {
  background: rgba(245, 249, 255, 0.92);  /* systemBackground + 92% alpha */
}
```

| 维度 | 评价 |
|---|---|
| 改动量 | 1 行 CSS |
| 解决 | 立即解决穿透 |
| 保留 | V0.1.1 glass 视觉效果(降 vibrance) |
| 失去 | 完全 transparent / 系统级 light-dark |

### 路径 B-2:Rust 注入 NSVisualEffectView(Apple 范式)

```rust
// src-tauri/src/lib.rs
use objc2_app_kit::{NSVisualEffectView, NSVisualEffectMaterial, NSVisualEffectState};

unsafe {
    let ns_window = ...;
    let effect = NSVisualEffectView::new();
    effect.setMaterial(NSVisualEffectMaterial::Sidebar);
    effect.setState(NSVisualEffectState::FollowsWindowActiveState);
    // insert as background of contentView
}
```

| 维度 | 评价 |
|---|---|
| 改动量 | 40-50 行 Rust |
| 解决 | 完全 + 系统级 active/inactive + light/dark |
| 风险 | objc NSException |
| 推荐度 | ⭐⭐⭐ 长期方案 |

### 路径 B-3:放弃 transparent(兜底)

```jsonc
{ "transparent": false, "decorations": true }
```

```css
body { background: #F5F9FF; }
```

| 维度 | 评价 |
|---|---|
| 改动量 | tauri.conf.json 2 字段 + 1 行 CSS |
| 失去 | macOS 26 Liquid Glass 视觉 |
| 推荐度 | ⭐ 不推荐(除非 B-1/B-2 失败) |

## 五、推荐

**B-1 立即实施(V0.1.2)+ B-2 后续(V0.2.x)**

理由:
- B-1 解决 90% 可见性,1 行 CSS,无风险
- B-2 才是 Apple 范式终极方案,需要 Tauri 集成测试
- B-3 是兜底,跟 V0.1.1 glass 重构成果背离

## 六、自检

| 检查项 | 方法 |
|---|---|
| 关闭应用后面穿透内容不再可见 | 视觉对比 Image #4-#8 |
| 玻璃材质仍保留 vibrance | blur 仍生效,但有 base color 锚点 |
| `body` 不再 `transparent` | `document.body` 查 `getComputedStyle.backgroundColor` |
| 系统 light/dark 切换正常 | 切换系统外观,base color 跟随 |

---

**引用源**:
- 设计规范 — [`1-design/09-transparency-tier.md`](../../1-design/09-transparency-tier.md)
- 原始资料 — `0-originals/tauri/v2-window-customization.md` + `0-originals/apple/liquid-glass/03-hig-materials.md` + `0-originals/microsoft/acrylic.md`
- 历史 findings — `02-macos-liquid-glass-system.md`(老 docs,待清理)