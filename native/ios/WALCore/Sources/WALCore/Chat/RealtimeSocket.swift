import Foundation

/// Headless Socket.IO surface. The iOS app binds Socket.IO-Client-Swift; tests use `MockRealtimeSocket`.
public protocol RealtimeSocketing: AnyObject {
    func connect(url: URL, userId: String, publicKey: String, deviceId: String)
    func disconnect()
    func emit(_ event: String, _ payload: [String: JSONValue])
    var onEvent: ((String, JSONValue) -> Void)? { get set }
    var isConnected: Bool { get }
}

public final class MockRealtimeSocket: RealtimeSocketing, @unchecked Sendable {
    public private(set) var emitted: [(String, [String: JSONValue])] = []
    public private(set) var didConnect = false
    public var onEvent: ((String, JSONValue) -> Void)?
    public var isConnected: Bool { didConnect }

    public init() {}

    public func connect(url: URL, userId: String, publicKey: String, deviceId: String) {
        didConnect = true
        _ = (url, userId, publicKey, deviceId)
    }

    public func disconnect() { didConnect = false }

    public func emit(_ event: String, _ payload: [String: JSONValue]) {
        emitted.append((event, payload))
    }

    public func receive(_ event: String, _ payload: JSONValue) {
        onEvent?(event, payload)
    }
}

public enum SocketEvent {
    public static let privateMessage = "private_message"
    public static let userConnectionStatus = "user_connection_status"
    public static let userPublicKey = "user_public_key"
    public static let notifySingleMessageSeen = "notify_single_message_seen"
    public static let forceLogout = "force_logout"
    public static let heartbeat = "heartbeat"
    public static let checkUserConnection = "check_user_connection"
}
