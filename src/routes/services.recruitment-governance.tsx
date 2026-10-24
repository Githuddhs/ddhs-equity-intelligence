import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into the Recruitment Suite page; kept as a permanent redirect for old links.
export const Route = createFileRoute("/services/recruitment-governance")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/services/recruitment-suite", hash: "governance", statusCode: 301 });
  },
});
