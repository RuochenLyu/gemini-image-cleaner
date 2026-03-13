import { TriangleAlertIcon } from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { StatusSummary } from "@/components/common/StatusSummary";
import { PreviewDialog } from "@/components/preview/PreviewDialog";
import { ResultGrid } from "@/components/results/ResultGrid";
import { UploadPanel } from "@/components/upload/UploadPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";
import { downloadBatchAsZip, downloadBlob } from "@/lib/download/files";
import {
  createTranslator,
  getInitialLocale,
  setStoredLocale,
} from "@/lib/i18n";
import { BatchQueue } from "@/lib/queue/batchQueue";
import { ProcessingError } from "@/lib/watermark/file";
import { WatermarkProcessor } from "@/lib/watermark/process";
import type { BatchResult, Locale } from "@/types";

function revokeResultUrls(results: BatchResult[]): void {
  results.forEach((result) => {
    if (result.previewUrl) {
      URL.revokeObjectURL(result.previewUrl);
    }

    if (result.originalUrl) {
      URL.revokeObjectURL(result.originalUrl);
    }
  });
}

function extractClipboardFiles(event: ClipboardEvent): File[] {
  return Array.from(event.clipboardData?.items ?? [])
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => getInitialLocale());
  const [results, setResults] = useState<BatchResult[]>([]);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    null,
  );
  const [isZipping, setIsZipping] = useState(false);
  const queueRef = useRef<BatchQueue | null>(null);
  const resultsRef = useRef<BatchResult[]>([]);
  const deferredResults = useDeferredValue(results);
  const t = useMemo(() => createTranslator(locale), [locale]);

  useEffect(() => {
    const processor = new WatermarkProcessor();
    const queue = new BatchQueue({
      processor: (file) => processor.removeGeminiWatermark(file),
      onUpdate: (nextResult) => {
        startTransition(() => {
          setResults((current) => {
            const index = current.findIndex(
              (item) => item.id === nextResult.id,
            );

            if (index === -1) {
              return [...current, nextResult];
            }

            const nextResults = [...current];
            nextResults[index] = nextResult;
            return nextResults;
          });
        });
      },
    });

    queueRef.current = queue;

    return () => {
      queue.dispose();
      processor.dispose();
      revokeResultUrls(resultsRef.current);
    };
  }, []);

  const enqueueFiles = (incomingFiles: File[]): void => {
    if (incomingFiles.length === 0) {
      return;
    }

    queueRef.current?.enqueue(incomingFiles);
  };

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
    document.title = `${t("appName")} · ${t("heroTitle")}`;
  }, [locale, t]);

  const handlePaste = useEffectEvent((event: ClipboardEvent) => {
    const pastedFiles = extractClipboardFiles(event);

    if (pastedFiles.length === 0) {
      return;
    }

    event.preventDefault();
    enqueueFiles(pastedFiles);
    toast.success(t("pasteAdded", { count: pastedFiles.length }));
  });

  useEffect(() => {
    const listener = (event: ClipboardEvent) => {
      handlePaste(event);
    };

    window.addEventListener("paste", listener);

    return () => {
      window.removeEventListener("paste", listener);
    };
  }, [handlePaste]);

  const { total, pending, success, error } = useMemo(() => {
    return results.reduce(
      (accumulator, result) => {
        accumulator.total += 1;

        if (result.state === "pending" || result.state === "processing") {
          accumulator.pending += 1;
        }

        if (result.state === "success") {
          accumulator.success += 1;
        }

        if (result.state === "error") {
          accumulator.error += 1;
        }

        return accumulator;
      },
      { total: 0, pending: 0, success: 0, error: 0 },
    );
  }, [results]);

  const isBusy = pending > 0;

  const handleLocaleChange = (nextLocale: Locale): void => {
    setLocale(nextLocale);
    setStoredLocale(nextLocale);
  };

  const handleClear = (): void => {
    revokeResultUrls(resultsRef.current);
    setSelectedPreviewId(null);
    setResults([]);
  };

  const handleDownloadOne = (result: BatchResult): void => {
    if (result.state !== "success" || !result.blob) {
      return;
    }

    downloadBlob(result.blob, result.downloadName);
  };

  const handleDownloadAll = async (): Promise<void> => {
    try {
      setIsZipping(true);
      await downloadBatchAsZip(results);
    } catch (error) {
      const fallback = new ProcessingError("zip-failed", t("zipFailed"));
      const nextError = error instanceof ProcessingError ? error : fallback;

      toast.error(
        nextError.code === "zip-failed" ? t("zipFailed") : nextError.message,
      );
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="banana-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:gap-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="banana-brand-mark flex size-11 items-center justify-center rounded-[1.2rem] border border-white/50">
              <img src="/banana-mark.svg" alt="" className="size-6" />
            </div>
            <p className="whitespace-nowrap text-base font-semibold tracking-tight text-foreground">
              {t("appName")}
            </p>
          </div>

          <LanguageSwitcher
            locale={locale}
            onChange={handleLocaleChange}
            t={t}
          />
        </header>

        <main className="flex flex-1 flex-col gap-6 lg:gap-8">
          <section className="w-full space-y-3">
            <h1 className="text-[clamp(2.4rem,6vw,4.4rem)] font-bold leading-[0.92] tracking-[-0.04em] text-foreground">
              {t("heroTitle")}
            </h1>
            <p className="max-w-3xl text-sm/7 text-muted-foreground sm:text-base/7">
              {t("heroSubtitle")}
            </p>
          </section>

          <UploadPanel onFilesSelected={enqueueFiles} isBusy={isBusy} t={t} />

          <StatusSummary
            total={total}
            pending={pending}
            success={success}
            error={error}
            isBusy={isBusy}
            canDownloadAll={success > 0}
            onDownloadAll={() => {
              void handleDownloadAll();
            }}
            onClearAll={handleClear}
            isZipping={isZipping}
            t={t}
          />

          {error > 0 ? (
            <Alert className="rounded-[1.5rem] border border-destructive/20 bg-destructive/6">
              <TriangleAlertIcon />
              <AlertTitle>{t("partialFailureTitle")}</AlertTitle>
              <AlertDescription>
                <p>{t("partialFailureText")}</p>
              </AlertDescription>
            </Alert>
          ) : null}

          {deferredResults.length > 0 ? (
            <section className="space-y-3">
              <ResultGrid
                results={deferredResults}
                t={t}
                onPreview={setSelectedPreviewId}
                onDownload={handleDownloadOne}
              />
            </section>
          ) : null}
        </main>

        <footer className="flex items-center justify-between border-t border-border/60 pt-4 text-sm text-muted-foreground">
          <a
            href="https://github.com/RuochenLyu/gemini-image-cleaner"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" />
            {t("privacyBadge")}
          </span>
        </footer>
      </div>

      <PreviewDialog
        selectedId={selectedPreviewId}
        results={results}
        onClose={() => setSelectedPreviewId(null)}
        onSelect={setSelectedPreviewId}
        onDownload={handleDownloadOne}
        t={t}
      />

      <Toaster position="bottom-right" />
    </div>
  );
}
