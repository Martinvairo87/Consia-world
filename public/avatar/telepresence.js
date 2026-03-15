import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";
import { createGestureEngine } from "/avatar/gesture-engine.js";

export function initTelepresenceApp(config) {
  new ConsiaTelepresenceApp(config).init();
}

class ConsiaTelepresenceApp {
  constructor(config) {
    this.apiBase = config.apiBase || "https://api.consia.world";
    this.version = config.version || "telepresence";
    this.sel = config.selectors || {};
    this.ui = {};
    this.state = {
      activeAvatar: "consia",
      rendererMode: "fallback holográfico",
      currentModule: "dashboard",
      currentRoute: "/",
      currentScene: "default",
      micActive: false,
      recognition: null,
      history: [],
      sending: false,
      cameraOn: false,
      gesturesOn: false,
      gestureController: null,
      cameraStream: null,
      currentGesture: "none",
      faceDetected: false,
      handsDetected: 0,
      poseDetected: false,
      headYaw: 0,
      headPitch: 0,
      headRoll: 0,
      bodyLean: 0,
      firstSpeechReady: false,
      lastGestureAt: 0,
      currentSpeechText: ""
    };

    this.moduleTemplates = {
      dashboard: [
        { title: "Estado general", text: "CONSIA operativo. Acciones automáticas y telepresencia habilitadas." },
        { title: "Siguiente paso", text: "Usá el chat, la voz o los gestos para gestionar módulos, escenas y avatar." }
      ],
      realwork: [
        { title: "Real Work", text: "Módulo comercial listo para leads, propiedades y presentaciones." },
        { title: "Acción sugerida", text: "Mostrar propiedades destacadas, pitch y seguimiento comercial." }
      ],
      manglar: [
        { title: "Manglar", text: "Módulo de desarrollos, avances, unidades y materiales." },
        { title: "Acción sugerida", text: "Presentar proyectos y métricas clave con modo presentador." }
      ],
      sales: [
        { title: "Sales", text: "Modo ventas activado." },
        { title: "Acción sugerida", text: "Pitch corto, demo y cierre con CTA." }
      ],
      avatar: [
        { title: "Avatar", text: "Control de identidad, escena, telepresencia, voz y visualización." },
        { title: "Acción sugerida", text: "Cambiar entre CONSIA, Martín y Martín Future." }
      ],
      presentation: [
        { title: "Presentation", text: "Modo presentador activo." },
        { title: "Acción sugerida", text: "Narrativa breve, directa y premium." }
      ],
      marketplace: [
        { title: "Marketplace", text: "Catálogo, productos y monetización." },
        { title: "Acción sugerida", text: "Abrir ficha destacada y CTA de compra." }
      ]
    };
  }

  async init() {
    this.cacheUi();
    this.bindUi();
    this.initThree();
    this.setStatus("health", "warn", "Health: iniciando");
    this.setStatus("api", "warn", "Chat: esperando");
    this.setStatus("voice", "ok", "Voz: lista");
    this.setStatus("mic", "warn", "Mic: off");
    this.updateTelepresenceStatus();
    this.renderModule("dashboard", "dashboard");
    this.setScene("default");
    this.setRoute("/");
    this.updateUi();
    this.ui.subTitle.textContent = `Telepresence + voz + cara + manos + cuerpo + acciones automáticas · ${this.version}`;
    await this.healthCheck();
    await this.loadAvatar("consia");
    this.showBubble("CONSIA", `Listo. API base activa: ${this.apiBase}`);
    this.addLog("system", `CONSIA Telepresence iniciado · ${this.version}`);
    this.addLog("system", `API base: ${this.apiBase}`);
  }

