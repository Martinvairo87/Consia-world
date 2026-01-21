export async function onRequest({request}) {
  const body = await request.json().catch(()=>({}));
  const word = String(body.word||'consia').slice(0,32);
  return new Response(JSON.stringify({ok:true,wake:word}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
