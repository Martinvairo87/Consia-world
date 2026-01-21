export async function onRequest() {
  return new Response(JSON.stringify({consia:"ACTIVE",mode:"CORE",ts:Date.now()}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
