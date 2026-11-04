import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sessionClient } from "@/lib/workspace-client";
import { changeClientHandover } from "@/lib/client-management.functions";

export function ClientHandover({ clientId }: { clientId?: string }) {
  const change = useServerFn(changeClientHandover);
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const key = ["client-handover", clientId ?? "self"];
  const { data, error } = useQuery({ queryKey: key, queryFn: async () => {
    const { data: auth } = await sessionClient.auth.getUser();
    if (!auth.user) throw new Error("Sign in required.");
    const result = await sessionClient.from("client_handovers").select("*").eq("client_id", clientId ?? auth.user.id).maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  } });
  const act = async (action: "request" | "accept" | "support", allow?: boolean) => {
    if (action === "accept" && !confirm("Accept responsibility for this client account? DDHS delegated workspace access and sensitive-record permission will end; your records and team users remain unchanged.")) return;
    setBusy(true);
    try {
      await change({ data: { action, clientId, notes, allow } });
      await qc.invalidateQueries({ queryKey: key });
      await qc.invalidateQueries({ queryKey: ["my-staff-consent"] });
      toast.success(action === "request" ? "Handover ready for client acceptance in My account." : action === "accept" ? "Client administration accepted." : "DDHS support permission updated.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update handover."); }
    finally { setBusy(false); }
  };
  if (!clientId && !data && !error) return null;
  return <section className="mt-6 border-t border-border pt-6">
    <h2 className="section-title flex items-center gap-2 text-primary"><ArrowRightLeft />Client administration handover</h2>
    {error ? <p className="mt-3 text-destructive">Could not load handover.</p> : <>
      <p className="mt-2 text-muted-foreground">{data?.accepted_at ? `Accepted on ${new Date(data.accepted_at).toLocaleDateString("en-ZA")}. The client manages their account; saved records and team access remain in place.` : data ? "Setup is ready. The client account owner can review and accept administration in My account." : "Prepare the subscribed client account for its owner to take over administration."}</p>
      {data?.notes && <p className="mt-3 whitespace-pre-wrap text-sm">{data.notes}</p>}
      {clientId && !data?.accepted_at && <><label className="mt-4 block text-sm">Handover notes<textarea className="mt-1 w-full rounded-md border border-input bg-background p-3" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label><Button className="mt-3" disabled={busy} onClick={() => void act("request")}>{data ? "Update handover" : "Ready for client handover"}</Button></>}
      {!clientId && data && !data.accepted_at && <Button className="mt-4" disabled={busy} onClick={() => void act("accept")}>Accept client administration</Button>}
      {data?.accepted_at && <p className="mt-3 text-sm text-muted-foreground">DDHS delegated workspace access: {data.staff_support_enabled ? "Authorised by client" : "Ended"}. Sensitive employee access needs separate permission.</p>}
      {!clientId && data?.accepted_at && <Button className="mt-3" variant="outline" disabled={busy} onClick={() => void act("support", !data.staff_support_enabled)}>{data.staff_support_enabled ? "End DDHS support access" : "Authorise DDHS support access"}</Button>}
    </>}
  </section>;
}