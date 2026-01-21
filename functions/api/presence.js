export async function onRequest() {
  return new Response(JSON.stringify({presence:"OK",ts:Date.now()}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
