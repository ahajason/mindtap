#![cfg(target_os = "macos")]

use cocoa::base::id;
use objc::{msg_send, sel, sel_impl};

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
    unsafe {
        let cls = objc::class!(NSMutableDictionary);
        let dict: id = msg_send![cls, new];
        let key = std::ffi::CString::new("AXPromptKey").unwrap();
        let val: id = msg_send![objc::class!(NSNumber), numberWithBool: true];
        let _: () = msg_send![dict, setObject: val forKey: key.as_ptr()];
        let _ = AXIsProcessTrustedWithOptions(dict);
    }
}
