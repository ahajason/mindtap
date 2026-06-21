import SwiftUI

public struct GlassOverlay: View {
    let tier: GlassTier

    public init(tier: GlassTier) {
        self.tier = tier
    }

    public var body: some View {
        RoundedRectangle(cornerRadius: tier.cornerRadius, style: .continuous)
            .fill(.white.opacity(tier.fillOpacity))
            .overlay {
                RoundedRectangle(cornerRadius: tier.cornerRadius, style: .continuous)
                    .stroke(.white.opacity(tier.borderOpacity), lineWidth: 1)
            }
            .glassEffect(.regular.tint(.white),
                         in: RoundedRectangle(cornerRadius: tier.cornerRadius, style: .continuous))
    }
}
