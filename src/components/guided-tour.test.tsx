import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { track } from "@/lib/track";
import { GuidedTour, type TourStep } from "./guided-tour";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, hash, children, onClick }: { to: string; hash?: string; children: ReactNode; onClick?: () => void }) => (
    <a href={to} onClick={onClick}>{children}</a>
  ),
}));
vi.mock("@/lib/track", () => ({ track: vi.fn() }));

const STEPS: TourStep[] = [
  { kicker: "Start", title: "Fictional first step", body: "First body.", points: ["First point"], to: "/", cta: "Back to home" },
  { kicker: "Step 1", title: "Fictional second step", body: "Second body.", points: ["Second point"], to: "/eea12", cta: "Try EEA12" },
  { kicker: "Step 2", title: "Fictional third step", body: "Third body.", points: ["Third point"], to: "/signup", cta: "Create an account" },
];

const KEY = "ddhs-tour-progress:/tour";

beforeEach(() => {
  localStorage.clear();
  vi.mocked(track).mockClear();
});

describe("tour progress", () => {
  it("shows the step number, the steps remaining and the share complete", () => {
    render(<GuidedTour steps={STEPS} path="/tour" />);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("2 steps remaining · 33% complete")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("1 step remaining · 67% complete")).toBeInTheDocument();
  });

  it("announces progress to a screen reader and marks the current step", () => {
    render(<GuidedTour steps={STEPS} path="/tour" />);
    expect(screen.getByRole("group", { name: "site tour progress: step 1 of 3" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Go to step / })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Go to step 1: Fictional first step" })).toHaveAttribute("aria-current", "step");
  });

  it("resumes at the step a visitor stopped on and offers to start over", () => {
    const first = render(<GuidedTour steps={STEPS} path="/tour" />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(localStorage.getItem(KEY)).toBe("1");
    first.unmount();

    const second = render(<GuidedTour steps={STEPS} path="/tour" />);
    expect(screen.getByText(/Picked up where you left off/)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "site tour progress: step 2 of 3" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByRole("group", { name: "site tour progress: step 1 of 3" })).toBeInTheDocument();
    expect(screen.queryByText(/Picked up where you left off/)).not.toBeInTheDocument();

    // A return visit starts from the beginning again.
    second.unmount();
    render(<GuidedTour steps={STEPS} path="/tour" />);
    expect(screen.getByRole("group", { name: "site tour progress: step 1 of 3" })).toBeInTheDocument();
    expect(screen.queryByText(/Picked up where you left off/)).not.toBeInTheDocument();
  });

  it("clears the saved step once the visitor finishes the tour", () => {
    render(<GuidedTour steps={STEPS} path="/tour" />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    expect(screen.getByText("Last step · 100% complete")).toBeInTheDocument();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("keeps each tour's place separate", () => {
    const first = render(<GuidedTour steps={STEPS} path="/tour" />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    first.unmount();

    render(<GuidedTour steps={STEPS} path="/recruitment-tour" label="recruitment tour" />);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.queryByText(/Picked up where you left off/)).not.toBeInTheDocument();
  });

  it("records which tour action button a visitor clicked", () => {
    render(<GuidedTour steps={STEPS} path="/tour" />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("link", { name: /Try EEA12/ }));
    expect(vi.mocked(track)).toHaveBeenCalledWith("tour_action", "/eea12 · step 2 of 3 · Fictional second step");
  });

  it("records the section a button jumps to", () => {
    render(<GuidedTour steps={[{ ...STEPS[0]!, hash: "workflow" }]} path="/tour" />);
    fireEvent.click(screen.getByRole("link", { name: /Back to home/ }));
    expect(vi.mocked(track)).toHaveBeenCalledWith("tour_action", "/#workflow · step 1 of 1 · Fictional first step");
  });
});
