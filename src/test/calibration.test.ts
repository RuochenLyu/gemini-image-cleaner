import { describe, expect, it } from "vitest";
import { findOptimalGain, applyGainToAlpha } from "../lib/watermark/calibration";

describe("calibration", () => {
  describe("applyGainToAlpha", () => {
    it("scales alpha values by gain factor", () => {
      const alphaMap = new Float32Array([0.1, 0.3, 0.5, 0.8]);
      const result = applyGainToAlpha(alphaMap, 1.5);

      expect(result[0]).toBeCloseTo(0.15);
      expect(result[1]).toBeCloseTo(0.45);
      expect(result[2]).toBeCloseTo(0.75);
    });

    it("caps alpha at 0.99", () => {
      const alphaMap = new Float32Array([0.8, 0.9, 1.0]);
      const result = applyGainToAlpha(alphaMap, 2.0);

      expect(result[0]).toBeCloseTo(0.99);
      expect(result[1]).toBeCloseTo(0.99);
      expect(result[2]).toBeCloseTo(0.99);
    });

    it("does not modify original array", () => {
      const alphaMap = new Float32Array([0.5]);
      const result = applyGainToAlpha(alphaMap, 2.0);

      expect(alphaMap[0]).toBe(0.5);
      expect(result[0]).toBeCloseTo(0.99);
    });
  });

  describe("findOptimalGain", () => {
    it("returns 1.0 for already-clean image region", () => {
      const w = 8;
      const h = 8;
      const pixels = new Uint8ClampedArray(w * h * 4);
      // Uniform mid-gray — no watermark pattern
      for (let i = 0; i < w * h; i++) {
        pixels[i * 4] = 128;
        pixels[i * 4 + 1] = 128;
        pixels[i * 4 + 2] = 128;
        pixels[i * 4 + 3] = 255;
      }

      const alphaMap = new Float32Array(w * h);
      for (let i = 0; i < alphaMap.length; i++) {
        alphaMap[i] = 0.3;
      }

      const gain = findOptimalGain(
        pixels, w, h, alphaMap,
        { x: 0, y: 0, width: w, height: h },
      );

      expect(gain).toBe(1.0);
    });

    it("returns a gain value within expected range", () => {
      const w = 16;
      const h = 16;
      const pixels = new Uint8ClampedArray(w * h * 4);
      const alphaMap = new Float32Array(w * h);

      // Create a watermark-like pattern with gradient
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const alpha = Math.max(0, Math.min(1, (x + y) / (w + h)));
          alphaMap[i] = alpha;
          const val = Math.round(80 * (1 - alpha * 0.5) + 255 * alpha * 0.5);
          pixels[i * 4] = val;
          pixels[i * 4 + 1] = val;
          pixels[i * 4 + 2] = val;
          pixels[i * 4 + 3] = 255;
        }
      }

      const gain = findOptimalGain(
        pixels, w, h, alphaMap,
        { x: 0, y: 0, width: w, height: h },
      );

      expect(gain).toBeGreaterThanOrEqual(1.0);
      expect(gain).toBeLessThanOrEqual(2.6);
    });
  });
});
