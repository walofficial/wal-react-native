import SwiftUI
import WALCore

struct RegisterView: View {
    @ObservedObject var host: AppHost
    @Environment(\.walTheme) private var theme
    @State private var username = ""
    @State private var dob = AuthRules.defaultDOB
    @State private var dobDate = AuthRules.minDOB
    @State private var available: Bool?
    @State private var busy = false

    private var usernameError: String? { AuthRules.validateUsername(username) }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Button {
                    host.logout()
                } label: {
                    Image(systemName: "chevron.backward").font(.system(size: 28))
                }
                Spacer()
                Text("რეგისტრაცია").font(.system(size: 18, weight: .semibold))
                Spacer()
                Color.clear.frame(width: 28)
            }
            TextField(host.core.l10n.t(.commonUsername), text: $username)
                .padding(12)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(border, lineWidth: 1))
                .onChange(of: username) { _ in checkAvailability() }
            DatePicker(host.core.l10n.t(.commonDateOfBirth), selection: $dobDate, in: AuthRules.minDOB...AuthRules.maxDOB(), displayedComponents: .date)
                .datePickerStyle(.compact)
                .onChange(of: dobDate) { date in dob = RegisterView.format(date) }
            WALButton(title: "OK", disabled: usernameError != nil || available == false || busy) {
                Task { await submit() }
            }
        }
        .padding(16)
        .foregroundColor(theme.color("text"))
        .background(theme.color("background"))
        .onAppear {
            dobDate = RegisterView.parse(AuthRules.defaultDOB) ?? AuthRules.minDOB
        }
    }

    private var border: Color {
        if usernameError == "non_latin" || (usernameError == "too_short" && !username.isEmpty) { return Color(hex: "#ef4444") }
        if available == true { return Color(hex: "#22c55e") }
        return Color(hex: theme.isDark ? "#737373" : "#d1d5db")
    }

    private func checkAvailability() {
        guard usernameError == nil else { available = nil; return }
        let name = username
        DispatchQueue.main.asyncAfter(deadline: .now() + Double(Tokens.Metrics.usernameDebounceMs) / 1000) {
            guard name == username else { return }
            Task {
                if let json = try? await host.core.http.executeJSON(Operations.CheckUsernameUserCheckUsernameUsernameGet(path: .init(username: name))) {
                    available = json["available"]?.boolValue
                }
            }
        }
    }

    private func submit() async {
        busy = true
        defer { busy = false }
        do {
            try await host.register(username: username, dob: dob, gender: "male")
        } catch {
            host.toast.show(host.core.l10n.t(.commonUserUpdateFailed))
        }
    }

    private static func format(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "dd/MM/yyyy"
        return f.string(from: date)
    }

    private static func parse(_ raw: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "dd/MM/yyyy"
        return f.date(from: raw)
    }
}
