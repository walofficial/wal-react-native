import Foundation

public struct UserKeyPairRecord: Codable, Hashable, Sendable {
    public var publicKey: String
    public var privateKey: String
    public var registrationId: Int

    public init(publicKey: String, privateKey: String, registrationId: Int) {
        self.publicKey = publicKey
        self.privateKey = privateKey
        self.registrationId = registrationId
    }
}

/// Decrypts WAL E2E payloads the same way `ProtocolService.ts` / `fetchDecryptedChatRooms.ts` do.
public enum ChatCrypto {
    public static let encryptedPlaceholder = "🔒 Encrypted message"

    public static func loadOrCreateKeys(in storage: KeyValueStore) -> UserKeyPairRecord {
        if let raw = storage.get(StorageKey.userKeys),
           let data = raw.data(using: .utf8),
           let rec = try? JSONDecoder().decode(UserKeyPairRecord.self, from: data) {
            return rec
        }
        let kp = (try? NaClBox.generateKeyPair()) ?? NaClBox.KeyPair(publicKey: Data(), secretKey: Data())
        let rec = UserKeyPairRecord(
            publicKey: Base64URL.encode(kp.publicKey),
            privateKey: Base64URL.encode(kp.secretKey),
            registrationId: Int.random(in: 1...16383)
        )
        if let data = try? JSONEncoder().encode(rec), let s = String(data: data, encoding: .utf8) {
            storage.set(StorageKey.userKeys, s)
        }
        return rec
    }

    public static func decryptMessage(
        _ message: JSONValue,
        currentUserId: String,
        storage: KeyValueStore
    ) -> String {
        if let plain = message["plain_content"]?.stringValue, !plain.isEmpty { return plain }
        if let already = message["message"]?.stringValue, !already.isEmpty { return already }
        guard let encrypted = message["encrypted_content"]?.stringValue, !encrypted.isEmpty,
              let nonce = message["nonce"]?.stringValue, !nonce.isEmpty
        else { return "" }

        let author = message["author_id"]?.stringValue ?? ""
        let recipient = message["recipient_id"]?.stringValue ?? ""
        let otherId = author == currentUserId ? recipient : author
        guard let remote = storage.get(StorageKey.remoteKey(otherId)), !remote.isEmpty else {
            return encryptedPlaceholder
        }
        let keys = loadOrCreateKeys(in: storage)
        do {
            return try NaClBox.decrypt(
                .init(encryptedContent: encrypted, nonce: nonce),
                senderPublicKeyB64: remote,
                recipientSecretKeyB64: keys.privateKey
            )
        } catch {
            return encryptedPlaceholder
        }
    }

    public static func encrypt(
        message: String,
        recipientPublicKey: String,
        storage: KeyValueStore
    ) throws -> NaClBox.Sealed {
        let keys = loadOrCreateKeys(in: storage)
        return try NaClBox.encrypt(
            message: message,
            recipientPublicKeyB64: recipientPublicKey,
            senderSecretKeyB64: keys.privateKey
        )
    }

    public static func storeRemotePublicKey(_ userId: String, _ publicKey: String, in storage: KeyValueStore) {
        guard !userId.isEmpty, !publicKey.isEmpty else { return }
        storage.set(StorageKey.remoteKey(userId), publicKey)
    }
}
