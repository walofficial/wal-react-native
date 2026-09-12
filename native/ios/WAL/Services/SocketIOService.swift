import Foundation
import WALCore

#if canImport(SocketIO)
import SocketIO
#endif

/// Socket.IO-Client-Swift 16.1.1 wrapper. Websocket-only, auth `{userId, publicKey, deviceId}`.
final class SocketIOService: RealtimeSocketing {
    var onEvent: ((String, JSONValue) -> Void)?
    private(set) var isConnected = false
    private var heartbeat: Timer?

    #if canImport(SocketIO)
    private var manager: SocketManager?
    private var socket: SocketIO.SocketIOClient?
    #endif

    func connect(url: URL, userId: String, publicKey: String, deviceId: String) {
        disconnect()
        #if canImport(SocketIO)
        let manager = SocketManager(
            socketURL: url,
            config: [
                .forceWebsockets(true),
                .reconnectAttempts(10),
                .reconnectWait(1),
                .compress,
            ]
        )
        let socket = manager.defaultSocket
        self.manager = manager
        self.socket = socket
        for event in [
            SocketEvent.privateMessage,
            SocketEvent.userConnectionStatus,
            SocketEvent.userPublicKey,
            SocketEvent.notifySingleMessageSeen,
            SocketEvent.forceLogout,
        ] {
            socket.on(event) { [weak self] data, _ in
                let json = SocketIOService.decode(data.first)
                self?.onEvent?(event, json)
            }
        }
        socket.on(clientEvent: .connect) { [weak self] _, _ in
            self?.isConnected = true
            self?.startHeartbeat()
        }
        socket.on(clientEvent: .disconnect) { [weak self] _, _ in
            self?.isConnected = false
            self?.heartbeat?.invalidate()
        }
        socket.connect(withPayload: [
            "userId": userId,
            "publicKey": publicKey,
            "deviceId": deviceId,
        ])
        #else
        isConnected = true
        startHeartbeat()
        #endif
        _ = (userId, publicKey, deviceId)
    }

    func disconnect() {
        heartbeat?.invalidate()
        heartbeat = nil
        #if canImport(SocketIO)
        socket?.disconnect()
        socket = nil
        manager = nil
        #endif
        isConnected = false
    }

    func emit(_ event: String, _ payload: [String: JSONValue]) {
        #if canImport(SocketIO)
        socket?.emit(event, SocketIOService.object(payload))
        #endif
    }

    private func startHeartbeat() {
        heartbeat?.invalidate()
        heartbeat = Timer.scheduledTimer(withTimeInterval: Double(Tokens.Metrics.heartbeatMs) / 1000, repeats: true) { [weak self] _ in
            self?.emit(SocketEvent.heartbeat, [:])
        }
    }

    private static func decode(_ any: Any?) -> JSONValue {
        guard let any,
              let data = try? JSONSerialization.data(withJSONObject: any),
              let json = try? JSONDecoder().decode(JSONValue.self, from: data)
        else { return .null }
        return json
    }

    private static func object(_ payload: [String: JSONValue]) -> [String: Any] {
        guard let data = try? JSONEncoder().encode(JSONValue.object(payload)),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return [:] }
        return obj
    }
}
