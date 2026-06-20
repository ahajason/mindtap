import XCTest
@testable import MindtapGlass

final class TierTests: XCTestCase {
    func testL1Values() {
        XCTAssertEqual(GlassTier.l1.blurPx, 20)
        XCTAssertEqual(GlassTier.l1.fillOpacity, 0.35)
        XCTAssertEqual(GlassTier.l1.borderOpacity, 0.60)
        XCTAssertEqual(GlassTier.l1.cornerRadius, 20)
        XCTAssertEqual(GlassTier.l1.shadowOpacity, 0.08)
    }

    func testL2Values() {
        XCTAssertEqual(GlassTier.l2.blurPx, 24)
        XCTAssertEqual(GlassTier.l2.fillOpacity, 0.42)
        XCTAssertEqual(GlassTier.l2.borderOpacity, 0.70)
        XCTAssertEqual(GlassTier.l2.cornerRadius, 24)
        XCTAssertEqual(GlassTier.l2.shadowOpacity, 0.10)
    }

    func testL3Values() {
        XCTAssertEqual(GlassTier.l3.blurPx, 28)
        XCTAssertEqual(GlassTier.l3.fillOpacity, 0.50)
        XCTAssertEqual(GlassTier.l3.borderOpacity, 0.80)
        XCTAssertEqual(GlassTier.l3.cornerRadius, 28)
        XCTAssertEqual(GlassTier.l3.shadowOpacity, 0.12)
    }

    func testRawValueRoundTrip() {
        for tier in GlassTier.allCases {
            XCTAssertEqual(GlassTier(rawValue: tier.rawValue), tier)
        }
    }
}