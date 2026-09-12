import SwiftUI
import WALCore

struct ChatBubbleItem: Identifiable, Equatable {
    let id: String
    let text: String
    let sent: Bool
    let imageURL: URL?
    let imageWidth: CGFloat
    let imageHeight: CGFloat
    let time: String
    let state: String
}

@MainActor
final class ChatRoomModel: ObservableObject {
    @Published var messages: [ChatBubbleItem] = []
    @Published var draft = ""
    @Published var online = false
    @Published var title = ""
    @Published var avatar: URL?
    @Published var otherUserId = ""
    @Published var isFriend = false
    @Published var peerPublicKey = ""
    private var page = 1
    private var hasMore = true
    private var loading = false
    private weak var host: AppHost?
    var roomId = ""

    func bind(host: AppHost, roomId: String) {
        self.host = host
        self.roomId = roomId
        reloadFromStore()
    }

    func reloadFromStore() {
        guard let host else { return }
        let key = QueryKey(operationId: "getMessagesChatMessagesGet", query: ["room_id": roomId], infinite: true)
        let pages = QueryStore.pages(from: host.core.store.data(for: key))
        let raw = pages.flatMap { $0["messages"]?.arrayValue ?? $0.arrayValue ?? [] }
        let userId = host.core.sessionUserId ?? ""
        messages = raw.compactMap { msg in
            let id = msg["_id"]?.stringValue ?? msg["id"]?.stringValue ?? UUID().uuidString
            let text = ChatCrypto.decryptMessage(msg, currentUserId: userId, storage: host.core.storage)
            let attach = msg["attachments"]?.arrayValue?.first
            return ChatBubbleItem(
                id: id,
                text: text,
                sent: (msg["author_id"]?.stringValue ?? "") == userId,
                imageURL: attach?["url"]?.stringValue.flatMap(URL.init(string:)),
                imageWidth: CGFloat(attach?["width"]?.doubleValue ?? 0),
                imageHeight: CGFloat(attach?["height"]?.doubleValue ?? 0),
                time: String((msg["sent_date"]?.stringValue ?? "").suffix(8).prefix(5)),
                state: msg["message_state"]?.stringValue ?? msg["state"]?.stringValue ?? ""
            )
        }
        if let status = host.core.store.data(for: QueryKey(operationId: "user_connection_status")) {
            online = status["is_connected"]?.boolValue ?? status["connected"]?.boolValue ?? false
        }
    }

    func loadInitial() async {
        await fetchPage(1, replace: true)
        await loadRoomMeta()
    }

    func loadOlder() async {
        guard hasMore else { return }
        await fetchPage(page + 1, replace: false)
    }

    func send() async {
        guard let host else { return }
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        draft = ""
        host.core.haptics.play(.light)
        let tempId = "tmp-\(UUID().uuidString)"
        let optimistic = ChatBubbleItem(id: tempId, text: text, sent: true, imageURL: nil, imageWidth: 0, imageHeight: 0, time: "now", state: "SENT")
        messages.append(optimistic)
        var payload: [String: JSONValue] = [
            "temporary_id": .string(tempId),
            "recipient": .string(otherUserId),
            "room_id": .string(roomId),
        ]
        if !peerPublicKey.isEmpty, let sealed = try? ChatCrypto.encrypt(message: text, recipientPublicKey: peerPublicKey, storage: host.core.storage) {
            payload["encrypted_content"] = .string(sealed.encryptedContent)
            payload["nonce"] = .string(sealed.nonce)
        } else {
            payload["plain_content"] = .string(text)
        }
        host.core.socket.emit(SocketEvent.privateMessage, payload)
    }

    func poke() {
        host?.core.socket.emit("poke", ["recipient": .string(otherUserId)])
    }

    private func fetchPage(_ page: Int, replace: Bool) async {
        guard let host, !loading else { return }
        loading = true
        defer { loading = false }
        do {
            let json = try await host.core.http.executeJSON(Operations.GetMessagesChatMessagesGet(
                query: .init(roomId: roomId, page: Double(page), pageSize: Double(Tokens.Metrics.chatPageSize))
            ))
            let key = QueryKey(operationId: "getMessagesChatMessagesGet", query: ["room_id": roomId], infinite: true)
            if replace {
                host.core.store.setQueryData(key, FeedPaging.replaceFirstPage(json))
            } else {
                let existing = host.core.store.data(for: key)
                host.core.store.setQueryData(key, FeedPaging.appendPage(existing, page: json))
            }
            self.page = page
            hasMore = json["next_cursor"] != nil && json["next_cursor"]?.isNull == false
            reloadFromStore()
        } catch {
            if host.core.mode == .mock && replace {
                messages = [ChatBubbleItem(id: "m1", text: "hello", sent: true, imageURL: nil, imageWidth: 0, imageHeight: 0, time: "now", state: "SENT")]
            }
        }
    }

