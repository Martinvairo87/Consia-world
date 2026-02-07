/* CONSIA Widget v1.0 — Apple++ (single-input, guided, minimal UI)
   - Magic mode default (.)
   - Avatar always on, minimizable
   - Chat + Voice (Web Speech) + Live placeholder
   - Auto-language + manual override via "idioma: xx"
   - No external deps
*/

(() => {
  "use strict";

  const CFG = Object.assign(
    {
      apiUrl: "https://api.consia.world/ask",
      modeDefault: "magic", // magic | chat | voice | live
      showAvatar: true,
      avatarCanMinimize: true,
      allowChat: true,
      allowVoice: true,
      allowLive: true,
      i18n: "auto", // auto | 'es' | 'en' | ...
      brand: "CONSIA",
      placeholder: 'Decime qué querés. (o escribí ".")',
      theme: "dark",
      hotkey: ".", // magic trigger
      maxChips: 3,
      tts: true,
      stt: true,
    },
    window.CONSIA_WIDGET_CONFIG || {}
  );

  // ---------- Utils ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const nowISO = () => new Date().toISOString();
  const safeJson = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { return { ok: false, raw: txt }; }
  };

  // language detection
  const detectLang = () => {
    if (CFG.i18n && CFG.i18n !== "auto") return CFG.i18n;
    const nav = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;
    if (!nav) return "es";
    return nav.toLowerCase().split("-")[0] || "es";
  };

  const I18N = {
    es: {
      title: "CONSIA",
      hint: "Decime qué querés. Yo me encargo.",
      placeholder: 'Decime qué querés. (o escribí ".")',
      send: "Enviar",
      close: "Cerrar",
      minimize: "Minimizar",
      expand: "Abrir",
      voice: "Voz",
      live: "LIVE",
      chat: "Chat",
      magic: "Magia",
      thinking: "Procesando…",
      error: "Hubo un error. Reintentá.",
      chips: ["Resolver esto", "Hacerlo automático", "Explicación mínima"],
      liveSoon: "LIVE (en vivo) listo para activar en la fase WebRTC. Sin storage.",
      langSet: (l) => `Idioma: ${l}`,
    },
    en: {
      title: "CONSIA",
      hint: "Tell me what you want. I’ll handle it.",
      placeholder: 'Tell me what you want. (or type ".")',
      send: "Send",
      close: "Close",
      minimize: "Minimize",
      expand: "Open",
      voice: "Voice",
      live: "LIVE",
      chat: "Chat",
      magic: "Magic",
      thinking: "Processing…",
      error: "Something went wrong. Try again.",
      chips: ["Solve this", "Make it automatic", "Minimal explanation"],
      liveSoon: "LIVE (real-time) ready for WebRTC phase. No storage.",
      langSet: (l) => `Language: ${l}`,
    },
    pt: {
      title: "CONSIA",
      hint: "Diz o que você quer. Eu resolvo.",
      placeholder: 'Diz o que você quer. (ou escreva ".")',
      send: "Enviar",
      close: "Fechar",
      minimize: "Minimizar",
      expand: "Abrir",
      voice: "Voz",
      live: "LIVE",
      chat: "Chat",
      magic: "Magia",
      thinking: "Processando…",
      error: "Deu erro. Tenta de novo.",
      chips: ["Resolver", "Automatizar", "Explicação mínima"],
      liveSoon: "LIVE (tempo real) pronto para fase WebRTC. Sem storage.",
      langSet: (l) => `Idioma: ${l}`,
    },
  };

  let lang = detectLang();
  const T = () => I18N[lang] || I18N.es;

  // parse manual language switch
  const maybeSetLang = (text) => {
    const m = text.trim().match(/^idioma\s*:\s*([a-zA-Z-]{2,10})\s*$/i);
    if (!m) return false;
    lang = m[1].toLowerCase().split("-")[0];
    renderLang();
    pushSystem(T().langSet(lang));
    return true;
  };

  // ---------- Styles ----------
  const css = `
:root { --c-bg:#06090c; --c-panel: rgba(255,255,255,.06); --c-panel2: rgba(255,255,255,.09);
--c-border: rgba(255,255,255,.12); --c-text:#fff; --c-muted: rgba(255,255,255,.72);
--c-muted2: rgba(255,255,255,.5); --c-a:#55ccff; --c-b:#00a3ff; --r:18px; --shadow: 0 30px 90px rgba(0,0,0,.6); }
#consia-root { position: fixed; inset: 0; pointer-events: none; z-index: 999999; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial; }
#consia-bubble { pointer-events:auto; position: fixed; right: 18px; bottom: 18px; width: 62px; height: 62px;
border-radius: 999px; border: 1px solid var(--c-border); background: radial-gradient(120% 120% at 30% 20%, rgba(85,204,255,.35), transparent 60%),
radial-gradient(100% 100% at 70% 60%, rgba(0,163,255,.25), transparent 60%), rgba(10,15,20,.75);
backdrop-filter: blur(10px); box-shadow: var(--shadow); display:flex; align-items:center; justify-content:center; cursor:pointer;
transition: transform .18s ease, opacity .18s ease; }
#consia-bubble:hover { transform: scale(1.04); }
#consia-bubble .dot { width: 10px; height: 10px; border-radius: 99px; background: var(--c-a); filter: drop-shadow(0 0 10px rgba(85,204,255,.6)); }
#consia-bubble .mark { position:absolute; top:10px; left:10px; font-size:10px; letter-spacing:4px; color: rgba(255,255,255,.85); opacity:.9; }
#consia-shell { pointer-events:auto; position: fixed; right: 18px; bottom: 94px; width: min(520px, calc(100vw - 36px));
height: min(680px, calc(100vh - 140px)); border-radius: 22px; overflow: hidden; border: 1px solid var(--c-border);
background: radial-gradient(1200px 700px at 30% 10%, rgba(0,163,255,.20), transparent 55%),
radial-gradient(900px 600px at 80% 40%, rgba(85,204,255,.12), transparent 55%), #070709;
box-shadow: var(--shadow); backdrop-filter: blur(14px); display:none; }
#consia-top { display:flex; align-items:center; justify-content:space-between; padding: 14px 14px; border-bottom: 1px solid rgba(255,255,255,.08); }
#consia-brand { display:flex; gap:10px; align-items:center; }
#consia-brand b { letter-spacing: 6px; font-size: 12px; }
#consia-brand .pulse { width:10px; height:10px; border-radius:99px; background: var(--c-a); box-shadow: 0 0 18px rgba(85,204,255,.65); opacity:.95; }
#consia-actions { display:flex; gap:8px; align-items:center; }
.consia-btn { border:1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); color: var(--c-text);
padding: 8px 10px; border-radius: 12px; font-size: 12px; cursor:pointer; }
.consia-btn:active { transform: translateY(1px); }
.consia-btn.primary { border-color: rgba(85,204,255,.35); background: rgba(0,163,255,.10); }
.consia-btn.ghost { background: transparent; }
#consia-body { height: calc(100% - 56px); display:flex; flex-direction:column; }
#consia-log { flex:1; overflow:auto; padding: 14px; display:flex; flex-direction:column; gap:10px; }
.msg { max-width: 92%; padding: 10px 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.06);
color: var(--c-text); font-size: 13px; line-height: 1.45; }
.msg.me { align-self:flex-end; background: rgba(0,163,255,.10); border-color: rgba(0,163,255,.20); }
.msg.sys { align-self:center; color: var(--c-muted); background: rgba(255,255,255,.04); }
.msg .meta { display:block; margin-top: 6px; font-size: 10px; color: var(--c-muted2); }
#consia-chips { display:flex; flex-wrap:wrap; gap:8px; padding: 0 14px 10px; }
.chip { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.05); color: var(--c-text);
padding: 7px 10px; border-radius: 999px; font-size: 12px; cursor:pointer; }
.chip:hover { border-color: rgba(85,204,255,.35); }
#consia-inputbar { padding: 12px; border-top: 1px solid rgba(255,255,255,.08); display:flex; gap:10px; align-items:center; }
#consia-in { flex:1; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
border-radius: 16px; padding: 12px 12px; color: var(--c-text); outline:none; font-size: 14px; }
#consia-in::placeholder { color: rgba(255,255,255,.45); }
#consia-send { width: 48px; height: 44px; border-radius: 14px; border:1px solid rgba(0,163,255,.25);
background: rgba(0,163,255,.12); cursor:pointer; display:flex; align-items:center; justify-content:center; }
#consia-send svg { opacity:.95 }
#consia-mini { position: fixed; right: 18px; bottom: 94px; display:none; pointer-events:auto; }
#consia-mini .miniRow { display:flex; gap:8px; align-items:center; padding:10px 12px; border-radius: 999px;
border: 1px solid rgba(255,255,255,.14); background: rgba(10,15,20,.70); backdrop-filter: blur(10px); box-shadow: var(--shadow); }
#consia-mini input { width: min(360px, calc(100vw - 150px)); background: transparent; border:none; outline:none; color: var(--c-text); font-size: 13px; }
#consia-mini input::placeholder { color: rgba(255,255,255,.45); }
#consia-mini button { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); color: var(--c-text);
padding: 8px 10px; border-radius: 999px; font-size: 12px; cursor:pointer; }
@media (max-width: 520px) {
  #consia-shell { right: 10px; bottom: 84px; width: calc(100vw - 20px); height: calc(100vh - 120px); }
  #consia-bubble { right: 12px; bottom: 12px; }
  #consia-mini { right: 12px; bottom: 84px; }
}
  `.trim();

  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------- UI ----------
  const root = document.createElement("div");
  root.id = "consia-root";
  root.innerHTML = `
    <div id="consia-bubble" aria-label="CONSIA">
      <div class="mark">CONSIA</div>
      <div class="dot"></div>
    </div>

    <div id="consia-mini" aria-hidden="true">
      <div class="miniRow">
        <input id="consia-mini-in" autocomplete="off" spellcheck="false" />
        <button id="consia-mini-send">↵</button>
      </div>
    </div>

    <div id="consia-shell" role="dialog" aria-modal="false" aria-label="CONSIA">
      <div id="consia-top">
        <div id="consia-brand">
          <span class="pulse"></span>
          <b>${CFG.brand}</b>
        </div>
        <div id="consia-actions">
          ${CFG.allowChat ? `<button class="consia-btn ghost" data-mode="chat">${T().chat}</button>` : ""}
          ${CFG.allowVoice ? `<button class="consia-btn ghost" data-mode="voice">${T().voice}</button>` : ""}
          ${CFG.allowLive ? `<button class="consia-btn ghost" data-mode="live">${T().live}</button>` : ""}
          ${CFG.avatarCanMinimize ? `<button class="consia-btn" id="consia-min">${T().minimize}</button>` : ""}
          <button class="consia-btn primary" id="consia-close">${T().close}</button>
        </div>
      </div>

      <div id="consia-body">
        <div id="consia-log"></div>
        <div id="consia-chips"></div>
        <div id="consia-inputbar">
          <input id="consia-in" autocomplete="off" spellcheck="false" />
          <button id="consia-send" aria-label="${T().send}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 12L20 4L13 20L11 13L4 12Z" stroke="white" stroke-width="1.6" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const bubble = $("#consia-bubble", root);
  const shell = $("#consia-shell", root);
  const log = $("#consia-log", root);
  const inEl = $("#consia-in", root);
  const sendBtn = $("#consia-send", root);
  const closeBtn = $("#consia-close", root);
  const minBtn = $("#consia-min", root);
  const chipsWrap = $("#consia-chips", root);

  const mini = $("#consia-mini", root);
  const miniIn = $("#consia-mini-in", root);
  const miniSend = $("#consia-mini-send", root);

  // ---------- State ----------
  let opened = false;
  let minimized = false;
  let mode = CFG.modeDefault || "magic";
  let busy = false;

  // ---------- Messages ----------
  const push = (text, who = "consia") => {
    const el = document.createElement("div");
    el.className = `msg ${who === "me" ? "me" : who === "sys" ? "sys" : ""}`;
    el.textContent = text;
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    el.appendChild(meta);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  };

  const pushSystem = (text) => push(text, "sys");

  const ensureWelcome = () => {
    if (log.childElementCount) return;
    push(T().hint, "consia");
    renderChips();
  };

  const renderChips = () => {
    chipsWrap.innerHTML = "";
    const chips = (T().chips || []).slice(0, CFG.maxChips || 3);
    chips.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = c;
      b.onclick = () => {
        inEl.value = c;
        submitFrom(inEl.value);
      };
      chipsWrap.appendChild(b);
    });
  };

  const renderLang = () => {
    // update placeholders + buttons text quickly
    inEl.placeholder = T().placeholder;
    miniIn.placeholder = T().placeholder;
    const btnChat = shell.querySelector('[data-mode="chat"]');
    const btnVoice = shell.querySelector('[data-mode="voice"]');
    const btnLive = shell.querySelector('[data-mode="live"]');
    if (btnChat) btnChat.textContent = T().chat;
    if (btnVoice) btnVoice.textContent = T().voice;
    if (btnLive) btnLive.textContent = T().live;
    if (minBtn) minBtn.textContent = T().minimize;
    closeBtn.textContent = T().close;
    renderChips();
  };

  // ---------- Open / Close / Minimize ----------
  const open = () => {
    opened = true;
    minimized = false;
    shell.style.display = "block";
    mini.style.display = "none";
    ensureWelcome();
    inEl.focus();
  };

  const close = () => {
    opened = false;
    minimized = false;
    shell.style.display = "none";
    mini.style.display = "none";
  };

  const minimize = () => {
    if (!CFG.avatarCanMinimize) return;
    minimized = true;
    shell.style.display = "none";
    mini.style.display = "block";
    miniIn.value = "";
    miniIn.focus();
  };

  // Bubble click toggles
  bubble.onclick = () => {
    if (!opened) return open();
    if (minimized) return open();
    return minimize();
  };

  closeBtn.onclick = close;
  if (minBtn) minBtn.onclick = minimize;

  // ---------- Mode buttons ----------
  $$('#consia-actions [data-mode="chat"]', root).forEach((b) => b.addEventListener("click", () => setMode("chat")));
  $$('#consia-actions [data-mode="voice"]', root).forEach((b) => b.addEventListener("click", () => setMode("voice")));
  $$('#consia-actions [data-mode="live"]', root).forEach((b) => b.addEventListener("click", () => setMode("live")));

  const setMode = (m) => {
    mode = m;
    if (m === "live") pushSystem(T().liveSoon);
    if (m === "voice") startVoice();
    if (m === "chat") inEl.focus();
  };

  // ---------- Voice (STT/TTS) ----------
  let rec = null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSTT = !!SpeechRecognition && CFG.stt;
  const canTTS = "speechSynthesis" in window && CFG.tts;

  const speak = (text) => {
    try {
      if (!canTTS) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 1.0;
      u.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const startVoice = () => {
    if (!canSTT) {
      pushSystem("Voz no disponible en este navegador.");
      return;
    }
    try {
      rec && rec.abort();
      rec = new SpeechRecognition();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;

      let finalText = "";
      pushSystem("🎙️ Escuchando… (hablá y soltá)");
      rec.onresult = (e) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        }
        // show interim in input
        inEl.value = finalText || transcript;
      };
      rec.onerror = () => pushSystem(T().error);
      rec.onend = () => {
        const txt = (inEl.value || "").trim();
        if (txt) submitFrom(txt);
      };

      rec.start
