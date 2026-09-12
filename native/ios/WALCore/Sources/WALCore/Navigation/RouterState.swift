import Foundation

/// Headless replica of the Expo Router tree: one stack per `StackID`, plus the selected tab.
/// UIKit (CP4) and walctl both mutate this; screens only read it.
public final class RouterState: @unchecked Sendable {
    public private(set) var stacks: [StackID: [Route]]
    public private(set) var selectedTab: TabID
    public private(set) var sheets: [String]

    public init(selectedTab: TabID = .home) {
        self.selectedTab = selectedTab
        self.sheets = []
        var stacks: [StackID: [Route]] = [:]
        for id in StackID.allCases { stacks[id] = [] }
        stacks[.root] = [.index]
        stacks[.home] = [.homeIndex]
        stacks[.chatList] = [.chatList]
        stacks[.user] = [.userIndex]
        self.stacks = stacks
    }

    public var current: Route {
        if let top = stacks[.root]?.last, top.id != .index { return top }
        return stacks[activeStack]?.last ?? .index
    }

    public var activeStack: StackID {
        switch selectedTab {
        case .home: return .home
        case .chatList: return .chatList
        case .user: return .user
        }
    }

    public func navigate(_ route: Route) {
        let dest = route.descriptor
        if dest.presentation == .replace {
            stacks[dest.stack] = [route]
            return
        }
        if dest.stack == .homeOrUser {
            var stack = stacks[activeStack] ?? []
            stack.append(route)
            stacks[activeStack] = stack
            return
        }
        if dest.stack == .root || dest.stack == .auth || dest.stack == .chat || dest.stack == .camera {
            var stack = stacks[dest.stack] ?? []
            stack.append(route)
            stacks[dest.stack] = stack
            return
        }
        var stack = stacks[dest.stack] ?? []
        stack.append(route)
        stacks[dest.stack] = stack
        if dest.stack == .home { selectedTab = .home }
        if dest.stack == .chatList { selectedTab = .chatList }
        if dest.stack == .user { selectedTab = .user }
    }

    public func back() {
        for stackID in [StackID.camera, .chat, .auth, .root] {
            if var s = stacks[stackID], s.count > 1 {
                s.removeLast()
                stacks[stackID] = s
                return
            }
            if stackID != .root, var s = stacks[stackID], s.count == 1 {
                stacks[stackID] = []
                return
            }
        }
        var s = stacks[activeStack] ?? []
        if s.count > 1 { s.removeLast(); stacks[activeStack] = s }
    }

    public func selectTab(_ tab: TabID) {
        selectedTab = tab
        if let desc = Routes.tabs.first(where: { $0.id == tab }), desc.tabPressResetsStack {
            stacks[.user] = [.userIndex]
        }
    }

    public func presentSheet(_ name: String) { if !sheets.contains(name) { sheets.append(name) } }
    public func dismissSheet(_ name: String? = nil) {
        if let name { sheets.removeAll { $0 == name } } else if !sheets.isEmpty { sheets.removeLast() }
    }

    public func applyDeepLink(url: URL) -> Route? {
        let path = url.path.isEmpty ? (url.host.map { "/\($0)" } ?? "/") : url.path
        for pattern in Routes.deepLinkPatterns {
            if let params = match(path, pattern: pattern.match) {
                if pattern.route == "status", let id = params["verificationId"] {
                    let route = Route.status(verificationId: id)
                    navigate(route)
                    return route
                }
                if pattern.route == "profileByUsername", let username = params["username"] {
                    let route = Route.profileByUsername(username: username)
                    navigate(route)
                    return route
                }
            }
        }
        return nil
    }

    public func applyPushTap(_ data: [String: String]) -> Route? {
        for rule in Routes.pushRouting {
            if rule.type != "*", data["type"] != rule.type { continue }
            if rule.requires.contains(where: { data[$0] == nil }) { continue }
            let route: Route
            switch rule.route {
            case .verification: route = .verification(verificationId: data["verificationId"] ?? "")
            case .chatRoom: route = .chatRoom(roomId: data["roomId"] ?? "")
            case .feed: route = .feed(feedId: data["feedId"] ?? "")
            case .status: route = .status(verificationId: data["verificationId"] ?? "")
            case .chatList: route = .chatList
            default: continue
            }
            navigate(route)
            return route
        }
        return nil
    }

    private func match(_ path: String, pattern: String) -> [String: String]? {
        let pSegs = pattern.split(separator: "/").map(String.init)
        let aSegs = path.split(separator: "/").map(String.init)
        guard pSegs.count == aSegs.count else { return nil }
        var params: [String: String] = [:]
        for (p, a) in zip(pSegs, aSegs) {
            if p.hasPrefix("{"), p.hasSuffix("}") {
                params[String(p.dropFirst().dropLast())] = a
            } else if p != a { return nil }
        }
        return params
    }
}
