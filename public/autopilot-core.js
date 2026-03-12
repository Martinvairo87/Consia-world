// CONSIA AUTOPILOT AGENTS CORE

const CONSIA_AUTOPILOT = {

  async run(goal){

    const plan = this.createPlan(goal);

    let results = [];

    for (const step of plan){

      try{

        const res = await CONSIA.run(step.task, step.input);
        results.push({step: step.task, result: res});

      }catch(e){

        results.push({step: step.task, result: "error executing step"});

      }

    }

    return {
      goal,
      plan,
      results
    };

  },

  createPlan(goal){

    const g = String(goal || "").toLowerCase();

    if (g.includes("investigar") || g.includes("buscar")){

      return [
        {task:"search", input:goal}
      ];

    }

    if (g.includes("automatizar") || g.includes("flujo")){

      return [
        {task:"automation", input:goal}
      ];

    }

    if (g.includes("producto") || g.includes("vender") || g.includes("marketplace")){

      return [
        {task:"marketplace", input:goal}
      ];

    }

    if (g.includes("analizar imagen") || g.includes("vision")){

      return [
        {task:"vision", input:goal}
      ];

    }

    // default agent plan
    return [
      {task:"search", input:goal},
      {task:"automation", input:goal}
    ];

  }

};

window.CONSIA_AUTOPILOT = CONSIA_AUTOPILOT;
