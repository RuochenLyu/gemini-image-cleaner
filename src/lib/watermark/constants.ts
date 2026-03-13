import type { WatermarkRect } from "../../types";

export const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";

export const WATERMARK_MASKS = {
  48: "/masks/gemini-mask-48.png",
  96: "/masks/gemini-mask-96.png",
} as const;

export interface WatermarkSizing {
  logoSize: 48 | 96;
  marginRight: number;
  marginBottom: number;
}

export function getWatermarkSizing(
  width: number,
  height: number,
  overrideLogoSize?: 48 | 96,
): WatermarkSizing {
  if (overrideLogoSize === 48) {
    return {
      logoSize: 48,
      marginRight: 32,
      marginBottom: 32,
    };
  }

  if (overrideLogoSize === 96) {
    return {
      logoSize: 96,
      marginRight: 64,
      marginBottom: 64,
    };
  }

  if (width > 1024 && height > 1024) {
    return {
      logoSize: 96,
      marginRight: 64,
      marginBottom: 64,
    };
  }

  return {
    logoSize: 48,
    marginRight: 32,
    marginBottom: 32,
  };
}

export function getWatermarkRect(
  width: number,
  height: number,
  sizing = getWatermarkSizing(width, height),
): WatermarkRect {
  return {
    x: width - sizing.marginRight - sizing.logoSize,
    y: height - sizing.marginBottom - sizing.logoSize,
    width: sizing.logoSize,
    height: sizing.logoSize,
  };
}
