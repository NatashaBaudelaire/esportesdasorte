import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]{2,}\.[^\s@]{2,}$/.test(value);

const maskEmail = (email: string) => {
  const [localPart, domain = ""] = email.split("@");
  if (!localPart || !domain) return "";
  const maskedLocal = localPart.length <= 2
    ? `${localPart[0] || ""}*`
    : `${localPart.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, redirectTo } = await req.json();

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

    if (isEmail(normalizedIdentifier)) {
      targetEmail = normalizedIdentifier.toLowerCase();
    } else {
      const profileQuery = cpfDigits.length === 11
        ? supabaseAdmin.from("profiles").select("user_id").eq("cpf", cpfDigits).limit(2)
        : supabaseAdmin.from("profiles").select("user_id").eq("username", usernameValue).limit(1);

      const { data: profiles } = await profileQuery;

      if (profiles && profiles.length === 1) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profiles[0].user_id);
        targetEmail = userData.user?.email ?? null;
      }
    }

    if (targetEmail) {
      await supabaseAdmin.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: typeof redirectTo === "string" && redirectTo.length > 0
          ? redirectTo
          : undefined,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: Boolean(targetEmail),
        masked: targetEmail ? maskEmail(targetEmail) : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error recovering account:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
