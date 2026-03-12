import { DownloadIcon, EyeIcon, LoaderCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Translator } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { BatchResult } from "@/types";

interface ResultCardProps {
  result: BatchResult;
  isFeatured?: boolean;
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
  isFeatured = false,
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
  const meta =
    result.width && result.height
      ? t("statusMeta", {
          width: result.width,
          height: result.height,
          state: stateLabel,
        })
      : stateLabel;

  return (
    <article
      className={cn(
        "banana-card group/result-card @container overflow-hidden rounded-[1.65rem] border bg-card/95",
        stateClasses[result.state].card,
        isFeatured && "xl:col-span-2",
      )}
      data-state={result.state}
    >
      <div
        className={cn(
          "banana-result-frame relative overflow-hidden",
          isFeatured ? "aspect-[16/10]" : "aspect-[4/3]",
        )}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={result.originalFile.name}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/result-card:scale-[1.03]",
              result.state === "processing" && "scale-[1.02] saturate-75",
            )}
          />
        ) : (
          <Skeleton className="flex h-full w-full items-center justify-center rounded-none bg-primary/10 text-5xl">
            <span>🍌</span>
          </Skeleton>
        )}

        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <Badge
            className={cn(
              "rounded-full px-3 py-1",
              stateClasses[result.state].badge,
            )}
          >
            {stateLabel}
          </Badge>
          {result.width && result.height ? (
            <Badge
              variant="outline"
              className="rounded-full border-border/70 bg-background/85 px-3 py-1 backdrop-blur-sm"
            >
              {result.width} × {result.height}
            </Badge>
          ) : null}
        </div>

        {result.state === "processing" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/45 backdrop-blur-[1px]">
            <LoaderCircleIcon className="size-5 animate-spin text-foreground" />
            <span className="text-sm font-medium text-foreground">
              {t("stateProcessing")}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5 @lg:px-6 @lg:py-6">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">
            {result.originalFile.name}
          </h3>
          <p
            className={cn(
              "text-sm/6",
              result.state === "error"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {result.state === "error" ? (errorMessage ?? result.error) : meta}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 @sm:flex-row @sm:items-center @sm:justify-end">
          {result.state === "success" ? (
            <Button
              type="button"
              variant="outline"
              className="w-full @sm:w-auto"
              onClick={() => onPreview(result.id)}
            >
              <EyeIcon data-icon="inline-start" />
              {t("openPreview")}
            </Button>
          ) : null}
          <Button
            type="button"
            className="w-full @sm:w-auto"
            disabled={result.state !== "success" || !result.blob}
            onClick={() => onDownload(result)}
          >
            <DownloadIcon data-icon="inline-start" />
            {t("downloadOne")}
          </Button>
        </div>
      </div>
    </article>
  );
}
