import SwiftUI
import WALCore

struct Skeleton: View {
    @Environment(\.walTheme) private var theme
    var width: CGFloat? = nil
    var height: CGFloat = 16
    @State private var pulse = false

    var body: some View {
        RoundedRectangle(cornerRadius: CGFloat(Tokens.Metrics.skeletonRadius), style: .continuous)
            .fill(theme.color("cardBackground"))
            .frame(width: width, height: height)
            .opacity(pulse ? 0.45 : 0.9)
            .onAppear {
                withAnimation(.easeInOut(duration: Double(Tokens.Metrics.skeletonPulseMs) / 1000).repeatForever(autoreverses: true)) {
                    pulse = true
                }
            }
            .accessibilityIdentifier("wal.skeleton")
    }
}
