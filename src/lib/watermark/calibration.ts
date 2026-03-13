import type { WatermarkRect } from "../../types";
import { restoreWatermarkPixels, clampToByte } from "./engine";
import { sobelGradients } from "./detection";

export function applyGainToAlpha(
  alphaMap: Float32Array,
  gain: number,
): Float32Array {
  const result = new Float32Array(alphaMap.length);
  for (let i = 0; i < alphaMap.length; i++) {
    result[i] = Math.min(alphaMap[i] * gain, 0.99);
  }
  return result;
}

function computeNearBlackRatio(
  pixels: Uint8ClampedArray,
  width: number,
  rect: WatermarkRect,
  threshold: number = 10,
): number {
  let count = 0;
  let total = 0;

  for (let row = 0; row < rect.height; row++) {
    for (let col = 0; col < rect.width; col++) {
      const px = rect.x + col;
      const py = rect.y + row;
      const idx = (py * width + px) * 4;
      const maxChannel = Math.max(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      if (maxChannel < threshold) {
        count++;
      }
      total++;
    }
  }

  return total > 0 ? count / total : 0;
}

function computeGradientResidual(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap: Float32Array,
  rect: WatermarkRect,
): number {
  const gradients = sobelGradients(pixels, width, height, rect);
  let sum = 0;
  for (let i = 0; i < gradients.length; i++) {
    sum += gradients[i] * alphaMap[i];
  }
  return gradients.length > 0 ? sum / gradients.length : 0;
}

export function findOptimalGain(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap: Float32Array,
  rect: WatermarkRect,
): number {
  const baseNearBlack = computeNearBlackRatio(pixels, width, rect);

  let bestGain = 1.0;
  let bestScore = Infinity;

  // Coarse search
  for (let gain = 1.05; gain <= 2.6; gain += 0.1) {
    const score = evaluateGain(
      pixels, width, height, alphaMap, rect, gain, baseNearBlack,
    );
    if (score !== null && score < bestScore) {
      bestScore = score;
      bestGain = gain;
    }
  }

  // Fine search around best coarse result
  const fineStart = Math.max(1.0, bestGain - 0.05);
  const fineEnd = bestGain + 0.05;
  for (let gain = fineStart; gain <= fineEnd; gain += 0.01) {
    const score = evaluateGain(
      pixels, width, height, alphaMap, rect, gain, baseNearBlack,
    );
    if (score !== null && score < bestScore) {
      bestScore = score;
      bestGain = gain;
    }
  }

  // If no improvement found, return 1.0
  const baseScore = evaluateGain(
    pixels, width, height, alphaMap, rect, 1.0, baseNearBlack,
  );
  if (baseScore !== null && bestScore >= baseScore) {
    return 1.0;
  }

  return Math.round(bestGain * 100) / 100;
}

function evaluateGain(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap: Float32Array,
  rect: WatermarkRect,
  gain: number,
  baseNearBlack: number,
): number | null {
  const testPixels = new Uint8ClampedArray(pixels);
  restoreWatermarkPixels(testPixels, width, height, alphaMap, rect, {
    gain,
    noiseFloor: 3 / 255,
    alphaCap: 0.99,
  });

  // Near-black protection: reject if near-black ratio increased by >5%
  const newNearBlack = computeNearBlackRatio(testPixels, width, rect);
  if (newNearBlack - baseNearBlack > 0.05) {
    return null;
  }

  return computeGradientResidual(testPixels, width, height, alphaMap, rect);
}
