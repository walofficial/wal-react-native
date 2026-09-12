import SwiftUI
import WALCore

/// CP0 placeholder for the root. Replaced in CP4 by the UIKit-hosted root navigation controller.
/// Mirrors the RN splash (`expo-splash-screen`: black background, 200pt icon).
struct RootView: View {
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            Image("SplashIcon")
                .resizable()
                .scaledToFit()
                .frame(width: 200, height: 200)
                .accessibilityIdentifier("splash.icon")
        }
        .statusBarHidden(false)
        .preferredColorScheme(.dark)
    }
}
