import SwiftUI
import WALCore

/// App entry point. Navigation is UIKit-hosted (see CP4) so the scene is driven from `AppDelegate`
/// + `SceneDelegate`; this SwiftUI `App` only exists to own the process lifecycle on iOS 15.1.
@main
struct WALApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            AppShell(host: AppHost(core: AppCore(mode: .mock)))
        }
    }
}
