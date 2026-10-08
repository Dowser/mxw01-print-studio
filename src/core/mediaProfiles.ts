import type { DocumentMedia, MediaColor, MediaKind } from "./document";

export interface LabelMediaProfile {
  readonly id: string;
  readonly name: string;
  readonly kind: MediaKind;
  readonly color: MediaColor;
  readonly widthDots: number;
  readonly heightDots: number;
  readonly gapDots: number;
  readonly widthMm: number;
  readonly heightMm?: number;
}

/**
 * Media choices are deliberately independent of the Bluetooth printer
 * profile. The MXW01 still prints a monochrome bitmap; color is substrate
 * metadata used by the preview and contrast guidance.
 */
export const MXW01_MEDIA_PROFILES: readonly LabelMediaProfile[] = [
  {
    id: "mxw01-continuous-white",
    name: "Vit · kontinuerlig",
    kind: "continuous",
    color: "white",
    widthDots: 384,
    heightDots: 240,
    gapDots: 0,
    widthMm: 58,
  },
  {
    id: "mxw01-die-cut-white",
    name: "Vit · stansad 58 × 30 mm",
    kind: "die-cut",
    color: "white",
    widthDots: 384,
    heightDots: 200,
    gapDots: 8,
    widthMm: 58,
    heightMm: 30,
  },
  {
    id: "mxw01-die-cut-yellow",
    name: "Gul · stansad 58 × 30 mm",
    kind: "die-cut",
    color: "yellow",
    widthDots: 384,
    heightDots: 200,
    gapDots: 8,
    widthMm: 58,
    heightMm: 30,
  },
  {
    id: "mxw01-die-cut-blue",
    name: "Blå · stansad 58 × 30 mm",
    kind: "die-cut",
    color: "blue",
    widthDots: 384,
    heightDots: 200,
    gapDots: 8,
    widthMm: 58,
    heightMm: 30,
  },
  {
    id: "mxw01-die-cut-pink",
    name: "Rosa · stansad 58 × 30 mm",
    kind: "die-cut",
    color: "pink",
    widthDots: 384,
    heightDots: 200,
    gapDots: 8,
    widthMm: 58,
    heightMm: 30,
  },
  {
    id: "mxw01-die-cut-green",
    name: "Grön · stansad 58 × 30 mm",
    kind: "die-cut",
    color: "green",
    widthDots: 384,
    heightDots: 200,
    gapDots: 8,
    widthMm: 58,
    heightMm: 30,
  },
  {
    id: "mxw01-die-cut-orange",
    name: "Orange · stansad 58 × 30 mm",
    kind: "die-cut",
    color: "orange",
    widthDots: 384,
    heightDots: 200,
    gapDots: 8,
    widthMm: 58,
    heightMm: 30,
  },
  {
    id: "mxw01-die-cut-red",
    name: "Röd · stansad 58 × 30 mm",
    kind: "die-cut",
    color: "red",
    widthDots: 384,
    heightDots: 200,
    gapDots: 8,
    widthMm: 58,
    heightMm: 30,
  },
];

export function findMediaProfile(profileId: string): LabelMediaProfile | undefined {
  return MXW01_MEDIA_PROFILES.find((profile) => profile.id === profileId);
}

export function mediaProfileToDocumentMedia(profile: LabelMediaProfile): DocumentMedia {
  return {
    kind: profile.kind,
    color: profile.color,
    labelHeightDots: profile.heightDots,
    gapDots: profile.gapDots,
    profileId: profile.id,
  };
}
