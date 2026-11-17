import { createFileRoute, redirect } from "@tanstack/react-router";

// Page removed from the site at the owner's request; kept as a permanent redirect so old links still land somewhere useful.
export const Route = createFileRoute("/delivery-methodology")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
