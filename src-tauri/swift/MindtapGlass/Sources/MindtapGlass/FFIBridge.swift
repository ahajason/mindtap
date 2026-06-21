import Foundation
import AppKit

// MARK: - Request DTOs

struct GlassRegisterRequest: Decodable {
    let id: String
    let tier: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
}

struct GlassUpdateRectRequest: Decodable {
    let id: String
    let x: Double
    let y: Double
    let w: Double
    let h: Double
}

struct GlassUnregisterRequest: Decodable {
    let id: String
}

// MARK: - C-ABI exports

/// 启动时调用一次。把 NSWindow 指针交给 Swift overlay manager + 整窗背景。
@_cdecl("mindtap_glass_attach")
public func mindtap_glass_attach(_ nsWindowPtr: UnsafeMutableRawPointer) {
    let nsWindow = Unmanaged<NSWindow>.fromOpaque(nsWindowPtr).takeUnretainedValue()
    Task { @MainActor in
        GlassOverlayManager.shared.attach(to: nsWindow)
        WindowGlassBackground.apply(to: nsWindow)
    }
}

@_cdecl("mindtap_glass_register")
public func mindtap_glass_register(_ json: UnsafePointer<CChar>) -> UnsafeMutablePointer<CChar>? {
    let result: String
    do {
        let request = try decodeJSON(GlassRegisterRequest.self, from: json)
        let tier = GlassTier(rawValue: request.tier) ?? .l1
        let rect = CGRect(x: request.x, y: request.y, width: request.w, height: request.h)
        Task { @MainActor in
            GlassOverlayManager.shared.register(id: request.id, tier: tier, rect: rect)
        }
        result = "{\"ok\":true}"
    } catch {
        result = "{\"ok\":false,\"error\":\"\(error)\"}"
    }
    return strdup(result)
}

@_cdecl("mindtap_glass_update_rect")
public func mindtap_glass_update_rect(_ json: UnsafePointer<CChar>) -> UnsafeMutablePointer<CChar>? {
    let result: String
    do {
        let request = try decodeJSON(GlassUpdateRectRequest.self, from: json)
        let rect = CGRect(x: request.x, y: request.y, width: request.w, height: request.h)
        Task { @MainActor in
            GlassOverlayManager.shared.updateRect(id: request.id, rect: rect)
        }
        result = "{\"ok\":true}"
    } catch {
        result = "{\"ok\":false,\"error\":\"\(error)\"}"
    }
    return strdup(result)
}

@_cdecl("mindtap_glass_unregister")
public func mindtap_glass_unregister(_ json: UnsafePointer<CChar>) -> UnsafeMutablePointer<CChar>? {
    let result: String
    do {
        let request = try decodeJSON(GlassUnregisterRequest.self, from: json)
        Task { @MainActor in
            GlassOverlayManager.shared.unregister(id: request.id)
        }
        result = "{\"ok\":true}"
    } catch {
        result = "{\"ok\":false,\"error\":\"\(error)\"}"
    }
    return strdup(result)
}

@_cdecl("mindtap_glass_clear")
public func mindtap_glass_clear() -> UnsafeMutablePointer<CChar>? {
    Task { @MainActor in
        GlassOverlayManager.shared.clear()
    }
    return strdup("{\"ok\":true}")
}

@_cdecl("mindtap_glass_response_free")
public func mindtap_glass_response_free(_ ptr: UnsafeMutablePointer<CChar>?) {
    if let ptr = ptr {
        free(ptr)
    }
}

// MARK: - Helpers

private func decodeJSON<T: Decodable>(_ type: T.Type, from ptr: UnsafePointer<CChar>) throws -> T {
    let str = String(cString: ptr)
    let data = Data(str.utf8)
    return try JSONDecoder().decode(type, from: data)
}
