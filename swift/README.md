# MXW01 Swift boundary

`MXW01Core` contains Codable document values, canonical fingerprints, protocol
framing and raster packing. `MXW01CoreBluetooth` is the iOS/macOS adapter
boundary; it intentionally does not leak CoreBluetooth into the shared value
types.

The package is kept beside the TypeScript implementation until the Swift
renderer and CoreBluetooth transport are ready for production use. The shared
fixtures in `spec/test-vectors/` are the compatibility contract.
