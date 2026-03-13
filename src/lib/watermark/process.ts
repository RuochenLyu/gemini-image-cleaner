import type {
  ProcessedImage,
  WatermarkMetadata,
  WorkerProcessRequest,
  WorkerResponse,
} from "../../types";
import { extractAlphaMap } from "./engine";
import {
  getWatermarkRect,
  getWatermarkSizing,
  WATERMARK_MASKS,
} from "./constants";
import {
  createDownloadName,
  fileToImageData,
  imageDataToPngBlob,
  isSupportedImageFile,
  ProcessingError,
} from "./file";

export class WatermarkProcessor {
  private worker: Worker;

  private alphaMapCache = new Map<number, Promise<Float32Array>>();

  constructor() {
    this.worker = new Worker(
      new URL("../../workers/watermarkWorker.ts", import.meta.url),
      { type: "module" },
    );
  }

  async removeGeminiWatermark(file: File): Promise<ProcessedImage> {
    if (!isSupportedImageFile(file)) {
      throw new ProcessingError(
        "unsupported-format",
        "Unsupported file format.",
      );
    }

    const sourceImageData = await fileToImageData(file);
    const { width, height } = sourceImageData;
    const sizing = getWatermarkSizing(width, height);
    const rect = getWatermarkRect(width, height, sizing);

    // Load both alpha maps in parallel
    const [alphaMap48, alphaMap96] = await Promise.all([
      this.getAlphaMap(48),
      this.getAlphaMap(96),
    ]);

    const result = await this.runWorker({
      type: "process-image",
      id: crypto.randomUUID(),
      width,
      height,
      pixels: sourceImageData.data.slice().buffer,
      alphaMap: alphaMap48.slice().buffer,
      rect,
      alphaMap48: alphaMap48.slice().buffer,
      alphaMap96: alphaMap96.slice().buffer,
    });

    const processedImageData = new ImageData(width, height);
    processedImageData.data.set(result.pixels);
    const blob = await imageDataToPngBlob(processedImageData);

    const watermarkDetected = result.metadata?.watermarkDetected ?? true;

    return {
      blob,
      downloadName: createDownloadName(file.name),
      width,
      height,
      watermarkDetected,
      metadata: result.metadata,
    };
  }

  dispose(): void {
    this.worker.terminate();
  }

  private async getAlphaMap(size: 48 | 96): Promise<Float32Array> {
    const cached = this.alphaMapCache.get(size);

    if (cached) {
      return cached;
    }

    const task = loadAlphaMap(WATERMARK_MASKS[size]);
    this.alphaMapCache.set(size, task);

    return task;
  }

  private runWorker(
    request: WorkerProcessRequest,
  ): Promise<{ pixels: Uint8ClampedArray; metadata?: WatermarkMetadata }> {
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== request.id) {
          return;
        }

        this.worker.removeEventListener("message", handleMessage);
        this.worker.removeEventListener("error", handleError);

        if (event.data.type === "process-error") {
          reject(
            new ProcessingError(
              "processing-failed",
              event.data.message || "Processing failed.",
            ),
          );
          return;
        }

        const workerPixels = new Uint8ClampedArray(event.data.pixels);
        const nextPixels = new Uint8ClampedArray(workerPixels.length);
        nextPixels.set(workerPixels);
        resolve({ pixels: nextPixels, metadata: event.data.metadata });
      };

      const handleError = () => {
        this.worker.removeEventListener("message", handleMessage);
        this.worker.removeEventListener("error", handleError);
        reject(
          new ProcessingError(
            "processing-failed",
            "The watermark worker crashed unexpectedly.",
          ),
        );
      };

      this.worker.addEventListener("message", handleMessage);
      this.worker.addEventListener("error", handleError, { once: true });

      const transferables: ArrayBuffer[] = [request.pixels, request.alphaMap];
      if (request.alphaMap48) transferables.push(request.alphaMap48);
      if (request.alphaMap96) transferables.push(request.alphaMap96);
      this.worker.postMessage(request, transferables);
    });
  }
}

async function loadAlphaMap(src: string): Promise<Float32Array> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error(`Failed to load mask: ${src}`));
    nextImage.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new ProcessingError(
      "processing-failed",
      "Canvas 2D context is unavailable.",
    );
  }

  context.drawImage(image, 0, 0);

  return extractAlphaMap(
    context.getImageData(0, 0, canvas.width, canvas.height),
  );
}

export async function removeGeminiWatermark(
  file: File,
): Promise<ProcessedImage> {
  const processor = new WatermarkProcessor();

  try {
    return await processor.removeGeminiWatermark(file);
  } finally {
    processor.dispose();
  }
}
