# Contributing

Thanks for helping improve MXW01 Print Studio.

## Development setup

```bash
npm ci
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.node.json --noEmit
npm test -- --run
npm run test:conformance
swift test --scratch-path /Volumes/External2TB/AppData/codex/tmp/mxw01/swift
```

The web terminal is loopback-only by design. Start it with `npm run web:dev`
and use `npm run web:smoke` and `npm run web:e2e` while it is running. Hardware
printing is intentionally guarded and requires the explicit confirmation flag
documented in the main README.

## Cross-platform contract

Changes to `PrintDocument`, raster packing, protocol framing, fingerprints or
renderer behavior must update the JSON fixtures in `spec/test-vectors/` and
both TypeScript and Swift tests. Keep renderer versions and compatibility
notes explicit when printed pixels change.

## Provenance and licensing

Please do not commit generated `output/` files, local Bluetooth state, secrets
or machine-specific credentials. If a contribution copies or vendors code,
fonts, icons or protocol material, record its source and license in
[`NOTICE.md`](NOTICE.md) and include the license file where redistribution
requires it. In particular, the AGPL `dropalltables/catprinter` source is a
reference only and must not be copied into this MIT-licensed project without
relicensing permission.
