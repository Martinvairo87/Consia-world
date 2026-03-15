class CONSIAGlobalMemory {

constructor(){

this.memory=[]
this.vectors=[]

}

async embed(text){

const words=text.split(" ")

let vector=words.map(w=>w.length)

return vector

}

async store(text){

const vector=await this.embed(text)

this.memory.push(text)
this.vectors.push(vector)

return{
ok:true,
size:this.memory.length
}

}

similarity(a,b){

let score=0

for(let i=0;i<a.length;i++){

score+=Math.min(a[i]||0,b[i]||0)

}

return score

}

async search(query){

const qVector=await this.embed(query)

let bestScore=0
let best=null

for(let i=0;i<this.vectors.length;i++){

const score=this.similarity(qVector,this.vectors[i])

if(score>bestScore){
bestScore=score
best=this.memory[i]
}

}

return{
match:best,
score:bestScore
}

}

}

window.CONSIAGlobalMemory=CONSIAGlobalMemory
