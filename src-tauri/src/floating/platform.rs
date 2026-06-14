#[cfg(target_os = "macos")]
pub fn set_as_panel(window: &tauri::WebviewWindow) -> Result<(), String> {
    use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
    use objc::{msg_send, sel, sel_impl};

    let ns_window = window
        .ns_window()
        .map_err(|e| e.to_string())?
        as cocoa::base::id;
    unsafe {
        let _: () = msg_send![ns_window, setHidesOnDeactivate: false];
        let _: () = msg_send![ns_window, setCanBecomeKeyWindow: false];
        let _: () = msg_send![ns_window, setCollectionBehavior:
            NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorTransient
        ];
    }
    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn set_as_panel(_window: &tauri::WebviewWindow) -> Result<(), String> {
    Ok(())
}
