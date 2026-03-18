export interface Env {
  OWNER_KEY: string;
  OPENAI_API_KEY?: string;
  AVATAR_VIDEO_URL?: string;
  MEMORY?: KVNamespace;
  PROJECTS?: KVNamespace;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-owner-key",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

function unauthorized() {
  return json({ ok: false, error: "unauthorized" }, 401);
}

function isAuthorized(req: Request, env: Env) {
  const key = req.headers.get("x-owner-key") || "";
  return !!env.OWNER_KEY && key === env.OWNER_KEY;
}

async function getRequestMessage(req: Request) {
  try {
    const body = await req.json<any>();
    return String(body?.message || body?.input || "").trim();
  } catch {
    return "";
  }
}

async function streamFallback(message: string) {
  const encoder = new TextEncoder();
  const reply = `CONSIA activo. Recibí: ${message || "consulta vacía"}.`;

  const stream = new ReadableStream({
    async start(controller) {
      const chunks = reply.match(/.{1,20}/g) || [reply];
      for (const chunk of chunks) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`)
        );
        await new Promise((r) => setTimeout(r, 80));
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ done: true, text: reply })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      ...corsHeaders,
    },
  });
}

async function streamOpenAI(message: string, env: Env) {
  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Sos CONSIA. Respondé en español, claro, ejecutivo y breve.",
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: message || "Hola" }],
        },
      ],
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return streamFallback(message);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      ...corsHeaders,
    },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        ok: true,
        system: "CONSIA",
        status: "ONLINE",
        time: new Date().toISOString(),
      });
    }

    if (url.pathname === "/v1/status") {
      return json({
        ok: true,
        system: "CONSIA",
        version: "full-stack-final",
        routes: [
          "/health",
          "/v1/status",
          "/v1/realtime",
          "/v1/avatar",
          "/v1/dashboard",
        ],
      });
    }

    if (url.pathname === "/v1/avatar") {
      return json({
        ok: true,
        video: env.AVATAR_VIDEO_URL || "",
      });
    }

    if (url.pathname === "/v1/dashboard") {
      if (!isAuthorized(req, env)) return unauthorized();

      const memoryCount = env.MEMORY
        ? Number((await env.MEMORY.get("stats:memory_count")) || 0)
        : 0;

      const projectCount = env.PROJECTS
        ? Number((await env.PROJECTS.get("stats:project_count")) || 0)
        : 0;

      return json({
        ok: true,
        realwork: { ingresos: 120000, operaciones: 12 },
        manglar: { proyectos: 4, unidades: 120 },
        vipwork: { empleados: 35, clientes: 18 },
        consia: {
          usuarios: 1200,
          memory_items: memoryCount,
          projects: projectCount,
        },
      });
    }

    if (url.pathname === "/v1/realtime" && req.method === "POST") {
      if (!isAuthorized(req, env)) return unauthorized();
      const message = await getRequestMessage(req);

      if (env.OPENAI_API_KEY) {
        return streamOpenAI(message, env);
      }

      return streamFallback(message);
    }

    return json(
      { ok: false, error: "route_not_found", path: url.pathname },
      404
    );
  },
};
