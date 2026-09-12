import SwiftUI
import WALCore

enum AvatarSize {
    case comment, chatTopbar, feedItem, chatItem, story, profile
    var points: CGFloat {
        switch self {
        case .comment: return CGFloat(Tokens.Metrics.avatarComment)
        case .chatTopbar: return CGFloat(Tokens.Metrics.avatarChatTopbar)
        case .feedItem: return CGFloat(Tokens.Metrics.avatarFeedItem)
        case .chatItem: return CGFloat(Tokens.Metrics.avatarChatItem)
        case .story: return CGFloat(Tokens.Metrics.avatarStory)
        case .profile: return CGFloat(Tokens.Metrics.avatarProfile)
        }
    }
}

struct UserAvatar: View {
    @Environment(\.walTheme) private var theme
    let url: URL?
    var size: AvatarSize = .feedItem
    var online: Bool = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            RemoteImage(url: url)
                .scaledToFill()
                .frame(width: size.points, height: size.points)
                .clipShape(Circle())
                .overlay(Circle().stroke(theme.color("border"), lineWidth: CGFloat(Tokens.Metrics.avatarBorderWidth)))
                .padding(CGFloat(Tokens.Metrics.avatarPadding))
            if online {
                Circle()
                    .fill(Color(hex: "#22c55e"))
                    .frame(width: 12, height: 12)
                    .overlay(Circle().stroke(theme.color("background"), lineWidth: 2))
            }
        }
        .accessibilityIdentifier("wal.avatar")
    }
}

extension Color {
    init(hex: String) {
        let c = CSSColor.parse(hex) ?? CSSColor(red: 0, green: 0, blue: 0)
        self.init(.sRGB, red: c.red, green: c.green, blue: c.blue, opacity: c.alpha)
    }
}
