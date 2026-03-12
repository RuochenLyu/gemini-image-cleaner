import { describe, expect, it } from "vitest";
import {
  createTranslator,
  detectBrowserLocale,
  resolveLocale,
} from "../lib/i18n";

describe("locale resolution", () => {
  it("maps zh variants to zh-CN", () => {
    expect(resolveLocale("zh-TW")).toBe("zh-CN");
    expect(resolveLocale("zh-HK")).toBe("zh-CN");
  });

  it("maps ja variants to ja-JP and everything else to en-US", () => {
    expect(resolveLocale("ja")).toBe("ja-JP");
    expect(resolveLocale("fr-FR")).toBe("en-US");
  });

  it("detects browser locale with english fallback", () => {
    expect(detectBrowserLocale(["ja-JP"])).toBe("ja-JP");
    expect(detectBrowserLocale(["es-ES"])).toBe("en-US");
  });

  it("interpolates translated messages", () => {
    const t = createTranslator("en-US");
    expect(t("statusMeta", { width: 1280, height: 720, state: "Done" })).toBe(
      "1280 × 720 · Done",
    );
  });
});
