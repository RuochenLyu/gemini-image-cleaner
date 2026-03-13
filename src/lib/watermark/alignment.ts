import { normalizedCrossCorrelation } from "./detection";

export function bilinearShiftAlpha(
  alphaMap: Float32Array,
  w: number,
  h: number,
  dx: number,
  dy: number,
): Float32Array {
  const result = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcX = x - dx;
      const srcY = y - dy;

      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = x0 + 1;
      const y1 = y0 + 1;

      const fx = srcX - x0;
      const fy = srcY - y0;

      const sample = (sx: number, sy: number): number => {
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) return 0;
        return alphaMap[sy * w + sx];
      };

      result[y * w + x] =
        sample(x0, y0) * (1 - fx) * (1 - fy) +
        sample(x1, y0) * fx * (1 - fy) +
        sample(x0, y1) * (1 - fx) * fy +
        sample(x1, y1) * fx * fy;
    }
  }

  return result;
}

export function bilinearScaleAlpha(
  alphaMap: Float32Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Float32Array {
  const result = new Float32Array(dstW * dstH);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const srcX = x * scaleX;
      const srcY = y * scaleY;

      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y1 = Math.min(y0 + 1, srcH - 1);

      const fx = srcX - x0;
      const fy = srcY - y0;

      result[y * dstW + x] =
        alphaMap[y0 * srcW + x0] * (1 - fx) * (1 - fy) +
        alphaMap[y0 * srcW + x1] * fx * (1 - fy) +
        alphaMap[y1 * srcW + x0] * (1 - fx) * fy +
        alphaMap[y1 * srcW + x1] * fx * fy;
    }
  }

  return result;
}

export interface AlignmentResult {
  dx: number;
  dy: number;
  scale: number;
  score: number;
}

export function findBestAlignment(
  pixels: Uint8ClampedArray,
  width: number,
  alphaMap: Float32Array,
  mapW: number,
  mapH: number,
  rectX: number,
  rectY: number,
): AlignmentResult {
  const regionBrightness = extractRegionBrightness(
    pixels, width, rectX, rectY, mapW, mapH,
  );

  let best: AlignmentResult = { dx: 0, dy: 0, scale: 1.0, score: -Infinity };
  const scales = [0.99, 1.0, 1.01];
  const shifts = [-0.5, -0.25, 0, 0.25, 0.5];

  for (const scale of scales) {
    let scaledMap = alphaMap;
    if (scale !== 1.0) {
      const sw = Math.round(mapW * scale);
      const sh = Math.round(mapH * scale);
      const full = bilinearScaleAlpha(alphaMap, mapW, mapH, sw, sh);
      scaledMap = cropOrPad(full, sw, sh, mapW, mapH);
    }

    for (const dx of shifts) {
      for (const dy of shifts) {
        const shifted = bilinearShiftAlpha(scaledMap, mapW, mapH, dx, dy);
        const score = normalizedCrossCorrelation(regionBrightness, shifted);
        if (score > best.score) {
          best = { dx, dy, scale, score };
        }
      }
    }
  }

  return best;
}

export function refineAlignment(
  pixels: Uint8ClampedArray,
  width: number,
  alphaMap: Float32Array,
  mapW: number,
  mapH: number,
  rectX: number,
  rectY: number,
  initial: AlignmentResult,
): AlignmentResult {
  const regionBrightness = extractRegionBrightness(
    pixels, width, rectX, rectY, mapW, mapH,
  );

  let best = initial;
  const step = 0.1;

  for (let ddx = -0.2; ddx <= 0.2; ddx += step) {
    for (let ddy = -0.2; ddy <= 0.2; ddy += step) {
      const dx = initial.dx + ddx;
      const dy = initial.dy + ddy;

      let scaledMap = alphaMap;
      if (initial.scale !== 1.0) {
        const sw = Math.round(mapW * initial.scale);
        const sh = Math.round(mapH * initial.scale);
        const full = bilinearScaleAlpha(alphaMap, mapW, mapH, sw, sh);
        scaledMap = cropOrPad(full, sw, sh, mapW, mapH);
      }

      const shifted = bilinearShiftAlpha(scaledMap, mapW, mapH, dx, dy);
      const score = normalizedCrossCorrelation(regionBrightness, shifted);
      if (score > best.score) {
        best = { dx, dy, scale: initial.scale, score };
      }
    }
  }

  return best;
}

export function adaptiveTemplateSearch(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMap: Float32Array,
  mapW: number,
  mapH: number,
): { x: number; y: number; score: number } {
  const coarseStep = Math.max(8, Math.floor(Math.min(mapW, mapH) / 4));
  let best = { x: 0, y: 0, score: -Infinity };

  // Coarse scan
  for (let y = 0; y <= height - mapH; y += coarseStep) {
    for (let x = 0; x <= width - mapW; x += coarseStep) {
      const region = extractRegionBrightness(pixels, width, x, y, mapW, mapH);
      const score = normalizedCrossCorrelation(region, alphaMap);
      if (score > best.score) {
        best = { x, y, score };
      }
    }
  }

  // Fine scan around best coarse result
  const fineStep = Math.max(1, Math.floor(coarseStep / 4));
  const searchRadius = coarseStep;
  const fineStartX = Math.max(0, best.x - searchRadius);
  const fineStartY = Math.max(0, best.y - searchRadius);
  const fineEndX = Math.min(width - mapW, best.x + searchRadius);
  const fineEndY = Math.min(height - mapH, best.y + searchRadius);

  for (let y = fineStartY; y <= fineEndY; y += fineStep) {
    for (let x = fineStartX; x <= fineEndX; x += fineStep) {
      const region = extractRegionBrightness(pixels, width, x, y, mapW, mapH);
      const score = normalizedCrossCorrelation(region, alphaMap);
      if (score > best.score) {
        best = { x, y, score };
      }
    }
  }

  return best;
}

function extractRegionBrightness(
  pixels: Uint8ClampedArray,
  width: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): Float32Array {
  const result = new Float32Array(rw * rh);
  for (let row = 0; row < rh; row++) {
    for (let col = 0; col < rw; col++) {
      const idx = ((ry + row) * width + (rx + col)) * 4;
      result[row * rw + col] =
        (0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2]) / 255;
    }
  }
  return result;
}

function cropOrPad(
  src: Float32Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Float32Array {
  const result = new Float32Array(dstW * dstH);
  const offsetX = Math.floor((srcW - dstW) / 2);
  const offsetY = Math.floor((srcH - dstH) / 2);

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const sx = x + offsetX;
      const sy = y + offsetY;
      if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
        result[y * dstW + x] = src[sy * srcW + sx];
      }
    }
  }

  return result;
}
