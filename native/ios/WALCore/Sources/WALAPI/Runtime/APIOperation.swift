import Foundation

public enum HTTPMethod: String, Hashable, Sendable {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
    case head = "HEAD"
    case options = "OPTIONS"
}

public enum BodyEncoding: Hashable, Sendable {
    /// No request body.
    case none
    /// `application/json`
    case json
    /// `multipart/form-data`; the body type conforms to `MultipartEncodable`.
    case multipart
}

/// A fully described HTTP operation. Generated structs conform to this; the HTTP client in WALCore
/// turns them into URLRequests. Mirrors the hey-api `Options<XData>` shape used by the RN app.
public protocol APIOperation: Sendable {
    associatedtype Path: PathParameters
    associatedtype Query: QueryParameters
    associatedtype Headers: HeaderParameters
    associatedtype Body: Encodable & Sendable
    associatedtype Response: Decodable & Sendable

    static var operationId: String { get }
    static var method: HTTPMethod { get }
    static var pathTemplate: String { get }
    static var bodyEncoding: BodyEncoding { get }

    var path: Path { get }
    var query: Query { get }
    var headers: Headers { get }
    var body: Body? { get }
}

public extension APIOperation {
    /// Path template with `{param}` placeholders substituted (percent-encoded per path segment).
    var resolvedPath: String {
        var out = Self.pathTemplate
        for (name, value) in path.pathValues {
            let encoded = value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed.subtracting(CharacterSet(charactersIn: "/"))) ?? value
            out = out.replacingOccurrences(of: "{\(name)}", with: encoded)
        }
        return out
    }

    var queryItems: [URLQueryItem] { query.queryItems }
    var headerValues: [String: String] { headers.headerValues }
}

public protocol PathParameters: Encodable, Hashable, Sendable {
    var pathValues: [String: String] { get }
}

public protocol QueryParameters: Encodable, Hashable, Sendable {
    var queryItems: [URLQueryItem] { get }
}

public protocol HeaderParameters: Encodable, Hashable, Sendable {
    var headerValues: [String: String] { get }
}

/// Placeholder for operations without path/query/header parameters.
public struct NoParameters: PathParameters, QueryParameters, HeaderParameters {
    public init() {}
    public var pathValues: [String: String] { [:] }
    public var queryItems: [URLQueryItem] { [] }
    public var headerValues: [String: String] { [:] }
}

/// Placeholder body type for operations without a request body. Never encoded.
public struct NoBody: Encodable, Hashable, Sendable {
    public init() {}
}

/// Response placeholder for operations whose 200 has no documented schema. Accepts any payload
/// (including an empty body) and keeps the raw JSON when there is one.
public struct EmptyResponse: Decodable, Hashable, Sendable {
    public var raw: JSONValue?
    public init(raw: JSONValue? = nil) { self.raw = raw }
    public init(from decoder: Decoder) throws {
        raw = try? JSONValue(from: decoder)
    }
}

// MARK: - Parameter serialisation

/// A value that can appear in a query string, header or path segment.
public protocol ParameterRepresentable {
    var parameterStrings: [String] { get }
}

extension String: ParameterRepresentable { public var parameterStrings: [String] { [self] } }
extension Int: ParameterRepresentable { public var parameterStrings: [String] { [String(self)] } }
extension Double: ParameterRepresentable {
    public var parameterStrings: [String] { [self.rounded() == self && abs(self) < 1e15 ? String(Int(self)) : String(self)] }
}
extension Bool: ParameterRepresentable { public var parameterStrings: [String] { [self ? "true" : "false"] } }
extension Array: ParameterRepresentable where Element: ParameterRepresentable {
    public var parameterStrings: [String] { flatMap { $0.parameterStrings } }
}
extension Optional: ParameterRepresentable where Wrapped: ParameterRepresentable {
    public var parameterStrings: [String] { self?.parameterStrings ?? [] }
}
extension JSONValue: ParameterRepresentable {
    public var parameterStrings: [String] {
        switch self {
        case .string(let s): return [s]
        case .number(let n): return n.parameterStrings
        case .bool(let b): return b.parameterStrings
        case .null: return []
        case .array(let a): return a.flatMap { $0.parameterStrings }
        case .object:
            let data = try? JSONEncoder().encode(self)
            return [data.flatMap { String(data: $0, encoding: .utf8) } ?? "{}"]
        }
    }
}

/// Generated code calls these; extensible enums (RawRepresentable with String raw values) route through here too.
public enum ParameterValue {
    public static func string<T: ParameterRepresentable>(_ value: T) -> String {
        value.parameterStrings.joined(separator: ",")
    }
    public static func string<T: RawRepresentable>(_ value: T) -> String where T.RawValue == String {
        value.rawValue
    }
    public static func string<T: RawRepresentable>(_ value: T?) -> String where T.RawValue == String {
        value?.rawValue ?? ""
    }

    public static func queryItems<T: ParameterRepresentable>(_ name: String, _ value: T) -> [URLQueryItem] {
        value.parameterStrings.map { URLQueryItem(name: name, value: $0) }
    }
    public static func queryItems<T: RawRepresentable>(_ name: String, _ value: T) -> [URLQueryItem] where T.RawValue == String {
        [URLQueryItem(name: name, value: value.rawValue)]
    }
    public static func queryItems<T: RawRepresentable>(_ name: String, _ value: T?) -> [URLQueryItem] where T.RawValue == String {
        value.map { [URLQueryItem(name: name, value: $0.rawValue)] } ?? []
    }
    public static func queryItems<T: RawRepresentable>(_ name: String, _ value: [T]) -> [URLQueryItem] where T.RawValue == String {
        value.map { URLQueryItem(name: name, value: $0.rawValue) }
    }
    public static func queryItems<T: RawRepresentable>(_ name: String, _ value: [T]?) -> [URLQueryItem] where T.RawValue == String {
        value?.map { URLQueryItem(name: name, value: $0.rawValue) } ?? []
    }

    public static func assign<T: ParameterRepresentable>(_ values: inout [String: String], _ name: String, _ value: T) {
        let strings = value.parameterStrings
        if !strings.isEmpty { values[name] = strings.joined(separator: ",") }
    }
    public static func assign<T: RawRepresentable>(_ values: inout [String: String], _ name: String, _ value: T) where T.RawValue == String {
        values[name] = value.rawValue
    }
    public static func assign<T: RawRepresentable>(_ values: inout [String: String], _ name: String, _ value: T?) where T.RawValue == String {
        if let v = value { values[name] = v.rawValue }
    }
}
