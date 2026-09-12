import WALCore
import XCTest

final class FeedPagingTests: XCTestCase {
    func testFlattensRawArraysAndItemsObjects() {
        let packed = QueryStore.packPages([
            .array([["id": "a", "text_content": "one"]]),
            ["items": [["id": "b", "is_liked": true]]],
            ["data": [["id": "c"]]],
        ])
        let posts = FeedPaging.flatten(packed)
        XCTAssertEqual(posts.map(\.id), ["a", "b", "c"])
        XCTAssertEqual(posts[1].raw["is_liked"]?.boolValue, true)
    }

    func testHasMoreUsesPageSize() {
        let page = JSONValue.array((0..<10).map { .object(["id": .string("\($0)")]) })
        XCTAssertTrue(FeedPaging.hasMore(lastPage: page, pageSize: 10))
        XCTAssertFalse(FeedPaging.hasMore(lastPage: ["items": [["id": "1"]]], pageSize: 10))
    }
}

final class ChatCryptoTests: XCTestCase {
    func testRoundTripMatchesProtocolService() throws {
        let storage = MemoryStore()
        let alice = ChatCrypto.loadOrCreateKeys(in: storage)
        let bob = try NaClBox.generateKeyPair()
        ChatCrypto.storeRemotePublicKey("bob", Base64URL.encode(bob.publicKey), in: storage)
        let sealed = try ChatCrypto.encrypt(message: "hello", recipientPublicKey: Base64URL.encode(bob.publicKey), storage: storage)
        let opened = try NaClBox.decrypt(
            sealed,
            senderPublicKeyB64: alice.publicKey,
            recipientSecretKeyB64: Base64URL.encode(bob.secretKey)
        )
        XCTAssertEqual(opened, "hello")
        let incoming: JSONValue = [
            "author_id": "bob",
            "recipient_id": "alice",
            "encrypted_content": .string(sealed.encryptedContent),
            "nonce": .string(sealed.nonce),
        ]
        // Incoming from bob would use bob's public key + alice secret. Seed alice as current user keys.
        storage.set(StorageKey.userKeys, String(data: try JSONEncoder().encode(alice), encoding: .utf8))
        ChatCrypto.storeRemotePublicKey("bob", Base64URL.encode(bob.publicKey), in: storage)
        let preview = ChatCrypto.decryptMessage(incoming, currentUserId: "alice", storage: storage)
        XCTAssertEqual(preview, "hello")
    }
}

final class SessionRecordTests: XCTestCase {
    func testParsesSupabaseShapedBlob() {
        let raw = #"{"access_token":"tok","user_id":"u1","phone":"+995","refresh_token":"r"}"#
        let rec = SessionRecord.parse(raw)
        XCTAssertEqual(rec?.accessToken, "tok")
        XCTAssertEqual(rec?.userId, "u1")
        let core = AppCore(mode: .mock, fixtures: URL(fileURLWithPath: "/tmp"), storage: MemoryStore())
        core.persistSession(rec!)
        XCTAssertEqual(core.sessionUserId, "u1")
        XCTAssertTrue(core.hasSession)
        core.clearSession()
        XCTAssertFalse(core.hasSession)
        XCTAssertEqual(core.router.current.id, .signIn)
    }
}
