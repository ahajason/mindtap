---
title: SwiftUI — Applying Liquid Glass to custom views
source: https://developer.apple.com/documentation/SwiftUI/Applying-Liquid-Glass-to-custom-views
fetched: 2026-06-14
tags: [swiftui, liquid-glass, custom-view, glassEffect, projects-v1]
---

# SwiftUI: Applying Liquid Glass to custom views

> **对 projects 的价值**：🔴 **P0**。这是 Apple 关于 `glassEffect(_:in:)` 的**权威教程**——被 materials.md、adopting.md、Landmarks 4 个子教程引用 3+ 次。是 projects 自定义 Liquid Glass 元素（浮动 [+] 按钮、玻璃徽章）时的**必读**。

## 核心定义

> Use the `glassEffect(_:in:)` modifier to add Liquid Glass effects to a view. By default, the modifier uses the `regular` variant of `Glass` and applies the given effect within a `Capsule` shape behind the view's content.

**默认值**：
- variant = `Glass.regular`
- shape = `Capsule`
- 应用位置 = view content **之后**

## 3 步基础

### Step 1: 最简单的用法

```swift
Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect()
```

### Step 2: 自定义 shape + cornerRadius

```swift
Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect(in: .rect(cornerRadius: 16.0))
```

**何时用 `.rect(cornerRadius:)` vs 默认 `Capsule`**：
- 默认 `Capsule` 适合**窄而长**的元素（按钮、标签）
- 较**大**的组件 → 用 `.rect(cornerRadius:)`，否则显得奇怪

### Step 3: 加 tint + interactive

```swift
Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect(.regular.tint(.orange).interactive())
```

**3 个可叠加的配置**：

| 配置 | 作用 |
|---|---|
| `.regular` / `.clear` | 玻璃变体（见 [hig/07-color.md 和 hig/03-hig-materials.md]） |
| `.tint(.orange)` | 染色（强调 / 突出） |
| `.interactive()` | **响应触摸和指针交互**——与 `.buttonStyle(.glass)` 同款反应 |

## 组合：GlassEffectContainer

> Use `GlassEffectContainer` when applying Liquid Glass effects on multiple views to achieve the best rendering performance. A container also allows views with Liquid Glass effects to blend their shapes together and to morph in and out of each other during transitions.

**两件事**：
1. ✅ **性能**：避免每个 glass 元素独立渲染
2. ✅ **形变**：让 glass 元素**互相融合、形变、过渡**

### 关键参数：spacing

```swift
GlassEffectContainer(spacing: 40.0) {
    HStack(spacing: 40.0) {
        Image(systemName: "scribble.variable")
            .frame(width: 80.0, height: 80.0)
            .font(.system(size: 36))
            .glassEffect()
        
        Image(systemName: "eraser.fill")
            .frame(width: 80.0, height: 80.0)
            .font(.system(size: 36))
            .glassEffect()
            .offset(x: -40.0, y: 0.0)  // 演示 glass 元素互相反应
    }
}
```

**spacing 规则**：
- **container spacing > 内层 layout spacing** → glass 元素在静止时**就已经融合**（避免这种状态）
- **container spacing ≤ 内层 layout spacing** → glass 元素静止时**独立**，动画时**形变**
- spacing 越大，glass 元素越早融合

### 多个独立 glass 元素 union 成一个

> Use the `glassEffectUnion(id:namespace:)` modifier to specify that a view contributes to a unified effect with a particular ID.

```swift
let symbolSet: [String] = ["cloud.bolt.rain.fill", "sun.rain.fill", "moon.stars.fill", "moon.fill"]

GlassEffectContainer(spacing: 20.0) {
    HStack(spacing: 20.0) {
        ForEach(symbolSet.indices, id: \.self) { item in
            Image(systemName: symbolSet[item])
                .frame(width: 80.0, height: 80.0)
                .font(.system(size: 36))
                .glassEffect()
                .glassEffectUnion(id: item < 2 ? "1" : "2", namespace: namespace)
        }
    }
}
```

**效果**：4 个图标中前 2 个**合并为 1 个 glass capsule**，后 2 个**合并为另 1 个**。

## 形变：glassEffectID + withAnimation

### 完整模式

```swift
@State private var isExpanded: Bool = false
@Namespace private var namespace

var body: some View {
    GlassEffectContainer(spacing: 40.0) {
        HStack(spacing: 40.0) {
            Image(systemName: "scribble.variable")
                .frame(width: 80.0, height: 80.0)
                .font(.system(size: 36))
                .glassEffect()
                .glassEffectID("pencil", in: namespace)
            
            if isExpanded {
                Image(systemName: "eraser.fill")
                    .frame(width: 80.0, height: 80.0)
                    .font(.system(size: 36))
                    .glassEffect()
                    .glassEffectID("eraser", in: namespace)
            }
        }
    }
    
    Button("Toggle") {
        withAnimation {
            isExpanded.toggle()
        }
    }
    .buttonStyle(.glass)
}
```

