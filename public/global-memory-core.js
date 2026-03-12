/* 
CONSIA GLOBAL MEMORY + PROJECT BRAIN
version: 1.0
*/

const CONSIA_MEMORY = {

storageKey: "CONSIA_GLOBAL_MEMORY_V1",

/* LOAD MEMORY */

load(){

try{

const raw = localStorage.getItem(this.storageKey)

if(!raw){

return {
projects:{},
notes:[],
decisions:[],
history:[]
}

}

return JSON.parse(raw)

}catch(e){

return {
projects:{},
notes:[],
decisions:[],
history:[]
}

}

},

/* SAVE MEMORY */

save(data){

localStorage.setItem(
this.storageKey,
JSON.stringify(data)
)

},

/* CREATE PROJECT */

createProject(name){

const db = this.load()

if(!name) return "Nombre de proyecto inválido"

if(!db.projects[name]){

db.projects[name] = {

name:name,
created:Date.now(),
status:"active",
tasks:[],
notes:[],
decisions:[]

}

this.save(db)

return "Proyecto creado: " + name

}

return "Proyecto ya existe: " + name

},

/* ADD TASK */

addTask(project,task){

const db = this.load()

if(!db.projects[project])
return "Proyecto no existe"

db.projects[project].tasks.push({

task:task,
created:Date.now(),
status:"open"

})

this.save(db)

return "Tarea agregada a " + project

},

/* COMPLETE TASK */

completeTask(project,index){

const db = this.load()

if(!db.projects[project])
return "Proyecto no existe"

if(!db.projects[project].tasks[index])
return "Tarea no encontrada"

db.projects[project].tasks[index].status="done"
db.projects[project].tasks[index].completed=Date.now()

this.save(db)

return "Tarea completada"

},

/* ADD NOTE */

addNote(project,note){

const db = this.load()

if(!db.projects[project])
return "Proyecto no existe"

db.projects[project].notes.push({

note:note,
created:Date.now()

})

this.save(db)

return "Nota guardada en " + project

},

/* ADD DECISION */

addDecision(project,decision){

const db = this.load()

if(!db.projects[project])
return "Proyecto no existe"

db.projects[project].decisions.push({

decision:decision,
created:Date.now()

})

this.save(db)

return "Decisión registrada"

},

/* ADD GLOBAL NOTE */

addGlobalNote(note){

const db = this.load()

db.notes.push({

note:note,
created:Date.now()

})

this.save(db)

return "Nota global guardada"

},

/* ADD HISTORY EVENT */

addHistory(event){

const db = this.load()

db.history.push({

event:event,
created:Date.now()

})

if(db.history.length > 500)
db.history.shift()

this.save(db)

},

/* GET PROJECT */

getProject(name){

const db = this.load()

return db.projects[name] || null

},

/* LIST PROJECTS */

listProjects(){

const db = this.load()

return Object.keys(db.projects)

},

/* SEARCH MEMORY */

search(text){

const db = this.load()

text = text.toLowerCase()

let results=[]

Object.values(db.projects).forEach(p=>{

p.notes.forEach(n=>{
if(n.note.toLowerCase().includes(text))
results.push({type:"note",project:p.name,value:n.note})
})

p.decisions.forEach(d=>{
if(d.decision.toLowerCase().includes(text))
results.push({type:"decision",project:p.name,value:d.decision})
})

p.tasks.forEach(t=>{
if(t.task.toLowerCase().includes(text))
results.push({type:"task",project:p.name,value:t.task})
})

})

return results

},

/* SUMMARY */

summary(){

const db = this.load()

const projectNames = Object.keys(db.projects)

let tasks=0
let notes=0
let decisions=0

projectNames.forEach(name=>{

tasks += db.projects[name].tasks.length
notes += db.projects[name].notes.length
decisions += db.projects[name].decisions.length

})

return {

totalProjects: projectNames.length,
projects: projectNames,
totalTasks: tasks,
totalNotes: notes,
totalDecisions: decisions

}

},

/* EXPORT MEMORY */

export(){

return JSON.stringify(
this.load(),
null,
2
)

},

/* IMPORT MEMORY */

import(data){

try{

const parsed = JSON.parse(data)

localStorage.setItem(
this.storageKey,
JSON.stringify(parsed)
)

return "Memoria importada"

}catch(e){

return "Error al importar memoria"

}

},

/* RESET MEMORY */

reset(){

localStorage.removeItem(this.storageKey)

return "Memoria eliminada"

}

}

/* GLOBAL */

window.CONSIA_MEMORY = CONSIA_MEMORY
