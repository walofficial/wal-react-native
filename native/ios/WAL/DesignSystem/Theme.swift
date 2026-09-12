import SwiftUI
import WALCore

extension CSSColor {
    var color: Color { Color(.sRGB, red: red, green: green, blue: blue, opacity: alpha) }
}

/// Observable theme. Default follows the system with a dark fallback, matching `lib/useColorScheme.tsx`.
final class ThemeController: ObservableObject {
    @Published var preference: ColorSchemePreference
    @Published var systemIsDark: Bool

    init(preference: ColorSchemePreference = .system, systemIsDark: Bool = true) {
        self.preference = preference
        self.systemIsDark = systemIsDark
    }

    var isDark: Bool { preference.resolved(systemIsDark: systemIsDark) }
    var resolved: ResolvedTheme { ResolvedTheme.resolve(isDark: isDark) }

    func color(_ name: String) -> Color {
        (resolved[name] ?? resolved.background).color
    }
}

private struct ThemeControllerKey: EnvironmentKey {
    static let defaultValue = ThemeController()
}

extension EnvironmentValues {
    var walTheme: ThemeController {
        get { self[ThemeControllerKey.self] }
        set { self[ThemeControllerKey.self] = newValue }
    }
}
