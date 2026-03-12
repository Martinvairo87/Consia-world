// CONSIA AGENT SYSTEM

const CONSIA = {

agents:{},

register(name,agent){

this.agents[name]=agent

},

async run(task,input){

console.log("CONSIA AGENT:",task)

if(this.agents[task]){

return await this.agents[task](input)

}

return "No agent found"

}

}



// SEARCH AGENT

CONSIA.register("search",async(query)=>{

let r=await fetch("https://api.duckduckgo.com/?q="+encodeURIComponent(query)+"&format=json")

let j=await r.json()

return j.Abstract || "No result"

})



// IMAGE ANALYSIS AGENT

CONSIA.register("vision",async(data)=>{

return "Vision analysis ready"

})



// MARKETPLACE AGENT

CONSIA.register("marketplace",async(action)=>{

return "Marketplace task executed"

})



// AUTOMATION AGENT

CONSIA.register("automation",async(action)=>{

return "Automation executed"

})



// WALLET AGENT

CONSIA.register("wallet",async(action)=>{

return "Wallet task executed"

})



window.CONSIA=CONSIA
