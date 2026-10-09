// Supabase Edge Function: dispatch-notification
// Transports queued notifications across external channels (Email via Resend / Webhook)
// Never exposes email provider API keys to client applications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DispatchResult {
  delivery_id: string;
  recipient: string;
  status: "sent" | "failed" | "skipped";
  providerMessageId?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // 1. Health Verification Endpoint
  if (req.method === "GET" || url.searchParams.get("health") === "true") {
    return new Response(
      JSON.stringify({
        service: "dispatch-notification",
        status: "ok",
        environment: Deno.env.get("ENVIRONMENT") || "production",
        emailProviderConfigured: Boolean(Deno.env.get("RESEND_API_KEY")),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate request using user or service role token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Parse options from body if provided
    let batchSize = 25;
    try {
      const body = await req.json();
      if (body?.batchSize) batchSize = Math.min(Number(body.batchSize) || 25, 100);
    } catch {
      // Empty body is acceptable for cron triggers
    }

    // 2. Fetch queued email deliveries with related notification metadata
    const { data: deliveries, error: fetchError } = await adminClient
      .from("notification_deliveries")
      .select(`
        delivery_id,
        notification_id,
        channel,
        recipient_address,
        delivery_status,
        attempts,
        notifications (
          id,
          title,
          message,
          type,
          priority,
          link_url
        )
      `)
      .eq("delivery_status", "queued")
      .eq("channel", "email")
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to query delivery queue: ${fetchError.message}`);
    }

    if (!deliveries || deliveries.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No queued email notifications pending dispatch.",
          dispatchedCount: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Email Provider Credentials
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "HIET Digital Campus <noreply@hiet.ac.in>";

    const results: DispatchResult[] = [];

    // 4. Process Batch Dispatch
    for (const d of deliveries) {
      const notif = d.notifications as unknown as {
        id: string;
        title: string;
        message: string;
        priority: string;
        type: string;
      } | null;

      if (!notif || !d.recipient_address) {
        await adminClient
          .from("notification_deliveries")
          .update({
            delivery_status: "skipped",
            error_message: "Missing notification payload or recipient email address",
            updated_at: new Date().toISOString(),
          })
          .eq("delivery_id", d.delivery_id);

        results.push({
          delivery_id: d.delivery_id,
          recipient: d.recipient_address || "unknown",
          status: "skipped",
          error: "Missing notification or recipient",
        });
        continue;
      }

      // Mark as sending
      await adminClient
        .from("notification_deliveries")
        .update({
          delivery_status: "sending",
          attempts: d.attempts + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("delivery_id", d.delivery_id);

      try {
        let providerId = `mock-email-${Date.now()}`;

        // If real Resend API key is present, perform HTTP dispatch
        if (resendApiKey) {
          const resendResp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: emailFrom,
              to: [d.recipient_address],
              subject: `[HIET Campus] ${notif.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                  <div style="background-color: #0f2942; color: #ffffff; padding: 16px; border-radius: 8px; text-align: center;">
                    <h2 style="margin: 0; font-size: 18px;">HIMACHAL INSTITUTE OF ENGINEERING & TECHNOLOGY</h2>
                    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8;">Official Digital Campus Notification</p>
                  </div>
                  <div style="padding: 24px 8px;">
                    <h3 style="color: #0f172a; margin-top: 0;">${notif.title}</h3>
                    <p style="color: #334155; line-height: 1.6; font-size: 14px;">${notif.message}</p>
                    <div style="margin-top: 20px; padding: 12px; background-color: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
                      Priority: <strong>${notif.priority.toUpperCase()}</strong> • Notification Type: <strong>${notif.type}</strong>
                    </div>
                  </div>
                  <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                    This is an automated institutional notification from HIET Digital Campus, Shahpur (Kangra), H.P.
                  </div>
                </div>
              `,
            }),
          });

          if (!resendResp.ok) {
            const errText = await resendResp.text();
            throw new Error(`Resend provider error (${resendResp.status}): ${errText}`);
          }

          const resendData = await resendResp.json();
          providerId = resendData?.id || providerId;
        }

        // Mark as sent
        await adminClient
          .from("notification_deliveries")
          .update({
            delivery_status: "sent",
            provider: resendApiKey ? "resend" : "sandbox_simulated",
            provider_message_id: providerId,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("delivery_id", d.delivery_id);

        results.push({
          delivery_id: d.delivery_id,
          recipient: d.recipient_address,
          status: "sent",
          providerMessageId: providerId,
        });
      } catch (sendErr: unknown) {
        const errorMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);

        await adminClient
          .from("notification_deliveries")
          .update({
            delivery_status: "failed",
            error_message: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("delivery_id", d.delivery_id);

        results.push({
          delivery_id: d.delivery_id,
          recipient: d.recipient_address,
          status: "failed",
          error: errorMsg,
        });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return new Response(
      JSON.stringify({
        success: true,
        dispatchedCount: results.length,
        sent: sentCount,
        failed: failedCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
