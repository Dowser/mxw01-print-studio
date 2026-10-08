import Foundation
import MXW01Core

#if canImport(CoreBluetooth)
import CoreBluetooth

/// The CoreBluetooth target owns discovery and characteristic mapping. The
/// actual printer driver stays in MXW01Core, making this boundary usable from
/// SwiftUI without leaking CoreBluetooth types into the document model.
public final class CoreBluetoothTransport: NSObject {
    public let serviceUUID: CBUUID?

    public init(serviceUUID: CBUUID? = nil) {
        self.serviceUUID = serviceUUID
        super.init()
    }
}
#else

/// Keeps the package buildable on Linux and in CI while the iOS adapter is
/// compiled only on Apple platforms.
public struct CoreBluetoothTransport: Sendable {
    public init() {}
}
#endif
