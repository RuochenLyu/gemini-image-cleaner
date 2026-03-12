import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type { BatchResult } from "../types";
import { buildZipBlob, createZipFilename } from "../lib/download/files";

function createSuccessResult(id: string, filename: string): BatchResult {
  return {
    id,
    originalFile: new File(["input"], `${id}.png`, { type: "image/png" }),
    state: "success",
    blob: new Blob([filename], { type: "image/png" }),
    downloadName: filename,
  };
}

describe("download helpers", () => {
  it("creates stable ZIP names", () => {
    const filename = createZipFilename(new Date("2026-03-12T08:09:10"));
    expect(filename).toBe("gemini-unwatermarked-20260312-080910.zip");
  });

  it("packs only successful files into ZIP", async () => {
    const blob = await buildZipBlob([
      createSuccessResult("one", "one-unwatermarked.png"),
      {
        id: "two",
        originalFile: new File(["bad"], "bad.gif", { type: "image/gif" }),
        state: "error",
        downloadName: "bad-unwatermarked.png",
      },
      createSuccessResult("three", "three-unwatermarked.png"),
    ]);

    const archive = await JSZip.loadAsync(await blob.arrayBuffer());

    expect(Object.keys(archive.files)).toEqual([
      "one-unwatermarked.png",
      "three-unwatermarked.png",
    ]);
  });
});
