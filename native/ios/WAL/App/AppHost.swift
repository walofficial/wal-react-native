import SwiftUI
import WALCore

/// Shared process host. UIKit navigation, SwiftUI screens, and AppDelegate all talk to this.
@MainActor
final class AppHost: ObservableObject {
    static var shared: AppHost?

    let core: AppCore
    let theme: ThemeController
    let toast: ToastController
    let location = LocationManager()
    let push = PushRegistration()

    @Published private(set) var revision = 0
    @Published var userLoading = false
    @Published var incomingToast: IncomingMessageToast?

    private var cancellables: Set<AnyCancellable> = []

    init(core: AppCore) {
        self.core = core
        self.theme = ThemeController(preference: core.themePreference, systemIsDark: core.systemIsDark)
        self.toast = ToastController()
        AppHost.shared = self
        core.router.onChange = { [weak self] in
            DispatchQueue.main.async { self?.bump() }
        }
        core.store.onChange = { [weak self] in
            DispatchQueue.main.async { self?.bump() }
        }
        core.socket.onEvent = { [weak self] event, payload in
            DispatchQueue.main.async { self?.handleSocket(event, payload) }
        }
        location.onUpdate = { [weak self] lat, lon in
            self?.core.storage.set(StorageKey.latitude, String(lat))
            self?.core.storage.set(StorageKey.longitude, String(lon))
        }
    }

    func bump() {
        revision += 1
        objectWillChange.send()
    }

    var gate: AuthRules.Gate { core.gate() }

    func navigate(_ route: Route) {
        core.router.navigate(route)
        if case .profileByUsername(let username) = route {
            Task { await resolveUsername(username) }
        }
        bump()
    }

    func back() {
        core.router.back()
        bump()
    }

    func select(_ tab: TabID) {
        core.router.selectTab(tab)
        bump()
    }

    func presentSheet(_ name: String) {
        core.router.presentSheet(name)
        bump()
    }

    func dismissSheet(_ name: String? = nil) {
        core.router.dismissSheet(name)
        bump()
    }

    func applyDeepLink(_ url: URL) {
        _ = core.router.applyDeepLink(url: url)
        bump()
    }

    func applyPushTap(_ data: [String: String]) {
        _ = core.router.applyPushTap(data)
        bump()
    }

    func consumeShareIntentIfNeeded() {
        let group = AppEnvironment.appGroup
        guard let defaults = UserDefaults(suiteName: group) else { return }
        let key = defaults.string(forKey: "walShareKey")
            ?? defaults.string(forKey: "dataUrl")
        guard key != nil || defaults.object(forKey: "sharedText") != nil else { return }
        let text = defaults.string(forKey: "sharedText")
        let images = defaults.string(forKey: "sharedImages")
        defaults.removeObject(forKey: "walShareKey")
        defaults.removeObject(forKey: "dataUrl")
        let feedId = core.currentUser?["preferred_news_feed_id"]?.stringValue ?? ""
        navigate(.createPost(feedId: feedId, sharedContent: text, sharedImages: images))
    }

    func bootstrap() {
        Task { await loadSessionUser() }
        location.request()
        if core.hasSession {
            connectSocket()
            push.register(host: self)
        }
    }

    func loadSessionUser() async {
        guard core.hasSession else {
            core.userLoading = false
            applyGateNavigation()
            return
        }
        core.userLoading = true
        userLoading = true
        bump()
        defer {
            core.userLoading = false
            userLoading = false
            applyGateNavigation()
        }
        do {
            let json = try await core.http.executeJSON(Operations.GetUser())
            core.currentUser = json
            if let feed = json["preferred_news_feed_id"]?.stringValue {
                core.storage.set(StorageKey.preferredFeedId, feed)
            }
            connectSocket()
            push.register(host: self)
        } catch {
            if core.mode == .mock {
                seedMockUser()
            }
        }
    }

    func applyGateNavigation() {
        switch core.gate() {
        case .splash:
            break
        case .signIn:
            if core.router.current.id != .signIn { core.router.navigate(.signIn) }
        case .register:
            if core.router.current.id != .register { core.router.navigate(.register) }
        case .home:
            if core.router.current.id == .index || core.router.current.id == .signIn || core.router.current.id == .register {
                if let feedId = core.currentUser?["preferred_news_feed_id"]?.stringValue
                    ?? core.storage.get(StorageKey.preferredFeedId), !feedId.isEmpty {
                    core.router.navigate(.feed(feedId: feedId))
                } else {
                    core.router.navigate(.homeIndex)
                }
            }
        }
        bump()
    }

