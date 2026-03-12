// CONSIA SELF-LEARNING BRAIN

const CONSIA_LEARNING = {
  storageKey: "CONSIA_LEARNING_MEMORY_V1",

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return {
          interactions: [],
          counters: {},
          lastTopics: [],
          preferences: {}
        };
      }
      return JSON.parse(raw);
    } catch {
      return {
        interactions: [],
        counters: {},
        lastTopics: [],
        preferences: {}
      };
    }
  },

  save(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  },

  detectTopic(text) {
    const t = String(text || "").toLowerCase();

    if (t.includes("wallet") || t.includes("saldo") || t.includes("pago")) return "wallet";
    if (t.includes("marketplace") || t.includes("producto") || t.includes("venta")) return "marketplace";
    if (t.includes("automat") || t.includes("workflow") || t.includes("proceso")) return "automation";
    if (t.includes("imagen") || t.includes("vision") || t.includes("foto") || t.includes("camara")) return "vision";
    if (t.includes("voz") || t.includes("voice") || t.includes("audio")) return "voice";
    if (t.includes("agente") || t.includes("agent")) return "agents";
    if (t.includes("precio") || t.includes("vuelo") || t.includes("travel")) return "travel";
    if (t.includes("investigar") || t.includes("buscar") || t.includes("que es")) return "research";

    return "general";
  },

  learn(input, task, response) {
    const db = this.load();
    const topic = this.detectTopic(input);
    const now = Date.now();

    db.interactions.unshift({
      ts: now,
      input,
      task,
      topic,
      response: String(response || "").slice(0, 500)
    });

    if (db.interactions.length > 150) {
      db.interactions = db.interactions.slice(0, 150);
    }

    db.counters[task] = (db.counters[task] || 0) + 1;
    db.counters[topic] = (db.counters[topic] || 0) + 1;

    db.lastTopics.unshift(topic);
    db.lastTopics = [...new Set(db.lastTopics)].slice(0, 12);

    db.preferences.lastTask = task;
    db.preferences.lastTopic = topic;
    db.preferences.lastSeenAt = now;

    this.save(db);

    return {
      topic,
      totalInteractions: db.interactions.length,
      lastTask: db.preferences.lastTask,
      lastTopic: db.preferences.lastTopic
    };
  },

  summary() {
    const db = this.load();
    const counters = db.counters || {};

    const sorted = Object.entries(counters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      totalInteractions: db.interactions.length,
      topSignals: sorted,
      lastTopics: db.lastTopics || [],
      preferences: db.preferences || {}
    };
  },

  clear() {
    localStorage.removeItem(this.storageKey);
    return true;
  }
};

window.CONSIA_LEARNING = CONSIA_LEARNING;
