import type { BatchResult, ErrorCode } from "../../types";
import type { Translator } from "../../lib/i18n";
import { ResultCard } from "./ResultCard";

interface ResultGridProps {
  results: BatchResult[];
  t: Translator;
  onPreview: (id: string) => void;
  onDownload: (result: BatchResult) => void;
}

const errorKeyMap: Record<ErrorCode, Parameters<Translator>[0]> = {
  "unsupported-format": "unsupportedFormat",
  "read-failed": "readFailed",
  "processing-failed": "processingFailed",
  "zip-failed": "zipFailed",
};

export function ResultGrid({
  results,
  t,
  onPreview,
  onDownload,
}: ResultGridProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <section aria-label={t("resultsTitle")}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            t={t}
            onPreview={onPreview}
            onDownload={onDownload}
            errorMessage={
              result.errorCode ? t(errorKeyMap[result.errorCode]) : result.error
            }
          />
        ))}
      </div>
    </section>
  );
}
