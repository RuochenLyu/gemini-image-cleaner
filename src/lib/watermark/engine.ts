import type { WatermarkRect } from "../../types";

export function extractAlphaMap(imageData: ImageData): Float32Array {
  const alphaMap = new Float32Array(imageData.width * imageData.height);

  for (let index = 0; index < alphaMap.length; index += 1) {
    const offset = index * 4;
    const red = imageData.data[offset];
    const green = imageData.data[offset + 1];
    const blue = imageData.data[offset + 2];

    alphaMap[index] = Math.max(red, green, blue) / 255;
  }

  return alphaMap;
}

export interface RestoreOptions {
  noiseFloor?: number;
  gain?: number;
  alphaCap?: number;
}

export function restoreWatermarkPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap: Float32Array,
  rect: WatermarkRect,
  options?: RestoreOptions,
): Uint8ClampedArray {
  const noiseFloor = options?.noiseFloor ?? 3 / 255;
  const gain = options?.gain ?? 1.0;
  const alphaCap = options?.alphaCap ?? 0.99;
  const nextPixels = pixels;

  for (let row = 0; row < rect.height; row += 1) {
    for (let column = 0; column < rect.width; column += 1) {
      const pixelX = rect.x + column;
      const pixelY = rect.y + row;

      if (pixelX < 0 || pixelY < 0 || pixelX >= width || pixelY >= height) {
        continue;
      }

      const pixelOffset = (pixelY * width + pixelX) * 4;
      const rawAlpha = alphaMap[row * rect.width + column];

      if (rawAlpha - noiseFloor < 0.002) {
        continue;
      }

      const alpha = Math.min(rawAlpha * gain, alphaCap);
      const inverseAlpha = 1 - alpha;

      for (let channel = 0; channel < 3; channel += 1) {
        const restored =
          (nextPixels[pixelOffset + channel] - 255 * alpha) / inverseAlpha;
        nextPixels[pixelOffset + channel] = clampToByte(restored);
      }
    }
  }

  return nextPixels;
}

export function clampToByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
