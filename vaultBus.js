/* PROJECT_GODEX: vaultBus.js (v1)
   Minimal event bus for cross-agent coordination.
   Exports: window.vaultBus (or unsafeWindow.vaultBus when available)
*/
(function (root) {
  "use strict";

  const W = (typeof unsafeWindow !== "undefined") ? unsafeWindow : root;

  // Don't clobber if already present (hot reload safe)
  if (W.vaultBus && typeof W.vaultBus.emit === "function") return;

  const listeners = new Map(); // event -> Set<fn>
  const ANY = "*";

  function getSet(evt) {
    let set = listeners.get(evt);
    if (!set) { set = new Set(); listeners.set(evt, set); }
    return set;
  }

  function safeLog(kind, ...args) {
    try {
      const U = W.vaultUtils;
      if (U && typeof U[kind] === "function") return U[kind]("Bus", ...args);
    } catch {}
    // fallback
    if (kind === "vWarn") console.warn("[Bus]", ...args);
    else if (kind === "vErr") console.error("[Bus]", ...args);
    else console.log("[Bus]", ...args);
  }

  const bus = {
    version: "1.0.0",

    on(evt, fn) {
      if (!evt || typeof fn !== "function") return () => {};
      const set = getSet(evt);
      set.add(fn);
      return () => this.off(evt, fn);
    },

    once(evt, fn) {
      if (!evt || typeof fn !== "function") return () => {};
      const off = this.on(evt, (...args) => { off(); fn(...args); });
      return off;
    },

    off(evt, fn) {
      const set = listeners.get(evt);
      if (!set) return;
      set.delete(fn);
      if (set.size === 0) listeners.delete(evt);
    },

    emit(evt, payload) {
      // Deliver to exact listeners, then wildcard listeners
      const deliver = (set) => {
        if (!set) return;
        for (const fn of Array.from(set)) {
          try { fn(payload, evt); }
          catch (e) { safeLog("vErr", "handler error", evt, e); }
        }
      };

      deliver(listeners.get(evt));
      deliver(listeners.get(ANY));
    },

    // Debug/visibility helpers
    count(evt) {
      if (!evt) {
        let n = 0;
        for (const set of listeners.values()) n += set.size;
        return n;
      }
      return listeners.get(evt)?.size || 0;
    },

    list() {
      const out = {};
      for (const [k, set] of listeners.entries()) out[k] = set.size;
      return out;
    }
  };

  W.vaultBus = bus;
  safeLog("vLog", "online", `v${bus.version}`);
})(typeof window !== "undefined" ? window : globalThis);