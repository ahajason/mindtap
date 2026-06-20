// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "MindtapGlass",
    platforms: [.macOS(.v26)],
    products: [
        .library(name: "MindtapGlass", type: .static, targets: ["MindtapGlass"])
    ],
    targets: [
        .target(
            name: "MindtapGlass",
            path: "Sources/MindtapGlass"
        ),
        .testTarget(
            name: "MindtapGlassTests",
            dependencies: ["MindtapGlass"],
            path: "Tests/MindtapGlassTests"
        )
    ]
)