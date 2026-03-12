import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/watermark/process", () => {
  class MockWatermarkProcessor {
    async removeGeminiWatermark(file: File) {
      return {
        blob: new Blob([file.name], { type: "image/png" }),
        downloadName: `${file.name.replace(/\.[^.]+$/, "")}-unwatermarked.png`,
        width: 640,
        height: 480,
      };
    }

    dispose() {}
  }

  return {
    WatermarkProcessor: MockWatermarkProcessor,
  };
});

import App from "../App";

describe("App", () => {
  it("moves uploaded files from pending to success", async () => {
    window.localStorage.setItem("banana-cleaner-locale", "en-US");

    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]');

    expect(input).not.toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Results" }),
    ).not.toBeInTheDocument();

    fireEvent.change(input as HTMLInputElement, {
      target: {
        files: [new File(["demo"], "sample.png", { type: "image/png" })],
      },
    });

    await waitFor(() => {
      expect(screen.getAllByText("Complete").length).toBeGreaterThan(0);
    });

    expect(
      screen.getByRole("heading", { name: "Results" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("640 × 480").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
  });
});
