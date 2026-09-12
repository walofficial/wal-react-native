import UIKit
import UniformTypeIdentifiers

/// Port of expo-share-intent's iOS extension: collects shared text / URL / images into the App Group
/// container and opens the host app via the `wal` scheme. The host consumes the payload and routes to
/// createPost (see ShareIntentProvider in app/_layout.tsx). Full implementation lands in CP13.
final class ShareViewController: UIViewController {
    private var appGroup: String { Bundle.main.object(forInfoDictionaryKey: "WALAppGroup") as? String ?? "group.com.greetai.ment" }
    private var hostScheme: String { Bundle.main.object(forInfoDictionaryKey: "WALHostScheme") as? String ?? "wal" }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        Task { await handleShare() }
    }

    private func handleShare() async {
        defer { extensionContext?.completeRequest(returningItems: nil) }
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else { return }
        var payload: [String: Any] = ["type": "text", "value": [String]()]
        var texts: [String] = []
        var files: [String] = []

        for item in items {
            for provider in item.attachments ?? [] {
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier),
                   let url = try? await provider.loadItem(forTypeIdentifier: UTType.url.identifier) as? URL {
                    texts.append(url.absoluteString)
                    payload["type"] = "weburl"
                } else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier),
                          let text = try? await provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) as? String {
                    texts.append(text)
                } else if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier),
                          let stored = await storeImage(provider) {
                    files.append(stored)
                    payload["type"] = "media"
                }
            }
        }
        payload["value"] = texts
        payload["files"] = files
        UserDefaults(suiteName: appGroup)?.set(payload, forKey: "ShareKey")
        openHost()
    }

    private func storeImage(_ provider: NSItemProvider) async -> String? {
        guard let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return nil }
        let item = try? await provider.loadItem(forTypeIdentifier: UTType.image.identifier)
        let data: Data?
        if let url = item as? URL { data = try? Data(contentsOf: url) } else if let image = item as? UIImage { data = image.jpegData(compressionQuality: 0.9) } else { data = item as? Data }
        guard let bytes = data else { return nil }
        let target = container.appendingPathComponent("share-\(UUID().uuidString).jpg")
        do { try bytes.write(to: target) } catch { return nil }
        return target.path
    }

    private func openHost() {
        guard let url = URL(string: "\(hostScheme)://dataUrl=ShareKey") else { return }
        var responder: UIResponder? = self
        while let r = responder {
            if let app = r as? UIApplication {
                app.open(url, options: [:], completionHandler: nil)
                return
            }
            responder = r.next
        }
    }
}
