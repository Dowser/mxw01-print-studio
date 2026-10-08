// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "MXW01",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
    ],
    products: [
        .library(name: "MXW01Core", targets: ["MXW01Core"]),
        .library(name: "MXW01CoreBluetooth", targets: ["MXW01CoreBluetooth"]),
    ],
    targets: [
        .target(
            name: "MXW01Core",
            path: "swift/Sources/MXW01Core"
        ),
        .target(
            name: "MXW01CoreBluetooth",
            dependencies: ["MXW01Core"],
            path: "swift/Sources/MXW01CoreBluetooth"
        ),
        .testTarget(
            name: "MXW01CoreTests",
            dependencies: ["MXW01Core"],
            path: "swift/Tests/MXW01CoreTests"
        ),
    ]
)
