/*
CONSIA STRATEGIC ENGINE
strategic planning + project reasoning + execution suggestions
*/

const CONSIA_STRATEGIC = {

analyze(input){

const text = String(input || "").toLowerCase()

if(text.includes("empresa") || text.includes("negocio") || text.includes("company")){
  return this.businessStrategy(input)
}

if(text.includes("proyecto") || text.includes("desarrollo") || text.includes("project")){
  return this.projectStrategy(input)
}

if(text.includes("ventas") || text.includes("marketplace") || text.includes("producto")){
  return this.salesStrategy(input)
}

if(text.includes("automat") || text.includes("workflow") || text.includes("proceso")){
  return this.automationStrategy(input)
}

return this.generalStrategy(input)

},

businessStrategy(input){
return {
type:"business_strategy",
title:"Estrategia de negocio",
diagnosis:[
"Estructurar objetivos principales",
"Definir unidad de negocio prioritaria",
"Detectar oportunidades de escalado",
"Conectar automatización y ejecución"
],
actions:[
"Ordenar proyectos activos por prioridad",
"Definir oferta principal y oferta secundaria",
"Crear tablero de métricas",
"Automatizar seguimiento comercial"
],
nextStep:"Crear plan estratégico por empresa"
}
},

projectStrategy(input){
return {
type:"project_strategy",
title:"Estrategia de proyecto",
diagnosis:[
"Proyecto detectado por CONSIA",
"Necesita objetivos, etapas y responsables",
"Debe conectarse con memoria y tareas",
"Conviene priorizar ejecución por fases"
],
actions:[
"Crear proyecto en PROJECT BRAIN",
"Agregar tareas iniciales",
"Guardar decisiones estratégicas",
"Definir estado, plazo y próximo hito"
],
nextStep:"Crear proyecto + roadmap inicial"
}
},

salesStrategy(input){
return {
type:"sales_strategy",
title:"Estrategia comercial",
diagnosis:[
"Contexto orientado a ventas o marketplace",
"Se recomienda ordenar oferta y canal",
"Conviene conectar agentes de ventas",
"Importa automatizar seguimiento"
],
actions:[
"Definir producto o servicio principal",
"Crear flujo comercial automático",
"Conectar marketplace y wallet",
"Medir conversión y seguimiento"
],
nextStep:"Activar pipeline comercial"
}
},

automationStrategy(input){
return {
type:"automation_strategy",
title:"Estrategia de automatización",
diagnosis:[
"CONSIA detecta intención de automatizar",
"Se recomienda separar tareas repetitivas",
"Conviene usar agentes + autopilot",
"Debe medirse impacto y tiempo ahorrado"
],
actions:[
"Identificar proceso repetitivo",
"Crear workflow inicial",
"Asignar agente responsable",
"Medir resultado y optimizar"
],
nextStep:"Crear workflow operativo"
}
},

generalStrategy(input){
return {
type:"general_strategy",
title:"Estrategia general",
diagnosis:[
"CONSIA analiza contexto general",
"Conviene ordenar objetivo y prioridad",
"Se recomienda transformar intención en plan",
"Debe conectarse con WORLD MODEL"
],
actions:[
"Definir objetivo principal",
"Detectar si es negocio, proyecto o automatización",
"Crear registro en memoria",
"Proponer próximos pasos concretos"
],
nextStep:"Convertir intención en plan estratégico"
}
},

format(result){

let out = ""
out += "CONSIA STRATEGIC ENGINE\n"
out += "Tipo: " + result.type + "\n"
out += "Título: " + result.title + "\n\n"

out += "Diagnóstico:\n"
result.diagnosis.forEach(i=>{
  out += "- " + i + "\n"
})

out += "\nAcciones:\n"
result.actions.forEach(i=>{
  out += "- " + i + "\n"
})

out += "\nPróximo paso: " + result.nextStep

return out
}

}

window.CONSIA_STRATEGIC = CONSIA_STRATEGIC
