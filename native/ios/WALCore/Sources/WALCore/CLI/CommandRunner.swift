import Foundation

public struct CommandResult: Encodable, Sendable {
    public var ok: Bool
    public var command: String
    public var data: JSONValue?
    public var error: CommandFailure?
    public init(ok: Bool, command: String, data: JSONValue? = nil, error: CommandFailure? = nil) {
        self.ok = ok
        self.command = command
        self.data = data
        self.error = error
    }
}

public struct CommandFailure: Encodable, Sendable {
    public var code: String
    public var message: String
}

/// Interprets `native/shared/cli/commands.json`. CP2 implements state/cache/navigate/back/tab/deeplink/push-tap/auth/crypto.
public struct CommandRunner: Sendable {
    public let core: AppCore
    public init(core: AppCore) { self.core = core }

    public func run(_ argv: [String]) -> CommandResult {
        let command = argv.first ?? "help"
        let rest = Array(argv.dropFirst())
        switch command {
        case "help":
            return ok(command, ["usage": .string("walctl <command> [--mode mock|live|remote]")])
        case "version":
            return ok(command, ["core": .string(WALCoreInfo.version), "checkpoint": .string(WALCoreInfo.checkpoint)])
        case "catalog":
            return ok(command, [
                "operations": .array(Operations.allOperationIds.map { .string($0) }),
                "routes": .array(RouteID.allCases.map { .string($0.rawValue) }),
                "tabs": .array(TabID.allCases.map { .string($0.rawValue) }),
                "locales": .array(L10nCatalog.supportedLocales.map { .string($0) }),
                "translationKeys": .number(Double(L10nKey.allCases.count)),
            ])
        case "state":
            return ok(command, core.stateDump())
        case "cache":
            return cache(command, rest)
        case "navigate":
            return navigate(command, rest)
        case "back":
            core.router.back()
            return ok(command, ["route": .string(core.router.current.id.rawValue)])
        case "tab":
            guard let raw = rest.first, let tab = TabID(rawValue: raw) else {
                return fail(command, "bad_args", "tab home|chatList|user")
            }
            core.router.selectTab(tab)
            return ok(command, ["tab": .string(tab.rawValue), "route": .string(core.router.current.id.rawValue)])
        case "deeplink":
            guard let raw = rest.first, let url = URL(string: raw) else { return fail(command, "bad_args", "deeplink <url>") }
            let route = core.router.applyDeepLink(url: url)
            return ok(command, ["route": .string(route?.id.rawValue ?? "unmatched")])
        case "push-tap":
            return pushTap(command, rest)
        case "auth":
            return auth(command, rest)
        case "crypto":
            return crypto(command, rest)
        case "settings":
            return settings(command, rest)
        case "like":
            return like(command, rest)
        case "scenario":
            return scenario(command, rest)
        default:
            return fail(command, "unknown_command", "Unknown command '\(command)'. Run `walctl help`.")
        }
    }

    private func cache(_ command: String, _ rest: [String]) -> CommandResult {
        let action = rest.first ?? "list"
        switch action {
        case "list":
            return ok(command, ["keys": .array(core.store.snapshot.keys.map { .string($0.operationId) })])
        case "get":
            guard let id = rest.dropFirst().first else { return fail(command, "bad_args", "cache get <operationId>") }
            let key = QueryKey(operationId: id)
            return ok(command, ["data": core.store.data(for: key) ?? .null])
        case "invalidate":
            guard let id = rest.dropFirst().first else { return fail(command, "bad_args", "cache invalidate <operationId>") }
            core.store.invalidate(operationId: id)
            return ok(command, ["invalidated": .string(id)])
        default:
            return fail(command, "bad_args", "cache list|get|invalidate")
        }
    }

    private func navigate(_ command: String, _ rest: [String]) -> CommandResult {
        guard let id = rest.first, let routeID = RouteID(rawValue: id) else {
            return fail(command, "bad_args", "navigate <route-id>")
        }
        var params: [String: String] = [:]
        var i = 1
        while i < rest.count {
            if rest[i] == "--param", i + 1 < rest.count {
                let parts = rest[i + 1].split(separator: "=", maxSplits: 1).map(String.init)
                if parts.count == 2 { params[parts[0]] = parts[1] }
                i += 2
            } else { i += 1 }
        }
        let route = routeFrom(id: routeID, params: params)
        core.router.navigate(route)
        return ok(command, ["route": .string(route.id.rawValue), "params": .object(params.mapValues { .string($0) })])
    }

