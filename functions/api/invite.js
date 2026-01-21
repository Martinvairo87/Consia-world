export async function onRequest({request}) {
  // demo: devuelve una invitación efímera
  const ttl = 300; // segundos
  return new Response(JSON.stringify({invite:"SENT",ttl,ts:Date.now()}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
