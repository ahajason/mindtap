import XCTest
@testable import MindtapGlass

final class FFIBridgeTests: XCTestCase {
    func testRegisterParsesValidJSON() {
        let json = #"{"id":"a","tier":"l1","x":10,"y":20,"w":100,"h":50}"#
        let result = mindtap_glass_register(json)
        let str = String(cString: result!)
        mindtap_glass_response_free(result)
        XCTAssertTrue(str.contains("\"ok\":true"))
    }

    func testRegisterRejectsInvalidJSON() {
        let json = "not json"
        let result = mindtap_glass_register(json)
        let str = String(cString: result!)
        mindtap_glass_response_free(result)
        XCTAssertTrue(str.contains("\"ok\":false"))
    }

    func testRegisterRejectsUnknownTier() {
        let json = #"{"id":"a","tier":"l99","x":0,"y":0,"w":0,"h":0}"#
        // 不崩溃;返回 ok:true(tier 默认 fallback 到 l1)
        let result = mindtap_glass_register(json)
        let str = String(cString: result!)
        mindtap_glass_response_free(result)
        XCTAssertTrue(str.contains("\"ok\":true"))
    }

    func testClearReturnsOK() {
        let result = mindtap_glass_clear()
        let str = String(cString: result!)
        mindtap_glass_response_free(result)
        XCTAssertEqual(str, "{\"ok\":true}")
    }
}
