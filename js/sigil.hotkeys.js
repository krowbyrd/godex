/* sigil.hotkeys.js — one keydown listener + dispatcher */
(() => {
  function isTypingTarget(el){
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function keySigFromEvent(e){
    const mods = [];
    if (e.ctrlKey) mods.push('ctrl');
    if (e.altKey) mods.push('alt');
    if (e.shiftKey) mods.push('shift');
    if (e.metaKey) mods.push('meta');
    const key = (e.key || '').toLowerCase();
    return { mods: mods.sort(), key };
  }

  function sameHotkey(a,b){
    if (!a || !b) return false;
    if (a.key !== b.key) return false;
    if (a.mods.length !== b.mods.length) return false;
    for (let i=0;i<a.mods.length;i++) if (a.mods[i] !== b.mods[i]) return false;
    return true;
  }

  function install(items, onMatch){
    const active = Array.isArray(items) ? items.filter(it => it?.hotkey?.key) : [];
    const handler = (e) => {
      if (e.defaultPrevented) return;
      if (isTypingTarget(e.target)) return;

      const sig = keySigFromEvent(e);
      for (const it of active){
        if (sameHotkey(sig, it.hotkey)){
          try { onMatch(it, e); } catch(err){ console.warn('[sigil] onMatch error', err); }
          // prevent browser shortcuts stealing the event
          e.preventDefault();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }

  window.__sigilHotkeys = { install };
})();
