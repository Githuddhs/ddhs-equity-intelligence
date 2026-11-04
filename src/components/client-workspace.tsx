import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Building2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientWorkspace, setClientWorkspace } from "@/lib/client-workspace-state";
import { openClientWorkspace, setSensitivePermission } from "@/lib/client-management.functions";
import { sessionClient } from "@/lib/workspace-client";

export function OpenClientWorkspace({ id }: { id: string }) {
  const open = useServerFn(openClientWorkspace);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return <Button disabled={busy} onClick={async () => {
    setBusy(true);
    try {
      const workspace = await open({ data: { id } });
      await qc.cancelQueries(); qc.clear();
      localStorage.removeItem("ddhs-unit-filter");
      setClientWorkspace(workspace);
      await navigate({ to: "/portal" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not open this client."); }
    finally { setBusy(false); }
  }}><Building2 />{busy ? "Opening…" : "Open client workspace"}</Button>;
}

export function ClientWorkspaceBanner() {
  const [workspace, setWorkspace] = useState(getClientWorkspace);
  const qc = useQueryClient();
  useEffect(() => {
    const sync = () => setWorkspace(getClientWorkspace());
    window.addEventListener("ddhs-client-workspace", sync);
    return () => window.removeEventListener("ddhs-client-workspace", sync);
  }, []);
  if (!workspace) return null;
  return <aside className="border-b border-teal bg-accent print:hidden">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
      <div><p className="font-semibold text-primary">{workspace.demo ? "DEMONSTRATION — " : "Managing "}{workspace.profile["company"] || workspace.email}</p>
        <p className="text-sm text-muted-foreground">{workspace.demo ? "Fictional records only · separate from real clients" : `${workspace.staff ? "DDHS staff" : "Client team"} · ${workspace.sensitiveAccess ? "Client permission granted for employee records" : "Salary, disability and private files require client permission"}`}</p></div>
      <Button variant="outline" asChild><Link to="/clients" onClick={async (event) => {
        event.preventDefault(); await qc.cancelQueries(); qc.clear(); setClientWorkspace(null);
        localStorage.removeItem("ddhs-unit-filter"); window.location.assign(workspace.staff ? "/clients" : "/portal");
      }}><LogOut />End client session</Link></Button>
    </div>
  </aside>;
}

/** Revalidate the saved workspace ID before any page queries run after a refresh. */
export function ClientWorkspaceRestore({ children }: { children: ReactNode }) {
  const open = useServerFn(openClientWorkspace);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const id = sessionStorage.getItem("ddhs-workspace-id");
    if (!id) { setReady(true); return; }
    void open({ data: { id } }).then((value) => { if (!cancelled) setClientWorkspace(value); }).catch(() => {
      if (!cancelled) { setClientWorkspace(null); toast.error("Client workspace access has ended."); }
    }).finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [open]);
  return ready ? children : <p className="p-6 text-muted-foreground">Opening your workspace…</p>;
}

export function StaffDemoCompany() {
  const { data, error } = useQuery({ queryKey: ["staff-demo-companies"], queryFn: async () => {
    const { data, error } = await sessionClient.from("staff_demo_companies").select("id,company");
    if (error) throw error;
    return data ?? [];
  } });
  return <section className="mt-8 border-y border-border py-5">
    <h2 className="section-title text-primary">Demonstration company</h2>
    <p className="mt-2 text-sm text-muted-foreground">Fictional company records for client engagements. Changes remain in the demonstration workspace.</p>
    {error && <p className="mt-3 text-destructive">Could not load demonstration company.</p>}
    <div className="mt-4 flex flex-wrap items-center gap-3">{data?.map((company) => <div key={company.id}><p className="mb-2 font-semibold">{company.company}</p><OpenClientWorkspace id={company.id} /></div>)}</div>
  </section>;
}

export function SensitiveClientPermission() {
  const update = useServerFn(setSensitivePermission);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data, error } = useQuery({ queryKey: ["my-staff-consent"], queryFn: async () => {
    const { data: user } = await sessionClient.auth.getUser();
    if (!user.user) throw new Error("Sign in required.");
    const result = await sessionClient.from("client_staff_permissions").select("sensitive_access").eq("user_id", user.user.id).maybeSingle();
    if (result.error) throw result.error;
    return result.data?.sensitive_access ?? false;
  } });
  return <section className="mt-6 border-t border-border pt-6">
    <h2 className="section-title flex items-center gap-2 text-primary"><ShieldCheck />DDHS staff permission</h2>
    <p className="mt-2 text-sm text-muted-foreground">Allow DDHS staff to access and maintain individual Employee Profiles, salary, disability information and private files while your platform subscription is active. You can revoke permission at any time.</p>
    {error ? <p className="mt-3 text-destructive">Could not load your permission.</p> : <Button className="mt-3" variant={data ? "outline" : "default"} disabled={busy || data === undefined} onClick={async () => {
      if (!data && !confirm("Allow DDHS staff access to your individual salary, disability and private employee records?")) return;
      setBusy(true);
      try { await update({ data: { allow: !data } }); await qc.invalidateQueries({ queryKey: ["my-staff-consent"] }); toast.success(data ? "Staff permission revoked." : "Staff permission granted."); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Could not save permission."); }
      finally { setBusy(false); }
    }}>{data ? "Revoke sensitive-record access" : "Grant sensitive-record access"}</Button>}
  </section>;
}