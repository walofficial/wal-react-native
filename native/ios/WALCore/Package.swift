// swift-tools-version: 5.9
// WALCore: platform-neutral business logic for the WAL app (mirrored by the Kotlin core).
// Builds and tests on Linux (CI) and on macOS/iOS (Xcode). iOS deployment target matches the RN app (15.1).
import PackageDescription

let package = Package(
    name: "WALCore",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v15),
        .macOS(.v12),
    ],
    products: [
        .library(name: "WALAPI", targets: ["WALAPI"]),
        .library(name: "WALCore", targets: ["WALCore"]),
        .library(name: "WALCrypto", targets: ["WALCrypto"]),
        .executable(name: "walctl", targets: ["walctl"]),
    ],
    targets: [
        // Generated DTOs + operation descriptors and the tiny runtime they depend on. No networking.
        .target(
            name: "WALAPI",
            path: "Sources/WALAPI",
            swiftSettings: [.enableUpcomingFeature("StrictConcurrency")]
        ),
        // libsodium crypto_box (X25519 + XSalsa20-Poly1305), wire-compatible with the RN tweetnacl payloads.
        .systemLibrary(
            name: "CSodium",
            path: "Sources/CSodium",
            pkgConfig: "libsodium",
            providers: [.apt(["libsodium-dev"]), .brew(["libsodium"])]
        ),
        .target(
            name: "WALCrypto",
            dependencies: ["CSodium"],
            path: "Sources/WALCrypto",
            swiftSettings: [.enableUpcomingFeature("StrictConcurrency")]
        ),
        // Headless application core: HTTP client, query store, auth/session, feature stores, router model.
        .target(
            name: "WALCore",
            dependencies: ["WALAPI", "WALCrypto"],
            path: "Sources/WALCore",
            resources: [.copy("Resources/Locales")],
            swiftSettings: [.enableUpcomingFeature("StrictConcurrency")]
        ),
        // CLI that drives WALCore headlessly (mock / live) or the running app (remote).
        .executableTarget(
            name: "walctl",
            dependencies: ["WALCore"],
            path: "Sources/walctl"
        ),
        .testTarget(
            name: "WALAPITests",
            dependencies: ["WALAPI"],
            path: "Tests/WALAPITests"
        ),
        .testTarget(
            name: "WALCryptoTests",
            dependencies: ["WALCrypto"],
            path: "Tests/WALCryptoTests"
        ),
        .testTarget(
            name: "WALCoreTests",
            dependencies: ["WALCore"],
            path: "Tests/WALCoreTests",
            resources: [.copy("Fixtures")]
        ),
    ]
)
