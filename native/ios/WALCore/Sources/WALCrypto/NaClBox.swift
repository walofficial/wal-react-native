import CSodium
import Foundation

/// Wire-compatible port of lib/services/ProtocolService.ts: libsodium `crypto_box_easy` /
/// `crypto_box_open_easy` (X25519 + XSalsa20-Poly1305) with 24-byte nonces.
///
/// The RN app serialises every byte array with react-native-libsodium's default base64 variant,
/// `URLSAFE_NO_PADDING`, so `Base64URL` below must be used for keys, nonces and ciphertext.
public enum NaClBox {
    public static let publicKeyBytes = Int(crypto_box_PUBLICKEYBYTES)
    public static let secretKeyBytes = Int(crypto_box_SECRETKEYBYTES)
    public static let nonceBytes = Int(crypto_box_NONCEBYTES)
    public static let macBytes = Int(crypto_box_MACBYTES)

    public enum Error: Swift.Error, Equatable {
        case sodiumInitFailed
        case invalidKeyLength
        case invalidNonceLength
        case invalidBase64
        case decryptionFailed
    }

    public struct KeyPair: Hashable, Sendable {
        public let publicKey: Data
        public let secretKey: Data
        public init(publicKey: Data, secretKey: Data) {
            self.publicKey = publicKey
            self.secretKey = secretKey
        }
    }

    public struct Sealed: Hashable, Sendable, Codable {
        /// Base64URL (no padding) ciphertext incl. 16-byte MAC prefix.
        public let encryptedContent: String
        /// Base64URL (no padding) 24-byte nonce.
        public let nonce: String
        public init(encryptedContent: String, nonce: String) {
            self.encryptedContent = encryptedContent
            self.nonce = nonce
        }
    }

    private static let initialised: Bool = sodium_init() >= 0

    private static func ensureInit() throws {
        guard initialised else { throw Error.sodiumInitFailed }
    }

    public static func generateKeyPair() throws -> KeyPair {
        try ensureInit()
        var pk = [UInt8](repeating: 0, count: publicKeyBytes)
        var sk = [UInt8](repeating: 0, count: secretKeyBytes)
        crypto_box_keypair(&pk, &sk)
        return KeyPair(publicKey: Data(pk), secretKey: Data(sk))
    }

    public static func randomNonce() throws -> Data {
        try ensureInit()
        var nonce = [UInt8](repeating: 0, count: nonceBytes)
        randombytes_buf(&nonce, nonce.count)
        return Data(nonce)
    }

    /// `crypto_box_easy(message, nonce, recipientPublicKey, senderSecretKey)`
    public static func seal(message: Data, nonce: Data, recipientPublicKey: Data, senderSecretKey: Data) throws -> Data {
        try ensureInit()
        guard recipientPublicKey.count == publicKeyBytes, senderSecretKey.count == secretKeyBytes else { throw Error.invalidKeyLength }
        guard nonce.count == nonceBytes else { throw Error.invalidNonceLength }
        var out = [UInt8](repeating: 0, count: message.count + macBytes)
        let m = [UInt8](message), n = [UInt8](nonce), pk = [UInt8](recipientPublicKey), sk = [UInt8](senderSecretKey)
        let rc = crypto_box_easy(&out, m, UInt64(m.count), n, pk, sk)
        guard rc == 0 else { throw Error.decryptionFailed }
        return Data(out)
    }

    /// `crypto_box_open_easy(ciphertext, nonce, senderPublicKey, recipientSecretKey)`
    public static func open(ciphertext: Data, nonce: Data, senderPublicKey: Data, recipientSecretKey: Data) throws -> Data {
        try ensureInit()
        guard senderPublicKey.count == publicKeyBytes, recipientSecretKey.count == secretKeyBytes else { throw Error.invalidKeyLength }
        guard nonce.count == nonceBytes, ciphertext.count >= macBytes else { throw Error.invalidNonceLength }
        var out = [UInt8](repeating: 0, count: ciphertext.count - macBytes)
        let c = [UInt8](ciphertext), n = [UInt8](nonce), pk = [UInt8](senderPublicKey), sk = [UInt8](recipientSecretKey)
        let rc = crypto_box_open_easy(&out, c, UInt64(c.count), n, pk, sk)
        guard rc == 0 else { throw Error.decryptionFailed }
        return Data(out)
    }

    // MARK: - String convenience (matches ProtocolService.encryptMessage / decryptMessage)

    public static func encrypt(message: String, recipientPublicKeyB64: String, senderSecretKeyB64: String) throws -> Sealed {
        let nonce = try randomNonce()
        let cipher = try seal(
            message: Data(message.utf8),
            nonce: nonce,
            recipientPublicKey: try Base64URL.decode(recipientPublicKeyB64),
            senderSecretKey: try Base64URL.decode(senderSecretKeyB64)
        )
        return Sealed(encryptedContent: Base64URL.encode(cipher), nonce: Base64URL.encode(nonce))
    }

    public static func decrypt(_ sealed: Sealed, senderPublicKeyB64: String, recipientSecretKeyB64: String) throws -> String {
        let plain = try open(
            ciphertext: try Base64URL.decode(sealed.encryptedContent),
            nonce: try Base64URL.decode(sealed.nonce),
            senderPublicKey: try Base64URL.decode(senderPublicKeyB64),
            recipientSecretKey: try Base64URL.decode(recipientSecretKeyB64)
        )
        guard let s = String(data: plain, encoding: .utf8) else { throw Error.decryptionFailed }
        return s
    }
}

/// libsodium `base64_variants.URLSAFE_NO_PADDING` (RFC 4648 §5, no `=`), the default in react-native-libsodium.
/// Decoding is tolerant of the standard alphabet and padding so keys stored by older builds still load.
public enum Base64URL {
    public static func encode(_ data: Data) -> String {
        data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    public static func decode(_ string: String) throws -> Data {
        var s = string.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        let rem = s.count % 4
        if rem == 2 { s += "==" } else if rem == 3 { s += "=" } else if rem == 1 { throw NaClBox.Error.invalidBase64 }
        guard let data = Data(base64Encoded: s) else { throw NaClBox.Error.invalidBase64 }
        return data
    }
}
