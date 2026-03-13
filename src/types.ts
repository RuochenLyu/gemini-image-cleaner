export type Locale = "zh-CN" | "en-US" | "ja-JP";

export type BatchState = "pending" | "processing" | "success" | "error";

export type ErrorCode =
  | "unsupported-format"
  | "read-failed"
  | "processing-failed"
  | "zip-failed";

export interface WatermarkMetadata {
  watermarkDetected: boolean;
  detectedSize: 48 | 96;
  gainUsed: number;
  spatialScore: number;
  gradientScore: number;
  alignmentOffset: { dx: number; dy: number; scale: number };
}

export interface ProcessedImage {
  blob: Blob;
  downloadName: string;
  width: number;
  height: number;
  watermarkDetected: boolean;
  metadata?: WatermarkMetadata;
}

export interface BatchResult {
  id: string;
  originalFile: File;
  state: BatchState;
  blob?: Blob;
  previewUrl?: string;
  originalUrl?: string;
  downloadName: string;
  width?: number;
  height?: number;
  error?: string;
  errorCode?: ErrorCode;
}

export interface WatermarkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkerProcessRequest {
  type: "process-image";
  id: string;
  width: number;
  height: number;
  pixels: ArrayBuffer;
  alphaMap: ArrayBuffer;
  rect: WatermarkRect;
  alphaMap48?: ArrayBuffer;
  alphaMap96?: ArrayBuffer;
}

export interface WorkerProcessSuccess {
  type: "process-complete";
  id: string;
  pixels: ArrayBuffer;
  metadata?: WatermarkMetadata;
}

export interface WorkerProcessError {
  type: "process-error";
  id: string;
  message: string;
}

export type WorkerResponse = WorkerProcessSuccess | WorkerProcessError;
