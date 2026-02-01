// ==UserScript==
// @name         Paper Sigil — Variant Sync + Curves + Audio (Clamp + SPA-safe) (TP v2.8.2)
// @namespace    kern-paper
// @version      2.8.2
// @description  Paper Sigil with Codex variant sync (data-paper-variant), per-variant glow + pulse curves, optional mic visualizer bar. Upload custom sigil. DOM-ready safe.
// @match        *://chat.openai.com/*
// @match        *://chatgpt.com/*
// @match        file://*/*
// @downloadURL  https://krowbyrd.github.io/godex/assets/sigil_variant_curves_audio_clamped.user.js
// @updateURL    https://krowbyrd.github.io/godex/assets/sigil_variant_curves_audio_clamped.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  // ---------------------------
  // Settings (safe defaults)
  // ---------------------------
  const CONFIG = {
    width: 96,
    right: 24,
    bottom: 82,
    opacity: 0.92,

    // Visualizer (mic)
    enableMic: true,           // set false to disable mic request

    // Ambient audio (user-gesture gated)
    enableAudio: true,         // enables subtle loop playback
    audioVolume: 0.08,         // 0..1 (keep subtle)
    audioAutoStart: false,     // browsers block autoplay; use UI toggle
    showBar: true,             // show volume bar
    micSmoothing: 0.85,        // 0..1 higher = smoother
    barMaxScale: 5.0,          // max X scale for bar

    // Upload UI
    showUploadUI: true,        // keep on for now
    uploadUIBottomLeft: true,  // position upload UI bottom-left

    // Sync hooks
    defaultVariant: "editor",
    // Optional "shelf" hook: <html data-paper-shelf="live|stable|archive">
    // If absent, shelf stays "live".
    defaultShelf: "live",

    // Safety: keep sigil visible even if screen size changes
    clampToViewport: true,
    minEdgePx: 12
  };

  // ---------------------------
  // Variant palette (matches Codex)
  // Stored as RGB strings for fast rgba()
  // ---------------------------
  const VARIANT_RGB = {
    big:        "159,211,255", // cool blue
    editor:     "127,191,154", // balanced green
    tiny:       "230,209,138", // parchment
    archivist:  "191,167,201", // quiet violet
    executor:   "255,159,127", // action orange
    auditor:    "255,111,111", // warning red
    translator: "127,209,209"  // teal
  };

  // Pulse curves by variant
  // These scale how "alive" the sigil feels *without mic*.
  // (Mic input, when enabled, adds on top.)
  const VARIANT_CURVES = {
    big:        { periodMs: 5200, amp: 0.030 }, // slow breathing
    editor:     { periodMs: 4300, amp: 0.022 }, // calm steady
    tiny:       { periodMs: 3200, amp: 0.016 }, // minimal movement
    archivist:  { periodMs: 5600, amp: 0.018 }, // slow + faint
    executor:   { periodMs: 1900, amp: 0.028 }, // brisk
    auditor:    { periodMs: 2400, amp: 0.024 }, // alert
    translator: { periodMs: 3600, amp: 0.020 }  // neutral
  };

  // Shelf tint overlay (earthy)
  // Used to slightly bias panel aura if you wire shelf sync later.
  const SHELF_TINT = {
    live:   "127,191,154", // green
    stable: "191,191,191", // neutral
    archive:"107,90,69"    // earth brown
  };

  // ---------------------------
  // IDs / storage keys
  // ---------------------------
  const SIGIL_ID = "paper-sigil";
  const BAR_ID = "paper-bar";
  const UPLOAD_ID = "paper-upload";
  const UPLOAD_ZONE_ID = "paper-upload-zone";
  const SIGIL_STORAGE_KEY = "paperSigilCustomImage";
  const AUDIO_STORAGE_KEY = "paperSigilAmbientAudio";
  const AUDIO_TOGGLE_ID = "paper-audio-toggle";
  const AUDIO_UPLOAD_ID = "paper-audio-upload";

  // Default fallback sigil (tiny placeholder, user will upload)
  const fallbackImage =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAElBMVEUAAAB/f3+hoaGZmZmjo6O3t7dV7p+4AAAAAXRSTlMAQObYZgAAADlJREFUGJVjYIACJiYm+VmJgUQgQ0AiGhmZWSkAVAxCyoKEQBUnMYGBkYGRcAMVYMkDFhkBQAAnbgNEbGsyyoAAAAASUVORK5CYII=";

  // ---------------------------
  // Helpers
  // ---------------------------
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function getVariant() {
    return document.documentElement.dataset.paperVariant || CONFIG.defaultVariant;
  }

  function getShelf() {
    return document.documentElement.dataset.paperShelf || CONFIG.defaultShelf;
  }

  function rgbForVariant(v){
    return VARIANT_RGB[v] || VARIANT_RGB[CONFIG.defaultVariant];
  }

  function curveForVariant(v){
    return VARIANT_CURVES[v] || VARIANT_CURVES[CONFIG.defaultVariant];
  }

  function rgbForShelf(s){
    return SHELF_TINT[s] || SHELF_TINT[CONFIG.defaultShelf];
  }

  function rgba(rgb, a){
    return `rgba(${rgb},${a})`;
  }

  
  // ---------------------------
  // Position clamp (prevents “it’s not showing” when offscreen)
  // ---------------------------
  function applyPosition(){
    const minEdge = CONFIG.minEdgePx || 12;
    // Convert right/bottom to pixel offsets that stay on-screen.
    let right = CONFIG.right;
    let bottom = CONFIG.bottom;

    if (CONFIG.clampToViewport){
      const maxRight = Math.max(minEdge, window.innerWidth - minEdge - CONFIG.width);
      // If right is huge (offscreen), force a safe value.
      if (right > window.innerWidth - minEdge) right = minEdge;
      right = clamp(right, minEdge, maxRight);

      const maxBottom = Math.max(minEdge, window.innerHeight - minEdge - CONFIG.width);
      if (bottom > window.innerHeight - minEdge) bottom = minEdge;
      bottom = clamp(bottom, minEdge, maxBottom);
    }

    // Apply as CSS variables so we don’t rebuild style tags.
    document.documentElement.style.setProperty("--paperRight", right + "px");
    document.documentElement.style.setProperty("--paperBottom", bottom + "px");
  }

