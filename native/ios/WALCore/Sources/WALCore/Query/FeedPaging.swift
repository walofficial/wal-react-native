import Foundation

/// Stable feed row used by location + profile lists. Identity is the post `id`, never the offset.
public struct FeedPostItem: Identifiable, Equatable, Sendable, Hashable {
    public let id: String
    public let raw: JSONValue

    public init(id: String, raw: JSONValue) {
        self.id = id
        self.raw = raw
    }

    public static func == (lhs: FeedPostItem, rhs: FeedPostItem) -> Bool {
        lhs.id == rhs.id
            && lhs.raw["is_liked"] == rhs.raw["is_liked"]
            && lhs.raw["text_content"] == rhs.raw["text_content"]
            && lhs.raw["likes_count"] == rhs.raw["likes_count"]
            && lhs.raw["is_live"] == rhs.raw["is_live"]
            && lhs.raw["image_gallery_with_dims"] == rhs.raw["image_gallery_with_dims"]
    }
}

public enum FeedPaging {
    /// RN `useLocationFeedPaginated` flattens `data.pages`. Pages may be raw arrays or `{items|data:[]}`.
    public static func flatten(_ data: JSONValue?) -> [FeedPostItem] {
        QueryStore.pages(from: data).flatMap { page in
            page.arrayValue ?? page["items"]?.arrayValue ?? page["data"]?.arrayValue ?? []
        }.compactMap { raw in
            guard let id = raw["id"]?.stringValue, !id.isEmpty else { return nil }
            return FeedPostItem(id: id, raw: raw)
        }
    }

    public static func appendPage(_ existing: JSONValue?, page: JSONValue) -> JSONValue {
        var pages = QueryStore.pages(from: existing)
        pages.append(normalizePage(page))
        return QueryStore.packPages(pages)
    }

    public static func replaceFirstPage(_ page: JSONValue) -> JSONValue {
        QueryStore.packPages([normalizePage(page)])
    }

    public static func normalizePage(_ page: JSONValue) -> JSONValue {
        if page.arrayValue != nil { return page }
        if page["items"]?.arrayValue != nil { return page }
        if let data = page["data"]?.arrayValue { return .object(["items": .array(data)]) }
        return page
    }

    public static func hasMore(lastPage: JSONValue?, pageSize: Int = Tokens.Metrics.feedPageSize) -> Bool {
        let items = lastPage?.arrayValue ?? lastPage?["items"]?.arrayValue ?? lastPage?["data"]?.arrayValue ?? []
        return items.count >= pageSize
    }
}

extension JSONValue {
    public static func fromJSONData(_ data: Data) -> JSONValue? {
        try? JSONDecoder().decode(JSONValue.self, from: data)
    }

    public func jsonData() -> Data? {
        try? JSONEncoder().encode(self)
    }
}
