(() => {
  "use strict";

  const API_BASE = "https://api.consia.world";
  const WS_BASE  = "wss://api.consia.world";

  const $ = (q) => document.querySelector(q);

  const elRoom = $("#room");
  const elCh = $("#channel");
  const elToken = $("#token");
  const elState = $("#state");
  const elDot = $("#dot");
  const elLog = $("#log");
  const elMsg = $("#msg");
  const btnConnect = $("#connect");
  const btnDisconnect = $("#disconnect");
  const btnSend = $("#send");
  const btnClear = $("#clear");

  let ws = null;

  const now = () => new Date().toLocaleTimeString();

  function log(line, obj) {
    const text = obj ? `${line} ${JSON.stringify(obj)}` : line;
    elLog.textContent += `[${now()}] ${text}\n`;
    elLog.scrollTop = elLog.scrollHeight;
  }

  function setOn(on) {
    elState.textContent = on ? "ON" : "OFF";
    elDot.classList.remove("on", "off");
    elDot.classList.add(on ? "on" : "off");
    btnConnect.disabled = on;
    btnDisconnect.disabled = !on;
    btnSend.disabled = !on;
  }

  function buildWsUrl(room, ch, token) {
    const u = new URL(`${WS_BASE}/ws/${encodeURIComponent(room)}`);
    if (ch) u.searchParams.set("ch", ch);
    if (token) u.searchParams.set("token", token);
    return u.toString();
  }

  async function ping() {
    try {
      const r = await fetch(`${API_BASE}/ping`, { method: "GET" });
      const t = await r.text();
      log("PING:", { ok: r.ok, status: r.status, text: t.slice(0, 80) });
    } catch (e) {
      log("PING ERROR:", { message: String(e) });
    }
  }

  function connect() {
    const room = (elRoom.value || "test").trim();
    const ch = (elCh.value || "default").trim();
    const token = (elToken.value || "").trim();

    // persist token locally (only on your device)
    if (token) localStorage.setItem("CONSIA_OWNER_TOKEN", token);

    const wsUrl = buildWsUrl(room, ch, token);
    log("CONNECT → " + wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setOn(true);
      log("WS OPEN");
      // send hello
      ws.send(JSON.stringify({ type: "hello", room, ch, ts: Date.now() }));
    };

    ws.onmessage = (ev) => {
      const data = ev.data;
      try {
        const j = JSON.parse(data);
        log("WS IN:", j);
      } catch {
        log("WS IN:", { text: String(data) });
      }
    };

    ws.onerror = () => {
      log("WS ERROR");
    };

    ws.onclose = (ev) => {
      log("WS CLOSE:", { code: ev.code, reason: ev.reason || "" });
      ws = null;
      setOn(false);
    };
  }

  function disconnect() {
    if (ws) {
      log("DISCONNECT");
      ws.close(1000, "client_close");
    }
  }

  function send() {
    if (!ws || ws.readyState !== 1) return;

    const text = (elMsg.value || "").trim();
    if (!text) return;

    const payload = {
      type: "msg",
      ch: (elCh.value || "default").trim(),
      text,
      ts: Date.now(),
    };

    ws.send(JSON.stringify(payload));
    log("WS OUT:", payload);
    elMsg.value = "";
    elMsg.focus();
  }

  function clear() {
    elLog.textContent = "";
  }

  // boot
  setOn(false);
  elToken.value = localStorage.getItem("CONSIA_OWNER_TOKEN") || "";

  btnConnect.onclick = () => connect();
  btnDisconnect.onclick = () => disconnect();
  btnSend.onclick = () => send();
  btnClear.onclick = () => clear();

  elMsg.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });

  // optional ping on load
  ping();
})();
