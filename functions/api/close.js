export async function onRequest() {
  return new Response(JSON.stringify({room:"CLOSED",ts:Date.now()}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
