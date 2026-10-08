import Foundation

public struct PrintMargins: Codable, Equatable, Sendable {
    public var top: Int
    public var right: Int
    public var bottom: Int
    public var left: Int

    public init(top: Int = 0, right: Int = 0, bottom: Int = 0, left: Int = 0) {
        self.top = top
        self.right = right
        self.bottom = bottom
        self.left = left
    }
}

public struct PrintMedia: Codable, Equatable, Sendable {
    public var kind: String
    public var color: String
    public var labelHeightDots: Int?
    public var gapDots: Int?
    public var profileId: String?

    public init(kind: String = "continuous", color: String = "white", labelHeightDots: Int? = nil, gapDots: Int? = nil, profileId: String? = nil) {
        self.kind = kind
        self.color = color
        self.labelHeightDots = labelHeightDots
        self.gapDots = gapDots
        self.profileId = profileId
    }
}

public struct PrintPage: Codable, Equatable, Sendable {
    public var widthDots: Int
    public var heightDots: Int
    public var margins: PrintMargins
    public var media: PrintMedia?

    public init(widthDots: Int, heightDots: Int, margins: PrintMargins = .init(), media: PrintMedia? = nil) {
        self.widthDots = widthDots
        self.heightDots = heightDots
        self.margins = margins
        self.media = media
    }
}

public struct ChecklistItem: Codable, Equatable, Sendable {
    public var text: String
    public var checked: Bool?

    public init(text: String, checked: Bool? = nil) {
        self.text = text
        self.checked = checked
    }
}

public struct PrintImage: Codable, Equatable, Sendable {
    public var width: Int
    public var height: Int
    public var dataBase64: String

    public init(width: Int, height: Int, dataBase64: String) {
        self.width = width
        self.height = height
        self.dataBase64 = dataBase64
    }
}

/// A deliberately boring Codable node model. Unknown JSON fields are ignored,
/// which lets Swift consume documents produced by the web editor while keeping
/// the transport boundary independent from UIKit, SwiftUI and CoreBluetooth.
public struct PrintNode: Codable, Equatable, Sendable {
    public var id: String
    public var kind: String
    public var x: Int
    public var y: Int
    public var width: Int
    public var height: Int
    public var text: String?
    public var value: String?
    public var format: String?
    public var fontId: String?
    public var fontSizeDots: Int?
    public var showText: Bool?
    public var iconId: String?
    public var rotation: Int?
    public var image: PrintImage?
    public var items: [ChecklistItem]?

    public init(id: String, kind: String, x: Int, y: Int, width: Int, height: Int, text: String? = nil, value: String? = nil, format: String? = nil, fontId: String? = nil, fontSizeDots: Int? = nil, showText: Bool? = nil, iconId: String? = nil, rotation: Int? = nil, image: PrintImage? = nil, items: [ChecklistItem]? = nil) {
        self.id = id
        self.kind = kind
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.text = text
        self.value = value
        self.format = format
        self.fontId = fontId
        self.fontSizeDots = fontSizeDots
        self.showText = showText
        self.iconId = iconId
        self.rotation = rotation
        self.image = image
        self.items = items
    }
}

public struct PrintDocument: Codable, Equatable, Sendable {
    public var schema: String
    public var version: Int
    public var page: PrintPage
    public var nodes: [PrintNode]
    public var metadata: [String: String]?

    public init(schema: String = "mxw01.print-document", version: Int = 1, page: PrintPage, nodes: [PrintNode], metadata: [String: String]? = nil) {
        self.schema = schema
        self.version = version
        self.page = page
        self.nodes = nodes
        self.metadata = metadata
    }
}
