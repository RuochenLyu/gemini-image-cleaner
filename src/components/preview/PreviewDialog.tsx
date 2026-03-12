import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <DialogTitle className="font-display text-[clamp(1.8rem,3vw,2.8rem)] tracking-[-0.05em]">
                {activeResult?.originalFile.name ?? t("previewTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm/6">
                {activeResult && activeResult.width && activeResult.height
                  ? `${activeResult.width} × ${activeResult.height}`
                  : t("noPreview")}
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeResult ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-background/80 px-3 py-1"
                >
                  {activeIndex + 1} / {successfulResults.length}
                </Badge>
              ) : null}
              {activeResult ? (
                <Button size="sm" onClick={() => onDownload(activeResult)}>
                  <DownloadIcon data-icon="inline-start" />
                  {t("downloadOne")}
                </Button>
              ) : null}
            </div>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeIndex <= 0}
                onClick={() => {
                  const previous = successfulResults[activeIndex - 1];

                  if (previous) {
                    onSelect(previous.id);
                  }
                }}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                {t("previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
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
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>

          <div className="banana-preview-stage flex min-h-[18rem] items-center justify-center overflow-hidden rounded-[1.7rem] border border-border/70">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={activeResult?.originalFile.name ?? t("previewTitle")}
                className="max-h-[72vh] w-full object-contain"
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
