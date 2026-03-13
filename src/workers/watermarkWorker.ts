/// <reference lib="webworker" />

import { restoreWatermarkPixels } from "../lib/watermark/engine";
import { detectWatermarkPresence, selectBestSize } from "../lib/watermark/detection";
import { findOptimalGain } from "../lib/watermark/calibration";
import { getWatermarkRect, getWatermarkSizing } from "../lib/watermark/constants";
import { sobelGradients } from "../lib/watermark/detection";
import type {
  WatermarkMetadata,
  WorkerProcessRequest,
  WorkerResponse,
} from "../types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<WorkerProcessRequest>) => {
  const request = event.data;

  if (request.type !== "process-image") {
    return;
  }

  try {
    const pixels = new Uint8ClampedArray(request.pixels);
    const { width, height } = request;

    // Step 1: Smart size selection — compare 48 vs 96 if both alpha maps provided
    let alphaMap: Float32Array;
    let detectedSize: 48 | 96;
    let rect = request.rect;

    if (request.alphaMap48 && request.alphaMap96) {
      const alphaMap48 = new Float32Array(request.alphaMap48);
      const alphaMap96 = new Float32Array(request.alphaMap96);
      const rect48 = getWatermarkRect(width, height, getWatermarkSizing(width, height, 48));
      const rect96 = getWatermarkRect(width, height, getWatermarkSizing(width, height, 96));

      const selection = selectBestSize(
        pixels, width, height, alphaMap48, rect48, alphaMap96, rect96,
      );

      detectedSize = selection.bestSize;
      alphaMap = detectedSize === 48 ? alphaMap48 : alphaMap96;
      rect = detectedSize === 48 ? rect48 : rect96;
    } else {
      alphaMap = new Float32Array(request.alphaMap);
      detectedSize = rect.width === 96 ? 96 : 48;
    }

    // Step 2: Watermark presence detection
    const detection = detectWatermarkPresence(pixels, width, height, alphaMap, rect);

    if (!detection.detected) {
      const metadata: WatermarkMetadata = {
        watermarkDetected: false,
        detectedSize,
        gainUsed: 1.0,
        spatialScore: detection.spatialScore,
        gradientScore: detection.gradientScore,
        alignmentOffset: { dx: 0, dy: 0, scale: 1.0 },
      };

      const response: WorkerResponse = {
        type: "process-complete",
        id: request.id,
        pixels: pixels.slice().buffer,
        metadata,
      };

      self.postMessage(response, [response.pixels]);
      return;
    }

    // Step 3: Initial removal with gain=1
    const workPixels = new Uint8ClampedArray(pixels);
    restoreWatermarkPixels(workPixels, width, height, alphaMap, rect, {
      gain: 1.0,
      noiseFloor: 3 / 255,
      alphaCap: 0.99,
    });

    // Step 4: Gain calibration — find optimal gain and re-apply
    const optimalGain = findOptimalGain(pixels, width, height, alphaMap, rect);

    let finalPixels: Uint8ClampedArray;
    if (optimalGain > 1.0) {
      finalPixels = new Uint8ClampedArray(pixels);
      restoreWatermarkPixels(finalPixels, width, height, alphaMap, rect, {
        gain: optimalGain,
        noiseFloor: 3 / 255,
        alphaCap: 0.99,
      });
    } else {
      finalPixels = workPixels;
    }

    // Step 5: Contour secondary correction — if gradient residual is high
    const postGradients = sobelGradients(finalPixels, width, height, rect);
    let maxGrad = 0;
    for (let i = 0; i < postGradients.length; i++) {
      if (postGradients[i] > maxGrad) maxGrad = postGradients[i];
    }

    if (maxGrad >= 0.42) {
      // Apply a second pass with slightly higher gain on edge pixels
      const edgePixels = new Uint8ClampedArray(finalPixels);
      const edgeGain = Math.min(optimalGain * 1.1, 2.6);
      restoreWatermarkPixels(edgePixels, width, height, alphaMap, rect, {
        gain: edgeGain,
        noiseFloor: 3 / 255,
        alphaCap: 0.99,
      });

      // Blend edge-corrected pixels only where gradient residual is high
      for (let row = 0; row < rect.height; row++) {
        for (let col = 0; col < rect.width; col++) {
          const gi = row * rect.width + col;
          if (postGradients[gi] >= 0.42) {
            const px = rect.x + col;
            const py = rect.y + row;
            const idx = (py * width + px) * 4;
            const blend = Math.min((postGradients[gi] - 0.42) / 0.3, 1.0);
            for (let c = 0; c < 3; c++) {
              finalPixels[idx + c] = Math.round(
                finalPixels[idx + c] * (1 - blend) + edgePixels[idx + c] * blend,
              );
            }
          }
        }
      }
    }

    const metadata: WatermarkMetadata = {
      watermarkDetected: true,
      detectedSize,
      gainUsed: optimalGain,
      spatialScore: detection.spatialScore,
      gradientScore: detection.gradientScore,
      alignmentOffset: { dx: 0, dy: 0, scale: 1.0 },
    };

    const response: WorkerResponse = {
      type: "process-complete",
      id: request.id,
      pixels: finalPixels.slice().buffer,
      metadata,
    };

    self.postMessage(response, [response.pixels]);
  } catch (error) {
    const response: WorkerResponse = {
      type: "process-error",
      id: request.id,
      message:
        error instanceof Error ? error.message : "Unexpected worker failure.",
    };

    self.postMessage(response);
  }
};