**3 要素**（缺一不可）：
1. `GlassEffectContainer` 包裹
2. 每个 glass 元素 `.glassEffectID(_:in:)`
3. 状态变更用 `withAnimation`

### 两种 transition

| Transition | 何时用 | 行为 |
|---|---|---|
| `matchedGeometry`（默认）| glass 元素**距离 ≤ container spacing** | 形变（morph） |
| `materialize` | glass 元素**距离 > container spacing** | 出现 / 消失（materialize 动画） |

```swift
// 全局默认
.glassEffectTransition(.matchedGeometry)

// 显式
.glassEffectTransition(.materialize)
```

> 建议**全 app 统一** transition 类型，给用户一致的体验。

## 性能优化铁律

> Creating too many Liquid Glass effect containers and applying too many effects to views outside of containers can degrade performance. Limit the use of Liquid Glass effects onscreen at the same time.

| 行为 | 是否推荐 |
|---|---|
| 用 `GlassEffectContainer` 组合多个 glass 元素 | ✅ 强烈推荐 |
| 限制**同时**显示的 glass 元素数量 | ✅ 强烈推荐 |
| 给视图**外**（无 container 包裹）加 `.glassEffect` | ❌ 性能差 |
| 创建过多的 `GlassEffectContainer` | ❌ 性能差 |

## 跨 API 速查

| API | 说明 | 文档 |
|---|---|---|
| `View.glassEffect(_:in:)` | 给视图加 Liquid Glass | [doc](https://developer.apple.com/documentation/SwiftUI/View/glassEffect(_:in:)) |
| `View.glassEffectID(_:in:)` | 给 glass 元素 ID（形变动画用） | [doc](https://developer.apple.com/documentation/SwiftUI/View/glassEffectID(_:in:)) |
| `View.glassEffectUnion(id:namespace:)` | 多个 glass 元素 union 为一个 | — |
| `View.glassEffectTransition(_:)` | 指定形变 transition 类型 | — |
| `GlassEffectContainer` | 组合容器（性能 + 形变） | [doc](https://developer.apple.com/documentation/SwiftUI/GlassEffectContainer) |
| `GlassEffectTransition` | transition 类型枚举 | [doc](https://developer.apple.com/documentation/SwiftUI/GlassEffectTransition) |
| `Glass.regular` / `Glass.clear` | glass 变体 | [doc](https://developer.apple.com/documentation/SwiftUI/Glass) |
| `Glass.interactive(_:)` | 响应交互配置 | [doc](https://developer.apple.com/documentation/SwiftUI/Glass/interactive(_:)) |
| `withAnimation(_:_:)` | 触发形变 | [doc](https://developer.apple.com/documentation/SwiftUI/withAnimation(_:_:)) |
| `@Namespace` | SwiftUI 命名空间 | [doc](https://developer.apple.com/documentation/SwiftUI/Namespace) |

## projects 适用场景

### 场景 A：浮动 [+] 按钮 + 快速操作弹窗（🔴 P0）

```swift
@State private var isQuickActionExpanded = false
@Namespace private var liquidNamespace

GlassEffectContainer(spacing: 40.0) {
    VStack(spacing: 12) {
        if isQuickActionExpanded {
            QuickActionButton(title: "情绪", systemImage: "face.smiling")
                .glassEffect()
                .glassEffectID("mood", in: liquidNamespace)
            
            QuickActionButton(title: "灵感", systemImage: "lightbulb")
                .glassEffect()
                .glassEffectID("idea", in: liquidNamespace)
        }
        
        Button {
            withAnimation { isQuickActionExpanded.toggle() }
        } label: {
            Image(systemName: isQuickActionExpanded ? "xmark" : "plus")
                .font(.title2)
        }
        .buttonStyle(.glassProminent)
        .glassEffectID("mainButton", in: liquidNamespace)
    }
}
```

### 场景 B：完成 todo 的形变动画（🟡 P1）

完成 todo 时，checkbox 形变到列表下一行。

### 场景 C：概览页 hero 图的 clear glass 变体（🟢 P2）

```swift
Image("hero")
    .glassEffect(.clear, in: .rect(cornerRadius: 24))
```

适合**媒体背景**（图片 / 视频）上方的玻璃。

## 相关资源

- [Landmarks 总体介绍](./landmarks/01-overview.md)
- [Landmarks: Custom activity badges](./landmarks/05-custom-badges.md)
- [HIG materials（regular vs clear 变体）](../hig/03-hig-materials.md)
- 原文：https://developer.apple.com/documentation/SwiftUI/Applying-Liquid-Glass-to-custom-views
