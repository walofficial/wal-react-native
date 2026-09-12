import SwiftUI
import WALCore

struct ChatRoomRow: Identifiable, Equatable {
    let id: String
    let name: String
    let avatar: URL?
    let preview: String
    let timestamp: String
    let otherUserId: String
    let isFriend: Bool
}

@MainActor
final class ChatListModel: ObservableObject {
    @Published var rooms: [ChatRoomRow] = []
    @Published var friends: [ChatRoomRow] = []
    private weak var host: AppHost?

    func bind(_ host: AppHost) {
        self.host = host
        reload()
    }

    func reload() {
        guard let host else { return }
        let key = QueryKey(operationId: "getUserChatRooms")
        let data = host.core.store.data(for: key)
        let roomsJSON = data?["chat_rooms"]?.arrayValue ?? data?.arrayValue ?? []
        let userId = host.core.sessionUserId ?? ""
        rooms = roomsJSON.compactMap { raw in
            guard let id = raw["id"]?.stringValue else { return nil }
            let participants = raw["participants"]?.arrayValue ?? []
            let other = participants.first { $0["id"]?.stringValue != userId } ?? participants.first
            let last = raw["last_message"]
            let preview: String
            if let last {
                let dec = ChatCrypto.decryptMessage(last, currentUserId: userId, storage: host.core.storage)
                preview = dec.isEmpty ? host.core.l10n.t(.commonChat) : dec
            } else {
                preview = ""
            }
            return ChatRoomRow(
                id: id,
                name: other?["username"]?.stringValue ?? "",
                avatar: other?["photos"]?.arrayValue?.first?["image_url"]?.arrayValue?.first?.stringValue.flatMap(URL.init(string:)),
                preview: preview,
                timestamp: ChatListModel.relative(last?["sent_date"]?.stringValue, l10n: host.core.l10n),
                otherUserId: other?["id"]?.stringValue ?? raw["target_user_id"]?.stringValue ?? "",
                isFriend: raw["is_friend"]?.boolValue ?? false
            )
        }
        friends = rooms.filter(\.isFriend)
    }

    func refresh() async {
        guard let host else { return }
        do {
            let json = try await host.core.http.executeJSON(Operations.GetUserChatRooms())
            host.core.store.setQueryData(QueryKey(operationId: "getUserChatRooms"), json)
            reload()
            for room in rooms.prefix(3) {
                Task {
                    let page = try? await host.core.http.executeJSON(Operations.GetMessagesChatMessagesGet(
                        query: .init(roomId: room.id, page: 1, pageSize: Double(Tokens.Metrics.chatPageSize))
                    ))
                    if let page {
                        host.core.store.setQueryData(
                            QueryKey(operationId: "getMessagesChatMessagesGet", query: ["room_id": room.id], infinite: true),
                            FeedPaging.replaceFirstPage(page)
                        )
                    }
                }
            }
        } catch {
            if host.core.mode == .mock { seedMock() }
        }
    }

    private func seedMock() {
        rooms = [
            ChatRoomRow(id: "r1", name: "nika", avatar: nil, preview: "hello", timestamp: "Now", otherUserId: "u2", isFriend: true),
        ]
        friends = rooms
    }

    static func relative(_ iso: String?, l10n: L10n) -> String {
        guard let iso, let date = ChatListModel.parse(iso) else { return "" }
        let delta = Date().timeIntervalSince(date)
        if delta < 60 { return l10n.t(.commonNow) }
        if delta < 3600 { return "\(Int(delta / 60))\(l10n.t(.commonMinuteShort))" }
        if delta < 86400 { return "\(Int(delta / 3600))\(l10n.t(.commonHourShort))" }
        let cal = Calendar.current
        if cal.dateComponents([.day], from: date, to: Date()).day ?? 0 < 7 {
            let f = DateFormatter(); f.dateFormat = "EEE"; return f.string(from: date)
        }
        let f = DateFormatter(); f.dateFormat = "M/d"; return f.string(from: date)
    }

    private static func parse(_ raw: String) -> Date? {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = iso.date(from: raw) { return d }
        iso.formatOptions = [.withInternetDateTime]
        return iso.date(from: raw)
    }
}

struct ChatListView: View {
    @ObservedObject var host: AppHost
    @Environment(\.walTheme) private var theme
    @StateObject private var model = ChatListModel()

    var body: some View {
        VStack(spacing: 0) {
            SimpleHeader(
                title: "ჩათი",
                showBack: false,
                trailing: AnyView(
                    Button { host.presentSheet(SheetKind.contactSync.rawValue) } label: {
                        Image(systemName: "plus.circle")
                            .font(.system(size: 28))
                            .foregroundColor(theme.color("text"))
                    }
                    .accessibilityIdentifier("chat.add")
                )
            )
            if model.rooms.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "bubble.left.and.bubble.right")
                        .font(.system(size: 64))
                    Text(host.core.l10n.t(.commonNoChatsYet))
                    Spacer()
                }
                .foregroundColor(theme.color("feedItemSecondaryText"))
            } else {
                ScrollView {
                    VStack(spacing: 0) {
                        if !model.friends.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: CGFloat(Tokens.Metrics.storyItemSpacing)) {
                                    ForEach(model.friends) { friend in
                                        VStack {
                                            UserAvatar(url: friend.avatar, size: .story)
                                            Text(friend.name).font(.system(size: 12)).lineLimit(1)
                                        }
                                        .frame(width: CGFloat(Tokens.Metrics.storyItemWidth))
                                        .onTapGesture { host.navigate(.chatRoom(roomId: friend.id)) }
                                    }
                                }
                                .padding(.horizontal, 12)
                            }
                            .padding(.vertical, 8)
                        }
                        ForEach(model.rooms) { room in
                            Button { host.navigate(.chatRoom(roomId: room.id)) } label: {
                                HStack(spacing: 12) {
                                    UserAvatar(url: room.avatar, size: .chatItem)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(room.name).font(.system(size: 20, weight: .semibold))
                                        Text(room.preview)
                                            .font(.system(size: 15))
                                            .foregroundColor(theme.color("feedItemSecondaryText"))
                                            .lineLimit(1)
                                    }
                                    Spacer()
                                    Text(room.timestamp)
                                        .font(.system(size: 13))
                                        .foregroundColor(theme.color("feedItemSecondaryText"))
                                }
                                .padding(.horizontal, 16)
                                .frame(height: 76)
                            }
                            .buttonStyle(.plain)
                            .foregroundColor(theme.color("text"))
                        }
                    }
                }
                .refreshable { await model.refresh() }
            }
        }
        .background(theme.color("background"))
        .onAppear {
            model.bind(host)
            Task { await model.refresh() }
        }
        .onChange(of: host.revision) { _ in model.reload() }
    }
}
