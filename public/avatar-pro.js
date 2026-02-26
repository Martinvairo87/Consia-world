import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

import { connectVoiceSocket, startVoiceStream, stopVoiceStream } from "/voice-socket.js";
import { emotionFromLandmarks } from "/emotion.js";

const logEl = document.getElementById("log");
const wsStateEl = document.getElementById("wsState");
const wsDot = document.getElementById("wsDot");
const faceStateEl = document.getElementById("faceState");
const emoStateEl = document.getElementById("emoState");

const btnStart = document.getElementById("btnStart");
const btnTalk = document.getElementById("btnTalk");
const camEl = document.getElementById("cam");
const stage = document.getElementById("stage");

function log(s){
  logEl.textContent = (logEl.textContent + "\n" + s).slice(-2500);
}

let scene, camera, renderer;
let avatarRoot = null;
let headBone = null;           // si existe
let jawBone = null;            // si existe
let morphTargets = null;       // si existe (mouthOpen, visemes)
let ws = null;
let mediaStream = null;

// ---------- THREE SETUP ----------
function initThree(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.55, 2.3);

  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  stage.appendChild(renderer.domElement);

  const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
  light1.position.set(2, 4, 2);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0x00ffd5, 0.6);
  light2.position.set(-2, 2, 1);
  scene.add(light2);

  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(amb);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20,20),
    new THREE.MeshStandardMaterial({ color:0x050505, metalness:.2, roughness:.9 })
  );
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  scene.add(floor);

  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ---------- LOAD GLB ----------
async function loadGLB(){
  const loader = new GLTFLoader();
  return new Promise((resolve, reject)=>{
    loader.load("/assets/avatar.glb", (gltf)=>{
      avatarRoot = gltf.scene;
      avatarRoot.position.set(0,0,0);
      avatarRoot.traverse(obj=>{
        if(obj.isMesh){
          obj.castShadow = true;
          obj.frustumCulled = false;
          // intento morph targets (visemes)
          if(obj.morphTargetDictionary && obj.morphTargetInfluences){
            morphTargets = { dict: obj.morphTargetDictionary, inf: obj.morphTargetInfluences };
          }
        }
        // intento encontrar bones típicos
        if(obj.isBone){
          const n = (obj.name || "").toLowerCase();
          if(!headBone && (n.includes("head") || n.includes("cabeza"))) headBone = obj;
          if(!jawBone && (n.includes("jaw") || n.includes("mandible") || n.includes("mouth"))) jawBone = obj;
        }
      });
      scene.add(avatarRoot);
      resolve(true);
    }, undefined, (err)=>{
      reject(err);
    });
  });
}

// ---------- FACE TRACKING (MediaPipe) ----------
let faceMesh = null;
let mpCamera = null;
let lastLandmarks = null;

function setFaceState(v){ faceStateEl.textContent = v ? "on" : "off"; }

async function initFaceTracking(){
  faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  faceMesh.onResults((res)=>{
    if(res.multiFaceLandmarks && res.multiFaceLandmarks[0]){
      lastLandmarks = res.multiFaceLandmarks[0];
      setFaceState(true);
    } else {
      setFaceState(false);
      lastLandmarks = null;
    }
  });

  mpCamera = new Camera(camEl, {
    onFrame: async () => {
      await faceMesh.send({ image: camEl });
    },
    width: 720,
    height: 1280
  });

  await mpCamera.start();
}

