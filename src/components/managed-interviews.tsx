import { ExitInterviewLinks } from "@/components/exit-interview-links";
import { StayInterviewLinks } from "@/components/stay-interview-links";

export function ManagedInterviews() {
  return (
    <section id="managed-interviews" className="mt-8 scroll-mt-24 border-t border-border py-6">
      <h2 className="text-balance text-2xl font-bold text-primary">DDHS Managed Stay &amp; Exit Interview Service</h2>
      <nav aria-label="Interview types" className="mt-4 flex flex-wrap gap-6 text-sm font-semibold text-teal" data-allow-client>
        <a href="#stay-interviews">Stay interviews</a>
        <a href="#exit-interviews">Exit interviews</a>
      </nav>
      <StayInterviewLinks />
      <ExitInterviewLinks />
    </section>
  );
}