import { LoaderCircleIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
    <button
      type="button"
      className={cn(
        "banana-dropzone group/drop flex w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-[2rem] px-6 py-8 text-center focus-visible:ring-4 focus-visible:ring-ring/40 sm:px-8 sm:py-10",
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
      <img
        src="/hero-before-after.svg"
        alt=""
        aria-hidden="true"
        className="banana-dropzone-illustration pointer-events-none w-full max-w-[16rem] select-none sm:max-w-[18rem]"
      />

      <div className="flex min-h-[5rem] items-center justify-center">
        {isBusy ? (
          <div className="flex items-center gap-2.5">
            <LoaderCircleIcon className="size-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              {t("uploadBusy")}
            </p>
          </div>
        ) : isDragging ? (
          <div className="flex items-center gap-2.5">
            <UploadIcon className="size-5 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {t("uploadDropReady")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 pointer-events-none rounded-full px-12 text-base group-hover/drop:pointer-events-auto"
            >
              <span aria-hidden="true">
                <UploadIcon className="size-5" />
                {t("uploadAction")}
              </span>
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("uploadDropTitle")}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground/70">
        {t("uploadFormats")} · {t("pasteHint")} · {t("privacyBadge")}
      </p>

      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        onChange={(event) => consumeFiles(event.target.files)}
      />
    </button>
  );
}
