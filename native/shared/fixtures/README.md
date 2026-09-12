# Shared fixtures

Language-neutral test data consumed by both native cores (WALCore on iOS, the Kotlin core later) and by
`walctl --mode mock`.

```
fixtures/
  api/          canned JSON responses keyed by operationId (e.g. api/getLocationFeeds.json)
  scenarios/    step lists that drive the headless core: { "steps": [{ "command": "...", "args": {...}, "expect": {...} }] }
```

Rules

- Every file under `api/` must decode with the generated DTO for its operationId (enforced by
  `WALCoreTests/FixtureDecodingTests`).
- Scenarios use the command vocabulary from `native/shared/cli/commands.json`; the same files run on
  every platform.
- Fixtures are recorded from the real backend (with ids/phones scrubbed), never hand-typed, so shapes
  stay honest.
