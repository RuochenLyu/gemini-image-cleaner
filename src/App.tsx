import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSwitcher } from "./components/common/LanguageSwitcher";
import { StatusSummary } from "./components/common/StatusSummary";
import { PreviewDialog } from "./components/preview/PreviewDialog";
import { ResultGrid } from "./components/results/ResultGrid";
import { UploadPanel } from "./components/upload/UploadPanel";
import {
  createTranslator,
  getInitialLocale,
  setStoredLocale,
} from "./lib/i18n";
import { downloadBatchAsZip, downloadBlob } from "./lib/download/files";
import { BatchQueue } from "./lib/queue/batchQueue";
import { ProcessingError } from "./lib/watermark/file";
import { WatermarkProcessor } from "./lib/watermark/process";
import type { BatchResult, Locale } from "./types";

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
  const [notice, setNotice] = useState<string | null>(null);
  const queueRef = useRef<BatchQueue | null>(null);
  const resultsRef = useRef<BatchResult[]>([]);
  const t = useMemo(() => createTranslator(locale), [locale]);

  useEffect(() => {
    const processor = new WatermarkProcessor();
    const queue = new BatchQueue({
      processor: (file) => processor.removeGeminiWatermark(file),
      onUpdate: (nextResult) => {
        setResults((current) => {
          const index = current.findIndex((item) => item.id === nextResult.id);

          if (index === -1) {
            return [...current, nextResult];
          }

          const nextResults = [...current];
          nextResults[index] = nextResult;
          return nextResults;
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
    document.documentElement.setAttribute("data-theme", "caramellatte");
  }, [locale]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const pastedFiles = extractClipboardFiles(event);

      if (pastedFiles.length === 0) {
        return;
      }

      event.preventDefault();
      queueRef.current?.enqueue(pastedFiles);
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const total = results.length;
  const pending = results.filter(
    (result) => result.state === "pending" || result.state === "processing",
  ).length;
  const success = results.filter((result) => result.state === "success").length;
  const error = results.filter((result) => result.state === "error").length;
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

      setNotice(
        nextError.code === "zip-failed" ? t("zipFailed") : nextError.message,
      );
    } finally {
      setIsZipping(false);
    }
  };

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [notice]);

  return (
    <div className="banana-app min-h-screen">
      <div className="navbar mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="banana-brand-mark flex size-11 items-center justify-center rounded-box border border-base-100/40 shadow-sm">
              <img src="/banana-mark.svg" alt="" className="size-7" />
            </div>
            <p className="text-lg font-semibold text-base-content">
              {t("appName")}
            </p>
          </div>
        </div>
        <div className="flex-none">
          <LanguageSwitcher
            locale={locale}
            onChange={handleLocaleChange}
            t={t}
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-12 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-base-content md:text-3xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-base-content/60 md:text-base">
            {t("heroSubtitle")}
          </p>
        </header>

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

        {results.length > 0 ? (
          <ResultGrid
            results={results}
            t={t}
            onPreview={setSelectedPreviewId}
            onDownload={handleDownloadOne}
          />
        ) : null}
      </main>

      <PreviewDialog
        selectedId={selectedPreviewId}
        results={results}
        onClose={() => setSelectedPreviewId(null)}
        onSelect={setSelectedPreviewId}
        t={t}
      />

      {notice ? (
        <div className="toast toast-end toast-bottom">
          <div className="alert border border-error/20 bg-base-100 text-base-content shadow-lg">
            <span>{notice}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
