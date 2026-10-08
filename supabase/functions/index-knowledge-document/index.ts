// Supabase Edge Function: index-knowledge-document
// Purpose: Securely chunk and index published academic documents (Syllabus, PYQs, Handbooks, Policies)
// Strict Privacy Guarantee: Zero indexing of private records (medical, complaints, marks, leave)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISALLOWED_SOURCE_TYPES = [
  "medical",
  "assignment_submission",
  "leave_document",
  "complaint",
  "marksheets",
  "certificate",
  "attendance_record",
  "private_file"
];

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
        JSON.stringify({ success: false, message: "Unauthorized." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Principal, Admin or HOD role
    const { data: userRec } = await supabaseClient
      .from("users")
      .select("id, role, department_id")
      .eq("supabase_auth_id", user.id)
      .single();

    if (!userRec || !["principal", "managing_director", "admin", "hod"].includes(userRec.role)) {
      return new Response(
        JSON.stringify({ success: false, message: "Only academic administrators or HODs may index knowledge documents." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      title,
      sourceType,
      sourceId,
      departmentId,
      subjectId,
      visibilityScope = "institution",
      rawText,
      filePath,
    } = body;

    // Strict boundary enforcement
    if (DISALLOWED_SOURCE_TYPES.includes(String(sourceType).toLowerCase())) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Privacy policy violation: ${sourceType} cannot be indexed in campus RAG.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!title || !rawText || rawText.trim().length < 20) {
      return new Response(
        JSON.stringify({ success: false, message: "Valid title and text content (>20 characters) required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create Knowledge Document Entry
    const { data: docData, error: docError } = await supabaseClient
      .from("knowledge_documents")
      .insert([
        {
          title,
          source_type: sourceType,
          source_id: sourceId || null,
          department_id: departmentId || userRec.department_id || null,
          subject_id: subjectId || null,
          visibility_scope: visibilityScope,
          file_path: filePath || null,
          is_published: true,
          created_by_user_id: userRec.id,
        },
      ])
      .select()
      .single();

    if (docError) {
      return new Response(
        JSON.stringify({ success: false, message: docError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Text Chunking (sliding window ~500 chars with 50 chars overlap)
    const chunkSize = 500;
    const overlap = 50;
    const chunks: string[] = [];
    let start = 0;
    while (start < rawText.length) {
      const end = Math.min(start + chunkSize, rawText.length);
      chunks.push(rawText.substring(start, end).trim());
      if (end === rawText.length) break;
      start += chunkSize - overlap;
    }

    // 3. Insert Chunks
    const chunkRows = chunks.map((content, idx) => ({
      document_id: docData.document_id,
      chunk_index: idx,
      content,
      token_count: Math.round(content.length / 4),
    }));

    const { error: chunkError } = await supabaseClient
      .from("knowledge_chunks")
      .insert(chunkRows);

    if (chunkError) {
      console.warn("Error inserting chunks:", chunkError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_id: docData.document_id,
        chunks_indexed: chunks.length,
        visibility_scope: visibilityScope,
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
