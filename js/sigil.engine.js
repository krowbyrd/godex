/* sigil.engine.js — the single brain (registry → hotkeys → hooks → UI) */
(() => {
  const LOG_PREFIX = '[vault hotkeys]';

  function ensureVault(){
    window.vault = window.vault || {};
    return window.vault;
  }

  function ensureStubs(items){
    const v = ensureVault();
    for (const it of items){
      // if hook is window.vault.X, ensure v.X exists as a stub (do not overwrite)
      const hook = (it.hook || '').trim();
      const m = hook.match(/^window\.vault\.([A-Za-z0-9_$]+)$/) || hook.match(/^vault\.([A-Za-z0-9_$]+)$/);
      if (m){
        const k = m[1];
        if (typeof v[k] !== 'function'){
          v[k] = () => {
            console.log('[vault]', it.id || it.name || k);
            // try to flash a node using node/name/id
            if (window.__sigilUI){
              window.__sigilUI.flash(it.node || it.name || it.id || k);
            }
          };
        }
      }
    }
  }

  function publish(evtName, detail){
    try{
      window.dispatchEvent(new CustomEvent(evtName, { detail }));
    }catch(_){}
    // optional bus bridge
    if (window.vaultBus && typeof window.vaultBus.emit === 'function'){
      try { window.vaultBus.emit(evtName, detail); } catch(_){}
    }
  }

  async function boot(){
    if (!window.__sigilRegistry || !window.__sigilHotkeys || !window.__sigilHooks || !window.__sigilUI){
      console.warn(LOG_PREFIX, 'missing modules; did scripts load in order?');
      return;
    }

    const { url, items } = await window.__sigilRegistry.loadRegistry();
    ensureStubs(items);

    console.log(LOG_PREFIX, 'registry loaded:', url, 'items:', items.length);

    const uninstall = window.__sigilHotkeys.install(items, (it, e) => {
      const token = it.node || it.name || it.id;
      // Visual confirmation
      window.__sigilUI.flash(token);

      // Call hook if present
      const ok = it.hook && window.__sigilHooks.safeCall(it.hook, { item: it, event: e });

      publish('vault:hotkey', { id: it.id, name: it.name, hook: it.hook, ok });

      console.log('[vault]', (it.id || it.name || token));
    });

    window.__sigilEngine = { uninstall, registryUrl: url, items };

    console.log(LOG_PREFIX, 'installed', items.filter(x => x?.hotkey?.key).length);
  }

  // DOM-safe start
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => boot().catch(err => console.warn(LOG_PREFIX, 'failed', err)), { once:true });
  }else{
    boot().catch(err => console.warn(LOG_PREFIX, 'failed', err));
  }
})();
