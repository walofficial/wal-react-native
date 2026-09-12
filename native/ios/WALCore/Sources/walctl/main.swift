import Foundation
import WALCore

var mode = RuntimeMode.mock
var apiURL = URL(string: "https://mnt-api-880207287631.europe-west3.run.app")!
var fixtures = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    .appendingPathComponent("native/shared/fixtures")
var positional: [String] = []

var args = Array(CommandLine.arguments.dropFirst())
var i = 0
while i < args.count {
    let a = args[i]
    if a == "--mode", i + 1 < args.count {
        mode = RuntimeMode(rawValue: args[i + 1]) ?? .mock
        i += 2
    } else if a == "--api-url", i + 1 < args.count {
        apiURL = URL(string: args[i + 1]) ?? apiURL
        i += 2
    } else if a == "--fixtures", i + 1 < args.count {
        fixtures = URL(fileURLWithPath: args[i + 1])
        i += 2
    } else if a == "--json" || a == "--remote-url" {
        i += a == "--remote-url" ? 2 : 1
    } else if a.hasPrefix("--") {
        fputs("unknown flag \(a)\n", stderr)
        exit(2)
    } else {
        positional.append(a)
        i += 1
    }
}

let core = AppCore(mode: mode, apiURL: apiURL, fixtures: fixtures)
let result = CommandRunner(core: core).run(positional)
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
if let data = try? encoder.encode(result), let s = String(data: data, encoding: .utf8) {
    print(s)
}
if !result.ok { exit(2) }
