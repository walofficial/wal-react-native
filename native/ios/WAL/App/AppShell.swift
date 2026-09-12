import SwiftUI
import WALCore

/// UIKit-hosted tabs + stacks. SwiftUI owns chrome (theme, toasts, incoming message banner).
struct AppShell: View {
    @ObservedObject var host: AppHost

    var body: some View {
        ZStack {
            WALRootRepresentable(host: host)
                .ignoresSafeArea()
            ToastHost(controller: host.toast)
            if let incoming = host.incomingToast {
                incomingBanner(incoming)
            }
        }
        .environmentObject(host)
        .environment(\.appHost, host)
        .environment(\.walTheme, host.theme)
        .preferredColorScheme(host.theme.isDark ? .dark : .light)
    }

    private func incomingBanner(_ toast: IncomingMessageToast) -> some View {
        VStack {
            Button {
                host.incomingToast = nil
                host.navigate(.chatRoom(roomId: toast.roomId))
            } label: {
                HStack {
                    UserAvatar(url: nil, size: .comment)
                    VStack(alignment: .leading) {
                        Text(toast.name).font(.system(size: 14, weight: .semibold))
                        Text(toast.preview).font(.system(size: 13)).lineLimit(1)
                    }
                    Spacer()
                }
                .padding(12)
                .background(host.theme.color("cardBackground"))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .padding(.horizontal, 16)
            .padding(.top, 52)
            Spacer()
        }
        .transition(.move(edge: .top))
    }
}
