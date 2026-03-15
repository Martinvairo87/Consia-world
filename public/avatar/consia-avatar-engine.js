/* CONSIA AVATAR ENGINE */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";

/* ---------- CORE ---------- */

let scene;
let camera;
let renderer;
let avatar;

const avatars = {
  consia: "/avatar/consia.glb",
  martin: "/avatar/martin.glb",
  future: "/avatar/martin-futurista.glb"
};

export function initCONSIAAvatar(canvasId) {

  const canvas = document.getElementById(canvasId);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(light);

  camera.position.z = 3;

  animate();
}

/* ---------- AVATAR LOADER ---------- */

export function loadAvatar(type) {

  const loader = new GLTFLoader();

  if (avatar) scene.remove(avatar);

  const model = avatars[type];

  loader.load(model, function (gltf) {

    avatar = gltf.scene;
    avatar.scale.set(1.2,1.2,1.2);

    scene.add(avatar);

  });
}

/* ---------- RENDER LOOP ---------- */

function animate() {

  requestAnimationFrame(animate);

  renderer.render(scene, camera);

}

/* ---------- VOICE INPUT ---------- */

export function startVoice() {

  const recognition = new webkitSpeechRecognition();

  recognition.continuous = true;
  recognition.lang = "es-ES";

  recognition.start();

  recognition.onresult = async function(event) {

    const text = event.results[event.results.length - 1][0].transcript;

    const response = await fetch("https://api.consia.world/v1/chat", {

      method: "POST",
      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({
        message: text
      })

    });

    const data = await response.json();

    speak(data.answer);

  };

}

/* ---------- VOICE OUTPUT ---------- */

function speak(text) {

  const utter = new SpeechSynthesisUtterance(text);

  utter.lang = "es-ES";
  utter.rate = 1;
  utter.pitch = 1;

  speechSynthesis.speak(utter);

}

/* ---------- FACE TRACKING BASE ---------- */

export async function startFaceTracking() {

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  });

  const video = document.createElement("video");
  video.srcObject = stream;
  video.play();

}

/* ---------- LIP SYNC BASE ---------- */

export function animateMouth(level) {

  if (!avatar) return;

  const mouth = avatar.getObjectByName("mouth");

  if (mouth) {
    mouth.scale.y = 1 + level;
  }

}

/* ---------- AVATAR GENERATOR ---------- */

export async function generateAvatar(prompt) {

  const res = await fetch("https://api.consia.world/v1/avatar/generate", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      prompt: prompt
    })

  });

  const data = await res.json();

  loadAvatar(data.avatar);

}
