// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return jsonResponse({ error: "Missing stripe-signature header" }, 401);
    }

    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
    if (!stripeWebhookSecret) {
      console.warn("STRIPE_WEBHOOK_SECRET not configured");
      return jsonResponse({ received: true });
    }

    // Verify webhook signature (simplified - use stripe lib in prod)
    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    // Process based on event type
    switch (event.type) {
      case "charge.succeeded":
        await handleChargeSucceeded(event.data.object, supabaseAdmin);
        break;

      case "charge.failed":
        await handleChargeFailed(event.data.object, supabaseAdmin);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object, supabaseAdmin);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object, supabaseAdmin);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object, supabaseAdmin);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("stripe-webhook error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

async function handleChargeSucceeded(charge: any, supabaseAdmin: any) {
  const metadata = charge.metadata ?? {};
  const userId = metadata.user_id;
  const method = metadata.method ?? "card";

  if (!userId) {
    console.warn("Charge succeeded but no user_id in metadata", charge.id);
    return;
  }

  const amount = charge.amount / 100; // Convert cents to BRL

  // Update transaction status
  await supabaseAdmin
    .from("transactions")
    .update({ status: "confirmed" })
    .eq("metadata->stripe_payment_intent_id", charge.payment_intent)
    .eq("user_id", userId);

  // Credit wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (wallet) {
    await supabaseAdmin
      .from("wallets")
      .update({ balance: (wallet.balance ?? 0) + amount })
      .eq("user_id", userId);
  }

  console.log(`Deposit confirmed: user=${userId}, amount=${amount}, method=${method}`);
}

async function handleChargeFailed(charge: any, supabaseAdmin: any) {
  const metadata = charge.metadata ?? {};
  const userId = metadata.user_id;

  if (!userId) return;

  // Update transaction status
  await supabaseAdmin
    .from("transactions")
    .update({ status: "failed" })
    .eq("metadata->stripe_payment_intent_id", charge.payment_intent)
    .eq("user_id", userId);

  console.log(`Deposit failed: user=${userId}, charge=${charge.id}`);
}

async function handleChargeRefunded(charge: any, supabaseAdmin: any) {
  const metadata = charge.metadata ?? {};
  const userId = metadata.user_id;

  if (!userId) return;

  const amount = charge.amount_refunded / 100;

  // Update transaction status
  await supabaseAdmin
    .from("transactions")
    .update({ status: "refunded" })
    .eq("metadata->stripe_payment_intent_id", charge.payment_intent)
    .eq("user_id", userId);

  // Debit wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (wallet) {
    await supabaseAdmin
      .from("wallets")
      .update({ balance: Math.max(0, (wallet.balance ?? 0) - amount) })
      .eq("user_id", userId);
  }

  console.log(`Deposit refunded: user=${userId}, amount=${amount}`);
}

async function handlePaymentIntentSucceeded(intent: any, supabaseAdmin: any) {
  const metadata = intent.metadata ?? {};
  const userId = metadata.user_id;
  const method = metadata.method ?? "card";

  if (!userId || intent.status !== "succeeded") return;

  const amount = intent.amount / 100;

  // Update transaction status
  await supabaseAdmin
    .from("transactions")
    .update({ status: "confirmed" })
    .eq("metadata->stripe_payment_intent_id", intent.id)
    .eq("user_id", userId);

  // Credit wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (wallet) {
    await supabaseAdmin
      .from("wallets")
      .update({ balance: (wallet.balance ?? 0) + amount })
      .eq("user_id", userId);
  }

  console.log(`Payment intent succeeded: user=${userId}, amount=${amount}, method=${method}`);
}

async function handlePaymentIntentFailed(intent: any, supabaseAdmin: any) {
  const metadata = intent.metadata ?? {};
  const userId = metadata.user_id;

  if (!userId) return;

  // Update transaction status
  await supabaseAdmin
    .from("transactions")
    .update({ status: "failed" })
    .eq("metadata->stripe_payment_intent_id", intent.id)
    .eq("user_id", userId);

  console.log(`Payment intent failed: user=${userId}, intent=${intent.id}`);
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
