import { DownloadIcon, EyeIcon, LoaderCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Translator } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { BatchResult } from "@/types";

interface ResultCardProps {
  result: BatchResult;
  t: Translator;
  onPreview: (id: string) => void;
  onDownload: (result: BatchResult) => void;
  errorMessage: string | undefined;
}

const stateClasses: Record<
  BatchResult["state"],
  { badge: string; card: string }
> = {
  pending: {
    badge: "border-warning/25 bg-warning/12 text-warning-foreground",
    card: "border-warning/18",
  },
  processing: {
    badge: "border-primary/30 bg-primary/15 text-primary-foreground",
    card: "border-primary/20",
  },
  success: {
    badge: "border-success/25 bg-success/12 text-success-foreground",
    card: "border-success/16",
  },
  error: {
    badge: "border-destructive/20 bg-destructive/10 text-destructive",
    card: "border-destructive/18",
  },
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
  const stateLabel = stateLabelMap[result.state];
  const isSuccess = result.state === "success";

  return (
    <article
      className={cn(
        "banana-card group/result-card @container overflow-hidden rounded-[1.65rem] border bg-card/95",
        stateClasses[result.state].card,
        isSuccess && "cursor-pointer",
      )}
      data-state={result.state}
      onClick={() => {
        if (isSuccess) onPreview(result.id);
      }}
    >
      <div className="banana-result-frame relative aspect-[4/3] overflow-hidden">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={result.originalFile.name}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-transform duration-280 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/result-card:-translate-y-0.5",
              result.state === "processing" && "saturate-75",
            )}
          />
        ) : (
          <Skeleton className="flex h-full w-full items-center justify-center rounded-none bg-primary/10 text-5xl">
            <span>🍌</span>
          </Skeleton>
        )}

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs",
              stateClasses[result.state].badge,
            )}
          >
            {stateLabel}
          </Badge>
          {result.width && result.height ? (
            <Badge
              variant="outline"
              className="rounded-full border-border/70 bg-background/85 px-2.5 py-0.5 text-xs backdrop-blur-sm"
            >
              {result.width} × {result.height}
            </Badge>
          ) : null}
        </div>

        {result.state === "processing" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/45 backdrop-blur-[1px]">
            <LoaderCircleIcon className="size-5 animate-spin text-foreground" />
            <span className="text-sm font-medium text-foreground">
              {t("stateProcessing")}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {result.originalFile.name}
          </p>
          {result.state === "error" ? (
            <p className="truncate text-xs text-destructive">
              {errorMessage ?? result.error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isSuccess ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("openPreview")}
              onClick={(e) => {
                e.stopPropagation();
                onPreview(result.id);
              }}
            >
              <EyeIcon />
            </Button>
          ) : null}
          <Button
            type="button"
            variant={isSuccess ? "default" : "ghost"}
            size="icon-sm"
            aria-label={t("downloadOne")}
            disabled={!isSuccess || !result.blob}
            onClick={(e) => {
              e.stopPropagation();
              onDownload(result);
            }}
          >
            <DownloadIcon />
          </Button>
        </div>
      </div>
    </article>
  );
}
