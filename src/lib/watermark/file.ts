import type { ErrorCode } from "../../types";
import { SUPPORTED_IMAGE_TYPES } from "./constants";

export class ProcessingError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "ProcessingError";
    this.code = code;
  }
}

export function isSupportedImageFile(file: File): boolean {
  if (SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((extension) =>
    lowerName.endsWith(extension),
  );
}

export function createDownloadName(fileName: string): string {
  const trimmed = fileName.trim();
  const safeName = trimmed.length > 0 ? trimmed : "image";
  const baseName = safeName.replace(/\.(jpg|jpeg|png|webp)$/i, "");

  return `${baseName || "image"}-unwatermarked.png`;
}

export async function fileToImageData(file: File): Promise<ImageData> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new ProcessingError(
        "read-failed",
        "Canvas 2D context is unavailable.",
      );
    }

    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, width, height);
  } catch (error) {
    if (error instanceof ProcessingError) {
      throw error;
    }

    throw new ProcessingError("read-failed", "Failed to read the image file.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new ProcessingError(
      "processing-failed",
      "Canvas 2D context is unavailable.",
    );
  }

  context.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), "image/png");
  });

  if (!blob) {
    throw new ProcessingError(
      "processing-failed",
      "Failed to encode the processed image.",
    );
  }

  return blob;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}
