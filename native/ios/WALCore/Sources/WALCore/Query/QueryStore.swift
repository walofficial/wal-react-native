import Foundation

/// Headless port of the RN TanStack Query client (`retry: false`, `refetchOnWindowFocus: false`,
/// `structuralSharing: false`). Optimistic updates use `setQueryData`; invalidation is prefix match
/// on the hey-api key. Infinite queries store pages as a JSON array under `pages`.
public final class QueryStore: @unchecked Sendable {
    public struct Defaults: Sendable {
        public var staleTime: TimeInterval
        public var gcTime: TimeInterval
        public var retry: Int
        public init(staleTime: TimeInterval = 0, gcTime: TimeInterval = 5 * 60, retry: Int = 0) {
            self.staleTime = staleTime
            self.gcTime = gcTime
            self.retry = retry
        }
    }

    public let defaults: Defaults
    private var records: [QueryKey: QueryRecord] = [:]
    private let lock = NSLock()
    public private(set) var invalidations: [QueryKey] = []

    public init(defaults: Defaults = Defaults()) {
        self.defaults = defaults
    }

    public var snapshot: [QueryKey: QueryRecord] {
        lock.lock(); defer { lock.unlock() }
        return records
    }

    public func record(for key: QueryKey) -> QueryRecord? {
        lock.lock(); defer { lock.unlock() }
        return records[key]
    }

    public func data(for key: QueryKey) -> JSONValue? { record(for: key)?.data }

    public func setQueryData(_ key: QueryKey, _ data: JSONValue?) {
        lock.lock()
        var rec = records[key] ?? QueryRecord(key: key, staleTime: defaults.staleTime, gcTime: defaults.gcTime)
        rec.data = data
        rec.status = .success
        rec.updatedAt = Date()
        rec.errorMessage = nil
        records[key] = rec
        lock.unlock()
    }

    public func setQueryData(_ key: QueryKey, update: (JSONValue?) -> JSONValue?) {
        setQueryData(key, update(data(for: key)))
    }

    public func invalidate(_ prefix: QueryKey) {
        lock.lock()
        invalidations.append(prefix)
        for (key, var rec) in records where key.matchesPrefix(prefix) {
            rec.updatedAt = Date.distantPast
            records[key] = rec
        }
        lock.unlock()
    }

    public func invalidate(operationId: String) {
        invalidate(QueryKey(operationId: operationId))
    }

    public func remove(_ key: QueryKey) {
        lock.lock(); records[key] = nil; lock.unlock()
    }

    public func gc() {
        let now = Date()
        lock.lock()
        records = records.filter { _, rec in now.timeIntervalSince(rec.updatedAt) <= rec.gcTime }
        lock.unlock()
    }

    // MARK: Infinite pages

    public static func pages(from data: JSONValue?) -> [JSONValue] {
        data?["pages"]?.arrayValue ?? data?.arrayValue ?? []
    }

    public static func packPages(_ pages: [JSONValue]) -> JSONValue {
        .object(["pages": .array(pages), "pageParams": .array(pages.indices.map { .number(Double($0)) })])
    }

    /// Optimistic map over every page of an infinite query (RN `setQueryData` on the infinite cache).
    public func mapInfinitePages(_ key: QueryKey, transform: (JSONValue) -> JSONValue) {
        let pages = QueryStore.pages(from: data(for: key)).map(transform)
        setQueryData(key, QueryStore.packPages(pages))
    }

    public func prependInfinite(_ key: QueryKey, item: JSONValue) {
        var pages = QueryStore.pages(from: data(for: key))
        if pages.isEmpty {
            pages = [.object(["items": .array([item])])]
        } else if var first = pages[0].objectValue {
            var items = first["items"]?.arrayValue ?? first["data"]?.arrayValue ?? []
            items.insert(item, at: 0)
            first["items"] = .array(items)
            pages[0] = .object(first)
        } else if case .array(var items) = pages[0] {
            items.insert(item, at: 0)
            pages[0] = .array(items)
        }
        setQueryData(key, QueryStore.packPages(pages))
    }
}
