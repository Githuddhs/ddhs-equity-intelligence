import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { icon: string; text: string }> = {
  sm: { icon: "h-6 w-6", text: "text-sm" },
  md: { icon: "h-8 w-8", text: "text-lg" },
  lg: { icon: "h-10 w-10", text: "text-2xl" },
};

/**
 * The standard DDHS logo: the app icon beside the navy "DDHS" + teal
 * "Equity Intelligence" wordmark. Used in every page header and footer.
 * Pass `to={null}` where the mark must not be a link.
 */
export function BrandMark({
  size = "md",
  to = "/",
  className = "",
  children,
}: {
  size?: Size;
  to?: "/" | "/staff" | null;
  className?: string;
  children?: ReactNode;
}) {
  const s = SIZES[size];
  const mark = (
    <>
      <img
        src="/icons/icon-192.png"
        alt=""
        aria-hidden="true"
        width={192}
        height={192}
        className={`shrink-0 rounded-lg ${s.icon}`}
      />
      <span className={`font-display font-bold leading-tight text-primary ${s.text}`}>
        DDHS <span className="text-teal">Equity Intelligence</span>
      </span>
      {children}
    </>
  );

  if (to === null) {
    return <span className={`inline-flex items-center gap-2 ${className}`}>{mark}</span>;
  }

  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`}>
      {mark}
    </Link>
  );
}