    func logout() {
        Task {
            if let token = core.storage.get(StorageKey.expoPushToken) {
                _ = try? await core.http.sendRaw(
                    method: .delete,
                    path: "/user/delete-fcm",
                    operationId: "deleteFcm",
                    json: ["expo_push_token": .string(token)]
                )
            }
            core.clearSession()
            applyGateNavigation()
        }
    }

    func sendOTP(phone: String) async throws {
        if let supabase = SupabaseAuthService.shared {
            try await supabase.sendOTP(phone: phone)
        } else {
            _ = CommandRunner(core: core).run(["auth", "send-otp", phone])
        }
    }

    func verifyOTP(phone: String, token: String) async throws {
        if let supabase = SupabaseAuthService.shared {
            let rec = try await supabase.verifyOTP(phone: phone, token: token)
            core.persistSession(rec)
        } else {
            _ = CommandRunner(core: core).run(["auth", "verify", phone, token])
        }
        await loadSessionUser()
    }

    func register(username: String, dob: String, gender: String) async throws {
        _ = try await core.http.execute(Operations.UpdateUser(body: UpdateUserRequest(
            username: username,
            dateOfBirth: dob,
            gender: gender
        )))
        await loadSessionUser()
    }

    func like(verificationId: String, undo: Bool) {
        _ = CommandRunner(core: core).run(undo ? ["like", verificationId, "--undo"] : ["like", verificationId])
        core.haptics.play(.medium)
        Task {
            _ = try? await core.http.execute(Operations.LikeVerification(path: .init(verificationId: verificationId)))
        }
        bump()
    }

    private func connectSocket() {
        guard let userId = core.sessionUserId else { return }
        let keys = ChatCrypto.loadOrCreateKeys(in: core.storage)
        core.socket.connect(
            url: core.http.baseURL,
            userId: userId,
            publicKey: keys.publicKey,
            deviceId: core.deviceId()
        )
        Task {
            _ = try? await core.http.executeJSON(Operations.SendPublicKeyChatSendPublicKeyPost(
                body: SendPublicKeyRequest(userId: userId, publicKey: keys.publicKey, deviceId: core.deviceId())
            ))
        }
    }

    private func handleSocket(_ event: String, _ payload: JSONValue) {
        switch event {
        case SocketEvent.forceLogout:
            toast.show(core.l10n.t(.commonForcedLogout))
            logout()
        case SocketEvent.userPublicKey:
            if let userId = payload["userId"]?.stringValue ?? payload["user_id"]?.stringValue,
               let key = payload["publicKey"]?.stringValue ?? payload["public_key"]?.stringValue {
                ChatCrypto.storeRemotePublicKey(userId, key, in: core.storage)
            }
        case SocketEvent.privateMessage:
            let roomId = payload["room_id"]?.stringValue ?? ""
            if core.router.current.id != .chatRoom {
                let name = payload["sender_username"]?.stringValue ?? payload["sender"]?["username"]?.stringValue ?? ""
                let preview = ChatCrypto.decryptMessage(payload, currentUserId: core.sessionUserId ?? "", storage: core.storage)
                incomingToast = IncomingMessageToast(roomId: roomId, name: name, preview: preview)
            }
            core.store.invalidate(operationId: "getMessagesChatMessagesGet")
            core.store.invalidate(operationId: "getUserChatRooms")
        case SocketEvent.userConnectionStatus:
            core.store.setQueryData(QueryKey(operationId: "user_connection_status"), payload)
        default:
            break
        }
        bump()
    }

    private func resolveUsername(_ username: String) async {
        do {
            let json = try await core.http.executeJSON(Operations.GetUserProfileByUsername(path: .init(username: username)))
            if let id = json["id"]?.stringValue {
                core.router.back()
                core.router.navigate(.profile(userId: id))
                bump()
            }
        } catch {
            toast.show(core.l10n.t(.commonErrorTitle))
        }
    }

    private func seedMockUser() {
        core.currentUser = [
            "id": "u1",
            "username": "demo",
            "gender": "male",
            "date_of_birth": "01/02/2000",
            "preferred_news_feed_id": "feed-1",
            "photos": [],
            "bio": "",
        ]
    }
}

struct IncomingMessageToast: Identifiable, Equatable {
    let id = UUID()
    let roomId: String
    let name: String
    let preview: String
}

private struct AppHostKey: EnvironmentKey {
    static let defaultValue: AppHost? = nil
}

extension EnvironmentValues {
    var appHost: AppHost? {
        get { self[AppHostKey.self] }
        set { self[AppHostKey.self] = newValue }
    }
}
