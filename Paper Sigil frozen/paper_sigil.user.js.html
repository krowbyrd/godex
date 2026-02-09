// ==UserScript==
// @name         Paper Sigil (Hotkey Only)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Breathing Paper orb. Alt+O. Silent pulse + subtle ding fallback.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const SIGIL_ID = "paperSigil";
  const HOTKEY = { altKey: true, key: "o" };

  let sigilEl = null;
  let audioCtx = null;

  function ensureStyles() {
    if (document.getElementById("paperStyle")) return;

    const style = document.createElement("style");
    style.id = "paperStyle";
    style.textContent = `
      @keyframes paperBreath {
        0%,100% { transform: scale(1); opacity: 0.72; }
        50% { transform: scale(1.38); opacity: 1; }
      }
      @keyframes paperAck {
        0% { transform: scale(1); }
        40% { transform: scale(1.8); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  function applyStyle(el) {
    el.style.cssText =
      "position:fixed;right:48px;bottom:120px;width:18px;height:18px;" +
      "background:radial-gradient(circle, rgba(230,181,102,0.9), transparent);" +
      "border-radius:50%;z-index:2147483647;cursor:pointer;" +
      "animation:paperBreath 3.6s ease-in-out infinite;";
  }

  function ding() {
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = 740;
      g.gain.value = 0.02;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.08);
    } catch {}
  }

  function createSigil() {
    if (document.getElementById(SIGIL_ID)) return;

    const el = document.createElement("div");
    el.id = SIGIL_ID;
    applyStyle(el);

    el.onclick = () => {
      el.style.animation = "paperAck 220ms ease-out";
      setTimeout(() => applyStyle(el), 240);
      ding();
    };

    document.body.appendChild(el);
    sigilEl = el;
  }

  function hotkey(e) {
    if (e.altKey && e.key.toLowerCase() === HOTKEY.key) {
      createSigil();
      sigilEl?.click();
      e.preventDefault();
    }
  }

  window.addEventListener("keydown", hotkey);

  const boot = setInterval(() => {
    if (document.body) {
      clearInterval(boot);
      ensureStyles();
      createSigil();
    }
  }, 50);
})();