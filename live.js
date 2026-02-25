(() => {
  "use strict";

  const API_BASE = "https://api.consia.world";

  const $ = (sel) => document.querySelector(sel);
  const logEl = $("#log");
  const stateEl = $("#state");
  const wsUrlEl = $("#wsurl");

  const roomEl = $("#room");
  const channelEl = $("#channel");
  const userEl = $("#user");
  const msgEl = $("#msg");

  const btnConnect = $("#connect");
  const btnDisconnect = $("#disconnect");
  const btnJoin = $("#join");
  const btnPing = $("#ping");
  const btnSendText = $("#sendText");

  let ws = null;

  function log(...args) {
    const line = `[${new Date().toLocaleTimeString()}] ${args.map(String).join(" ")}`;
    logEl.textContent += line + "\n";
    logEl.scrollTop = logEl.scrollHeight;
    // eslint-disable-next-line no-console
    console.log(...args);
  }

  function setState(on) {
    stateEl.textContent = on ? "ON" : "OFF";
    stateEl.className = "pill " + (on ? "ok" : "bad");
    btnDisconnect.disabled = !on;
    btnJoin.disabled = !on;
    btnPing.disabled = !on;
    btnSendText.disabled = !on;
    btnConnect.disabled = on;
  }

  async function getRoomInfo(room, channel) {
    const r = await fetch(`${API_BASE}/room/${encodeURIComponent(room)}?channel=${encodeURIComponent(channel)}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j?.data?.error || "room_info_failed");
    return j.data;
  }

  function buildWsUrl(room, channel) {
    // Siempre conectar al API (donde está el Worker con DO bindings)
    return `wss://api.consia.world/ws/${encodeURIComponent(room)}?channel=${encodeURIComponent(channel)}`;
  }

  function wsSend(obj) {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify(obj));
  }

  async function connect() {
    const room = roomEl.value.trim() || "test";
    const channel = channelEl.value.trim() || "default";

    try {
      const info = await getRoomInfo(room, channel);
      log("room info:", JSON.stringify(info));
    } catch (e) {
      log("room info error:", e.message);
    }

    const url = buildWsUrl(room, channel);
    wsUrlEl.textContent = url;

    ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      log("WS open");
      setState(true);
    };

    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        log("WS msg:", ev.data);
      } else {
        log("WS bin:", `bytes=${ev.data.byteLength}`);
      }
    };

    ws.onclose = () => {
      log("WS closed");
      setState(false);
      ws = null;
    };

    ws.onerror = () => {
      log("WS error");
    };
  }

  function disconnect() {
    if (ws) ws.close(1000, "bye");
  }

  btnConnect.onclick = () => connect();
  btnDisconnect.onclick = () => disconnect();

  btnJoin.onclick = () => {
    const room = roomEl.value.trim() || "test";
    const channel = channelEl.value.trim() || "default";
    const user = userEl.value.trim() || "anon";
    wsSend({ type: "join", room, channel, user });
  };

  btnPing.onclick = () => wsSend({ type: "ping" });

  btnSendText.onclick = () => {
    const text = msgEl.value.trim() || "hola";
    wsSend({ type: "chat", text });
    msgEl.value = "";
  };

  setState(false);
})();
