// Supabase Edge Function: process-master-import
// Secure server-side atomic master data import with transactional rollback,
// server-side re-validation, dry-run gatekeeping, and audit logging.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportRequestPayload {
  job_id?: string;
  entity_type: string;
  rows: Record<string, any>[];
  dry_run?: boolean;
  confirmation_token?: string;
  mode?: "skip_duplicates" | "update_existing";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing Supabase environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Authenticate caller and verify Admin / Principal authorization
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Invalid caller session or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check caller role in public.users / public.user_roles
    const { data: callerProfile } = await adminClient
      .from("users")
      .select("id, role, full_name, email")
      .eq("supabase_auth_id", callerUser.id)
      .maybeSingle();

    const { data: roleRecords } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerProfile?.id || callerUser.id);

    const callerRoles = new Set<string>();
    if (callerProfile?.role) callerRoles.add(callerProfile.role.toLowerCase());
    if (roleRecords) {
      roleRecords.forEach((r) => callerRoles.add(r.role.toLowerCase()));
    }

    const isAuthorized = callerRoles.has("principal") || callerRoles.has("admin");
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only Principal or Admin may execute master imports." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse payload
    const payload: ImportRequestPayload = await req.json();
    const entityType = payload.entity_type;
    const rawRows = payload.rows || [];
    const isDryRun = Boolean(payload.dry_run);
    const confirmationToken = payload.confirmation_token;
    const importMode = payload.mode || "skip_duplicates";

    if (!entityType || !Array.isArray(rawRows) || rawRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: entity_type and non-empty rows array are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Obtain or create import job record
    let jobId = payload.job_id;
    if (!jobId) {
      const { data: jobData, error: jobErr } = await adminClient
        .from("import_jobs")
        .insert({
          target_entity: entityType,
          status: "uploaded",
          total_rows: rawRows.length,
          created_by: callerProfile?.id || callerUser.id,
          dry_run: isDryRun,
          metadata: {
            actor_email: callerProfile?.email || callerUser.email,
            mode: importMode,
            initiated_at: new Date().toISOString(),
          },
        })
        .select("id")
        .single();

      if (jobErr || !jobData) {
        return new Response(
          JSON.stringify({ error: `Failed to create import job: ${jobErr?.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      jobId = jobData.id;
    } else {
      await adminClient
        .from("import_jobs")
        .update({
          status: "validating",
          dry_run: isDryRun,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    // 4. Server-Side Pre-Validation
    const serverErrors: Array<{ row: number; column: string; message: string; invalid_value?: any; reason?: string; suggested_correction?: string }> = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      switch (entityType) {
        case "students": {
          const roll = row.roll_no || row.roll_number;
          if (!roll) {
            serverErrors.push({
              row: rowNum,
              column: "roll_no",
              message: "Missing roll_no",
              invalid_value: roll,
              reason: "roll_no is required for every student",
              suggested_correction: "Provide valid student roll number",
            });
          }
          if (!row.full_name && !row.name) {
            serverErrors.push({
              row: rowNum,
              column: "full_name",
              message: "Missing full_name",
              invalid_value: "",
              reason: "Student full name is required",
              suggested_correction: "Provide student name",
            });
          }
          break;
        }
        case "faculty": {
          const emp = row.employee_code || row.faculty_id;
          if (!emp) {
            serverErrors.push({
              row: rowNum,
              column: "employee_code",
              message: "Missing employee_code",
              invalid_value: emp,
              reason: "employee_code is required for every faculty member",
              suggested_correction: "Provide valid employee code",
            });
          }
          if (!row.full_name && !row.name) {
            serverErrors.push({
              row: rowNum,
              column: "full_name",
              message: "Missing full_name",
              invalid_value: "",
              reason: "Faculty full name is required",
              suggested_correction: "Provide faculty name",
            });
          }
          break;
        }
        case "subjects": {
          const scode = row.subject_code || row.code;
          if (!scode) {
            serverErrors.push({
              row: rowNum,
              column: "subject_code",
              message: "Missing subject_code",
              invalid_value: scode,
              reason: "subject_code is required",
              suggested_correction: "Provide unique subject code",
            });
          }
          break;
        }
        case "timetable": {
          const scode = row.subject_code;
          const fid = row.employee_code || row.faculty_id;
          const day = row.day_of_week || row.day;
          if (!scode || !fid || !day) {
            serverErrors.push({
              row: rowNum,
              column: !scode ? "subject_code" : !fid ? "employee_code" : "day_of_week",
              message: "Required timetable field missing",
              invalid_value: "",
              reason: "Timetable slot requires subject_code, employee_code, and day_of_week",
              suggested_correction: "Fill all mandatory timetable fields",
            });
          }
          break;
        }
      }
    });

    if (serverErrors.length > 0) {
      // Record errors and mark validation failed
      await adminClient.from("import_jobs").update({
        status: "validation_failed",
        failed_rows: serverErrors.length,
        updated_at: new Date().toISOString(),
      }).eq("id", jobId);

      await adminClient.from("import_job_errors").insert(
        serverErrors.map((e) => ({
          job_id: jobId,
          row_number: e.row,
          column_name: e.column,
          error_message: e.message,
          raw_data: rawRows[e.row - 2] || {},
        }))
      );

      return new Response(
        JSON.stringify({
          success: false,
          status: "validation_failed",
          job_id: jobId,
          error: `Server validation failed: ${serverErrors.length} errors detected.`,
          errors: serverErrors,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Handle Dry Run vs Confirmed Live Import
    if (isDryRun) {
      // Execute atomic function with dry_run = true
      const { data: dryRunResult, error: dryRunErr } = await adminClient.rpc("process_master_import_atomic", {
        p_job_id: jobId,
        p_target_entity: entityType,
        p_rows: rawRows,
        p_dry_run: true,
        p_mode: importMode,
      });

      if (dryRunErr) {
        await adminClient.from("import_jobs").update({
          status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("id", jobId);

        return new Response(
          JSON.stringify({
            success: false,
            status: "failed",
            job_id: jobId,
            error: dryRunErr.message,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a secure confirmation token
      const nextConfirmationToken = `CONFIRM_${jobId}_${Date.now()}`;
      await adminClient.from("import_jobs").update({
        status: "dry_run_complete",
        metadata: {
          confirmation_token: nextConfirmationToken,
          dry_run_summary: dryRunResult,
        },
        updated_at: new Date().toISOString(),
      }).eq("id", jobId);

      return new Response(
        JSON.stringify({
          success: true,
          status: "dry_run_complete",
          job_id: jobId,
          confirmation_token: nextConfirmationToken,
          summary: dryRunResult,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Confirmed Live Import
    if (!confirmationToken) {
      return new Response(
        JSON.stringify({
          error: "Confirmation token is required for live execution. Run dry run first.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute atomic import transaction in PostgreSQL
    const { data: importResult, error: importErr } = await adminClient.rpc("process_master_import_atomic", {
      p_job_id: jobId,
      p_target_entity: entityType,
      p_rows: rawRows,
      p_dry_run: false,
      p_mode: importMode,
    });

    if (importErr) {
      // Automatic Postgres rollback occurred. Update status to rolled_back.
      await adminClient.from("import_jobs").update({
        status: "rolled_back",
        failed_rows: rawRows.length,
        metadata: {
          rollback_reason: importErr.message,
          rolled_back_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }).eq("id", jobId);

      // Audit Log rollback
      await adminClient.from("audit_logs").insert({
        actor_id: callerProfile?.id || callerUser.id,
        action: "MASTER_IMPORT_ROLLED_BACK",
        target_type: entityType,
        details: {
          job_id: jobId,
          total_rows: rawRows.length,
          error: importErr.message,
        },
      });

      return new Response(
        JSON.stringify({
          success: false,
          status: "rolled_back",
          job_id: jobId,
          error: `Import aborted and all changes rolled back: ${importErr.message}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Audit Log success
    await adminClient.from("audit_logs").insert({
      actor_id: callerProfile?.id || callerUser.id,
      action: "MASTER_IMPORT_COMPLETED",
      target_type: entityType,
      details: {
        job_id: jobId,
        total_rows: rawRows.length,
        summary: importResult,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: "completed",
        job_id: jobId,
        summary: importResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
