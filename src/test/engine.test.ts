import { describe, expect, it } from "vitest";
import { restoreWatermarkPixels } from "../lib/watermark/engine";

describe("watermark engine", () => {
  it("restores a composited pixel back to its original value", () => {
    const original = [64, 128, 192];
    const alpha = 0.5;
    const composited = new Uint8ClampedArray([
      Math.round(original[0] * (1 - alpha) + 255 * alpha),
      Math.round(original[1] * (1 - alpha) + 255 * alpha),
      Math.round(original[2] * (1 - alpha) + 255 * alpha),
      255,
    ]);

    const restored = restoreWatermarkPixels(
      composited,
      1,
      1,
      new Float32Array([alpha]),
      { x: 0, y: 0, width: 1, height: 1 },
    );

    Array.from(restored.slice(0, 3)).forEach((value, index) => {
      expect(value).toBeGreaterThanOrEqual(original[index]! - 1);
      expect(value).toBeLessThanOrEqual(original[index]! + 1);
    });
  });
});
