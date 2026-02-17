/* PROJECT_GODEX: vaultUtils.js (v1)
   Remote-first + Registered-only gate + tiny helpers
*/
(function (root) {
  "use strict";

  const U = {};

  // Prefer page window when possible (Tampermonkey sandbox-safe)
  U.W = () => (typeof unsafeWindow !== "undefined" ? unsafeWindow : window);

  // Minimal logger (consistent tags)
  U.vLog = (scope, ...args) => console.log(`[%c${scope}%c]`, "color:#8be9fd;font-weight:bold;", "color:inherit;", ...args);
  U.vWarn = (scope, ...args) => console.warn(`[%c${scope}%c]`, "color:#ffb86c;font-weight:bold;", "color:inherit;", ...args);
  U.vErr = (scope, ...args) => console.error(`[%c${scope}%c]`, "color:#ff5555;font-weight:bold;", "color:inherit;", ...args);

  // Remote-first canonical registry pull + identity gate
  U.vaultGate = async function vaultGate(opts) {
    const REG_URL = (opts && opts.regUrl) || "https://krowbyrd.github.io/godex/registry.json";
    const WHOAMI  = (opts && opts.whoami) || "";
    const W = U.W();

    if (!WHOAMI) throw new Error("whoami missing");

    const r = await fetch(REG_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("registry fetch failed");

    const reg = await r.json();
    if (!Array.isArray(reg)) throw new Error("registry invalid");

    const me = reg.find(x => x && x.name === WHOAMI);
    if (!me) throw new Error("not registered");

    // Standard exports (read-only usage elsewhere)
    W.vaultRegistry = reg;
    W.vaultSelf = me;

    return me;
  };

  // Tiny CSS injector (idempotent)
  U.ensureStyle = function ensureStyle(id, cssText) {
    const doc = document;
    if (doc.getElementById(id)) return;
    const s = doc.createElement("style");
    s.id = id;
    s.textContent = cssText;
    (doc.head || doc.documentElement).appendChild(s);
  };

  // Optional: small “presence dot” helper
  U.ensurePresenceDot = function ensurePresenceDot(id, title, cssText) {
    const doc = document;
    if (!doc.getElementById(id)) {
      const dot = doc.createElement("div");
      dot.id = id;
      dot.title = title || "";
      (doc.body || doc.documentElement).appendChild(dot);
    }
    if (cssText) U.ensureStyle(id + "_style", cssText);
  };

  // Export
  root.vaultUtils = U;
})(typeof window !== "undefined" ? window : globalThis);