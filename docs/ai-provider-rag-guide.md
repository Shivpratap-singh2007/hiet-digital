# HIET DIGITAL CAMPUS — AI ASSISTANT & RAG ARCHITECTURE GUIDE
**Classification:** Generative AI Infrastructure & Security Protocol  
**Target Audience:** Machine Learning Engineers, Backend Developers, Security Officers  

---

## 1. System Overview & The "Repeated Answer" Resolution

Prior to the production readiness fix, users occasionally experienced repeated responses when asking distinct questions.

### Root Cause:
1. Hardcoded frontend regex rules routed unhandled queries to a static general fallback message.
2. The Edge Function lacked dynamic fallback search over authorized academic publications.

### Resolution Implemented:
1. **Dynamic Intent Router (`src/lib/assistantIntents.ts`):** Parses exact queries for timetable, attendance, marks, fees, leaves, and syllabus keywords.
2. **Deterministic Data Grounding:** Academic queries (e.g. *"What is my attendance?"*) execute real-time authenticated Supabase RPCs scoped strictly to `auth.uid()`.
3. **Retrieval-Augmented Generation (RAG):** General campus inquiries (e.g. *"What is the passing criteria for Semester 5?"*, *"What are the college timings?"*) query indexed bylaws via `public.search_campus_knowledge_documents`.
4. **LLM Provider Gateway (`_shared/aiProvider.ts`):** Synthesizes grounded answers using official Google Gemini or OpenAI models, appending citations.

---

## 2. Server-Side Provider Configuration

No AI provider API keys are ever bundled or exposed in frontend code (`VITE_`). All keys exist solely inside Supabase Edge Function secrets.

### Supported Providers:
- **Google Gemini (Recommended):** `gemini-1.5-flash` / `gemini-1.5-pro`
- **OpenAI:** `gpt-4.1-mini` / `gpt-4o`

### Setting Secrets in Supabase:
```bash
# Recommended: Google Gemini
supabase secrets set AI_PROVIDER=gemini
supabase secrets set AI_MODEL=gemini-1.5-flash
supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...your_gemini_key

# Alternative: OpenAI
supabase secrets set AI_PROVIDER=openai
supabase secrets set AI_MODEL=gpt-4.1-mini
supabase secrets set OPENAI_API_KEY=sk-...your_openai_key
```

---

## 3. RAG Knowledge Search Architecture

Migration `supabase/migrations/20261009000005_add_ai_knowledge_search.sql` provisions the institutional knowledge store:

```sql
SELECT title, snippet, source_url, rank 
FROM public.search_campus_knowledge_documents(
  query_text := 'minimum attendance percentage',
  dept_filter := NULL,
  match_count := 3
);
```

### 3.1 What is Allowed in the Knowledge Store:
- ✅ Official Himachal Technical University (HPTU) Affiliation Regulations
- ✅ Approved Course Syllabi (Units, Topics, Prescribed Textbooks)
- ✅ Past Year Question Papers (PYQ Metadata)
- ✅ College Academic Calendars & Working Hours
- ✅ Fee Submission & Refund Guidelines
- ✅ Disciplinary Code & Anti-Ragging Statutes

### 3.2 What is NEVER Indexed (Strict Information Privacy):
- ❌ Student Marks & Internal Assessment Scores
- ❌ Medical Certificates & Leave Submissions
- ❌ Disciplinary Grievances & Complaint Files
- ❌ Personal Student / Faculty Contact Information
- ❌ Individual Daily Attendance Logs

---

## 4. Source Citation Standard

Every response generated via campus knowledge retrieval must include clear attribution:

```text
Student Query:
"What is the minimum attendance required to appear in final semester examinations?"

AI Assistant Output:
"According to HIET Academic Regulations, students must maintain a minimum of 75% attendance in each registered subject to be eligible to sit for the university end-semester examinations. Medical leave condonations up to 10% may be granted by the Principal upon timely submission of certified hospital proof.

Sources:
1. HIET Academic Regulations — Rule 4.1 (Attendance Mandate) [Ref: Bylaws 2026]"
```

If no relevant official documentation matches the student's inquiry:
```text
"I could not find an authorized published college document regarding this inquiry. Please consult your Class In-Charge or the Academic Cell for official guidance."
```

---

## 5. Development Diagnostics Panel

In development environments, developers and testers can verify intent resolution by checking the diagnostic logs returned in the assistant payload:

```json
{
  "debug": {
    "sentMessage": "show my timetable for today",
    "detectedIntent": "timetable_today",
    "activeRole": "student",
    "dataSource": "supabase_timetable_rpc",
    "providerUsed": "deterministic_grounding",
    "status": "success"
  }
}
```

---

## 6. Edge Function Verification

Check the health status of the assistant service without transmitting credentials:

```bash
curl -X GET https://<project-ref>.supabase.co/functions/v1/campus-ai-assistant
```

**Response (HTTP 200):**
```json
{
  "service": "campus-ai-assistant",
  "status": "ok",
  "provider": "gemini",
  "ai_features_enabled": true,
  "timestamp": "2026-10-09T07:35:00.000Z"
}
```
