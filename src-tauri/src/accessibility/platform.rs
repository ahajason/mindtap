#![cfg(target_os = "macos")]

use cocoa::base::id;
use objc::rc::autoreleasepool;
use objc::runtime::Sel;
use objc::{sel, sel_impl, msg_send};

#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {}

extern "C" {
    fn AXIsProcessTrusted() -> bool;
    fn AXIsProcessTrustedWithOptions(options: id) -> bool;
}

pub fn is_trusted() -> bool {
    unsafe { AXIsProcessTrusted() }
}

pub fn request_prompt() {
    // 必须在 autorelease pool + 主 run loop 下调 AXIsProcessTrustedWithOptions:
    // 1. IPC command thread 无 active NSAutoreleasePool,NSNumber/NSMutableDictionary
    //    (autoreleased) 在 setObject 之后立即被主 pool drain → AX 内部读 dangling ptr → 闪退
    // 2. AX 内部 dispatch AX 提示 UI 需 main run loop active,IPC thread 没有
    // 解决:autoreleasepool 包裹构造 dict,然后 performSelectorOnMainThread 延迟到主 loop 下次 tick
    autoreleasepool(|| {
        unsafe {
            let cls = objc::class!(NSMutableDictionary);
            let dict: id = msg_send![cls, new];
            let key = std::ffi::CString::new("AXPromptKey").unwrap();
            let val: id = msg_send![objc::class!(NSNumber), numberWithBool: true];
            let _: () = msg_send![dict, setObject: val forKey: key.as_ptr()];
            // withObject: dict 会 +1 retain,主 loop 用完后 -1
            // sel! 宏不接受带冒号,改 runtime::Sel::register 拿 SEL(等价 @selector(...))
            let ax_sel = Sel::register("AXIsProcessTrustedWithOptions:");
            // msg_send! 多 arg 不用逗号,空格分隔(name1: v1 name2: v2 ...)
            let _: () = msg_send![objc::class!(NSObject), performSelectorOnMainThread:
                ax_sel withObject: dict waitUntilDone: false];
        }
    });
}
