import { DownloadIcon, LoaderCircleIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Translator } from "@/lib/i18n";

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
  pending,
  success,
  error,
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

  const processed = success + error;
  const progress = Math.round((processed / total) * 100);

  return (
    <section className="banana-panel rounded-[1.6rem] border p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {isBusy ? (
              <LoaderCircleIcon className="size-4 animate-spin text-primary" />
            ) : (
              <span className="size-2.5 rounded-full bg-success" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isBusy ? t("queueProcessing") : t("queueFinished")}
              </p>
              <p className="text-xs text-muted-foreground">
                {success}/{total}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              {t("summaryPending")} {pending}
            </span>
            <span>
              {t("summarySuccess")} {success}
            </span>
            <span>
              {t("summaryError")} {error}
            </span>
          </div>
        </div>

        <Progress value={progress} />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="w-full sm:flex-1"
            disabled={!canDownloadAll || isZipping}
            onClick={onDownloadAll}
          >
            <DownloadIcon data-icon="inline-start" />
            {isZipping ? t("zipping") : t("downloadAll")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isBusy}
            onClick={onClearAll}
          >
            <Trash2Icon data-icon="inline-start" />
            {t("clearAll")}
          </Button>
        </div>
      </div>
    </section>
  );
}
