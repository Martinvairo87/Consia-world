export async function onRequest() {
  // demo: cambiar a PREMIUM cuando quieras (hardcode). En producción: lookup real.
  return new Response(JSON.stringify({plan:"FREE",softlock:true,ts:Date.now()}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
