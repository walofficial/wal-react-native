import SwiftUI
import WALCore

struct ProfileView: View {
    @ObservedObject var host: AppHost
    let userId: String
    var isOwn: Bool
    @Environment(\.walTheme) private var theme
    @State private var username = ""
    @State private var bio = ""
    @State private var photo: URL?
    @State private var posts: [FeedPostItem] = []
    @State private var showBio = false
    @State private var showPhoto = false
    @State private var draftBio = ""

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                if !isOwn {
                    Button { host.back() } label: {
                        Image(systemName: "chevron.backward").font(.system(size: 28))
                    }
                }
                Spacer()
                Text(username).font(.system(size: 18, weight: .semibold))
                Spacer()
                if isOwn {
                    Button { host.navigate(.settings) } label: {
                        Image(systemName: "gearshape").font(.system(size: 22))
                    }
                    .accessibilityIdentifier("profile.settings")
                }
            }
            .foregroundColor(theme.color("text"))
            .padding(.horizontal, 12)
            .frame(height: 52)

            ScrollView {
                VStack(spacing: 12) {
                    Button {
                        if isOwn { showPhoto = true }
                        else if photo != nil { host.navigate(.profilePicture(userId: userId, imageUrl: photo?.absoluteString)) }
                    } label: {
                        UserAvatar(url: photo, size: .profile)
                    }
                    if bio.isEmpty, isOwn {
                        Button(host.core.l10n.t(.profileAddBio)) { showBio = true }
                            .foregroundColor(theme.color("primary"))
                    } else if !bio.isEmpty {
                        Text(bio)
                            .font(.system(size: 14))
                            .lineLimit(2)
                            .onTapGesture { if isOwn { showBio = true } }
                    }
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 2) {
                        ForEach(posts) { post in
                            Button { host.navigate(.verification(verificationId: post.id)) } label: {
                                tile(post)
                            }
                        }
                    }
                }
                .padding(.bottom, 24)
            }
        }
        .background(theme.color("background"))
        .sheet(isPresented: $showBio) { bioSheet }
        .sheet(isPresented: $showPhoto) { photoSheet }
        .task { await load() }
    }

    @ViewBuilder private func tile(_ post: FeedPostItem) -> some View {
        let url = post.raw["image_gallery_with_dims"]?.arrayValue?.first?["url"]?.stringValue.flatMap(URL.init(string:))
        ZStack {
            theme.color("cardBackground")
            if let url {
                RemoteImage(url: url, targetSize: CGSize(width: 160, height: 160))
                    .scaledToFill()
            } else {
                Text(post.raw["text_content"]?.stringValue ?? "")
                    .font(.system(size: 11))
                    .lineLimit(4)
                    .padding(6)
            }
        }
        .frame(minHeight: 110)
        .clipped()
    }

    private var bioSheet: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(host.core.l10n.t(.profileAboutMe)).font(.headline)
            TextEditor(text: $draftBio)
                .frame(height: 120)
            Text("\(draftBio.count)/\(Tokens.Metrics.bioMaxLength)")
                .font(.caption)
            WALButton(title: host.core.l10n.t(.commonSave), disabled: draftBio.count > Tokens.Metrics.bioMaxLength) {
                Task { await saveBio() }
            }
        }
        .padding(16)
        .onAppear { draftBio = bio }
    }

    private var photoSheet: some View {
        VStack(spacing: 12) {
            WALButton(title: host.core.l10n.t(.commonCamera)) {
                showPhoto = false
                host.navigate(.record(chatMode: false))
            }
            WALButton(title: host.core.l10n.t(.commonUploadFromGallery)) {
                showPhoto = false
            }
        }
        .padding(24)
    }

    private func load() async {
        do {
            let profile = try await host.core.http.executeJSON(Operations.GetUserProfileUserProfileUserIdGet(path: .init(userId: userId)))
            username = profile["username"]?.stringValue ?? ""
            photo = profile["photos"]?.arrayValue?.first?["image_url"]?.arrayValue?.first?.stringValue.flatMap(URL.init(string:))
            if isOwn { bio = host.core.currentUser?["bio"]?.stringValue ?? "" }
        } catch {
            username = host.core.currentUser?["username"]?.stringValue ?? ""
            bio = host.core.currentUser?["bio"]?.stringValue ?? ""
        }
        do {
            let json = try await host.core.http.executeJSON(Operations.GetVerifications(
                query: .init(page: 1, pageSize: Double(Tokens.Metrics.feedPageSize), targetUserId: userId)
            ))
            posts = FeedPaging.flatten(FeedPaging.replaceFirstPage(json))
        } catch {}
    }

    private func saveBio() async {
        _ = try? await host.core.http.execute(Operations.UpdateUser(body: UpdateUserRequest(bio: draftBio)))
        bio = draftBio
        showBio = false
    }
}

struct ProfilePictureView: View {
    @Environment(\.walTheme) private var theme
    let imageURL: URL?
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            RemoteImage(url: imageURL, targetSize: CGSize(width: 800, height: 800))
                .scaledToFit()
        }
    }
}
