export type ClientWorkspace = { id: string; email: string; profile: Record<string, string>; sensitiveAccess: boolean };
let workspace: ClientWorkspace | null = null;
export function getClientWorkspace() { return workspace; }
export function setClientWorkspace(value: ClientWorkspace | null) {
  workspace = value;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ddhs-client-workspace"));
}
export function workspaceForPage() {
  if (typeof window === "undefined") return null;
  const ownPages = ["/staff", "/clients", "/review", "/account", "/auth", "/staff-login", "/set-password", "/reset-password"];
  return ownPages.some((p) => window.location.pathname === p || window.location.pathname.startsWith(p + "/")) ? null : workspace;
}