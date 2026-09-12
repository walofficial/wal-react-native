import Combine
import SwiftUI
import UIKit
import WALCore

/// UIKit tab + navigation host. Beats a custom HStack tab bar and gives swipe-back, formSheet, modal.
final class WALRootController: UIViewController {
    let host: AppHost
    private let tabs = UITabBarController()
    private var navs: [TabID: UINavigationController] = [:]
    private var rendered: [TabID: [Route]] = [:]
    private var overlayNav: UINavigationController?
    private var presentedRoute: Route?
    private var gateController: UIViewController?
    private var bag = Set<AnyCancellable>()

    init(host: AppHost) {
        self.host = host
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:)") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        configureTabs()
        host.objectWillChange
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.sync() }
            .store(in: &bag)
        sync()
    }

    private func configureTabs() {
        var controllers: [UIViewController] = []
        for tab in Routes.tabs {
            let nav = UINavigationController()
            nav.setNavigationBarHidden(true, animated: false)
            nav.delegate = self
            navs[tab.id] = nav
            let item = UITabBarItem(
                title: nil,
                image: UIImage(systemName: IoniconMap.sfSymbol(for: tab.iconUnfocused)),
                selectedImage: UIImage(systemName: IoniconMap.sfSymbol(for: tab.iconFocused))
            )
            item.accessibilityIdentifier = "tab.\(tab.id.rawValue)"
            nav.tabBarItem = item
            controllers.append(nav)
        }
        tabs.viewControllers = controllers
        tabs.delegate = self
        tabs.tabBar.isTranslucent = false
        applyTabColors()
        addChild(tabs)
        view.addSubview(tabs.view)
        tabs.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            tabs.view.topAnchor.constraint(equalTo: view.topAnchor),
            tabs.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            tabs.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tabs.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        tabs.didMove(toParent: self)
    }

    func sync() {
        applyTabColors()
        switch host.gate {
        case .splash:
            showGate(RootView())
        case .signIn:
            showGate(SignInView(host: host))
        case .register:
            showGate(RegisterView(host: host))
        case .home:
            hideGate()
            tabs.view.isHidden = false
            syncTabSelection()
            syncTabStacks()
            syncOverlays()
            syncPresented()
        }
    }

    private func showGate<V: View>(_ view: V) {
        tabs.view.isHidden = true
        let hosted = hosting(view)
        if gateController != nil {
            gateController?.view.removeFromSuperview()
            gateController?.removeFromParent()
        }
        addChild(hosted)
        self.view.addSubview(hosted.view)
        hosted.view.frame = self.view.bounds
        hosted.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        hosted.didMove(toParent: self)
        gateController = hosted
    }

    private func hideGate() {
        gateController?.willMove(toParent: nil)
        gateController?.view.removeFromSuperview()
        gateController?.removeFromParent()
        gateController = nil
    }

    private func syncTabSelection() {
        let index = Routes.tabs.firstIndex(where: { $0.id == host.core.router.selectedTab }) ?? 0
        if tabs.selectedIndex != index { tabs.selectedIndex = index }
    }

    private func syncTabStacks() {
        for tab in Routes.tabs {
            guard let nav = navs[tab.id] else { continue }
            let stack = (host.core.router.stacks[stackID(for: tab.id)] ?? []).filter { route in
                switch route.descriptor.presentation {
                case .modal, .formSheet: return false
                default: return true
                }
            }
            if rendered[tab.id] == stack { continue }
            rendered[tab.id] = stack
            let vcs = stack.map { hosting(ScreenFactory.view(for: $0, host: host)) }
            nav.setViewControllers(vcs.isEmpty ? [hosting(ScreenFactory.view(for: initial(tab.id), host: host))] : vcs, animated: false)
        }
    }

    private func syncOverlays() {
        let overlay = (host.core.router.stacks[.chat] ?? []) + (host.core.router.stacks[.camera] ?? [])
            + (host.core.router.stacks[.root] ?? []).filter { $0.id != .index }
        if overlay.isEmpty {
            if overlayNav != nil {
                overlayNav?.dismiss(animated: true)
                overlayNav = nil
            }
            return
        }
        let vcs = overlay.map { hosting(ScreenFactory.view(for: $0, host: host)) }
        if let existing = overlayNav {
            existing.setViewControllers(vcs, animated: true)
        } else {
            let nav = UINavigationController()
            nav.setNavigationBarHidden(true, animated: false)
            nav.setViewControllers(vcs, animated: false)
            nav.modalPresentationStyle = .fullScreen
            overlayNav = nav
            present(nav, animated: true)
        }
    }

    private func syncPresented() {
        let presented = host.core.router.stacks[host.core.router.activeStack]?.last(where: {
            $0.descriptor.presentation == .modal || $0.descriptor.presentation == .formSheet
        })
        if presented == presentedRoute { return }
        if presentedRoute != nil, presented == nil {
            presentedRoute = nil
            if presentedViewController != overlayNav { dismiss(animated: true) }
            return
        }
        guard let route = presented else { return }
        presentedRoute = route
        let vc = hosting(ScreenFactory.view(for: route, host: host))
        let nav = UINavigationController(rootViewController: vc)
        nav.setNavigationBarHidden(true, animated: false)
        if route.descriptor.presentation == .formSheet {
            nav.modalPresentationStyle = .formSheet
            if let sheet = nav.sheetPresentationController {
                sheet.detents = [.medium(), .large()]
                sheet.prefersGrabberVisible = true
            }
        } else {
            nav.modalPresentationStyle = .pageSheet
        }
        present(nav, animated: true)
    }

    private func hosting<V: View>(_ view: V) -> UIHostingController<AnyView> {
        let root = AnyView(
            view
                .environmentObject(host)
                .environment(\.appHost, host)
                .environment(\.walTheme, host.theme)
                .preferredColorScheme(host.theme.isDark ? .dark : .light)
        )
        let vc = UIHostingController(rootView: root)
        vc.view.backgroundColor = UIColor(host.theme.color("background"))
        return vc
    }

    private func applyTabColors() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(host.theme.color("background"))
        appearance.shadowColor = .clear
        let selected = UIColor(host.theme.color("tabActive"))
        let normal = UIColor(host.theme.color("tabInactive"))
        appearance.stackedLayoutAppearance.selected.iconColor = selected
        appearance.stackedLayoutAppearance.normal.iconColor = normal
        tabs.tabBar.standardAppearance = appearance
        if #available(iOS 15.0, *) { tabs.tabBar.scrollEdgeAppearance = appearance }
        tabs.tabBar.tintColor = selected
        tabs.tabBar.unselectedItemTintColor = normal
    }

    private func stackID(for tab: TabID) -> StackID {
        switch tab {
        case .home: return .home
        case .chatList: return .chatList
        case .user: return .user
        }
    }

    private func initial(_ tab: TabID) -> Route {
        switch tab {
        case .home: return .homeIndex
        case .chatList: return .chatList
        case .user: return .userIndex
        }
    }
}

extension WALRootController: UITabBarControllerDelegate {
    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        guard let index = tabBarController.viewControllers?.firstIndex(of: viewController),
              Routes.tabs.indices.contains(index)
        else { return true }
        let tab = Routes.tabs[index].id
        if tab == host.core.router.selectedTab, tab == .user {
            host.select(.user)
            return false
        }
        host.select(tab)
        return true
    }
}

extension WALRootController: UINavigationControllerDelegate {
    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
        guard let tab = navs.first(where: { $0.value === navigationController })?.key else { return }
        let expected = (host.core.router.stacks[stackID(for: tab)] ?? []).filter {
            $0.descriptor.presentation != .modal && $0.descriptor.presentation != .formSheet
        }
        if navigationController.viewControllers.count < expected.count {
            host.back()
        }
    }
}

struct WALRootRepresentable: UIViewControllerRepresentable {
    @ObservedObject var host: AppHost

    func makeUIViewController(context: Context) -> WALRootController {
        WALRootController(host: host)
    }

    func updateUIViewController(_ uiViewController: WALRootController, context: Context) {
        uiViewController.sync()
    }
}

