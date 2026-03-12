import type { Locale } from "../../types";
import { messages, type MessageKey } from "./messages";

export const LOCALE_STORAGE_KEY = "banana-cleaner-locale";

const localeFallbackMap: Locale[] = ["zh-CN", "en-US", "ja-JP"];

function normalizeLocale(input?: string | null): Locale {
  const value = input?.toLowerCase().trim();

  if (!value) {
    return "en-US";
  }

  if (value.startsWith("zh")) {
    return "zh-CN";
  }

  if (value.startsWith("ja")) {
    return "ja-JP";
  }

  if (value.startsWith("en")) {
    return "en-US";
  }

  return "en-US";
}

export function resolveLocale(input?: string | null): Locale {
  return normalizeLocale(input);
}

export function detectBrowserLocale(
  preferredLocales: readonly string[] = navigator.languages,
): Locale {
  for (const locale of preferredLocales) {
    const normalized = normalizeLocale(locale);

    if (localeFallbackMap.includes(normalized)) {
      return normalized;
    }
  }

  return normalizeLocale(navigator.language);
}

export function getInitialLocale(): Locale {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  return stored ? resolveLocale(stored) : detectBrowserLocale();
}

export function setStoredLocale(locale: Locale): void {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function translate(
  locale: Locale,
  key: MessageKey,
  values?: Record<string, string | number>,
): string {
  const template = messages[locale][key] ?? messages["en-US"][key] ?? key;
  let message = String(template);

  if (!values) {
    return message;
  }

  for (const [name, value] of Object.entries(values)) {
    message = message.replaceAll(`{${name}}`, String(value));
  }

  return message;
}

export type Translator = (
  key: MessageKey,
  values?: Record<string, string | number>,
) => string;

export function createTranslator(locale: Locale): Translator {
  return (key, values) => translate(locale, key, values);
}
