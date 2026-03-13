import { describe, expect, it } from "vitest";
import { restoreWatermarkPixels, clampToByte } from "../lib/watermark/engine";

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

  it("skips pixels below noiseFloor threshold", () => {
    const pixels = new Uint8ClampedArray([100, 100, 100, 255]);
    const alphaMap = new Float32Array([0.01]); // just above default noiseFloor

    const restored = restoreWatermarkPixels(
      pixels.slice(),
      1,
      1,
      alphaMap,
      { x: 0, y: 0, width: 1, height: 1 },
      { noiseFloor: 0.02 },
    );

    // alpha(0.01) - noiseFloor(0.02) < 0.002, so pixel should be unchanged
    expect(restored[0]).toBe(100);
    expect(restored[1]).toBe(100);
    expect(restored[2]).toBe(100);
  });

  it("applies gain to alpha during restoration", () => {
    const alpha = 0.3;
    const gain = 1.5;
    const original = [80, 80, 80];
    const composited = new Uint8ClampedArray([
      Math.round(original[0] * (1 - alpha) + 255 * alpha),
      Math.round(original[1] * (1 - alpha) + 255 * alpha),
      Math.round(original[2] * (1 - alpha) + 255 * alpha),
      255,
    ]);

    const withGain = restoreWatermarkPixels(
      composited.slice(),
      1,
      1,
      new Float32Array([alpha]),
      { x: 0, y: 0, width: 1, height: 1 },
      { gain },
    );

    const withoutGain = restoreWatermarkPixels(
      composited.slice(),
      1,
      1,
      new Float32Array([alpha]),
      { x: 0, y: 0, width: 1, height: 1 },
      { gain: 1.0 },
    );

    // With gain the effective alpha is higher, so restored values should differ
    expect(withGain[0]).not.toBe(withoutGain[0]);
  });

  it("respects alphaCap option", () => {
    const pixels = new Uint8ClampedArray([200, 200, 200, 255]);
    const alphaMap = new Float32Array([0.98]);

    const restored = restoreWatermarkPixels(
      pixels.slice(),
      1,
      1,
      alphaMap,
      { x: 0, y: 0, width: 1, height: 1 },
      { alphaCap: 0.5 },
    );

    // Alpha capped at 0.5, so result should be brighter than with 0.98
    const restoredFull = restoreWatermarkPixels(
      pixels.slice(),
      1,
      1,
      alphaMap,
      { x: 0, y: 0, width: 1, height: 1 },
      { alphaCap: 0.99 },
    );

    expect(restored[0]).toBeGreaterThan(restoredFull[0]);
  });

  it("clampToByte clamps and rounds correctly", () => {
    expect(clampToByte(-10)).toBe(0);
    expect(clampToByte(300)).toBe(255);
    expect(clampToByte(128.6)).toBe(129);
    expect(clampToByte(128.4)).toBe(128);
  });
});
