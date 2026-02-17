/* sigil.hooks.js — safe hook resolution + invocation */
(() => {
  function resolvePath(path){
    if (!path) return null;
    // supports "window.vault.paper" or "vault.paper"
    const clean = String(path).trim().replace(/^window\./,'');
    const parts = clean.split('.').filter(Boolean);
    let ctx = window;
    for (const p of parts){
      if (ctx && p in ctx) ctx = ctx[p];
      else return null;
    }
    return ctx;
  }

  function safeCall(hookPath, payload){
    const fn = resolvePath(hookPath);
    if (typeof fn === 'function'){
      try { fn(payload); return true; } catch (e){ console.warn('[sigil] hook threw', hookPath, e); return false; }
    }
    return false;
  }

  window.__sigilHooks = { resolvePath, safeCall };
})();
