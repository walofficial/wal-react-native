import SwiftUI
import WALCore

/// Landing + login sheet. Video URL matches `sign-in.tsx`; CTA and sheet snap 45%.
struct SignInView: View {
    @Environment(\.walTheme) private var theme
    @ObservedObject var toast: ToastController
    let l10n: L10n
    var onSendOTP: (String) -> Void
    @State private var showLogin = false
    @State private var phone = ""
    @State private var otp = ""
    @State private var step = 0

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 24) {
                Spacer()
                Text("WAL")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
                WALButton(title: "Continue") {
                    showLogin = true
                }
                .padding(.horizontal, 24)
                Spacer()
            }
            BottomSheet(snapPercent: SheetKind.login.snap, isPresented: $showLogin) {
                loginBody
                    .padding(.horizontal, 16)
            }
        }
        .preferredColorScheme(.dark)
    }

    private var loginBody: some View {
        VStack(alignment: .leading, spacing: 16) {
            if step == 0 {
                HStack(spacing: 8) {
                    AsyncImage(url: AuthRules.defaultCountry.flagURL) { $0.resizable() } placeholder: { Color.gray }
                        .frame(width: 24, height: 18)
                    Text(AuthRules.defaultCountry.callingCode)
                        .foregroundColor(theme.color("text"))
                    TextField("", text: $phone)
                        .keyboardType(.phonePad)
                        .foregroundColor(theme.color("text"))
                }
                .padding(12)
                .frame(minHeight: 56)
                .background(Color(hex: theme.isDark ? "#222222" : "#f8f8f8"))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                WALButton(title: "OTP", disabled: !AuthRules.validatePhone(phone)) {
                    onSendOTP(AuthRules.e164(phone))
                    step = 1
                }
            } else {
                OTPRow(code: $otp)
                WALButton(title: "Verify", disabled: otp.count != AuthRules.otpDigits) {
                    toast.show("ok")
                }
            }
        }
    }
}

struct OTPRow: View {
    @Environment(\.walTheme) private var theme
    @Binding var code: String
    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<AuthRules.otpDigits, id: \.self) { i in
                let focused = code.count == i
                Text(i < code.count ? String(Array(code)[i]) : "")
                    .font(.system(size: 20, weight: .semibold))
                    .frame(width: 44, height: 52)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(focused ? Color(hex: "#004cb0") : theme.color("border"), lineWidth: focused ? 2 : 1)
                    )
            }
        }
    }
}
