import Foundation

public struct RasterProfile: Equatable, Sendable {
    public var widthDots: Int
    public var bytesPerRow: Int
    public var minimumRows: Int

    public init(widthDots: Int, bytesPerRow: Int, minimumRows: Int) {
        self.widthDots = widthDots
        self.bytesPerRow = bytesPerRow
        self.minimumRows = minimumRows
    }

    public static let mxw01 = RasterProfile(widthDots: 384, bytesPerRow: 48, minimumRows: 90)
}

public struct RasterPage: Equatable, Sendable {
    public var widthDots: Int
    public var contentHeightRows: Int
    public var wireHeightRows: Int
    public var bytesPerRow: Int
    public var data: Data

    public init(widthDots: Int, contentHeightRows: Int, wireHeightRows: Int, bytesPerRow: Int, data: Data) {
        self.widthDots = widthDots
        self.contentHeightRows = contentHeightRows
        self.wireHeightRows = wireHeightRows
        self.bytesPerRow = bytesPerRow
        self.data = data
    }
}

/// Packs black dot positions into the MXW01 LSB-first, black-is-one wire format.
public func packMonoRaster(profile: RasterProfile, contentHeightRows: Int, rows: [[Int]]) -> RasterPage {
    let contentRows = max(1, contentHeightRows)
    let wireRows = max(contentRows, profile.minimumRows)
    var bytes = Data(repeating: 0, count: wireRows * profile.bytesPerRow)
    for (rowIndex, dots) in rows.prefix(contentRows).enumerated() {
        for dot in dots where dot >= 0 && dot < profile.widthDots {
            let offset = rowIndex * profile.bytesPerRow + dot / 8
            bytes[offset] |= UInt8(1 << (dot % 8))
        }
    }
    return RasterPage(widthDots: profile.widthDots, contentHeightRows: contentRows, wireHeightRows: wireRows, bytesPerRow: profile.bytesPerRow, data: bytes)
}
