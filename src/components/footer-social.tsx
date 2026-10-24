import { SOCIAL_LINKS } from "@/lib/social";

/**
 * "Follow DDHS Equity Intelligence" row for site footers.
 * Renders nothing while SOCIAL_LINKS is empty, so an unfinished address never reaches a page.
 */
export function FooterSocial() {
  if (SOCIAL_LINKS.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="label-title text-primary">Follow DDHS Equity Intelligence</span>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {SOCIAL_LINKS.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal hover:underline"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
