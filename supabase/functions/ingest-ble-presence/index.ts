// Supabase Edge Function: ingest-ble-presence
// Purpose: Ingest BLE beacon proximity events from native Android/iOS companion app
// Note: Web browsers do NOT perform background BLE scanning. Companion app required.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", ""), {
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized user session." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { beaconCode, rssi, detectedAt, devicePlatform, consent } = body;

    // 1. Explicit Consent Check
    if (consent !== true) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Explicit user consent is required for BLE beacon proximity ingestion.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!beaconCode || typeof rssi !== "number") {
      return new Response(
        JSON.stringify({ success: false, message: "beaconCode and rssi values are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate Active Beacon
    const { data: beacon, error: beaconErr } = await supabaseClient
      .from("ble_beacons")
      .select("*, campus_zones(*)")
      .eq("beacon_code", beaconCode.trim())
      .eq("is_active", true)
      .single();

    if (beaconErr || !beacon) {
      return new Response(
        JSON.stringify({ success: false, message: "Beacon not found or deactivated in campus registry." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const zone = beacon.campus_zones;
    if (!zone || !zone.is_active) {
      return new Response(
        JSON.stringify({ success: false, message: "Associated zone is currently inactive." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Calculate Calibrated Proximity Confidence
    // Prompt specification:
    // RSSI >= -60 dBm: high proximity confidence
    // RSSI -61 to -75 dBm: medium proximity confidence
    // RSSI < -75 dBm: low confidence
    let confidence = 50.0;
    let confidenceBand = "low";
    if (rssi >= -60) {
      confidence = 90.0;
      confidenceBand = "high";
    } else if (rssi >= -75) {
      confidence = 75.0;
      confidenceBand = "medium";
    } else {
      confidence = 45.0;
      confidenceBand = "low";
    }

    // 4. Resolve User & Student ID
    const { data: userRec } = await supabaseClient
      .from("users")
      .select("id")
      .eq("supabase_auth_id", user.id)
      .single();

    const appUserId = userRec?.id || user.id;

    const { data: studentRec } = await supabaseClient
      .from("students_master")
      .select("id")
      .eq("user_id", appUserId)
      .maybeSingle();

    // 5. Insert Presence Event
    const { data: eventData, error: eventErr } = await supabaseClient
      .from("presence_events")
      .insert([
        {
          user_id: appUserId,
          student_id: studentRec?.id || null,
          zone_id: zone.zone_id,
          beacon_id: beacon.beacon_id,
          event_type: "ble_detected",
          detection_method: "ble",
          rssi: rssi,
          confidence_score: confidence,
          privacy_consent: true,
          metadata: {
            beacon_code: beacon.beacon_code,
            confidence_band: confidenceBand,
            device_platform: devicePlatform || "android",
            claim_type: "Area Proximity Only (Not exact room location)",
          },
          detected_at: detectedAt ? new Date(detectedAt).toISOString() : new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (eventErr) {
      console.error("Failed to insert BLE event:", eventErr);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to record BLE presence event." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        presence_event_id: eventData.presence_event_id,
        beacon_code: beacon.beacon_code,
        zone_id: zone.zone_id,
        zone_code: zone.zone_code,
        zone_name: zone.zone_name,
        confidence_score: confidence,
        confidence_band: confidenceBand,
        disclaimer: "Calibrated proximity detection. Not valid for automated disciplinary action.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(
      JSON.stringify({ success: false, message: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
