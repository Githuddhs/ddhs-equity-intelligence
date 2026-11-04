import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sessionClient } from "@/lib/workspace-client";
import { inviteClientTeamMember, setClientTeamAccess } from "@/lib/client-management.functions";
import { OpenClientWorkspace } from "./client-workspace";

export function ClientTeam({ clientId }: { clientId: string }) {
  const invite = useServerFn(inviteClientTeamMember);
  const change = useServerFn(setClientTeamAccess);
  const qc = useQueryClient();
  const [fullName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const key = ["client-team", clientId];
  const { data, error } = useQuery({ queryKey: key, queryFn: async () => {
    const [members, access] = await Promise.all([
      sessionClient.from("client_team_members").select("id,full_name,email,active,created_at").eq("client_id", clientId).order("created_at"),
      sessionClient.rpc("can_manage_client", { p_client: clientId, p_sensitive: false }),
    ]);
    if (members.error || access.error) throw members.error || access.error;
    return { members: members.data ?? [], allowed: access.data === true };
  } });
  const input = "w-full rounded-md border border-input bg-background px-3 py-2";
  return <section className="mt-8 border-t border-border pt-6">
    <h2 className="section-title text-primary">Client users</h2>
    {error && <p className="mt-3 text-destructive">Could not load client users.</p>}
    {data && !data.allowed && <p className="mt-2 text-muted-foreground">Activate the client’s platform subscription before adding users.</p>}
    <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={async (event) => {
      event.preventDefault(); setBusy(true);
      try { await invite({ data: { clientId, fullName, email } }); setName(""); setEmail(""); await qc.invalidateQueries({ queryKey: key }); toast.success("User added to the client account."); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Could not add user."); }
      finally { setBusy(false); }
    }}>
      <label className="text-sm">Full name<input aria-label="Team member name" className={`${input} mt-1`} required minLength={2} maxLength={120} value={fullName} onChange={(e) => setName(e.target.value)} /></label>
      <label className="text-sm">Work email<input aria-label="Team member email" className={`${input} mt-1`} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <Button className="self-end" disabled={busy || !data?.allowed}><UserPlus />{busy ? "Adding…" : "Add user"}</Button>
    </form>
    <ul className="mt-5 divide-y divide-border">
      {data?.members.map((member) => <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={member.id}>
        <div><p className="font-semibold">{member.full_name}</p><p className="break-all text-sm text-muted-foreground">{member.email} · {member.active ? "Access enabled" : "Access revoked"}</p></div>
        <Button variant="outline" disabled={busy || (!member.active && !data.allowed)} onClick={async () => {
          setBusy(true); try { await change({ data: { id: member.id, active: !member.active } }); await qc.invalidateQueries({ queryKey: key }); toast.success("User access updated."); }
          catch (e) { toast.error(e instanceof Error ? e.message : "Could not update access."); } finally { setBusy(false); }
        }}>{member.active ? "Revoke access" : "Restore access"}</Button>
      </li>)}
    </ul>
  </section>;
}

export function MyClientWorkspaces() {
  const { data } = useQuery({ queryKey: ["my-client-workspaces"], queryFn: async () => {
    const { data: auth } = await sessionClient.auth.getUser();
    if (!auth.user) return [];
    const { data: members, error } = await sessionClient.from("client_team_members").select("id,client_id").eq("user_id", auth.user.id).eq("active", true);
    if (error) throw error;
    return members ?? [];
  } });
  if (!data?.length) return null;
  return <section className="mt-6 border-y border-border py-5"><h2 className="section-title text-primary">Your client workspaces</h2><div className="mt-3 flex flex-wrap gap-3">{data.map((member) => <OpenClientWorkspace key={member.id} id={member.client_id} />)}</div></section>;
}