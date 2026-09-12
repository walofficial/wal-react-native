import XCTest

final class LaunchUITests: XCTestCase {
    func testAppLaunchesToSplash() {
        let app = XCUIApplication()
        app.launchEnvironment["WAL_UITEST"] = "1"
        app.launch()
        XCTAssertTrue(app.images["splash.icon"].waitForExistence(timeout: 5))
    }
}
