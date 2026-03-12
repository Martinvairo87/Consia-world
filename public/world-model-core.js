/*
CONSIA WORLD MODEL
context engine + strategic world state
*/

const CONSIA_WORLD_MODEL = {

storageKey: "CONSIA_WORLD_MODEL_V1",

defaultState(){
return {
  entities:{
    companies:[
      {
        id:"consia",
        name:"CONSIA",
        type:"ai_platform",
        status:"active"
      },
      {
        id:"manglar",
        name:"Manglar",
        type:"real_estate_construction",
        status:"active"
      },
      {
        id:"realwork",
        name:"Real Work",
        type:"real_estate_platform",
        status:"active"
      }
    ],
    projects:[
      {
        id:"consia-core",
        name:"CONSIA CORE",
        type:"ai_system",
        status:"active"
      }
    ],
    users:[
      {
        id:"owner",
        name:"Martín",
        role:"owner",
        status:"active"
      }
    ]
  },
  goals:[
    "Construir un sistema operativo de IA",
    "Automatizar procesos",
    "Operar con agentes",
    "Escalar CONSIA globalmente"
  ],
  context:{
    activeMode:"strategic",
    lastUpdate:Date.now(),
    systemStatus:"online"
  },
  relationships:[
    {
      from:"owner",
      to:"consia",
      type:"controls"
    },
    {
      from:"consia",
      to:"consia-core",
      type:"contains"
    },
    {
      from:"owner",
      to:"manglar",
      type:"directs"
    },
    {
      from:"owner",
      to:"realwork",
      type:"directs"
    }
  ]
}
},

load(){

try{
  const raw = localStorage.getItem(this.storageKey)

  if(!raw){
    const initial = this.defaultState()
    this.save(initial)
    return initial
  }

  return JSON.parse(raw)

}catch(e){
  const initial = this.defaultState()
  this.save(initial)
  return initial
}

},

save(data){
localStorage.setItem(this.storageKey, JSON.stringify(data))
},

summary(){

const db = this.load()

return {
  companies: db.entities.companies.length,
  projects: db.entities.projects.length,
  users: db.entities.users.length,
  goals: db.goals.length,
  systemStatus: db.context.systemStatus,
  activeMode: db.context.activeMode
}

},

addProject(name,type="general"){

const db = this.load()

db.entities.projects.push({
  id: "project-" + Date.now(),
  name,
  type,
  status:"active"
})

db.context.lastUpdate = Date.now()

this.save(db)

return "Proyecto agregado al WORLD MODEL: " + name
},

addGoal(goal){

const db = this.load()

db.goals.push(goal)
db.context.lastUpdate = Date.now()

this.save(db)

return "Objetivo agregado: " + goal
},

setMode(mode){

const db = this.load()

db.context.activeMode = mode
db.context.lastUpdate = Date.now()

this.save(db)

return "Modo actualizado: " + mode
},

describe(){

const s = this.summary()

return `
WORLD MODEL STATUS
Companies: ${s.companies}
Projects: ${s.projects}
Users: ${s.users}
Goals: ${s.goals}
System: ${s.systemStatus}
Mode: ${s.activeMode}
`.trim()
},

analyzePrompt(input){

const text = String(input || "").toLowerCase()

if(text.includes("empresa") || text.includes("compañ") || text.includes("company")){
  return "company_context"
}

if(text.includes("proyecto") || text.includes("project")){
  return "project_context"
}

if(text.includes("objetivo") || text.includes("goal")){
  return "goal_context"
}

if(text.includes("estrateg") || text.includes("strategy")){
  return "strategic_context"
}

return "general_context"
},

reason(input){

const mode = this.analyzePrompt(input)
const db = this.load()

if(mode === "company_context"){
  return "CONSIA entiende que está operando sobre contexto de empresas: " + db.entities.companies.map(c=>c.name).join(", ")
}

if(mode === "project_context"){
  return "CONSIA detecta contexto de proyectos: " + db.entities.projects.map(p=>p.name).join(", ")
}

if(mode === "goal_context"){
  return "CONSIA detecta objetivos activos: " + db.goals.join(" | ")
}

if(mode === "strategic_context"){
  return "CONSIA entra en modo estratégico con foco en crecimiento, automatización y ejecución."
}

return "CONSIA WORLD MODEL interpreta el contexto general del sistema."
},

reset(){

localStorage.removeItem(this.storageKey)
this.save(this.defaultState())
return "WORLD MODEL reiniciado"
}

}

window.CONSIA_WORLD_MODEL = CONSIA_WORLD_MODEL
