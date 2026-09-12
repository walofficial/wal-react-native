import UIKit
import WALCore

final class UIKitHaptics: HapticPlaying {
    func play(_ event: HapticEvent) {
        DispatchQueue.main.async {
            switch event {
            case .light:
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            case .medium:
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            case .success:
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            case .error:
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            }
        }
    }
}
