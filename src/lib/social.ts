export type SocialLink = { label: string; url: string };

/**
 * DDHS social media pages shown in every site footer and in the Organization search listing.
 *
 * Add one entry per page using the exact web address, for example:
 *   { label: "LinkedIn", url: "https://www.linkedin.com/company/ddhs-equity-intelligence" }
 *   { label: "Facebook", url: "https://www.facebook.com/ddhsequityintelligence" }
 *
 * The footer row stays hidden while this list is empty, so no unfinished link ever reaches a page.
 */
export const SOCIAL_LINKS: SocialLink[] = [];

/** Addresses for the "sameAs" field of the Organization search listing. */
export const SOCIAL_SAMEAS = SOCIAL_LINKS.map((s) => s.url);
