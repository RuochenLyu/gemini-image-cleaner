import { Globe2Icon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Translator } from "@/lib/i18n";
import type { Locale } from "@/types";

interface LanguageSwitcherProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
  t: Translator;
}

const options: Array<{ value: Locale; label: string }> = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en-US", label: "English" },
  { value: "ja-JP", label: "日本語" },
];

export function LanguageSwitcher({
  locale,
  onChange,
  t,
}: LanguageSwitcherProps) {
  return (
    <div>
      <span className="sr-only">{t("languageLabel")}</span>
      <Select
        value={locale}
        onValueChange={(value) => onChange(value as Locale)}
      >
        <SelectTrigger
          size="sm"
          aria-label={t("languageLabel")}
          className="min-w-[9.25rem] rounded-full border-border/70 bg-background/80 px-3 shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-px hover:border-border hover:bg-background hover:shadow-md"
        >
          <Globe2Icon aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="rounded-2xl">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
