const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers":
    "content-type, authorization, x-consia-device, x-consia-session, x-owner-token",
  "cache-control": "no-store",
};

function withCors(resp) {
  const h = new Headers(resp.headers);
  for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: h,
  });
}

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const pathTail = Array.isArray(params.path)
    ? params.path.join("/")
    : (params.path || "");

  const targetUrl = new URL(`https://api.consia.world/${pathTail}`);
  const srcUrl = new URL(request.url);
  targetUrl.search = srcUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  // Si llamás /api/owner/* desde consia.world, el proxy inyecta el OWNER_TOKEN
  if (targetUrl.pathname.startsWith("/owner/") && !headers.get("x-owner-token") && env.OWNER_TOKEN) {
    headers.set("x-owner-token", env.OWNER_TOKEN);
  }

  let body = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body,
  });

  return withCors(upstream);
}
