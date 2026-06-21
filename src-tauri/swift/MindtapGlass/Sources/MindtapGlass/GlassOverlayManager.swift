import AppKit
import SwiftUI

/// 事件穿透:hitTest 返回 nil,鼠标穿透到下层 WKWebView
private final class PassThroughHostingView: NSHostingView<AnyView> {
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
}

@MainActor
public final class GlassOverlayManager {
    public static let shared = GlassOverlayManager()
    private var overlays: [String: PassThroughHostingView] = [:]
    private weak var hostWindow: NSWindow?

    private init() {}

    public func attach(to window: NSWindow) {
        self.hostWindow = window
    }

    public func register(id: String, tier: GlassTier, rect: CGRect) {
        guard let window = hostWindow else {
            print("[GlassOverlayManager] hostWindow not set; register ignored: \(id)")
            return
        }
        // 同一 id 重复 register: 先清旧
        overlays[id]?.removeFromSuperview()

        let overlay = PassThroughHostingView(rootView: AnyView(GlassOverlay(tier: tier)))
        overlay.frame = rect
        overlay.autoresizingMask = []
        window.contentView?.addSubview(overlay)
        overlays[id] = overlay
    }

    public func updateRect(id: String, rect: CGRect) {
        overlays[id]?.frame = rect
    }

    public func unregister(id: String) {
        overlays[id]?.removeFromSuperview()
        overlays[id] = nil
    }

    public func clear() {
        overlays.values.forEach { $0.removeFromSuperview() }
        overlays.removeAll()
    }
}
