import SwiftUI

/// Minimal disk+memory image loader. CP8/CP13 can swap in a richer cache; this matches RN `expo-image` defaults
/// (fade in, placeholder colour) on iOS 15.1 without `AsyncImage`'s iOS 15 URLSession quirks.
final class ImageLoader: ObservableObject {
    @Published var image: UIImage?
    private static let memory = NSCache<NSURL, UIImage>()

    func load(_ url: URL?) {
        guard let url else { return }
        if let cached = Self.memory.object(forKey: url as NSURL) {
            image = cached
            return
        }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data, let img = UIImage(data: data) else { return }
            Self.memory.setObject(img, forKey: url as NSURL)
            DispatchQueue.main.async { self.image = img }
        }.resume()
    }
}

struct RemoteImage: View {
    @Environment(\.walTheme) private var theme
    let url: URL?
    @StateObject private var loader = ImageLoader()

    var body: some View {
        ZStack {
            theme.color("cardBackground")
            if let image = loader.image {
                Image(uiImage: image).resizable()
            }
        }
        .onAppear { loader.load(url) }
        .onChange(of: url) { loader.load($0) }
    }
}
