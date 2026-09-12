import UIKit
import WALCore

#if canImport(Sentry)
import Sentry
#endif

final class AppDelegate: NSObject, UIApplicationDelegate {
    let host: AppHost = {
        let uiTest = ProcessInfo.processInfo.environment["WAL_UITEST"] == "1"
        let storage: KeyValueStore = uiTest ? MemoryStore() : KeychainStore()
        let socket: RealtimeSocketing = uiTest ? MockRealtimeSocket() : SocketIOService()
        let core = AppCore(
            mode: uiTest ? .mock : .live,
            apiURL: AppEnvironment.apiBaseURL,
            storage: storage,
            socket: socket,
            haptics: UIKitHaptics()
        )
        return AppHost(core: core)
    }()

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        AppEnvironment.bootstrap()
        startSentry()
        host.bootstrap()
        if let response = launchOptions?[.remoteNotification] as? [AnyHashable: Any] {
            host.push.handleTap(userInfo: response)
        }
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        host.push.didRegister(deviceToken: deviceToken)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        host.applyDeepLink(url)
        host.consumeShareIntentIfNeeded()
        return true
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        if let url = userActivity.webpageURL {
            host.applyDeepLink(url)
            return true
        }
        return false
    }

    private func startSentry() {
        #if canImport(Sentry)
        guard let dsn = AppEnvironment.sentryDSN, !dsn.isEmpty else { return }
        SentrySDK.start { options in
            options.dsn = dsn
            options.tracesSampleRate = 1.0
        }
        #endif
    }
}

enum AppEnvironment {
    static var apiBaseURL: URL {
        let raw = Bundle.main.object(forInfoDictionaryKey: "WALAPIBaseURL") as? String
        return URL(string: raw ?? "https://mnt-api-880207287631.europe-west3.run.app")!
    }

    static var appGroup: String {
        Bundle.main.object(forInfoDictionaryKey: "WALAppGroup") as? String ?? "group.com.greetai.ment"
    }

    static var supabaseURL: URL? {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "WALSupabaseURL") as? String)
            ?? ProcessInfo.processInfo.environment["EXPO_PUBLIC_SUPABASE_URL"]
        guard let raw, !raw.isEmpty else { return nil }
        return URL(string: raw)
    }

    static var supabaseAnonKey: String {
        (Bundle.main.object(forInfoDictionaryKey: "WALSupabaseAnonKey") as? String)
            ?? ProcessInfo.processInfo.environment["EXPO_PUBLIC_SUPABASE_ANON_KEY"]
            ?? ""
    }

    static var sentryDSN: String? {
        (Bundle.main.object(forInfoDictionaryKey: "WALSentryDSN") as? String)
            ?? ProcessInfo.processInfo.environment["EXPO_PUBLIC_SENTRY_DSN"]
    }

    static var expoProjectId: String { "a9de94ea-576e-4767-ae3f-085bfe155f96" }

    static var isDev: Bool {
        #if WAL_DEV
        return true
        #else
        return false
        #endif
    }

    static func bootstrap() {
        if #available(iOS 16, *) {
            L10n.shared.applyDeviceLocale(languageCode: Locale.current.language.languageCode?.identifier)
        } else {
            L10n.shared.applyDeviceLocale(languageCode: Locale.current.languageCode)
        }
    }
}
