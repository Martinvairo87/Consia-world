/* CONSIA Widget v1.0 — single file
   - Chat + Voz + “Live” (placeholder)
   - Avatar (simulado) siempre visible, minimizable
   - i18n auto por navegador (fallback EN) + envía idioma al API
   - “.” como gatillo mínimo
*/
(() => {
  "use strict";

  // ======= CONFIG =======
  const CFG = Object.assign(
    {
      apiUrl: "https://api.consia.world/ask",
      modeDefault: "magic",         // "magic" | "chat"
      showAvatar: true,
      avatarCanMinimize: true,
      allowChat: true,
      allowVoice: true,
      allowLive: true,
      i18n: "auto",                 // "auto" o "es"/"en"/etc
      brand: "CONSIA",
      accentA: "#55ccff",
      accentB: "#00a3ff",
    },
    (window.CONSIA_WIDGET_CONFIG || {})
  );

  // ======= i18n (auto + fallback) =======
  const LANG = (() => {
    const nav = (navigator.language || "en").toLowerCase();
    if (CFG.i18n && CFG.i18n !== "auto") return CFG.i18n.toLowerCase();
    // reduce "es-AR" -> "es"
    return nav.split("-")[0] || "en";
  })();

  const T = (() => {
    // Minimal UI text (fallback EN). API response handles “all languages”.
    const dict = {
      en: {
        title: "CONSIA",
        placeholder: "Tell me what you want. I’ll handle it.",
        hint: 'Type "." to activate Magic',
        send: "Send",
        voice: "Voice",
        live: "Live",
        minimize: "Minimize",
        expand: "Expand",
        stop: "Stop",
        listening: "Listening…",
        notSupported: "Not supported on this device.",
        thinking: "Working…",
        error: "Error. Try again.",
      },
      es: {
        title: "CONSIA",
        placeholder: "Decime qué querés. Yo me encargo.",
        hint: 'Escribí "." para activar Magia',
        send: "Enviar",
        voice: "Voz",
        live: "Live",
        minimize: "Minimizar",
        expand: "Expandir",
        stop: "Parar",
        listening: "Escuchando…",
        notSupported: "No disponible en este dispositivo.",
        thinking: "Ejecutando…",
        error: "Error. Probá de nuevo.",
      },
      pt: {
        title: "CONSIA",
        placeholder: "Diga o que você quer. Eu cuido disso.",
        hint: 'Digite "." para ativar Magia',
        send: "Enviar",
        voice: "Voz",
        live: "Live",
        minimize: "Minimizar",
        expand: "Expandir",
        stop: "Parar",
        listening: "Ouvindo…",
        notSupported: "Não suportado neste dispositivo.",
        thinking: "Executando…",
        error: "Erro. Tente novamente.",
      },
      fr: {
        title: "CONSIA",
        placeholder: "Dites-moi ce que vous voulez. Je m’en charge.",
        hint: 'Tapez "." pour activer la Magie',
        send: "Envoyer",
        voice: "Voix",
        live: "Live",
        minimize: "Réduire",
        expand: "Agrandir",
        stop: "Stop",
        listening: "Écoute…",
        notSupported: "Non pris en charge sur cet appareil.",
        thinking: "En cours…",
        error: "Erreur. Réessayez.",
      },
      it: {
        title: "CONSIA",
        placeholder: "Dimmi cosa vuoi. Me ne occupo io.",
        hint: 'Scrivi "." per attivare la Magia',
        send: "Invia",
        voice: "Voce",
        live: "Live",
        minimize: "Riduci",
        expand: "Espandi",
        stop: "Stop",
        listening: "Ascolto…",
        notSupported: "Non supportato su questo dispositivo.",
        thinking: "In esecuzione…",
        error: "Errore. Riprova.",
      },
      de: {
        title: "CONSIA",
        placeholder: "Sag mir, was du willst. Ich kümmere mich darum.",
        hint: 'Tippe "." für Magie',
        send: "Senden",
        voice: "Sprache",
        live: "Live",
        minimize: "Minimieren",
        expand: "Erweitern",
        stop: "Stopp",
        listening: "Höre zu…",
        notSupported: "Auf diesem Gerät nicht unterstützt.",
        thinking: "Arbeite…",
        error: "Fehler. Versuch es erneut.",
      },
    };
    return dict[LANG] || dict.en;
  })();

  // ======= Inject CSS =======
  const css = `
  :root{
    --cw-bg:#070709;
    --cw-panel:rgba(255,255,255,.06);
    --cw-border:rgba(255,255,255,.14);
    --cw-text:#fff;
    --cw-muted:rgba(255,255,255,.72);
    --cw-a:${CFG.accentA};
    --cw-b:${CFG.accentB};
    --cw-shadow:0 30px 90px rgba(0,0,0,.55);
    --cw-r:18px;
  }
  #consia-bubble{
    position:fixed; right:18px; bottom:18px; z-index:2147483647;
    width:56px; height:56px; border-radius:999px;
    border:1px solid rgba(255,255,255,.18);
    background:radial-gradient(18px 18px at 30% 30%, rgba(255,255,255,.12), transparent 60%),
               linear-gradient(135deg, rgba(0,163,255,.24), rgba(85,204,255,.14));
    box-shadow:0 18px 50px rgba(0,0,0,.5);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; user-select:none;
    backdrop-filter: blur(14px);
  }
  #consia-bubble .dot{
    width:10px;height:10px;border-radius:99px;background:var(--cw-a);
    box-shadow:0 0 18px rgba(85,204,255,.75);
  }
  #consia-shell{
    position:fixed; inset:0; z-index:2147483647;
    display:none; align-items:flex-end; justify-content:flex-end;
    padding:18px;
  }
  #consia-shell.open{ display:flex; }
  #consia-backdrop{
    position:absolute; inset:0;
    background:rgba(0,0,0,.35);
    backdrop-filter: blur(6px);
  }
  #consia-panel{
    position:relative;
    width:min(520px, calc(100vw - 24px));
    height:min(720px, calc(100vh - 24px));
    border-radius:26px;
    border:1px solid rgba(255,255,255,.14);
    background:radial-gradient(1200px 700px at 30% 10%, rgba(0,163,255,.18), transparent 55%),
               radial-gradient(900px 600px at 80% 40%, rgba(85,204,255,.12), transparent 55%),
               rgba(7,7,9,.92);
    box-shadow:var(--cw-shadow);
    overflow:hidden;
  }
  #consia-top{
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 14px 10px 14px;
    border-bottom:1px solid rgba(255,255,255,.10);
  }
  #consia-brand{
    display:flex; align-items:center; gap:10px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial;
    letter-spacing:6px;
    font-size:12px;
    color:rgba(255,255,255,.86);
  }
  #consia-actions{ display:flex; gap:8px; align-items:center; }
  .cw-btn{
    border:1px solid rgba(255,255,255,.14);
    background:rgba(255,255,255,.06);
    color:rgba(255,255,255,.9);
    padding:8px 10px;
    border-radius:14px;
    font-size:12px;
    cursor:pointer;
  }
  .cw-btn.primary{
    border-color:rgba(0,163,255,.35);
    background:rgba(0,163,255,.12);
  }
  #consia-main{
    display:flex;
    height:calc(100% - 58px);
  }
  #consia-left{
    width:44%;
    min-width:220px;
    border-right:1px solid rgba(255,255,255,.10);
    padding:14px;
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  #consia-right{
    flex:1;
    display:flex;
    flex-direction:column;
  }
  #consia-avatar{
    position:relative;
    flex:1;
    border-radius:22px;
    border:1px solid rgba(255,255,255,.12);
    background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
    overflow:hidden;
  }
  #consia-avatar.min{ height:86px; flex:0 0 86px; }
  #consia-avatar .glow{
    position:absolute; inset:-40%;
    background:radial-gradient(circle at 30% 30%, rgba(85,204,255,.22), transparent 45%),
               radial-gradient(circle at 70% 60%, rgba(0,163,255,.18), transparent 45%);
    filter: blur(18px);
    animation: cwFloat 6s ease-in-out infinite;
  }
  @keyframes cwFloat{ 0%{transform:translate3d(0,0,0)} 50%{transform:translate3d(12px,-10px,0)} 100%{transform:translate3d(0,0,0)} }
  #consia-avatar .face{
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; color:rgba(255,255,255,.7);
    letter-spacing:.4px;
    padding:12px;
    text-align:center;
  }
  #consia-pills{ display:flex; flex-wrap:wrap; gap:8px; }
  .cw-pill{
    border:1px solid rgba(255,255,255,.12);
    background:rgba(255,255,255,.05);
    padding:8px 10px;
    border-radius:999px;
    font-size:12px;
    color:rgba(255,255,255,.85);
    cursor:pointer;
  }
  #consia-log{
    flex:1;
    padding:14px 14px 0 14px;
    overflow:auto;
  }
  .cw-msg{
    border:1px solid rgba(255,255,255,.10);
    background:rgba(255,255,255,.04);
    border-radius:18px;
    padding:10px 12px;
    margin-bottom:10px;
    color:rgba(255,255,255,.86);
    font-size:13px;
    line-height:1.5;
    white-space:pre-wrap;
  }
  .cw-me{ border-color:rgba(0,163,255,.20); background:rgba(0,163,255,.08); }
  .cw-meta{ font-size:11px; color:rgba(255,255,255,.52); margin-top:6px; }
  #consia-inputbar{
    padding:12px 14px 14px 14px;
    display:flex; gap:10px; align-items:center;
    border-top:1px solid rgba(255,255,255,.10);
  }
  #consia-in{
    flex:1;
    border:1px solid rgba(255,255,255,.14);
    background:rgba(255,255,255,.05);
    color:rgba(255,255,255,.92);
    padding:12px 12px;
    border-radius:18px;
    outline:none;
    font-size:13px;
  }
  #consia-send{
    width:44px;height:44px;border-radius:16px;
    border:1px solid rgba(0,163,255,.35);
    background:rgba(0,163,255,.14);
    color:#fff;
    cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:16px;
  }
  @media (max-width:740px){
    #consia-left{ display:none; }
  }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ======= DOM =======
  const bubble = document.createElement("div");
  bubble.id = "consia-bubble";
  bubble.innerHTML = `<div class="dot"></div>`;
  document.body.appendChild(bubble);

  const shell = document.createElement("div");
  shell.id = "consia-shell";
  shell.innerHTML = `
    <div id="consia-backdrop"></div>
    <div id="consia-panel" role="dialog" aria-modal="true">
      <div id="consia-top">
        <div id="consia-brand"><span style="width:10px;height:10px;border-radius:99px;background:var(--cw-a);box-shadow:0 0 18px rgba(85,204,255,.75)"></span>${T.title}</div>
        <div id="consia-actions">
          ${CFG.allowVoice ? `<button class="cw-btn" id="consia-voice">${T.voice}</button>` : ``}
          ${CFG.allowLive ? `<button class="cw-btn" id="consia-live">${T.live}</button>` : ``}
          ${CFG.avatarCanMinimize ? `<button class="cw-btn" id="consia-min">${T.minimize}</button>` : ``}
          <button class="cw-btn primary" id="consia-close">✕</button>
        </div>
      </div>

      <div id="consia-main">
        <div id="consia-left">
          <div id="consia-avatar">
            <div class="glow"></div>
            <div class="face">
              <div>
                <div style="font-weight:700; letter-spacing:.6px; margin-bottom:6px;">Avatar IA</div>
                <div style="color:rgba(255,255,255,.65)">
                  ${T.hint}
                </div>
              </div>
            </div>
          </div>

          <div id="consia-pills">
            <div class="cw-pill" data-q=".">.</div>
            <div class="cw-pill" data-q="Activar modo automático y guiarme paso a paso.">Auto</div>
            <div class="cw-pill" data-q="Resumí y resolvé con acciones mínimas.">Resolver</div>
            <div class="cw-pill" data-q="Mostrame el siguiente paso exacto.">Siguiente</div>
          </div>

          <div style="font-size:12px;color:rgba(255,255,255,.6);line-height:1.5">
            Idioma: <b style="color:rgba(255,255,255,.85)">${LANG.toUpperCase()}</b>
          </div>
        </div>

        <div id="consia-right">
          <div id="consia-log"></div>
          <div id="consia-inputbar">
            <input id="consia-in" autocomplete="off" placeholder="${T.placeholder}" />
            <button id="consia-send" title="${T.send}">➤</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(shell);

  const $ = (id) => document.getElementById(id);

  // ======= Open/Close =======
  function open() {
    shell.classList.add("open");
    setTimeout(() => $("consia-in")?.focus(), 40);
  }
  function close() {
    shell.classList.remove("open");
  }

  bubble.addEventListener("click", open);
  $("consia-close").addEventListener("click", close);
  $("consia-backdrop").addEventListener("click", close);

  // Expose a tiny hook
  window.__CONSIA_OPEN__ = open;

  // ======= UI log =======
  function addMsg(text, who = "consia") {
    const div = document.createElement("div");
    div.className = "cw-msg" + (who === "me" ? " cw-me" : "");
    div.textContent = text;
    $("consia-log").appendChild(div);
    $("consia-log").scrollTop = $("consia-log").scrollHeight;
  }

  // ======= API call =======
  async function callAPI(message) {
    const headers = {
      "Content-Type": "application/json",
      "Accept-Language": LANG,
    };

    // Optional device header if you use it in Worker
    try {
      const x = (window.localStorage && localStorage.getItem("X_CONSIA_DEVICE")) || "";
      if (x) headers["X-CONSIA-DEVICE"] = x;
    } catch {}

    const res = await fetch(CFG.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        lang: LANG,
        mode: CFG.modeDefault,
        ui: "widget",
      }),
    });

    const ct = res.headers.get("content-type") || "";
    if (!res.ok) throw new Error("HTTP_" + res.status);

    if (ct.includes("application/json")) {
      const data = await res.json();
      return data?.reply || data?.text || JSON.stringify(data);
    }
    return await res.text();
  }

  // ======= Send flow =======
  let busy = false;
  async function send(text) {
    if (!text || busy) return;
    busy = true;
    addMsg(text, "me");
    addMsg(T.thinking, "consia");

    // replace last "thinking" with reply
    const log = $("consia-log");
    const thinkingNode = log.lastChild;

    try {
      const reply = await callAPI(text);
      thinkingNode.textContent = reply;
    } catch (e) {
      thinkingNode.textContent = T.error + " (" + String(e.message || e) + ")";
    } finally {
      busy = false;
    }
  }

  // Enter / click send
  $("consia-send").addEventListener("click", () => {
    const v = $("consia-in").value.trim();
    $("consia-in").value = "";
    send(v);
  });
  $("consia-in").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("consia-send").click();
    }
  });

  // Pills
  shell.querySelectorAll(".cw-pill").forEach((p) => {
    p.addEventListener("click", () => send(p.getAttribute("data-q")));
  });

  // Avatar minimize
  if (CFG.avatarCanMinimize) {
    let min = false;
    $("consia-min").addEventListener("click", () => {
      min = !min;
      const av = $("consia-avatar");
      av.classList.toggle("min", min);
      $("consia-min").textContent = min ? T.expand : T.minimize;
    });
  }

  // ======= Voice (Web Speech API) =======
  let rec = null;
  let listening = false;

  function speechAvailable() {
    return (
      "webkitSpeechRecognition" in window ||
      "SpeechRecognition" in window
    );
  }

  function startVoice() {
    if (!speechAvailable()) {
      addMsg(T.notSupported, "consia");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    rec = new SR();
    rec.lang = LANG;
    rec.interimResults = false;
    rec.continuous = false;

    listening = true;
    addMsg(T.listening, "consia");

    rec.onresult = (ev) => {
      const t = ev.results?.[0]?.[0]?.transcript?.trim();
      if (t) send(t);
    };
    rec.onerror = () => addMsg(T.error, "consia");
    rec.onend = () => (listening = false);

    rec.start();
  }

  function stopVoice() {
    try { rec && rec.stop(); } catch {}
    listening = false;
  }

  if (CFG.allowVoice) {
    $("consia-voice").addEventListener("click", () => {
      if (listening) stopVoice();
      else startVoice();
    });
  }

  // ======= Live (placeholder, no-storage rule) =======
  if (CFG.allowLive) {
    $("consia-live").addEventListener("click", () => {
      // Placeholder: puede abrir una ruta futura /live sin guardar nada.
      addMsg("LIVE: listo para activar (sin almacenamiento).", "consia");
    });
  }

  // ======= First message (ultra corto) =======
  addMsg(T.placeholder, "consia");
})();
