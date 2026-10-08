import Foundation

public enum MXW01Fingerprint {
    /// The shared identity format is FNV-1a over canonical UTF-8 JSON.
    /// Foundation's sortedKeys encoder is intentionally used here so the same
    /// value model can be tested against the JavaScript vectors.
    public static func canonicalJSON<T: Encodable>(_ value: T) throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        return try encoder.encode(value)
    }

    public static func fnv1a32(_ data: Data) -> UInt32 {
        var hash: UInt32 = 0x811c9dc5
        for byte in data {
            hash ^= UInt32(byte)
            hash = hash &* 0x01000193
        }
        return hash
    }

    public static func fingerprint<T: Encodable>(_ value: T) throws -> String {
        let hash = fnv1a32(try canonicalJSON(value))
        return String(format: "fnv1a32-%08x", hash)
    }
}
