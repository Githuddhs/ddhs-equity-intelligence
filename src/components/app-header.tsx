import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return !!data;
    },
  });
  const link = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary";
  const active = { className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-muted" };
  return (
    <header className="border-b border-border print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link to="/" className="font-display text-lg font-bold text-primary">DDHS <span className="text-teal">Equity Intelligence</span></Link>
        <nav className="flex flex-wrap items-center gap-1">
          <Link to="/portal" className={link} activeProps={active}>My portal</Link>
          <Link to="/compliance" className={link} activeProps={active}>Compliance</Link>
          <Link to="/eea12" className={link} activeProps={active}>EEA12 Analysis</Link>
          <Link to="/history" className={link} activeProps={active}>History</Link>
          <Link to="/plans" className={link} activeProps={active}>EE Plans</Link>
          <Link to="/dg-review" className={link} activeProps={active}>DG Review</Link>
          <Link to="/dg-history" className={link} activeProps={active}>DG History</Link>
          {isAdmin && <Link to="/staff" className={link} activeProps={active}>Staff dashboard</Link>}
          {isAdmin && <Link to="/clients" className={link} activeProps={active}>Clients</Link>}
          <button onClick={signOut} className="ml-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">Sign out</button>
        </nav>
      </div>
    </header>
  );
}