  cacheUi() {
    const get = (key) => document.getElementById(this.sel[key]);
    this.ui.canvas = get("canvas");
    this.ui.messageInput = get("messageInput");
    this.ui.langSelect = get("langSelect");
    this.ui.modeSelect = get("modeSelect");
    this.ui.cameraPreview = get("cameraPreview");
    this.ui.moduleBody = get("moduleBody");
    this.ui.moduleTitle = get("moduleTitle");
    this.ui.sceneLabel = get("sceneLabel");
    this.ui.routeLabel = get("routeLabel");
    this.ui.renderLabel = get("renderLabel");
    this.ui.langLabel = get("langLabel");
    this.ui.speech = get("speech");
    this.ui.speechName = get("speechName");
    this.ui.speechText = get("speechText");
    this.ui.log = get("log");
    this.ui.toasts = get("toasts");
    this.ui.subTitle = get("subTitle");
    this.ui.txtAvatar = get("txtAvatar");
    this.ui.badgeModule = get("badgeModule");
    this.ui.badgeAvatar = get("badgeAvatar");
    this.ui.badgeScene = get("badgeScene");
    this.ui.dotHealth = get("dotHealth");
    this.ui.txtHealth = get("txtHealth");
    this.ui.dotApi = get("dotApi");
    this.ui.txtApi = get("txtApi");
    this.ui.dotVoice = get("dotVoice");
    this.ui.txtVoice = get("txtVoice");
    this.ui.dotMic = get("dotMic");
    this.ui.txtMic = get("txtMic");
    this.ui.teleCam = get("teleCam");
    this.ui.teleFace = get("teleFace");
    this.ui.teleHands = get("teleHands");
    this.ui.telePose = get("telePose");
    this.ui.teleGesture = get("teleGesture");
    this.ui.teleMode = get("teleMode");
    const btnSel = this.sel.buttons || {};
    this.ui.btnSend = document.getElementById(btnSel.send);
    this.ui.btnSendQuick = document.getElementById(btnSel.sendQuick);
    this.ui.btnHello = document.getElementById(btnSel.hello);
    this.ui.btnConsia = document.getElementById(btnSel.consia);
    this.ui.btnMartin = document.getElementById(btnSel.martin);
    this.ui.btnFuture = document.getElementById(btnSel.future);
    this.ui.btnMic = document.getElementById(btnSel.mic);
    this.ui.btnStop = document.getElementById(btnSel.stop);
    this.ui.btnDemo = document.getElementById(btnSel.demo);
    this.ui.btnQuickRealwork = document.getElementById(btnSel.quickRealwork);
    this.ui.btnQuickManglar = document.getElementById(btnSel.quickManglar);
    this.ui.btnQuickPitch = document.getElementById(btnSel.quickPitch);
    this.ui.btnCamera = document.getElementById(btnSel.camera);
    this.ui.btnGestures = document.getElementById(btnSel.gestures);
  }

  bindUi() {
    this.ui.btnSend.addEventListener("click", () => this.sendChat(this.ui.messageInput.value));
    this.ui.btnSendQuick.addEventListener("click", () => this.sendChat(this.ui.messageInput.value));
    this.ui.btnHello.addEventListener("click", () => this.sendChat("Hola CONSIA"));
    this.ui.btnConsia.addEventListener("click", () => this.loadAvatar("consia"));
    this.ui.btnMartin.addEventListener("click", () => this.loadAvatar("martin"));
    this.ui.btnFuture.addEventListener("click", () => this.loadAvatar("martin-futurista"));
    this.ui.btnMic.addEventListener("click", () => this.toggleMic());
    this.ui.btnStop.addEventListener("click", () => this.stopSpeech());
    this.ui.btnDemo.addEventListener("click", () => this.runDemo("default"));
    this.ui.btnQuickRealwork.addEventListener("click", () => {
      this.ui.messageInput.value = "Activá el avatar martin-futurista y abrí el módulo realwork con una presentación comercial breve.";
      this.sendChat(this.ui.messageInput.value);
    });
    this.ui.btnQuickManglar.addEventListener("click", () => {
      this.ui.messageInput.value = "Abrí el módulo manglar, cambiá la escena a presentation y mostrame una presentación corta.";
      this.sendChat(this.ui.messageInput.value);
    });
    this.ui.btnQuickPitch.addEventListener("click", () => {
      this.ui.messageInput.value = "Activá presenter mode para CONSIA con una demo ejecutiva de 20 segundos.";
      this.sendChat(this.ui.messageInput.value);
    });
    this.ui.btnCamera.addEventListener("click", () => this.toggleCamera());
    this.ui.btnGestures.addEventListener("click", () => this.toggleGestures());
    this.ui.langSelect.addEventListener("change", () => this.updateUi());
  }

