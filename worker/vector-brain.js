export class ConsiaVectorBrain {

constructor(env){
this.env = env
}

/* =========================
INGEST MEMORY
========================= */

async ingest(text){

await this.env.DB.prepare(`
INSERT INTO vectors (content,created)
VALUES (?1,?2)
`)
.bind(
text,
Date.now()
)
.run()

return {ok:true}

}

/* =========================
SEMANTIC SEARCH
========================= */

async search(query){

const rows = await this.env.DB.prepare(`
SELECT content
FROM vectors
ORDER BY id DESC
LIMIT 10
`).all()

return {
query,
results:rows.results || []
}

}

}
