import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

export const workforceSizes = [
  "1 – 49 employees",
  "50 – 199 employees",
  "200 – 499 employees",
  "500 – 999 employees",
  "1,000 – 4,999 employees",
  "5,000+ employees",
] as const;

export const enquirySchema = z.object({
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
  jobTitle: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  workforceSize: z.string().trim().max(60).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(20, "Please tell us a little more about your EE process")
    .max(2000, "Please keep your message under 2,000 characters"),
  // Honeypot: real visitors never fill this in.
  website: z.string().max(0).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

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

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((input: EnquiryInput) => enquirySchema.parse(input))
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
        error: "We've already received an enquiry from this email address. Please try again shortly.",
      };
    }

    const enquiryRef = crypto.randomUUID();

    const { error } = await supabase.from("contact_enquiries").insert({
      full_name: data.fullName,
      email: data.email,
      company: data.company,
      job_title: data.jobTitle || null,
      phone: data.phone || null,
      workforce_size: data.workforceSize || null,
      message: data.message,
      source: "website",
    });

    if (error) {
      console.error("contact_enquiries insert failed", error);
      return {
        ok: false as const,
        error: "We couldn't send your enquiry just now. Please try again, or email sdm@ddhs.co.za.",
      };
    }

    // Notify the team. A failed notification must not fail the enquiry —
    // the submission is already stored.
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("enquiry-notification", data.email, {
        templateData: {
          fullName: data.fullName,
          email: data.email,
          company: data.company,
          jobTitle: data.jobTitle || "",
          phone: data.phone || "",
          workforceSize: data.workforceSize || "",
          message: data.message,
        },
        idempotencyKey: `enquiry-notification-${enquiryRef}`,
        replyTo: data.email,
      });
    } catch (notifyError) {
      console.error("enquiry notification email failed", notifyError);
    }

    return { ok: true as const };
  });
