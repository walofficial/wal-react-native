import SwiftUI
import WALCore

@MainActor
final class FeedListModel: ObservableObject {
    @Published var posts: [FeedPostItem] = []
    @Published var isRefreshing = false
    @Published var isFetchingNext = false
    @Published var hasMore = true
    private var page = 1
    private var feedId: String?
    private weak var host: AppHost?

    func bind(host: AppHost, feedId: String?) {
        self.host = host
        self.feedId = feedId
        reloadFromStore()
    }

    var queryKey: QueryKey {
        QueryKey(
            operationId: "getLocationFeedPaginated",
            path: feedId.map { ["feed_id": $0] } ?? [:],
            infinite: true
        )
    }

    func reloadFromStore() {
        guard let host else { return }
        posts = FeedPaging.flatten(host.core.store.data(for: queryKey))
    }

    func refresh() async {
        guard let host, let feedId, !feedId.isEmpty else { return }
        isRefreshing = true
        defer { isRefreshing = false }
        page = 1
        do {
            let json = try await host.core.http.executeJSON(Operations.GetLocationFeedPaginated(
                path: .init(feedId: feedId),
                query: .init(page: 1, pageSize: Double(Tokens.Metrics.feedPageSize))
            ))
            host.core.store.setQueryData(queryKey, FeedPaging.replaceFirstPage(json))
            hasMore = FeedPaging.hasMore(lastPage: json)
            reloadFromStore()
        } catch {
            if host.core.mode == .mock { seedMock() }
        }
    }

    func fetchNextIfNeeded(current: FeedPostItem) {
        guard hasMore, !isFetchingNext, posts.suffix(2).contains(where: { $0.id == current.id }) else { return }
        Task { await fetchNext() }
    }

    func fetchNext() async {
        guard let host, let feedId, !feedId.isEmpty, hasMore, !isFetchingNext else { return }
        isFetchingNext = true
        defer { isFetchingNext = false }
        let next = page + 1
        do {
            let json = try await host.core.http.executeJSON(Operations.GetLocationFeedPaginated(
                path: .init(feedId: feedId),
                query: .init(page: Double(next), pageSize: Double(Tokens.Metrics.feedPageSize))
            ))
            let existing = host.core.store.data(for: queryKey)
            host.core.store.setQueryData(queryKey, FeedPaging.appendPage(existing, page: json))
            page = next
            hasMore = FeedPaging.hasMore(lastPage: json)
            reloadFromStore()
        } catch {
            hasMore = false
        }
    }

    private func seedMock() {
        let items: [JSONValue] = (0..<8).map { i in
            .object([
                "id": .string("p\(i)"),
                "text_content": .string("Post \(i)"),
                "is_liked": .bool(false),
                "likes_count": .number(0),
                "last_modified_date": .string("now"),
                "assignee_user": .object(["username": .string("user\(i)"), "id": .string("u\(i)")]),
            ])
        }
        host?.core.store.setQueryData(queryKey, FeedPaging.replaceFirstPage(.array(items)))
        reloadFromStore()
    }
}

struct FeedListView: View {
    @ObservedObject var host: AppHost
    var feedId: String?
    @Environment(\.walTheme) private var theme
    @StateObject private var model = FeedListModel()

