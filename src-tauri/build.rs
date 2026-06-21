use std::process::Command;

fn main() {
    tauri_build::build();

    #[cfg(target_os = "macos")]
    {
        let swift_pkg = "swift/MindtapGlass";
        let status = Command::new("swift")
            .args(["build", "-c", "release", "--package-path", swift_pkg])
            .status()
            .expect("failed to invoke swift build");
        assert!(status.success(), "MindtapGlass SPM build failed");

        println!("cargo:rustc-link-search=native={}/.build/release", swift_pkg);
        println!("cargo:rustc-link-lib=static=MindtapGlass");
        println!("cargo:rerun-if-changed={}", swift_pkg);
        // Swift 静态链进 Rust binary 后,运行时需 libswift_Concurrency.dylib
        // (Xcode 工具链自带;系统 /usr/lib/swift 没有)。rpath 嵌进 binary 后
        // cargo test / dev 跑就不需要 DYLD_LIBRARY_PATH。
        println!("cargo:rustc-link-arg=-Wl,-rpath,/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift-5.5/macosx");
        println!("cargo:rustc-link-arg=-Wl,-rpath,/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/macosx");
    }
}
