import SwiftUI
import WALCore

@main
struct WALApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            AppShell(host: appDelegate.host)
                .onOpenURL { url in
                    appDelegate.host.applyDeepLink(url)
                    appDelegate.host.consumeShareIntentIfNeeded()
                }
        }
    }
}
