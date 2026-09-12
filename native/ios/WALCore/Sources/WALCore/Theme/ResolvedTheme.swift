import Foundation

/// Colour scheme the RN app uses: system with a dark fallback (`lib/useColorScheme.tsx`).
public enum ColorSchemePreference: String, Hashable, Sendable {
    case system
    case light
    case dark

    public func resolved(systemIsDark: Bool) -> Bool {
        switch self {
        case .system: return systemIsDark
        case .light: return false
        case .dark: return true
        }
    }
}

/// All theme colours resolved for one scheme. Screens and walctl read this; they never hard-code hex.
public struct ResolvedTheme: Hashable, Sendable {
    public var isDark: Bool
    public var colors: [String: CSSColor]

    public init(isDark: Bool, colors: [String: CSSColor]) {
        self.isDark = isDark
        self.colors = colors
    }

    public static func resolve(isDark: Bool) -> ResolvedTheme {
        var out: [String: CSSColor] = [:]
        for (name, token) in Tokens.Colors.all {
            if let c = CSSColor.parse(token.resolved(dark: isDark)) {
                out[name] = c
            }
        }
        return ResolvedTheme(isDark: isDark, colors: out)
    }

    public subscript(name: String) -> CSSColor? { colors[name] }

    public var background: CSSColor { self["background"] ?? CSSColor(red: 0, green: 0, blue: 0) }
    public var text: CSSColor { self["text"] ?? CSSColor(red: 1, green: 1, blue: 1) }
    public var primary: CSSColor { self["primary"] ?? CSSColor(red: 0, green: 0.3, blue: 0.69) }
    public var accent: CSSColor { self["accent"] ?? CSSColor(red: 1, green: 0.22, blue: 0.37) }
}

/// Typography scale from `tokens.json` / `lib/theme.tsx`.
public enum TextRole: String, Hashable, Sendable, CaseIterable {
    case xs, sm, md, lg, xl, xxl
    case small, medium, large, xlarge, xxlarge, huge

    public var size: Double {
        switch self {
        case .xs: return Double(Tokens.FontSize.xs)
        case .sm: return Double(Tokens.FontSize.sm)
        case .md: return Double(Tokens.FontSize.md)
        case .lg: return Double(Tokens.FontSize.lg)
        case .xl: return Double(Tokens.FontSize.xl)
        case .xxl: return Double(Tokens.FontSize.xxl)
        case .small: return Double(Tokens.LegacyFontSize.small)
        case .medium: return Double(Tokens.LegacyFontSize.medium)
        case .large: return Double(Tokens.LegacyFontSize.large)
        case .xlarge: return Double(Tokens.LegacyFontSize.xlarge)
        case .xxlarge: return Double(Tokens.LegacyFontSize.xxlarge)
        case .huge: return Double(Tokens.LegacyFontSize.huge)
        }
    }
}

public enum FontWeightToken: String, Hashable, Sendable {
    case regular, medium, semibold, bold
    public var numeric: Int {
        switch self {
        case .regular: return Tokens.Typography.Weights.regular
        case .medium: return Tokens.Typography.Weights.medium
        case .semibold: return Tokens.Typography.Weights.semibold
        case .bold: return Tokens.Typography.Weights.bold
        }
    }
}
