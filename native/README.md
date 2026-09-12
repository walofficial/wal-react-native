# WAL native

Native ports of the WAL app. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design,
[`docs/CHECKLIST.md`](docs/CHECKLIST.md) for the parity contract and
[`docs/review-log.md`](docs/review-log.md) for checkpoint reviews.

## Quick start (Linux or macOS)

```bash
cd native/shared/codegen && npm ci && npm run gen && npm run check:drift
cd ../../ios/WALCore && swift build && swift test
swift run walctl catalog
```

## iOS app (macOS + Xcode 27)

```bash
brew install xcodegen
cd native/ios && xcodegen generate && open WAL.xcodeproj
```

Requires libsodium (`brew install libsodium` / `apt-get install libsodium-dev`) for `WALCrypto`.
