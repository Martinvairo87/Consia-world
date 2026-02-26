export async function onRequest(context) {
  const { request, params } = context;

  const splat = Array.isArray(params.splat)
    ? params.splat.join("/")
    : (params.splat || "");

  const incomingUrl = new URL(request.url);

  // Target API
  const targetUrl = new URL(`https://api.consia.world/${splat}`);
  targetUrl.search = incomingUrl.search;

  // Clone headers
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  // OPTIONS (CORS preflight)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers":
          "content-type, authorization, x-owner-token, x-consia-device, x-consia-session",
        "access-control-max-age": "86400",
      },
    });
  }

  // Forward request
  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
  });

  // Return response
  const outHeaders = new Headers(response.headers);
  outHeaders.set("access-control-allow-origin", "*");

  return new Response(response.body, {
    status: response.status,
    headers: outHeaders,
  });
}
