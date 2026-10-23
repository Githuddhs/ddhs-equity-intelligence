import { useEffect, useRef, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { track } from "@/lib/track";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

/** True when the page is already running from a home-screen icon. */
function isStandalone() {
  const modes = ["standalone", "minimal-ui", "fullscreen", "window-controls-overlay"];
  if (modes.some((m) => window.matchMedia?.(`(display-mode: ${m})`).matches)) return true;
  return (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIOS() {
  const ua = navigator.userAgent || "";
  const touch = (navigator.maxTouchPoints || 0) > 1;
  return /iPad|iPhone|iPod/.test(ua) || (touch && /Macintosh/.test(ua));
}

/**
 * "Download the app" control. Uses the browser's own install prompt where it
 * exists (Chrome, Edge, Samsung Internet) and step-by-step instructions
 * everywhere else (iOS Safari, Firefox).
 */
export function InstallApp({ variant = "panel" }: { variant?: "panel" | "compact" }) {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [state, setState] = useState<"checking" | "ready" | "manual" | "installed">("checking");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Close the instructions menu when the user clicks away or presses Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (isStandalone()) {
      setState("installed");
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as PromptEvent);
      setState("ready");
    };
    const onInstalled = () => setState("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // Browsers that never fire the prompt (iOS Safari) fall back to instructions.
    const timer = window.setTimeout(() => setState((s) => (s === "checking" ? "manual" : s)), 1500);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") track("app_install");
    setPrompt(null);
    setState("manual");
  };

  if (state === "installed" || state === "checking") return null;

  const steps = isIOS()
    ? ["Open this site in Safari", "Tap the Share button", "Tap Add to Home Screen", "Tap Add"]
    : ["Open the browser menu (⋮)", "Choose Add to Home screen or Install app", "Confirm to add the icon"];

  if (variant === "compact") {
    return (
      <div ref={wrap} className="relative print:hidden">
        <button
          onClick={() => (prompt ? void install() : setOpen((v) => !v))}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-accent"
          aria-expanded={open}
        >
          <Smartphone className="h-4 w-4" />
          Get the app
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg">
            <p className="text-sm font-semibold text-primary">Add DDHS to your home screen</p>
            <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
              {steps.map((s, i) => (
                <li key={s}>
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              It opens full screen with your usual sign-in. Nothing to pay for.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="card-title text-primary">Download the DDHS app</h3>
          </div>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Add the platform to your phone, tablet or computer home screen. It opens full screen like an
            app, keeps your usual sign-in, and needs nothing from an app store.
          </p>
        </div>
        <div className="shrink-0">
          {prompt ? (
            <button
              onClick={() => void install()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Install the app
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-secondary/60 p-4">
              <p className="text-sm font-semibold text-primary">Add to your home screen</p>
              <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
                {steps.map((s, i) => (
                  <li key={s}>
                    {i + 1}. {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
