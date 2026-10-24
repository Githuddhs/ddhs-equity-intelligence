import { Link } from "@tanstack/react-router";

const GROUPS = [
  {
    title: "Platform",
    links: [
      { to: "/workforce-foundation", label: "Workforce Data Foundation" },
      { to: "/eea12", label: "EEA12 workforce analysis" },
      { to: "/eea13-planning", label: "EEA13 Employment Equity plan" },
      { to: "/accountability-management", label: "Accountability management" },
      { to: "/evidence-governance", label: "Evidence & DG review readiness" },
      { to: "/executive-intelligence", label: "Executive EE reporting" },
      { to: "/leadership-dashboard", label: "Leadership dashboard" },
      { to: "/leadership-report", label: "Leadership report" },
      { to: "/responsible-ai", label: "Responsible AI" },
      { to: "/services/recruitment-suite", label: "Recruitment Suite" },
    ],
  },
  {
    title: "Services",
    links: [
      { to: "/services/saas-subscriptions", label: "SaaS subscriptions" },
      { to: "/services/implementation", label: "Implementation services" },
      { to: "/services/ee-advisory", label: "Specialist EE advisory" },
      { to: "/services/recruitment-suite", label: "Recruitment Suite" },
      { to: "/virtual-consultant", label: "Virtual EE Consultant" },
    ],
  },
  {
    title: "Get started",
    links: [
      { to: "/pricing", label: "Pricing" },
      { to: "/tour", label: "Site Tour" },
      { to: "/guides", label: "Employment Equity guides" },
      { to: "/blog", label: "Blog" },
      { to: "/plan-architecture", label: "How your plan is built" },
    ],
  },
] as const;

/** Crawlable links between related public pages. */
export function RelatedLinks({ current }: { current?: string }) {
  return (
    <nav aria-label="Explore DDHS Equity Intelligence" className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-3">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="label-title text-primary">{g.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {g.links.filter((l) => l.to !== current).map((l) => (
                <li key={l.to}>
                  {l.to === "/pricing" ? (
                    <Link to="/pricing" search={{ paid: false, cancelled: false }} className="text-teal hover:text-primary">{l.label}</Link>
                  ) : (
                    <Link to={l.to} className="text-teal hover:text-primary">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
