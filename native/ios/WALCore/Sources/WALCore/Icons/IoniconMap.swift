import Foundation

/// Ionicons name → SF Symbol used by the SwiftUI layer. Names must match the RN `Ionicons name=` strings.
public enum IoniconMap {
    public static let symbols: [String: String] = [
        "location": "location.fill",
        "location-outline": "location",
        "chatbubble": "bubble.left.fill",
        "chatbubble-outline": "bubble.left",
        "person-circle": "person.circle.fill",
        "chevron-back": "chevron.backward",
        "chevron-down": "chevron.down",
        "close": "xmark",
        "close-circle": "xmark.circle.fill",
        "add-circle": "plus.circle.fill",
        "settings-outline": "gearshape",
        "pencil": "pencil",
        "heart": "heart.fill",
        "heart-outline": "heart",
        "arrow-redo-outline": "arrowshape.turn.up.right",
        "arrow-up": "arrow.up",
        "checkmark": "checkmark",
        "play": "play.fill",
        "pause": "pause.fill",
        "volume-mute": "speaker.slash.fill",
        "volume-high": "speaker.wave.2.fill",
        "lock-closed-outline": "lock.fill",
        "alert-circle-outline": "exclamationmark.circle",
        "information-circle": "info.circle.fill",
        "language-outline": "globe",
        "navigate-outline": "location.north",
        "sparkles": "sparkles",
        "thumbs-up": "hand.thumbsup.fill",
        "thumbs-down": "hand.thumbsdown.fill",
        "copy-outline": "doc.on.doc",
        "share-outline": "square.and.arrow.up",
        "camera-reverse": "camera.rotate",
        "calendar-outline": "calendar",
        "people-circle-outline": "person.3",
        "logo-instagram": "camera",
        "logo-whatsapp": "phone",
        "chatbubbles-outline": "bubble.left.and.bubble.right",
        "add": "plus",
        "ellipsis-horizontal": "ellipsis",
        "search": "magnifyingglass",
        "image-outline": "photo",
        "images-outline": "photo.on.rectangle",
    ]

    public static func sfSymbol(for ionicon: String) -> String {
        symbols[ionicon] ?? "questionmark.circle"
    }
}
