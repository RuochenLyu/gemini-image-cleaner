import { useEffect, useMemo, useRef, useState } from "react";
import type { BatchResult } from "../../types";
import type { Translator } from "../../lib/i18n";

interface PreviewDialogProps {
  selectedId: string | null;
  results: BatchResult[];
  onClose: () => void;
  onSelect: (id: string) => void;
  t: Translator;
}

export function PreviewDialog({
  selectedId,
  results,
  onClose,
  onSelect,
  t,
}: PreviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"processed" | "original">("processed");

  const successfulResults = useMemo(() => {
    return results.filter(
      (result) =>
        result.state === "success" && result.previewUrl && result.originalUrl,
    );
  }, [results]);

  const activeIndex = successfulResults.findIndex(
    (result) => result.id === selectedId,
  );
  const activeResult = activeIndex >= 0 ? successfulResults[activeIndex] : null;

  useEffect(() => {
    setMode("processed");
  }, [selectedId]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (selectedId && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!selectedId && dialog.open) {
      dialog.close();
    }
  }, [selectedId]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  const imageUrl =
    mode === "processed" ? activeResult?.previewUrl : activeResult?.originalUrl;

  return (
    <dialog
      ref={dialogRef}
      className="banana-preview-backdrop preview-dialog modal modal-bottom sm:modal-middle"
      onClose={onClose}
    >
      <div className="banana-panel modal-box max-w-5xl border p-5 shadow-xl md:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-base-content md:text-2xl">
                {activeResult?.originalFile.name ?? t("noPreview")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-base-content/68">
                {activeResult && activeResult.width && activeResult.height
                  ? `${activeResult.width} × ${activeResult.height}`
                  : t("noPreview")}
              </p>
            </div>

            <form method="dialog">
              <button
                type="submit"
                className="btn btn-circle btn-ghost"
                onClick={onClose}
              >
                ✕
              </button>
            </form>
          </div>

          <div role="tablist" className="tabs tabs-boxed w-fit">
            <button
              type="button"
              role="tab"
              className={`tab ${mode === "processed" ? "tab-active" : ""}`}
              onClick={() => setMode("processed")}
              disabled={!activeResult}
            >
              {t("resultImage")}
            </button>
            <button
              type="button"
              role="tab"
              className={`tab ${mode === "original" ? "tab-active" : ""}`}
              onClick={() => setMode("original")}
              disabled={!activeResult}
            >
              {t("sourceImage")}
            </button>
          </div>

          <div className="overflow-hidden rounded-box bg-base-200">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={activeResult?.originalFile.name ?? t("previewTitle")}
                className="max-h-[70vh] w-full object-contain"
              />
            ) : (
              <div className="flex min-h-[20rem] items-center justify-center text-base-content/60">
                {t("noPreview")}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="badge badge-outline">
              {activeResult
                ? `${activeIndex + 1} / ${successfulResults.length}`
                : ""}
            </div>

            <div className="join">
              <button
                type="button"
                className="btn btn-outline join-item"
                disabled={activeIndex <= 0}
                onClick={() => {
                  const previous = successfulResults[activeIndex - 1];

                  if (previous) {
                    onSelect(previous.id);
                  }
                }}
              >
                {t("previous")}
              </button>
              <button
                type="button"
                className="btn btn-outline join-item"
                disabled={
                  activeIndex < 0 || activeIndex >= successfulResults.length - 1
                }
                onClick={() => {
                  const next = successfulResults[activeIndex + 1];

                  if (next) {
                    onSelect(next.id);
                  }
                }}
              >
                {t("next")}
              </button>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          {t("close")}
        </button>
      </form>
    </dialog>
  );
}
