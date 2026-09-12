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
    public static func remoteKey(_ userId: String) -> String { "remote_key_\(userId)" }
}
