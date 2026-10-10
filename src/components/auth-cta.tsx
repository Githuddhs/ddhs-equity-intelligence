import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Session-aware sign-in affordance for public pages.
 * Signed out → "Sign in" (returns to this page after login).
 * Signed in  → "My portal" straight through to the client's portal.
 */
export function AuthCta({ className = "" }: { className?: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setSignedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setSignedIn(true);
      if (event === "SIGNED_OUT") setSignedIn(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const base = "hidden whitespace-nowrap text-sm font-semibold text-teal hover:text-primary sm:inline";

  if (signedIn) {
    return (
      <Link to="/portal" className={`${base} ${className}`}>
        My portal
      </Link>
    );
  }
  return (
    <Link to="/auth" search={{ next: pathname }} className={`${base} ${className}`}>
      Sign in
    </Link>
  );
}
