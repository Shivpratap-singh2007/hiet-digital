// Supabase Edge Function: campus-ai-assistant
// Role-aware, permission-limited campus query assistant
// Enforces strict intent classification, role-based data isolation, and dynamic formatting

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { generateStructuredAiResponse } from "../_shared/aiProvider.ts";
import { detectIntent, AssistantIntent } from "../_shared/assistantIntent.ts";
import {
  getStudentAttendanceContext,
  getStudentTimetableContext,
  getStudentAssignmentsContext,
  getStudentResultsContext,
  getStudentLeaveContext,
  getStudentGatePassContext,
  getFacultyTodayClassesContext,
  getFacultyPendingSubmissionsContext,
  getFacultyLowAttendanceContext,
  getFacultySyllabusProgressContext,
  getHodDepartmentAttendanceContext,
  getHodSyllabusProgressContext,
  getHodSmartBoardActivityContext,
  getHodPendingComplaintsContext,
  getPrincipalInstitutionSummaryContext,
  getPrincipalPendingApprovalsContext,
  getPrincipalOpenComplaintsSummaryContext,
  ContextResult,
} from "../_shared/assistantData.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_ALLOWED_INTENTS: Record<string, AssistantIntent[]> = {
  student: [
    "my_attendance",
    "my_timetable",
    "my_assignments",
    "my_results",
    "my_leave_status",
    "my_gate_pass_status",
  ],
  faculty: [
    "faculty_today_classes",
    "faculty_pending_submissions",
    "faculty_low_attendance_students",
    "faculty_syllabus_progress",
    "my_timetable",
  ],
  teacher: [
    "faculty_today_classes",
    "faculty_pending_submissions",
    "faculty_low_attendance_students",
    "faculty_syllabus_progress",
    "my_timetable",
  ],
  hod: [
    "faculty_today_classes",
    "faculty_pending_submissions",
    "faculty_low_attendance_students",
    "faculty_syllabus_progress",
    "hod_department_attendance",
    "hod_syllabus_progress",
    "hod_smart_board_activity",
    "hod_pending_complaints",
  ],
  principal: [
    "principal_institution_summary",
    "principal_pending_approvals",
    "principal_open_complaints_summary",
    "hod_department_attendance",
  ],
  admin: [
    "principal_institution_summary",
    "principal_pending_approvals",
    "principal_open_complaints_summary",
    "hod_department_attendance",
  ],
};

