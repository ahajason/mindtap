import Foundation

public enum GlassTier: String, Codable, Sendable, CaseIterable {
    case l1, l2, l3

    public var blurPx: Double {
        switch self {
        case .l1: 20; case .l2: 24; case .l3: 28
        }
    }

    public var fillOpacity: Double {
        switch self {
        case .l1: 0.35; case .l2: 0.42; case .l3: 0.50
        }
    }

    public var borderOpacity: Double {
        switch self {
        case .l1: 0.60; case .l2: 0.70; case .l3: 0.80
        }
    }

    public var cornerRadius: Double {
        switch self {
        case .l1: 20; case .l2: 24; case .l3: 28
        }
    }

    public var shadowOpacity: Double {
        switch self {
        case .l1: 0.08; case .l2: 0.10; case .l3: 0.12
        }
    }
}