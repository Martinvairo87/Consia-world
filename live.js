const OWNER_TOKEN = "PUT_OWNER_TOKEN";
let ws;
let mediaRecorder;
let audioStream;

function connect(){
  const room = document.getElementById("room").value;

  ws = new WebSocket(
    `wss://api.consia.world/ws/${room}?token=${OWNER_TOKEN}`
  );

  ws.onopen = () => console.log("LIVE CONNECTED");

  ws.onmessage = async (evt)=>{
    const msg = JSON.parse(evt.data);

    if(msg.type === "avatar_frame"){
      renderAvatar(msg.frame);
    }

    if(msg.type === "voice_meter"){
      meter(msg.level);
    }
  };
}

function renderAvatar(frame){
  const video = document.getElementById("avatarVideo");
  video.src = frame;
}

async function startVoice(){
  audioStream = await navigator.mediaDevices.getUserMedia({audio:true});

  mediaRecorder = new MediaRecorder(audioStream,{
    mimeType:"audio/webm"
  });

  mediaRecorder.ondataavailable = e=>{
    e.data.arrayBuffer().then(buf=>{
      ws.send(JSON.stringify({
        type:"voice_chunk",
        audio:Array.from(new Uint8Array(buf))
      }));
    });
  };

  mediaRecorder.start(200);
}

function meter(level){
  document.getElementById("audioMeter").style.width =
    (level*100)+"%";
}

function record(){
  fetch(
    "https://api.consia.world/recording/live",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+OWNER_TOKEN
      },
      body:JSON.stringify({
        event:"start",
        ts:Date.now()
      })
    }
  );
}
