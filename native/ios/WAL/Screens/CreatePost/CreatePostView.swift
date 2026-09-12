import PhotosUI
import SwiftUI
import WALCore

struct CreatePostView: View {
    @ObservedObject var host: AppHost
    var feedId: String
    var sharedContent: String?
    var sharedImages: String?
    @Environment(\.walTheme) private var theme
    @State private var text = ""
    @State private var images: [UIImage] = []
    @State private var publishing = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Button(host.core.l10n.t(.commonCancel)) { host.back() }
                Spacer()
                Button(host.core.l10n.t(.commonPublish)) { Task { await publish() } }
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || publishing)
                    .opacity(text.isEmpty ? 0.5 : 1)
            }
            .foregroundColor(theme.color("text"))
            TextEditor(text: $text)
                .frame(minHeight: 160)
            Text("\(text.count)/\(Tokens.Metrics.postMaxLength)")
                .font(.caption)
                .foregroundColor(theme.color("feedItemSecondaryText"))
            HStack(spacing: 8) {
                ForEach(Array(images.enumerated()), id: \.offset) { _, img in
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(width: CGFloat(Tokens.Metrics.postImageCell), height: CGFloat(Tokens.Metrics.postImageCell))
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
                if images.count < Tokens.Metrics.postMaxImages {
                    PhotosPickerButton(images: $images)
                }
            }
            Spacer()
        }
        .padding(16)
        .background(theme.color("background"))
        .onAppear {
            if let sharedContent { text = sharedContent }
        }
    }

    private func publish() async {
        publishing = true
        defer { publishing = false }
        let files: [MultipartFile] = images.compactMap { img in
            guard let data = img.jpegData(compressionQuality: 0.8) else { return nil }
            return MultipartFile(data: data, filename: "image.jpg", mimeType: "image/jpeg")
        }
        do {
            _ = try await host.core.http.execute(Operations.PublishPost(body: BodyPublishPost(
                feedId: feedId,
                content: String(text.prefix(Tokens.Metrics.postMaxLength)),
                files: files.isEmpty ? nil : files
            )))
            host.core.store.invalidate(operationId: "getLocationFeedPaginated")
            host.back()
        } catch {
            host.toast.show(host.core.l10n.t(.commonErrorTitle))
        }
    }
}

struct PhotosPickerButton: View {
    @Binding var images: [UIImage]
    @State private var show = false

    var body: some View {
        Button { show = true } label: {
            RoundedRectangle(cornerRadius: 8)
                .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [4]))
                .frame(width: CGFloat(Tokens.Metrics.postImageCell), height: CGFloat(Tokens.Metrics.postImageCell))
                .overlay(Image(systemName: "plus"))
        }
        .sheet(isPresented: $show) {
            ImagePicker { image in
                if let image { images.append(image) }
                show = false
            }
        }
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    var onPick: (UIImage?) -> Void

    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = 1
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onPick: onPick) }

    final class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let onPick: (UIImage?) -> Void
        init(onPick: @escaping (UIImage?) -> Void) { self.onPick = onPick }
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            guard let provider = results.first?.itemProvider, provider.canLoadObject(ofClass: UIImage.self) else {
                onPick(nil)
                return
            }
            provider.loadObject(ofClass: UIImage.self) { object, _ in
                DispatchQueue.main.async { self.onPick(object as? UIImage) }
            }
        }
    }
}
