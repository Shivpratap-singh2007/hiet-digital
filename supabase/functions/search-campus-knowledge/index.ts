// Supabase Edge Function: search-campus-knowledge
// Purpose: Permission-filtered RAG over published campus academic documents only
// Input: { query: string, departmentId?: string, subjectId?: string }
// Output: { answer: string, sources: Array<{ title, sourceType, pageOrChunk, actionUrl }> }

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

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    let appUserDepartment: string | null = null;
    let appUserRole = "student";

    // Authenticate if header provided
    if (authHeader) {
      const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", ""), {
        auth: { persistSession: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: userRec } = await supabaseClient
          .from("users")
          .select("role, department_id")
          .eq("supabase_auth_id", user.id)
          .maybeSingle();

        if (userRec) {
          appUserRole = userRec.role;
          appUserDepartment = userRec.department_id;
        }
      }
    }

    const body = await req.json();
    const { query, departmentId, subjectId } = body;

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ answer: "Please provide a valid query.", sources: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch published documents permitted for this user
    let docQuery = supabaseClient
      .from("knowledge_documents")
      .select("document_id, title, source_type, file_path, visibility_scope, department_id, subject_id")
      .eq("is_published", true);

    // Permission scope filtering
    if (!["principal", "managing_director", "admin"].includes(appUserRole)) {
      if (appUserDepartment) {
        docQuery = docQuery.or(
          `visibility_scope.in.(public,institution),and(visibility_scope.eq.department,department_id.eq.${appUserDepartment})`
        );
      } else {
        docQuery = docQuery.in("visibility_scope", ["public", "institution"]);
      }
    }

    if (departmentId) {
      docQuery = docQuery.eq("department_id", departmentId);
    }
    if (subjectId) {
      docQuery = docQuery.eq("subject_id", subjectId);
    }

    const { data: permittedDocs, error: docError } = await docQuery;
    if (docError || !permittedDocs || permittedDocs.length === 0) {
      return new Response(
        JSON.stringify({
          answer: `No published campus documents found matching your criteria.`,
          sources: [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const docIds = permittedDocs.map((d) => d.document_id);

    // 2. Query matching chunks
    const searchTerms = query.toLowerCase().split(/\s+/).filter((t: string) => t.length > 3);
    const { data: chunks } = await supabaseClient
      .from("knowledge_chunks")
      .select("document_id, chunk_index, content")
      .in("document_id", docIds)
      .limit(50);

    // Score chunks by keyword matches
    const scored = (chunks || []).map((c) => {
      const contentLower = c.content.toLowerCase();
      let score = 0;
      for (const term of searchTerms) {
        if (contentLower.includes(term)) score += 1;
      }
      return { ...c, score };
    }).filter((c) => c.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    const docMap = new Map(permittedDocs.map((d) => [d.document_id, d]));

    const sources = scored.map((c) => {
      const doc = docMap.get(c.document_id);
      let actionUrl = "/app/syllabus";
      if (doc?.source_type === "pyq") actionUrl = "/app/pyqs";
      else if (doc?.source_type === "policy") actionUrl = "/app/leave";
      else if (doc?.source_type === "calendar") actionUrl = "/app/calendar";
      else if (doc?.source_type === "handbook") actionUrl = "/app/hostel-outpass";

      return {
        title: doc?.title || "Academic Document",
        sourceType: doc?.source_type || "syllabus",
        pageOrChunk: `Section / Chunk ${c.chunk_index + 1}`,
        actionUrl,
        snippet: c.content.slice(0, 200) + "...",
      };
    });

    const answer = sources.length > 0
      ? `Found ${sources.length} published references regarding "${query}". Please review the verified academic sources below.`
      : `No published document matches were found for "${query}". Ensure keywords match official syllabus or handbook terms.`;

    return new Response(
      JSON.stringify({ answer, sources }),
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
