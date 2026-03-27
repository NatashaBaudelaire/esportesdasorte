import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]{2,}\.[^\s@]{2,}$/.test(value);

const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  const lastFour = digits.slice(-4);
  const hidden = digits.slice(0, -4).replace(/./g, "*");
  return `${hidden}${lastFour}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, method = "email" } = await req.json();

    const normalizedIdentifier = String(identifier || "").trim();
    if (!normalizedIdentifier) {
      return new Response(JSON.stringify({ error: "Identificador invalido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const cpfDigits = normalizedIdentifier.replace(/\D/g, "");
    const usernameValue = normalizedIdentifier.replace(/^@/, "").toLowerCase();

    let targetEmail: string | null = null;
    let targetPhone: string | null = null;

    if (isEmail(normalizedIdentifier)) {
      targetEmail = normalizedIdentifier.toLowerCase();
    } else {
      const profileQuery = cpfDigits.length === 11
        ? supabaseAdmin.from("profiles").select("user_id, phone").eq("cpf", cpfDigits).limit(1)
        : supabaseAdmin.from("profiles").select("user_id, phone").eq("username", usernameValue).limit(1);

      const { data: profiles } = await profileQuery;

      if (profiles && profiles.length === 1) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profiles[0].user_id);
        targetEmail = userData.user?.email ?? null;
        targetPhone = profiles[0].phone ?? null;
      }
    }

    if (method === "sms" && targetPhone) {
      // SMS method: Generate a 6-digit code and store it temporarily
      const recoveryCode = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

      // Store recovery code in a cache/temp storage (in production, use Redis or similar)
      const { error: codeError } = await supabaseAdmin
        .from("recovery_codes")
        .insert({
          phone: targetPhone,
          code: recoveryCode,
          expires_at: expiresAt,
          used: false,
        })
        .select()
        .single();

      if (codeError) {
        console.error("Error storing recovery code:", codeError);
      }

      // Send SMS via Twilio or another service
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
        const phoneE164 = targetPhone.replace(/\D/g, "");

        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: `+${phoneE164}`,
            Body: `Seu codigo de recuperacao de senha: ${recoveryCode}. Valido por 15 minutos.`,
          }).toString(),
        });
      } else {
        console.warn("Twilio credentials not configured");
      }

      return new Response(
        JSON.stringify({
          success: true,
          method: "sms",
          masked: maskPhone(targetPhone),
          message: "Codigo enviado por SMS",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default to email method
    if (targetEmail) {
      await supabaseAdmin.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/reset-password`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        method: "email",
        sent: Boolean(targetEmail),
        masked: targetEmail ? targetEmail.replace(/(.{2})(.*)(@.*)/, "$1*****$3") : null,
        message: "Link de recuperacao enviado por email",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in recovery:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
