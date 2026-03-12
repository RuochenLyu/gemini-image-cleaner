import { LoaderCircleIcon } from "lucide-react";
import { useRef, useState } from "react";

import { ACCEPT_ATTRIBUTE } from "@/lib/watermark/constants";
import type { Translator } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface UploadPanelProps {
  onFilesSelected: (files: File[]) => void;
  isBusy: boolean;
  t: Translator;
}

export function UploadPanel({ onFilesSelected, isBusy, t }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const consumeFiles = (fileList: FileList | null): void => {
    const files = Array.from(fileList ?? []);

    if (files.length === 0) {
      return;
    }

    onFilesSelected(files);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <section className="banana-panel rounded-[1.6rem] border p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t("uploadTitle")}
        </h2>
        <p className="text-sm/6 text-muted-foreground">{t("uploadHint")}</p>
      </div>

      <button
        type="button"
        className={cn(
          "banana-dropzone mt-4 flex min-h-[14rem] w-full flex-col items-center justify-center gap-4 rounded-[1.3rem] border border-dashed px-6 py-8 text-center focus-visible:ring-4 focus-visible:ring-ring/40",
        )}
        data-dragging={isDragging}
        aria-busy={isBusy}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (
            event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            return;
          }

          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          consumeFiles(event.dataTransfer.files);
        }}
      >
        <span className="banana-dropzone-mark text-4xl">🍌</span>
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            {isDragging ? t("uploadDropReady") : t("uploadDropTitle")}
          </p>
          <p className="max-w-md text-sm/6 text-muted-foreground">
            {t("uploadDropSubtitle")}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {isBusy ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircleIcon className="size-3.5 animate-spin" />
              {t("uploadBusy")}
            </span>
          ) : (
            <span>{t("uploadFormats")}</span>
          )}
        </div>
      </button>

      <p className="mt-3 text-xs text-muted-foreground">
        {t("pasteHint")} · {t("privacyBadge")}
      </p>

      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        onChange={(event) => consumeFiles(event.target.files)}
      />
    </section>
  );
}
