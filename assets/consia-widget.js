/* CONSIA Widget v1.0 — Multilang + Avatar + Chat + Minimize
   - No keys in client
   - Optional AI translation fallback via /api/translate
   - LocalStorage caching for translations
*/
(function () {
  const DEFAULTS = {
    apiBase: "/api",
    position: "right", // right | left
    theme: "dark",
    defaultLang: "auto", // auto | en | es | pt
    avatarMode: "floating", // floating | minimized
    showAvatar: true,
    allowMinimize: true,
    brand: "CONSIA",
    product: "CONSIA WORLD",
    legal: false,
  };

  const I18N = {
    en: {
      open: "Open",
      close: "Close",
      minimize: "Minimize",
      expand: "Expand",
      title: "CONSIA Assistant",
      subtitle: "Global, private, secure guidance",
      placeholder: "Type your message…",
      send: "Send",
      thinking: "Thinking…",
      language: "Language",
      auto: "Auto",
      privacy: "Privacy",
      privacyLine: "No passwords. No secret keys. Sensitive actions require your consent.",
      tips: "Tip: type “.” to ask fast.",
      error: "Connection error. Try again.",
      welcome: "Hi. I’m CONSIA. Tell me what you want to do.",
    },
    es: {
      open: "Abrir",
      close: "Cerrar",
      minimize: "Minimizar",
      expand: "Expandir",
      title: "Asistente CONSIA",
      subtitle: "Guía global, privada y segura",
      placeholder: "Escribí tu mensaje…",
      send: "Enviar",
      thinking: "Pensando…",
      language: "Idioma",
      auto: "Auto",
      privacy: "Privacidad",
      privacyLine: "Sin contraseñas. Sin llaves secretas. Acciones sensibles solo con tu consentimiento.",
      tips: "Tip: escribí “.” para pedir rápido.",
      error: "Error de conexión. Probá de nuevo.",
      welcome: "Hola. Soy CONSIA. Decime qué querés hacer.",
    },
    pt: {
      open: "Abrir",
      close: "Fechar",
      minimize: "Minimizar",
      expand: "Expandir",
      title: "Assistente CONSIA",
      subtitle: "Guia global, privado e seguro",
      placeholder: "Digite sua mensagem…",
      send: "Enviar",
      thinking: "Pensando…",
      language: "Idioma",
      auto: "Auto",
      privacy: "Privacidade",
      privacyLine: "Sem senhas. Sem chaves secretas. Ações sensíveis exigem seu consentimento.",
      tips: "Dica: digite “.” para pedir rápido.",
      error: "Erro de conexão. Tente novamente.",
      welcome: "Olá. Eu sou CONSIA. Diga o que você quer fazer.",
    },
  };

  function normLang(l) {
    if (!l) return "en";
    l = String(l).toLowerCase();
    if (l === "auto") return "auto";
    if (l.startsWith("es")) return "es";
    if (l.startsWith("pt")) return "pt";
    return "en";
  }

  function detectLang() {
    const saved = localStorage.getItem("consia_lang");
    if (saved) return normLang(saved);
    const nav = (navigator.language || "en").toLowerCase();
    return normLang(nav);
  }

  function cssEscape(s) {
    return (s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  }

  async function postJson(url, body, timeoutMs = 15000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  async function translateFallback(apiBase, text, targetLang) {
    // Cache by (lang + hash of text)
    const key = "consia_tr_" + targetLang + "_" + btoa(unescape(encodeURIComponent(text))).slice(0, 180);
    const hit = localStorage.getItem(key);
    if (hit) return hit;

    try {
      const data = await postJson(apiBase + "/translate", {
        text,
        target: targetLang,
        source: "en",
        kind: "ui",
      });
      const out = (data && (data.translation || data.text || data.result)) || text;
      localStorage.setItem(key, out);
      return out;
    } catch (_) {
      return text;
    }
  }

  function makeEl(tag, attrs = {}, html = "") {
    const el = document.createElement(tag);
    Object.keys(attrs).forEach((k) => {
      if (k === "class") el.className = attrs[k];
      else if (k === "style") el.setAttribute("style", attrs[k]);
      else el.setAttribute(k, attrs[k]);
    });
    if (html) el.innerHTML = html;
    return el;
  }

  function mountWidget(opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    const baseLang = o.defaultLang === "auto" ? detectLang() : normLang(o.defaultLang);
    let lang = baseLang === "auto" ? detectLang() : baseLang;

    const rootId = "consia-widget-root";
    if (document.getElementById(rootId)) return;

    const style = makeEl(
      "style",
      {},
      `
:root{--cw-bg:#070709;--cw-panel:rgba(255,255,255,.06);--cw-border:rgba(255,255,255,.12);--cw-txt:#fff;--cw-muted:rgba(255,255,255,.72);--cw-shadow:0 30px 100px rgba(0,0,0,.55);--cw-radius:18px;--cw-a:#55ccff;--cw-b:#00a3ff;}
#consia-widget-root{position:fixed;z-index:999999;bottom:18px;${o.position === "left" ? "left:18px" : "right:18px"};font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--cw-txt);}
.cw-btn{width:62px;height:62px;border-radius:999px;border:1px solid var(--cw-border);background:radial-gradient(1200px 700px at 30% 10%,rgba(0,163,255,.25),transparent 55%),radial-gradient(900px 600px at 80% 40%,rgba(85,204,255,.18),transparent 55%),rgba(10,10,10,.85);backdrop-filter:blur(12px);box-shadow:var(--cw-shadow);display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none}
.cw-dot{width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,var(--cw-a),var(--cw-b));box-shadow:0 0 20px rgba(0,163,255,.35)}
.cw-panel{position:absolute;bottom:78px;${o.position === "left" ? "left:0" : "right:0"};width:min(420px,calc(100vw - 36px));max-height:min(70vh,620px);border:1px solid var(--cw-border);border-radius:var(--cw-radius);background:rgba(7,7,9,.82);backdrop-filter:blur(16px);box-shadow:var(--cw-shadow);overflow:hidden;display:none}
.cw-panel.open{display:block}
.cw-head{padding:14px 14px 10px;border-bottom:1px solid rgba(255,255,255,.08)}
.cw-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cw-title{font-weight:800;letter-spacing:1px}
.cw-sub{font-size:12px;color:var(--cw-muted);margin-top:4px}
.cw-actions{display:flex;gap:8px}
.cw-ico{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;padding:7px 10px;font-size:12px;cursor:pointer}
.cw-ico:active{transform:scale(.98)}
.cw-body{padding:12px;display:flex;flex-direction:column;gap:10px}
.cw-msgs{flex:1;overflow:auto;max-height:min(46vh,420px);padding-right:4px}
.cw-bubble{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.05);border-radius:14px;padding:10px 10px;margin:0 0 10px}
.cw-bubble.me{background:rgba(0,163,255,.12);border-color:rgba(0,163,255,.18)}
.cw-meta{font-size:11px;color:var(--cw-muted);margin:8px 0 0}
.cw-foot{display:flex;gap:8px;align-items:center;border-top:1px solid rgba(255,255,255,.08);padding:10px}
.cw-input{flex:1;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.25);color:#fff;border-radius:14px;padding:10px 12px;outline:none}
.cw-send{border:1px solid rgba(0,163,255,.35);background:linear-gradient(135deg,rgba(85,204,255,.22),rgba(0,163,255,.22));color:#fff;border-radius:14px;padding:10px 12px;cursor:pointer}
.cw-topline{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
.cw-chip{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer}
.cw-select{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;padding:7px 10px;font-size:12px;outline:none}
      `
    );

    const root = makeEl("div", { id: rootId });
    const btn = makeEl("div", { class: "cw-btn", title: "CONSIA" }, `<div class="cw-dot"></div>`);
    const panel = makeEl("div", { class: "cw-panel" });

    const t = (k) => (I18N[lang] && I18N[lang][k]) || (I18N.en && I18N.en[k]) || k;

    const head = makeEl(
      "div",
      { class: "cw-head" },
      `
      <div class="cw-row">
        <div>
          <div class="cw-title">${cssEscape(t("title"))}</div>
          <div class="cw-sub">${cssEscape(t("subtitle"))}</div>
        </div>
        <div class="cw-actions">
          <button class="cw-ico" data-act="min">${cssEscape(t("minimize"))}</button>
          <button class="cw-ico" data-act="close">${cssEscape(t("close"))}</button>
        </div>
      </div>
      <div class="cw-topline">
        <span class="cw-meta">${cssEscape(t("language"))}:</span>
        <select class="cw-select" id="cw-lang">
          <option value="auto">${cssEscape(t("auto"))}</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
          <option value="pt">PT</option>
        </select>
        <span class="cw-meta">${cssEscape(t("tips"))}</span>
      </div>
      `
    );

    const body = makeEl("div", { class: "cw-body" });
    const msgs = makeEl("div", { class: "cw-msgs" });
    const foot = makeEl(
      "div",
      { class: "cw-foot" },
      `
        <input class="cw-input" id="cw-in" autocomplete="off" placeholder="${cssEscape(t("placeholder"))}" />
        <button class="cw-send" id="cw-send">${cssEscape(t("send"))}</button>
      `
    );

    function addMsg(text, who = "bot") {
      const b = makeEl(
        "div",
        { class: "cw-bubble " + (who === "me" ? "me" : "") },
        `<div>${cssEscape(text)}</div>`
      );
      msgs.appendChild(b);
      msgs.scrollTop = msgs.scrollHeight;
    }

    addMsg(t("welcome"), "bot");
    addMsg(t("privacyLine"), "bot");

    body.appendChild(msgs);
    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);

    btn.onclick = () => {
      panel.classList.toggle("open");
    };

    panel.addEventListener("click", (e) => {
      const act = e.target && e.target.getAttribute && e.target.getAttribute("data-act");
      if (act === "close") panel.classList.remove("open");
      if (act === "min") panel.classList.remove("open");
    });

    // Language switch
    panel.querySelector("#cw-lang").value = localStorage.getItem("consia_lang") || (o.defaultLang === "auto" ? "auto" : lang);
    panel.querySelector("#cw-lang").addEventListener("change", async (e) => {
      const v = e.target.value;
      localStorage.setItem("consia_lang", v);
      lang = v === "auto" ? detectLang() : normLang(v);

      // Refresh key UI strings quickly (minimal)
      head.querySelector(".cw-title").textContent = t("title");
      head.querySelector(".cw-sub").textContent = t("subtitle");
      head.querySelector('[data-act="min"]').textContent = t("minimize");
      head.querySelector('[data-act="close"]').textContent = t("close");
      foot.querySelector("#cw-in").setAttribute("placeholder", t("placeholder"));
      foot.querySelector("#cw-send").textContent = t("send");
    });

    async function send() {
      const input = panel.querySelector("#cw-in");
      const text = (input.value || "").trim();
      if (!text) return;
      input.value = "";
      addMsg(text, "me");

      const thinking = t("thinking");
      addMsg(thinking, "bot");
      const bubbles = msgs.querySelectorAll(".cw-bubble");
      const last = bubbles[bubbles.length - 1];

      try {
        const payload = {
          message: text,
          lang,
          ui: true,
          source: "widget",
        };
        const data = await postJson(o.apiBase + "/ask", payload, 30000);
        const answer = (data && (data.reply || data.answer || data.text)) || "";
        last.innerHTML = `<div>${cssEscape(answer || t("error"))}</div>`;
      } catch (err) {
        last.innerHTML = `<div>${cssEscape(t("error"))}</div>`;
      }
      msgs.scrollTop = msgs.scrollHeight;
    }

    panel.querySelector("#cw-send").onclick = send;
    panel.querySelector("#cw-in").addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
    });

    document.head.appendChild(style);
    root.appendChild(btn);
    root.appendChild(panel);
    document.body.appendChild(root);
  }

  window.ConsiaWidget = {
    init: function (opts) {
      mountWidget(opts || {});
    },
  };
})();
