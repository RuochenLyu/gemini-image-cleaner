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
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          {isBusy ? (
            <LoaderCircleIcon className="size-3.5 animate-spin text-primary" />
          ) : (
            <span className="banana-pulse-dot size-2 rounded-full bg-success" />
          )}
          <span className="text-sm font-medium text-foreground">
            {isBusy ? t("queueProcessing") : t("queueFinished")}
          </span>
          <span className="text-xs text-muted-foreground">
            {success}/{total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={!canDownloadAll || isZipping}
            onClick={onDownloadAll}
          >
            <DownloadIcon data-icon="inline-start" />
            {isZipping ? t("zipping") : t("downloadAll")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={onClearAll}
          >
            <Trash2Icon data-icon="inline-start" />
            {t("clearAll")}
          </Button>
        </div>
      </div>

      <Progress value={progress} />
    </section>
  );
}
