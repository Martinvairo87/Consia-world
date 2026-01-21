export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  // Info simple (no expone secretos)
  const payload = {
    ok: true,
    app: "CONSIA",
    api: "ready",
    version: "v1.0",
    ts: Date.now(),
    origin: url.origin,
    // flags de entorno (solo true/false)
    hasHmac: !!env?.HMAC_SECRET,
  };

  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status: 200,
  });
}
