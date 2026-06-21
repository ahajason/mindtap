import SwiftUI
import AppKit

/// 整窗 glass 背景。
/// Plan 用 `.glassBackgroundEffect()` view modifier — **该 API 在 macOS 26.5 SDK 未落地**
/// (SDK SwiftUI module 只有 GlassButtonStyle / GlassProminentButtonStyle,
///  没有 .glassEffect / .glassBackgroundEffect)。
/// 改用 AppKit NSVisualEffectView 兜底,出 vibrancy 效果(不是 WWDC25 真 Liquid Glass,
/// 但视觉相近,待 Apple 落地 API 后切换)。
@MainActor
public enum WindowGlassBackground {
    public static func apply(to window: NSWindow) {
        guard let contentView = window.contentView else { return }

        let visual = NSVisualEffectView(frame: contentView.bounds)
        visual.autoresizingMask = [.width, .height]
        visual.material = .underWindowBackground
        visual.blendingMode = .behindWindow
        visual.state = .followsWindowActiveState

        contentView.addSubview(visual, positioned: .below, relativeTo: nil)
    }
}
