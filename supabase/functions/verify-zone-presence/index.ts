// Supabase Edge Function: verify-zone-presence
// Purpose: One-time voluntary verification of campus zone presence (Non-continuous tracking)
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HIET Campus Center Coordinates (broad boundary check)
const CAMPUS_CENTER = { lat: 32.2195, lng: 76.3235 };
const MAX_CAMPUS_RADIUS_METERS = 1000; // 1km broad boundary - never room-level claim

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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
    const { zoneToken, latitude, longitude, accuracyMeters, consent } = body;

    // 1. Validate Consent
    if (consent !== true) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Explicit consent is required to verify campus zone presence.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!zoneToken || typeof zoneToken !== "string") {
      return new Response(
        JSON.stringify({ success: false, message: "A valid zoneToken is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate QR Token
    const { data: tokenRecord, error: tokenError } = await supabaseClient
      .from("zone_qr_tokens")
      .select("*, campus_zones(*)")
      .eq("public_token", zoneToken.trim())
      .eq("is_active", true)
      .single();

    if (tokenError || !tokenRecord) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid or inactive Zone QR token." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Dynamic Expiry Check
    if (tokenRecord.is_dynamic && tokenRecord.expires_at) {
      if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
        return new Response(
          JSON.stringify({ success: false, message: "This dynamic Zone QR token has expired." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const zone = tokenRecord.campus_zones;
    if (!zone || !zone.is_active) {
      return new Response(
        JSON.stringify({ success: false, message: "The associated campus zone is currently inactive." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Optional Campus Boundary Check (Broad campus radius, never room-level)
    let confidence = 95.0;
    if (latitude && longitude) {
      const dist = calculateDistanceMeters(latitude, longitude, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
      if (dist > MAX_CAMPUS_RADIUS_METERS) {
        confidence = 65.0; // reduced confidence if far from campus center
      }
    }

    // 5. Look up User & Student Master Record
    const { data: userRecord } = await supabaseClient
      .from("users")
      .select("id")
      .eq("supabase_auth_id", user.id)
      .single();

    const appUserId = userRecord?.id || user.id;

    const { data: studentRecord } = await supabaseClient
      .from("students_master")
      .select("id")
      .eq("user_id", appUserId)
      .maybeSingle();

    // 6. Record Presence Event
    const { data: eventData, error: eventError } = await supabaseClient
      .from("presence_events")
      .insert([
        {
          user_id: appUserId,
          student_id: studentRecord?.id || null,
          zone_id: zone.zone_id,
          event_type: "zone_checkin",
          detection_method: tokenRecord.is_dynamic ? "dynamic_qr" : "static_zone_qr",
          latitude: latitude || null,
          longitude: longitude || null,
          location_accuracy_meters: accuracyMeters || null,
          confidence_score: confidence,
          privacy_consent: true,
          metadata: {
            zone_code: zone.zone_code,
            zone_name: zone.zone_name,
            verification_note: "Voluntary QR zone verification",
          },
          detected_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (eventError) {
      console.error("Failed to insert presence event:", eventError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to record presence event." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        presence_event_id: eventData.presence_event_id,
        zone_id: zone.zone_id,
        zone_code: zone.zone_code,
        zone_name: zone.zone_name,
        room_code: zone.room_code,
        confidence_score: confidence,
        detected_at: eventData.detected_at,
        message: `Verified at ${zone.zone_name}`,
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
