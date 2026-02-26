const API_WS = "wss://api.consia.world/ws";

export async function connectVoiceSocket(room, onMessage, onOpen, onClose){
  return new Promise((resolve, reject)=>{
    const ws = new WebSocket(`${API_WS}/${encodeURIComponent(room)}`);
    ws.binaryType = "arraybuffer";

    ws.onopen = ()=>{ onOpen?.(); resolve(ws); };
    ws.onclose = ()=>{ onClose?.(); };
    ws.onerror = (e)=>{ reject(new Error("WS failed")); };

    ws.onmessage = (ev)=>{
      try{
        const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        onMessage?.(data);
      }catch{
        onMessage?.({ type:"raw", data: ev.data });
      }
    };
  });
}

let recorder = null;

export async function startVoiceStream(ws, mediaStream){
  if(!ws || ws.readyState !== 1) throw new Error("WS not ready");
  if(!mediaStream) throw new Error("No media stream");

  // MediaRecorder: manda blobs (audio/webm) cada 250ms
  recorder = new MediaRecorder(mediaStream, { mimeType: "audio/webm" });

  recorder.ondataavailable = async (e)=>{
    if(e.data && e.data.size > 0 && ws.readyState === 1){
      const buf = await e.data.arrayBuffer();
      // protocolo MVP: enviamos binario directo
      ws.send(buf);
    }
  };

  // señal inicio
  ws.send(JSON.stringify({ type:"audio_start", codec:"audio/webm" }));
  recorder.start(250);
}

export async function stopVoiceStream(ws){
  if(recorder){
    recorder.stop();
    recorder = null;
  }
  if(ws && ws.readyState === 1){
    ws.send(JSON.stringify({ type:"audio_end" }));
  }
}
