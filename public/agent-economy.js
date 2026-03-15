class CONSIAAgentEconomy {
  constructor() {
    this.wallet = {
      credits: 10000,
      reserved: 0,
      spent: 0,
      earned: 0
    };

    this.pricing = {
      research_agent: 5,
      analysis_agent: 8,
      strategy_agent: 13,
      execution_agent: 21,
      memory_agent: 3,
      automation_agent: 34,
      project_agent: 13,
      market_agent: 21,
      learning_agent: 8,
      network_agent: 8
    };

    this.history = [];
  }

  getBalance() {
    return {
      ...this.wallet,
      available: this.wallet.credits - this.wallet.reserved
    };
  }

  reserve(agentName, units = 1) {
    const price = (this.pricing[agentName] || 10) * units;
    const available = this.wallet.credits - this.wallet.reserved;

    if (available < price) {
      return {
        ok: false,
        error: "insufficient_credits",
        needed: price,
        available
      };
    }

    this.wallet.reserved += price;

    const tx = {
      id: "reserve_" + Date.now(),
      type: "reserve",
      agent: agentName,
      units,
      amount: price,
      time: new Date().toISOString()
    };

    this.history.push(tx);

    return {
      ok: true,
      reserved: price,
      balance: this.getBalance(),
      tx
    };
  }

  settle(agentName, units = 1) {
    const price = (this.pricing[agentName] || 10) * units;

    this.wallet.reserved = Math.max(0, this.wallet.reserved - price);
    this.wallet.credits = Math.max(0, this.wallet.credits - price);
    this.wallet.spent += price;

    const tx = {
      id: "settle_" + Date.now(),
      type: "settle",
      agent: agentName,
      units,
      amount: price,
      time: new Date().toISOString()
    };

    this.history.push(tx);

    return {
      ok: true,
      spent: price,
      balance: this.getBalance(),
      tx
    };
  }

  reward(source, amount = 100) {
    this.wallet.credits += amount;
    this.wallet.earned += amount;

    const tx = {
      id: "reward_" + Date.now(),
      type: "reward",
      source,
      amount,
      time: new Date().toISOString()
    };

    this.history.push(tx);

    return {
      ok: true,
      reward: amount,
      balance: this.getBalance(),
      tx
    };
  }

  getHistory(limit = 20) {
    return this.history.slice(-limit).reverse();
  }
}

window.CONSIAAgentEconomy = CONSIAAgentEconomy;
