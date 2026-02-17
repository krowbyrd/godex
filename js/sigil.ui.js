/* sigil.ui.js — minimal UI helpers (flash / detected state) */
(() => {
  function qNode(token){
    if (!token) return null;
    // Try exact, uppercase, and as [data-node]
    const t = String(token).trim();
    return document.querySelector(`[data-node="${CSS.escape(t)}"]`)
      || document.querySelector(`[data-node="${CSS.escape(t.toUpperCase())}"]`)
      || document.getElementById(t)
      || null;
  }

  function flash(token){
    const el = qNode(token);
    if (!el) return false;
    el.classList.add('hotkey-hit');
    setTimeout(() => el.classList.remove('hotkey-hit'), 260);
    return true;
  }

  function setDetected(token, on){
    const el = qNode(token);
    if (!el) return false;
    el.classList.toggle('is-detected', !!on);
    return true;
  }

  function toast(msg){
    // ultra-minimal (console only). keep the site silent by default.
    console.log(msg);
  }

  window.__sigilUI = { qNode, flash, setDetected, toast };
})();
