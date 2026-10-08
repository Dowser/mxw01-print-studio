/** A normalized point in the high-resolution text glyph coordinate system. */
export type TextGlyphPoint = readonly [number, number];

export type TextGlyphStroke = readonly TextGlyphPoint[];

export interface TextGlyphDefinition {
  /** Width before the inter-glyph spacing is added. The nominal height is 7. */
  readonly width: number;
  readonly strokes: readonly TextGlyphStroke[];
  readonly dots?: readonly TextGlyphPoint[];
}

function stroke(...points: TextGlyphPoint[]): TextGlyphStroke {
  return points;
}

function glyph(
  width: number,
  strokes: readonly TextGlyphStroke[],
  dots: readonly TextGlyphPoint[] = [],
): TextGlyphDefinition {
  return { width, strokes, dots };
}

/**
 * A small outline/stroke font for the characters used by the label editor.
 * Coordinates are deliberately simple and portable: the web renderer and a
 * future Swift renderer can rasterize these line segments at any dot size.
 * The legacy 5×7 bitmap remains available as an explicit font choice.
 */
const BASE_VECTOR_TEXT_GLYPHS: Readonly<Record<string, TextGlyphDefinition>> = {
  " ": glyph(3, []),
  "!": glyph(2, [stroke([1, 0.4], [1, 5.2])], [[1, 6.35]]),
  "#": glyph(5, [stroke([1.5, 0], [1.5, 7]), stroke([3.5, 0], [3.5, 7]), stroke([0, 2.2], [5, 2.2]), stroke([0, 4.8], [5, 4.8])]),
  "%": glyph(5, [stroke([0.2, 6.8], [4.8, 0.2])], [[1.1, 1.2], [3.9, 5.8]]),
  "&": glyph(5, [stroke([4.8, 6.8], [1.3, 3.8], [0.5, 2.6], [0.7, 1.1], [1.8, 0.2], [2.9, 0.7], [3, 1.7], [2.3, 2.8], [1, 4], [0.6, 5.4], [1.5, 6.7], [3.1, 6.9], [4.8, 5.3])]),
  "(": glyph(3, [stroke([2.5, 0], [1.3, 1], [0.7, 2.4], [0.7, 4.6], [1.3, 6], [2.5, 7])]),
  ")": glyph(3, [stroke([0.5, 0], [1.7, 1], [2.3, 2.4], [2.3, 4.6], [1.7, 6], [0.5, 7])]),
  "[": glyph(3, [stroke([2.5, 0], [0.7, 0], [0.7, 7], [2.5, 7])]),
  "]": glyph(3, [stroke([0.5, 0], [2.3, 0], [2.3, 7], [0.5, 7])]),
  "*": glyph(5, [stroke([2.5, 1], [2.5, 6]), stroke([0.5, 2], [4.5, 5]), stroke([4.5, 2], [0.5, 5])]),
  "+": glyph(5, [stroke([2.5, 1], [2.5, 6]), stroke([0.5, 3.5], [4.5, 3.5])]),
  ",": glyph(2, [stroke([1.1, 6], [0.5, 7])]),
  "-": glyph(4, [stroke([0.5, 3.5], [3.5, 3.5])]),
  ".": glyph(2, [], [[1, 6.35]]),
  "/": glyph(5, [stroke([0.3, 7], [4.7, 0])]),
  "?": glyph(5, [stroke([0.4, 1.5], [0.9, 0.5], [2.1, 0], [3.8, 0.3], [4.6, 1.4], [4.3, 2.5], [3, 3.5], [2.5, 4.3], [2.5, 5])], [[2.5, 6.35]]),
  "0": glyph(5, [stroke([2.5, 0], [1.1, 0.4], [0.4, 1.5], [0.4, 5.5], [1.1, 6.6], [2.5, 7], [3.9, 6.6], [4.6, 5.5], [4.6, 1.5], [3.9, 0.4], [2.5, 0])]),
  "1": glyph(3, [stroke([0.5, 1.5], [2, 0], [2, 7]), stroke([0.7, 7], [3.3, 7])]),
  "2": glyph(5, [stroke([0.4, 1.4], [1, 0.4], [2.4, 0], [4, 0.4], [4.6, 1.5], [4.2, 2.5], [0.5, 7], [4.8, 7])]),
  "3": glyph(5, [stroke([0.5, 0.7], [1.5, 0], [3.6, 0.1], [4.6, 1.1], [4.3, 2.4], [3.2, 3.4], [4.3, 4.1], [4.7, 5.4], [3.7, 6.8], [1.6, 7], [0.5, 6.3]), stroke([2.6, 3.5], [3.4, 3.5])]),
  "4": glyph(5, [stroke([3.7, 7], [3.7, 0], [0.3, 4.5], [4.7, 4.5])]),
  "5": glyph(5, [stroke([4.6, 0], [0.7, 0], [0.5, 3.3], [2.9, 3.1], [4.3, 3.8], [4.7, 5.2], [4, 6.6], [2.6, 7], [1, 6.6], [0.4, 5.8])]),
  "6": glyph(5, [stroke([4.4, 0.8], [3.2, 0], [1.4, 0.5], [0.4, 2.1], [0.4, 5.2], [1.2, 6.6], [2.8, 7], [4.2, 6.2], [4.6, 4.8], [3.7, 3.6], [2.3, 3.3], [0.5, 4])]),
  "7": glyph(5, [stroke([0.4, 0], [4.7, 0], [2, 7])]),
  "8": glyph(5, [stroke([2.5, 0], [1, 0.5], [0.5, 1.6], [1, 3.4], [2.5, 3.5], [4, 3.4], [4.5, 1.6], [4, 0.5], [2.5, 0]), stroke([2.5, 3.5], [1, 3.7], [0.5, 5.5], [1.2, 6.6], [2.5, 7], [3.8, 6.6], [4.5, 5.5], [4, 3.7], [2.5, 3.5])]),
  "9": glyph(5, [stroke([4.5, 3.5], [3.2, 3.7], [1.7, 3.4], [0.5, 2.2], [0.7, 0.8], [2, 0], [3.6, 0.5], [4.5, 1.8], [4.5, 5.2], [3.5, 6.6], [1.8, 7], [0.7, 6.4])]),
  ":": glyph(2, [], [[1, 2.2], [1, 6.2]]),
  ";": glyph(2, [stroke([1, 6.1], [0.5, 7])], [[1, 2.2]]),
  "=": glyph(5, [stroke([0.5, 2.4], [4.5, 2.4]), stroke([0.5, 4.7], [4.5, 4.7])]),
  "_": glyph(5, [stroke([0, 7], [5, 7])]),
  "A": glyph(5, [stroke([0.4, 7], [2.5, 0], [4.6, 7]), stroke([1.2, 4.4], [3.8, 4.4])]),
  "B": glyph(5, [stroke([0.5, 7], [0.5, 0], [3.1, 0], [4.5, 0.8], [4.5, 2.1], [3.2, 3.5], [0.5, 3.5]), stroke([3.2, 3.5], [4.5, 4.3], [4.5, 6.1], [3.1, 7], [0.5, 7])]),
  "C": glyph(5, [stroke([4.7, 1], [3.5, 0.2], [1.8, 0], [0.5, 1.4], [0.5, 5.6], [1.8, 7], [3.5, 6.8], [4.7, 6])]),
  "D": glyph(5, [stroke([0.5, 7], [0.5, 0], [2.6, 0], [4.6, 1.2], [4.6, 5.8], [2.6, 7], [0.5, 7])]),
  "E": glyph(5, [stroke([4.7, 0], [0.5, 0], [0.5, 7], [4.7, 7]), stroke([0.5, 3.5], [3.7, 3.5])]),
  "F": glyph(5, [stroke([0.5, 7], [0.5, 0], [4.7, 0]), stroke([0.5, 3.4], [3.7, 3.4])]),
  "G": glyph(5, [stroke([4.7, 1], [3.5, 0.2], [1.8, 0], [0.5, 1.4], [0.5, 5.6], [1.8, 7], [3.5, 6.8], [4.7, 5.8], [4.7, 4], [2.7, 4])]),
  "H": glyph(5, [stroke([0.5, 0], [0.5, 7]), stroke([4.5, 0], [4.5, 7]), stroke([0.5, 3.5], [4.5, 3.5])]),
  "I": glyph(3, [stroke([0.3, 0], [2.7, 0]), stroke([1.5, 0], [1.5, 7]), stroke([0.3, 7], [2.7, 7])]),
  "J": glyph(5, [stroke([0.5, 0], [4.5, 0]), stroke([3.8, 0], [3.8, 5.5], [3, 6.7], [1.7, 7], [0.5, 6.2])]),
  "K": glyph(5, [stroke([0.5, 0], [0.5, 7]), stroke([4.6, 0], [0.5, 3.5], [4.7, 7])]),
  "L": glyph(5, [stroke([0.5, 0], [0.5, 7], [4.7, 7])]),
  "M": glyph(5, [stroke([0.5, 7], [0.5, 0], [2.5, 3.2], [4.5, 0], [4.5, 7])]),
  "N": glyph(5, [stroke([0.5, 7], [0.5, 0], [4.5, 7], [4.5, 0])]),
  "O": glyph(5, [stroke([2.5, 0], [1.2, 0.3], [0.5, 1.5], [0.5, 5.5], [1.2, 6.7], [2.5, 7], [3.8, 6.7], [4.5, 5.5], [4.5, 1.5], [3.8, 0.3], [2.5, 0])]),
  "P": glyph(5, [stroke([0.5, 7], [0.5, 0], [3, 0], [4.5, 0.8], [4.5, 2.5], [3, 3.5], [0.5, 3.5])]),
  "Q": glyph(5, [stroke([2.5, 0], [1.2, 0.3], [0.5, 1.5], [0.5, 5.5], [1.2, 6.7], [2.5, 7], [3.8, 6.7], [4.5, 5.5], [4.5, 1.5], [3.8, 0.3], [2.5, 0]), stroke([3.2, 5.4], [4.8, 7])]),
  "R": glyph(5, [stroke([0.5, 7], [0.5, 0], [3, 0], [4.5, 0.8], [4.5, 2.5], [3, 3.5], [0.5, 3.5]), stroke([2.8, 3.5], [4.7, 7])]),
  "S": glyph(5, [stroke([4.5, 0.8], [3.5, 0.1], [1.5, 0], [0.5, 1.1], [0.8, 2.5], [2.2, 3.2], [3.8, 3.8], [4.6, 4.8], [4.2, 6.2], [3, 7], [1.4, 6.9], [0.4, 6.2])]),
  "T": glyph(5, [stroke([0.3, 0], [4.7, 0]), stroke([2.5, 0], [2.5, 7])]),
  "U": glyph(5, [stroke([0.5, 0], [0.5, 5.3], [1.4, 6.7], [2.5, 7], [3.6, 6.7], [4.5, 5.3], [4.5, 0])]),
  "V": glyph(5, [stroke([0.4, 0], [2.5, 7], [4.6, 0])]),
  "W": glyph(5, [stroke([0.3, 0], [1.4, 7], [2.5, 3.6], [3.6, 7], [4.7, 0])]),
  "X": glyph(5, [stroke([0.5, 0], [4.5, 7]), stroke([4.5, 0], [0.5, 7])]),
  "Y": glyph(5, [stroke([0.4, 0], [2.5, 3.3], [4.6, 0]), stroke([2.5, 3.3], [2.5, 7])]),
  "Z": glyph(5, [stroke([0.4, 0], [4.6, 0], [0.4, 7], [4.6, 7])]),
};

function accentedGlyph(base: TextGlyphDefinition, marks: readonly TextGlyphPoint[]): TextGlyphDefinition {
  const compressedStrokes = base.strokes.map((points) => points.map(([x, y]) => [x, y * 0.82 + 1] as const));
  return glyph(base.width, compressedStrokes, marks);
}

/** Public, stable vector glyph table shared by platform renderers. */
export const VECTOR_TEXT_GLYPHS: Readonly<Record<string, TextGlyphDefinition>> = {
  ...BASE_VECTOR_TEXT_GLYPHS,
  "Ä": accentedGlyph(BASE_VECTOR_TEXT_GLYPHS.A, [[1.6, 0.25], [3.4, 0.25]]),
  "Å": accentedGlyph(BASE_VECTOR_TEXT_GLYPHS.A, [[2.5, 0.2]]),
  "É": accentedGlyph(BASE_VECTOR_TEXT_GLYPHS.E, [[3.7, 0.15], [4.2, 0.15]]),
  "Ö": accentedGlyph(BASE_VECTOR_TEXT_GLYPHS.O, [[1.6, 0.25], [3.4, 0.25]]),
  "·": glyph(2, [], [[1, 3.5]]),
};
