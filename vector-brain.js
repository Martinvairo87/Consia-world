// CONSIA VECTOR BRAIN

export async function embed(text){

const r=await fetch("https://api.openai.com/v1/embeddings",{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+CONSIA_OPENAI_KEY
},
body:JSON.stringify({
model:"text-embedding-3-small",
input:text
})
})

const j=await r.json()
return j.data[0].embedding

}


export async function storeDocument(env,id,text){

const vector=await embed(text)

await env.VECTOR_DB.put(id,JSON.stringify({
text,
vector
}))

return {ok:true}

}


export async function search(env,query){

const qVector=await embed(query)

const list=await env.VECTOR_DB.list()

let best=[]
for(const k of list.keys){

const item=JSON.parse(await env.VECTOR_DB.get(k.name))

const score=cosine(qVector,item.vector)

best.push({
score,
text:item.text
})

}

best.sort((a,b)=>b.score-a.score)

return best.slice(0,3)

}


function cosine(a,b){

let dot=0
let normA=0
let normB=0

for(let i=0;i<a.length;i++){

dot+=a[i]*b[i]
normA+=a[i]*a[i]
normB+=b[i]*b[i]

}

return dot/(Math.sqrt(normA)*Math.sqrt(normB))

}
