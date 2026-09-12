import SwiftUI
import WALCore

struct CommentsView: View {
    @ObservedObject var host: AppHost
    let verificationId: String
    var focusComment: Bool = false
    var title: String = "ფოსტი"
    @Environment(\.walTheme) private var theme
    @State private var post: JSONValue?
    @State private var comments: [JSONValue] = []
    @State private var draft = ""

    var body: some View {
        VStack(spacing: 0) {
            SimpleHeader(title: title, onBack: { host.back() })
            ScrollView {
                VStack(spacing: 0) {
                    if let post {
                        FeedItemView(post: post, onLike: {
                            host.like(verificationId: verificationId, undo: post["is_liked"]?.boolValue ?? false)
                        })
                    }
                    if comments.isEmpty {
                        Text(host.core.l10n.t(.commonBeFirstToComment))
                            .foregroundColor(theme.color("feedItemSecondaryText"))
                            .padding()
                    }
                    VStack(spacing: 0) {
                        ForEach(Array(comments.enumerated()), id: \.offset) { _, item in
                            commentRow(item)
                        }
                    }
                }
            }
            HStack {
                TextField(host.core.l10n.t(.commonCommentPlaceholder), text: $draft)
                    .textFieldStyle(.plain)
                Button { Task { await send() } } label: {
                    Image(systemName: "arrow.up.circle.fill").font(.system(size: 28))
                }
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding(12)
            .background(theme.color("commentInputBackground"))
        }
        .background(theme.color("background"))
        .task { await load() }
    }

    private func commentRow(_ item: JSONValue) -> some View {
        let comment = item["comment"] ?? item
        return HStack(alignment: .top, spacing: 8) {
            UserAvatar(url: nil, size: .comment)
            VStack(alignment: .leading, spacing: 4) {
                Text(comment["author"]?["username"]?.stringValue ?? comment["author_id"]?.stringValue ?? "")
                    .font(.system(size: 14, weight: .semibold))
                Text(comment["content"]?.stringValue ?? "")
                    .font(.system(size: 15))
            }
            Spacer()
        }
        .padding(12)
        .overlay(Rectangle().frame(height: 1).foregroundColor(theme.color("commentBorder")), alignment: .bottom)
    }

    private func load() async {
        post = try? await host.core.http.executeJSON(Operations.GetUserVerification(query: .init(verificationId: verificationId)))
        if let json = try? await host.core.http.executeJSON(Operations.GetVerificationComments(path: .init(verificationId: verificationId))) {
            comments = json["comments"]?.arrayValue ?? []
        }
    }

    private func send() async {
        let text = String(draft.prefix(Tokens.Metrics.commentMaxLength))
        guard !text.isEmpty else { return }
        draft = ""
        _ = try? await host.core.http.execute(Operations.CreateCommentCommentsPost(body: CreateCommentRequest(
            content: text,
            verificationId: verificationId
        )))
        await load()
    }
}
