import WALCore
import XCTest

final class CSSColorTests: XCTestCase {
    func testParsesThemeHexAndRGBA() {
        XCTAssertEqual(CSSColor.parse("#efefef")?.hexRGB, "#efefef")
        XCTAssertEqual(CSSColor.parse("#000000")?.hexRGB, "#000000")
        XCTAssertEqual(CSSColor.parse("#FF2D55")?.hexRGB, "#ff2d55")
        let border = CSSColor.parse("rgba(47,51,54,0.5)")
        XCTAssertEqual(border?.red ?? 0, 47 / 255, accuracy: 0.001)
        XCTAssertEqual(border?.alpha ?? 0, 0.5, accuracy: 0.001)
        XCTAssertNil(CSSColor.parse("nope"))
    }

    func testResolvedThemeMatchesRNLightAndDark() {
        let dark = ResolvedTheme.resolve(isDark: true)
        let light = ResolvedTheme.resolve(isDark: false)
        XCTAssertEqual(dark.background.hexRGB, "#000000")
        XCTAssertEqual(light.background.hexRGB, "#efefef")
        XCTAssertEqual(dark["accent"]?.hexRGB, "#ff375f")
        XCTAssertEqual(light["accent"]?.hexRGB, "#ff2d55")
        XCTAssertEqual(dark["cardBackground"]?.hexRGB, "#141414")
        XCTAssertEqual(ColorSchemePreference.system.resolved(systemIsDark: true), true)
        XCTAssertEqual(ColorSchemePreference.system.resolved(systemIsDark: false), false)
        XCTAssertEqual(TextRole.md.size, 16)
        XCTAssertEqual(TextRole.huge.size, 36)
        XCTAssertEqual(FontWeightToken.semibold.numeric, 600)
    }

    func testIoniconMapCoversTabIcons() {
        XCTAssertEqual(IoniconMap.sfSymbol(for: "location"), "location.fill")
        XCTAssertEqual(IoniconMap.sfSymbol(for: "chatbubble-outline"), "bubble.left")
        XCTAssertEqual(IoniconMap.sfSymbol(for: "person-circle"), "person.circle.fill")
        XCTAssertEqual(IoniconMap.sfSymbol(for: "unknown-icon"), "questionmark.circle")
    }
}

final class QueryStoreTests: XCTestCase {
    func testSetQueryDataAndPrefixInvalidate() {
        let store = QueryStore()
        let feed = QueryKey(operationId: "getLocationFeedPaginated", path: ["feed_id": "f1"], query: ["page": "1"], infinite: true)
        let other = QueryKey(operationId: "getLocationFeedPaginated", path: ["feed_id": "f2"], infinite: true)
        store.setQueryData(feed, ["items": [["id": "p1"]]])
        store.setQueryData(other, ["items": [["id": "p2"]]])
        store.invalidate(QueryKey(operationId: "getLocationFeedPaginated", path: ["feed_id": "f1"]))
        XCTAssertEqual(store.record(for: feed)?.updatedAt, Date.distantPast)
        XCTAssertNotEqual(store.record(for: other)?.updatedAt, Date.distantPast)
    }

    func testOptimisticLikeAcrossInfinitePages() {
        let store = QueryStore()
        let key = QueryKey(operationId: "getLocationFeedPaginated", path: ["feed_id": "f1"], infinite: true)
        store.setQueryData(key, QueryStore.packPages([
            ["items": [["id": "v1", "is_liked": false, "likes_count": 1]]],
        ]))
        store.mapInfinitePages(key) { page in
            guard var obj = page.objectValue, var items = obj["items"]?.arrayValue else { return page }
            items = items.map { item in
                guard var o = item.objectValue, o["id"]?.stringValue == "v1" else { return item }
                o["is_liked"] = true
                o["likes_count"] = 2
                return .object(o)
            }
            obj["items"] = .array(items)
            return .object(obj)
        }
        XCTAssertEqual(QueryStore.pages(from: store.data(for: key)).first?["items"]?[0]?["is_liked"]?.boolValue, true)
        XCTAssertEqual(QueryStore.pages(from: store.data(for: key)).first?["items"]?[0]?["likes_count"]?.intValue, 2)
        store.prependInfinite(key, item: ["id": "v0"])
        XCTAssertEqual(QueryStore.pages(from: store.data(for: key)).first?["items"]?[0]?["id"]?.stringValue, "v0")
    }
}

final class RouterStateTests: XCTestCase {
    func testTabResetAndPresentations() {
        let r = RouterState()
        r.navigate(.feed(feedId: "f1"))
        XCTAssertEqual(r.current.id, .feed)
        r.navigate(.profile(userId: "u2"))
        XCTAssertEqual(r.activeStack, .home)
        r.selectTab(.user)
        XCTAssertEqual(r.current.id, .userIndex)
        r.navigate(.settings)
        r.selectTab(.user)
        XCTAssertEqual(r.current.id, .userIndex, "user tabPress resets the stack")
        r.navigate(.createPost(feedId: "f1"))
        XCTAssertEqual(r.current.descriptor.presentation, .modal)
    }

