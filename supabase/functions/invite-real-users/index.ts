// Supabase Edge Function: invite-real-users
// Secure server-side user invitation workflow using Supabase Auth Admin API
// Restricted strictly to Principal / Admin callers. Plaintext passwords are never accepted.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserInvitationItem {
  email: string;
  full_name: string;
  role: "student" | "teacher" | "hod";
  identifier: string; // roll_no or employee_code
  department_code?: string;
}

interface RequestPayload {
  invitations: UserInvitationItem[];
  dry_run?: boolean;
  confirmation_token?: string;
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

    // Create service role admin client for database checks & Auth Admin API
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
        JSON.stringify({ error: "Unauthorized: Only Principal or Admin may issue real user invitations." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request payload
    const payload: RequestPayload = await req.json();
    const invitations = payload.invitations || [];
    const isDryRun = Boolean(payload.dry_run);
    const confirmationToken = payload.confirmation_token;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      return new Response(
        JSON.stringify({ error: "No invitation records provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isDryRun && !confirmationToken) {
      return new Response(
        JSON.stringify({
          error: "Confirmation token is required for live execution. Run dry_run first.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const summary = {
      total: invitations.length,
      created: 0,
      alreadyExists: 0,
      inviteSent: 0,
      failed: 0,
      skipped: 0,
    };

    const results: Array<{
      email: string;
      role: string;
      identifier: string;
      status: "created" | "already_exists" | "invite_sent" | "failed" | "skipped";
      message?: string;
    }> = [];

    // 3. Process invitations batch
    for (const item of invitations) {
      const email = String(item.email || "").trim().toLowerCase();
      const role = String(item.role || "").trim().toLowerCase() as "student" | "teacher" | "hod";
      const identifier = String(item.identifier || "").trim().toUpperCase();
      const fullName = String(item.full_name || "").trim();
      const deptCode = String(item.department_code || "").trim().toUpperCase();

      if (!email || !email.includes("@")) {
        summary.failed++;
        results.push({ email, role, identifier, status: "failed", message: "Invalid email" });
        continue;
      }

      if (!["student", "teacher", "hod"].includes(role)) {
        summary.failed++;
        results.push({ email, role, identifier, status: "failed", message: "Disallowed role for bulk invite" });
        continue;
      }

      // Check if user already exists in public.users
      const { data: existingUser } = await adminClient
        .from("users")
        .select("id, email, supabase_auth_id")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        summary.alreadyExists++;
        results.push({
          email,
          role,
          identifier,
          status: "already_exists",
          message: "User profile already registered with this email",
        });
        continue;
      }

      if (isDryRun) {
        // In dry run, check master record link feasibility without modifying auth
        let masterFound = false;
        if (role === "student" && identifier) {
          const { data: st } = await adminClient
            .from("students_master")
            .select("id, roll_no")
            .eq("roll_no", identifier)
            .maybeSingle();
          masterFound = Boolean(st);
        } else if ((role === "teacher" || role === "hod") && identifier) {
          const { data: tc } = await adminClient
            .from("teachers_master")
            .select("id, faculty_id")
            .eq("faculty_id", identifier)
            .maybeSingle();
          masterFound = Boolean(tc);
        }

        summary.created++;
        results.push({
          email,
          role,
          identifier,
          status: "created",
          message: masterFound
            ? `Dry run: Ready to link with master record (${identifier})`
            : "Dry run: Ready (Note: master record not yet found)",
        });
        continue;
      }

      // LIVE RUN: Use Supabase Auth Admin API to invite user
      try {
        const { data: inviteRes, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: fullName,
            role,
            identifier,
            department: deptCode,
          },
        });

        if (inviteErr || !inviteRes.user) {
          // If auth user already exists in Supabase Auth but not in public.users
          if (inviteErr?.message?.toLowerCase().includes("already registered") || inviteErr?.message?.toLowerCase().includes("already exists")) {
            summary.alreadyExists++;
            results.push({ email, role, identifier, status: "already_exists", message: "Account already registered in Auth" });
          } else {
            summary.failed++;
            results.push({ email, role, identifier, status: "failed", message: inviteErr?.message || "Failed to issue auth invite" });
          }
          continue;
        }

        const authUserId = inviteRes.user.id;

        // Upsert public.users profile
        const { data: newProfile, error: profileErr } = await adminClient
          .from("users")
          .upsert(
            {
              email,
              name: fullName,
              full_name: fullName,
              role,
              department: deptCode || null,
              supabase_auth_id: authUserId,
              is_demo_account: false,
              data_environment: "production",
            },
            { onConflict: "email" }
          )
          .select("id")
          .single();

        if (profileErr || !newProfile) {
          summary.failed++;
          results.push({ email, role, identifier, status: "failed", message: `Auth invited but profile upsert failed: ${profileErr?.message}` });
          continue;
        }

        const publicUserId = newProfile.id;

        // Create user_roles mappings
        await adminClient.from("user_roles").upsert(
          { user_id: publicUserId, role },
          { onConflict: "user_id,role" }
        );

        if (role === "hod") {
          // Preserve teacher role alongside HOD role
          await adminClient.from("user_roles").upsert(
            { user_id: publicUserId, role: "teacher" },
            { onConflict: "user_id,role" }
          );
        }

        // Link with master records
        if (role === "student" && identifier) {
          await adminClient
            .from("students_master")
            .update({ user_id: publicUserId })
            .eq("roll_no", identifier);
        } else if ((role === "teacher" || role === "hod") && identifier) {
          await adminClient
            .from("teachers_master")
            .update({
              user_id: publicUserId,
              is_hod: role === "hod",
            })
            .eq("faculty_id", identifier);
        }

        summary.inviteSent++;
        summary.created++;
        results.push({ email, role, identifier, status: "invite_sent", message: "Invite sent successfully" });
      } catch (err: any) {
        summary.failed++;
        results.push({ email, role, identifier, status: "failed", message: err.message || "Unknown error" });
      }
    }

    // 4. Log Audit Entry
    await adminClient.from("audit_logs").insert({
      actor_id: callerProfile?.id || callerUser.id,
      action: isDryRun ? "USER_INVITATIONS_DRY_RUN" : "USER_INVITATIONS_CONFIRMED",
      target_type: "user_invitations",
      details: {
        total: summary.total,
        created: summary.created,
        already_exists: summary.alreadyExists,
        invite_sent: summary.inviteSent,
        failed: summary.failed,
        dry_run: isDryRun,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: isDryRun,
        summary,
        results,
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
