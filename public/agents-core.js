// CONSIA MULTI-AI ENGINE

const CONSIA = {
  config: {
    apiBase: "https://api.consia.world",
    provider: "auto"
  },

  async run(task, input) {
    try {
      const prompt = String(input || "").trim();
      if (!prompt) return "Escribí una instrucción.";

      const provider = this.pickProvider(task, prompt);

      const response = await fetch(this.config.apiBase + "/v1/router", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task,
          input: prompt,
          provider
        })
      });

      const data = await response.json();

      if (data.reply) return data.reply;
      if (data.answer) return data.answer;

      return "CONSIA MULTI-AI ENGINE activo.";
    } catch (e) {
      return "CONSIA brain offline";
    }
  },

  pickProvider(task, input) {
    const t = String(task || "").toLowerCase();
    const q = String(input || "").toLowerCase();

    if (t === "vision") return "auto";
    if (t === "wallet") return "auto";
    if (t === "automation") return "auto";
    if (t === "marketplace") return "auto";

    if (q.includes("imagen") || q.includes("foto") || q.includes("camara")) return "auto";
    if (q.includes("código") || q.includes("worker") || q.includes("cloudflare")) return "auto";

    return "auto";
  }
};

window.CONSIA = CONSIA;
