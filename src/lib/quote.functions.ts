import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

export const quoteServices = [
  "Virtual EE Consultant (hourly)",
  "Senior EE Specialist (hourly)",
  "DG Review Consultant (hourly)",
  "Executive Advisory (hourly)",
  "Training Facilitation (daily)",
  "EEA2 & EEA4 Submission",
  "Workforce Analysis (EEA12)",
  "EE Plan (EEA13)",
  "Barrier Analysis",
  "EE Committee Training",
  "DG Review Preparation",
  "Full Compliance Audit",
  "Enterprise Plus package",
  "Software-only subscription (5,000+ employees)",
  "Something else",
] as const;

export const quoteSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(120, "That name is too long"),
  email: z.string().trim().min(1, "Please enter your work email").email("Enter a valid email address"),
  company: z
    .string()
    .trim()
    .min(2, "Please enter your company or institution name")
    .max(160, "That company name is too long"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  service: z
    .string()
    .trim()
    .min(1, "Please choose a service")
    .max(120, "Please choose a service from the list"),
  details: z
    .string()
    .trim()
    .min(20, "Please tell us a little more about what you need")
    .max(2000, "Please keep your message under 2,000 characters"),
  // Honeypot: real visitors never fill this in.
  website: z.string().max(0).optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

function createPublishableClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
    // Opaque sb_ keys are not JWTs: send apikey only, never Authorization bearer.
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const submitQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((input: QuoteInput) => quoteSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website) {
      // Bot filled the hidden field: pretend it worked, store nothing.
      return { ok: true as const };
    }

    const supabase = createPublishableClient();

    const { data: throttled, error: throttleError } = await supabase.rpc("enquiry_throttled", {
      p_email: data.email,
    });

    if (throttleError) {
      console.error("enquiry_throttled failed", throttleError);
    }

    if (throttled) {
      return {
        ok: false as const,
        error: "We've already received a request from this email address. Please try again shortly.",
      };
    }

    const quoteRef = crypto.randomUUID();

    const { error } = await supabase.from("quote_requests").insert({
      full_name: data.fullName,
      email: data.email,
      company: data.company,
      phone: data.phone || null,
      service: data.service,
      details: data.details,
    });

    if (error) {
      console.error("quote_requests insert failed", error);
      return {
        ok: false as const,
        error: "We couldn't send your request just now. Please try again, or email sdm@ddhs.co.za.",
      };
    }

    // Notify the team. A failed notification must not fail the request —
    // the submission is already stored.
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("quote-notification", data.email, {
        templateData: {
          fullName: data.fullName,
          email: data.email,
          company: data.company,
          phone: data.phone || "",
          service: data.service,
          details: data.details,
        },
        idempotencyKey: `quote-notification-${quoteRef}`,
        replyTo: data.email,
      });
    } catch (notifyError) {
      console.error("quote notification email failed", notifyError);
    }

    return { ok: true as const };
  });
