const VISION_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const WASM_URL = `${VISION_URL}/wasm`;
const MODELS = {
  face: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  gesture: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
  pose: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
};

export async function createGestureEngine({
  video,
  onFace = () => {},
  onPose = () => {},
  onHands = () => {},
  onGesture = () => {},
  onLog = () => {},
  onState = () => {}
} = {}) {
  if (!video) throw new Error("video_required");

  const vision = await import(VISION_URL);
  const { FilesetResolver, FaceLandmarker, GestureRecognizer, PoseLandmarker } = vision;
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);

  const faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODELS.face },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false
  });

  const gestureRecognizer = await GestureRecognizer.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODELS.gesture },
    runningMode: "VIDEO",
    numHands: 2
  });

  const poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODELS.pose },
    runningMode: "VIDEO",
    numPoses: 1
  });

  let raf = 0;
  let running = false;
  let lastGestureName = "none";
  let lastGestureTime = 0;

  const controller = {
    async start() {
      if (running) return;
      running = true;
      onState("MediaPipe listo.");
      loop();
    },
    async stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      onState("MediaPipe detenido.");
    }
  };

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2) return;

    const ts = performance.now();

    try {
      const faceResult = faceLandmarker.detectForVideo(video, ts);
      processFace(faceResult);
    } catch (e) {
      onLog(`face_error:${e.message || e}`);
    }

    try {
      const poseResult = poseLandmarker.detectForVideo(video, ts);
      processPose(poseResult);
    } catch (e) {
      onLog(`pose_error:${e.message || e}`);
    }

    try {
      const gestureResult = gestureRecognizer.recognizeForVideo(video, ts);
      processHands(gestureResult);
    } catch (e) {
      onLog(`gesture_error:${e.message || e}`);
    }
  }

  function processFace(result) {
    if (!result || !result.faceLandmarks || !result.faceLandmarks.length) {
      onFace({ detected: false, yaw: 0, pitch: 0, roll: 0 });
      return;
    }

    const lm = result.faceLandmarks[0];
    const nose = lm[1];
    const leftEyeOuter = lm[33];
    const rightEyeOuter = lm[263];
    const leftCheek = lm[234];
    const rightCheek = lm[454];
    const forehead = lm[10];
    const chin = lm[152];

    const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
    const yaw = clamp((eyeMidX - nose.x) * 4.2, -1, 1);
    const pitch = clamp((eyeMidY - nose.y) * 4.0, -1, 1);
    const roll = clamp(Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x), -1, 1);

    const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
    const faceHeight = Math.abs(chin.y - forehead.y);

    onFace({
      detected: true,
      yaw,
      pitch,
      roll,
      faceWidth,
      faceHeight
    });
  }

  function processPose(result) {
    if (!result || !result.landmarks || !result.landmarks.length) {
      onPose({ detected: false, lean: 0 });
      return;
    }

    const lm = result.landmarks[0];
    const leftShoulder = lm[11];
    const rightShoulder = lm[12];
    const leftHip = lm[23];
    const rightHip = lm[24];

    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const lean = clamp((shoulderMidX - hipMidX) * 4, -1, 1);

    onPose({ detected: true, lean });
  }

  function processHands(result) {
    const count = Array.isArray(result?.landmarks) ? result.landmarks.length : 0;
    onHands({ count });

    const gesture = result?.gestures?.[0]?.[0]?.categoryName || "none";
    const normalized = normalizeGesture(gesture);
    if (!normalized) return;

    const now = Date.now();
    if (normalized !== lastGestureName || now - lastGestureTime > 1600) {
      lastGestureName = normalized;
      lastGestureTime = now;
      onGesture(normalized);
    }
  }

  return controller;
}

function normalizeGesture(name) {
  const v = String(name || "").toLowerCase();
  if (!v || v === "none") return "none";
  if (v.includes("open_palm")) return "open_palm";
  if (v.includes("closed_fist")) return "closed_fist";
  if (v.includes("pointing_up")) return "pointing_up";
  if (v.includes("thumb_up")) return "thumb_up";
  if (v.includes("victory")) return "victory";
  return "none";
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
