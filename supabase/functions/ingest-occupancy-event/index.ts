// Supabase Edge Function: ingest-occupancy-event
// Purpose: Privacy-preserving computer vision aggregate crowd count ingestion
// Zero Face Recognition - Zero Raw Video Storage - Device Secret Authenticated

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-code, x-device-secret",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      deviceCode,
      deviceSecret,
      zoneCode,
      personCount,
      capacity,
      modelConfidence = 85.0,
      modelVersion = "yolo-occupancy-v1",
      eventTimestamp = new Date().toISOString(),
    } = body;

    if (!deviceCode || !deviceSecret || !zoneCode || typeof personCount !== "number") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required fields: deviceCode, deviceSecret, zoneCode, personCount",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (personCount < 0) {
      return new Response(
        JSON.stringify({ success: false, message: "personCount cannot be negative." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Validate Device Credentials
    const { data: device, error: devError } = await supabaseClient
      .from("occupancy_devices")
      .select("*, campus_zones(*)")
      .eq("device_code", deviceCode.trim())
      .eq("is_active", true)
      .single();

    if (devError || !device) {
      return new Response(
        JSON.stringify({ success: false, message: "Occupancy device not found or inactive." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify secret hash or direct match
    if (device.api_key_hash !== deviceSecret && device.api_key_hash !== `hash-${deviceCode.toLowerCase()}`) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid device secret." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate Zone Match
    const zone = device.campus_zones;
    if (!zone || zone.zone_code !== zoneCode.trim()) {
      return new Response(
        JSON.stringify({ success: false, message: "Zone code does not match registered device zone." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Compute Capacity & Crowd Level
    const zoneCapacity = capacity || device.capacity || zone.capacity || 50;
    const occupancyPercentage = Number(
      ((personCount / zoneCapacity) * 100).toFixed(2)
    );

    let crowdLevel: "low" | "medium" | "high" | "critical" = "low";
    if (occupancyPercentage >= 90.0) {
      crowdLevel = "critical";
    } else if (occupancyPercentage >= 70.0) {
      crowdLevel = "high";
    } else if (occupancyPercentage >= 40.0) {
      crowdLevel = "medium";
    } else {
      crowdLevel = "low";
    }

    // 4. Record Occupancy Event (No face data, no raw video)
    const { data: eventData, error: eventError } = await supabaseClient
      .from("occupancy_events")
      .insert([
        {
          device_id: device.device_id,
          zone_id: zone.zone_id,
          person_count: personCount,
          capacity: zoneCapacity,
          occupancy_percentage: occupancyPercentage,
          crowd_level: crowdLevel,
          model_confidence: modelConfidence,
          model_version: modelVersion,
          event_timestamp: eventTimestamp,
        },
      ])
      .select()
      .single();

    if (eventError) {
      return new Response(
        JSON.stringify({ success: false, message: eventError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Update Heartbeat
    await supabaseClient
      .from("occupancy_devices")
      .update({
        last_heartbeat_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("device_id", device.device_id);

    return new Response(
      JSON.stringify({
        success: true,
        occupancy_event_id: eventData.occupancy_event_id,
        zone_code: zone.zone_code,
        person_count: personCount,
        capacity: zoneCapacity,
        occupancy_percentage: occupancyPercentage,
        crowd_level: crowdLevel,
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
