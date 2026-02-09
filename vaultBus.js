/* PROJECT_GODEX: vaultBus.js (v1.0.0)
   Root-synced Event Bus (Tampermonkey-safe)
*/
(function (root) {
  "use strict";

  // Root window bridge
  const W = (typeof unsafeWindow !== "undefined") ? unsafeWindow : root;

  // Idempotent install
  if (W.vaultBus && typeof W.vaultBus.emit === "function") {
    console.log("[Bus] online v1.0.0 (reused)");
    return;
  }

  const bus = {
    _et: new EventTarget(),

    emit(evt, detail) {
      try {
        this._et.dispatchEvent(new CustomEvent(evt, { detail }));
      } catch (e) {
        // ultra-failsoft: CustomEvent should exist, but keep it resilient
        console.warn("[Bus] emit failed:", evt, e?.message);
      }
    },

    on(evt, handler) {
      this._et.addEventListener(evt, (e) => handler(e.detail, e), { passive: true });
    },

    off(evt, handler) {
      // NOTE: off() only works if you pass the *same* wrapped handler.
      // Most usage can skip off() and let page lifetime handle it.
      this._et.removeEventListener(evt, handler);
    }
  };

  W.vaultBus = bus;

  console.log("[Bus] online v1.0.0");
})(typeof window !== "undefined" ? window : globalThis);