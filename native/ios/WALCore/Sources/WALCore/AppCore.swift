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
    public let socket: RealtimeSocketing
    public let haptics: HapticPlaying
    public var themePreference: ColorSchemePreference
    public var systemIsDark: Bool
    public var currentUser: JSONValue?
    public var userLoading = false

    public init(
        mode: RuntimeMode = .mock,
        apiURL: URL = URL(string: "https://mnt-api-880207287631.europe-west3.run.app")!,
        fixtures: URL? = nil,
        storage: KeyValueStore = MemoryStore(),
        socket: RealtimeSocketing = MockRealtimeSocket(),
        haptics: HapticPlaying = RecordingHaptics(),
        systemIsDark: Bool = true
    ) {
        self.mode = mode
        self.store = QueryStore()
        self.router = RouterState()
        self.storage = storage
        self.l10n = L10n()
        self.socket = socket
        self.haptics = haptics
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
            if let rec = SessionRecord.parse(storage.get(StorageKey.session)) {
                snap.accessToken = rec.accessToken
                snap.userId = rec.userId
            }
            snap.locale = storage.get(StorageKey.appLocale) ?? "en"
            snap.apiBaseURLOverride = storage.get(StorageKey.apiOverride)
            snap.latitude = storage.get(StorageKey.latitude)
            snap.longitude = storage.get(StorageKey.longitude)
            return snap
        }
    }

    public var sessionRecord: SessionRecord? { SessionRecord.parse(storage.get(StorageKey.session)) }
    public var sessionUserId: String? { sessionRecord?.userId }
    public var hasSession: Bool { storage.get(StorageKey.session) != nil }

    public func gate() -> AuthRules.Gate {
        AuthRules.indexGate(hasSession: hasSession, userLoading: userLoading, user: currentUser)
    }

    public func persistSession(_ record: SessionRecord) {
        storage.set(StorageKey.session, record.encoded())
    }

    public func clearSession() {
        storage.remove(StorageKey.session)
        storage.remove(StorageKey.userKeys)
        storage.remove(StorageKey.expoPushToken)
        currentUser = nil
        socket.disconnect()
        router.navigate(.signIn)
    }

    public func deviceId() -> String {
        if let existing = storage.get(StorageKey.deviceId), !existing.isEmpty { return existing }
        let id = UUID().uuidString
        storage.set(StorageKey.deviceId, id)
        return id
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
