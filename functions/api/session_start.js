export async function onRequest() {
  return new Response(JSON.stringify({session:"STARTED",ts:Date.now()}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
