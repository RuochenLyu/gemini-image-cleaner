import type { WatermarkRect } from "../../types";

export function normalizedCrossCorrelation(
  a: Float32Array,
  b: Float32Array,
): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let num = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denomA += da * da;
    denomB += db * db;
  }

  const denom = Math.sqrt(denomA * denomB);
  return denom < 1e-12 ? 0 : num / denom;
}

export function sobelGradients(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  rect: WatermarkRect,
): Float32Array {
  const rw = rect.width;
  const rh = rect.height;
  const gradients = new Float32Array(rw * rh);

  for (let row = 0; row < rh; row++) {
    for (let col = 0; col < rw; col++) {
      const px = rect.x + col;
      const py = rect.y + row;

      if (px <= 0 || py <= 0 || px >= width - 1 || py >= height - 1) {
        gradients[row * rw + col] = 0;
        continue;
      }

      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((py + ky) * width + (px + kx)) * 4;
          const gray =
            0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];

          const sobelX =
            kx === 0 ? 0 : kx * (ky === 0 ? 2 : 1);
          const sobelY =
            ky === 0 ? 0 : ky * (kx === 0 ? 2 : 1);

          gx += gray * sobelX;
          gy += gray * sobelY;
        }
      }

      gradients[row * rw + col] = Math.sqrt(gx * gx + gy * gy) / 255;
    }
  }

  return gradients;
}

export function computeSpatialScore(
  pixels: Uint8ClampedArray,
  width: number,
  alphaMap: Float32Array,
  rect: WatermarkRect,
): number {
  const rw = rect.width;
  const rh = rect.height;
  const n = rw * rh;
  const regionBrightness = new Float32Array(n);

  for (let row = 0; row < rh; row++) {
    for (let col = 0; col < rw; col++) {
      const px = rect.x + col;
      const py = rect.y + row;
      const idx = (py * width + px) * 4;
      regionBrightness[row * rw + col] =
        (0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2]) / 255;
    }
  }

  return normalizedCrossCorrelation(regionBrightness, alphaMap);
}

export function computeGradientScore(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap: Float32Array,
  rect: WatermarkRect,
): number {
  const gradients = sobelGradients(pixels, width, height, rect);

  const rw = rect.width;
  const rh = rect.height;
  const alphaGrad = new Float32Array(rw * rh);
  for (let row = 0; row < rh; row++) {
    for (let col = 0; col < rw; col++) {
      const i = row * rw + col;
      let dx = 0;
      let dy = 0;
      if (col > 0 && col < rw - 1) {
        dx = alphaMap[i + 1] - alphaMap[i - 1];
      }
      if (row > 0 && row < rh - 1) {
        dy = alphaMap[(row + 1) * rw + col] - alphaMap[(row - 1) * rw + col];
      }
      alphaGrad[i] = Math.sqrt(dx * dx + dy * dy);
    }
  }

  return normalizedCrossCorrelation(gradients, alphaGrad);
}

export interface DetectionResult {
  detected: boolean;
  spatialScore: number;
  gradientScore: number;
}

export function detectWatermarkPresence(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap: Float32Array,
  rect: WatermarkRect,
): DetectionResult {
  const spatialScore = computeSpatialScore(pixels, width, alphaMap, rect);
  const gradientScore = computeGradientScore(pixels, width, height, alphaMap, rect);

  return {
    detected: spatialScore >= 0.3 || gradientScore >= 0.12,
    spatialScore,
    gradientScore,
  };
}

export interface SizeSelection {
  bestSize: 48 | 96;
  score48: number;
  score96: number;
}

export function selectBestSize(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap48: Float32Array,
  rect48: WatermarkRect,
  alphaMap96: Float32Array,
  rect96: WatermarkRect,
): SizeSelection {
  const spatial48 = computeSpatialScore(pixels, width, alphaMap48, rect48);
  const gradient48 = computeGradientScore(pixels, width, height, alphaMap48, rect48);
  const score48 = Math.max(spatial48, gradient48);

  const spatial96 = computeSpatialScore(pixels, width, alphaMap96, rect96);
  const gradient96 = computeGradientScore(pixels, width, height, alphaMap96, rect96);
  const score96 = Math.max(spatial96, gradient96);

  return {
    bestSize: score96 >= score48 ? 96 : 48,
    score48,
    score96,
  };
}
