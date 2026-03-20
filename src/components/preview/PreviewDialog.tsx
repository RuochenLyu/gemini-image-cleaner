import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Translator } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { BatchResult } from "@/types";

interface PreviewDialogProps {
  selectedId: string | null;
  results: BatchResult[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onDownload: (result: BatchResult) => void;
  t: Translator;
}

export function PreviewDialog({
  selectedId,
  results,
  onClose,
  onSelect,
  onDownload,
  t,
}: PreviewDialogProps) {
  const [mode, setMode] = useState<"processed" | "original">("processed");
  const [fadeKey, setFadeKey] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

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

  const canGoPrev = activeIndex > 0;
  const canGoNext =
    activeIndex >= 0 && activeIndex < successfulResults.length - 1;
  const hasMultipleResults = successfulResults.length > 1;

  const goPrev = useCallback(() => {
    const previous = successfulResults[activeIndex - 1];
    if (previous) {
      setFadeKey((k) => k + 1);
      onSelect(previous.id);
    }
  }, [successfulResults, activeIndex, onSelect]);

  const goNext = useCallback(() => {
    const next = successfulResults[activeIndex + 1];
    if (next) {
      setFadeKey((k) => k + 1);
      onSelect(next.id);
    }
  }, [successfulResults, activeIndex, onSelect]);

  useEffect(() => {
    setMode("processed");
  }, [selectedId]);

  // Trigger fade on mode change
  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [mode]);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && canGoPrev) {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight" && canGoNext) {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, canGoPrev, canGoNext, goPrev, goNext]);

  const imageUrl =
    mode === "processed" ? activeResult?.previewUrl : activeResult?.originalUrl;

  return (
    <Dialog
      open={Boolean(selectedId)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        showCloseButton
        className="banana-panel max-w-[min(96vw,72rem)] gap-6 rounded-[2rem] border-border/70 p-4 sm:p-6"
      >
        <DialogHeader className="gap-4 pr-10">
          <div className="min-w-0 space-y-2">
            <DialogTitle className="min-w-0 break-all text-[clamp(1.4rem,2.5vw,2rem)] leading-tight font-bold tracking-[-0.03em]">
              {activeResult?.originalFile.name ?? t("previewTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm/6">
              {activeResult && activeResult.width && activeResult.height
                ? `${activeResult.width} × ${activeResult.height}`
                : t("noPreview")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "processed" | "original")}
          className="gap-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <TabsList className="rounded-full bg-muted/75 p-1">
              <TabsTrigger
                value="processed"
                disabled={!activeResult}
                className="rounded-full px-4"
              >
                {t("resultImage")}
              </TabsTrigger>
              <TabsTrigger
                value="original"
                disabled={!activeResult}
                className="rounded-full px-4"
              >
                {t("sourceImage")}
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-2">
              {hasMultipleResults ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoPrev}
                    onClick={goPrev}
                  >
                    <ChevronLeftIcon data-icon="inline-start" />
                    {t("previous")}
                    <kbd className="ml-1 hidden text-[10px] text-muted-foreground sm:inline">
                      ←
                    </kbd>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoNext}
                    onClick={goNext}
                  >
                    {t("next")}
                    <ChevronRightIcon data-icon="inline-end" />
                    <kbd className="ml-1 hidden text-[10px] text-muted-foreground sm:inline">
                      →
                    </kbd>
                  </Button>
                </>
              ) : null}
              {activeResult ? (
                <Button type="button" size="sm" onClick={() => onDownload(activeResult)}>
                  <DownloadIcon data-icon="inline-start" />
                  {t("downloadOne")}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="banana-preview-stage flex min-h-[18rem] items-center justify-center overflow-hidden rounded-[1.7rem] border border-border/70">
            {imageUrl ? (
              <img
                ref={imgRef}
                key={fadeKey}
                src={imageUrl}
                alt={activeResult?.originalFile.name ?? t("previewTitle")}
                className={cn(
                  "max-h-[72vh] max-w-full w-full object-contain sm:max-h-[72vh]",
                  "animate-in fade-in duration-300",
                  "max-h-[50vh] landscape:max-h-[60vh] sm:max-h-[72vh]",
                )}
              />
            ) : (
              <div className="px-6 text-center text-muted-foreground">
                {t("noPreview")}
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
