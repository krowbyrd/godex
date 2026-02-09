// godex/vaultUtils.js
(() => {
  "use strict";

  const W = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;

  const REG_URL_DEFAULT = "https://krowbyrd.github.io/godex/registry.json";

  async function fetchRegistry(regUrl = REG_URL_DEFAULT) {
    const r = await fetch(regUrl, { cache: "no-store" });
    if (!r.ok) throw new Error(`registry fetch failed (${r.status})`);
    const reg = await r.json();
    if (!Array.isArray(reg)) throw new Error("registry invalid (expected array)");
    return reg;
  }

  async function vaultGate({ whoami, regUrl = REG_URL_DEFAULT } = {}) {
    if (!whoami) throw new Error("vaultGate missing whoami");

    const reg = await fetchRegistry(regUrl);
    const me = reg.find(x => x?.name === whoami);
    if (!me) throw new Error(`not registered: ${whoami}`);

    // standard exports
    W.vaultRegistry = reg;
    W.vaultSelf = me;

    return { reg, me };
  }

  function vLog(tag, ...args) {
    try {
      console.log(`[${tag}]`, ...args);
    } catch {}
  }

  function vWarn(tag, ...args) {
    try {
      console.warn(`[${tag}]`, ...args);
    } catch {}
  }

  // export
  W.vaultUtils = Object.freeze({
    fetchRegistry,
    vaultGate,
    vLog,
    vWarn,
    REG_URL_DEFAULT
  });
})();