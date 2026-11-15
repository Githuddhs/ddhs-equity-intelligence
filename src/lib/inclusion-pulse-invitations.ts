import { z } from "zod";

export const PULSE_INVITATION_LIMIT = 50;

/** Normalises a pasted recipient list without ever using an email as a participant reference. */
export function parseInvitationEmails(value: string) {
  const entries = value.split(/[\n,;]+/).map((item) => item.trim().toLowerCase()).filter(Boolean);
  const unique = [...new Set(entries)];
  const invalid = unique.filter((email) => !z.string().email().max(255).safeParse(email).success);
  const emails = unique.filter((email) => !invalid.includes(email));
  return { emails, invalid, tooMany: emails.length > PULSE_INVITATION_LIMIT };
}
