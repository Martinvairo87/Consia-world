const CONSIA = {

async run(task,input){

try{

const response = await fetch("https://api.consia.world/v1/chat",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
task:task,
input:input
})

})

const data = await response.json()

if(data.answer){

return data.answer

}

return "CONSIA running."

}catch(e){

return "CONSIA brain offline"

}

}

}
