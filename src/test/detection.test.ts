import { describe, expect, it } from "vitest";
import {
  normalizedCrossCorrelation,
  sobelGradients,
  detectWatermarkPresence,
} from "../lib/watermark/detection";

describe("detection", () => {
  describe("normalizedCrossCorrelation", () => {
    it("returns 1.0 for identical arrays", () => {
      const a = new Float32Array([0.1, 0.5, 0.9, 0.3]);
      const ncc = normalizedCrossCorrelation(a, a);
      expect(ncc).toBeCloseTo(1.0, 5);
    });

    it("returns -1.0 for perfectly inverted arrays", () => {
      const a = new Float32Array([0.0, 1.0, 0.0, 1.0]);
      const b = new Float32Array([1.0, 0.0, 1.0, 0.0]);
      const ncc = normalizedCrossCorrelation(a, b);
      expect(ncc).toBeCloseTo(-1.0, 5);
    });

    it("returns 0 for constant arrays", () => {
      const a = new Float32Array([0.5, 0.5, 0.5, 0.5]);
      const b = new Float32Array([0.1, 0.5, 0.9, 0.3]);
      const ncc = normalizedCrossCorrelation(a, b);
      expect(ncc).toBe(0);
    });

    it("handles empty arrays", () => {
      const ncc = normalizedCrossCorrelation(
        new Float32Array(0),
        new Float32Array(0),
      );
      expect(ncc).toBe(0);
    });
  });

  describe("sobelGradients", () => {
    it("returns zero gradients for uniform image", () => {
      const w = 4;
      const h = 4;
      const pixels = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        pixels[i * 4] = 128;
        pixels[i * 4 + 1] = 128;
        pixels[i * 4 + 2] = 128;
        pixels[i * 4 + 3] = 255;
      }

      const grads = sobelGradients(pixels, w, h, { x: 0, y: 0, width: w, height: h });
      const maxGrad = Math.max(...grads);
      expect(maxGrad).toBeCloseTo(0, 10);
    });

    it("detects edges in a simple pattern", () => {
      const w = 4;
      const h = 4;
      const pixels = new Uint8ClampedArray(w * h * 4);
      // Left half dark, right half bright
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const val = x < 2 ? 0 : 255;
          const idx = (y * w + x) * 4;
          pixels[idx] = val;
          pixels[idx + 1] = val;
          pixels[idx + 2] = val;
          pixels[idx + 3] = 255;
        }
      }

      const grads = sobelGradients(pixels, w, h, { x: 0, y: 0, width: w, height: h });
      // Interior pixels near the edge should have non-zero gradients
      const maxGrad = Math.max(...grads);
      expect(maxGrad).toBeGreaterThan(0);
    });
  });

  describe("detectWatermarkPresence", () => {
    it("returns not detected for uniform image with random alpha", () => {
      const w = 8;
      const h = 8;
      const pixels = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        pixels[i * 4] = 128;
        pixels[i * 4 + 1] = 128;
        pixels[i * 4 + 2] = 128;
        pixels[i * 4 + 3] = 255;
      }

      const alphaMap = new Float32Array(w * h);
      for (let i = 0; i < alphaMap.length; i++) {
        alphaMap[i] = Math.random();
      }

      const result = detectWatermarkPresence(
        pixels, w, h, alphaMap,
        { x: 0, y: 0, width: w, height: h },
      );

      // Uniform image shouldn't correlate with random alpha
      expect(result.spatialScore).toBeLessThan(0.3);
    });

    it("detects watermark when image brightness matches alpha pattern", () => {
      const w = 8;
      const h = 8;
      const alphaMap = new Float32Array(w * h);
      const pixels = new Uint8ClampedArray(w * h * 4);

      // Create a pattern where brightness correlates with alpha
      for (let i = 0; i < w * h; i++) {
        const alpha = (i % 4) / 4;
        alphaMap[i] = alpha;
        // Simulate watermark compositing: pixel = original*(1-alpha) + 255*alpha
        const val = Math.round(100 * (1 - alpha) + 255 * alpha);
        pixels[i * 4] = val;
        pixels[i * 4 + 1] = val;
        pixels[i * 4 + 2] = val;
        pixels[i * 4 + 3] = 255;
      }

      const result = detectWatermarkPresence(
        pixels, w, h, alphaMap,
        { x: 0, y: 0, width: w, height: h },
      );

      expect(result.spatialScore).toBeGreaterThan(0.3);
      expect(result.detected).toBe(true);
    });
  });
});
