import SwiftUI
import WALCore

/// Gorhom-style sheet: snap points as % of available height, backdrop on index 0, handle 36×4.
struct BottomSheet<Content: View>: View {
    @Environment(\.walTheme) private var theme
    let snapPercent: Double
    @Binding var isPresented: Bool
    @ViewBuilder var content: () -> Content

    var body: some View {
        ZStack(alignment: .bottom) {
            if isPresented {
                theme.color("background").opacity(0.45)
                    .ignoresSafeArea()
                    .onTapGesture { isPresented = false }
                    .transition(.opacity)
                VStack(spacing: 0) {
                    Capsule()
                        .fill(theme.color("border"))
                        .frame(width: CGFloat(Tokens.Metrics.sheetHandleWidth), height: CGFloat(Tokens.Metrics.sheetHandleHeight))
                        .padding(.top, 8)
                        .padding(.bottom, 12)
                    content()
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity)
                .frame(height: UIScreen.main.bounds.height * snapPercent / 100)
                .background(theme.color("cardBackground"))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .transition(.move(edge: .bottom))
            }
        }
        .animation(.easeOut(duration: 0.25), value: isPresented)
    }
}

enum SheetKind: String {
    case login, contactSync, factCheck, newsSources, photos, bioEditor, profilePhotoEdit
    var snap: Double {
        switch self {
        case .login: return Tokens.Sheets.login[0]
        case .contactSync: return Tokens.Sheets.contactSync[0]
        case .factCheck: return Tokens.Sheets.factCheck[0]
        case .newsSources: return Tokens.Sheets.newsSources[0]
        case .photos: return Tokens.Sheets.photos[0]
        case .bioEditor: return Tokens.Sheets.bioEditor[0]
        case .profilePhotoEdit: return Tokens.Sheets.profilePhotoEdit[0]
        }
    }
}
