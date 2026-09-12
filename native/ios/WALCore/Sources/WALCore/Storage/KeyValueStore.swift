import Foundation

/// AsyncStorage / Keychain / UserDefaults stand-in. Production iOS uses Keychain for secrets
/// (`user_keys_v2`, `remote_key_*`, session) and UserDefaults for prefs (`app-locale`).
public protocol KeyValueStore: Sendable {
    func get(_ key: String) -> String?
    func set(_ key: String, _ value: String?)
    func remove(_ key: String)
}

public final class MemoryStore: KeyValueStore, @unchecked Sendable {
    private var values: [String: String] = [:]
    private let lock = NSLock()
    public init() {}
    public func get(_ key: String) -> String? { lock.lock(); defer { lock.unlock() }; return values[key] }
    public func set(_ key: String, _ value: String?) { lock.lock(); values[key] = value; lock.unlock() }
    public func remove(_ key: String) { set(key, nil) }
}

public enum StorageKey {
    public static let session = "sb-auth-token"
    public static let userKeys = "user_keys_v2"
    public static let appLocale = "app-locale"
    public static let apiOverride = "API_BASE_URL_OVERRIDE"
    public static let deviceId = "device_id"
    public static let latitude = "user_latitude"
    public static let longitude = "user_longitude"
    public static let expoPushToken = "expo_push_token"
    public static let preferredFeedId = "preferred_news_feed_id"
    public static func remoteKey(_ userId: String) -> String { "remote_key_\(userId)" }
}

/// Supabase-shaped session blob stored under `StorageKey.session`.
public struct SessionRecord: Hashable, Sendable, Codable {
    public var accessToken: String?
    public var refreshToken: String?
    public var userId: String?
    public var phone: String?
    public var expiresAt: Double?

    public init(accessToken: String? = nil, refreshToken: String? = nil, userId: String? = nil, phone: String? = nil, expiresAt: Double? = nil) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.userId = userId
        self.phone = phone
        self.expiresAt = expiresAt
    }

    public enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case userId = "user_id"
        case phone
        case expiresAt = "expires_at"
    }

    public static func parse(_ raw: String?) -> SessionRecord? {
        guard let raw, let data = raw.data(using: .utf8) else { return nil }
        if let rec = try? JSONDecoder().decode(SessionRecord.self, from: data) { return rec }
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return SessionRecord(
            accessToken: obj["access_token"] as? String,
            refreshToken: obj["refresh_token"] as? String,
            userId: (obj["user_id"] as? String) ?? ((obj["user"] as? [String: Any])?["id"] as? String),
            phone: obj["phone"] as? String,
            expiresAt: obj["expires_at"] as? Double
        )
    }

    public func encoded() -> String {
        let data = (try? JSONEncoder().encode(self)) ?? Data("{}".utf8)
        return String(data: data, encoding: .utf8) ?? "{}"
    }
}

/// Keychain-backed store for secrets. Falls back to UserDefaults on platforms without Security.
public final class KeychainStore: KeyValueStore, @unchecked Sendable {
    private let memory = MemoryStore()
    private let defaults: UserDefaults
    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    public func get(_ key: String) -> String? {
        #if canImport(Security)
        if let value = KeychainStore.readKeychain(key) { return value }
        #endif
        return defaults.string(forKey: key) ?? memory.get(key)
    }

    public func set(_ key: String, _ value: String?) {
        if let value {
            #if canImport(Security)
            KeychainStore.writeKeychain(key, value)
            #endif
            defaults.set(value, forKey: key)
            memory.set(key, value)
        } else {
            remove(key)
        }
    }

    public func remove(_ key: String) {
        #if canImport(Security)
        KeychainStore.deleteKeychain(key)
        #endif
        defaults.removeObject(forKey: key)
        memory.remove(key)
    }
}

#if canImport(Security)
import Security

extension KeychainStore {
    private static let service = "com.greetai.wal"

    static func readKeychain(_ key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var out: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &out)
        guard status == errSecSuccess, let data = out as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func writeKeychain(_ key: String, _ value: String) {
        deleteKeychain(key)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: Data(value.utf8),
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    static func deleteKeychain(_ key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
#endif
