import type { Translator } from "../../lib/i18n";

interface StatusSummaryProps {
  total: number;
  pending: number;
  success: number;
  error: number;
  isBusy: boolean;
  canDownloadAll: boolean;
  onDownloadAll: () => void;
  onClearAll: () => void;
  isZipping: boolean;
  t: Translator;
}

export function StatusSummary({
  total,
  success,
  isBusy,
  canDownloadAll,
  onDownloadAll,
  onClearAll,
  isZipping,
  t,
}: StatusSummaryProps) {
  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {isBusy ? (
          <span className="loading loading-spinner loading-sm text-primary" />
        ) : (
          <span className="inline-block size-2 rounded-full bg-success" />
        )}
        <p className="text-sm font-medium text-base-content">
          {isBusy ? t("queueProcessing") : t("queueFinished")}
        </p>
        <span className="text-sm text-base-content/50">
          {success}/{total}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-accent btn-sm"
          disabled={!canDownloadAll || isZipping}
          onClick={onDownloadAll}
        >
          {isZipping ? t("zipping") : t("downloadAll")}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={isBusy}
          onClick={onClearAll}
        >
          {t("clearAll")}
        </button>
      </div>
    </div>
  );
}
