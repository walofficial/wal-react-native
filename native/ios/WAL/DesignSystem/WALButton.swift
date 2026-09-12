import SwiftUI
import WALCore

enum WALButtonSize { case medium, large, iconOnly }

struct WALButton: View {
    @Environment(\.walTheme) private var theme
    let title: String
    var icon: String? = nil
    var size: WALButtonSize = .medium
    var disabled: Bool = false
    var action: () -> Void

    @State private var pressed = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: CGFloat(Tokens.Metrics.buttonIconTitleGap)) {
                if let icon {
                    Image(systemName: IoniconMap.sfSymbol(for: icon))
                        .font(.system(size: fontSize))
                }
                if size != .iconOnly {
                    Text(title).font(.system(size: fontSize, weight: .semibold))
                }
            }
            .foregroundColor(theme.color("buttonText"))
            .padding(.vertical, vPad)
            .padding(.horizontal, hPad)
            .frame(minWidth: minW, minHeight: minW)
            .background(theme.color("buttonBackground"))
            .clipShape(RoundedRectangle(cornerRadius: CGFloat(Tokens.Metrics.buttonRadius), style: .continuous))
        }
        .opacity(disabled ? Tokens.Metrics.buttonDisabledOpacity : 1)
        .disabled(disabled)
        .scaleEffect(pressed ? Tokens.Metrics.pressableScale : 1)
        .animation(.easeOut(duration: Double(Tokens.Metrics.pressableDurationMs) / 1000), value: pressed)
        .simultaneousGesture(DragGesture(minimumDistance: 0).onChanged { _ in pressed = true }.onEnded { _ in pressed = false })
        .accessibilityIdentifier("wal.button.\(title)")
    }

    private var fontSize: CGFloat {
        size == .large ? CGFloat(Tokens.Metrics.buttonLargeFont) : CGFloat(Tokens.Metrics.buttonMediumFont)
    }
    private var vPad: CGFloat {
        size == .large ? CGFloat(Tokens.Metrics.buttonLargePaddingV) : CGFloat(Tokens.Metrics.buttonMediumPaddingV)
    }
    private var hPad: CGFloat {
        size == .iconOnly ? 0 : (size == .large ? CGFloat(Tokens.Metrics.buttonLargePaddingH) : CGFloat(Tokens.Metrics.buttonMediumPaddingH))
    }
    private var minW: CGFloat {
        if size == .iconOnly { return CGFloat(Tokens.Metrics.buttonIconOnlyMedium) }
        return size == .large ? CGFloat(Tokens.Metrics.buttonLargeMinWidth) : CGFloat(Tokens.Metrics.buttonMediumMinWidth)
    }
}
