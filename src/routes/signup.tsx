import { createFileRoute, redirect } from "@tanstack/react-router";

// Accounts are created via staff invite only — /signup now forwards to the
// single sign-in page used across all capabilities.
export const Route = createFileRoute("/signup")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { next: "/portal" } });
  },
});
