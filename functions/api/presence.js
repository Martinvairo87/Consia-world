export async function onRequest() {
  return new Response(JSON.stringify({ presence: "OK", ts: Date.now() }), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status: 200,
  });
}
