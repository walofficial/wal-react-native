import SwiftUI
import WALCore

/// UIKit-hosted navigation lands in CP4; this SwiftUI shell already uses the same RouterState
/// so walctl navigate/tab and the UI stay in lock-step.
struct AppShell: View {
    @ObservedObject var host: AppHost
    @StateObject private var theme = ThemeController()
    @StateObject private var toast = ToastController()

    var body: some View {
        ZStack {
            theme.color("background").ignoresSafeArea()
            content
            ToastHost(controller: toast)
            tabBar
        }
        .environment(\.walTheme, theme)
        .preferredColorScheme(theme.isDark ? .dark : .light)
    }

    @ViewBuilder private var content: some View {
        switch host.core.router.current.id {
        case .signIn, .index:
            SignInView(toast: toast, l10n: host.core.l10n) { phone in
                _ = CommandRunner(core: host.core).run(["auth", "send-otp", phone])
            }
        case .register:
            RegisterView { username, dob, gender in
                _ = CommandRunner(core: host.core).run(["register"])
                host.objectWillChange.send()
            }
        case .feed, .homeIndex:
            FeedListView(core: host.core)
        case .chatList:
            ChatListPlaceholder()
        case .userIndex, .settings, .profileSettings:
            SettingsPlaceholder(l10n: host.core.l10n)
        case .chatRoom:
            ChatRoomPlaceholder()
        default:
            RootView()
        }
    }

    private var tabBar: some View {
        VStack {
            Spacer()
            if showsTabs {
                HStack {
                    ForEach(Routes.tabs, id: \.id) { tab in
                        let selected = host.core.router.selectedTab == tab.id
                        Button {
                            host.select(tab.id)
                        } label: {
                            Image(systemName: IoniconMap.sfSymbol(for: selected ? tab.iconFocused : tab.iconUnfocused))
                                .font(.system(size: CGFloat(Tokens.Metrics.tabIconSize)))
                                .foregroundColor(Color(hex: selected
                                    ? (theme.isDark ? "#FFFFFF" : "#121212")
                                    : (theme.isDark ? "#777777" : "#999999")))
                                .scaleEffect(selected ? tab.focusedScale : 1)
                        }
                        .frame(maxWidth: .infinity)
                        .accessibilityIdentifier("tab.\(tab.id.rawValue)")
                    }
                }
                .padding(.top, 8)
                .padding(.bottom, 12)
                .background(theme.color("background"))
            }
        }
    }

    private var showsTabs: Bool {
        switch host.core.router.current.descriptor.stack {
        case .home, .user, .chatList, .homeOrUser: return true
        default: return false
        }
    }
}

final class AppHost: ObservableObject {
    let core: AppCore
    init(core: AppCore) { self.core = core }

    func select(_ tab: TabID) {
        core.router.selectTab(tab)
        objectWillChange.send()
    }
}

struct FeedListView: View {
    let core: AppCore
    @Environment(\.walTheme) private var theme
    var body: some View {
        let key = QueryKey(operationId: "getLocationFeedPaginated", infinite: true)
        let items = QueryStore.pages(from: core.store.data(for: key)).first?["items"]?.arrayValue ?? []
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    FeedItemView(post: item) {
                        _ = CommandRunner(core: core).run(["like", item["id"]?.stringValue ?? ""])
                    }
                }
            }
        }
        .background(theme.color("background"))
    }
}

struct FeedItemView: View {
    @Environment(\.walTheme) private var theme
    let post: JSONValue
    var onLike: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                UserAvatar(url: nil, size: .feedItem)
                VStack(alignment: .leading) {
                    Text(post["assignee_user"]?["username"]?.stringValue ?? "user")
                        .font(.system(size: 15, weight: .semibold))
                    Text(post["last_modified_date"]?.stringValue ?? "")
                        .font(.system(size: 15))
                        .foregroundColor(theme.color("feedItemSecondaryText"))
                }
            }
            Text(post["text_content"]?.stringValue ?? "")
                .font(.system(size: 16))
            HStack(spacing: 16) {
                Button(action: onLike) {
                    Image(systemName: (post["is_liked"]?.boolValue ?? false) ? "heart.fill" : "heart")
                        .font(.system(size: 27))
                        .foregroundColor((post["is_liked"]?.boolValue ?? false) ? Color(hex: "#ff3b30") : theme.color("feedItemText"))
                }
                .accessibilityIdentifier("feed.like")
                Image(systemName: IoniconMap.sfSymbol(for: "chatbubble-outline"))
                    .font(.system(size: 20))
            }
        }
        .padding(16)
        .background(theme.color("feedItemBackground"))
        .overlay(Rectangle().frame(height: 1).foregroundColor(theme.color("feedItemBorder")), alignment: .bottom)
    }
}

struct ChatListPlaceholder: View {
    @Environment(\.walTheme) private var theme
    var body: some View {
        VStack {
            Text("ჩათი").font(.system(size: 18, weight: .semibold))
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .background(theme.color("background"))
    }
}

struct ChatRoomPlaceholder: View {
    @Environment(\.walTheme) private var theme
    var body: some View {
        VStack(alignment: .trailing) {
            Text("hello")
                .font(.system(size: 16))
                .foregroundColor(.white)
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .background(theme.isDark ? Color(hex: "#107896") : Color(hex: "#3A76F0"))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            Spacer()
            HStack {
                Text("მესიჯი").foregroundColor(.secondary)
                Spacer()
                Circle().fill(theme.color("primary")).frame(width: 40, height: 40)
                    .overlay(Image(systemName: "arrow.up").foregroundColor(.white))
            }
            .padding(12)
            .background(theme.isDark ? Color(hex: "#1E1E1E") : Color(hex: "#e0e0e0"))
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
        .padding(16)
        .background(theme.color("background"))
    }
}

struct SettingsPlaceholder: View {
    @Environment(\.walTheme) private var theme
    let l10n: L10n
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            row(l10n.t(.settingsUserPreferences))
            row(l10n.t(.settingsAccount))
            row(l10n.t(.settingsBlockedUsers))
            Text(l10n.t(.commonLogout, [:])).foregroundColor(theme.color("accent")).padding(16)
        }
        .background(theme.color("background"))
    }
    private func row(_ title: String) -> some View {
        HStack { Text(title); Spacer(); Image(systemName: "chevron.right") }
            .padding(16)
            .foregroundColor(theme.color("text"))
    }
}