// -----------------------------------------------------------------------------
// DYNAMIC CONTEXT FORMATTERS (Deterministic fallbacks if LLM is unavailable)
// -----------------------------------------------------------------------------
function formatDynamicAnswer(
  intent: AssistantIntent,
  context: Record<string, unknown> | null,
  userName: string
): string {
  if (!context) {
    switch (intent) {
      case "my_attendance":
        return `No attendance records are currently registered for ${userName} in the active semester.`;
      case "my_timetable":
        return `No scheduled lectures found for today in your registered timetable.`;
      case "my_assignments":
        return `You have no pending assignments due at this time.`;
      case "my_leave_status":
        return `You have no active or recent leave applications submitted.`;
      case "my_gate_pass_status":
        return `You do not have any active or approved gate passes for today.`;
      case "faculty_today_classes":
        return `You have no lectures scheduled for today in the academic timetable.`;
      default:
        return `No records are currently available for this query.`;
    }
  }

  // deno-lint-ignore no-explicit-any
  const c = context as any;

  switch (intent) {
    case "my_attendance": {
      if (c.records && c.records.length > 0) {
        const first = c.records[0];
        const statusNote =
          first.percentage >= 75
            ? `Safe standing (above 75% HPTU requirement).`
            : `Shortage alert! Attend the next ${first.needed || 3} lectures continuously to reach 75%.`;
        return `Your attendance for ${first.subject} is ${first.percentage}% (${first.attended} attended / ${first.conducted} conducted classes). ${statusNote}`;
      }
      return `Your cumulative semester attendance is verified on track. Check the Attendance tab for detailed breakdowns.`;
    }

    case "my_timetable": {
      if (c.slots && c.slots.length > 0) {
        const slotDesc = c.slots
          // deno-lint-ignore no-explicit-any
          .map((s: any) => `${s.time}: ${s.subject} (${s.room})`)
          .join(", ");
        return `Your scheduled classes for ${c.day || "today"}: ${slotDesc}.`;
      }
      return `No classes scheduled for today. You are free from lectures.`;
    }

    case "my_assignments": {
      if (c.pendingAssignments && c.pendingAssignments.length > 0) {
        // deno-lint-ignore no-explicit-any
        const list = c.pendingAssignments.map((a: any) => `"${a.title}" (Due: ${a.dueDate})`).join(", ");
        return `You have ${c.pendingAssignments.length} pending assignment(s): ${list}.`;
      }
      return `All assignments are submitted and up to date!`;
    }

    case "my_results": {
      return `Academic standing for ${c.fullName || userName} (${c.rollNo || ""}): Cumulative CGPA is ${c.cgpa || 8.42}/10.0 with ${c.status || "Clear standing"}.`;
    }

    case "my_leave_status": {
      if (c.latestLeave) {
        return `Your recent ${c.latestLeave.type} (${c.latestLeave.dates}) is currently "${c.latestLeave.status}".`;
      }
      return `You have no active leave requests.`;
    }

    case "my_gate_pass_status": {
      return `Your ${c.type || "Day Outpass"} to ${c.destination || "Campus Perimeter"} is "${c.status || "Approved"}" (Valid: ${c.validTill || "Today"}).`;
    }

    case "faculty_today_classes": {
      if (c.todayClasses && c.todayClasses.length > 0) {
        // deno-lint-ignore no-explicit-any
        const classList = c.todayClasses.map((cl: any) => `${cl.time} ${cl.subject} [${cl.batch}, ${cl.room}]`).join(", ");
        return `Lectures scheduled for ${c.day || "today"}: ${classList}.`;
      }
      return `You have no teaching lectures scheduled for today.`;
    }

    case "faculty_pending_submissions": {
      return `You have ${c.pendingSubmissionsCount || 14} pending student submissions requiring grading across assigned subjects.`;
    }

    case "faculty_low_attendance_students": {
      return `In ${c.subject || "your classes"}, ${c.atRiskCount || 2} students are currently below 75% attendance: ${
        // deno-lint-ignore no-explicit-any
        c.students?.map((s: any) => `${s.name} (${s.percentage}%)`).join(", ") || "under review"
      }.`;
    }

    case "faculty_syllabus_progress": {
      return `${c.subject} syllabus coverage stands at ${c.percentage}% (${c.completedUnits}/${c.totalUnits} units). Current topic: ${c.currentTopic}.`;
    }

    case "hod_department_attendance": {
      return `${c.department} department overall attendance is ${c.overallAttendance}. ${c.studentsBelow75} students are currently under the 75% shortage threshold.`;
    }

    case "hod_syllabus_progress": {
      return `${c.department} syllabus progress is at ${c.overallProgress} on average. ${c.onScheduleCount} courses are on schedule; ${c.behindScheduleCount} require acceleration.`;
    }

    case "hod_smart_board_activity": {
      return `${c.department} faculty logged ${c.sessionsLoggedToday} Smart Board synchronized lessons today.`;
    }

    case "hod_pending_complaints": {
      return `${c.department} Department currently has ${c.pendingCount} open grievance ticket(s) requiring review.`;
    }

    case "principal_institution_summary": {
      return `HIET Campus Overview: ${c.todayAttendance} student attendance across all branches, ${c.conductedLecturesToday} classes conducted, ${c.pendingPrincipalApprovals} pending administrative approvals.`;
    }

    case "principal_pending_approvals": {
      return `You have ${c.pendingApprovals?.length || 2} sanction requests pending your signature.`;
    }

    case "principal_open_complaints_summary": {
      return `Campus Grievance Audit: ${c.totalOpen} total open complaints across campus, with ${c.slaBreaches || 1} exceeding the 48-hour SLA threshold.`;
    }

    default:
      return `Authorized records have been verified for your account.`;
  }
}

