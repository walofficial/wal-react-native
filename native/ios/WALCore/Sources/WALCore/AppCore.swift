import Foundation

public enum RuntimeMode: String, Sendable {
    case mock, live, remote
}

/// Process-wide headless application. walctl and the SwiftUI app share one of these.
public final class AppCore: @unchecked Sendable {
    public let mode: RuntimeMode
    public let store: QueryStore
    public let router: RouterState
    public let storage: KeyValueStore
    public let http: HTTPClient
    public let l10n: L10n
    public var themePreference: ColorSchemePreference
    public var systemIsDark: Bool

    public init(
        mode: RuntimeMode = .mock,
        apiURL: URL = URL(string: "https://mnt-api-880207287631.europe-west3.run.app")!,
        fixtures: URL? = nil,
        storage: KeyValueStore = MemoryStore(),
        systemIsDark: Bool = true
    ) {
        self.mode = mode
        self.store = QueryStore()
        self.router = RouterState()
        self.storage = storage
        self.l10n = L10n()
        self.themePreference = .system
        self.systemIsDark = systemIsDark
        if let locale = storage.get(StorageKey.appLocale) { l10n.setLocale(locale) }
        let transport: HTTPTransport
        switch mode {
        case .mock:
            let root = fixtures ?? URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
            transport = FixtureTransport(root: root)
        case .live, .remote:
            transport = URLSessionTransport()
        }
        self.http = HTTPClient(defaultBaseURL: apiURL, transport: transport) { [storage] in
            var snap = SessionSnapshot()
            if let raw = storage.get(StorageKey.session),
               let data = raw.data(using: .utf8),
               let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                snap.accessToken = obj["access_token"] as? String
                snap.userId = obj["user_id"] as? String
            }
            snap.locale = storage.get(StorageKey.appLocale) ?? "en"
            snap.apiBaseURLOverride = storage.get(StorageKey.apiOverride)
            return snap
        }
    }

    public var theme: ResolvedTheme {
        ResolvedTheme.resolve(isDark: themePreference.resolved(systemIsDark: systemIsDark))
    }

    public func stateDump() -> [String: JSONValue] {
        [
            "mode": .string(mode.rawValue),
            "route": .string(router.current.id.rawValue),
            "tab": .string(router.selectedTab.rawValue),
            "sheets": .array(router.sheets.map { .string($0) }),
            "locale": .string(l10n.locale),
            "themeDark": .bool(theme.isDark),
            "cacheKeys": .array(store.snapshot.keys.map { .string($0.operationId) }),
            "hasSession": .bool(storage.get(StorageKey.session) != nil),
            "checkpoint": .string(WALCoreInfo.checkpoint),
        ]
    }
}
