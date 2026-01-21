export async function onRequest() {
  // demo: registra consentimiento como evento (sin contenido)
  return new Response(JSON.stringify({consent:"RECORDED",ts:Date.now()}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
