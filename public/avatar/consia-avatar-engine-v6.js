/* CONSIA AVATAR ENGINE v6 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls;
let avatar;
let mixer;
let clock = new THREE.Clock();

const loader = new GLTFLoader();

/* INIT */

export function initCONSIA(canvasId){

const canvas = document.getElementById(canvasId);

scene = new THREE.Scene();
scene.background = new THREE.Color(0x061225);

camera = new THREE.PerspectiveCamera(
40,
window.innerWidth/window.innerHeight,
0.1,
100
);

renderer = new THREE.WebGLRenderer({
canvas:canvas,
antialias:true,
alpha:true
});

renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

/* LIGHTING */

const light1 = new THREE.HemisphereLight(0xffffff,0x444444,1.4);
scene.add(light1);

const light2 = new THREE.DirectionalLight(0xffffff,1);
light2.position.set(2,3,2);
scene.add(light2);

/* CAMERA */

camera.position.set(0,1.4,2);

/* CONTROLS */

controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping = true;

animate();

}

/* LOAD AVATAR */

export function loadAvatar(name){

if(avatar){
scene.remove(avatar);
}

loader.load(`/avatar/${name}.glb`,function(gltf){

avatar = gltf.scene;

avatar.scale.set(1.4,1.4,1.4);

scene.add(avatar);

if(gltf.animations.length){

mixer = new THREE.AnimationMixer(avatar);

const action = mixer.clipAction(gltf.animations[0]);
action.play();

}

});

}

/* ANIMATION LOOP */

function animate(){

requestAnimationFrame(animate);

if(mixer){

mixer.update(clock.getDelta());

}

controls.update();

renderer.render(scene,camera);

}

/* VOICE */

export function speak(text){

const speech = new SpeechSynthesisUtterance(text);

speech.lang = "auto";

speech.rate = 1;

speech.pitch = 1;

speechSynthesis.speak(speech);

}

/* SPEECH INPUT */

export function startVoice(){

const rec = new webkitSpeechRecognition();

rec.continuous = true;
rec.lang = "auto";

rec.onresult = function(e){

const text = e.results[e.results.length-1][0].transcript;

sendToCONSIA(text);

};

rec.start();

}

async function sendToCONSIA(text){

const res = await fetch("https://api.consia.world/v1/chat",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
message:text
})

});

const data = await res.json();

speak(data.answer);

}

/* CAMERA */

export async function startCamera(){

const stream = await navigator.mediaDevices.getUserMedia({
video:true
});

const video = document.createElement("video");
video.srcObject = stream;
video.play();

}
