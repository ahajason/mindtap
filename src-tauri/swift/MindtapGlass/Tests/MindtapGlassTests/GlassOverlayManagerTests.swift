import XCTest
import AppKit
@testable import MindtapGlass

@MainActor
final class GlassOverlayManagerTests: XCTestCase {
    var manager: GlassOverlayManager!
    var testWindow: NSWindow!

    override func setUp() async throws {
        try await super.setUp()
        manager = GlassOverlayManager.shared
        manager.clear()  // reset state
        testWindow = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 400),
            styleMask: [.titled, .closable],
            backing: .buffered, defer: false
        )
    }

    override func tearDown() async throws {
        manager.clear()
        testWindow = nil
        try await super.tearDown()
    }

    func testRegisterAddsOverlay() {
        manager.attach(to: testWindow)
        manager.register(id: "a", tier: .l1, rect: CGRect(x: 10, y: 10, width: 100, height: 50))
        // 验证 overlay 添加到 contentView
        XCTAssertGreaterThanOrEqual(testWindow.contentView?.subviews.count ?? 0, 1)
    }

    func testUpdateRectChangesFrame() {
        manager.attach(to: testWindow)
        manager.register(id: "a", tier: .l1, rect: CGRect(x: 10, y: 10, width: 100, height: 50))
        manager.updateRect(id: "a", rect: CGRect(x: 20, y: 20, width: 200, height: 80))
        // 找到对应 overlay 验证 frame
        let overlay = testWindow.contentView?.subviews.first { $0.frame.origin.x == 20 }
        XCTAssertNotNil(overlay)
        XCTAssertEqual(overlay?.frame.size.width, 200)
    }

    func testUnregisterRemovesOverlay() {
        manager.attach(to: testWindow)
        manager.register(id: "a", tier: .l1, rect: .zero)
        let before = testWindow.contentView?.subviews.count ?? 0
        manager.unregister(id: "a")
        let after = testWindow.contentView?.subviews.count ?? 0
        XCTAssertEqual(after, before - 1)
    }

    func testClearRemovesAll() {
        manager.attach(to: testWindow)
        manager.register(id: "a", tier: .l1, rect: .zero)
        manager.register(id: "b", tier: .l2, rect: .zero)
        manager.register(id: "c", tier: .l3, rect: .zero)
        manager.clear()
        XCTAssertEqual(testWindow.contentView?.subviews.count ?? 0, 0)
    }

    func testRegisterWithoutAttachIsNoop() {
        // 没调 attach,register 应不崩溃也不创建 overlay
        manager.clear()
        manager.register(id: "orphan", tier: .l1, rect: .zero)
        // 没 attach,无法断言 subview 数(因为没有 window);只验证不崩溃
    }

    func testReregisterReplacesExisting() {
        manager.attach(to: testWindow)
        manager.register(id: "a", tier: .l1, rect: CGRect(x: 0, y: 0, width: 10, height: 10))
        let before = testWindow.contentView?.subviews.count ?? 0
        manager.register(id: "a", tier: .l1, rect: CGRect(x: 0, y: 0, width: 20, height: 20))
        let after = testWindow.contentView?.subviews.count ?? 0
        XCTAssertEqual(after, before, "重复 register 不应增加 subview 数")
    }
}
