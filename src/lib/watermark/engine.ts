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

export function restoreWatermarkPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap: Float32Array,
  rect: WatermarkRect,
): Uint8ClampedArray {
  const nextPixels = pixels;

  for (let row = 0; row < rect.height; row += 1) {
    for (let column = 0; column < rect.width; column += 1) {
      const pixelX = rect.x + column;
      const pixelY = rect.y + row;

      if (pixelX < 0 || pixelY < 0 || pixelX >= width || pixelY >= height) {
        continue;
      }

      const pixelOffset = (pixelY * width + pixelX) * 4;
      let alpha = alphaMap[row * rect.width + column];

      if (alpha < 0.002) {
        continue;
      }

      alpha = Math.min(alpha, 0.99);

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

function clampToByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