    func testDeepLinkAndPushOrder() {
        let r = RouterState()
        XCTAssertEqual(r.applyDeepLink(url: URL(string: "https://wal.ge/status/abc")!)?.id, .status)
        XCTAssertEqual(r.current.id, .status)
        XCTAssertEqual(r.applyDeepLink(url: URL(string: "https://wal.ge/links/nika")!)?.id, .profileByUsername)
        XCTAssertEqual(r.applyPushTap(["type": "poke", "verificationId": "v1"])?.id, .verification)
        XCTAssertEqual(r.applyPushTap(["type": "new_message", "roomId": "r1"])?.id, .chatRoom)
        XCTAssertEqual(r.applyPushTap(["feedId": "f9"])?.id, .feed)
        XCTAssertEqual(r.applyPushTap(["type": "friend_request_sent"])?.id, .chatList)
    }

    func testWalSchemeStatusAndShareIntent() {
        let r = RouterState()
        XCTAssertEqual(RouterState.deepLinkPath(from: URL(string: "wal://status/abc")!), "/status/abc")
        XCTAssertEqual(r.applyDeepLink(url: URL(string: "wal://status/abc")!)?.id, .status)
        let share = RouterState()
        XCTAssertEqual(share.applyDeepLink(url: URL(string: "wal://dataUrl=walShareKey")!)?.id, .createPostShareIntent)
    }

    func testBackDismissesSheetsFirst() {
        let r = RouterState()
        r.navigate(.feed(feedId: "f1"))
        r.presentSheet("login")
        r.back()
        XCTAssertTrue(r.sheets.isEmpty)
        XCTAssertEqual(r.current.id, .feed)
        r.back()
        XCTAssertEqual(r.current.id, .homeIndex)
    }
}

final class HTTPClientTests: XCTestCase {
    func testBuildsAuthLanguageAndLocationHeaders() {
        let transport = FixtureTransport(root: URL(fileURLWithPath: "/tmp"))
        let client = HTTPClient(defaultBaseURL: URL(string: "https://example.test")!, transport: transport) {
            SessionSnapshot(accessToken: "tok", locale: "ka", latitude: "41.7", longitude: "44.8")
        }
        let op = Operations.GetLocationFeeds(query: .init(categoryId: "c1"))
        let req = try! client.build(op)
        XCTAssertEqual(req.headers["Authorization"], "Bearer tok")
        XCTAssertEqual(req.headers["Accept-Language"], "ka")
        XCTAssertEqual(req.headers["x-user-location-latitude"], "41.7")
        XCTAssertEqual(req.headers["x-user-location-longitude"], "44.8")
        XCTAssertNil(req.headers["x-is-anonymous"])
        XCTAssertEqual(req.path, "/feeds/locations")
    }

    func testRetriesOnceOn401() async throws {
        actor CounterTransport: HTTPTransport {
            var count = 0
            func send(_ request: HTTPRequest, baseURL: URL) async throws -> HTTPResponse {
                count += 1
                if count == 1 { return HTTPResponse(status: 401, body: Data("{\"err\":1}".utf8)) }
                return HTTPResponse(status: 200, body: Data("{\"ok\":true}".utf8))
            }
        }
        let t = CounterTransport()
        let client = HTTPClient(defaultBaseURL: URL(string: "https://example.test")!, transport: t) { SessionSnapshot() }
        let _: EmptyResponse = try await client.execute(Operations.EndpointHealthGet())
        let c = await t.count
        XCTAssertEqual(c, 2)
    }
}

final class CommandRunnerTests: XCTestCase {
    func testNavigateTabLocaleAndOptimisticCache() {
        let core = AppCore(mode: .mock, fixtures: URL(fileURLWithPath: "/tmp"))
        let runner = CommandRunner(core: core)
        XCTAssertTrue(runner.run(["navigate", "feed", "--param", "feedId=abc"]).ok)
        XCTAssertEqual(core.router.current.id, .feed)
        XCTAssertTrue(runner.run(["tab", "user"]).ok)
        XCTAssertEqual(core.router.selectedTab, .user)
        XCTAssertTrue(runner.run(["settings", "locale", "set", "ka"]).ok)
        XCTAssertEqual(core.l10n.locale, "ka")
        XCTAssertEqual(core.storage.get(StorageKey.appLocale), "ka")
        let key = QueryKey(operationId: "demo")
        core.store.setQueryData(key, ["n": 1])
        XCTAssertTrue(runner.run(["cache", "invalidate", "demo"]).ok)
        XCTAssertTrue(core.store.record(for: key)?.isStale ?? false)
        let feedKey = QueryKey(operationId: "getLocationFeedPaginated", path: ["feed_id": "f1"], infinite: true)
        core.store.setQueryData(feedKey, QueryStore.packPages([["items": [["id": "v1", "is_liked": false, "likes_count": 0]]]]))
        XCTAssertTrue(runner.run(["like", "v1"]).ok)
        XCTAssertEqual(QueryStore.pages(from: core.store.data(for: feedKey)).first?["items"]?[0]?["is_liked"]?.boolValue, true)
        XCTAssertEqual(QueryStore.pages(from: core.store.data(for: feedKey)).first?["items"]?[0]?["likes_count"]?.intValue, 1)
    }
}
