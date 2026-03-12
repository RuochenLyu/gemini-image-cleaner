/// <reference lib="webworker" />

import { restoreWatermarkPixels } from "../lib/watermark/engine";
import type { WorkerProcessRequest, WorkerResponse } from "../types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<WorkerProcessRequest>) => {
  const request = event.data;

  if (request.type !== "process-image") {
    return;
  }

  try {
    const pixels = new Uint8ClampedArray(request.pixels);
    const alphaMap = new Float32Array(request.alphaMap);
    const restored = restoreWatermarkPixels(
      pixels,
      request.width,
      request.height,
      alphaMap,
      request.rect,
    );

    const response: WorkerResponse = {
      type: "process-complete",
      id: request.id,
      pixels: restored.slice().buffer,
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
