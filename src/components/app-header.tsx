import type React from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageExport } from "@/components/page-export";
import { InstallApp } from "@/components/install-app";
import { BrandMark } from "@/components/brand-mark";
import { ClientWorkspaceBanner } from "@/components/client-workspace";
import { workspaceForPage, setClientWorkspace } from "@/lib/client-workspace-state";
import { sessionClient } from "@/lib/workspace-client";
import { useQueryClient } from "@tanstack/react-query";

const item = "block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-primary";
const activeItem = { className: "block rounded-md px-3 py-2 text-sm font-semibold text-primary bg-muted" };
const closeMenu = (e: React.MouseEvent<HTMLElement>) => e.currentTarget.closest("details")?.removeAttribute("open");

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary">{label} ▾</summary>
      <div className="absolute left-0 z-50 mt-1 w-64 rounded-lg border border-border bg-popover p-1 shadow-lg">{children}</div>
    </details>
  );
}

const STAFF_PATHS = ["/staff", "/clients", "/review"];

export function AppHeader() {
  const { data: isAdmin, isFetched } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await sessionClient.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return !!data;
    },
  });
  const { data: isManager } = useQuery({
    queryKey: ["is-manager"],
    queryFn: async () => {
      const { data: u } = await sessionClient.auth.getUser();
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
  const qc = useQueryClient();
  const managingClient = !!workspaceForPage();
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); setClientWorkspace(null); await sessionClient.auth.signOut(); navigate({ to: "/auth", search: { next: "/portal" }, replace: true }); };
  const link = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary";
  const active = { className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-muted" };
  return (
    <>
    <PageExport />
    <ClientWorkspaceBanner />
    <header className={`border-b border-border print:hidden ${isAdmin ? "bg-secondary" : ""}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex max-w-7xl flex-wrap items-center justify-between gap-3 py-4">
        <BrandMark to={isAdmin ? "/staff" : "/"}>
          {isAdmin && <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">Staff portal</span>}
        </BrandMark>
        <nav className="flex flex-wrap items-center gap-1">
          {isAdmin && !managingClient ? (
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
              <NavGroup label="A · Workforce">
                <Link to="/workforce" className={item} activeProps={activeItem} onClick={closeMenu}>Workforce Data</Link>
                <Link to="/workforce-foundation" className={item} activeProps={activeItem} onClick={closeMenu}>Employee Profiles</Link>
                <Link to="/readiness" className={item} activeProps={activeItem} onClick={closeMenu}>Data readiness</Link>
                <Link to="/workforce" hash="managed-interviews" className={item} onClick={closeMenu}>DDHS Managed Stay &amp; Exit Interview Service</Link>
              </NavGroup>
              <NavGroup label="B · EEA12 Analytics">
                <Link to="/eea12" className={item} activeProps={activeItem} onClick={closeMenu}>EEA12 analysis</Link>
                <Link to="/barrier-analysis" search={{}} className={item} activeProps={activeItem} activeOptions={{ includeSearch: true }} onClick={closeMenu}>Barriers</Link>
                <Link to="/barrier-analysis" search={{ mode: "questionnaire" }} className={item} activeProps={activeItem} activeOptions={{ includeSearch: true }} onClick={closeMenu}>Questionnaire</Link>
              </NavGroup>
              <NavGroup label="C–E · Recruitment">
                <Link to="/recruitment" className={item} activeProps={activeItem} onClick={closeMenu}>C · Recruitment focus (vacancies)</Link>
                <Link to="/recruitment" className={item} onClick={closeMenu}>D · Governance (per vacancy)</Link>
                <Link to="/recruitment" className={item} onClick={closeMenu}>E · Selection (candidates)</Link>
                <Link to="/recruitment-dashboard" className={item} activeProps={activeItem} onClick={closeMenu}>Recruitment dashboard</Link>
              </NavGroup>
              <NavGroup label="F · Evidence & Reporting">
                <Link to="/compliance" className={item} activeProps={activeItem} onClick={closeMenu}>Compliance</Link>
                <Link to="/evidence" className={item} activeProps={activeItem} onClick={closeMenu}>Evidence</Link>
                <Link to="/doel-submissions" className={item} activeProps={activeItem} onClick={closeMenu}>EEA2 / EEA4 reporting</Link>
                <Link to="/history" className={item} activeProps={activeItem} onClick={closeMenu}>History</Link>
                <Link to="/dg-history" className={item} activeProps={activeItem} onClick={closeMenu}>DG review evidence</Link>
              </NavGroup>
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
