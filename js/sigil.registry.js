/* sigil.registry.js — loads and normalizes /registry.json */
(() => {
  const DEFAULT_URLS = [
    './registry.json',      // /godex/
    '../registry.json',     // /godex/registry/
    '/godex/registry.json', // absolute
    '/godex/registry.json?v=' + Date.now()
  ];

  function normalizeHotkey(hk){
    // Accept "alt+shift+p", "ALT P", "Ctrl+K", etc.
    if (!hk) return null;
    const s = String(hk).trim().toLowerCase()
      .replace(/\s+/g,'')
      .replace(/command|cmd/g,'meta');
    const parts = s.split('+').filter(Boolean);

    const mods = new Set();
    let key = null;

    for (const p of parts){
      if (p === 'ctrl' || p === 'control') mods.add('ctrl');
      else if (p === 'alt' || p === 'option') mods.add('alt');
      else if (p === 'shift') mods.add('shift');
      else if (p === 'meta' || p === 'win' || p === 'super') mods.add('meta');
      else key = p;
    }
    if (!key) return null;
    // single letters
    if (key.length === 1) key = key.toLowerCase();
    return { mods: Array.from(mods).sort(), key };
  }

  async function fetchFirstOk(urls){
    let lastErr = null;
    for (const url of urls){
      try{
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return { url, json: await res.json() };
      }catch(e){ lastErr = e; }
    }
    throw lastErr || new Error('registry fetch failed');
  }

  function normalizeRegistry(raw){
    // Allow: array, or {items:[...]} or {hotkeys:[...]} etc.
    const items =
      Array.isArray(raw) ? raw :
      Array.isArray(raw?.items) ? raw.items :
      Array.isArray(raw?.hotkeys) ? raw.hotkeys :
      Array.isArray(raw?.registry) ? raw.registry :
      [];
    const out = [];
    for (const it of items){
      if (!it) continue;
      const id = (it.id || it.key || it.name || '').toString().trim();
      if (!id) continue;
      const name = (it.name || id).toString().trim();
      const hook = (it.hook || it.fn || it.call || '').toString().trim();
      const hotkey = normalizeHotkey(it.hotkey || it.keybind || it.shortcut);
      out.push({
        id,
        name,
        hook,
        hotkey,
        // optional UI metadata
        node: (it.node || it.dataNode || it.nodeId || '').toString().trim() || null,
        color: (it.color || it.accent || '').toString().trim() || null,
        meta: it
      });
    }
    return out;
  }

  async function loadRegistry(customUrls){
    const urls = (Array.isArray(customUrls) && customUrls.length ? customUrls : null)
      || (Array.isArray(window.__GODEX_REGISTRY_URLS) && window.__GODEX_REGISTRY_URLS.length ? window.__GODEX_REGISTRY_URLS : null)
      || DEFAULT_URLS;

    const { url, json } = await fetchFirstOk(urls);
    const items = normalizeRegistry(json);

    return { url, items, raw: json };
  }

  window.__sigilRegistry = {
    loadRegistry,
    normalizeRegistry,
    normalizeHotkey
  };
})();
