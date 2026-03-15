class CONSIAAutopilot {
  constructor(api, economy = null) {
    this.api = api;
    this.economy = economy;
    this.running = false;
    this.lastCycle = null;
  }

  async start() {
    this.running = true;
    return { ok: true, state: "active" };
  }

  async stop() {
    this.running = false;
    return { ok: true, state: "stopped" };
  }

  async scanOpportunities() {
    const ideas = [
      "AI SaaS para Real Work",
      "Marketplace premium para Manglar",
      "Plataforma de automatización para VIP Work",
      "Producto digital para CONSIA",
      "Motor comercial para Bambino"
    ];

    const idea = ideas[Math.floor(Math.random() * ideas.length)];

    return {
      idea,
      confidence: Number((0.72 + Math.random() * 0.25).toFixed(2))
    };
  }

  async createProject(idea) {
    const response = await fetch(this.api + "/v1/brain/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: idea })
    });

    return await response.json();
  }

  async executeSwarm(idea) {
    const response = await fetch(this.api + "/v1/swarm/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: idea })
    });

    return await response.json();
  }

  async priceSwarm(result) {
    if (!this.economy || !result?.results) {
      return { ok: true, economy: "disabled" };
    }

    const settlements = [];

    for (const item of result.results) {
      const reserve = this.economy.reserve(item.agent, 1);
      if (!reserve.ok) {
        settlements.push({ agent: item.agent, ok: false, error: reserve.error });
        continue;
      }

      const settle = this.economy.settle(item.agent, 1);
      settlements.push({ agent: item.agent, ok: true, settle });
    }

    return {
      ok: true,
      settlements,
      balance: this.economy.getBalance()
    };
  }

  async runCycle() {
    if (!this.running) {
      return {
        ok: false,
        error: "autopilot_not_running"
      };
    }

    const opp = await this.scanOpportunities();
    const project = await this.createProject(opp.idea);
    const swarm = await this.executeSwarm(opp.idea);
    const economy = await this.priceSwarm(swarm);

    const cycle = {
      time: new Date().toISOString(),
      opportunity: opp,
      project,
      swarm,
      economy
    };

    this.lastCycle = cycle;
    return cycle;
  }

  async buildBusiness(goal) {
    const project = await this.createProject(goal);
    const swarm = await this.executeSwarm(goal);
    const economy = await this.priceSwarm(swarm);

    return {
      ok: true,
      mode: "business_builder",
      goal,
      project,
      swarm,
      economy
    };
  }
}

window.CONSIAAutopilot = CONSIAAutopilot;
