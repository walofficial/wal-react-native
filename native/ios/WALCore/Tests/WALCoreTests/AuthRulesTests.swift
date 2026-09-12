import WALCore
import XCTest

final class AuthRulesTests: XCTestCase {
    func testUsernameAndPhone() {
        XCTAssertEqual(AuthRules.validateUsername("ab"), "too_short")
        XCTAssertNil(AuthRules.validateUsername("nika"))
        XCTAssertEqual(AuthRules.validateUsername("ნიკა"), "non_latin")
        XCTAssertTrue(AuthRules.validatePhone("555123456"))
        XCTAssertTrue(AuthRules.validatePhone("+995555123456"))
        XCTAssertFalse(AuthRules.validatePhone("555"))
        XCTAssertEqual(AuthRules.e164("555123456"), "+995555123456")
        XCTAssertEqual(AuthRules.defaultCountry.flagURL.absoluteString, "https://flagcdn.com/w80/ge.png")
    }

    func testIndexGate() {
        XCTAssertEqual(AuthRules.indexGate(hasSession: false, userLoading: false, user: nil), .signIn)
        XCTAssertEqual(AuthRules.indexGate(hasSession: true, userLoading: true, user: nil), .splash)
        XCTAssertEqual(AuthRules.indexGate(hasSession: true, userLoading: false, user: ["gender": "male"]), .register)
        XCTAssertEqual(
            AuthRules.indexGate(hasSession: true, userLoading: false, user: ["date_of_birth": "01/02/2000", "gender": "male", "preferred_news_feed_id": "nf"]),
            .home
        )
        XCTAssertFalse(AuthRules.isUserRegistered(dateOfBirth: nil, gender: "male"))
        XCTAssertTrue(AuthRules.isUserRegistered(dateOfBirth: "01/02/2000", gender: "female"))
    }

    func testDOBBounds() {
        XCTAssertEqual(AuthRules.defaultDOB, "01/02/2000")
        let max = AuthRules.maxDOB(now: DateComponents(calendar: .current, year: 2026, month: 9, day: 12).date!)
        XCTAssertEqual(Calendar.current.component(.year, from: max), 2014)
        XCTAssertEqual(Calendar.current.component(.year, from: AuthRules.minDOB), 1940)
    }
}
