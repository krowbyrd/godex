(() => {
  "use strict";

  const WHOAMI = "Lux";
  const HEARTBEAT_MS = 15000;

  // hard reset
  if (window.__luxBeatTimer) clearTimeout(window.__luxBeatTimer);
  window.__luxBeatTimer = null;

  const mk = (me, event) => ({
    event,
    name: me.name,
    id: me.id,
    href: location.href,
    ts: Date.now()
  });

  const loop = (me) => {
    vaultUtils.busEmit?.("agent:heartbeat", mk(me, "agent:heartbeat"));
    window.__luxBeatTimer = setTimeout(() => loop(me), HEARTBEAT_MS);
  };

  vaultUtils.vaultGate({ whoami: WHOAMI })
    .then((me) => {
      vaultUtils.busEmit?.("agent:ready", mk(me, "agent:ready"));
      window.__luxBeatTimer = setTimeout(() => loop(me), HEARTBEAT_MS);
      console.log("[Lux] emitter armed (timeout loop)");
    })
    .catch((e) => console.warn("[Lux] blocked:", e.message));
})();