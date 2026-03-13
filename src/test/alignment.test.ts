import { describe, expect, it } from "vitest";
import {
  bilinearShiftAlpha,
  bilinearScaleAlpha,
  findBestAlignment,
} from "../lib/watermark/alignment";

describe("alignment", () => {
  describe("bilinearShiftAlpha", () => {
    it("returns identical map for zero shift", () => {
      const map = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const result = bilinearShiftAlpha(map, 2, 2, 0, 0);

      expect(result[0]).toBeCloseTo(0.1);
      expect(result[1]).toBeCloseTo(0.2);
      expect(result[2]).toBeCloseTo(0.3);
      expect(result[3]).toBeCloseTo(0.4);
    });

    it("shifts values by integer offset", () => {
      const map = new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]);
      const result = bilinearShiftAlpha(map, 4, 4, 1, 1);

      // Shifted right by 1 and down by 1, so (1,1) should have the value
      expect(result[5]).toBeCloseTo(1.0);
      expect(result[0]).toBeCloseTo(0.0);
    });

    it("performs subpixel interpolation", () => {
      const map = new Float32Array([
        1, 0,
        0, 0,
      ]);
      const result = bilinearShiftAlpha(map, 2, 2, 0.5, 0);

      // At (0,0): srcX=-0.5 → x0=-1(OOB=0), x1=0(=1), fx=0.5 → 0.5
      // At (1,0): srcX=0.5 → x0=0(=1), x1=1(=0), fx=0.5 → 0.5
      expect(result[0]).toBeCloseTo(0.5);
      expect(result[1]).toBeCloseTo(0.5);
    });
  });

  describe("bilinearScaleAlpha", () => {
    it("preserves values at scale 1:1", () => {
      const map = new Float32Array([0.1, 0.9, 0.5, 0.3]);
      const result = bilinearScaleAlpha(map, 2, 2, 2, 2);

      expect(result[0]).toBeCloseTo(0.1);
      expect(result[1]).toBeCloseTo(0.9);
      expect(result[2]).toBeCloseTo(0.5);
      expect(result[3]).toBeCloseTo(0.3);
    });

    it("upscales smoothly", () => {
      const map = new Float32Array([0, 1, 0, 1]);
      const result = bilinearScaleAlpha(map, 2, 2, 4, 4);

      // Should have 16 values, interpolated
      expect(result.length).toBe(16);
      // Corner values should match or be close to originals
      expect(result[0]).toBeCloseTo(0.0);
    });

    it("downscales", () => {
      const map = new Float32Array([0, 0.5, 1, 0, 0.5, 1, 0, 0.5, 1]);
      const result = bilinearScaleAlpha(map, 3, 3, 2, 2);

      expect(result.length).toBe(4);
      // Values should be sampled from the larger map
      expect(result[0]).toBeCloseTo(0.0);
    });
  });

  describe("findBestAlignment", () => {
    it("returns alignment result with score", () => {
      const w = 4;
      const h = 4;
      const alphaMap = new Float32Array(w * h);
      const pixels = new Uint8ClampedArray(w * h * 4);

      for (let i = 0; i < w * h; i++) {
        alphaMap[i] = i / (w * h);
        const val = Math.round((i / (w * h)) * 255);
        pixels[i * 4] = val;
        pixels[i * 4 + 1] = val;
        pixels[i * 4 + 2] = val;
        pixels[i * 4 + 3] = 255;
      }

      const result = findBestAlignment(pixels, w, alphaMap, w, h, 0, 0);

      expect(result).toHaveProperty("dx");
      expect(result).toHaveProperty("dy");
      expect(result).toHaveProperty("scale");
      expect(result).toHaveProperty("score");
      expect(result.score).toBeGreaterThan(-Infinity);
    });
  });
});
