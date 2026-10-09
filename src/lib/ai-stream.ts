// Server-side helper: streams a Lovable AI Gateway Responses call as plain text.
export async function streamResponses(instructions: string, input: string, signal: AbortSignal): Promise<Response> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return Response.json({ error: "AI is not configured." }, { status: 500 });
  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions,
      input: [{ role: "user", content: input }],
      reasoning: { effort: "low" },
      store: false,
      stream: true,
    }),
  });
  if (!upstream.ok || !upstream.body) {
    const s = upstream.status;
    const msg = s === 429 ? "Too many requests — please try again in a minute."
      : s === 402 ? "AI credits are exhausted for this workspace."
      : s === 403 ? "AI access is blocked for this workspace."
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
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const frame = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data:")) continue;
            try {
              const ev = JSON.parse(line.slice(5).trim());
              if (ev.type === "response.output_text.delta") out += ev.delta;
              if (ev.type === "response.failed" || ev.type === "error") out += "\n\n[The AI response failed.]";
            } catch { /* partial or non-JSON frame */ }
          }
        }
        if (out) { controller.enqueue(enc.encode(out)); return; }
      }
    },
    cancel() { reader.cancel(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}
