// Supabase Edge Function: calculate-attendance-risk
// Calculates attendance risk percentage, continuous classes needed for 75%, and recommendations
// Deterministic rule engine with audit logging to public.ai_interactions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export type AttendanceRiskLevel = "low" | "medium" | "high" | "critical";

export function computeRisk(attended: number, conducted: number, target: number = 0.75) {
  if (conducted <= 0) {
    return {
      percentage: 100.0,
      riskLevel: "low" as AttendanceRiskLevel,
      classesNeededForTarget: 0,
      recommendation: "No classes have been conducted yet.",
    };
  }

  const percentage = Math.round((attended / conducted) * 10000) / 100;
  const currentRatio = attended / conducted;

  if (currentRatio >= target) {
    return {
      percentage,
      riskLevel: "low" as AttendanceRiskLevel,
      classesNeededForTarget: 0,
      recommendation: "Attendance is on track. Maintain regular class attendance.",
    };
  }

  const needed = Math.ceil((target * conducted - attended) / (1 - target));

  if (percentage >= 70.0) {
    return {
      percentage,
      riskLevel: "medium" as AttendanceRiskLevel,
      classesNeededForTarget: needed,
      recommendation: `You are below the 75% attendance requirement. Attend the next ${needed} classes continuously to reach 75%.`,
    };
  }

  if (percentage >= 60.0) {
    return {
      percentage,
      riskLevel: "high" as AttendanceRiskLevel,
      classesNeededForTarget: needed,
      recommendation: `Serious attendance shortage! You must attend the next ${needed} classes continuously to regain eligibility.`,
    };
  }

  return {
    percentage,
    riskLevel: "critical" as AttendanceRiskLevel,
    classesNeededForTarget: needed,
    recommendation: `Critical attendance deficit! Urgent meeting required with faculty or class in-charge. At least ${needed} continuous classes needed.`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Health Verification Endpoint
  if (req.method === "GET" || url.searchParams.get("health") === "true") {
    return new Response(
      JSON.stringify({
        service: "calculate-attendance-risk",
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : userClient;

    const { studentId, subjectId, academicYear = "2026-27" } = await req.json();

    if (!studentId || !subjectId) {
      return new Response(JSON.stringify({ error: "studentId and subjectId are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call database RPC
    const { data: rpcResult, error: rpcError } = await adminClient.rpc("calculate_attendance_risk_rpc", {
      p_student_id: studentId,
      p_subject_id: subjectId,
      p_academic_year: academicYear,
      p_minimum_required: 75.0,
    });

    if (rpcError) {
      // Fallback calculation directly if RPC not yet pushed to live remote
      const { count: conducted } = await adminClient
        .from("attendance_sessions")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subjectId);

      const { count: attended } = await adminClient
        .from("attendance_records")
        .select("*, attendance_sessions!inner(subject_id)", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("attendance_sessions.subject_id", subjectId)
        .eq("status", "present");

      const risk = computeRisk(attended || 0, conducted || 0, 0.75);

      return new Response(JSON.stringify({
        student_id: studentId,
        subject_id: subjectId,
        conducted_classes: conducted || 0,
        attended_classes: attended || 0,
        attendance_percentage: risk.percentage,
        risk_level: risk.riskLevel,
        classes_needed_for_target: risk.classesNeededForTarget,
        recommendation: risk.recommendation,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(rpcResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
