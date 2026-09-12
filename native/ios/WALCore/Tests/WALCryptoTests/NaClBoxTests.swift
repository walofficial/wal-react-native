import WALCrypto
import XCTest

final class NaClBoxTests: XCTestCase {
    // Vector produced with tweetnacl-js 1.0.3 (an independent implementation of crypto_box):
    // secret keys 0x01*32 / 0x02*32, nonce 0..23, base64 URLSAFE_NO_PADDING like react-native-libsodium.
    private let aSecret = "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE"
    private let aPublic = "pOCSkrZRwni5dyxWn1-puxPZBrRqtoyd-dwrRAn4ogk"
    private let bSecret = "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI"
    private let bPublic = "zo060cy2M-x7cMF4FKXHbs0CloUFDTRHRboFhw5YfVk"
    private let nonce = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYX"
    private let cipher = "SPwD6Q-e9UNygPEByKXIlgNMESIZoQe1Irf7Vy0fpxlYfJ1lPlZI4-DDywJ3UaCcNvJUAw"
    private let message = "გამარჯობა WAL 👋"

    func testConstantsMatchLibsodium() {
        XCTAssertEqual(NaClBox.publicKeyBytes, 32)
        XCTAssertEqual(NaClBox.secretKeyBytes, 32)
        XCTAssertEqual(NaClBox.nonceBytes, 24)
        XCTAssertEqual(NaClBox.macBytes, 16)
    }

    func testDecryptsTweetnaclVector() throws {
        let plain = try NaClBox.decrypt(
            .init(encryptedContent: cipher, nonce: nonce),
            senderPublicKeyB64: aPublic,
            recipientSecretKeyB64: bSecret
        )
        XCTAssertEqual(plain, message)
    }

    func testEncryptsToTweetnaclVectorWithFixedNonce() throws {
        let out = try NaClBox.seal(
            message: Data(message.utf8),
            nonce: try Base64URL.decode(nonce),
            recipientPublicKey: try Base64URL.decode(bPublic),
            senderSecretKey: try Base64URL.decode(aSecret)
        )
        XCTAssertEqual(Base64URL.encode(out), cipher)
    }

    func testDerivedPublicKeysMatchVector() throws {
        XCTAssertEqual(
            Base64URL.encode(try NaClBox.publicKey(fromSecretKey: try Base64URL.decode(aSecret))),
            aPublic
        )
        XCTAssertEqual(
            Base64URL.encode(try NaClBox.publicKey(fromSecretKey: try Base64URL.decode(bSecret))),
            bPublic
        )
        let kp = try NaClBox.generateKeyPair()
        XCTAssertEqual(kp.publicKey.count, 32)
        XCTAssertEqual(kp.secretKey.count, 32)
        XCTAssertEqual(try NaClBox.publicKey(fromSecretKey: kp.secretKey), kp.publicKey)
    }

    func testRoundTripWithFreshKeys() throws {
        let alice = try NaClBox.generateKeyPair()
        let bob = try NaClBox.generateKeyPair()
        let sealed = try NaClBox.encrypt(
            message: "hello",
            recipientPublicKeyB64: Base64URL.encode(bob.publicKey),
            senderSecretKeyB64: Base64URL.encode(alice.secretKey)
        )
        XCTAssertFalse(sealed.encryptedContent.contains("="), "wire format is unpadded base64url")
        XCTAssertFalse(sealed.nonce.contains("+"))
        let plain = try NaClBox.decrypt(
            sealed,
            senderPublicKeyB64: Base64URL.encode(alice.publicKey),
            recipientSecretKeyB64: Base64URL.encode(bob.secretKey)
        )
        XCTAssertEqual(plain, "hello")
    }

    func testTamperedCiphertextFails() throws {
        var bytes = [UInt8](try Base64URL.decode(cipher))
        bytes[bytes.count - 1] ^= 0x01
        XCTAssertThrowsError(
            try NaClBox.open(
                ciphertext: Data(bytes),
                nonce: try Base64URL.decode(nonce),
                senderPublicKey: try Base64URL.decode(aPublic),
                recipientSecretKey: try Base64URL.decode(bSecret)
            )
        ) { XCTAssertEqual($0 as? NaClBox.Error, .decryptionFailed) }
    }

    func testWrongKeyFails() throws {
        XCTAssertThrowsError(
            try NaClBox.decrypt(.init(encryptedContent: cipher, nonce: nonce), senderPublicKeyB64: bPublic, recipientSecretKeyB64: bSecret)
        )
    }

    func testRandomNoncesDiffer() throws {
        XCTAssertNotEqual(try NaClBox.randomNonce(), try NaClBox.randomNonce())
    }

    func testBase64URLAcceptsStandardAlphabetAndPadding() throws {
        let data = Data([0xfb, 0xff, 0xbf, 0x01])
        XCTAssertEqual(Base64URL.encode(data), "-_-_AQ")
        XCTAssertEqual(try Base64URL.decode("-_-_AQ"), data)
        XCTAssertEqual(try Base64URL.decode("+/+/AQ=="), data)
        XCTAssertThrowsError(try Base64URL.decode("A"))
        XCTAssertThrowsError(try Base64URL.decode("!!!!"))
    }
}
