import XCTest
@testable import MXW01Core

final class MXW01CoreTests: XCTestCase {
    func testStatusCommandMatchesSharedVector() {
        XCTAssertEqual(
            MXW01Protocol.makeCommand(.getStatus, payload: [0]),
            [0x22, 0x21, 0xa1, 0x00, 0x01, 0x00, 0x00, 0x00, 0xff]
        )
    }

    func testRasterUsesLSBFirstAndMinimumWireRows() {
        let raster = packMonoRaster(profile: .mxw01, contentHeightRows: 1, rows: [[0, 7, 8, 383]])
        XCTAssertEqual(raster.wireHeightRows, 90)
        XCTAssertEqual(Array(raster.data.prefix(2)), [0x81, 0x01])
        XCTAssertEqual(raster.data[raster.bytesPerRow - 1], 0x80)
    }

    func testFingerprintVectorForTextA() throws {
        let document = PrintDocument(
            page: PrintPage(widthDots: 16, heightDots: 8),
            nodes: [PrintNode(id: "title", kind: "text", x: 0, y: 0, width: 5, height: 7, text: "A")]
        )
        XCTAssertEqual(try MXW01Fingerprint.fingerprint(document), "fnv1a32-72025961")
    }
}
