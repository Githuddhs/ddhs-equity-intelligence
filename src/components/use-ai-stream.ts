import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAiStream() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ctrl = useRef<AbortController | null>(null);

  const run = async (body: unknown, onText: (full: string) => void): Promise<string> => {
    setError(""); setLoading(true);
    const ac = new AbortController();
    ctrl.current = ac;
    let full = "";
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/ee-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify(body), signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Something went wrong.");
        return "";
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        onText(full);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Could not reach the AI service.");
    } finally { setLoading(false); }
    return full;
  };
  return { run, loading, error, stop: () => ctrl.current?.abort() };
}
