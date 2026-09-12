import XCTest

final class LaunchUITests: XCTestCase {
    func testAppLaunchesToSessionGate() {
        let app = XCUIApplication()
        app.launchEnvironment["WAL_UITEST"] = "1"
        app.launch()
        let splash = app.images["splash.icon"]
        let title = app.staticTexts["WAL"]
        let auth = app.otherElements["auth.title"]
        let appeared = splash.waitForExistence(timeout: 5)
            || title.waitForExistence(timeout: 5)
            || auth.waitForExistence(timeout: 5)
        XCTAssertTrue(appeared)
    }
}
