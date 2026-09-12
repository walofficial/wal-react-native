import Foundation

/// Port of lib/i18n.ts (i18n-js): locale bundles from `Resources/Locales/*.json`, `{{name}}` interpolation,
/// fallback to `en` for missing keys, and the same locale-selection rule (device language if supported, else en).
public final class L10n: @unchecked Sendable {
    public static let shared = L10n()

    private let lock = NSLock()
    private var bundles: [String: [String: String]] = [:]
    private var _locale: String = L10nCatalog.defaultLocale

    public convenience init() { self.init(bundle: .module) }

    public init(bundle: Bundle) {
        for code in L10nCatalog.supportedLocales {
            guard let url = bundle.url(forResource: code, withExtension: "json", subdirectory: "Locales")
                ?? bundle.url(forResource: code, withExtension: "json"),
                let data = try? Data(contentsOf: url),
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            else { continue }
            bundles[code] = L10n.flatten(json)
        }
    }

    public var locale: String {
        get { lock.lock(); defer { lock.unlock() }; return _locale }
    }

    public var supportedLocales: [String] { L10nCatalog.supportedLocales }

    /// Mirrors `setLocale`: ignored when the locale is not supported.
    public func setLocale(_ code: String) {
        guard L10nCatalog.supportedLocales.contains(code) else { return }
        lock.lock(); _locale = code; lock.unlock()
    }

    /// Mirrors the module-level default in lib/i18n.ts: device language if supported, otherwise `en`.
    public func applyDeviceLocale(languageCode: String?) {
        setLocale(L10n.resolveDeviceLocale(languageCode: languageCode))
    }

    public static func resolveDeviceLocale(languageCode: String?) -> String {
        guard let code = languageCode, L10nCatalog.supportedLocales.contains(code) else { return L10nCatalog.defaultLocale }
        return code
    }

    public func t(_ key: L10nKey, _ options: [String: CustomStringConvertible] = [:]) -> String {
        t(key.rawValue, options)
    }

    public func t(_ key: String, _ options: [String: CustomStringConvertible] = [:]) -> String {
        let current = locale
        let raw = bundles[current]?[key] ?? bundles[L10nCatalog.defaultLocale]?[key] ?? L10n.missing(key)
        return L10n.interpolate(raw, options)
    }

    public func hasTranslation(_ key: String, locale: String? = nil) -> Bool {
        bundles[locale ?? self.locale]?[key] != nil
    }

    public func keys(for locale: String) -> Set<String> { Set(bundles[locale]?.keys ?? [:].keys) }

    // i18n-js renders `[missing "en.some.key" translation]`; the RN app never shows this on purpose,
    // so we surface the same marker to make drift obvious in tests.
    static func missing(_ key: String) -> String { "[missing \"\(key)\" translation]" }

    static func interpolate(_ template: String, _ options: [String: CustomStringConvertible]) -> String {
        guard !options.isEmpty, template.contains("{{") else { return template }
        var out = template
        for (name, value) in options {
            out = out.replacingOccurrences(of: "{{\(name)}}", with: value.description)
        }
        return out
    }

    static func flatten(_ object: [String: Any], prefix: String = "") -> [String: String] {
        var out: [String: String] = [:]
        for (k, v) in object {
            let key = prefix.isEmpty ? k : "\(prefix).\(k)"
            if let nested = v as? [String: Any] {
                out.merge(flatten(nested, prefix: key)) { _, new in new }
            } else if let s = v as? String {
                out[key] = s
            } else {
                out[key] = String(describing: v)
            }
        }
        return out
    }
}

/// lib/i18n.ts getRegionFromLocale / getLanguageFromLocale
public enum LocaleMapping {
    public static func region(for locale: String) -> String {
        switch locale {
        case "ka": return "georgia"
        case "en": return "united_states"
        case "fr": return "france"
        default: return "united_states"
        }
    }

    public static func language(for locale: String) -> String {
        switch locale {
        case "ka": return "georgian"
        case "en": return "english"
        case "fr": return "french"
        default: return "english"
        }
    }
}
