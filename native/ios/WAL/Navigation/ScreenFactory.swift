import SwiftUI
import WALCore

enum ScreenFactory {
    @ViewBuilder
    static func view(for route: Route, host: AppHost) -> some View {
        switch route {
        case .index:
            RootView()
        case .signIn:
            SignInView(host: host)
        case .register:
            RegisterView(host: host)
        case .homeIndex, .feed:
            FeedListView(host: host, feedId: route.params["feedId"])
        case .locations:
            LocationsView(host: host)
        case .profile(let userId):
            ProfileView(host: host, userId: userId, isOwn: false)
        case .profilePicture(_, let imageUrl):
            ProfilePictureView(imageURL: imageUrl.flatMap(URL.init(string:)))
        case .verification(let id, let focus):
            CommentsView(host: host, verificationId: id, focusComment: focus ?? false)
        case .status(let id, let focus):
            CommentsView(host: host, verificationId: id, focusComment: focus ?? false, title: "ფოსტი")
        case .createPost(let feedId, _, _, _, let shared, let images):
            CreatePostView(host: host, feedId: feedId, sharedContent: shared, sharedImages: images)
        case .createPostShareIntent:
            CreatePostView(
                host: host,
                feedId: host.core.currentUser?["preferred_news_feed_id"]?.stringValue ?? "",
                sharedContent: nil,
                sharedImages: nil
            )
        case .factChecks:
            FactChecksView(host: host)
        case .chatList:
            ChatListView(host: host)
        case .userIndex:
            ProfileView(host: host, userId: host.core.sessionUserId ?? host.core.currentUser?["id"]?.stringValue ?? "", isOwn: true)
        case .settings:
            SettingsHubView(host: host)
        case .profileSettings:
            AccountSettingsView(host: host)
        case .userPreferences:
            UserPreferencesView(host: host)
        case .blockedUsers:
            BlockedUsersView(host: host)
        case .chatRoom(let roomId):
            ChatRoomView(host: host, roomId: roomId)
        case .chatProfile(_, let userId):
            ProfileView(host: host, userId: userId, isOwn: false)
        case .chatProfilePicture(_, let imageUrl):
            ProfilePictureView(imageURL: imageUrl.flatMap(URL.init(string:)))
        case .record(let feedId, let chatMode, let roomId, let recipientId):
            RecordView(host: host, feedId: feedId, chatMode: chatMode ?? false, roomId: roomId, recipientId: recipientId)
        case .mediaPage(let feedId, let path, let type, _, let chatMode, let roomId, let recipientId):
            MediaReviewView(host: host, feedId: feedId, path: path, type: type, chatMode: chatMode ?? false, roomId: roomId, recipientId: recipientId)
        case .createSpace, .scheduleSpace, .livestream:
            OutOfScopeView(title: host.core.l10n.t(.commonLiveStreamUnavailable))
        case .profileByUsername:
            RootView()
        case .notFound:
            NotFoundView(host: host)
        }
    }
}

struct OutOfScopeView: View {
    @Environment(\.walTheme) private var theme
    let title: String
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "antenna.radiowaves.left.and.right.slash")
                .font(.system(size: 36))
            Text(title).multilineTextAlignment(.center)
        }
        .foregroundColor(theme.color("text"))
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.color("background"))
    }
}

struct NotFoundView: View {
    @ObservedObject var host: AppHost
    var body: some View {
        ScreenScaffold(title: "Oops!", onBack: { host.back() }) {
            Text("404")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct FactChecksView: View {
    @ObservedObject var host: AppHost
    var body: some View {
        ScreenScaffold(title: host.core.l10n.t(.commonHowFactCheckingWorks), onBack: { host.back() }) {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text(host.core.l10n.t(.commonOverview)).font(.headline)
                    Text(host.core.l10n.t(.commonOverviewDescription))
                    Text(host.core.l10n.t(.commonHowWeScore)).font(.headline)
                    Text(host.core.l10n.t(.commonHowWeScoreDescription1))
                    Text(host.core.l10n.t(.commonHowWeScoreDescription2))
                }
                .padding(16)
            }
        }
    }
}
