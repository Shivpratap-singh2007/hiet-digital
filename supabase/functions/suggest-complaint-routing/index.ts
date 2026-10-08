// Supabase Edge Function: suggest-complaint-routing
// Classifies student complaint description into category, assignee role, priority and explanation
// Human-in-the-loop: only provides recommendation, never submits automatically

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { generateStructuredAiResponse } from "../_shared/aiProvider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CATEGORIES = [
  "academic",
  "classroom",
  "lab",
  "infrastructure",
  "hostel",
  "it",
  "other",
] as const;

const ALLOWED_ASSIGNEE_ROLES = [
  "faculty",
  "class_incharge",
  "hod",
  "maintenance_staff",
  "lab_staff",
  "it_staff",
  "warden",
] as const;

const ALLOWED_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

interface ComplaintSuggestionResponse {
  category: string;
  assigneeRole: string;
  priority: string;
  confidence: number;
  reason: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : userClient;

    const { data: appUser } = await adminClient
      .from("users")
      .select("id, role, email")
      .eq("email", authUser.email)
      .maybeSingle();

    if (!appUser) {
      return new Response(JSON.stringify({ error: "App user profile not found." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { title, description } = body;

    if (!description || description.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Complaint description must be at least 20 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: max 30 requests/hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await adminClient
      .from("ai_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", appUser.id)
      .eq("feature_type", "complaint_routing")
      .gte("created_at", oneHourAgo);

    if (recentCount && recentCount >= 30) {
      return new Response(JSON.stringify({ error: "Rate limit reached: Maximum 30 routing suggestions per hour." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the AI Help Desk Classifier for Himachal Institute of Engineering & Technology (HIET), Shahpur.
Your job is to analyze student grievances or facility issues and recommend the appropriate department and role.

Allowed Categories:
- "infrastructure": Desks, fans, lights, building, civil, electricity, water, restrooms.
- "classroom": Projectors, smart board hardware, seating, chalkboard, room allocation.
- "lab": Lab computers, oscilloscopes, machines, chemicals, lab software, equipment.
- "it": Campus WiFi, portal login, email, server, network, software bugs.
- "hostel": Hostel mess, room issues, hot water, warden requests, curfew.
- "academic": Syllabus, internal marks, attendance grievance, timetable, faculty communication.
- "other": General inquiries or unclassified.

Allowed Assignee Roles:
- "maintenance_staff": Electrical, plumbing, carpenter, cleaning, infrastructure repairs.
- "lab_staff": Lab assistant, hardware upkeep in labs.
- "it_staff": Network administrator, portal support, systems.
- "warden": Hostel affairs.
- "faculty": Subject teachers.
- "class_incharge": Class mentor / coordinator.
- "hod": Head of Department (escalations or major academic issues).

Allowed Priorities:
- "low", "normal", "high", "urgent"

Respond strictly in JSON:
{
  "category": "infrastructure" | "classroom" | "lab" | "it" | "hostel" | "academic" | "other",
  "assigneeRole": "maintenance_staff" | "lab_staff" | "it_staff" | "warden" | "faculty" | "class_incharge" | "hod",
  "priority": "low" | "normal" | "high" | "urgent",
  "confidence": number (0 to 100),
  "reason": string (short 1-2 sentence explanation)
}`;

    const userPrompt = `Complaint Subject: ${title || "General Issue"}
Complaint Description:
${description}`;

    const { data: aiResult, modelUsed, error: aiError } = await generateStructuredAiResponse<ComplaintSuggestionResponse>({
      systemPrompt,
      userPrompt,
      maxTokens: 300,
      temperature: 0.1,
    });

    // Fallback if AI provider is unavailable
    if (aiError || !aiResult) {
      // Deterministic keyword fallback
      const descLower = description.toLowerCase();
      let fallbackCat = "other";
      let fallbackRole = "hod";
      let fallbackPri = "normal";
      let fallbackReason = "Categorized using default keyword heuristics.";

      if (descLower.includes("fan") || descLower.includes("light") || descLower.includes("water") || descLower.includes("room") || descLower.includes("bench")) {
        fallbackCat = "infrastructure";
        fallbackRole = "maintenance_staff";
        fallbackReason = "Keywords indicate a classroom/building facility issue.";
      } else if (descLower.includes("computer") || descLower.includes("lab") || descLower.includes("pc") || descLower.includes("software")) {
        fallbackCat = "lab";
        fallbackRole = "lab_staff";
        fallbackReason = "Keywords indicate laboratory computing hardware or software.";
      } else if (descLower.includes("wifi") || descLower.includes("portal") || descLower.includes("internet") || descLower.includes("login")) {
        fallbackCat = "it";
        fallbackRole = "it_staff";
        fallbackReason = "Keywords indicate an IT infrastructure or connectivity issue.";
      } else if (descLower.includes("marks") || descLower.includes("attendance") || descLower.includes("exam") || descLower.includes("subject")) {
        fallbackCat = "academic";
        fallbackRole = "class_incharge";
        fallbackReason = "Keywords indicate academic marks or attendance inquiry.";
      } else if (descLower.includes("hostel") || descLower.includes("mess") || descLower.includes("warden")) {
        fallbackCat = "hostel";
        fallbackRole = "warden";
        fallbackReason = "Keywords indicate hostel accommodation or mess issue.";
      }

      const fallbackResult: ComplaintSuggestionResponse = {
        category: fallbackCat,
        assigneeRole: fallbackRole,
        priority: fallbackPri,
        confidence: 70,
        reason: fallbackReason,
      };

      await adminClient.from("ai_interactions").insert({
        user_id: appUser.id,
        feature_type: "complaint_routing",
        prompt_text: description.slice(0, 200),
        context_summary: { title, length: description.length, fallbackUsed: true },
        response_text: fallbackResult.reason,
        structured_response: fallbackResult,
        model_name: "rule_heuristic_fallback",
        status: "completed",
      });

      return new Response(JSON.stringify({
        data: fallbackResult,
        model: "rule_heuristic_fallback",
        isFallback: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize against allowlists
    const finalCategory = ALLOWED_CATEGORIES.includes(aiResult.category as any)
      ? aiResult.category
      : "other";
    const finalAssignee = ALLOWED_ASSIGNEE_ROLES.includes(aiResult.assigneeRole as any)
      ? aiResult.assigneeRole
      : "hod";
    const finalPriority = ALLOWED_PRIORITIES.includes(aiResult.priority as any)
      ? aiResult.priority
      : "normal";
    const finalConfidence = typeof aiResult.confidence === "number" && aiResult.confidence >= 0 && aiResult.confidence <= 100
      ? Math.round(aiResult.confidence)
      : 80;

    const validatedResult: ComplaintSuggestionResponse = {
      category: finalCategory,
      assigneeRole: finalAssignee,
      priority: finalPriority,
      confidence: finalConfidence,
      reason: aiResult.reason || "Classified according to campus guidelines.",
    };

    await adminClient.from("ai_interactions").insert({
      user_id: appUser.id,
      feature_type: "complaint_routing",
      prompt_text: description.slice(0, 200),
      context_summary: { title, length: description.length },
      response_text: validatedResult.reason,
      structured_response: validatedResult,
      model_name: modelUsed,
      status: "completed",
    });

    return new Response(JSON.stringify({
      data: validatedResult,
      model: modelUsed,
      isFallback: false,
    }), {
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
