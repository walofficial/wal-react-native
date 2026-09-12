import Foundation

public struct CountryDial: Hashable, Sendable {
    public var code: String
    public var callingCode: String
    public var nationalLength: Int
    public var flagURL: URL { URL(string: "https://flagcdn.com/w80/\(code.lowercased()).png")! }
}

public enum AuthRules {
    public static let defaultCountry = CountryDial(code: "GE", callingCode: "+995", nationalLength: 9)
    public static let countries: [CountryDial] = [
        .init(code: "GE", callingCode: "+995", nationalLength: 9),
        .init(code: "US", callingCode: "+1", nationalLength: 10),
        .init(code: "FR", callingCode: "+33", nationalLength: 9),
    ]
    public static let otpDigits = Tokens.Metrics.otpDigits
    public static let otpResendSeconds = Tokens.Metrics.otpResendSeconds
    public static let usernameMin = Tokens.Metrics.usernameMin
    public static let usernameMax = Tokens.Metrics.usernameMax
    public static let usernamePattern = try! NSRegularExpression(pattern: "^[a-zA-Z0-9_.]*$")

    public static func isUserRegistered(dateOfBirth: String?, gender: String?) -> Bool {
        !(dateOfBirth ?? "").isEmpty && !(gender ?? "").isEmpty
    }

    public static func validateUsername(_ raw: String) -> String? {
        if raw.count < usernameMin { return "too_short" }
        if raw.count > usernameMax { return "too_long" }
        let range = NSRange(raw.startIndex..<raw.endIndex, in: raw)
        if usernamePattern.firstMatch(in: raw, range: range) == nil { return "non_latin" }
        return nil
    }

    public static func validatePhone(_ raw: String, country: CountryDial = defaultCountry) -> Bool {
        var digits = raw.filter(\.isNumber)
        let cc = country.callingCode.filter(\.isNumber)
        if digits.hasPrefix(cc) { digits = String(digits.dropFirst(cc.count)) }
        return digits.count == country.nationalLength
    }

    public static func e164(_ raw: String, country: CountryDial = defaultCountry) -> String {
        var digits = raw.filter(\.isNumber)
        let cc = country.callingCode.filter(\.isNumber)
        if !digits.hasPrefix(cc) { digits = cc + digits }
        return "+\(digits)"
    }

    /// RN default `01/02/2000`, min 1940-02-01, max today − 12 years. Wire format `dd/MM/yyyy`.
    public static let defaultDOB = "01/02/2000"
    public static let minDOB = DateComponents(calendar: .current, year: 1940, month: 2, day: 1).date!

    public static func maxDOB(now: Date = Date()) -> Date {
        Calendar.current.date(byAdding: .year, value: -12, to: now) ?? now
    }

    public static func isRegisteredUser(_ user: JSONValue?) -> Bool {
        isUserRegistered(dateOfBirth: user?["date_of_birth"]?.stringValue, gender: user?["gender"]?.stringValue)
    }

    public enum Gate: String, Sendable { case splash, signIn, register, home }

    public static func indexGate(hasSession: Bool, userLoading: Bool, user: JSONValue?) -> Gate {
        if !hasSession { return .signIn }
        if userLoading { return .splash }
        if !isRegisteredUser(user) { return .register }
        if user?["preferred_news_feed_id"]?.stringValue != nil { return .home }
        return .signIn
    }
}
