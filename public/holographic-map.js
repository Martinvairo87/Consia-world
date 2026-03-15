class CONSIAHolographicMap {

constructor(container){

this.container=container
this.nodes=[]

}

createNode(name,x,y){

const node=document.createElement("div")

node.style.position="absolute"
node.style.left=x+"px"
node.style.top=y+"px"
node.style.padding="8px 12px"
node.style.background="#0f2b66"
node.style.borderRadius="8px"
node.style.color="#fff"

node.innerText=name

this.container.appendChild(node)

this.nodes.push(node)

}

render(){

this.createNode("GLOBAL BRAIN",200,100)
this.createNode("AGENT SWARM",400,200)
this.createNode("GLOBAL MEMORY",600,120)
this.createNode("AUTOPILOT",300,300)
this.createNode("MARKETPLACE",550,320)
this.createNode("PROJECT ENGINE",150,280)

}

}

window.CONSIAHolographicMap=CONSIAHolographicMap
