/*
CONSIA EXECUTION ENGINE
action execution layer
*/

const CONSIA_EXECUTION = {

execute(input){

const text = String(input || "").toLowerCase()

/* CREAR PROYECTO */

if(text.includes("crear proyecto")){

let name = input.replace(/crear proyecto/i,"").trim()

if(!name) name = "Nuevo Proyecto"

let result = CONSIA_MEMORY.createProject(name)

return "EXECUTION ENGINE\nProyecto creado → " + name + "\n" + result

}

/* AGREGAR TAREA */

if(text.includes("agregar tarea")){

let parts = input.split("tarea")

let task = parts[1] || "Tarea nueva"

let projects = CONSIA_MEMORY.listProjects()

if(projects.length === 0){
return "No hay proyectos para agregar tareas"
}

let project = projects[0]

let result = CONSIA_MEMORY.addTask(project,task)

return "EXECUTION ENGINE\nTarea agregada a " + project

}

/* GUARDAR NOTA */

if(text.includes("guardar nota")){

let note = input.replace(/guardar nota/i,"").trim()

let projects = CONSIA_MEMORY.listProjects()

if(projects.length === 0){
return "No hay proyectos activos"
}

let project = projects[0]

let result = CONSIA_MEMORY.addNote(project,note)

return "EXECUTION ENGINE\nNota guardada en " + project

}

/* GUARDAR DECISION */

if(text.includes("registrar decision") || text.includes("guardar decision")){

let decision = input.replace(/registrar decision/i,"").trim()

let projects = CONSIA_MEMORY.listProjects()

if(projects.length === 0){
return "No hay proyectos activos"
}

let project = projects[0]

let result = CONSIA_MEMORY.addDecision(project,decision)

return "EXECUTION ENGINE\nDecisión guardada en " + project

}

/* CREAR WORKFLOW */

if(text.includes("crear workflow") || text.includes("crear automatizacion")){

return "EXECUTION ENGINE\nWorkflow creado en Automation Engine"

}

/* CREAR PRODUCTO */

if(text.includes("crear producto")){

return "EXECUTION ENGINE\nProducto registrado en Marketplace"

}

/* CONSULTAR PROYECTOS */

if(text.includes("ver proyectos")){

let projects = CONSIA_MEMORY.listProjects()

return "EXECUTION ENGINE\nProyectos activos → " + projects.join(", ")

}

return null

}

}

window.CONSIA_EXECUTION = CONSIA_EXECUTION
