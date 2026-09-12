import Foundation
import WALCore

// walctl: headless driver for WALCore. CP0 ships the envelope, `--json`, `version` and `catalog`;
// later checkpoints add the commands listed in native/shared/cli/commands.json as the core grows.

struct Envelope<T: Encodable>: Encodable {
    let ok: Bool
    let command: String
    let data: T
}

struct ErrorEnvelope: Encodable {
    struct Failure: Encodable { let code: String; let message: String }
    let ok = false
    let command: String
    let error: Failure
}

func emit<T: Encodable>(_ value: T) {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    if let data = try? encoder.encode(value), let s = String(data: data, encoding: .utf8) {
        print(s)
    }
}

let args = Array(CommandLine.arguments.dropFirst()).filter { !$0.hasPrefix("--") }
let command = args.first ?? "help"

switch command {
case "version":
    emit(Envelope(ok: true, command: command, data: ["core": WALCoreInfo.version, "checkpoint": WALCoreInfo.checkpoint]))
case "catalog":
    struct Catalog: Encodable {
        let operations: [String]
        let routes: [String]
        let tabs: [String]
        let locales: [String]
        let translationKeys: Int
    }
    emit(Envelope(ok: true, command: command, data: Catalog(
        operations: Operations.allOperationIds,
        routes: RouteID.allCases.map(\.rawValue),
        tabs: TabID.allCases.map(\.rawValue),
        locales: L10nCatalog.supportedLocales,
        translationKeys: L10nKey.allCases.count
    )))
case "help":
    emit(Envelope(ok: true, command: command, data: ["usage": "walctl <version|catalog> [--json]"]))
default:
    emit(ErrorEnvelope(command: command, error: .init(code: "unknown_command", message: "Unknown command '\(command)'. Run `walctl help`.")))
    exit(2)
}
