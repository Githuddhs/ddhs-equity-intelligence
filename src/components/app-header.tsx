import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageExport } from "@/components/page-export";
import { InstallApp } from "@/components/install-app";
import { BrandMark } from "@/components/brand-mark";

const STAFF_PATHS = ["/staff", "/clients", "/review"];

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
  // Clients can't reach staff pages; staff may browse client pages directly.
  useEffect(() => {
    if (!isFetched) return;
    if (!isAdmin && onStaffPage) navigate({ to: "/portal", replace: true });
  }, [isFetched, isAdmin, onStaffPage, navigate]);
  const signOut = async () => { await supabase.auth.signOut(); window.location.href = isAdmin ? "/staff-login" : "/"; };
  const link = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary";
  const active = { className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-muted" };
  return (
    <>
    <PageExport />
    <header className={`border-b border-border print:hidden ${isAdmin ? "bg-secondary" : ""}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <BrandMark to={isAdmin ? "/staff" : "/"}>
          {isAdmin && <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">Staff portal</span>}
        </BrandMark>
        <nav className="flex flex-wrap items-center gap-1">
          {isAdmin ? (
            <>
              <Link to="/staff" className={link} activeProps={active}>Dashboard</Link>
              <Link to="/clients" className={link} activeProps={active}>Clients, invites &amp; deadlines</Link>
              <Link to="/invoices" className={link} activeProps={active}>Invoices</Link>
              <Link to="/review" className={link} activeProps={active}>Review checklist</Link>
            </>
          ) : (
            <>
              <Link to="/portal" className={link} activeProps={active}>My portal</Link>
              <Link to="/dashboard" className={link} activeProps={active}>Dashboard</Link>
              <Link to="/workforce" className={link} activeProps={active}>Workforce Data</Link>
              <Link to="/barrier-analysis" search={{}} className={link} activeProps={active} activeOptions={{ includeSearch: true }}>Barriers</Link>
              <Link to="/barrier-analysis" search={{ mode: "questionnaire" }} className={link} activeProps={active} activeOptions={{ includeSearch: true }}>Questionnaire</Link>
              <Link to="/recruitment" className={link} activeProps={active}>Recruitment</Link>
              <Link to="/compliance" className={link} activeProps={active}>Compliance</Link>
              <Link to="/history" className={link} activeProps={active}>History</Link>
              <Link to="/dg-history" className={link} activeProps={active}>DG History</Link>
              {isManager && <Link to="/manager" className={link} activeProps={active}>Review portal</Link>}
              <Link to="/account" className={link} activeProps={active}>My account</Link>
            </>
          )}
          <InstallApp variant="compact" />
          <button onClick={signOut} className="ml-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">Sign out</button>
        </nav>
      </div>
    </header>
    </>
  );
}
