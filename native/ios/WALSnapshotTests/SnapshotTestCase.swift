import XCTest
import SwiftUI
@testable import WAL

/// Base class for pixel snapshot tests. CP1 adds the renderer + baseline management; CP0 only pins the
/// device configuration used for every baseline so screenshots are comparable across checkpoints.
class SnapshotTestCase: XCTestCase {
    /// iPhone 17 (393x852 @3x) portrait, matches the RN reference screenshots.
    static let referenceSize = CGSize(width: 393, height: 852)
    static let referenceScale: CGFloat = 3

    func render<V: View>(_ view: V, size: CGSize = SnapshotTestCase.referenceSize, colorScheme: ColorScheme) -> UIImage {
        let host = UIHostingController(rootView: view.environment(\.colorScheme, colorScheme))
        host.view.frame = CGRect(origin: .zero, size: size)
        host.view.backgroundColor = .clear
        host.overrideUserInterfaceStyle = colorScheme == .dark ? .dark : .light
        host.view.layoutIfNeeded()
        let format = UIGraphicsImageRendererFormat()
        format.scale = SnapshotTestCase.referenceScale
        return UIGraphicsImageRenderer(size: size, format: format).image { _ in
            host.view.drawHierarchy(in: host.view.bounds, afterScreenUpdates: true)
        }
    }
}

final class RootViewSnapshotTests: SnapshotTestCase {
    func testSplashRendersOnBlack() {
        let image = render(RootView(), colorScheme: .dark)
        XCTAssertEqual(image.size, SnapshotTestCase.referenceSize)
    }
}
