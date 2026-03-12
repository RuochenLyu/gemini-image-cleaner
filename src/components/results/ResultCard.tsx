import type { BatchResult } from "../../types";
import type { Translator } from "../../lib/i18n";

interface ResultCardProps {
  result: BatchResult;
  t: Translator;
  onPreview: (id: string) => void;
  onDownload: (result: BatchResult) => void;
  errorMessage: string | undefined;
}

const stateClasses: Record<BatchResult["state"], string> = {
  pending: "badge-warning",
  processing: "badge-info",
  success: "badge-success",
  error: "badge-error",
};

const cardClasses: Record<BatchResult["state"], string> = {
  pending: "border-warning/30",
  processing: "border-info/30",
  success: "border-success/30",
  error: "border-error/30",
};

export function ResultCard({
  result,
  t,
  onPreview,
  onDownload,
  errorMessage,
}: ResultCardProps) {
  const stateLabelMap = {
    pending: t("statePending"),
    processing: t("stateProcessing"),
    success: t("stateSuccess"),
    error: t("stateError"),
  } as const;

  const previewUrl = result.previewUrl ?? result.originalUrl;
  const meta = stateLabelMap[result.state];

  return (
    <article
      className={`card overflow-hidden border bg-base-100 transition-shadow hover:shadow-md ${cardClasses[result.state]}`}
    >
      <figure className="relative aspect-[4/3] overflow-hidden bg-base-200">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={result.originalFile.name}
            className={`relative h-full w-full object-cover ${
              result.state === "processing" ? "opacity-80 saturate-75" : ""
            }`}
          />
        ) : (
          <div className="skeleton relative flex h-full w-full items-center justify-center text-5xl text-base-content/45">
            <span>🍌</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className={`badge badge-lg ${stateClasses[result.state]}`}>
            {stateLabelMap[result.state]}
          </span>
        </div>

        {result.state === "processing" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-base-100/45">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : null}
      </figure>

      <div className="card-body gap-3 p-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="card-title line-clamp-1 text-base text-base-content">
              {result.originalFile.name}
            </h3>
            {result.width && result.height ? (
              <span className="badge badge-outline whitespace-nowrap">
                {result.width} × {result.height}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-base-content/68">
            {result.state === "error" ? (errorMessage ?? result.error) : meta}
          </p>
        </div>

        <div className="card-actions justify-end gap-2">
          {result.state === "success" ? (
            <button
              type="button"
              className="btn btn-outline btn-secondary btn-sm"
              onClick={() => onPreview(result.id)}
            >
              {t("openPreview")}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-sm btn-accent"
            disabled={result.state !== "success" || !result.blob}
            onClick={() => onDownload(result)}
          >
            {t("downloadOne")}
          </button>
        </div>
      </div>
    </article>
  );
}
