import SwiftUI
import WALCore

struct SimpleHeader: View {
    @Environment(\.walTheme) private var theme
    let title: String
    var showBack: Bool = true
    var onBack: (() -> Void)?
    var trailing: AnyView? = nil

    var body: some View {
        HStack {
            if showBack {
                Button(action: { onBack?() }) {
                    Image(systemName: "chevron.backward")
                        .font(.system(size: 28, weight: .regular))
                        .foregroundColor(theme.color("text"))
                }
                .accessibilityIdentifier("nav.back")
                .frame(width: 44, height: 44)
            } else {
                Color.clear.frame(width: 44, height: 44)
            }
            Spacer()
            Text(title)
                .font(.system(size: CGFloat(Tokens.Metrics.simpleHeaderTitleFont), weight: .semibold))
                .foregroundColor(theme.color("text"))
            Spacer()
            if let trailing {
                trailing.frame(width: 44, height: 44)
            } else {
                Color.clear.frame(width: 44, height: 44)
            }
        }
        .padding(.horizontal, 8)
        .frame(height: CGFloat(Tokens.Metrics.simpleHeaderHeight))
        .background(theme.color("background"))
    }
}

struct ScreenScaffold<Content: View>: View {
    @Environment(\.walTheme) private var theme
    let title: String
    var showBack: Bool = true
    var onBack: (() -> Void)?
    var trailing: AnyView? = nil
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(spacing: 0) {
            SimpleHeader(title: title, showBack: showBack, onBack: onBack, trailing: trailing)
            content()
        }
        .background(theme.color("background").ignoresSafeArea())
    }
}
