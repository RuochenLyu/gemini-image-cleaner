import { describe, expect, it } from "vitest";
import { BatchQueue, processImageBatch } from "../lib/queue/batchQueue";

describe("batch queue", () => {
  it("processes valid files sequentially and flags unsupported ones", async () => {
    const transitions: string[] = [];
    const snapshots = new Map<string, string>();

    const processor = async (file: File) => {
      transitions.push(`start:${file.name}`);
      await Promise.resolve();
      transitions.push(`end:${file.name}`);

      return {
        blob: new Blob([file.name], { type: "image/png" }),
        downloadName: `${file.name}-unwatermarked.png`,
        width: 300,
        height: 200,
        watermarkDetected: true,
      };
    };

    const queue = new BatchQueue({
      processor,
      onUpdate: (result) => {
        snapshots.set(result.originalFile.name, result.state);
      },
    });

    queue.enqueue([
      new File(["a"], "one.png", { type: "image/png" }),
      new File(["b"], "two.jpg", { type: "image/jpeg" }),
      new File(["c"], "three.gif", { type: "image/gif" }),
    ]);

    await queue.whenIdle();

    expect(transitions).toEqual([
      "start:one.png",
      "end:one.png",
      "start:two.jpg",
      "end:two.jpg",
    ]);
    expect(snapshots.get("one.png")).toBe("success");
    expect(snapshots.get("two.jpg")).toBe("success");
    expect(snapshots.get("three.gif")).toBe("error");
  });

  it("returns final snapshots from processImageBatch", async () => {
    const results = await processImageBatch(
      [new File(["a"], "sample.webp", { type: "image/webp" })],
      async (file) => ({
        blob: new Blob([file.name], { type: "image/png" }),
        downloadName: "sample-unwatermarked.png",
        width: 1200,
        height: 900,
        watermarkDetected: true,
      }),
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.state).toBe("success");
    expect(results[0]?.downloadName).toBe("sample-unwatermarked.png");
  });
});
