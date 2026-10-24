import { useState } from "react";
import { Menu, X } from "lucide-react";

/** The front page menu, in the order shown on every screen size. */
const LINKS = [
  { label: "Why DDHS", href: "#why-ddhs" },
  { label: "Problems We Solve", href: "#problems" },
  { label: "Platform", href: "#platform" },
  { label: "Client Outcomes", href: "#outcomes" },
  { label: "B-BBEE", href: "#bbbee" },
  { label: "Book a Demonstration", href: "#contact" },
  { label: "Site Tour", href: "/tour" },
  { label: "Virtual Consultant", href: "/virtual-consultant" },
  { label: "Recruitment Suite", href: "/services/recruitment-suite" },
  { label: "Blog", href: "/blog" },
];

const desk = "whitespace-nowrap transition-colors hover:text-primary";

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-2">
      <nav className="hidden flex-wrap items-center gap-x-6 gap-y-1 text-sm font-semibold text-teal md:flex">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className={desk}>
            {l.label}
          </a>
        ))}
      </nav>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-lg border border-teal px-3 py-1.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/10"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          {open ? "Close menu" : "Menu"}
        </button>
        {open && (
          <nav className="mt-2 flex flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-sm">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-teal transition-colors hover:bg-muted hover:text-primary"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
