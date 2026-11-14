import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GovernanceStep } from "./recruitment-phase2";
import type { Tables } from "@/integrations/supabase/types";

type Vacancy = Tables<"recruitment_vacancies">;
const ack = { by: "Fictional chair", at: "2026-11-14T02:35:00Z", note: "Guidance considered" };
const vacancy: Vacancy = {
  id: "fictional-vacancy", user_id: "fictional-owner", title: "Fictional analyst",
  governance: {}, appointment_review: {}, approval_note: "", approved_at: null,
  approver_name: "", checks: {}, closing_date: null, created_at: "2026-11-14T00:00:00Z",
  updated_at: "2026-11-14T00:00:00Z", criteria: {}, department: "", division: "",
  section: "", organisation: "Fictional demo", occupational_level: "Professionally qualified",
  sector: "", province: "", reason: "", scarce_skill: false, in_workforce_plan: false,
  status: "approved", priority: {}, job_profile: "", sourcing: {}, public_token: "fictional-token",
};

describe("governance acknowledgement saves", () => {
  it("keeps an acknowledgement recorded after the governance form mounted, without losing draft edits", () => {
    const save = vi.fn().mockResolvedValue(true);
    const v = vacancy;
    const { rerender } = render(<GovernanceStep v={v} save={save} busy={false} />);
    fireEvent.change(screen.getByLabelText("Member 1 name"), { target: { value: "Fictional member" } });
    rerender(<GovernanceStep v={{ ...v, governance: { focusAck: ack } }} save={save} busy={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Save governance record" }));
    const record = save.mock.calls[0]?.[0]?.governance;
    expect(record?.focusAck).toEqual(ack);
    expect(record?.members[0]?.name).toBe("Fictional member");
  });

  it("does not restore an acknowledgement withdrawn after the governance form mounted", () => {
    const save = vi.fn().mockResolvedValue(true);
    const v: Vacancy = { ...vacancy, governance: { focusAck: ack } };
    const { rerender } = render(<GovernanceStep v={v} save={save} busy={false} />);
    rerender(<GovernanceStep v={{ ...v, governance: {} }} save={save} busy={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Save governance record" }));
    expect(save.mock.calls[0]?.[0]?.governance?.focusAck).toBeUndefined();
  });
});