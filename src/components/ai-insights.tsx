import { useRef, useState } from "react";

export type InsightsPayload = {
  sector: string;
  level: string;
  total: number;
  groups: { name: string; headcount: number; sharePct: number; eapPct: number; gapPct: number }[];
  sectoral: { name: string; target: number; actual: number }[];
};

export function renderMd(text: string) {
  return text.split("\n").map((line, i) => {
    const bold = (s: string) => s.split(/\*\*(.+?)\*\*/g).map((p, j) => (j % 2 ? <strong key={j}>{p}</strong> : p));
    if (line.startsWith("## ") || line.startsWith("### "))
      return <h3 key={i} className="card-title mt-4 text-primary">{line.replace(/^#+\s/, "")}</h3>;
    if (/^\s*(\d+\.|[-*])\s/.test(line))
      return <p key={i} className="ml-4 mt-1 text-sm leading-relaxed">{bold(line.trim())}</p>;
    if (!line.trim()) return null;
    return <p key={i} className="mt-2 text-sm leading-relaxed">{bold(line)}</p>;
  });
}

export function AiInsights({ payload, onComplete }: { payload: InsightsPayload; onComplete?: (text: string) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  const run = async () => {
    setText(""); setError(""); setLoading(true);
    const ac = new AbortController();
    ctrl.current = ac;
    try {
      const res = await fetch("/api/eea-insights", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Something went wrong."); return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setText(full);
      }
      if (full) onComplete?.(full);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Could not reach the AI service.");
    } finally { setLoading(false); }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title text-primary">AI gap explanation & action plan</h2>
          <p className="text-sm text-muted-foreground">Explains the target gaps above and suggests prioritised actions.</p>
        </div>
        {loading ? (
          <button onClick={() => ctrl.current?.abort()} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Stop</button>
        ) : (
          <button onClick={run} disabled={payload.total <= 0} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {text ? "Regenerate" : "Generate AI summary"}
          </button>
        )}
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {loading && !text && <p className="mt-4 text-sm text-muted-foreground">Analysing your workforce figures…</p>}
      {text && <div className="mt-2">{renderMd(text)}</div>}
      {text && !loading && <p className="mt-4 text-xs text-muted-foreground">AI-generated guidance — verify against the Act and your EE consultation process. Not legal advice.</p>}
    </section>
  );
}
