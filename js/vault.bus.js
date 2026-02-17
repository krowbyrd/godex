/* vault.bus.js — optional minimal event bus (kept tiny; no magic) */
(() => {
  const listeners = new Map();
  function on(name, fn){
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => listeners.get(name)?.delete(fn);
  }
  function emit(name, payload){
    const set = listeners.get(name);
    if (set){
      for (const fn of Array.from(set)){
        try{ fn(payload); }catch(e){ console.warn('[vaultBus] listener error', e); }
      }
    }
  }
  window.vaultBus = window.vaultBus || { on, emit };
})();
