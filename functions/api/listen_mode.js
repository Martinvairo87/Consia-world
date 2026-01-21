export async function onRequest({request}) {
  const body = await request.json().catch(()=>({}));
  const state = (body.state==='motivador')?'motivador':'sereno';
  return new Response(JSON.stringify({ok:true,state}),{
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
}