    private func loadRoomMeta() async {
        guard let host else { return }
        do {
            let json = try await host.core.http.executeJSON(Operations.GetMessageChatRoom(query: .init(roomId: roomId)))
            let userId = host.core.sessionUserId ?? ""
            let others = json["participants"]?.arrayValue?.filter { $0["id"]?.stringValue != userId } ?? []
            let other = others.first
            title = other?["username"]?.stringValue ?? ""
            otherUserId = other?["id"]?.stringValue ?? json["target_user_id"]?.stringValue ?? ""
            isFriend = json["is_friend"]?.boolValue ?? false
            peerPublicKey = json["user_public_key"]?.stringValue
                ?? host.core.storage.get(StorageKey.remoteKey(otherUserId))
                ?? ""
            if !peerPublicKey.isEmpty {
                ChatCrypto.storeRemotePublicKey(otherUserId, peerPublicKey, in: host.core.storage)
            }
            avatar = other?["photos"]?.arrayValue?.first?["image_url"]?.arrayValue?.first?.stringValue.flatMap(URL.init(string:))
        } catch {
            title = "chat"
        }
    }
}

struct ChatRoomView: View {
    @ObservedObject var host: AppHost
    let roomId: String
    @Environment(\.walTheme) private var theme
    @StateObject private var model = ChatRoomModel()

    var body: some View {
        VStack(spacing: 0) {
            topbar
            ChatTranscriptView(
                messages: model.messages,
                onLoadOlder: { Task { await model.loadOlder() } }
            )
            composer
        }
        .background(theme.color("background"))
        .onAppear {
            model.bind(host: host, roomId: roomId)
            Task { await model.loadInitial() }
            startPresence()
        }
        .onChange(of: host.revision) { _ in model.reloadFromStore() }
    }

    private var topbar: some View {
        HStack(spacing: 8) {
            Button { host.back() } label: {
                Image(systemName: "chevron.backward").font(.system(size: 28))
            }
            Button { host.navigate(.chatProfile(roomId: roomId, userId: model.otherUserId)) } label: {
                HStack {
                    UserAvatar(url: model.avatar, size: .chatTopbar, online: model.online)
                    Text(model.title).font(.system(size: 24, weight: .semibold))
                }
            }
            .buttonStyle(.plain)
            Spacer()
            Menu {
                Button(host.core.l10n.t(.commonWhatDoYouWant)) {}
                Button("უჯიკე") { model.poke() }
                Button(model.isFriend ? host.core.l10n.t(.commonRemoveFromFriends) : host.core.l10n.t(.commonAdd)) {}
            } label: {
                Image(systemName: "ellipsis").font(.system(size: 20))
            }
        }
        .foregroundColor(theme.color("text"))
        .padding(.horizontal, 12)
        .frame(height: 56)
    }

