import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { md5 } from "@/lib/md5";

// Monthly fee and once-off setup fee in ZAR including 15% VAT (list prices exclude VAT).
// First payment = first month + setup fee; later months = monthly fee.
export const PAYFAST_PLANS = {
  essential: { name: "Essential Compliance", amount: "5744.25", first: "16669.25" },
  professional: { name: "Professional EE Management", amount: "14375.00", first: "35650.00" },
  enterprise: { name: "Enterprise Transformation", amount: "33925.00", first: "85675.00" },
  saas100: { name: "SaaS — up to 100 employees", amount: "1725.00", first: "1725.00" },
  saas500: { name: "SaaS — 101 to 500 employees", amount: "5175.00", first: "5175.00" },
  saas1000: { name: "SaaS — 501 to 1,000 employees", amount: "10925.00", first: "10925.00" },
  saas5000: { name: "SaaS — 1,001 to 5,000 employees", amount: "21275.00", first: "21275.00" },
} as const;

export const PAYFAST_MERCHANT = { id: "34733401", key: "qech9jtsygv73" } as const;

export type PayfastPlan = keyof typeof PAYFAST_PLANS;

const checkoutInput = z.object({
  plan: z.enum(Object.keys(PAYFAST_PLANS) as [PayfastPlan, ...PayfastPlan[]]),
});

// PayFast requires URL encoding with spaces as '+' and uppercase hex escapes.
function pfEncode(value: string): string {
  return encodeURIComponent(value.trim()).replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g, "+");
}

function payfastSignature(fields: Record<string, string>, passphrase: string): string {
  const pairs = Object.entries(fields)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${pfEncode(v)}`);
  if (passphrase) {
    pairs.push(`passphrase=${pfEncode(passphrase)}`);
  }
  return md5(pairs.join("&"));
}

export const startPayfastCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: PayfastPlan }) => checkoutInput.parse(input))
  .handler(async ({ data, context }) => {
    // Merchant ID and key are not secret (PayFast sends them in the browser checkout form).
    const merchantId = PAYFAST_MERCHANT.id;
    const merchantKey = PAYFAST_MERCHANT.key;
    const passphrase = process.env["PAYFAST_LIVE_PASSPHRASE"] ?? "";
    if (!merchantId || !merchantKey) {
      throw new Error("Card payments are not configured yet. Please use the banking details below.");
    }

    const plan = PAYFAST_PLANS[data.plan];
    const origin = new URL(getRequest().url).origin;
    const mPaymentId = crypto.randomUUID();
    const email = String(context.claims.email ?? "");

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/pricing?paid=1`,
      cancel_url: `${origin}/pricing?cancelled=1`,
      notify_url: `${origin}/api/public/hooks/payfast-itn`,
      email_address: email,
      m_payment_id: mPaymentId,
      amount: plan.first,
      item_name: `DDHS Equity Intelligence — ${plan.name} (monthly)`,
      subscription_type: "1",
      recurring_amount: plan.amount,
      frequency: "3", // monthly
      cycles: "0", // until cancelled
    };
    fields["signature"] = payfastSignature(fields, passphrase);

    const { error } = await context.supabase.from("subscriptions").insert({
      user_id: context.userId,
      plan: data.plan,
      status: "pending",
      amount: Number(plan.first),
      m_payment_id: mPaymentId,
    });
    if (error) {
      console.error("subscriptions insert failed", error);
      throw new Error("We couldn't start the payment. Please try again.");
    }

    const sandbox = false;
    const action = sandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    return { action, fields };
  });

// Once-off fee per DG review, ZAR incl. 15% VAT (R3,500 excl. VAT).
export const DG_REVIEW_FEE = "4025.00";

export const startDgReviewPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reviewId: string }) => z.object({ reviewId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: review } = await context.supabase.from("dg_reviews").select("id").eq("id", data.reviewId).eq("user_id", context.userId).maybeSingle();
    if (!review) throw new Error("Review not found.");
    const passphrase = process.env["PAYFAST_LIVE_PASSPHRASE"] ?? "";
    const origin = new URL(getRequest().url).origin;
    const mPaymentId = crypto.randomUUID();
    const fields: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT.id,
      merchant_key: PAYFAST_MERCHANT.key,
      return_url: `${origin}/dg-review?id=${review.id}&paid=1`,
      cancel_url: `${origin}/dg-review?id=${review.id}&cancelled=1`,
      notify_url: `${origin}/api/public/hooks/payfast-itn`,
      email_address: String(context.claims.email ?? ""),
      m_payment_id: mPaymentId,
      amount: DG_REVIEW_FEE,
      item_name: "DDHS Equity Intelligence — DG review",
      custom_str1: review.id,
    };
    fields["signature"] = payfastSignature(fields, passphrase);
    const { error } = await context.supabase.from("subscriptions").insert({
      user_id: context.userId, plan: "dg_review", status: "pending", amount: Number(DG_REVIEW_FEE), m_payment_id: mPaymentId,
    });
    if (error) { console.error("dg payment insert failed", error); throw new Error("We couldn't start the payment. Please try again."); }
    return { action: "https://www.payfast.co.za/eng/process", fields };
  });