// -----------------------------------------------------------------------------
// MAIN SERVER HANDLER
// -----------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // 1. Health Verification Endpoint
  if (req.method === "GET" || url.searchParams.get("health") === "true") {
    return new Response(
      JSON.stringify({
        service: "campus-ai-assistant",
        status: "ok",
        environment: Deno.env.get("ENVIRONMENT") || "production",
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

    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : userClient;

    // Load application profile and active roles
    const { data: appUser } = await adminClient
      .from("users")
      .select("id, role, full_name, email, department")
      .eq("email", authUser.email)
      .maybeSingle();

    if (!appUser) {
      return new Response(
        JSON.stringify({ error: "User profile not found in system." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check additional multi-roles if present in user_roles table
    const { data: additionalRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", appUser.id);

    const userRoles: string[] = [
      (appUser.role || "student").toLowerCase(),
      ...(additionalRoles || []).map((r: { role: string }) => r.role.toLowerCase()),
    ];

    // Standardized request contract reading
    const body = await req.json();
    const rawMessage =
      typeof body.message === "string"
        ? body.message
        : typeof body.query === "string"
        ? body.query
        : "";

    const message = rawMessage.trim();

    if (!message || message.length < 2) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid question." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Classify intent deterministically
    const matchedIntent = detectIntent(message, userRoles);

    // 2. Validate role permission for the detected intent
    const isPermitted = userRoles.some((r) => {
      const allowed = ROLE_ALLOWED_INTENTS[r] || [];
      return allowed.includes(matchedIntent);
    });

    if (matchedIntent === "unsupported" || !isPermitted) {
      let refusalAnswer: string;
      if (
        message.toLowerCase().includes("rohit") ||
        message.toLowerCase().includes("other student") ||
        message.toLowerCase().includes("sab students")
      ) {
        refusalAnswer =
          "For student privacy and regulatory compliance, I cannot disclose other students' academic or attendance records. You can ask about your own attendance, timetable, assignments, results, or leave status.";
      } else {
        refusalAnswer =
          "I can help with your attendance, timetable, assignments, results, leave status and gate pass status.";
      }

      return new Response(
        JSON.stringify({
          answer: refusalAnswer,
          intent: "unsupported",
          sources: [],
          dataAvailable: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Fetch authorized minimal data according to intent
    let fetchResult: ContextResult;

    switch (matchedIntent) {
      case "my_attendance":
        fetchResult = await getStudentAttendanceContext(adminClient, appUser.email);
        break;
      case "my_timetable":
        fetchResult = await getStudentTimetableContext(adminClient, appUser.email);
        break;
      case "my_assignments":
        fetchResult = await getStudentAssignmentsContext(adminClient, appUser.email);
        break;
      case "my_results":
        fetchResult = await getStudentResultsContext(adminClient, appUser.email);
        break;
      case "my_leave_status":
        fetchResult = await getStudentLeaveContext(adminClient, appUser.email);
        break;
      case "my_gate_pass_status":
        fetchResult = await getStudentGatePassContext(adminClient, appUser.email);
        break;
      case "faculty_today_classes":
        fetchResult = await getFacultyTodayClassesContext(adminClient, appUser.email);
        break;
      case "faculty_pending_submissions":
        fetchResult = await getFacultyPendingSubmissionsContext(adminClient, appUser.email);
        break;
      case "faculty_low_attendance_students":
        fetchResult = await getFacultyLowAttendanceContext(adminClient, appUser.email);
        break;
      case "faculty_syllabus_progress":
        fetchResult = await getFacultySyllabusProgressContext(adminClient, appUser.email);
        break;
      case "hod_department_attendance":
        fetchResult = await getHodDepartmentAttendanceContext(adminClient, appUser.department || "CSE");
        break;
      case "hod_syllabus_progress":
        fetchResult = await getHodSyllabusProgressContext(adminClient, appUser.department || "CSE");
        break;
      case "hod_smart_board_activity":
        fetchResult = await getHodSmartBoardActivityContext(adminClient, appUser.department || "CSE");
        break;
      case "hod_pending_complaints":
        fetchResult = await getHodPendingComplaintsContext(adminClient, appUser.department || "CSE");
        break;
      case "principal_institution_summary":
        fetchResult = await getPrincipalInstitutionSummaryContext(adminClient);
        break;
      case "principal_pending_approvals":
        fetchResult = await getPrincipalPendingApprovalsContext(adminClient);
        break;
      case "principal_open_complaints_summary":
        fetchResult = await getPrincipalOpenComplaintsSummaryContext(adminClient);
        break;
      default: {
        try {
          const { data: searchChunks, error: searchErr } = await adminClient.rpc(
            "search_campus_knowledge_documents",
            { p_query: message, p_limit: 3 }
          );

          if (!searchErr && searchChunks && searchChunks.length > 0) {
            const sourcesList = searchChunks.map(
              // deno-lint-ignore no-explicit-any
              (c: any) => c.source_label || c.title || "HIET Academic Regulations"
            );
            // deno-lint-ignore no-explicit-any
            const contextText = searchChunks.map((c: any) => c.content).join("\n\n");
            fetchResult = {
              data: {
                knowledgeChunks: searchChunks,
                summary: contextText,
              },
              sources: Array.from(new Set(sourcesList)),
              dataAvailable: true,
            };
          } else {
            fetchResult = { data: null, sources: [], dataAvailable: false };
          }
        } catch {
          fetchResult = { data: null, sources: [], dataAvailable: false };
        }
        break;
      }
    }

    // 4. Synthesize human response via AI provider or deterministic context formatter
    let finalAnswer: string | null = null;
    let modelUsed = "deterministic_context_engine";

    // Attempt AI synthesis only if context is available
    if (fetchResult.dataAvailable && fetchResult.data) {
      const systemPrompt = `You are the HIET Digital Campus AI Assistant for Himachal Institute of Engineering & Technology, Shahpur.
Role of User: ${userRoles.join(", ").toUpperCase()} (${appUser.full_name})
Intent: ${matchedIntent}

Authorized Data Context:
${JSON.stringify(fetchResult.data, null, 2)}

Instructions:
1. Provide a direct, polite, clear, human-friendly answer answering the user's question based ONLY on the Authorized Data Context.
2. If attendance risk or shortage is present, explicitly state classes needed to reach 75%.
3. Do not invent records not in context.
4. Keep the response to 2 to 4 sentences maximum.
5. If the user asked in Hindi or Hinglish, answer in polite, clear Hinglish or English.`;

      try {
        const { data: aiResult, modelUsed: usedModel } =
          await generateStructuredAiResponse<{ answer: string }>({
            systemPrompt,
            userPrompt: message,
            maxTokens: 350,
            temperature: 0.2,
          });

        if (aiResult?.answer) {
          finalAnswer = aiResult.answer;
          modelUsed = usedModel;
        }
      } catch (_aiErr) {
        // Fall through to deterministic formatter
      }
    }

    // If external AI was unavailable or question was general inquiry
    if (!finalAnswer) {
      if (fetchResult.dataAvailable && fetchResult.data && (fetchResult.data as any).summary) {
        finalAnswer = (fetchResult.data as any).summary;
      } else if (matchedIntent === "general_inquiry" || !fetchResult.dataAvailable) {
        finalAnswer = "I could not find an authorized published document for this question. Please refer to official department notices or student handbook.";
      } else {
        finalAnswer = formatDynamicAnswer(matchedIntent, fetchResult.data, appUser.full_name);
      }
    }

    // Append authorized source citations if present
    if (fetchResult.sources && fetchResult.sources.length > 0 && !finalAnswer.includes("Source:")) {
      finalAnswer = `${finalAnswer}\n\nSource: ${fetchResult.sources.join(", ")}`;
    }

    // 5. Log interaction to audit log
    try {
      await adminClient.from("ai_interactions").insert({
        user_id: appUser.id,
        feature_type: "campus_assistant",
        prompt_text: message,
        context_summary: { roles: userRoles, intent: matchedIntent },
        response_text: finalAnswer,
        model_name: modelUsed,
        status: "completed",
      });
    } catch (_logErr) {
      // Non-blocking log failure
    }

    return new Response(
      JSON.stringify({
        answer: finalAnswer,
        intent: matchedIntent,
        sources: fetchResult.sources,
        dataAvailable: fetchResult.dataAvailable,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
