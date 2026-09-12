import WALAPI
import XCTest

final class GeneratedAPITests: XCTestCase {
    private let decoder = JSONDecoder()

    /// Path to native/shared/api/openapi.json, resolved from this source file (tests run from the package dir).
    private var openapiURL: URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("shared/api/openapi.json")
    }

    func testEveryOpenAPIOperationHasAGeneratedStruct() throws {
        let data = try Data(contentsOf: openapiURL)
        let doc = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        let paths = doc["paths"] as! [String: [String: [String: Any]]]
        let ids = paths.values.flatMap { $0.values.compactMap { $0["operationId"] as? String } }.sorted()
        XCTAssertEqual(ids, Operations.allOperationIds)
        XCTAssertEqual(ids.count, 114)
    }

    func testUserDecodesSnakeCaseAndTreatsNullAsNil() throws {
        let json = """
        {"id":"u1","date_of_birth":null,"email":"a@b.c","phone_number":"+995500000000","username":"nika",
         "gender":"male","external_user_id":"ext","interests":null,"photos":[],"preferred_news_feed_id":"nf",
         "is_virtual":false,"unknown_future_field":{"x":1}}
        """
        let user = try decoder.decode(User.self, from: Data(json.utf8))
        XCTAssertEqual(user.id, "u1")
        XCTAssertNil(user.dateOfBirth)
        XCTAssertEqual(user.phoneNumber, "+995500000000")
        XCTAssertEqual(user.preferredNewsFeedId, "nf")
        XCTAssertEqual(user.isVirtual, false)
        XCTAssertNil(user.interests)
    }

    func testEncodingUsesWireNamesAndOmitsNil() throws {
        let body = UpdateUserRequest(username: "nika")
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        let json = String(data: try encoder.encode(body), encoding: .utf8)!
        XCTAssertTrue(json.contains("\"username\":\"nika\""))
        XCTAssertFalse(json.contains("null"), "nil optionals must be omitted like the RN client does: \(json)")
    }

    func testExtensibleEnumKeepsUnknownValues() throws {
        let known = try decoder.decode(ReactionType.self, from: Data("\"love\"".utf8))
        XCTAssertEqual(known, .love)
        XCTAssertTrue(known.isKnown)
        let future = try decoder.decode(ReactionType.self, from: Data("\"fire\"".utf8))
        XCTAssertEqual(future.rawValue, "fire")
        XCTAssertFalse(future.isKnown)
        XCTAssertEqual(ReactionType.known.count, 7)
        XCTAssertEqual(String(data: try JSONEncoder().encode(future), encoding: .utf8), "\"fire\"")
    }

    func testPathSubstitutionAndPercentEncoding() {
        let op = Operations.GetUserProfileUserProfileUserIdGet(path: .init(userId: "user id/1"))
        XCTAssertEqual(Operations.GetUserProfileUserProfileUserIdGet.method, .get)
        XCTAssertEqual(op.resolvedPath, "/user/profile/user%20id%2F1")
        XCTAssertTrue(op.queryItems.isEmpty)
        XCTAssertTrue(op.headerValues.isEmpty)
    }

    func testQueryItemsSkipNilAndSerialiseBools() {
        let op = Operations.GetLocationFeeds(
            query: .init(categoryId: "c1", ignoreLocationCheck: true),
            headers: .init(xUserLocationLatitude: 41.7151, xUserLocationLongitude: 44.8271)
        )
        XCTAssertEqual(op.resolvedPath, "/feeds/locations")
        XCTAssertEqual(
            op.queryItems.map { "\($0.name)=\($0.value ?? "")" },
            ["category_id=c1", "ignore_location_check=true"]
        )
        XCTAssertEqual(op.headerValues, ["x-user-location-latitude": "41.7151", "x-user-location-longitude": "44.8271"])

        let sparse = Operations.GetLocationFeeds(query: .init(categoryId: "c1"))
        XCTAssertEqual(sparse.queryItems.count, 1)
    }

    func testMultipartBodyProducesFormDataParts() {
        let file = MultipartFile(data: Data([0xff, 0xd8]), filename: "a.jpg", mimeType: "image/jpeg")
        let body = BodyPublishPost(feedId: "f1", content: "hello", files: [file, file])
        XCTAssertEqual(Operations.PublishPost.bodyEncoding, .multipart)
        let parts = body.multipartParts()
        XCTAssertEqual(parts.map(\.name), ["feed_id", "content", "files", "files"])
        let form = MultipartFormData(parts: parts, boundary: "B")
        let encoded = String(decoding: form.encoded(), as: UTF8.self)
        XCTAssertTrue(encoded.hasPrefix("--B\r\nContent-Disposition: form-data; name=\"feed_id\"\r\n\r\nf1\r\n"))
        XCTAssertTrue(encoded.contains("name=\"files\"; filename=\"a.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n"))
        XCTAssertTrue(encoded.hasSuffix("--B--\r\n"))
        XCTAssertEqual(form.contentType, "multipart/form-data; boundary=B")
    }

    func testEmptyResponseAcceptsAnything() throws {
        XCTAssertNil(try decoder.decode(EmptyResponse.self, from: Data("null".utf8)).raw?.stringValue)
        XCTAssertEqual(try decoder.decode(EmptyResponse.self, from: Data("{\"ok\":true}".utf8)).raw?["ok"]?.boolValue, true)
    }

    func testJSONValueRoundTrip() throws {
        let value: JSONValue = ["a": [1, 2.5, "x", true, nil], "b": ["c": "d"]]
        let data = try JSONEncoder().encode(value)
        XCTAssertEqual(try decoder.decode(JSONValue.self, from: data), value)
        XCTAssertEqual(value["a"]?[1]?.doubleValue, 2.5)
        XCTAssertEqual(value["a"]?[0]?.intValue, 1)
        XCTAssertTrue(value["a"]?[4]?.isNull ?? false)
    }
}
