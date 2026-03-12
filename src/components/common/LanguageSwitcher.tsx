import type { Locale } from "../../types";
import type { Translator } from "../../lib/i18n";

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
    <label className="form-control">
      <span className="sr-only">{t("languageLabel")}</span>
      <select
        className="select select-bordered select-accent select-sm w-36 bg-base-100 font-medium shadow-sm"
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
        aria-label={t("languageLabel")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