    var body: some View {
        VStack(spacing: 0) {
            feedHeader
            if model.posts.isEmpty && !model.isRefreshing {
                empty
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(model.posts) { post in
                            FeedItemView(post: post.raw, onLike: {
                                host.like(verificationId: post.id, undo: post.raw["is_liked"]?.boolValue ?? false)
                                model.reloadFromStore()
                            }, onComment: {
                                host.navigate(.verification(verificationId: post.id))
                            }, onProfile: {
                                if let uid = post.raw["assignee_user"]?["id"]?.stringValue {
                                    host.navigate(.profile(userId: uid))
                                }
                            })
                            .equatable()
                            .onAppear { model.fetchNextIfNeeded(current: post) }
                        }
                        if model.isFetchingNext {
                            ProgressView().padding()
                        }
                    }
                }
                .refreshable { await model.refresh() }
            }
        }
        .background(theme.color("background"))
        .overlay(alignment: .bottomTrailing) { fab }
        .onAppear {
            model.bind(host: host, feedId: resolvedFeedId)
            if model.posts.isEmpty { Task { await model.refresh() } }
        }
        .onChange(of: host.revision) { _ in model.reloadFromStore() }
    }

    private var resolvedFeedId: String? {
        if let feedId, !feedId.isEmpty { return feedId }
        return host.core.currentUser?["preferred_news_feed_id"]?.stringValue
            ?? host.core.storage.get(StorageKey.preferredFeedId)
    }

    private var feedHeader: some View {
        HStack {
            Button { host.navigate(.locations) } label: {
                Image(systemName: IoniconMap.sfSymbol(for: "location"))
                    .font(.system(size: 22))
            }
            Spacer()
            Text(host.core.l10n.t(.commonLocations))
                .font(.system(size: 17, weight: .semibold))
            Spacer()
            Button { host.navigate(.createPost(feedId: resolvedFeedId ?? "")) } label: {
                Image(systemName: "square.and.pencil")
                    .font(.system(size: 20))
            }
        }
        .foregroundColor(theme.color("text"))
        .padding(.horizontal, 16)
        .frame(height: 52)
    }

    private var empty: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "text.alignleft").font(.system(size: 40))
            Text(host.core.l10n.t(.commonNoPostsFound))
            Spacer()
        }
        .foregroundColor(theme.color("feedItemSecondaryText"))
        .frame(maxWidth: .infinity)
    }

    private var fab: some View {
        Button { host.navigate(.record(feedId: resolvedFeedId)) } label: {
            Image(systemName: "camera.fill")
                .font(.system(size: CGFloat(Tokens.Metrics.fabIconSize)))
                .foregroundColor(.white)
                .frame(width: CGFloat(Tokens.Metrics.fabSize), height: CGFloat(Tokens.Metrics.fabSize))
                .background(theme.color("primary"))
                .clipShape(Circle())
        }
        .padding(.trailing, CGFloat(Tokens.Metrics.fabPaddingH))
        .padding(.bottom, CGFloat(Tokens.Metrics.fabBottom) + 56)
        .accessibilityIdentifier("feed.fab")
    }
}

struct FeedItemView: View, Equatable {
    @Environment(\.walTheme) private var theme
    let post: JSONValue
    var onLike: () -> Void
    var onComment: () -> Void = {}
    var onProfile: () -> Void = {}

    static func == (lhs: FeedItemView, rhs: FeedItemView) -> Bool {
        lhs.post["id"] == rhs.post["id"]
            && lhs.post["is_liked"] == rhs.post["is_liked"]
            && lhs.post["text_content"] == rhs.post["text_content"]
            && lhs.post["image_gallery_with_dims"] == rhs.post["image_gallery_with_dims"]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: onProfile) {
                HStack(spacing: 8) {
                    UserAvatar(url: avatarURL, size: .feedItem)
                    VStack(alignment: .leading) {
                        Text(post["assignee_user"]?["username"]?.stringValue ?? "user")
                            .font(.system(size: 15, weight: .semibold))
                        Text(post["last_modified_date"]?.stringValue ?? "")
                            .font(.system(size: 15))
                            .foregroundColor(theme.color("feedItemSecondaryText"))
                    }
                    Spacer()
                }
            }
            .buttonStyle(.plain)
            Text(post["text_content"]?.stringValue ?? "")
                .font(.system(size: 16))
                .foregroundColor(theme.color("feedItemText"))
            media
            HStack(spacing: 16) {
                Button(action: onLike) {
                    Image(systemName: liked ? "heart.fill" : "heart")
                        .font(.system(size: 27))
                        .foregroundColor(liked ? Color(hex: "#ff3b30") : theme.color("feedItemText"))
                        .scaleEffect(liked ? 1.05 : 1)
                }
                .accessibilityIdentifier("feed.like")
                Button(action: onComment) {
                    Image(systemName: IoniconMap.sfSymbol(for: "chatbubble-outline"))
                        .font(.system(size: 20))
                        .foregroundColor(theme.color("feedItemText"))
                }
            }
        }
        .padding(16)
        .background(theme.color("feedItemBackground"))
        .overlay(Rectangle().frame(height: 1).foregroundColor(theme.color("feedItemBorder")), alignment: .bottom)
    }

    private var liked: Bool { post["is_liked"]?.boolValue ?? false }

    private var avatarURL: URL? {
        let photos = post["assignee_user"]?["photos"]?.arrayValue
        if let first = photos?.first?["image_url"]?.arrayValue?.first?.stringValue { return URL(string: first) }
        return post["assignee_user"]?["photos"]?.arrayValue?.first?["image_url"]?.stringValue.flatMap(URL.init(string:))
    }

    @ViewBuilder private var media: some View {
        if let gallery = post["image_gallery_with_dims"]?.arrayValue, let first = gallery.first,
           let urlStr = first["url"]?.stringValue, let url = URL(string: urlStr) {
            let w = first["width"]?.doubleValue ?? 1
            let h = first["height"]?.doubleValue ?? 1
            let ratio = w > 0 && h > 0 ? w / h : 1
            RemoteImage(url: url, targetSize: CGSize(width: 400, height: 400 / max(ratio, 0.3)))
                .aspectRatio(CGFloat(ratio), contentMode: .fit)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }
}
