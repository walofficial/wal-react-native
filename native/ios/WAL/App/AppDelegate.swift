import UIKit
import WALCore

/// Process-level hooks (push registration, deep links handed off by the system, background fetch).
/// Filled in by CP4 (deep links / DevServer) and CP14 (APNs). CP0 only logs the launch.
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        AppEnvironment.bootstrap()
        return true
    }
}

/// Build-time configuration mirrored from `.env` / app.config.js of the RN app.
enum AppEnvironment {
    /// `EXPO_PUBLIC_API_URL`; overridable at runtime via the `API_BASE_URL_OVERRIDE` storage key (CP2).
    static var apiBaseURL: URL {
        let raw = Bundle.main.object(forInfoDictionaryKey: "WALAPIBaseURL") as? String
        return URL(string: raw ?? "https://mnt-api-880207287631.europe-west3.run.app")!
    }

    static var appGroup: String {
        Bundle.main.object(forInfoDictionaryKey: "WALAppGroup") as? String ?? "group.com.greetai.ment"
    }

    /// `EXPO_PUBLIC_IS_DEV` equivalent: Debug builds are the "WAL DEV" flavour.
    static var isDev: Bool {
        #if WAL_DEV
        return true
        #else
        return false
        #endif
    }

    static func bootstrap() {
        L10n.shared.applyDeviceLocale(languageCode: Locale.current.languageCode)
    }
}
