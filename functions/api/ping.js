export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, pong: true, ts: Date.now() }), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status: 200,
  });
}
