1"}
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);

let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

/* HEAD /
let geometry = new THREE.SphereGeometry(1,32,32);
let material = new THREE.MeshBasicMaterial({
color:0x00ffff,
wireframe:true
});
let head = new THREE.Mesh(geometry,material);
scene.add(head);

camera.position.z = 3;

/ LIP SYNC SCALE /
function lip(level){
head.scale.y = 1 + level;
}

/ VOICE /
document.getElementById("talk").onclick=()=>{

let rec = new webkitSpeechRecognition();
rec.lang="en-US";

rec.onresult=e=>{
let text=e.results[0][0].transcript;

let speech=new SpeechSynthesisUtterance(text);
speechSynthesis.speak(speech);

/ Fake viseme */
let i=0;
let interval=setInterval(()=>{
lip(Math.random()0.3);
i++;
if(i>20){
lip(0);
clearInterval(interval);
}
},100);
};

rec.start();
};

/ LOOP */
function animate(){
requestAnimationFrame(animate);
head.rotation.y+=0.01;
renderer.render(scene,camera);
}
animate
