import type { BatchResult, ProcessedImage } from "../../types";
import {
  createDownloadName,
  isSupportedImageFile,
  ProcessingError,
} from "../watermark/file";

type Processor = (file: File) => Promise<ProcessedImage>;

interface BatchQueueOptions {
  processor: Processor;
  onUpdate: (result: BatchResult) => void;
}

function createId(): string {
  return (
    crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

export class BatchQueue {
  private readonly processor: Processor;

  private readonly onUpdate: (result: BatchResult) => void;

  private readonly items = new Map<string, BatchResult>();

  private readonly pendingIds: string[] = [];

  private running = false;

  private idleResolvers: Array<() => void> = [];

  constructor({ processor, onUpdate }: BatchQueueOptions) {
    this.processor = processor;
    this.onUpdate = onUpdate;
  }

  enqueue(files: File[]): BatchResult[] {
    const additions = files.map((file) => {
      const supported = isSupportedImageFile(file);
      const item: BatchResult = {
        id: createId(),
        originalFile: file,
        state: supported ? "pending" : "error",
        originalUrl: supported ? URL.createObjectURL(file) : undefined,
        downloadName: createDownloadName(file.name),
        errorCode: supported ? undefined : "unsupported-format",
      };

      this.items.set(item.id, item);

      if (supported) {
        this.pendingIds.push(item.id);
      }

      return item;
    });

    additions.forEach((item) => this.onUpdate(item));

    queueMicrotask(() => {
      void this.drain();
    });

    return additions;
  }

  async whenIdle(): Promise<void> {
    if (!this.running && this.pendingIds.length === 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.idleResolvers.push(resolve);
    });
  }

  dispose(): void {
    this.idleResolvers.splice(0).forEach((resolve) => resolve());
  }

  private async drain(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    while (this.pendingIds.length > 0) {
      const nextId = this.pendingIds.shift();

      if (!nextId) {
        continue;
      }

      const current = this.items.get(nextId);

      if (!current) {
        continue;
      }

      const processingItem: BatchResult = {
        ...current,
        state: "processing",
        error: undefined,
        errorCode: undefined,
      };

      this.items.set(processingItem.id, processingItem);
      this.onUpdate(processingItem);

      try {
        const processed = await this.processor(processingItem.originalFile);
        const successItem: BatchResult = {
          ...processingItem,
          state: "success",
          blob: processed.blob,
          previewUrl: URL.createObjectURL(processed.blob),
          width: processed.width,
          height: processed.height,
          downloadName: processed.downloadName,
        };

        this.items.set(successItem.id, successItem);
        this.onUpdate(successItem);
      } catch (error) {
        const nextError = toBatchError(error);
        const failedItem: BatchResult = {
          ...processingItem,
          state: "error",
          error: nextError.message,
          errorCode: nextError.code,
        };

        this.items.set(failedItem.id, failedItem);
        this.onUpdate(failedItem);
      }
    }

    this.running = false;
    this.idleResolvers.splice(0).forEach((resolve) => resolve());
  }
}

export async function processImageBatch(
  files: File[],
  processor: Processor,
): Promise<BatchResult[]> {
  const snapshots = new Map<string, BatchResult>();
  const queue = new BatchQueue({
    processor,
    onUpdate: (result) => {
      snapshots.set(result.id, result);
    },
  });
  const initial = queue.enqueue(files);

  initial.forEach((item) => snapshots.set(item.id, item));

  await queue.whenIdle();

  return initial.map((item) => snapshots.get(item.id) ?? item);
}

function toBatchError(error: unknown): ProcessingError {
  if (error instanceof ProcessingError) {
    return error;
  }

  return new ProcessingError("processing-failed", "Processing failed.");
}
