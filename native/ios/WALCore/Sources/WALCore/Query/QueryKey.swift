import Foundation

/// Mirrors the hey-api / TanStack Query key shape used by the RN app:
/// `[{ _id, baseURL, path, query, body, _infinite }]`.
public struct QueryKey: Hashable, Sendable, Codable {
    public var operationId: String
    public var path: [String: String]
    public var query: [String: String]
    public var body: String?
    public var infinite: Bool

    public init(operationId: String, path: [String: String] = [:], query: [String: String] = [:], body: String? = nil, infinite: Bool = false) {
        self.operationId = operationId
        self.path = path
        self.query = query
        self.body = body
        self.infinite = infinite
    }

    public init<Op: APIOperation>(_ op: Op, infinite: Bool = false) {
        var path: [String: String] = [:]
        for (k, v) in op.path.pathValues { path[k] = v }
        var query: [String: String] = [:]
        for item in op.queryItems { if let v = item.value { query[item.name] = v } }
        self.init(operationId: Op.operationId, path: path, query: query, infinite: infinite)
    }

    /// Prefix match used by `invalidateQueries({ queryKey })` in the RN app.
    public func matchesPrefix(_ prefix: QueryKey) -> Bool {
        if operationId != prefix.operationId { return false }
        if prefix.infinite && !infinite { return false }
        for (k, v) in prefix.path where path[k] != v { return false }
        for (k, v) in prefix.query where query[k] != v { return false }
        if let b = prefix.body, body != b { return false }
        return true
    }
}

public enum QueryStatus: String, Hashable, Sendable {
    case idle, loading, success, error
}

public struct QueryRecord: Sendable {
    public var key: QueryKey
    public var status: QueryStatus
    public var data: JSONValue?
    public var errorMessage: String?
    public var updatedAt: Date
    public var staleTime: TimeInterval
    public var gcTime: TimeInterval

    public var isStale: Bool { Date().timeIntervalSince(updatedAt) > staleTime }

    public init(key: QueryKey, status: QueryStatus = .idle, data: JSONValue? = nil, errorMessage: String? = nil, updatedAt: Date = Date(), staleTime: TimeInterval = 0, gcTime: TimeInterval = 5 * 60) {
        self.key = key
        self.status = status
        self.data = data
        self.errorMessage = errorMessage
        self.updatedAt = updatedAt
        self.staleTime = staleTime
        self.gcTime = gcTime
    }
}