  setDot(el, mode) {
    el.classList.remove("ok", "warn", "err");
    el.classList.add(mode);
  }

  setStatus(kind, mode, text) {
    const map = {
      health: [this.ui.dotHealth, this.ui.txtHealth],
      api: [this.ui.dotApi, this.ui.txtApi],
      voice: [this.ui.dotVoice, this.ui.txtVoice],
      mic: [this.ui.dotMic, this.ui.txtMic]
    };
    const [dot, label] = map[kind];
    this.setDot(dot, mode);
    label.textContent = text;
  }

  addLog(role, text) {
    const card = document.createElement("div");
    card.className = "log-card";
    card.innerHTML = `<div class="log-role"></div><div class="log-text"></div>`;
    card.querySelector(".log-role").textContent = role;
    card.querySelector(".log-text").textContent = typeof text === "string" ? text : JSON.stringify(text, null, 2);
    this.ui.log.prepend(card);
  }

  toast(title, message, level = "info") {
    const node = document.createElement("div");
    node.className = `toast ${level}`;
    node.innerHTML = `<strong style="display:block;margin-bottom:6px">${this.escapeHtml(title)}</strong><div style="font-size:14px;line-height:1.42">${this.escapeHtml(message)}</div>`;
    this.ui.toasts.appendChild(node);
    setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
      setTimeout(() => node.remove(), 180);
    }, 3200);
  }

  escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  showBubble(name, text, sticky = false) {
    this.ui.speechName.textContent = name;
    this.ui.speechText.textContent = text;
    this.ui.speech.classList.add("show");
    clearTimeout(this.bubbleTimer);
    if (!sticky) {
      this.bubbleTimer = setTimeout(() => this.ui.speech.classList.remove("show"), 6000);
    }
  }

  speak(text, name = "CONSIA") {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this.ui.langSelect.value === "auto" ? (navigator.language || "es-AR") : this.ui.langSelect.value;
    utter.rate = 1;
    utter.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = utter.lang.slice(0, 2).toLowerCase();
    const preferred = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => {
      this.setStatus("voice", "ok", "Voz: hablando");
      this.state.currentSpeechText = text;
      this.showBubble(name, text, true);
    };
    utter.onend = () => {
      this.setStatus("voice", "ok", "Voz: lista");
      this.state.currentSpeechText = "";
      this.ui.speech.classList.remove("show");
    };
    utter.onerror = () => {
      this.setStatus("voice", "err", "Voz: error");
      this.state.currentSpeechText = "";
    };
    window.speechSynthesis.speak(utter);
  }

  stopSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.state.currentSpeechText = "";
    this.ui.speech.classList.remove("show");
    this.setStatus("voice", "ok", "Voz: lista");
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x061225);

    this.camera = new THREE.PerspectiveCamera(38, this.ui.canvas.clientWidth / this.ui.canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 1.34, 3.1);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.ui.canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.ui.canvas.clientWidth, this.ui.canvas.clientHeight, false);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 5.5;
    this.controls.target.set(0, 1.12, 0);

    this.scene.add(new THREE.HemisphereLight(0xdff5ff, 0x102040, 1.7));

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2.8, 4, 3.4);
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0x5ccaff, 0.45);
    fill.position.set(-3, 2, 2);
    this.scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.15, 64),
      new THREE.MeshBasicMaterial({ color: 0x1f6fff, transparent: true, opacity: .08 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    this.scene.add(floor);

    this.hologramGroup = new THREE.Group();
    this.scene.add(this.hologramGroup);

    this.loader = new GLTFLoader();
    this.currentAvatar = null;
    this.headPivot = null;
    this.mixer = null;
    this.clock = new THREE.Clock();

    window.addEventListener("resize", () => this.resize());
    this.resize();
    this.animate();
  }

  resize() {
    const w = this.ui.canvas.clientWidth;
    const h = this.ui.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  clearAvatar() {
    if (this.currentAvatar && this.currentAvatar.parent) {
      this.currentAvatar.parent.remove(this.currentAvatar);
    }
    this.currentAvatar = null;
    this.headPivot = null;
    this.mixer = null;
  }

  createFallbackAvatar() {
    this.hologramGroup.clear();

    const root = new THREE.Group();
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.45, 0);
    root.add(headPivot);

    const mat = new THREE.MeshPhongMaterial({
      color: 0x72d8ff,
      transparent: true,
      opacity: .17,
      emissive: 0x1ab6ff,
      emissiveIntensity: .24,
      shininess: 90
    });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), mat.clone());
    head.position.set(0, 0.07, 0);
    headPivot.add(head);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 16), mat.clone());
    neck.position.set(0, 1.28, 0);
    root.add(neck);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.8, 8, 18), mat.clone());
    torso.position.set(0, 0.65, 0);
    root.add(torso);

    const eyeGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc7f3ff, transparent: true, opacity: .95 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.09, 0.11, 0.24);
    eyeR.position.set(0.09, 0.11, 0.24);
    headPivot.add(eyeL, eyeR);

    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.015, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x9be9ff, transparent: true, opacity: .9 })
    );
    mouth.position.set(0, -0.02, 0.24);
    mouth.name = "fallbackMouth";
    headPivot.add(mouth);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xdfffff, transparent: true, opacity: .9 })
    );
    core.position.set(0, 0.84, 0.28);
    root.add(core);

    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.004, 12, 100),
      new THREE.MeshBasicMaterial({ color: 0x59cfff, transparent: true, opacity: .35 })
    );
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0, 0.78, 0);
    root.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.96, 0.004, 12, 120),
      new THREE.MeshBasicMaterial({ color: 0x59cfff, transparent: true, opacity: .18 })
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(0, 1.02, 0);
    root.add(ring2);

    root.userData = { mouth, core, ring1, ring2 };
    root.add(headPivot);
    this.hologramGroup.add(root);
    this.currentAvatar = root;
    this.headPivot = headPivot;
    this.state.rendererMode = "fallback holográfico";
    this.updateUi();
  }

  async loadAvatar(name) {
    this.state.activeAvatar = name;
    this.clearAvatar();
    this.createFallbackAvatar();
    this.showBubble("CONSIA", `Cargando ${name.toUpperCase()}...`, true);

    try {
      const gltf = await this.loader.loadAsync(`/avatar/${name}.glb`);
      this.hologramGroup.clear();
      this.currentAvatar = gltf.scene;
      this.currentAvatar.position.set(0, 0, 0);
      this.currentAvatar.scale.setScalar(1.32);
      this.scene.add(this.currentAvatar);

      const headNames = ["Head", "head", "mixamorigHead", "CC_Base_Head", "head_jnt"];
      let headNode = null;
      this.currentAvatar.traverse(obj => {
        if (!headNode && headNames.includes(obj.name)) headNode = obj;
      });
      this.headPivot = headNode || this.currentAvatar;

      if (gltf.animations && gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.currentAvatar);
        const action = this.mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      this.state.rendererMode = "GLB real";
      this.updateUi();
      this.showBubble(name.toUpperCase(), `${name.toUpperCase()} cargado.`);
      this.addLog("system", `/avatar/${name}.glb cargado.`);
    } catch {
      this.state.rendererMode = "fallback holográfico";
      this.updateUi();
      this.showBubble("CONSIA", `No encontré /avatar/${name}.glb. Sigo en modo holograma.`);
      this.addLog("warning", `No se pudo cargar /avatar/${name}.glb`);
    }
  }

  applyTrackingToAvatar() {
    if (!this.headPivot) return;
    const yaw = THREE.MathUtils.clamp(this.state.headYaw, -0.55, 0.55);
    const pitch = THREE.MathUtils.clamp(this.state.headPitch, -0.35, 0.35);
    const roll = THREE.MathUtils.clamp(this.state.headRoll, -0.30, 0.30);

    this.headPivot.rotation.y += (yaw - this.headPivot.rotation.y) * 0.14;
    this.headPivot.rotation.x += (pitch - this.headPivot.rotation.x) * 0.14;
    this.headPivot.rotation.z += (roll - this.headPivot.rotation.z) * 0.14;

    if (this.currentAvatar && this.state.rendererMode === "GLB real") {
      this.currentAvatar.position.x += ((this.state.bodyLean * 0.08) - this.currentAvatar.position.x) * 0.08;
    }
  }

  animateFallback(delta) {
    if (!this.currentAvatar || this.state.rendererMode !== "fallback holográfico") return;
    const t = performance.now() * 0.001;
    this.currentAvatar.rotation.y = Math.sin(t * 0.55) * 0.18 + this.state.headYaw * 0.55;
    const d = this.currentAvatar.userData || {};
    if (d.core) d.core.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08);
    if (d.ring1) d.ring1.rotation.z += delta * 0.5;
    if (d.ring2) d.ring2.rotation.z -= delta * 0.3;
    if (d.mouth) {
      const talking = this.state.currentSpeechText ? Math.abs(Math.sin(t * 12)) * 2.4 : 0.3;
      d.mouth.scale.y = 1 + talking;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);
    if (this.currentAvatar && this.state.rendererMode === "GLB real") {
      this.currentAvatar.rotation.y += delta * 0.05;
      this.currentAvatar.position.y = Math.sin(performance.now() * 0.0018) * 0.02;
    }
    this.applyTrackingToAvatar();
    this.animateFallback(delta);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  renderModule(module, titleOverride = "") {
    this.state.currentModule = module || "dashboard";
    const title = titleOverride || this.state.currentModule;
    this.ui.moduleTitle.textContent = title;
    this.ui.badgeModule.textContent = `Módulo: ${this.state.currentModule}`;

    const cards = this.moduleTemplates[this.state.currentModule] || [
      { title: "Módulo", text: `${this.state.currentModule} cargado.` }
    ];

    this.ui.moduleBody.innerHTML = cards.map(card => `
      <div class="module-card">
        <strong>${this.escapeHtml(card.title)}</strong>
        <div style="font-size:14px;line-height:1.42;color:#d7eaff">${this.escapeHtml(card.text)}</div>
      </div>
    `).join("");
  }

  setScene(scene) {
    this.state.currentScene = scene || "default";
    document.body.className = "";
    document.body.classList.add(`scene-${this.state.currentScene}`);
    this.ui.sceneLabel.textContent = `Escena: ${this.state.currentScene}`;
    this.ui.badgeScene.textContent = `Escena: ${this.state.currentScene}`;
    this.updateUi();
  }

  setRoute(route) {
    this.state.currentRoute = route || "/";
    this.ui.routeLabel.textContent = `Ruta: ${this.state.currentRoute}`;
    if (this.state.currentRoute.startsWith("/")) {
      history.replaceState(null, "", this.state.currentRoute);
    }
  }

  updateTelepresenceStatus() {
    this.ui.teleCam.textContent = `Cámara: ${this.state.cameraOn ? "on" : "off"}`;
    this.ui.teleFace.textContent = `Cara: ${this.state.faceDetected ? "detectada" : "no detectada"}`;
    this.ui.teleHands.textContent = `Manos: ${this.state.handsDetected || 0}`;
    this.ui.telePose.textContent = `Cuerpo: ${this.state.poseDetected ? "detectado" : "no detectado"}`;
    this.ui.teleGesture.textContent = `Gesto: ${this.state.currentGesture || "none"}`;
    this.ui.teleMode.textContent = `Modo: ${this.state.gesturesOn ? "telepresencia activa" : "espejo digital"}`;
    this.ui.btnCamera.textContent = this.state.cameraOn ? "Detener telepresencia" : "Activar telepresencia";
    this.ui.btnGestures.textContent = this.state.gesturesOn ? "Detener gestos" : "Activar gestos";
  }

  updateUi() {
    const avatarLabel = this.state.activeAvatar === "martin-futurista" ? "MARTIN FUTURE" : this.state.activeAvatar.toUpperCase();
    this.ui.txtAvatar.textContent = `Avatar: ${avatarLabel}`;
    this.ui.badgeAvatar.textContent = `Avatar: ${avatarLabel}`;
    this.ui.renderLabel.textContent = `Render: ${this.state.rendererMode}`;
    this.ui.langLabel.textContent = `Idioma: ${this.ui.langSelect.value}`;
    this.ui.sceneLabel.textContent = `Escena: ${this.state.currentScene}`;
    this.ui.routeLabel.textContent = `Ruta: ${this.state.currentRoute}`;
    this.updateTelepresenceStatus();
  }

  async runAction(action) {
    if (!action || typeof action !== "object") return;

    switch (action.type) {
      case "set_avatar":
        await this.loadAvatar(action.avatar || "consia");
        this.toast("Avatar", `Activado ${action.avatar || "consia"}`, "success");
        break;

      case "open_module":
        this.renderModule(action.module || "dashboard", action.title || "");
        if (action.route) this.setRoute(action.route);
        this.toast("Módulo", `Abierto ${action.module || "dashboard"}`, "info");
        break;

      case "navigate":
        if (typeof action.url === "string" && action.url) {
          if (action.url.startsWith("/")) {
            this.setRoute(action.url);
            const moduleGuess = action.url.replace(/^\//, "").split("/")[0] || "dashboard";
            this.renderModule(moduleGuess);
            this.toast("Ruta", `Navegando a ${action.url}`, "info");
          } else {
            location.href = action.url;
          }
        }
        break;

      case "present":
        this.setScene("presentation");
        this.renderModule("presentation", "presentación");
        this.toast("Presentador", `Tema: ${action.topic || "presentación"}`, "success");
        this.speak(`Presentación activada. ${action.topic || "Modo presentador activo."}`, this.state.activeAvatar.toUpperCase());
        break;

      case "ui_notice":
        this.toast(action.title || "CONSIA", action.message || "", action.level || "info");
        break;

      case "run_demo":
        await this.runDemo(action.demo || "default");
        break;

      case "set_scene":
        this.setScene(action.scene || "default");
        this.toast("Escena", `Escena ${action.scene || "default"} aplicada`, "info");
        break;

      case "webhook_result":
        this.toast(
          action.ok ? "Webhook OK" : "Webhook Error",
          `${action.action_name || "action"} · status ${action.status ?? "-"}`,
          action.ok ? "success" : "error"
        );
        break;

      case "memory_saved":
        this.toast("Memoria", `Guardado ${action.key || ""}`, "success");
        break;

      case "memory_saved_ephemeral":
        this.toast("Memoria temporal", "Nota guardada en modo efímero", "warning");
        break;

      default:
        this.addLog("action", `Acción no manejada: ${JSON.stringify(action)}`);
    }
  }

  async runActions(actions) {
    if (!Array.isArray(actions) || !actions.length) return;
    for (const action of actions) {
      await this.runAction(action);
    }
  }

  async sendChat(message) {
    const text = String(message || "").trim();
    if (!text || this.state.sending) return;

    this.state.sending = true;
    this.ui.btnSend.disabled = true;
    this.ui.btnSendQuick.disabled = true;

    this.setStatus("api", "warn", "Chat: procesando");
    this.addLog("user", text);
    this.showBubble("TÚ", text);
    this.toast("Enviando", "Consultando a CONSIA API...", "info");

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      const res = await fetch(`${this.apiBase}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: this.state.history.slice(-12),
          language: this.ui.langSelect.value,
          mode: this.ui.modeSelect.value
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      const raw = await res.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      if (!res.ok) {
        throw new Error(data?.message || data?.details || `Chat ${res.status}`);
      }

      const answer = data.answer || "Listo.";
      const actions = Array.isArray(data.actions) ? data.actions : [];

      this.state.history.push({ role: "user", content: text });
      this.state.history.push({ role: "assistant", content: answer });
      if (this.state.history.length > 20) this.state.history = this.state.history.slice(-20);

      this.addLog("assistant", answer);
      if (actions.length) this.addLog("actions", actions);

      this.setStatus("api", "ok", "Chat: conectado");
      await this.runActions(actions);
      this.speak(answer, this.state.activeAvatar.toUpperCase());
    } catch (err) {
      const msg = err.name === "AbortError" ? "Timeout consultando CONSIA API" : (err.message || "No pude conectar con /v1/chat");
      this.addLog("error", msg);
      this.toast("Error", msg, "error");
      this.setStatus("api", "err", "Chat: error");
      this.speak(msg, "CONSIA");
    } finally {
      this.state.sending = false;
      this.ui.btnSend.disabled = false;
      this.ui.btnSendQuick.disabled = false;
    }
  }

  setupRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.setStatus("mic", "warn", "Mic: no disponible");
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = this.ui.langSelect.value === "auto" ? (navigator.language || "es-AR") : this.ui.langSelect.value;

    rec.onstart = () => {
      this.state.micActive = true;
      this.ui.btnMic.textContent = "Detener voz";
      this.setStatus("mic", "ok", "Mic: escuchando");
    };

    rec.onend = () => {
      this.state.micActive = false;
      this.ui.btnMic.textContent = "Activar voz";
      this.setStatus("mic", "warn", "Mic: off");
    };

    rec.onerror = () => {
      this.state.micActive = false;
      this.ui.btnMic.textContent = "Activar voz";
      this.setStatus("mic", "err", "Mic: error");
    };

    rec.onresult = (e) => {
      const text = e.results[e.results.length - 1][0].transcript;
      this.sendChat(text);
    };

    this.state.recognition = rec;
  }

  toggleMic() {
    if (!this.state.recognition) {
      this.setupRecognition();
      if (!this.state.recognition) return;
    }

    this.state.recognition.lang = this.ui.langSelect.value === "auto" ? (navigator.language || "es-AR") : this.ui.langSelect.value;

    if (this.state.micActive) {
      this.state.recognition.stop();
    } else {
      try { this.state.recognition.start(); } catch {}
    }
  }

  async toggleCamera() {
    if (this.state.cameraOn) {
      this.stopCamera();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      this.state.cameraStream = stream;
      this.ui.cameraPreview.srcObject = stream;
      this.ui.cameraPreview.classList.remove("hidden");
      await this.ui.cameraPreview.play().catch(() => {});
      this.state.cameraOn = true;
      this.updateTelepresenceStatus();
      this.toast("Telepresencia", "Cámara activa", "success");
      this.addLog("telepresence", "Cámara activada.");
    } catch (err) {
      this.toast("Telepresencia", "No pude activar la cámara", "error");
      this.addLog("error", err.message || "camera_error");
    }
  }

  stopCamera() {
    if (this.state.cameraStream) {
      this.state.cameraStream.getTracks().forEach(t => t.stop());
    }
    this.state.cameraStream = null;
    this.ui.cameraPreview.pause();
    this.ui.cameraPreview.srcObject = null;
    this.ui.cameraPreview.classList.add("hidden");
    this.state.cameraOn = false;
    this.state.faceDetected = false;
    this.state.handsDetected = 0;
    this.state.poseDetected = false;
    this.updateTelepresenceStatus();
  }

  async toggleGestures() {
    if (this.state.gesturesOn) {
      if (this.state.gestureController) await this.state.gestureController.stop();
      this.state.gestureController = null;
      this.state.gesturesOn = false;
      this.state.currentGesture = "none";
      this.updateTelepresenceStatus();
      this.toast("Gestos", "Gestos detenidos", "warning");
      return;
    }

    if (!this.state.cameraOn) {
      await this.toggleCamera();
      if (!this.state.cameraOn) return;
    }

    try {
      this.state.gestureController = await createGestureEngine({
        video: this.ui.cameraPreview,
        onFace: (data) => {
          this.state.faceDetected = Boolean(data.detected);
          this.state.headYaw = data.yaw || 0;
          this.state.headPitch = data.pitch || 0;
          this.state.headRoll = data.roll || 0;
          this.updateTelepresenceStatus();
        },
        onPose: (data) => {
          this.state.poseDetected = Boolean(data.detected);
          this.state.bodyLean = data.lean || 0;
          this.updateTelepresenceStatus();
        },
        onHands: (data) => {
          this.state.handsDetected = data.count || 0;
          this.updateTelepresenceStatus();
        },
        onGesture: (gesture) => this.handleGesture(gesture),
        onLog: (msg) => this.addLog("gesture", msg),
        onState: (msg) => this.addLog("telepresence", msg)
      });
      await this.state.gestureController.start();
      this.state.gesturesOn = true;
      this.updateTelepresenceStatus();
      this.toast("Gestos", "Gestos activos", "success");
    } catch (err) {
      this.toast("Gestos", "No pude activar MediaPipe", "error");
      this.addLog("error", err.message || "gesture_error");
    }
  }

  async handleGesture(gesture) {
    const now = Date.now();
    if (now - this.state.lastGestureAt < 1400) return;
    this.state.lastGestureAt = now;
    this.state.currentGesture = gesture;
    this.updateTelepresenceStatus();
    this.toast("Gesto", gesture, "info");

    switch (gesture) {
      case "open_palm":
        this.renderModule("dashboard", "dashboard");
        this.setScene("default");
        break;
      case "closed_fist":
        this.stopSpeech();
        break;
      case "pointing_up":
        await this.sendChat("Activá presenter mode para CONSIA con una demo ejecutiva de 15 segundos.");
        break;
      case "thumb_up":
        await this.sendChat("Hola CONSIA");
        break;
      case "victory":
        await this.loadAvatar(this.state.activeAvatar === "consia" ? "martin" : this.state.activeAvatar === "martin" ? "martin-futurista" : "consia");
        break;
      default:
        break;
    }
  }

  async runDemo(name = "default") {
    const demoName = String(name || "default").toLowerCase();

    if (demoName.includes("sales")) {
      await this.loadAvatar("martin-futurista");
      this.setScene("sales");
      this.renderModule("sales", "sales");
      this.toast("Demo", "Demo de ventas activada", "success");
      this.speak("Modo ventas activado. Presentación premium lista para cierre comercial.", "MARTIN FUTURE");
      return;
    }

    await this.loadAvatar("consia");
    this.renderModule("dashboard", "dashboard");
    this.setScene("default");
    this.setRoute("/");
    this.toast("Demo", "Demo CONSIA activada", "success");
    this.speak("Hola Martín. CONSIA Avatar OS está activo con acciones automáticas, módulos, telepresencia, gestos y control total del frontend.", "CONSIA");

    setTimeout(async () => {
      await this.loadAvatar("martin");
      this.renderModule("realwork", "realwork");
      this.setRoute("/realwork");
      this.speak("Modo gemelo digital activado.", "MARTIN");
    }, 2400);

    setTimeout(async () => {
      await this.loadAvatar("martin-futurista");
      this.setScene("presentation");
      this.renderModule("presentation", "presentación");
      this.setRoute("/presentation");
      this.speak("Modo futurista activado para presentaciones top nivel.", "MARTIN FUTURE");
    }, 5000);
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.apiBase}/health`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      this.setStatus("health", "ok", "Health: online");
      this.addLog("health", data);
    } catch {
      this.setStatus("health", "err", "Health: error");
    }
  }
}
