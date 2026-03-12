import { useRef, useState } from "react";
import { ACCEPT_ATTRIBUTE } from "../../lib/watermark/constants";
import type { Translator } from "../../lib/i18n";

interface UploadPanelProps {
  onFilesSelected: (files: File[]) => void;
  isBusy: boolean;
  t: Translator;
}

export function UploadPanel({ onFilesSelected, t }: UploadPanelProps) {
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
    <section>
      <button
        type="button"
        className={[
          "flex min-h-[12rem] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-box border-2 border-dashed px-6 py-8 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          isDragging
            ? "banana-dropzone-active"
            : "banana-dropzone hover:border-primary/40",
        ].join(" ")}
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
        <span className="text-4xl">🍌</span>

        <div className="space-y-1">
          <p className="text-lg font-semibold text-base-content">
            {t("uploadDropTitle")}
          </p>
          <p className="text-sm text-base-content/60">
            {t("uploadDropSubtitle")}
          </p>
        </div>

        <p className="text-xs text-base-content/40">
          JPG · PNG · WEBP · {t("privacyBadge")}
        </p>
      </button>

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
