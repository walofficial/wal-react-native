import SwiftUI
import WALCore

struct RegisterView: View {
    @Environment(\.walTheme) private var theme
    var onSubmit: (String, String, String) -> Void
    @State private var username = ""
    @State private var gender = "male"
    @State private var dob = AuthRules.defaultDOB

    private var usernameError: String? { AuthRules.validateUsername(username) }
    private var border: Color {
        if usernameError == "non_latin" || usernameError == "too_short" && !username.isEmpty { return Color(hex: "#ef4444") }
        return Color(hex: theme.isDark ? "#737373" : "#d1d5db")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("რეგისტრაცია").font(.system(size: 18, weight: .semibold))
            TextField("username", text: $username)
                .padding(12)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(border, lineWidth: 1))
            Picker("gender", selection: $gender) {
                Text("male").tag("male")
                Text("female").tag("female")
                Text("other").tag("other")
            }.pickerStyle(.segmented)
            Text(dob).frame(maxWidth: .infinity, minHeight: 58)
                .background(theme.color("cardBackground"))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            WALButton(title: "OK", disabled: usernameError != nil) {
                onSubmit(username, dob, gender)
            }
        }
        .padding(16)
        .background(theme.color("background"))
    }
}
