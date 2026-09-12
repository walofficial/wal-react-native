import Foundation
import UIKit
import UserNotifications
import WALCore

/// APNs → Expo push token → `PUT /user/upsert-fcm`. Foreground uses `.banner` + `.sound` (not deprecated `.alert`).
final class PushRegistration: NSObject, UNUserNotificationCenterDelegate {
    private weak var host: AppHost?
    private var deviceTokenHex: String?

    func register(host: AppHost) {
        self.host = host
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        center.requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            guard granted else { return }
            DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
        }
    }

    func didRegister(deviceToken: Data) {
        deviceTokenHex = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        Task { await exchangeExpoToken() }
    }

    func handleTap(userInfo: [AnyHashable: Any]) {
        var map: [String: String] = [:]
        if let data = userInfo["data"] as? [String: Any] {
            for (k, v) in data { map[k] = String(describing: v) }
        }
        for (k, v) in userInfo {
            if let key = k as? String, map[key] == nil { map[key] = String(describing: v) }
        }
        DispatchQueue.main.async { self.host?.applyPushTap(map) }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .list])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        handleTap(userInfo: response.notification.request.content.userInfo)
        completionHandler()
    }

    private func exchangeExpoToken() async {
        guard let host, let deviceTokenHex else { return }
        let body: [String: Any] = [
            "type": "apns",
            "deviceId": host.core.deviceId(),
            "development": AppEnvironment.isDev,
            "appId": Bundle.main.bundleIdentifier ?? "com.greetai.ment",
            "deviceToken": deviceTokenHex,
            "projectId": AppEnvironment.expoProjectId,
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        var request = URLRequest(url: URL(string: "https://exp.host/--/api/v2/push/getExpoPushToken")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = data
        guard let (resp, _) = try? await URLSession.shared.data(for: request),
              let obj = try? JSONSerialization.jsonObject(with: resp) as? [String: Any],
              let token = (obj["data"] as? [String: Any])?["expoPushToken"] as? String
                ?? obj["data"] as? String
        else { return }
        host.core.storage.set(StorageKey.expoPushToken, token)
        _ = try? await host.core.http.sendRaw(
            method: .put,
            path: "/user/upsert-fcm",
            operationId: "upsertFcm",
            json: ["expo_push_token": .string(token)]
        )
    }
}
