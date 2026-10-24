import { createFileRoute } from "@tanstack/react-router";

import { md5 } from "@/lib/md5";

function pfEncode(value: string): string {
  return encodeURIComponent(value.trim()).replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g, "+");
}

// Rebuild the signature from the received params, in received order,
// excluding the signature itself.
function itnSignature(entries: [string, string][], passphrase: string): string {
  const pairs = entries
    .filter(([k, v]) => k !== "signature" && v !== "")
    .map(([k, v]) => `${k}=${pfEncode(v)}`);
  if (passphrase) {
    pairs.push(`passphrase=${pfEncode(passphrase)}`);
  }
  return md5(pairs.join("&"));
}

export const Route = createFileRoute("/api/public/hooks/payfast-itn")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const passphrase = process.env["PAYFAST_LIVE_PASSPHRASE"] ?? "";
        const sandbox = false;
        const base = sandbox ? "https://sandbox.payfast.co.za" : "https://www.payfast.co.za";

        const rawBody = await request.text();
        const entries = [...new URLSearchParams(rawBody).entries()] as [string, string][];
        const params = Object.fromEntries(entries);

        // 1. Verify the signature.
        const received = params["signature"] ?? "";
        if (!received || itnSignature(entries, passphrase) !== received.toLowerCase()) {
          return new Response("Invalid signature", { status: 401 });
        }

        // 2. Confirm the notification with PayFast itself.
        const validate = await fetch(`${base}/eng/query/validate`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: rawBody,
        });
        const verdict = (await validate.text()).trim();
        if (verdict !== "VALID") {
          return new Response("Invalid notification", { status: 401 });
        }

        // 3. Update the subscription.
        const mPaymentId = params["m_payment_id"];
        if (!mPaymentId) {
          return new Response("Missing payment reference", { status: 400 });
        }

        const paymentStatus = params["payment_status"] ?? "";
        const status =
          paymentStatus === "COMPLETE"
            ? "active"
            : paymentStatus === "CANCELLED"
              ? "cancelled"
              : paymentStatus === "FAILED"
                ? "failed"
                : "pending";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status,
            payfast_payment_id: params["pf_payment_id"] ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("m_payment_id", mPaymentId);

        if (error) {
          console.error("subscription update failed", error);
          return new Response("Update failed", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
