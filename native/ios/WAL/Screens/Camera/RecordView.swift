import AVFoundation
import SwiftUI
import WALCore

struct RecordView: View {
    @ObservedObject var host: AppHost
    var feedId: String?
    var chatMode: Bool = false
    var roomId: String?
    var recipientId: String?
    @Environment(\.walTheme) private var theme
    @StateObject private var camera = CameraController()

    var body: some View {
        ZStack {
            CameraPreview(session: camera.session).ignoresSafeArea()
            VStack {
                HStack {
                    Button { host.back() } label: {
                        Image(systemName: "xmark").font(.system(size: 22)).foregroundColor(.white).padding()
                    }
                    Spacer()
                    if !chatMode {
                        Picker("", selection: $camera.mode) {
                            Text(host.core.l10n.t(.commonPhoto)).tag(CameraController.Mode.photo)
                            Text(host.core.l10n.t(.commonVideo)).tag(CameraController.Mode.video)
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 160)
                    }
                }
                Spacer()
                Button { Task { await capture() } } label: {
                    Circle()
                        .strokeBorder(Color.white, lineWidth: camera.mode == .video && camera.recording ? 8 : 4)
                        .background(Circle().fill(camera.recording ? Color.red : Color.white.opacity(0.3)))
                        .frame(width: CGFloat(Tokens.Metrics.captureButtonSize), height: CGFloat(Tokens.Metrics.captureButtonSize))
                }
                .padding(.bottom, 32)
            }
        }
        .onAppear { camera.start() }
        .onDisappear { camera.stop() }
    }

    private func capture() async {
        if camera.mode == .video {
            if camera.recording {
                if let url = await camera.stopRecording() {
                    host.navigate(.mediaPage(feedId: feedId, path: url.path, type: "video", chatMode: chatMode, roomId: roomId, recipientId: recipientId))
                }
            } else {
                camera.startRecording()
            }
        } else if let url = await camera.takePhoto() {
            host.navigate(.mediaPage(feedId: feedId, path: url.path, type: "photo", chatMode: chatMode, roomId: roomId, recipientId: recipientId))
        }
    }
}

final class CameraController: NSObject, ObservableObject, AVCapturePhotoCaptureDelegate, AVCaptureFileOutputRecordingDelegate {
    enum Mode: Hashable { case photo, video }
    let session = AVCaptureSession()
    private let photo = AVCapturePhotoOutput()
    private let movie = AVCaptureMovieFileOutput()
    @Published var mode: Mode = .photo
    @Published var recording = false
    private var photoCont: CheckedContinuation<URL?, Never>?
    private var movieCont: CheckedContinuation<URL?, Never>?

    func start() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: configure()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] ok in
                if ok { DispatchQueue.main.async { self?.configure() } }
            }
        default: break
        }
    }

    func stop() { session.stopRunning() }

    private func configure() {
        session.beginConfiguration()
        session.sessionPreset = .hd1920x1080
        if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
           let input = try? AVCaptureDeviceInput(device: device),
           session.canAddInput(input) {
            session.addInput(input)
        }
        if session.canAddOutput(photo) { session.addOutput(photo) }
        if session.canAddOutput(movie) { session.addOutput(movie) }
        session.commitConfiguration()
        DispatchQueue.global(qos: .userInitiated).async { self.session.startRunning() }
    }

    func takePhoto() async -> URL? {
        await withCheckedContinuation { cont in
            photoCont = cont
            photo.capturePhoto(with: AVCapturePhotoSettings(), delegate: self)
        }
    }

    func startRecording() {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).mp4")
        movie.startRecording(to: url, recordingDelegate: self)
        recording = true
    }

    func stopRecording() async -> URL? {
        await withCheckedContinuation { cont in
            movieCont = cont
            movie.stopRecording()
        }
    }

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let data = photo.fileDataRepresentation() else { photoCont?.resume(returning: nil); return }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).jpg")
        try? data.write(to: url)
        photoCont?.resume(returning: url)
        photoCont = nil
    }

    func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        recording = false
        movieCont?.resume(returning: error == nil ? outputFileURL : nil)
        movieCont = nil
    }
}

struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession
    func makeUIView(context: Context) -> PreviewView {
        let v = PreviewView()
        v.preview.session = session
        v.preview.videoGravity = .resizeAspectFill
        return v
    }
    func updateUIView(_ uiView: PreviewView, context: Context) {}
    final class PreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var preview: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    }
}

struct MediaReviewView: View {
    @ObservedObject var host: AppHost
    var feedId: String?
    var path: String
    var type: String
    var chatMode: Bool
    var roomId: String?
    var recipientId: String?
    @Environment(\.walTheme) private var theme
    @State private var caption = ""

    var body: some View {
        VStack(spacing: 12) {
            SimpleHeader(title: host.core.l10n.t(.commonAddCaption), onBack: { host.back() })
            if type == "photo", let img = UIImage(contentsOfFile: path) {
                Image(uiImage: img).resizable().scaledToFit()
            } else {
                Text(type).frame(maxHeight: .infinity)
            }
            TextField(host.core.l10n.t(.commonAddCaption), text: $caption)
                .padding(12)
                .background(theme.color("inputBackground"))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            Button {
                host.toast.show(host.core.l10n.t(.commonUploading))
                host.back()
            } label: {
                Text(host.core.l10n.t(.commonPublish))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(Color(hex: "#007AFF"))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .background(theme.color("background"))
    }
}
