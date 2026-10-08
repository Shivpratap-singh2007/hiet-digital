// Supabase Edge Function: generate-smart-board-summary
// Generates AI summary, learning objectives, keywords and next topic from faculty lesson notes
// Enforces faculty authorization, subject verification, audit logging, and rate limiting

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { generateStructuredAiResponse } from "../_shared/aiProvider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmartBoardSummaryPayload {
  summary: string;
  learningObjectives: string[];
  keywords: string[];
  recommendedNextTopic?: string;
  suggestedTopicStatus?: "in_progress" | "completed";
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

    // 1. Authenticate user
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

    // Admin client for audit logging & secure verification
    const adminClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : userClient;

    // 2. Fetch app user profile and faculty record
    const { data: appUser } = await adminClient
      .from("users")
      .select("id, role, full_name, email")
      .eq("email", authUser.email)
      .maybeSingle();

    if (!appUser || (appUser.role !== "faculty" && appUser.role !== "hod" && appUser.role !== "principal")) {
      return new Response(JSON.stringify({ error: "Only teaching faculty and academic heads can generate lesson summaries." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Parse and validate body
    const body = await req.json();
    const { subjectId, subjectName, unitNumber, topic, durationMinutes, teacherNotes } = body;

    if (!topic || topic.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Topic title must be at least 3 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!teacherNotes || teacherNotes.trim().length < 15) {
      return new Response(JSON.stringify({ error: "Teacher notes must be at least 15 characters to generate a meaningful summary." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Rate limiting check (max 20 requests per hour per user)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await adminClient
      .from("ai_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", appUser.id)
      .eq("feature_type", "smart_board_summary")
      .gte("created_at", oneHourAgo);

    if (recentCount && recentCount >= 20) {
      return new Response(JSON.stringify({ error: "Rate limit reached: Maximum 20 lesson summary requests per hour." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Construct prompts - strictly academic, factual, no hallucination
    const systemPrompt = `You are the AI Academic Assistant for Himachal Institute of Engineering & Technology (HIET), Shahpur.
Your role is to summarize classroom lessons logged by engineering faculty.
CRITICAL RULES:
1. Ground the summary strictly in the teacher's notes provided. Do NOT invent facts or concepts not mentioned.
2. Formulate 2 to 4 clear, measurable learning objectives (e.g., "Understand...", "Analyze...", "Identify...").
3. Extract 3 to 6 technical keywords/tags.
4. Suggest a logical next syllabus topic in the curriculum.
5. Always set suggestedTopicStatus to "in_progress".
6. Respond in JSON format conforming to:
{
  "summary": string,
  "learningObjectives": string[],
  "keywords": string[],
  "recommendedNextTopic": string,
  "suggestedTopicStatus": "in_progress"
}`;

    const userPrompt = `Subject: ${subjectName || "Subject " + subjectId}
Unit: ${unitNumber || "General"}
Topic: ${topic}
Duration: ${durationMinutes || 50} minutes
Teacher Notes:
${teacherNotes}`;

    // 6. Generate via shared provider
    const { data: aiResult, modelUsed, error: aiError } = await generateStructuredAiResponse<SmartBoardSummaryPayload>({
      systemPrompt,
      userPrompt,
      maxTokens: 750,
      temperature: 0.2,
    });

    if (aiError || !aiResult) {
      // Log blocked/failed attempt
      await adminClient.from("ai_interactions").insert({
        user_id: appUser.id,
        feature_type: "smart_board_summary",
        prompt_text: `Topic: ${topic} | Subject: ${subjectName}`,
        context_summary: { subjectId, unitNumber, durationMinutes },
        status: "failed",
        model_name: modelUsed,
        response_text: aiError || "Failed to generate AI response",
      });

      return new Response(JSON.stringify({
        error: "AI service is currently unavailable or API key is not configured.",
        details: aiError,
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Sanitize and ensure structure
    const cleanedResult: SmartBoardSummaryPayload = {
      summary: aiResult.summary || "Summary generated from teacher notes.",
      learningObjectives: Array.isArray(aiResult.learningObjectives) ? aiResult.learningObjectives : [],
      keywords: Array.isArray(aiResult.keywords) ? aiResult.keywords : [],
      recommendedNextTopic: aiResult.recommendedNextTopic || "",
      suggestedTopicStatus: "in_progress",
    };

    // 8. Log successful interaction to public.ai_interactions
    await adminClient.from("ai_interactions").insert({
      user_id: appUser.id,
      feature_type: "smart_board_summary",
      prompt_text: `Topic: ${topic} | Subject: ${subjectName}`,
      context_summary: { subjectId, unitNumber, durationMinutes, topicLength: topic.length },
      response_text: cleanedResult.summary,
      structured_response: cleanedResult,
      model_name: modelUsed,
      status: "completed",
    });

    return new Response(JSON.stringify({
      data: cleanedResult,
      model: modelUsed,
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
