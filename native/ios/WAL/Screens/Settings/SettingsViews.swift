import SwiftUI
import UIKit
import WALCore

struct SettingsHubView: View {
    @ObservedObject var host: AppHost
    @Environment(\.walTheme) private var theme
    @State private var blockedCount = 0

    var body: some View {
        ScreenScaffold(title: host.core.l10n.t(.commonSettings), onBack: { host.back() }) {
            VStack(alignment: .leading, spacing: 0) {
                row(host.core.l10n.t(.settingsUserPreferences)) { host.navigate(.userPreferences) }
                row(host.core.l10n.t(.settingsAccount)) { host.navigate(.profileSettings) }
                if blockedCount > 0 {
                    row(host.core.l10n.t(.settingsBlockedUsers)) { host.navigate(.blockedUsers) }
                }
                Button(host.core.l10n.t(.settingsTermsOfService)) {
                    if let url = URL(string: "https://wal.ge/terms") { UIApplication.shared.open(url) }
                }
                .padding(16)
                Button(host.core.l10n.t(.settingsPrivacyPolicy)) {
                    if let url = URL(string: "https://wal.ge/privacy") { UIApplication.shared.open(url) }
                }
                .padding(16)
                Button {
                    confirmLogout()
                } label: {
                    Text(host.core.l10n.t(.commonLogout)).foregroundColor(theme.color("accent")).padding(16)
                }
                Spacer()
            }
        }
        .task {
            if let users = try? await host.core.http.execute(Operations.GetBlockedFriends()) {
                blockedCount = users.count
            }
        }
    }

    private func row(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(title)
                Spacer()
                Image(systemName: "chevron.right")
            }
            .padding(16)
            .foregroundColor(theme.color("text"))
        }
    }

    private func confirmLogout() {
        let alert = UIAlertController(
            title: host.core.l10n.t(.commonConfirmLogoutTitle),
            message: host.core.l10n.t(.commonConfirmLogoutDescription),
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: host.core.l10n.t(.commonCancel), style: .cancel))
        alert.addAction(UIAlertAction(title: host.core.l10n.t(.commonLogout), style: .destructive) { _ in
            host.logout()
        })
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .rootViewController?
            .present(alert, animated: true)
    }
}

struct UserPreferencesView: View {
    @ObservedObject var host: AppHost
    @Environment(\.walTheme) private var theme
    @State private var notificationsOn = false

    var body: some View {
        ScreenScaffold(title: host.core.l10n.t(.settingsUserPreferences), onBack: { host.back() }) {
            VStack(alignment: .leading, spacing: 16) {
                Toggle(host.core.l10n.t(.commonEnableNotifications), isOn: $notificationsOn)
                    .onChange(of: notificationsOn) { on in
                        if on {
                            host.push.register(host: host)
                        } else if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                Text(host.core.l10n.t(.settingsLanguage)).font(.headline)
                HStack {
                    localeButton("en", flag: "🇺🇸")
                    localeButton("ka", flag: "🇬🇪")
                }
                Spacer()
            }
            .padding(16)
        }
    }

    private func localeButton(_ code: String, flag: String) -> some View {
        Button {
            host.core.l10n.setLocale(code)
            host.core.storage.set(StorageKey.appLocale, code)
            host.bump()
        } label: {
            Text("\(flag) \(code)")
                .padding(12)
                .background(host.core.l10n.locale == code ? theme.color("primary").opacity(0.2) : theme.color("cardBackground"))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

struct AccountSettingsView: View {
    @ObservedObject var host: AppHost
    @Environment(\.walTheme) private var theme

    var body: some View {
        ScreenScaffold(title: host.core.l10n.t(.settingsAccount), onBack: { host.back() }) {
            VStack(alignment: .leading, spacing: 16) {
                labeled(host.core.l10n.t(.commonUsername), host.core.currentUser?["username"]?.stringValue ?? "")
                labeled(host.core.l10n.t(.commonDateOfBirth), host.core.currentUser?["date_of_birth"]?.stringValue ?? "")
                Button(role: .destructive) { confirmDelete() } label: {
                    Text(host.core.l10n.t(.commonDeleteAccount)).padding(16)
                }
                Spacer()
            }
            .padding(16)
        }
    }

    private func labeled(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading) {
            Text(title).font(.caption).foregroundColor(theme.color("feedItemSecondaryText"))
            Text(value)
        }
    }

    private func confirmDelete() {
        let alert = UIAlertController(title: host.core.l10n.t(.commonDeleteAccount), message: nil, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: host.core.l10n.t(.commonCancel), style: .cancel))
        alert.addAction(UIAlertAction(title: host.core.l10n.t(.commonDelete), style: .destructive) { _ in
            Task {
                _ = try? await host.core.http.execute(Operations.DeleteUser())
                host.logout()
            }
        })
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .rootViewController?
            .present(alert, animated: true)
    }
}

struct BlockedUsersView: View {
    @ObservedObject var host: AppHost
    @Environment(\.walTheme) private var theme
    @State private var users: [JSONValue] = []

    var body: some View {
        ScreenScaffold(title: "დაბლოკილი", onBack: { host.back() }) {
            if users.isEmpty {
                Text(host.core.l10n.t(.commonNoOneBlocked))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(Array(users.enumerated()), id: \.offset) { _, user in
                        HStack {
                            Text(user["username"]?.stringValue ?? "")
                            Spacer()
                            Button(host.core.l10n.t(.commonUnblock)) {
                                Task {
                                    if let id = user["id"]?.stringValue {
                                        _ = try? await host.core.http.execute(Operations.UnblockUserUnblockTargetIdPost(path: .init(targetId: id)))
                                        await load()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        if let list = try? await host.core.http.executeJSON(Operations.GetBlockedFriends()) {
            users = list.arrayValue ?? []
        }
    }
}
