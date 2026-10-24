import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { AuthCta } from "@/components/auth-cta";
import { RelatedLinks } from "@/components/related-links";

export function GuideShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <BrandMark />
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/guides" className="hidden text-teal hover:text-primary sm:inline">Guides</Link>
            <Link to="/blog" className="hidden text-teal hover:text-primary sm:inline">Blog</Link>
            <AuthCta />
            <Link to="/" hash="contact" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-primary-foreground">Book a Demonstration</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
      <RelatedLinks />
      <footer className="border-t bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
          <BrandMark />
          <p className="text-sm text-muted-foreground">
            Data. Accountability. Transformation. ·{" "}
            <a href="mailto:sdm@ddhs.co.za" className="font-semibold text-teal hover:underline">sdm@ddhs.co.za</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export function GuideCta() {
  return (
    <section className="mt-12 rounded-3xl bg-gradient-to-br from-primary via-primary to-teal/80 px-8 py-10 text-center">
      <h2 className="display-title text-balance text-navy-foreground">See it with your own workforce data</h2>
      <p className="mx-auto mt-4 max-w-2xl text-navy-foreground/80">We will walk you through the platform using your figures.</p>
      <Link to="/" hash="contact" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-teal-foreground hover:bg-teal/90">
        Book a Demonstration <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

export const GUIDE_DISCLAIMER =
  "General guidance based on the Employment Equity Act and its amendments, not legal advice. Always confirm current requirements and dates with the Department of Employment and Labour.";
