/* CONSIA AVATAR ENGINE v5 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";

/* GLOBALS */

let scene;
let camera;
let renderer;
let avatar;
let loader = new GLTFLoader();

/* INIT */

export function initCONSIAAvatar(canvasId){

const canvas = document.getElementById(canvasId);

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
45,
window.innerWidth/window.innerHeight,
0.1,
1000
);

renderer = new THREE.WebGLRenderer({
canvas:canvas,
alpha:true,
antialias:true
});

renderer.setSize(window.innerWidth,window.innerHeight);

const light = new THREE.HemisphereLight(0xffffff,0x444444,1.5);
scene.add(light);

camera.position.z = 2;

animate();

}

/* AVATAR LOADER */

export function loadAvatar(name){

if(avatar) scene.remove(avatar);

loader.load(`/avatar/${name}.glb`,function(gltf){

avatar = gltf.scene;

avatar.scale.set(1.2,1.2,1.2);

scene.add(avatar);

});

}

/* RENDER LOOP */

function animate(){

requestAnimationFrame(animate);

if(avatar){
avatar.rotation.y += 0.001;
}

renderer.render(scene,camera);

}

/* VOICE OUTPUT */

export function speak(text){

const speech = new SpeechSynthesisUtterance(text);

speech.lang = "auto";

speech.rate = 1;

speech.pitch = 1;

speechSynthesis.speak(speech);

}

/* VOICE INPUT */

export function startListening(){

const recognition = new webkitSpeechRecognition();

recognition.continuous = true;

recognition.interimResults = false;

recognition.lang = "auto";

recognition.onresult = function(e){

const text = e.results[e.results.length-1][0].transcript;

sendToCONSIA(text);

};

recognition.start();

}

/* API CALL */

async function sendToCONSIA(text){

const response = await fetch("https://api.consia.world/v1/chat",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
message:text
})

});

const data = await response.json();

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

/* AVATAR GENERATOR */

export async function createAvatar(prompt){

const res = await fetch("https://api.consia.world/v1/avatar/generate",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
prompt:prompt
})

});

const data = await res.json();

loadAvatar(data.avatar);

}
