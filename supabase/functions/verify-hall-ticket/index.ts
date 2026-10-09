// Supabase Edge Function: verify-hall-ticket
// Public verification endpoint revealing safe validation data for exam invigilators
// Never exposes internal keys, salts, marks, or private clearances

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Health Verification Endpoint
  if (url.searchParams.get("health") === "true") {
    return new Response(
      JSON.stringify({
        service: "verify-hall-ticket",
        status: "ok",
        environment: Deno.env.get("ENVIRONMENT") || "production",
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Resolve token from query param or body
    let token = url.searchParams.get("token");
    if (!token && req.method === "POST") {
      try {
        const body = await req.json();
        token = body.token;
      } catch {
        // No body
      }
    }

    if (!token) {
      return new Response(
        JSON.stringify({ is_valid: false, error: "Verification token parameter is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    // Call public verification RPC
    const { data: verificationData, error: rpcError } = await anonClient.rpc(
      "rpc_verify_hall_ticket",
      { p_token: token }
    );

    if (rpcError) {
      throw new Error(`Verification database error: ${rpcError.message}`);
    }

    return new Response(JSON.stringify(verificationData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ is_valid: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
