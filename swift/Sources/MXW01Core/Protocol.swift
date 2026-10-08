import Foundation

public enum MXW01Command: UInt8, Sendable {
    case getStatus = 0xa1
    case setIntensity = 0xa2
    case printRequest = 0xa9
    case printComplete = 0xaa
    case flushData = 0xad
}

public enum MXW01ProtocolError: Error, Equatable {
    case malformedFrame
    case checksumMismatch
    case missingTerminator
}

public enum MXW01Protocol {
    public static let header: [UInt8] = [0x22, 0x21]
    public static let terminator: UInt8 = 0xff

    public static func crc8(_ bytes: some Sequence<UInt8>) -> UInt8 {
        var crc: UInt8 = 0
        for byte in bytes {
            crc ^= byte
            for _ in 0..<8 {
                crc = (crc & 0x80) == 0 ? (crc << 1) : ((crc << 1) ^ 0x07)
            }
        }
        return crc
    }

    public static func makeCommand(_ command: MXW01Command, payload: [UInt8] = []) -> [UInt8] {
        let length = payload.count
        var frame: [UInt8] = header + [command.rawValue, 0, UInt8(length & 0xff), UInt8((length >> 8) & 0xff)] + payload
        frame.append(crc8(payload))
        frame.append(terminator)
        return frame
    }

    public static func parseFrame(_ frame: [UInt8], requireTrailer: Bool = true) throws -> (command: UInt8, payload: [UInt8]) {
        guard frame.count >= 6, frame[0] == header[0], frame[1] == header[1] else { throw MXW01ProtocolError.malformedFrame }
        let length = Int(frame[4]) | (Int(frame[5]) << 8)
        let payloadEnd = 6 + length
        guard frame.count >= payloadEnd else { throw MXW01ProtocolError.malformedFrame }
        guard requireTrailer else { return (frame[2], Array(frame[6..<payloadEnd])) }
        guard frame.count >= payloadEnd + 2 else { throw MXW01ProtocolError.malformedFrame }
        guard frame[payloadEnd + 1] == terminator else { throw MXW01ProtocolError.missingTerminator }
        let payload = Array(frame[6..<payloadEnd])
        guard frame[payloadEnd] == crc8(payload) else { throw MXW01ProtocolError.checksumMismatch }
        return (frame[2], payload)
    }
}
