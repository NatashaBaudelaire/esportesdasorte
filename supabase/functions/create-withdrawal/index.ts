import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    const { amount, method, pixKey } = await req.json();
    const payoutMethod = method || "pix";
    const normalizeDigits = (value?: string | null) => (value ?? "").replace(/\D/g, "");

    if (!amount || amount < 20) {
      return new Response(JSON.stringify({ error: "Valor mínimo para saque: R$ 20,00" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // KYC transactional guard for PIX withdrawals
    if (payoutMethod === "pix") {
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
            error: "Saque PIX bloqueado: conclua a verificação KYC (CPF e telefone válidos).",
            code: "KYC_REQUIRED_FOR_PIX",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!pixKey || String(pixKey).trim().length < 4) {
        return new Response(
          JSON.stringify({
            error: "Chave PIX inválida.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Check balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Carteira não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (Number(wallet.balance) < amount) {
      return new Response(JSON.stringify({ error: "Saldo insuficiente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct balance
    await supabaseAdmin
      .from("wallets")
      .update({ balance: Number(wallet.balance) - amount })
      .eq("user_id", userId);

    // Record transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "withdrawal",
      method: payoutMethod,
      amount: -amount,
      status: "processing",
      description: `Saque via ${payoutMethod === "pix" ? "PIX" : "Transferência"} - R$ ${amount.toFixed(2)}`,
      pix_key: pixKey || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Saque solicitado com sucesso",
        estimated_time: payoutMethod === "pix" ? "Até 1 hora" : "1-2 dias úteis",
        new_balance: Number(wallet.balance) - amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
