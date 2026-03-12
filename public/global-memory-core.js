// CONSIA GLOBAL MEMORY + PROJECT BRAIN

const CONSIA_MEMORY = {

  storageKey: "CONSIA_GLOBAL_MEMORY_V1",

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

    }catch{

      return {
        projects:{},
        notes:[],
        decisions:[],
        history:[]
      }

    }

  },

  save(data){

    localStorage.setItem(this.storageKey, JSON.stringify(data))

  },

  createProject(name){

    const db = this.load()

    if(!db.projects[name]){

      db.projects[name] = {
        created: Date.now(),
        tasks:[],
        notes:[],
        decisions:[],
        status:"active"
      }

      this.save(db)

      return "Proyecto creado: " + name

    }

    return "Proyecto ya existe"

  },

  addTask(project,task){

    const db = this.load()

    if(!db.projects[project]) return "Proyecto no existe"

    db.projects[project].tasks.push({
      task:task,
      created:Date.now(),
      status:"open"
    })

    this.save(db)

    return "Tarea agregada"

  },

  addNote(project,note){

    const db = this.load()

    if(!db.projects[project]) return "Proyecto no existe"

    db.projects[project].notes.push({
      note:note,
      created:Date.now()
    })

    this.save(db)

    return "Nota guardada"

  },

  addDecision(project,decision){

    const db = this.load()

    if(!db.projects[project]) return "Proyecto no existe"

    db.projects[project].decisions.push({
      decision:decision,
      created:Date.now()
    })

    this.save(db)

    return "Decisión registrada"

  },

  summary(){

    const db = this.load()

    const projects = Object.keys(db.projects)

    return {
      totalProjects: projects.length,
      projects: projects
    }

  }

}

window.CONSIA_MEMORY = CONSIA_MEMORY
