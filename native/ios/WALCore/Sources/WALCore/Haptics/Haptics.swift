import Foundation

/// Port of `lib/haptics.ts`. UIKit implementation lives in the app target; the core records events
/// so walctl and tests can assert them.
public enum HapticEvent: String, Hashable, Sendable {
    case light, medium, success, error
}

public protocol HapticPlaying: Sendable {
    func play(_ event: HapticEvent)
}

public final class RecordingHaptics: HapticPlaying, @unchecked Sendable {
    public private(set) var events: [HapticEvent] = []
    private let lock = NSLock()
    public init() {}
    public func play(_ event: HapticEvent) {
        lock.lock(); events.append(event); lock.unlock()
    }
}
