(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const API_BASE = "https://api.consia.world";
  const WS_BASE = "wss://api.consia.world";

  let ws = null;

  function log(...args) {
    const el = $("log");
    const line = `[${new Date().toISOString()}] ${args.map(String).join(" ")}`;
    el.textContent += line + "\n";
    el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line no-console
    console.log(...args);
  }

  function setState(on) {
    $("state").textContent = on ? "ON" : "OFF";
    $("connect").disabled = on;
    $("disconnect").disabled = !on;
    $("send").disabled = !on;
  }

  function buildWsUrl() {
    const room = ($("room").value || "test").trim();
    // opcional: canal como query (no rompe nada si el backend lo ignora)
    const channel = $("channel").value || "default";
    const url = `${WS_BASE}/ws/${encodeURIComponent(room)}?channel=${encodeURIComponent(channel)}`;
    $("wsurl").textContent = url;
    return url;
  }

  async function ping() {
    try {
      const r = await fetch(`${API_BASE}/ping`, { cache: "no-store" });
      const t = await r.text();
      log("PING:", r.status, t.slice(0, 80));
    } catch (e) {
      log("PING ERROR:", e?.message || e);
    }
  }

  function connect() {
    if (ws) return;

    const url = buildWsUrl();
    const owner = ($("owner").value || "").trim();

    // Si REQUIRE_OWNER_FOR_WS=1, mandamos header por subprotocol (simple) o query
    // En navegador no podés setear headers arbitrarios en WebSocket.
    // Entonces lo mandamos en query si está puesto.
    const finalUrl = owner ? `${url}&owner=${encodeURIComponent(owner)}` : url;

    log("Conectando a:", finalUrl);

    ws = new WebSocket(finalUrl);

    ws.onopen = () => {
      log("WS OPEN ✅");
      setState(true);
    };

    ws.onmessage = (ev) => {
      log("WS MSG:", ev.data);
    };

    ws.onerror = () => {
      log("WS ERROR ❌");
    };

    ws.onclose = (ev) => {
      log("WS CLOSE:", ev.code, ev.reason || "");
      ws = null;
      setState(false);
    };
  }

  function disconnect() {
    if (!ws) return;
    ws.close(1000, "client_close");
  }

  function send() {
    if (!ws || ws.readyState !== 1) return;
    const msg = ($("msg").value || "").trim();
    if (!msg) return;
    ws.send(JSON.stringify({ type: "msg", text: msg, ts: Date.now() }));
    $("msg").value = "";
  }

  function clear() {
    $("log").textContent = "";
  }

  $("connect").onclick = () => connect();
  $("disconnect").onclick = () => disconnect();
  $("send").onclick = () => send();
  $("clear").onclick = () => clear();

  $("room").addEventListener("input", buildWsUrl);
  $("channel").addEventListener("change", buildWsUrl);

  buildWsUrl();
  ping();
})();