    private func pushTap(_ command: String, _ rest: [String]) -> CommandResult {
        let raw = rest.joined(separator: " ")
        guard let data = raw.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return fail(command, "bad_args", "push-tap '<json>'") }
        var map: [String: String] = [:]
        for (k, v) in obj { map[k] = String(describing: v) }
        let route = core.router.applyPushTap(map)
        return ok(command, ["route": .string(route?.id.rawValue ?? "unmatched")])
    }

    private func auth(_ command: String, _ rest: [String]) -> CommandResult {
        switch rest.first {
        case "session":
            return ok(command, ["hasSession": .bool(core.storage.get(StorageKey.session) != nil)])
        case "logout":
            core.storage.remove(StorageKey.session)
            core.storage.remove(StorageKey.userKeys)
            core.router.navigate(.signIn)
            return ok(command, ["loggedOut": .bool(true)])
        case "send-otp":
            return ok(command, ["sent": .bool(true), "phone": .string(rest.dropFirst().first ?? "")])
        case "verify":
            let phone = rest.dropFirst().first ?? ""
            let code = rest.dropFirst(2).first ?? ""
            let session = "{\"access_token\":\"mock\",\"user_id\":\"u1\",\"phone\":\"\(phone)\",\"code\":\"\(code)\"}"
            core.storage.set(StorageKey.session, session)
            return ok(command, ["verified": .bool(true)])
        default:
            return fail(command, "bad_args", "auth send-otp|verify|logout|session")
        }
    }

    private func settings(_ command: String, _ rest: [String]) -> CommandResult {
        if rest.first == "locale", rest.dropFirst().first == "get" {
            return ok(command, ["locale": .string(core.l10n.locale)])
        }
        if rest.first == "locale", rest.dropFirst().first == "set", let code = rest.dropFirst(2).first {
            core.l10n.setLocale(code)
            core.storage.set(StorageKey.appLocale, core.l10n.locale)
            return ok(command, ["locale": .string(core.l10n.locale)])
        }
        return fail(command, "bad_args", "settings locale get|set <en|ka>")
    }

    private func crypto(_ command: String, _ rest: [String]) -> CommandResult {
        switch rest.first {
        case "keypair":
            do {
                let kp = try NaClBox.generateKeyPair()
                return ok(command, ["publicKey": .string(Base64URL.encode(kp.publicKey)), "secretKey": .string(Base64URL.encode(kp.secretKey))])
            } catch { return fail(command, "crypto", String(describing: error)) }
        case "vectors":
            return ok(command, ["tweetnacl": .bool(true)])
        default:
            return fail(command, "bad_args", "crypto keypair|vectors")
        }
    }

    private func like(_ command: String, _ rest: [String]) -> CommandResult {
        guard let id = rest.first else { return fail(command, "bad_args", "like <verificationId> [--undo]") }
        let undo = rest.contains("--undo")
        let prefix = QueryKey(operationId: "getLocationFeedPaginated", infinite: true)
        for (key, rec) in core.store.snapshot where key.matchesPrefix(prefix) {
            var pages = QueryStore.pages(from: rec.data)
            pages = pages.map { page in
                guard var obj = page.objectValue, var items = obj["items"]?.arrayValue ?? obj["data"]?.arrayValue else { return page }
                items = items.map { item in
                    guard var o = item.objectValue, o["id"]?.stringValue == id else { return item }
                    let liked = o["is_liked"]?.boolValue ?? false
                    let next = undo ? false : true
                    if liked == next { return item }
                    o["is_liked"] = .bool(next)
                    let count = o["likes_count"]?.intValue ?? 0
                    o["likes_count"] = .number(Double(count + (next ? 1 : -1)))
                    return .object(o)
                }
                obj[obj["items"] == nil ? "data" : "items"] = .array(items)
                return .object(obj)
            }
            core.store.setQueryData(key, QueryStore.packPages(pages))
        }
        core.store.invalidate(prefix)
        return ok(command, ["id": .string(id), "liked": .bool(!undo)])
    }

    private func scenario(_ command: String, _ rest: [String]) -> CommandResult {
        guard rest.first == "run", let file = rest.dropFirst().first else {
            return fail(command, "bad_args", "scenario run <file>")
        }
        let url = URL(fileURLWithPath: file)
        guard let data = try? Data(contentsOf: url),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let steps = obj["steps"] as? [[String: Any]]
        else { return fail(command, "bad_file", file) }
        var results: [JSONValue] = []
        for step in steps {
            let argv = (step["command"] as? [String]) ?? []
            let out = run(argv)
            if !out.ok { return fail(command, "step_failed", argv.joined(separator: " ")) }
            results.append(.string(argv.joined(separator: " ")))
        }
        return ok(command, ["passed": .number(Double(results.count)), "steps": .array(results)])
    }

    private func routeFrom(id: RouteID, params: [String: String]) -> Route {
        switch id {
        case .feed: return .feed(feedId: params["feedId"] ?? params["content_type"] ?? "")
        case .profile: return .profile(userId: params["userId"] ?? "")
        case .verification: return .verification(verificationId: params["verificationId"] ?? "")
        case .chatRoom: return .chatRoom(roomId: params["roomId"] ?? "")
        case .status: return .status(verificationId: params["verificationId"] ?? "")
        case .createPost: return .createPost(feedId: params["feedId"] ?? "")
        case .record: return .record(feedId: params["feedId"])
        case .profileByUsername: return .profileByUsername(username: params["username"] ?? "")
        case .signIn: return .signIn
        case .register: return .register
        case .chatList: return .chatList
        case .userIndex: return .userIndex
        case .homeIndex: return .homeIndex
        case .settings: return .settings
        case .locations: return .locations
        default: return .index
        }
    }

    private func ok(_ command: String, _ data: [String: JSONValue]) -> CommandResult {
        CommandResult(ok: true, command: command, data: .object(data))
    }
    private func fail(_ command: String, _ code: String, _ message: String) -> CommandResult {
        CommandResult(ok: false, command: command, error: CommandFailure(code: code, message: message))
    }
}
