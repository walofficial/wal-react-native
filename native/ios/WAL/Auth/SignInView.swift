import SwiftUI
import WALCore

/// Landing + login sheet. OTP cells accept paste / SMS autofill (`textContentType = .oneTimeCode`).
struct SignInView: View {
    @ObservedObject var host: AppHost
    @Environment(\.walTheme) private var theme
    @State private var showLogin = false
    @State private var showCountry = false
    @State private var country = AuthRules.defaultCountry
    @State private var phone = ""
    @State private var otp = ""
    @State private var step = 0
    @State private var resend = 0
    @State private var busy = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 24) {
                Spacer()
                Text("WAL")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
                    .accessibilityIdentifier("auth.title")
                Text(host.core.l10n.t(.commonWhatHappening))
                    .foregroundColor(.white.opacity(0.7))
                WALButton(title: host.core.l10n.t(.commonContinue)) {
                    showLogin = true
                }
                .padding(.horizontal, 24)
                Spacer()
            }
            BottomSheet(snapPercent: SheetKind.login.snap, isPresented: $showLogin) {
                loginBody.padding(.horizontal, 16)
            }
        }
        .preferredColorScheme(.dark)
    }

    @ViewBuilder private var loginBody: some View {
        if showCountry {
            countryList
        } else if step == 0 {
            phoneStep
        } else {
            otpStep
        }
    }

    private var phoneStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Button { showCountry = true } label: {
                    HStack {
                        RemoteImage(url: country.flagURL, targetSize: CGSize(width: 24, height: 18))
                            .frame(width: 24, height: 18)
                        Text(country.callingCode)
                    }
                }
                TextField("", text: $phone)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                    .foregroundColor(theme.color("text"))
                    .accessibilityIdentifier("auth.phone")
            }
            .padding(12)
            .frame(minHeight: 56)
            .background(Color(hex: theme.isDark ? "#222222" : "#f8f8f8"))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            WALButton(title: host.core.l10n.t(.commonGetCode), disabled: !AuthRules.validatePhone(phone, country: country) || busy) {
                Task { await send() }
            }
        }
    }

    private var otpStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            OTPField(code: $otp, digits: AuthRules.otpDigits)
            if resend > 0 {
                Text(host.core.l10n.t(.commonWaitSeconds, ["timer": resend]))
                    .font(.caption)
            }
            WALButton(title: host.core.l10n.t(.commonConfirm), disabled: otp.count != AuthRules.otpDigits || busy) {
                Task { await verify() }
            }
        }
    }

    private var countryList: some View {
        VStack(alignment: .leading) {
            Button(host.core.l10n.t(.commonBack)) { showCountry = false }
            ForEach(AuthRules.countries, id: \.code) { item in
                Button {
                    country = item
                    showCountry = false
                } label: {
                    HStack {
                        Text(item.code)
                        Spacer()
                        Text(item.callingCode)
                    }
                    .padding(.vertical, 8)
                }
            }
        }
    }

    private func send() async {
        busy = true
        defer { busy = false }
        do {
            try await host.sendOTP(phone: AuthRules.e164(phone, country: country))
            step = 1
            resend = AuthRules.otpResendSeconds
            tick()
        } catch {
            host.toast.show(host.core.l10n.t(.commonErrorTitle))
        }
    }

    private func verify() async {
        busy = true
        defer { busy = false }
        do {
            try await host.verifyOTP(phone: AuthRules.e164(phone, country: country), token: otp)
        } catch {
            host.toast.show(host.core.l10n.t(.commonInvalidCodeTryAgain))
        }
    }

    private func tick() {
        guard resend > 0 else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            resend -= 1
            tick()
        }
    }
}

struct OTPField: View {
    @Environment(\.walTheme) private var theme
    @Binding var code: String
    let digits: Int
    @FocusState private var focused: Bool

    var body: some View {
        ZStack {
            TextField("", text: $code)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .focused($focused)
                .opacity(0.02)
                .accessibilityIdentifier("auth.otp")
                .onChange(of: code) { value in
                    let filtered = String(value.filter(\.isNumber).prefix(digits))
                    if filtered != value { code = filtered }
                }
            HStack(spacing: 8) {
                ForEach(0..<digits, id: \.self) { i in
                    let focusedCell = code.count == i
                    Text(i < code.count ? String(Array(code)[i]) : "")
                        .font(.system(size: 20, weight: .semibold))
                        .frame(width: 44, height: 52)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(focusedCell ? Color(hex: "#004cb0") : theme.color("border"), lineWidth: focusedCell ? 2 : 1)
                        )
                }
            }
            .onTapGesture { focused = true }
        }
        .onAppear { focused = true }
    }
}