// ---------- APPLY TRACKING TO AVATAR ----------
function applyFaceToAvatar(){
  if(!lastLandmarks) return;

  // Emotion (heurística)
  const emo = emotionFromLandmarks(lastLandmarks);
  emoStateEl.textContent = emo.label;

  // Head rotation (simple): usamos landmarks de ojos/nariz para aproximar yaw/pitch
  // indices aproximados: nose tip 1, left eye 33, right eye 263, chin 199
  const nose = lastLandmarks[1];
  const le = lastLandmarks[33];
  const re = lastLandmarks[263];
  const chin = lastLandmarks[199];

  const dx = (re.x - le.x);
  const dy = (chin.y - nose.y);

  // heurística: yaw por asimetría x del nose vs ojos, pitch por dy
  const yaw = (0.5 - nose.x) * 1.2;      // izquierda/derecha
  const pitch = (nose.y - 0.5) * 1.0;    // arriba/abajo
  const roll = (le.y - re.y) * 2.0;      // inclinación

  if(headBone){
    headBone.rotation.set(pitch, yaw, roll);
  }else if(avatarRoot){
    avatarRoot.rotation.y = yaw * 0.5;
  }

  // Mouth open → viseme básico (usamos distancia entre labios: indices 13/14)
  const up = lastLandmarks[13];
  const lo = lastLandmarks[14];
  const mouthOpen = Math.max(0, Math.min(1, (lo.y - up.y) * 18)); // escala

  // Si hay jaw bone, lo movemos
  if(jawBone){
    jawBone.rotation.x = mouthOpen * 0.6;
  }

  // Si hay morph target mouthOpen / jawOpen / viseme_aa etc.
  if(morphTargets){
    const { dict, inf } = morphTargets;
    const keys = Object.keys(dict);

    // intenta varios nombres comunes
    const candidates = ["mouthopen","jawopen","viseme_aa","viseme_ah","aa","ah"];
    let applied = false;
    for(const c of candidates){
      const k = keys.find(x => x.toLowerCase() === c);
      if(k){
        inf[dict[k]] = mouthOpen;
        applied = true;
        break;
      }
    }
    // si no hay, no pasa nada
    if(applied){
      // suavizado mínimo
    }
  }
}

// ---------- VOICE SOCKET ----------
function setWS(ok){
  wsStateEl.textContent = ok ? "on" : "off";
  wsDot.classList.toggle("warn", !ok);
}

async function startAll(){
  initThree();

  // cámara + face
  try{
    mediaStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    camEl.srcObject = mediaStream;
    await camEl.play();
    await initFaceTracking();
    log("Face tracking OK");
  }catch(e){
    log("Cam/Face error: " + e.message);
  }

  // ws connect
  try{
    ws = await connectVoiceSocket("consia-room-1", (msg)=>{
      // opcional: TTS desde server
      if(msg?.type === "text" && msg.text){
        const u = new SpeechSynthesisUtterance(msg.text);
        speechSynthesis.speak(u);
      }
    }, ()=>{
      setWS(true);
      log("WS connected");
    }, ()=>{
      setWS(false);
      log("WS closed");
    });
  }catch(e){
    setWS(false);
    log("WS error: " + e.message);
  }

  // GLB
  try{
    await loadGLB();
    log("GLB loaded: /assets/avatar.glb");
  }catch(e){
    log("GLB load failed. Subí /assets/avatar.glb");
    // fallback sphere
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 24, 24),
      new THREE.MeshBasicMaterial({ color:0x00ffd5, wireframe:true })
    );
    s.position.y = 1.55;
    scene.add(s);
    avatarRoot = s;
  }

  animate();
}

let talking = false;

btnTalk.addEventListener("pointerdown", async ()=>{
  if(talking) return;
  talking = true;
  btnTalk.textContent = "HABLANDO...";
  try{
    await startVoiceStream(ws, mediaStream);
    log("Voice stream started");
  }catch(e){
    log("Voice stream error: " + e.message);
  }
});

btnTalk.addEventListener("pointerup", async ()=>{
  if(!talking) return;
  talking = false;
  btnTalk.textContent = "PUSH-TO-TALK";
  try{
    await stopVoiceStream(ws);
    log("Voice stream stopped");
  }catch(e){
    log("Stop stream error: " + e.message);
  }
});

btnStart.onclick = startAll;

// ---------- LOOP ----------
function animate(){
  requestAnimationFrame(animate);
  applyFaceToAvatar();
  renderer.render(scene, camera);
}
