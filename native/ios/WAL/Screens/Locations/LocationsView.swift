import SwiftUI
import WALCore

struct LocationsView: View {
    @ObservedObject var host: AppHost
    @Environment(\.walTheme) private var theme
    @State private var nearby: [JSONValue] = []
    @State private var atLocation: [JSONValue] = []

    var body: some View {
        VStack(spacing: 0) {
            SimpleHeader(title: host.core.l10n.t(.commonLocations), onBack: { host.back() })
            if nearby.isEmpty && atLocation.isEmpty {
                VStack(spacing: 8) {
                    Spacer()
                    Text(host.core.l10n.t(.commonNoLocationsFound))
                    Text(host.core.l10n.t(.commonNoLocationsFoundDescription))
                        .font(.caption)
                        .foregroundColor(theme.color("feedItemSecondaryText"))
                    Spacer()
                }
            } else {
                List {
                    if !atLocation.isEmpty {
                        Section(host.core.l10n.t(.commonLocationsNearby)) {
                            ForEach(Array(atLocation.enumerated()), id: \.offset) { _, feed in
                                row(feed)
                            }
                        }
                    }
                    if !nearby.isEmpty {
                        Section(host.core.l10n.t(.commonLocationsFar)) {
                            ForEach(Array(nearby.enumerated()), id: \.offset) { _, item in
                                row(item["feed"] ?? item)
                            }
                        }
                    }
                }
                .listStyle(.plain)
            }
        }
        .background(theme.color("background"))
        .task { await load() }
    }

    private func row(_ feed: JSONValue) -> some View {
        Button {
            if let id = feed["id"]?.stringValue {
                host.core.router.dismissSheet()
                host.navigate(.feed(feedId: id))
            }
        } label: {
            HStack {
                Text(feed["display_name"]?.stringValue ?? feed["feed_title"]?.stringValue ?? "")
                Spacer()
                Image(systemName: "chevron.right")
            }
        }
        .foregroundColor(theme.color("text"))
    }

    private func load() async {
        do {
            let json = try await host.core.http.executeJSON(Operations.GetLocationFeeds(
                query: .init(categoryId: "news", ignoreLocationCheck: false)
            ))
            atLocation = json["feeds_at_location"]?.arrayValue ?? []
            nearby = json["nearest_feeds"]?.arrayValue ?? []
        } catch {
            if host.core.mode == .mock {
                atLocation = [["id": "feed-1", "display_name": "Tbilisi", "feed_title": "Tbilisi"]]
            }
        }
    }
}
