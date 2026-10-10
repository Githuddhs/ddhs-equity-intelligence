import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const STAFF_PATHS = ["/staff", "/clients"];

export function AppHeader() {
  const { data: isAdmin, isFetched } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return !!data;
    },
  });
  const { data: isManager } = useQuery({
    queryKey: ["is-manager"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "manager" as "admin" });
      return !!data;
    },
  });
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onStaffPage = STAFF_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  // Staff accounts stay staff-only; clients can't reach staff pages.
  useEffect(() => {
    if (!isFetched) return;
    if (isAdmin && !onStaffPage) navigate({ to: "/staff", replace: true });
    if (!isAdmin && onStaffPage) navigate({ to: "/portal", replace: true });
  }, [isFetched, isAdmin, onStaffPage, navigate]);
  const signOut = async () => { await supabase.auth.signOut(); window.location.href = isAdmin ? "/staff-login" : "/"; };
  const link = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary";
  const active = { className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-muted" };
  return (
    <header className={`border-b border-border print:hidden ${isAdmin ? "bg-secondary" : ""}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link to={isAdmin ? "/staff" : "/"} className="font-display text-lg font-bold text-primary">
          DDHS <span className="text-teal">Equity Intelligence</span>
          {isAdmin && <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">Staff portal</span>}
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {isAdmin ? (
            <>
              <Link to="/staff" className={link} activeProps={active}>Dashboard</Link>
              <Link to="/clients" className={link} activeProps={active}>Clients, invites &amp; deadlines</Link>
            </>
          ) : (
            <>
              <Link to="/portal" className={link} activeProps={active}>My portal</Link>
              <Link to="/dashboard" className={link} activeProps={active}>Dashboard</Link>
              <Link to="/workforce" className={link} activeProps={active}>Workforce Data</Link>
              <Link to="/barrier-analysis" className={link} activeProps={active}>Barriers</Link>
              <Link to="/compliance" className={link} activeProps={active}>Compliance</Link>
              <Link to="/dg-history" className={link} activeProps={active}>DG History</Link>
              {isManager && <Link to="/manager" className={link} activeProps={active}>Review portal</Link>}
            </>
          )}
          <button onClick={signOut} className="ml-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">Sign out</button>
        </nav>
      </div>
    </header>
  );
}
