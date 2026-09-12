import XCTest
@testable import WAL
import WALCore

final class AppEnvironmentTests: XCTestCase {
    func testAPIBaseURLMatchesReactNativeEnv() {
        XCTAssertEqual(AppEnvironment.apiBaseURL.absoluteString, "https://mnt-api-880207287631.europe-west3.run.app")
    }

    func testCoreIsLinked() {
        XCTAssertEqual(WALCoreInfo.checkpoint.hasPrefix("CP"), true)
        XCTAssertEqual(Routes.tabs.count, 3)
    }
}
