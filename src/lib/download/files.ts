import JSZip from "jszip";
import type { BatchResult } from "../../types";
import { ProcessingError } from "../watermark/file";

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

export function createZipFilename(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `gemini-unwatermarked-${year}${month}${day}-${hours}${minutes}${seconds}.zip`;
}

export async function buildZipBlob(results: BatchResult[]): Promise<Blob> {
  const zip = new JSZip();

  results.forEach((result) => {
    if (result.state === "success" && result.blob) {
      zip.file(result.downloadName, result.blob);
    }
  });

  const entries = Object.keys(zip.files);

  if (entries.length === 0) {
    throw new ProcessingError("zip-failed", "No successful files to archive.");
  }

  return zip.generateAsync({ type: "blob" });
}

export async function downloadBatchAsZip(
  results: BatchResult[],
  now = new Date(),
): Promise<string> {
  try {
    const blob = await buildZipBlob(results);
    const filename = createZipFilename(now);
    downloadBlob(blob, filename);

    return filename;
  } catch (error) {
    if (error instanceof ProcessingError) {
      throw error;
    }

    throw new ProcessingError("zip-failed", "ZIP creation failed.");
  }
}
