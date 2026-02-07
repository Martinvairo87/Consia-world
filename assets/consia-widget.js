/* CONSIA GLOBAL IA AVATAR WIDGET — MINIMIZABLE + CHAT + AUTO-IDIOMA */
/* TOP 1 WORLD SYSTEM — UNIVERSAL EMBED */

(function () {

  // ===== CONFIG =====
  const API_URL = "/api/ask"; // tu endpoint IA
  const TRANSLATE_API = "/api/translate";

  // ===== CREATE WIDGET =====
  const widget = document.createElement("div");
  widget.id = "consia-widget";

  widget.innerHTML = `
  <div id="consia-avatar">
      <div class="orb"></div>
  </div>

  <div id="consia-panel" class="hidden">

      <div class="consia-header">
          <span>CONSIA</span>
          <button id="consia-minimize">–</button>
      </div>

      <div id="consia-chat"></div>

      <div class="consia-input">
          <input id="consia-text" placeholder="Ask CONSIA..." />
          <button id="consia-send">→</button>
      </div>

  </div>
  `;

  document.body.appendChild(widget);

  // ===== STYLES =====
  const style = document.createElement("style");
  style.innerHTML = `
  #consia-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: Arial, sans-serif;
  }

  #consia-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #fff, #6cf, #09f);
      box-shadow: 0 0 25px #09f, 0 0 60px #09f66;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 3s infinite;
  }

  .orb {
      width: 25px;
      height: 25px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 0 20px #fff;
  }

  @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.08); }
      100% { transform: scale(1); }
  }

  #consia-panel {
      width: 320px;
      height: 420px;
      background: #070709;
      border-radius: 18px;
      box-shadow: 0 0 40px rgba(0,0,0,.6);
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
  }

  .hidden {
      display: none;
  }

  .consia-header {
      background: linear-gradient(90deg,#09f,#6cf);
      padding: 10px;
      display: flex;
      justify-content: space-between;
      color: #000;
      font-weight: bold;
  }

  #consia-chat {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      font-size: 14px;
      color: #fff;
  }

  .msg {
      margin-bottom: 10px;
  }

  .user {
      color: #6cf;
  }

  .ia {
      color: #fff;
  }

  .consia-input {
      display: flex;
      border-top: 1px solid #222;
  }

  #consia-text {
      flex: 1;
      padding: 10px;
      background: #0e0e12;
      border: none;
      color: #fff;
      outline: none;
  }

  #consia-send {
      width: 60px;
      background: #09f;
      border: none;
      color: #000;
      font-weight: bold;
      cursor: pointer;
  }
  `;
  document.head.appendChild(style);

  // ===== ELEMENTS =====
  const avatar = document.getElementById("consia-avatar");
  const panel = document.getElementById("consia-panel");
  const minimize = document.getElementById("consia-minimize");
  const sendBtn = document.getElementById("consia-send");
  const input = document.getElementById("consia-text");
  const chat = document.getElementById("consia-chat");

  // ===== OPEN / CLOSE =====
  avatar.onclick = () => {
      panel.classList.toggle("hidden");
  };

  minimize.onclick = () => {
      panel.classList.add("hidden");
  };

  // ===== CHAT SEND =====
  async function sendMessage() {

      const text = input.value.trim();
      if (!text) return;

      addMessage(text, "user");
      input.value = "";

      const lang = detectLanguage(text);

      const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, lang })
      });

      const data = await res.json();

      addMessage(data.reply || "CONSIA online.", "ia");
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keypress", e => {
      if (e.key === "Enter") sendMessage();
  });

  // ===== ADD MESSAGE =====
  function addMessage(text, type) {
      const div = document.createElement("div");
      div.className = "msg " + type;
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
  }

  // ===== LANGUAGE DETECT =====
  function detectLanguage(text) {

      const langs = {
          es: /hola|gracias|legal|privacidad/i,
          en: /hello|privacy|terms/i,
          pt: /olá|privacidade/i,
          fr: /bonjour|confidentialité/i,
          de: /hallo|datenschutz/i,
          zh: /你好/,
          ja: /こんにちは/,
          ar: /مرحبا/
      };

      for (let l in langs) {
          if (langs[l].test(text)) return l;
      }

      return "en";
  }

  // ===== AUTO GREETING =====
  setTimeout(() => {
      addMessage("CONSIA IA online. How can I assist you?", "ia");
  }, 1200);

})();
