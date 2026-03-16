export class ConsiaAppBuilder {

constructor(env){
this.env = env
}

/* =========================
CREATE APP
========================= */

async build(spec){

const app = {

name: spec.name,

type: spec.type || "web-app",

pages:[
"home",
"dashboard",
"settings"
],

backend:[
"api",
"database",
"auth"
],

deploy:{
platform:"cloudflare",
status:"ready"
}

}

await this.env.DB.prepare(`
INSERT INTO projects (name,type,data,created)
VALUES (?1,?2,?3,?4)
`)
.bind(
app.name,
"app",
JSON.stringify(app),
Date.now()
)
.run()

return {
ok:true,
app
}

}

}