// ---------------------------
  // Build DOM
  // ---------------------------
  const style = document.createElement("style");
  style.textContent = `
#${SIGIL_ID}{
  position: fixed;
  right: var(--paperRight, 24px);
  bottom: var(--paperBottom, 82px);
  width: ${CONFIG.width}px;
  height: auto;
  opacity: ${CONFIG.opacity};
  pointer-events: none;
  z-index: 9998;
  transform-origin: 50% 50%;
  will-change: transform, filter, opacity;
}

#${BAR_ID}{
  position: fixed;
  bottom: calc(var(--paperBottom, 82px) + 100px);
  right: var(--paperRight, 24px);
  width: 96px;
  height: 8px;
  border-radius: 6px;
  background: rgba(127,191,154,0.25);
  z-index: 9997;
  transform-origin: left center;
  will-change: transform, background;
  opacity: 0.95;
}

#${UPLOAD_ZONE_ID}{
  position: fixed;
  ${CONFIG.uploadUIBottomLeft ? "left: 12px;" : "right: 12px;"}
  bottom: 12px;
  background: rgba(16,18,16,0.72);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(231,239,233,0.95);
  padding: 10px 12px;
  font-size: 12.5px;
  border-radius: 12px;
  box-shadow: 0 0 22px rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
  z-index: 9999;
  font-family: system-ui, Segoe UI, sans-serif;
}

#${UPLOAD_ZONE_ID} input{
  margin-top: 6px;
  width: 220px;
  font-size: 12px;
  color: rgba(231,239,233,0.95);
}

@media (prefers-reduced-motion: reduce){
  #${SIGIL_ID}{ transition:none !important; }
  #${BAR_ID}{ transition:none !important; }
}
`;
  document.head.appendChild(style);

  applyPosition();
  window.addEventListener('resize', applyPosition);

  const img = document.createElement("img");
  img.id = SIGIL_ID;
  img.alt = "Paper Sigil";

  const stored = localStorage.getItem(SIGIL_STORAGE_KEY);
  img.src = stored || fallbackImage;
  document.body.appendChild(img);

  const bar = document.createElement("div");
  bar.id = BAR_ID;
  bar.style.display = CONFIG.showBar ? "block" : "none";
  document.body.appendChild(bar);


  // ---------------------------
  // SPA safety: re-inject if ChatGPT swaps the DOM
  // ---------------------------
  function ensureSigilPresent(){
    if (!document.getElementById(SIGIL_ID)){
      document.body.appendChild(img);
    }
    if (!document.getElementById(BAR_ID)){
      document.body.appendChild(bar);
    }
  }
  const spaObs = new MutationObserver(()=> ensureSigilPresent());
  spaObs.observe(document.documentElement, { childList:true, subtree:true });


  if (CONFIG.showUploadUI){
    const uploadZone = document.createElement("div");
    uploadZone.id = UPLOAD_ZONE_ID;
    uploadZone.innerHTML = `
      <div style="font-weight:650; letter-spacing:.2px;">Sigil image</div>
      <div style="opacity:.8; font-size:11px; margin-top:2px;">Upload overrides local fallback</div>
      <input type="file" id="${UPLOAD_ID}" accept="image/*" />
      <div style="height:10px;"></div>
      <div style="font-weight:650; letter-spacing:.2px;">Ambient audio</div>
      <div style="opacity:.8; font-size:11px; margin-top:2px;">Subtle loop • requires click to start</div>
      <div style="display:flex; gap:8px; align-items:center; margin-top:6px;">
        <button id="${AUDIO_TOGGLE_ID}" style="cursor:pointer; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:rgba(231,239,233,0.95); padding:6px 10px; border-radius:10px; font-size:12px;">Audio: Off</button>
        <input type="file" id="${AUDIO_UPLOAD_ID}" accept="audio/*" style="width: 150px;" />
      </div>
    `;
    document.body.appendChild(uploadZone);

    const up = document.getElementById(UPLOAD_ID);
    if (up){
      up.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target && ev.target.result;
          if (typeof dataUrl === "string"){
            img.src = dataUrl;
            localStorage.setItem(SIGIL_STORAGE_KEY, dataUrl);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // ---------------------------
  // Ambient audio (upload + toggle, gesture-gated)
  // ---------------------------
  let audioEl = null;
  let audioOn = false;

  function ensureAudio(){
    if (!CONFIG.enableAudio) return null;
    if (audioEl) return audioEl;

    audioEl = document.createElement("audio");
    audioEl.loop = true;
    audioEl.preload = "auto";
    audioEl.volume = clamp(CONFIG.audioVolume, 0, 1);

    const storedAudio = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (storedAudio){
      audioEl.src = storedAudio;
    }
    document.body.appendChild(audioEl);
    return audioEl;
  }

  function setAudioButtonState(btn){
    if (!btn) return;
    btn.textContent = audioOn ? "Audio: On" : "Audio: Off";
    // tint to current variant
    const rgbV = rgbForVariant(getVariant());
    btn.style.borderColor = audioOn ? rgba(rgbV, 0.45) : "rgba(255,255,255,0.12)";
    btn.style.boxShadow = audioOn ? `0 0 16px ${rgba(rgbV, 0.18)}` : "none";
  }

  async function toggleAudio(btn){
    if (!CONFIG.enableAudio) return;
    const a = ensureAudio();
    if (!a) return;

    if (!a.src){
      // no audio loaded yet; still allow turning on after user uploads
      audioOn = !audioOn;
      setAudioButtonState(btn);
      return;
    }

    if (!audioOn){
      try{
        await a.play(); // requires user gesture
        audioOn = true;
      }catch(e){
        // blocked by browser policy
        audioOn = false;
      }
    }else{
      a.pause();
      audioOn = false;
    }
    setAudioButtonState(btn);
  }

  function hookAudioUI(){
    const btn = document.getElementById(AUDIO_TOGGLE_ID);
    const up = document.getElementById(AUDIO_UPLOAD_ID);

    if (btn){
      btn.addEventListener("click", ()=> toggleAudio(btn));
      setAudioButtonState(btn);
    }

    if (up){
      up.addEventListener("change", (e)=>{
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev)=>{
          const dataUrl = ev.target && ev.target.result;
          if (typeof dataUrl === "string"){
            const a = ensureAudio();
            a.src = dataUrl;
            localStorage.setItem(AUDIO_STORAGE_KEY, dataUrl);
            // don't autoplay; user toggles
            if (btn) setAudioButtonState(btn);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }


  hookAudioUI();

  // ---------------------------
  // Variant style application
  // ---------------------------
  function applyVariantStyle(){
    const v = getVariant();
    const rgbV = rgbForVariant(v);
    const shelf = getShelf();
    const rgbS = rgbForShelf(shelf);

    // Primary glow by variant + slight shelf bias (earth/neutral/green)
    img.style.filter = [
      `drop-shadow(0 0 12px ${rgba(rgbV, 0.55)})`,
      `drop-shadow(0 0 22px ${rgba(rgbS, 0.14)})`
    ].join(" ");

    bar.style.background = rgba(rgbV, 0.30);

    // Retint audio button to match current mode
    const audioBtn = document.getElementById(AUDIO_TOGGLE_ID);
    if (audioBtn) setAudioButtonState(audioBtn);
  }

  const variantObs = new MutationObserver(applyVariantStyle);
  variantObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-paper-variant","data-paper-shelf"]
  });
  applyVariantStyle();

  // ---------------------------
  // Motion engine: (A) baseline pulse curve + (B) mic-reactive layer
  // ---------------------------
  let micLevel = 0;         // 0..1
  let smoothMic = 0;        // smoothed 0..1
  let micOk = false;

  function startMic(){
    if (!CONFIG.enableMic) return;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      micOk = true;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      function read(){
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i=0;i<data.length;i++) sum += data[i];
        const avg = sum / (data.length * 255); // normalize 0..1
        micLevel = clamp(avg * 1.6, 0, 1);     // gain
        requestAnimationFrame(read);
      }
      read();
    }).catch(() => {
      micOk = false;
      // no console spam
    });
  }

  // Baseline pulse uses a smooth sinusoid with variant-specific period/amp.
  // Mic adds to scale and drives the bar.
  let t0 = performance.now();

  function tick(now){
    const v = getVariant();
    const curve = curveForVariant(v);

    // baseline breath
    const phase = ((now - t0) % curve.periodMs) / curve.periodMs; // 0..1
    const breath = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;     // 0..1
    const baseScale = 1.0 + (breath * 2 - 1) * curve.amp;         // 1±amp

    // smooth mic
    smoothMic = CONFIG.micSmoothing * smoothMic + (1 - CONFIG.micSmoothing) * micLevel;

    const micScale = micOk ? (smoothMic * 0.08) : 0; // additive
    const finalScale = baseScale + micScale;

    img.style.transform = `scale(${finalScale.toFixed(4)})`;

    if (CONFIG.showBar){
      const x = micOk ? clamp(1 + smoothMic * CONFIG.barMaxScale, 1, CONFIG.barMaxScale + 1) : 1;
      bar.style.transform = `scaleX(${x.toFixed(3)})`;
      bar.style.opacity = micOk ? "0.95" : "0.25";
    }

    requestAnimationFrame(tick);
  }

  // Start
  startMic();
  requestAnimationFrame(tick);
})();