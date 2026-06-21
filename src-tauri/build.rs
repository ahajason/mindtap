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
        // (Xcode 工具链自带;系统 /usr/lib/swift 没有)。用 xcode-select 探测
        // 活动 Xcode 路径,避免写死 /Applications/Xcode.app 在非标准装法下失效。
        let dev_dir = Command::new("xcode-select")
            .arg("-p")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .expect("xcode-select -p failed; please install Xcode and run `sudo xcode-select -s <path>`");

        for lib_subpath in [
            "Toolchains/XcodeDefault.xctoolchain/usr/lib/swift-5.5/macosx",
            "Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/macosx",
        ] {
            println!(
                "cargo:rustc-link-arg=-Wl,-rpath,{}",
                format!("{}/{}", dev_dir, lib_subpath)
            );
        }
    }
}