    private var composer: some View {
        HStack(spacing: 8) {
            Button {
                host.navigate(.record(feedId: nil, chatMode: true, roomId: roomId, recipientId: model.otherUserId))
            } label: {
                Image(systemName: "camera").font(.system(size: 24))
            }
            TextField("მესიჯი", text: $model.draft)
                .font(.system(size: 16))
            Button {
                Task { await model.send() }
            } label: {
                Circle()
                    .fill(theme.color("primary"))
                    .frame(width: 40, height: 40)
                    .overlay(Image(systemName: "arrow.up").foregroundColor(.white))
            }
            .disabled(model.draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .opacity(model.draft.isEmpty ? 0.5 : 1)
        }
        .padding(12)
        .background(theme.color("inputBackground"))
        .clipShape(RoundedRectangle(cornerRadius: CGFloat(Tokens.Metrics.chatComposerRadius), style: .continuous))
        .padding(12)
    }

    private func startPresence() {
        host.core.socket.emit(SocketEvent.checkUserConnection, ["is_that_connected_id": .string(model.otherUserId)])
    }
}

/// UIKit scroll view + stack (not LazyVStack). Prepend keeps the viewport, matching RN `maintainVisibleContentPosition`.
struct ChatTranscriptView: UIViewRepresentable {
    var messages: [ChatBubbleItem]
    var onLoadOlder: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onLoadOlder: onLoadOlder) }

    func makeUIView(context: Context) -> UIScrollView {
        let scroll = UIScrollView()
        scroll.alwaysBounceVertical = true
        scroll.keyboardDismissMode = .interactive
        scroll.delegate = context.coordinator
        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 8
        stack.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 8),
            stack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -8),
            stack.leadingAnchor.constraint(equalTo: scroll.frameLayoutGuide.leadingAnchor, constant: 12),
            stack.trailingAnchor.constraint(equalTo: scroll.frameLayoutGuide.trailingAnchor, constant: -12),
            stack.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor, constant: -24),
        ])
        context.coordinator.stack = stack
        context.coordinator.scroll = scroll
        return scroll
    }

    func updateUIView(_ scroll: UIScrollView, context: Context) {
        context.coordinator.onLoadOlder = onLoadOlder
        let ids = messages.map(\.id)
        if context.coordinator.ids == ids { return }
        let wasPrepend = !context.coordinator.ids.isEmpty
            && messages.first?.id != context.coordinator.ids.first
            && Set(ids).isSuperset(of: context.coordinator.ids)
        let before = scroll.contentSize.height
        context.coordinator.ids = ids
        context.coordinator.stack?.arrangedSubviews.forEach {
            context.coordinator.stack?.removeArrangedSubview($0)
            $0.removeFromSuperview()
        }
        for message in messages {
            context.coordinator.stack?.addArrangedSubview(ChatBubbleUIView(item: message))
        }
        scroll.layoutIfNeeded()
        if wasPrepend {
            let after = scroll.contentSize.height
            scroll.contentOffset.y += max(0, after - before)
        } else if scroll.contentSize.height > scroll.bounds.height {
            let nearBottom = scroll.contentOffset.y + scroll.bounds.height >= before - CGFloat(Tokens.Metrics.chatAutoScrollDistance)
            if nearBottom || context.coordinator.ids.count <= messages.count {
                scroll.contentOffset.y = max(0, scroll.contentSize.height - scroll.bounds.height)
            }
        }
    }

    final class Coordinator: NSObject, UIScrollViewDelegate {
        var stack: UIStackView?
        weak var scroll: UIScrollView?
        var ids: [String] = []
        var onLoadOlder: () -> Void
        init(onLoadOlder: @escaping () -> Void) { self.onLoadOlder = onLoadOlder }
        func scrollViewDidScroll(_ scrollView: UIScrollView) {
            if scrollView.contentOffset.y < 40 { onLoadOlder() }
        }
    }
}

final class ChatBubbleUIView: UIView {
    init(item: ChatBubbleItem) {
        super.init(frame: .zero)
        let label = UILabel()
        label.text = item.text
        label.numberOfLines = 0
        label.font = .systemFont(ofSize: 16)
        label.textColor = item.sent ? .white : (traitCollection.userInterfaceStyle == .dark ? .white : .black)
        label.translatesAutoresizingMaskIntoConstraints = false
        let bubble = UIView()
        bubble.backgroundColor = item.sent
            ? UIColor(red: 0x3A / 255, green: 0x76 / 255, blue: 0xF0 / 255, alpha: 1)
            : UIColor(white: traitCollection.userInterfaceStyle == .dark ? 0.2 : 0.91, alpha: 1)
        bubble.translatesAutoresizingMaskIntoConstraints = false
        addSubview(bubble)
        bubble.addSubview(label)
        let radius = CGFloat(Tokens.Metrics.chatBubbleRadius)
        bubble.layer.cornerRadius = radius
        if item.sent {
            bubble.layer.maskedCorners = [.layerMinXMinYCorner, .layerMinXMaxYCorner]
        } else {
            bubble.layer.maskedCorners = [.layerMaxXMinYCorner, .layerMaxXMaxYCorner]
        }
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: bubble.topAnchor, constant: 8),
            label.bottomAnchor.constraint(equalTo: bubble.bottomAnchor, constant: -8),
            label.leadingAnchor.constraint(equalTo: bubble.leadingAnchor, constant: 12),
            label.trailingAnchor.constraint(equalTo: bubble.trailingAnchor, constant: -12),
            bubble.topAnchor.constraint(equalTo: topAnchor),
            bubble.bottomAnchor.constraint(equalTo: bottomAnchor),
            bubble.widthAnchor.constraint(lessThanOrEqualTo: widthAnchor, multiplier: CGFloat(Tokens.Metrics.chatBubbleMaxWidthPercent) / 100),
        ])
        if item.sent {
            bubble.trailingAnchor.constraint(equalTo: trailingAnchor).isActive = true
        } else {
            bubble.leadingAnchor.constraint(equalTo: leadingAnchor).isActive = true
        }
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:)") }
}
