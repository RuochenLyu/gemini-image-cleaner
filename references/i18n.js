(() => {
  const e = [
      "en_US",
      "zh_CN",
      "zh_TW",
      "ja",
      "ko",
      "de",
      "fr",
      "es",
      "pt_BR",
      "vi",
    ],
    t = "gwr_lang";
  async function n() {
    const e = () => {
      try {
        return localStorage.getItem(t);
      } catch (e) {
        return null;
      }
    };
    return new Promise((n) => {
      chrome?.storage?.sync
        ? chrome.storage.sync.get([t], (r) => {
            n(r?.[t] || e());
          })
        : n(e());
    });
  }
  function r() {
    const t = (chrome?.i18n?.getUILanguage?.() || "en")
        .replaceAll("-", "_")
        .toLowerCase(),
      n = e.find((e) => e.toLowerCase() === t);
    if (n) return n;
    const r = t.split("_")[0];
    return "zh" === r
      ? t.includes("tw") ||
        t.includes("hk") ||
        t.includes("mo") ||
        t.includes("hant")
        ? "zh_TW"
        : "zh_CN"
      : "ja" === r
        ? "ja"
        : "ko" === r
          ? "ko"
          : "de" === r
            ? "de"
            : "fr" === r
              ? "fr"
              : "es" === r
                ? "es"
                : "pt" === r
                  ? "pt_BR"
                  : "vi" === r
                    ? "vi"
                    : "en_US";
  }
  function a(e, t = []) {
    if (!e) return "";
    let n = e;
    return (
      t.forEach((e, t) => {
        const r = `$${t + 1}`;
        n = n.replace(r, e);
      }),
      1 === t.length && (n = n.replace("{count}", t[0])),
      n
    );
  }
  async function o(e) {
    try {
      const t = chrome.runtime.getURL(`_locales/${e}/messages.json`),
        n = await fetch(t);
      if (!n.ok) throw new Error(`Failed to load ${e}`);
      return n.json();
    } catch (t) {
      return (
        console.warn(`[GWR] Failed to load locale ${e}, falling back to en_US`),
        "en_US" !== e ? o("en_US") : {}
      );
    }
  }
  function c(e, t, n = []) {
    if (!e)
      return (chrome?.i18n?.getMessage && chrome.i18n.getMessage(t, n)) || "";
    const r = e?.[t] || {},
      o = (function (e, t = {}, n = []) {
        let r = e;
        return (
          Object.keys(t || {}).forEach((e) => {
            const o = `$${e}$`,
              c = `$${e.toUpperCase()}$`;
            let s = t[e]?.content || "";
            ((s = a(s, n)), (r = r.replaceAll(o, s).replaceAll(c, s)));
          }),
          r
        );
      })(r.message || "", r.placeholders, n);
    return a(o, n);
  }
  function s(e) {
    (document.querySelectorAll("[data-i18n]").forEach((t) => {
      const n = t.getAttribute("data-i18n"),
        r = t.getAttribute("data-i18n-args"),
        a = r ? r.split("|") : [],
        o = c(e, n, a);
      o &&
        (t.hasAttribute("data-i18n-html")
          ? (t.innerHTML = o)
          : (t.textContent = o));
    }),
      document.querySelectorAll("[data-i18n-attr]").forEach((t) => {
        t.getAttribute("data-i18n-attr")
          .split(";")
          .forEach((n) => {
            const [r, a] = n.split(":").map((e) => e.trim());
            if (!r || !a) return;
            const o = c(e, a);
            t.setAttribute(r, o);
          });
      }));
  }
  window.GWRI18n = {
    initI18n: async function () {
      const t = await n(),
        a = e.includes(t) ? t : r(),
        c = await o(a);
      return ((window.GWRI18n.messages = c), { locale: a, messages: c });
    },
    applyI18n: s,
    setLocaleAndApply: async function (n) {
      if (!e.includes(n)) return;
      await (async function (e) {
        try {
          localStorage.setItem(t, e);
        } catch (e) {}
        return new Promise((n) => {
          chrome?.storage?.sync ? chrome.storage.sync.set({ [t]: e }, n) : n();
        });
      })(n);
      const r = await o(n);
      ((window.GWRI18n.messages = r), s(r));
    },
    getStoredLocale: n,
    getDefaultLocale: r,
    getMessage: c,
  };
})();
