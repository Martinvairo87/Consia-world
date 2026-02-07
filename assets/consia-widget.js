/* CONSIA Widget v1.0 — “One Tap Magic”
   - 1 gesto: tocar el avatar (orb) => abre CONSIA
   - Multilenguaje: auto-detect por navegador + respuestas desde API en el idioma del usuario
   - Casi sin botones: Avatar / Mic / Enviar
   - Minimizar avatar: 1 toque en “–”
   - No expone secretos (solo llama a tu API)
*/

(function () {
  "use strict";

  // ======= Config =======
  const DEFAULT_API_URL = "https://api.consia.world/ask"; // tu Worker /ask
  const DEFAULT_BRAND = "CONSIA";
  const STORAGE_KEY = "consia_widget_state_v1";
  const SESSION_KEY = "consia_session_id_v1";
  const DEVICE_KEY = "consia_device_id_v1";

  const cfg = window.CONSIA_WIDGET_CONFIG || {};
  const API_URL = cfg.apiUrl || DEFAULT_API_URL;
  const BRAND = cfg.brand || DEFAULT_BRAND;

  // ======= Helpers =======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function uid() {
    return (crypto.randomUUID ? crypto.randomUUID() : (Date.now() + "-" + Math.random()))
      .toString()
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 24);
  }

  function getOrCreate(key, prefix) {
    try {
      let v = localStorage.getItem(key);
      if (!v) {
        v = (prefix || "") + uid();
        localStorage.setItem(key, v);
      }
      return v;
    } catch {
      return (prefix || "") + uid();
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveState(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s || {}));
    } catch {}
  }

  function detectLang() {
    // idioma del mundo: usamos preferencia del navegador
    // la API responde en ese idioma (por tu /ask).
    const lang =
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      "en";
    return (lang || "en").toLowerCase();
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function haptic() {
    try {
      if (navigator.vibrate) navigator.vibrate(12);
    } catch {}
  }

  // ======= UI Strings (mínimos, casi sin texto) =======
  // Minimalismo: iconos + microcopy ultra corto. Fallback: sin texto.
  const I18N = {
    es: {
      placeholder: "Decime qué querés. (o escribí “.”)",
      hint: "Tocá el avatar. Todo se hace solo.",
      mic: "Hablar",
      send: "Enviar",
      close: "Cerrar",
      mini: "Minimizar",
      open: "Abrir CONSIA",
      thinking: "Procesando…",
      error: "Error. Reintentar.",
      quick1: "Activar modo rápido",
      quick2: "Iniciar reunión",
      quick3: "Resumen y solución",
    },
    en: {
      placeholder: "Tell me what you want. (or type “.”)",
      hint: "Tap the avatar. Everything runs itself.",
      mic: "Speak",
      send: "Send",
      close: "Close",
      mini: "Minimize",
      open: "Open CONSIA",
      thinking: "Processing…",
      error: "Error. Retry.",
      quick1: "Fast mode",
      quick2: "Start meeting",
      quick3: "Summarize & solve",
    },
    pt: {
      placeholder: "Me diga o que você quer. (ou “.”)",
      hint: "Toque no avatar. Tudo acontece sozinho.",
      mic: "Falar",
      send: "Enviar",
      close: "Fechar",
      mini: "Minimizar",
      open: "Abrir CONSIA",
      thinking: "Processando…",
      error: "Erro. Tentar de novo.",
      quick1: "Modo rápido",
      quick2: "Iniciar reunião",
      quick3: "Resumir e resolver",
    },
  };

  function t(key) {
    const lang = detectLang();
    const base = lang.split("-")[0];
    const pack = I18N[base] || I18N.en;
    return pack[key] || "";
  }

  // ======= Build UI =======
  const state = loadState();
  const sessionId = getOrCreate(SESSION_KEY, "s_");
  const deviceId = getOrCreate(DEVICE_KEY, "d_");
  const startMinimized = !!state.minimized;

  const root = document.createElement("div");
  root.id = "consia-widget-root";
  root.innerHTML = `
    <style>
      :root{
        --cw-bg: rgba(7,7,9,.78);
        --cw-panel: rgba(255,255,255,.06);
        --cw-panel2: rgba(255,255,255,.09);
        --cw-border: rgba(255,255,255,.13);
        --cw-text: rgba(255,255,255,.92);
        --cw-muted: rgba(255,255,255,.64);
        --cw-shadow: 0 30px 90px rgba(0,0,0,.55);
        --cw-radius: 20px;
        --cw-a: rgba(0,163,255,.95);
        --cw-b: rgba(85,204,255,.95);
      }

      #consia-widget-root{
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483000;
        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
      }

      /* ---- Avatar (ORB) ---- */
      .cw-orb-wrap{
        position: fixed;
        right: 18px;
        bottom: 18px;
        width: 74px;
        height: 74px;
        pointer-events: auto;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .cw-orb{
        width: 74px;
        height: 74px;
        border-radius: 999px;
        background:
          radial-gradient(34px 34px at 30% 28%, rgba(255,255,255,.30), transparent 55%),
          radial-gradient(42px 42px at 60% 68%, rgba(0,163,255,.26), transparent 60%),
          radial-gradient(80px 80px at 50% 50%, rgba(0,0,0,.55), rgba(0,0,0,.80));
        border: 1px solid rgba(255,255,255,.14);
        box-shadow: 0 18px 50px rgba(0,0,0,.55);
        position: relative;
        overflow: hidden;
        transform: translateZ(0);
      }

      .cw-orb::before{
        content:"";
        position:absolute;
        inset:-30%;
        background: conic-gradient(from 240deg, rgba(0,163,255,.0), rgba(0,163,255,.25), rgba(255,255,255,.10), rgba(85,204,255,.22), rgba(0,163,255,.0));
        filter: blur(18px);
        animation: cwSpin 2.9s linear infinite;
      }

      .cw-orb::after{
        content:"";
        position:absolute;
        inset: 0;
        background:
          radial-gradient(22px 22px at 35% 30%, rgba(255,255,255,.40), transparent 60%),
          radial-gradient(18px 18px at 62% 72%, rgba(85,204,255,.22), transparent 70%);
        mix-blend-mode: screen;
        opacity: .85;
      }

      @keyframes cwSpin{ to{ transform: rotate(360deg);} }

      .cw-orb-pulse{
        position:absolute;
        inset:-8px;
        border-radius: 999px;
        border: 1px solid rgba(0,163,255,.22);
        animation: cwPulse 2.2s ease-in-out infinite;
        pointer-events:none;
      }
      @keyframes cwPulse{
        0%,100% { transform: scale(1); opacity: .25; }
        50% { transform: scale(1.08); opacity: .55; }
      }

      .cw-mini{
        position:absolute;
        top:-6px;
        left:-6px;
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: rgba(255,255,255,.10);
        border: 1px solid rgba(255,255,255,.16);
        backdrop-filter: blur(12px);
        display:flex;
        align-items:center;
        justify-content:center;
        color: rgba(255,255,255,.82);
        font-weight: 800;
        font-size: 14px;
        line-height: 1;
      }

      .cw-orb-badge{
        position:absolute;
        right:-2px;
        top:-2px;
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: rgba(0,163,255,.95);
        box-shadow: 0 0 0 2px rgba(7,7,9,.8);
        opacity: .9;
      }

      /* ---- Panel ---- */
      .cw-panel{
        position: fixed;
        inset: 0;
        pointer-events: auto;
        display: none;
        background: radial-gradient(1200px 700px at 30% 10%, rgba(0,163,255,.18), transparent 55%),
                    radial-gradient(900px 600px at 80% 40%, rgba(85,204,255,.12), transparent 55%),
                    rgba(7,7,9,.76);
        backdrop-filter: blur(14px);
      }
      .cw-panel.open{ display:block; }

      .cw-shell{
        position:absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%,-50%);
        width: min(960px, calc(100vw - 24px));
        height: min(720px, calc(100vh - 24px));
        border-radius: var(--cw-radius);
        border: 1px solid var(--cw-border);
        background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05));
        box-shadow: var(--cw-shadow);
        overflow:hidden;
      }

      .cw-top{
        height: 60px;
        display:flex;
        align-items:center;
        justify-content: space-between;
        padding: 0 14px 0 18px;
        border-bottom: 1px solid rgba(255,255,255,.10);
        background: rgba(0,0,0,.18);
      }
      .cw-brand{
        display:flex;
        align-items:center;
        gap: 10px;
        color: var(--cw-text);
        letter-spacing: 4px;
        font-weight: 900;
        font-size: 14px;
      }
      .cw-dot{
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(0,163,255,.95);
        box-shadow: 0 0 20px rgba(0,163,255,.35);
      }

      .cw-actions{
        display:flex;
        align-items:center;
        gap: 10px;
      }
      .cw-iconbtn{
        width: 38px;
        height: 38px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.06);
        color: rgba(255,255,255,.88);
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .cw-iconbtn:active{ transform: scale(.98); }

      .cw-body{
        display:flex;
        height: calc(100% - 60px);
      }

      .cw-left{
        width: 290px;
        border-right: 1px solid rgba(255,255,255,.10);
        padding: 16px;
        display:flex;
        flex-direction: column;
        gap: 12px;
        background: rgba(0,0,0,.10);
      }
      .cw-hint{
        color: var(--cw-muted);
        font-size: 13px;
        line-height: 1.35;
        padding: 12px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 16px;
        background: rgba(255,255,255,.05);
      }
      .cw-quick{
        display:flex;
        flex-direction: column;
        gap: 10px;
      }
      .cw-q{
        display:flex;
        align-items:center;
        gap: 10px;
        padding: 12px 12px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.06);
        color: rgba(255,255,255,.90);
        cursor:pointer;
        font-weight: 700;
        font-size: 13px;
      }
      .cw-q small{
        color: rgba(255,255,255,.55);
        font-weight: 600;
      }
      .cw-q:active{ transform: scale(.995); }

      .cw-right{
        flex: 1;
        display:flex;
        flex-direction: column;
        height: 100%;
      }

      .cw-chat{
        flex: 1;
        padding: 16px;
        overflow:auto;
      }
      .cw-msg{
        max-width: 780px;
        margin: 0 auto 12px auto;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.06);
        color: rgba(255,255,255,.92);
        white-space: pre-wrap;
        line-height: 1.45;
        font-size: 14px;
      }
      .cw-msg.user{
        background: rgba(0,163,255,.10);
        border-color: rgba(0,163,255,.20);
      }
      .cw-meta{
        max-width: 780px;
        margin: 0 auto 10px auto;
        color: rgba(255,255,255,.55);
        font-size: 12px;
        display:flex;
        justify-content: space-between;
      }

      .cw-inputbar{
        border-top: 1px solid rgba(255,255,255,.10);
        background: rgba(0,0,0,.18);
        padding: 12px;
        display:flex;
        gap: 10px;
        align-items: center;
      }
      .cw-input{
        flex: 1;
        height: 46px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.06);
        color: rgba(255,255,255,.92);
        outline: none;
        padding: 0 14px;
        font-size: 14px;
      }
      .cw-input::placeholder{ color: rgba(255,255,255,.45); }

      .cw-send{
        width: 52px;
        height: 46px;
        border-radius: 16px;
        border: 1px solid rgba(0,163,255,.28);
        background: rgba(0,163,255,.16);
        color: rgba(255,255,255,.92);
        cursor:pointer;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      .cw-send:active{ transform: scale(.98); }

      .cw-mic{
        width: 52px;
        height: 46px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.06);
        color: rgba(255,255,255,.92);
        cursor:pointer;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      .cw-mic.on{
        border-color: rgba(0,163,255,.35);
        background: rgba(0,163,255,.14);
      }

      /* Mobile */
      @media (max-width: 860px){
        .cw-shell{ height: calc(100vh - 18px); width: calc(100vw - 18px); }
        .cw-left{ display:none; }
      }

      /* minimized orb */
      .cw-orb-wrap.minimized{
        width: 58px; height: 58px;
      }
      .cw-orb-wrap.minimized .cw-orb{ width:58px; height:58px; }
      .cw-orb-wrap.minimized .cw-orb-pulse{ inset:-6px; }
      .cw-orb-wrap.minimized .cw-mini{ display:none; }
    </style>

    <div class="cw-orb-wrap ${startMinimized ? "minimized" : ""}" aria-label="${t("open")}">
      <div class="cw-orb" role="button" tabindex="0"></div>
      <div class="cw-orb-pulse"></div>
      <div class="cw-mini" title="${t("mini")}" aria-label="${t("mini")}">–</div>
      <div class="cw-orb-badge"></div>
    </div>

    <div class="cw-panel" aria-hidden="true">
      <div class="cw-shell" role="dialog" aria-modal="true">
        <div class="cw-top">
          <div class="cw-brand">
            <span class="cw-dot"></span>
            <span>${BRAND}</span>
          </div>
          <div class="cw-actions">
            <div class="cw-iconbtn cw-close" title="${t("close")}" aria-label="${t("close")}">✕</div>
          </div>
        </div>

        <div class="cw-body">
          <div class="cw-left">
            <div class="cw-hint">${t("hint")}</div>
            <div class="cw-quick">
              <div class="cw-q" data-q=".">
                <div>⚡</div>
                <div><div>${t("quick1")}</div><small>“.”</small></div>
              </div>
              <div class="cw-q" data-q="Reunión. Iniciar y guiar automático.">
                <div>🎙️</div>
                <div><div>${t("quick2")}</div><small>“Reunión”</small></div>
              </div>
              <div class="cw-q" data-q="Resumí, resolvé y decime el siguiente paso mínimo.">
                <div>🧠</div>
                <div><div>${t("quick3")}</div><small>1 paso</small></div>
              </div>
            </div>
          </div>

          <div class="cw-right">
            <div class="cw-chat"></div>
            <div class="cw-inputbar">
              <button class="cw-mic" type="button" title="${t("mic")}" aria-label="${t("mic")}">🎤</button>
              <input class="cw-input" type="text" spellcheck="false" autocomplete="off" placeholder="${t("placeholder")}" />
              <button class="cw-send" type="button" title="${t("send")}" aria-label="${t("send")}">➤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.documentElement.appendChild(root);

  const orbWrap = $(".cw-orb-wrap", root);
  const orb = $(".cw-orb", root);
  const miniBtn = $(".cw-mini", root);
  const panel = $(".cw-panel", root);
  const closeBtn = $(".cw-close", root);
  const chat = $(".cw-chat", root);
  const input = $(".cw-input", root);
  const sendBtn = $(".cw-send", root);
  const micBtn = $(".cw-mic", root);
  const quicks = $$(".cw-q", root);

  function openPanel() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    haptic();
    setTimeout(() => input.focus(), 30);
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    haptic();
  }

  function toggleMinimize() {
    const minimized = !orbWrap.classList.contains("minimized");
    orbWrap.classList.toggle("minimized", minimized);
    state.minimized = minimized;
    saveState(state);
    haptic();
  }

  function addMsg(role, text) {
    const meta = document.createElement("div");
    meta.className = "cw-meta";
    meta.innerHTML = `<span>${role === "user" ? "YOU" : BRAND}</span><span>${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>`;

    const m = document.createElement("div");
    m.className = "cw-msg " + (role === "user" ? "user" : "ai");
    m.textContent = text || "";

    chat.appendChild(meta);
    chat.appendChild(m);
    chat.scrollTop = chat.scrollHeight;
  }

  function setThinking(on) {
    micBtn.disabled = on;
    sendBtn.disabled = on;
    input.disabled = on;
    if (on) {
      addMsg("ai", t("thinking"));
    }
  }

  async function ask(message) {
    const lang = detectLang();
    const headers = {
      "content-type": "application/json",
      "x-consia-session": sessionId,
      "x-consia-device": deviceId,
      "x-consia-lang": lang,
      // AUTH: si tu UI usa USER_TOKEN, podés setearlo en window.CONSIA_WIDGET_CONFIG.userToken
    };
    if (cfg.userToken) headers["authorization"] = "Bearer " + cfg.userToken;

    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error("api_error_" + res.status + " " + txt.slice(0, 200));
    }
    return res.json();
  }

  async function send(textToSend) {
    const msg = (textToSend != null ? textToSend : input.value || "").toString().trim();
    if (!msg) return;

    input.value = "";
    addMsg("user", msg);

    setThinking(true);
    try {
      const data = await ask(msg);
      // remove thinking bubble (last ai msg) and replace with real
      // simplest: just add real response; leaving thinking is ok, but we keep it clean:
      // find last "Procesando…" and remove if exists
      const nodes = $$(".cw-msg", chat);
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].textContent === t("thinking")) {
          const metaNode = nodes[i].previousSibling;
          if (metaNode && metaNode.classList && metaNode.classList.contains("cw-meta")) metaNode.remove();
          nodes[i].remove();
          break;
        }
      }
      addMsg("ai", (data && (data.answer || data.output || data.text)) || "");
    } catch (e) {
      // remove thinking if exists
      const nodes = $$(".cw-msg", chat);
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].textContent === t("thinking")) {
          const metaNode = nodes[i].previousSibling;
          if (metaNode && metaNode.classList && metaNode.classList.contains("cw-meta")) metaNode.remove();
          nodes[i].remove();
          break;
        }
      }
      addMsg("ai", t("error"));
      console.error(e);
    } finally {
      micBtn.disabled = false;
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  // ======= Speech (best-effort) =======
  let rec = null;
  let recOn = false;

  function initSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = detectLang();
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (ev) => {
      const t = ev.results?.[0]?.[0]?.transcript || "";
      if (t.trim()) send(t.trim());
    };
    r.onend = () => {
      recOn = false;
      micBtn.classList.remove("on");
    };
    r.onerror = () => {
      recOn = false;
      micBtn.classList.remove("on");
    };
    return r;
  }

  // ======= Events =======
  orb.addEventListener("click", () => openPanel());
  orb.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") openPanel();
  });

  miniBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMinimize();
  });

  closeBtn.addEventListener("click", closePanel);
  panel.addEventListener("click", (e) => {
    // click outside shell closes
    if (e.target === panel) closePanel();
  });

  sendBtn.addEventListener("click", () => send());

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
    if (e.key === "Escape") closePanel();
  });

  quicks.forEach((q) => {
    q.addEventListener("click", () => {
      const v = q.getAttribute("data-q") || "";
      send(v);
    });
  });

  micBtn.addEventListener("click", () => {
    if (!rec) rec = initSpeech();
    if (!rec) return;

    if (recOn) {
      try { rec.stop(); } catch {}
      recOn = false;
      micBtn.classList.remove("on");
      return;
    }
    recOn = true;
    micBtn.classList.add("on");
    try { rec.start(); } catch {
      recOn = false;
      micBtn.classList.remove("on");
    }
  });

  // ======= First impression: “ganas de usar” desde el primer click =======
  // Auto abrir la primera vez (solo 1 vez)
  try {
    const bootKey = "consia_first_open_v1";
    if (!localStorage.getItem(bootKey)) {
      localStorage.setItem(bootKey, "1");
      setTimeout(openPanel, 350);
      setTimeout(() => {
        addMsg("ai", "Decime qué querés. Yo me encargo.");
      }, 650);
    }
  } catch {}

})();
