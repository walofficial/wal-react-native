import Foundation

/// A binary attachment for `multipart/form-data` bodies. Mirrors the `{ uri, name, type }` file objects
/// the RN app appends to FormData.
public struct MultipartFile: Codable, Hashable, Sendable {
    public var data: Data
    public var filename: String
    public var mimeType: String

    public init(data: Data, filename: String, mimeType: String) {
        self.data = data
        self.filename = filename
        self.mimeType = mimeType
    }

    public init(contentsOf url: URL, mimeType: String, filename: String? = nil) throws {
        self.data = try Data(contentsOf: url)
        self.filename = filename ?? url.lastPathComponent
        self.mimeType = mimeType
    }
}

public enum MultipartPart: Hashable, Sendable {
    case text(name: String, value: String)
    case file(name: String, file: MultipartFile)

    public var name: String {
        switch self {
        case .text(let name, _), .file(let name, _): return name
        }
    }
}

public protocol MultipartEncodable {
    func multipartParts() -> [MultipartPart]
}

/// Converts any generated body property into the string FormData would carry.
public enum MultipartText {
    public static func scalar<T: ParameterRepresentable>(_ value: T) -> String { ParameterValue.string(value) }
    public static func json<T: Encodable>(_ value: T) -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        guard let data = try? encoder.encode(value), let s = String(data: data, encoding: .utf8) else { return "" }
        return s
    }
}

/// Serialises parts into a `multipart/form-data` body, RFC 7578 style (same layout React Native's FormData produces).
public struct MultipartFormData: Sendable {
    public let boundary: String
    public let parts: [MultipartPart]

    public init(parts: [MultipartPart], boundary: String = "----WALBoundary\(UUID().uuidString)") {
        self.parts = parts
        self.boundary = boundary
    }

    public var contentType: String { "multipart/form-data; boundary=\(boundary)" }

    public func encoded() -> Data {
        var body = Data()
        func append(_ s: String) { body.append(Data(s.utf8)) }
        for part in parts {
            append("--\(boundary)\r\n")
            switch part {
            case .text(let name, let value):
                append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n")
                append(value)
            case .file(let name, let file):
                append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(file.filename)\"\r\n")
                append("Content-Type: \(file.mimeType)\r\n\r\n")
                body.append(file.data)
            }
            append("\r\n")
        }
        append("--\(boundary)--\r\n")
        return body
    }
}
