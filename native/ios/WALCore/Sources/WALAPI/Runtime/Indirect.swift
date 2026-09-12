import Foundation

/// Heap-boxes a property so a value type can reference itself (e.g. `Comment.parent: Comment?`).
/// Encodes/decodes transparently; missing keys decode as `nil` for optional wrapped values.
@propertyWrapper
public struct Indirect<Wrapped> {
    private final class Box { let value: Wrapped; init(_ value: Wrapped) { self.value = value } }
    private var box: Box

    public init(wrappedValue: Wrapped) { box = Box(wrappedValue) }

    public var wrappedValue: Wrapped {
        get { box.value }
        set { box = Box(newValue) }
    }
}

extension Indirect: Encodable where Wrapped: Encodable {
    public func encode(to encoder: Encoder) throws { try wrappedValue.encode(to: encoder) }
}

extension Indirect: Decodable where Wrapped: Decodable {
    public init(from decoder: Decoder) throws { self.init(wrappedValue: try Wrapped(from: decoder)) }
}

extension Indirect: Equatable where Wrapped: Equatable {
    public static func == (lhs: Indirect, rhs: Indirect) -> Bool { lhs.wrappedValue == rhs.wrappedValue }
}

extension Indirect: Hashable where Wrapped: Hashable {
    public func hash(into hasher: inout Hasher) { hasher.combine(wrappedValue) }
}

extension Indirect: @unchecked Sendable where Wrapped: Sendable {}

/// Synthesised Codable calls these overloads for `@Indirect var x: T?`, so a missing or null key yields nil
/// instead of a decoding error, matching plain optional behaviour.
public extension KeyedDecodingContainer {
    func decode<T: Decodable>(_ type: Indirect<T?>.Type, forKey key: Key) throws -> Indirect<T?> {
        if !contains(key) || (try? decodeNil(forKey: key)) == true { return Indirect(wrappedValue: nil) }
        return Indirect(wrappedValue: try decode(T.self, forKey: key))
    }
}

public extension KeyedEncodingContainer {
    mutating func encode<T: Encodable>(_ value: Indirect<T?>, forKey key: Key) throws {
        if let v = value.wrappedValue { try encode(v, forKey: key) }
    }
}
