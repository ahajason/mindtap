import SwiftUI

/// 单元素 glass 覆盖。
/// Plan 用 `.glassEffect(_:in:)` view modifier — **该 API 在 macOS 26.5 SDK 未落地**
/// (见 WindowGlassBackground.swift 头注释)。
/// 临时方案:用 RoundedRectangle + 半透 fill + stroke 模拟,等 Apple 落地 .glassEffect
///  再切回真 Liquid Glass 实现。
public struct GlassOverlay: View {
    let tier: GlassTier

    public init(tier: GlassTier) {
        self.tier = tier
    }

    public var body: some View {
        RoundedRectangle(cornerRadius: tier.cornerRadius, style: .continuous)
            .fill(Color.white.opacity(tier.fillOpacity))
            .overlay {
                RoundedRectangle(cornerRadius: tier.cornerRadius, style: .continuous)
                    .stroke(Color.white.opacity(tier.borderOpacity), lineWidth: 1)
            }
    }
}
