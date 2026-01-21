export async function onRequest({ request }) {
  const url = new URL(request.url);
  const mode = (url.searchParams.get("set") || "A").toUpperCase();

  if (!["A", "B", "C"].includes(mode)) {
    return new Response(JSON.stringify({ ok: false, error: "INVALID_MODE" }), {
      headers: { "content-type": "application/json; charset=utf-8" },
      status: 400,
    });
  }

  return new Response(JSON.stringify({ ok: true, mode, ts: Date.now() }), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status: 200,
  });
}
