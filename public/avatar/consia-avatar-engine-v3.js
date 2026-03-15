/* CONSIA AVATAR ENGINE v3 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, avatar;
let loader = new GLTFLoader();

export function initAvatar(canvasId){

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

export function loadAvatar(name){

if(avatar) scene.remove(avatar);

loader.load(`/avatar/${name}.glb`,function(gltf){

avatar = gltf.scene;
avatar.scale.set(1.2,1.2,1.2);

scene.add(avatar);

});

}

function animate(){

requestAnimationFrame(animate);

if(avatar){
avatar.rotation.y += 0.001;
}

renderer.render(scene,camera);

}

/* ---------- VOICE ---------- */

export function speak(text){

const speech = new SpeechSynthesisUtterance(text);
speech.lang = "auto";

speechSynthesis.speak(speech);

}

/* ---------- SPEECH INPUT ---------- */

export function startListening(){

const recognition = new webkitSpeechRecognition();

recognition.continuous = true;

recognition.onresult = function(e){

const text = e.results[e.results.length-1][0].transcript;

sendToConsia(text);

};

recognition.start();

}

async function sendToConsia(text){

const response = await fetch("https://api.consia.world/v1/chat",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({message:text})
});

const data = await response.json();

speak(data.answer);

}

/* ---------- CAMERA TRACKING ---------- */

export async function startCamera(){

const stream = await navigator.mediaDevices.getUserMedia({
video:true
});

const video = document.createElement("video");
video.srcObject = stream;
video.play();

}

/* ---------- AVATAR GENERATOR ---------- */

export async function createAvatar(prompt){

const res = await fetch("https://api.consia.world/v1/avatar/generate",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({prompt:prompt})
});

const data = await res.json();

loadAvatar(data.avatar);

}
