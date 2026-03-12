(() => {
  const e = document.getElementById("dropzone"),
    t = document.getElementById("file"),
    n = document.getElementById("statusBar"),
    a = document.getElementById("statusText"),
    i = document.getElementById("downloadBtn"),
    s = document.getElementById("langSelectMain");
  let r = null,
    o = null,
    c = null,
    u = null,
    d = 0;
  const l = "gwr_guest_used",
    g = (e, t) =>
      (window.GWRI18n?.messages &&
        window.GWRI18n?.getMessage &&
        window.GWRI18n.getMessage(window.GWRI18n.messages, e)) ||
      t;
  function m(e, t = "", i = "") {
    (i && a.setAttribute("data-i18n", i),
      (a.textContent = e),
      (n.className = "status-bar " + t));
  }
  function w() {
    o && (URL.revokeObjectURL(o), (o = null));
  }
  async function p(t) {
    if ((w(), !t)) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(t.type)) {
      const e = "main_status_error_unsupported";
      return void m(g(e, "error: unsupported_format"), "error", e);
    }
    let n = null;
    try {
      (c && (await c),
        await (async function () {
          return window.GWRApi?.getAuth
            ? ((u = await window.GWRApi.getAuth()), u)
            : null;
        })(),
        await (async function () {
          const e = await ((t = [l]),
          new Promise((e) => {
            chrome?.storage?.local
              ? chrome.storage.local.get(t, (t) => e(t || {}))
              : e({});
          }));
          var t;
          const n = Number(e?.[l] || 0);
          return ((d = Number.isFinite(n) ? n : 0), d);
        })());
      const w = (function () {
        if (!u?.token?.access)
          return {
            isGuest: !0,
            isPro: !1,
            remaining: Math.max(3 - d, 0),
            limit: 3,
            used: d,
          };
        if (
          (function (e) {
            const t = e?.subscription;
            if (!t || (t.status && "active" !== t.status)) return !1;
            const n = Number(t.price);
            return Number.isFinite(n)
              ? n > 0
              : String(t.plan_name || "")
                  .toLowerCase()
                  .includes("pro");
          })(u)
        )
          return {
            isGuest: !1,
            isPro: !0,
            remaining: 1 / 0,
            limit: 1 / 0,
            used: 0,
          };
        const e = u?.subscription || {},
          t = Number.isFinite(Number(e.usage_limit))
            ? Number(e.usage_limit)
            : 10,
          n = Number.isFinite(Number(e.usage_used)) ? Number(e.usage_used) : 0;
        return {
          isGuest: !1,
          isPro: !1,
          remaining: Math.max(t - n, 0),
          limit: t,
          used: n,
        };
      })();
      if (!(w.isPro || w.remaining > 0)) {
        const e = w.isGuest
          ? "main_status_guest_limit"
          : "main_status_quota_exceeded";
        return (
          m(
            w.isGuest ? g(e, "Guest limit reached") : g(e, "Quota exceeded"),
            "warning",
            e,
          ),
          void i.classList.add("disabled")
        );
      }
      (m(
        g("main_status_parsing", "parsing_image..."),
        "processing",
        "main_status_parsing",
      ),
        e.classList.add("loading"));
      const _ = await (async function () {
          return (
            r ||
              (r = window.GeminiWatermarkRemover?.createEngine
                ? window.GeminiWatermarkRemover.createEngine()
                : window.WatermarkEngine?.create
                  ? window.WatermarkEngine.create()
                  : Promise.reject(
                      new Error("WatermarkEngine is not available"),
                    )),
            r
          );
        })(),
        { img: h, url: f } = await ((p = t),
        new Promise((e, t) => {
          const n = URL.createObjectURL(p),
            a = new Image();
          ((a.onload = () => e({ img: a, url: n })),
            (a.onerror = (e) => t(e)),
            (a.src = n));
        }));
      ((n = f),
        m(
          g("main_status_processing", "processing_alpha_blend..."),
          "processing",
          "main_status_processing",
        ));
      const b = await _.removeWatermarkFromImage(h),
        v = await (function (e, t = "image/png") {
          return new Promise((n) => e.toBlob(n, t));
        })(b, "image/png");
      try {
        w.isGuest
          ? await ((a = d + 1),
            (d = Math.max(0, a)),
            (s = { [l]: d }),
            new Promise((e) => {
              chrome?.storage?.local ? chrome.storage.local.set(s, e) : e();
            }))
          : await (async function (e) {
              if (!window.GWRApi?.apiFetch || !u?.subscription?.id || e <= 0)
                return;
              const t = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
              await window.GWRApi.apiFetch("/api/usage/", {
                method: "POST",
                headers: { "Idempotency-Key": t },
                body: {
                  subscription_id: u.subscription.id,
                  count: e,
                  request_id: t,
                },
              });
              const n = Number(u.subscription.usage_used || 0) + e;
              ((u = {
                ...u,
                subscription: { ...u.subscription, usage_used: n },
              }),
                await window.GWRApi.setAuth(u));
            })(1);
      } catch (e) {
        console.warn("[Main] usage report failed:", e?.message || e);
      }
      ((o = URL.createObjectURL(v)),
        (i.href = o),
        (i.download =
          (t.name || "image").replace(/\.(jpg|jpeg|png|webp)$/i, "") +
          "-unwatermarked.png"),
        i.classList.remove("disabled"),
        m(
          g("main_status_success", "success: ready_to_download"),
          "ready",
          "main_status_success",
        ));
    } catch (e) {
      (m(
        g("main_status_error_failed", "error: processing_failed"),
        "error",
        "main_status_error_failed",
      ),
        console.warn("[Main] failed:", e));
    } finally {
      (e.classList.remove("loading"), n && URL.revokeObjectURL(n));
    }
    var a, s, p;
  }
  (window.GWRI18n &&
    (c = window.GWRI18n.initI18n().then(({ locale: e, messages: t }) => {
      (window.GWRI18n.applyI18n(t), s && (s.value = e));
    })),
    chrome?.storage?.onChanged &&
      chrome.storage.onChanged.addListener(async (e, t) => {
        "sync" === t &&
          e.gwr_lang &&
          window.GWRI18n &&
          (await window.GWRI18n.setLocaleAndApply(e.gwr_lang.newValue),
          s && (s.value = e.gwr_lang.newValue));
      }),
    s &&
      s.addEventListener("change", async () => {
        const e = s.value;
        window.GWRI18n && (await window.GWRI18n.setLocaleAndApply(e));
      }),
    e.addEventListener("click", () => t.click()),
    i.addEventListener("click", (t) => {
      if (!o) {
        t.preventDefault();
        const n = "main_status_idle";
        (m(g(n, "Please select an image"), "warning", n),
          e.classList.remove("highlight"),
          e.offsetWidth,
          e.classList.add("highlight"),
          setTimeout(() => e.classList.remove("highlight"), 600));
      }
    }),
    t.addEventListener("change", () => {
      p(t.files?.[0] || null);
    }));
  const _ = (e) => {
    (e.preventDefault(), e.stopPropagation());
  };
  (["dragenter", "dragover"].forEach((t) => {
    e.addEventListener(t, (t) => {
      (_(t), e.classList.add("dragover"));
    });
  }),
    ["dragleave", "drop"].forEach((t) => {
      e.addEventListener(t, (t) => {
        (_(t), e.classList.remove("dragover"));
      });
    }),
    e.addEventListener("drop", (e) => {
      p(e.dataTransfer?.files?.[0] || null);
    }),
    window.addEventListener("beforeunload", w));
})();
