import Foundation

/// Parsed CSS colour as used in `lib/theme.tsx` and `tokens.json`: `#rgb`, `#rrggbb`, `#rrggbbaa`,
/// `rgba(r,g,b,a)`, `rgb(r,g,b)`. Pure data so the Kotlin core can share the same tests.
public struct CSSColor: Hashable, Sendable {
    public var red: Double
    public var green: Double
    public var blue: Double
    public var alpha: Double

    public init(red: Double, green: Double, blue: Double, alpha: Double = 1) {
        self.red = red
        self.green = green
        self.blue = blue
        self.alpha = alpha
    }

    public static func parse(_ css: String) -> CSSColor? {
        let s = css.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { return parseHex(String(s.dropFirst())) }
        if s.lowercased().hasPrefix("rgba(") { return parseFunc(s, name: "rgba") }
        if s.lowercased().hasPrefix("rgb(") { return parseFunc(s, name: "rgb") }
        return nil
    }

    private static func parseHex(_ hex: String) -> CSSColor? {
        let h = hex.lowercased()
        func nibble(_ c: Character) -> Int? {
            guard let a = c.asciiValue else { return nil }
            switch a {
            case 48...57: return Int(a - 48)
            case 97...102: return Int(a - 87)
            default: return nil
            }
        }
        func byte(_ chars: [Character], i: Int) -> Double? {
            guard let hi = nibble(chars[i]), let lo = nibble(chars[i + 1]) else { return nil }
            return Double(hi * 16 + lo) / 255
        }
        let chars = Array(h)
        switch chars.count {
        case 3, 4:
            guard let r = nibble(chars[0]), let g = nibble(chars[1]), let b = nibble(chars[2]) else { return nil }
            let a = chars.count == 4 ? nibble(chars[3]) : 15
            guard let a else { return nil }
            return CSSColor(red: Double(r) / 15, green: Double(g) / 15, blue: Double(b) / 15, alpha: Double(a) / 15)
        case 6, 8:
            guard let r = byte(chars, i: 0), let g = byte(chars, i: 2), let b = byte(chars, i: 4) else { return nil }
            let a = chars.count == 8 ? byte(chars, i: 6) : 1
            guard let a else { return nil }
            return CSSColor(red: r, green: g, blue: b, alpha: a)
        default:
            return nil
        }
    }

    private static func parseFunc(_ s: String, name: String) -> CSSColor? {
        guard let open = s.firstIndex(of: "("), let close = s.lastIndex(of: ")") else { return nil }
        let inner = s[s.index(after: open)..<close]
        let parts = inner.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        guard parts.count >= 3, let r = Double(parts[0]), let g = Double(parts[1]), let b = Double(parts[2]) else { return nil }
        let a = parts.count >= 4 ? Double(parts[3]) ?? 1 : 1
        return CSSColor(red: r / 255, green: g / 255, blue: b / 255, alpha: a)
    }

    public var hexRGB: String {
        func h(_ v: Double) -> String { String(format: "%02x", Int((v * 255).rounded())) }
        return "#\(h(red))\(h(green))\(h(blue))"
    }
}
