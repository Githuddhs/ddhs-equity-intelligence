// Server-side helper: streams a Lovable AI Gateway Gemini chat call as plain text.
export const AI_MODEL = "google/gemini-3.8-flash";

// Logs one AI call for the admin usage dashboard. Never throws.
export async function logAiUsage(feature: string, userId: string | null): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_usage").insert({ user_id: userId, feature, model: AI_MODEL });
  } catch { /* logging must never break the AI call */ }
}

export async function streamResponses(instructions: string, input: string, signal: AbortSignal): Promise<Response> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return Response.json({ error: "AI is not configured." }, { status: 500 });
  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: input },
      ],
      stream: true,
    }),
  });
  if (!upstream.ok || !upstream.body) {
    const s = upstream.status;
    const j = await upstream.json().catch(() => ({} as { message?: string; error?: { message?: string } }));
    const safe = (j as { message?: string }).message ?? (j as { error?: { message?: string } }).error?.message;
    const msg = s === 429 ? "Too many requests — please try again in a minute."
      : s === 402 ? (safe ?? "AI credits are exhausted for this workspace.")
      : s === 403 ? (safe ?? "AI access is blocked for this workspace.")
      : "The AI service could not complete the request.";
    return Response.json({ error: msg }, { status: s >= 400 ? s : 502 });
  }
  const reader = upstream.body.getReader();
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }
        buf += dec.decode(value, { stream: true });
        let out = "";
        let idx;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const ev = JSON.parse(data);
            const d = ev.choices?.[0]?.delta?.content;
            if (typeof d === "string") out += d;
            if (ev.error) out += "\n\n[The AI response failed.]";
          } catch { /* partial frame */ }
        }
        if (out) { controller.enqueue(enc.encode(out)); return; }
      }
    },
    cancel() { reader.cancel(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}
