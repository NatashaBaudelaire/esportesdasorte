import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { data: userData } = await supabaseClient.auth.getUser(token);
    const userEmail = userData.user?.email;

    const { amount, method } = await req.json();

    const normalizeDigits = (value?: string | null) => (value ?? "").replace(/\D/g, "");

    if (!amount || amount < 10 || amount > 50000) {
      return new Response(JSON.stringify({ error: "Valor inválido. Mín R$10, Máx R$50.000" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({ email: userEmail, metadata: { user_id: userId } });
        customerId = customer.id;
      }
    }

    // Create admin client for inserting transaction
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // KYC transactional guard for PIX: require verified CPF + phone in profile
    if (method === "pix") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("cpf, phone")
        .eq("user_id", userId)
        .single();

      const cpfDigits = normalizeDigits(profile?.cpf);
      const phoneDigits = normalizeDigits(profile?.phone);
      const isPixKycVerified = cpfDigits.length === 11 && phoneDigits.length >= 10;

      if (!isPixKycVerified) {
        return new Response(
          JSON.stringify({
            error: "PIX bloqueado: conclua a verificação KYC (CPF e telefone válidos) para usar este método.",
            code: "KYC_REQUIRED_FOR_PIX",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "pix") {
      // Create PaymentIntent with PIX
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "brl",
        customer: customerId,
        payment_method_types: ["pix"],
        metadata: { user_id: userId, method: "pix" },
      });

      // Record transaction
      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: "deposit",
        method: "pix",
        amount: amount,
        status: "pending",
        description: `Depósito via PIX - R$ ${amount.toFixed(2)}`,
        metadata: { stripe_payment_intent_id: paymentIntent.id },
      });

      return new Response(
        JSON.stringify({
          type: "pix",
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (method === "card") {
      // Create Checkout Session for card payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: { name: `Depósito SeleçãoBet - R$ ${amount.toFixed(2)}` },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/carteira?deposit=success&amount=${amount}`,
        cancel_url: `${req.headers.get("origin")}/carteira?deposit=cancelled`,
        metadata: { user_id: userId, method: "card", amount: String(amount) },
      });

      // Record transaction
      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: "deposit",
        method: "card",
        amount: amount,
        status: "pending",
        description: `Depósito via Cartão - R$ ${amount.toFixed(2)}`,
        metadata: { stripe_session_id: session.id },
      });

      return new Response(
        JSON.stringify({ type: "checkout", url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (method === "boleto") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "brl",
        customer: customerId,
        payment_method_types: ["boleto"],
        metadata: { user_id: userId, method: "boleto" },
      });

      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: "deposit",
        method: "boleto",
        amount: amount,
        status: "pending",
        description: `Depósito via Boleto - R$ ${amount.toFixed(2)}`,
        metadata: { stripe_payment_intent_id: paymentIntent.id },
      });

      return new Response(
        JSON.stringify({
          type: "boleto",
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify({ error: "Método não suportado" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating deposit:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
