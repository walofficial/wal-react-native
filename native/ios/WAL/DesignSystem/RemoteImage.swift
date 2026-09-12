import SwiftUI
import WALCore

/// Memory + downsample loader. Cancels in-flight work when the URL changes. Matches RN expo-image intent
/// (fade in, placeholder) without decoding full-resolution bitmaps into the feed.
final class ImageLoader: ObservableObject {
    @Published var image: UIImage?
    private static let memory = NSCache<NSURL, UIImage>()
    private var task: URLSessionDataTask?
    private var current: URL?

    init() {
        Self.memory.totalCostLimit = 40 * 1024 * 1024
        Self.memory.countLimit = 200
    }

    func load(_ url: URL?, targetSize: CGSize) {
        guard let url else {
            cancel()
            image = nil
            return
        }
        if current == url, image != nil { return }
        current = url
        if let cached = Self.memory.object(forKey: url as NSURL) {
            image = cached
            return
        }
        cancel()
        let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30)
        task = URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            guard let data, let raw = UIImage(data: data) else { return }
            let scaled = ImageLoader.downsample(raw, to: targetSize)
            Self.memory.setObject(scaled, forKey: url as NSURL, cost: Int(scaled.size.width * scaled.size.height * 4))
            DispatchQueue.main.async {
                guard self?.current == url else { return }
                self?.image = scaled
            }
        }
        task?.resume()
    }

    func cancel() {
        task?.cancel()
        task = nil
    }

    static func downsample(_ image: UIImage, to size: CGSize) -> UIImage {
        let scale = UIScreen.main.scale
        let target = CGSize(
            width: max(1, size.width * scale),
            height: max(1, size.height * scale)
        )
        guard image.size.width > target.width || image.size.height > target.height else { return image }
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let renderer = UIGraphicsImageRenderer(size: target, format: format)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
    }
}

struct RemoteImage: View {
    @Environment(\.walTheme) private var theme
    let url: URL?
    var targetSize: CGSize = CGSize(width: 200, height: 200)
    @StateObject private var loader = ImageLoader()

    var body: some View {
        ZStack {
            theme.color("cardBackground")
            if let image = loader.image {
                Image(uiImage: image).resizable()
            }
        }
        .onAppear { loader.load(url, targetSize: targetSize) }
        .onChange(of: url) { loader.load($0, targetSize: targetSize) }
        .onDisappear { loader.cancel() }
    }
}
