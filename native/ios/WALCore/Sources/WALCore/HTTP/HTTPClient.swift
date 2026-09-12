import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct HTTPRequest: Hashable, Sendable {
    public var method: HTTPMethod
    public var path: String
    public var query: [URLQueryItem]
    public var headers: [String: String]
    public var body: Data?
    public var operationId: String

    public init(method: HTTPMethod, path: String, query: [URLQueryItem] = [], headers: [String: String] = [:], body: Data? = nil, operationId: String) {
        self.method = method
        self.path = path
        self.query = query
        self.headers = headers
        self.body = body
        self.operationId = operationId
    }
}

public struct HTTPResponse: Sendable {
    public var status: Int
    public var headers: [String: String]
    public var body: Data
    public init(status: Int, headers: [String: String] = [:], body: Data) {
        self.status = status
        self.headers = headers
        self.body = body
    }
}

public enum HTTPClientError: Error, Equatable {
    case invalidURL
    case transport(String)
    case status(Int, body: String)
    case decoding(String)
}

public protocol HTTPTransport: Sendable {
    func send(_ request: HTTPRequest, baseURL: URL) async throws -> HTTPResponse
}

/// Fixture transport: looks up `fixtures/api/<operationId>.json` (or `.status.json` envelope).
public struct FixtureTransport: HTTPTransport {
    public var root: URL
    public init(root: URL) { self.root = root }

    public func send(_ request: HTTPRequest, baseURL: URL) async throws -> HTTPResponse {
        let file = root.appendingPathComponent("api").appendingPathComponent("\(request.operationId).json")
        let data = try Data(contentsOf: file)
        return HTTPResponse(status: 200, body: data)
    }
}

public struct URLSessionTransport: HTTPTransport {
    public init() {}
    public func send(_ request: HTTPRequest, baseURL: URL) async throws -> HTTPResponse {
        var comps = URLComponents(url: baseURL.appendingPathComponent(request.path.hasPrefix("/") ? String(request.path.dropFirst()) : request.path), resolvingAgainstBaseURL: false)
        if !request.query.isEmpty { comps?.queryItems = request.query }
        guard let url = comps?.url else { throw HTTPClientError.invalidURL }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = request.method.rawValue
        urlRequest.httpBody = request.body
        for (k, v) in request.headers { urlRequest.setValue(v, forHTTPHeaderField: k) }
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        var headers: [String: String] = [:]
        (response as? HTTPURLResponse)?.allHeaderFields.forEach { if let k = $0.key as? String, let v = $0.value as? String { headers[k] = v } }
        return HTTPResponse(status: status, headers: headers, body: data)
    }
}

public struct SessionSnapshot: Sendable {
    public var accessToken: String?
    public var userId: String?
    public var locale: String
    public var latitude: String?
    public var longitude: String?
    public var apiBaseURLOverride: String?

    public init(accessToken: String? = nil, userId: String? = nil, locale: String = "en", latitude: String? = nil, longitude: String? = nil, apiBaseURLOverride: String? = nil) {
        self.accessToken = accessToken
        self.userId = userId
        self.locale = locale
        self.latitude = latitude
        self.longitude = longitude
        self.apiBaseURLOverride = apiBaseURLOverride
    }

    public var location: (lat: String, lon: String)? {
        guard let latitude, let longitude else { return nil }
        return (latitude, longitude)
    }
}

/// Builds requests the same way `lib/api/config.ts` does, minus the web-only `x-is-anonymous` leftover.
public final class HTTPClient: @unchecked Sendable {
    public var defaultBaseURL: URL
    public var transport: HTTPTransport
    public var session: () -> SessionSnapshot
    public private(set) var lastRequests: [HTTPRequest] = []
    private var retried: Set<String> = []
    private let lock = NSLock()

    public init(defaultBaseURL: URL, transport: HTTPTransport, session: @escaping () -> SessionSnapshot) {
        self.defaultBaseURL = defaultBaseURL
        self.transport = transport
        self.session = session
    }

    public var baseURL: URL {
        if let override = session().apiBaseURLOverride, let url = URL(string: override) { return url }
        return defaultBaseURL
    }

    public func executeJSON<Op: APIOperation>(_ op: Op) async throws -> JSONValue {
        let response = try await sendBuilt(try build(op))
        if response.body.isEmpty { return .null }
        return try JSONDecoder().decode(JSONValue.self, from: response.body)
    }

    /// Used when the generated operation is missing a body (e.g. `upsertFcm`).
    public func sendRaw(method: HTTPMethod, path: String, operationId: String, json: JSONValue? = nil) async throws -> JSONValue {
        let snap = session()
        var headers: [String: String] = ["Accept": "application/json", "Accept-Language": snap.locale]
        if let token = snap.accessToken { headers["Authorization"] = "Bearer \(token)" }
        var body: Data?
        if let json {
            body = try JSONEncoder().encode(json)
            headers["Content-Type"] = "application/json"
        }
        let request = HTTPRequest(method: method, path: path, headers: headers, body: body, operationId: operationId)
        let response = try await sendBuilt(request)
        if response.body.isEmpty { return .null }
        return (try? JSONDecoder().decode(JSONValue.self, from: response.body)) ?? .null
    }

    public func execute<Op: APIOperation>(_ op: Op) async throws -> Op.Response {
        let response = try await sendBuilt(try build(op))
        do {
            return try ResponseDecoder.decode(Op.Response.self, from: response.body)
        } catch {
            throw HTTPClientError.decoding(String(describing: error))
        }
    }

    private func sendBuilt(_ request: HTTPRequest) async throws -> HTTPResponse {
        lock.lock(); lastRequests.append(request); lock.unlock()
        var response = try await transport.send(request, baseURL: baseURL)
        if response.status == 401 {
            lock.lock(); let already = retried.contains(request.operationId); if !already { retried.insert(request.operationId) }; lock.unlock()
            if !already {
                response = try await transport.send(request, baseURL: baseURL)
            }
        }
        if response.status == 401 || response.status >= 400 {
            throw HTTPClientError.status(response.status, body: String(data: response.body, encoding: .utf8) ?? "")
        }
        return response
    }

    public func build<Op: APIOperation>(_ op: Op) throws -> HTTPRequest {
        let snap = session()
        var headers = op.headerValues
        headers["Accept"] = "application/json"
        headers["Accept-Language"] = snap.locale
        if let token = snap.accessToken { headers["Authorization"] = "Bearer \(token)" }
        if Op.pathTemplate == "/feeds/locations", let loc = snap.location {
            headers["x-user-location-latitude"] = loc.lat
            headers["x-user-location-longitude"] = loc.lon
        }
        var body: Data?
        switch Op.bodyEncoding {
        case .none:
            break
        case .json:
            if let b = op.body { body = try JSONEncoder().encode(b); headers["Content-Type"] = "application/json" }
        case .multipart:
            if let b = op.body as? MultipartEncodable {
                let form = MultipartFormData(parts: b.multipartParts())
                body = form.encoded()
                headers["Content-Type"] = form.contentType
            }
        }
        return HTTPRequest(method: Op.method, path: op.resolvedPath, query: op.queryItems, headers: headers, body: body, operationId: Op.operationId)
    }
}
