import SwiftUI
import WALCore

struct ToastMessage: Identifiable, Equatable {
    let id = UUID()
    var text: String
    var icon: String?
    var duration: TimeInterval
}

final class ToastController: ObservableObject {
    @Published var stack: [ToastMessage] = []

    func show(_ text: String, icon: String? = nil, duration: TimeInterval? = nil) {
        let toast = ToastMessage(text: text, icon: icon, duration: duration ?? Double(Tokens.Metrics.toastDefaultDurationMs) / 1000)
        stack.append(toast)
        DispatchQueue.main.asyncAfter(deadline: .now() + toast.duration) { [weak self] in
            self?.stack.removeAll { $0.id == toast.id }
        }
    }
}

struct ToastHost: View {
    @Environment(\.walTheme) private var theme
    @ObservedObject var controller: ToastController

    var body: some View {
        VStack(spacing: 8) {
            ForEach(controller.stack) { toast in
                HStack(spacing: 8) {
                    if let icon = toast.icon {
                        Image(systemName: IoniconMap.sfSymbol(for: icon))
                            .font(.system(size: CGFloat(Tokens.Metrics.toastIconSize)))
                    }
                    Text(toast.text).font(.system(size: 15, weight: .medium))
                }
                .foregroundColor(theme.color("text"))
                .padding(CGFloat(Tokens.Metrics.toastPadding))
                .background(theme.color("cardBackground"))
                .clipShape(RoundedRectangle(cornerRadius: CGFloat(Tokens.Metrics.toastRadius), style: .continuous))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .padding(.top, 48)
        .allowsHitTesting(false)
    }
}
