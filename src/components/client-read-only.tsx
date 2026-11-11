import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { supabase } from "@/lib/workspace-client";

/** Pages whose records only DDHS staff capture (enforced in the database). Recruitment Suite pages are deliberately excluded. */
const STAFF_ONLY = [/^\/workforce$/, /^\/eea12$/, /^\/plans(\/|$)/, /^\/dg-review$/, /^\/doel-submissions$/, /^\/eea13$/, /^\/eea13-planning$/, /^\/compliance$/, /^\/evidence$/, /^\/workforce-foundation$/, /^\/plan-lifecycle$/];
/** Button labels that capture, edit or delete records. */
const CAPTURE = /^\s*(save|edit|delete|remove|add|new|create|submit|import|assemble|sign[ -]off|record|update|run|upload)\b|\b(save|delete)\b/i;

export function isStaffOnlyPage(path: string) { return STAFF_ONLY.some((r) => r.test(path)); }

export function useClientReadOnly() {
  const path = useLocation({ select: (l) => l.pathname });
  const applies = isStaffOnlyPage(path);
  const { data } = useQuery({ queryKey: ["is-staff"], enabled: applies, staleTime: 300_000, queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return true; // signed-out visitors on public pages are not client users
    const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    return data === true;
  } });
  return applies && data === false;
}

/** Hides capture controls on staff-only pages for client users; the database refuses client writes regardless. */
export function ClientReadOnly() {
  const readOnly = useClientReadOnly();
  useEffect(() => {
    if (!readOnly) return;
    const hide = () => document.querySelectorAll<HTMLElement>("main button, main input[type=submit], main [role=button]").forEach((el) => {
      if (el.closest("[data-allow-client]") || el.dataset["ro"] === "1") return;
      const label = (el.getAttribute("aria-label") || el.textContent || "").trim();
      if (CAPTURE.test(label)) { el.dataset["ro"] = "1"; el.style.display = "none"; }
    });
    hide();
    const obs = new MutationObserver(hide);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [readOnly]);
  if (!readOnly) return null;
  return <div data-allow-client className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8 print:hidden">
    <div role="note" className="flex flex-wrap items-start gap-3 rounded-xl border border-teal bg-card p-4 shadow-sm">
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-primary">View only — DDHS staff capture these records</p>
        <p className="text-sm text-muted-foreground">For audit purposes, all workforce and compliance records are captured by DDHS staff. You can view and download everything here. To add or change information, send your files to DDHS.</p>
      </div>
      <Link to="/workforce" hash="send-to-ddhs" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Send workforce files to DDHS</Link>
    </div>
  </div>;
}
