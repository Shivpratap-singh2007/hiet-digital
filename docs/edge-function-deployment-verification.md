# HIET DIGITAL CAMPUS — EDGE FUNCTION DEPLOYMENT & VERIFICATION GUIDE
**Classification:** Cloud Infrastructure & Serverless Operations  
**Target Audience:** DevOps Engineers, Cloud Administrators, SREs  

---

## 1. Edge Functions Catalog

HIET Digital Campus operates dedicated serverless Supabase Edge Functions built on the Deno runtime:

| Edge Function | Purpose | Authentication | Health Check Method |
| :--- | :--- | :--- | :--- |
| `dispatch-notification` | Sends queued notifications via Resend email | Service Role / Cron | `GET /dispatch-notification` |
| `generate-hall-ticket` | Verifies 5-dept clearances & compiles admit card | Authenticated Student JWT | `GET /generate-hall-ticket` |
| `verify-hall-ticket` | Public QR verification for invigilators & security | Anonymous / Public | `GET /verify-hall-ticket` |
| `campus-ai-assistant` | AI Assistant query resolution with RAG | Authenticated User JWT | `GET /campus-ai-assistant` |
| `calculate-attendance-risk`| Computes student risk tiers & threshold triggers | Service Role / Scheduled | `GET /calculate-attendance-risk` |
| `invite-real-users` | Issues password activation invites during cutover | Principal / Service Role | Internal RPC invocation |

---

## 2. Server-Side Secrets Configuration

Before deploying functions to production, configure all server-side secrets in the Supabase project. **Never prefix these with `VITE_`**:

```bash
# Set Supabase Project Link
supabase link --project-ref your-project-id

# 1. Email Notification Provider Secrets
supabase secrets set EMAIL_PROVIDER=resend
supabase secrets set RESEND_API_KEY=re_1234567890abcdef
supabase secrets set EMAIL_FROM="HIET Digital Campus <noreply@notifications.hiet.ac.in>"

# 2. AI Model Provider Secrets
supabase secrets set AI_PROVIDER=gemini
supabase secrets set AI_MODEL=gemini-1.5-flash
supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyExampleKey12345
supabase secrets set AI_FEATURES_ENABLED=true

# 3. Web Push (Optional / PWA)
supabase secrets set VAPID_PRIVATE_KEY=your_private_vapid_key
```

Verify secrets are loaded:
```bash
supabase secrets list
```

---

## 3. Function Deployment Commands

Deploy each function to your remote Supabase environment:

```bash
# 1. Dispatch Notification Function
supabase functions deploy dispatch-notification --no-verify-jwt

# 2. Hall Ticket Generation Function
supabase functions deploy generate-hall-ticket

# 3. Public Hall Ticket Verification Function
supabase functions deploy verify-hall-ticket --no-verify-jwt

# 4. Campus AI Assistant Function
supabase functions deploy campus-ai-assistant

# 5. Attendance Risk Calculator Function
supabase functions deploy calculate-attendance-risk --no-verify-jwt
```

---

## 4. Live Health Check & Verification Testing

Each production Edge Function implements a secure, zero-secret `GET` health endpoint that returns operational status without leaking environment variables:

### 4.1 Test Notification Dispatcher
```bash
curl -i -X GET https://<project-ref>.supabase.co/functions/v1/dispatch-notification
```
**Expected Status:** `HTTP/1.1 200 OK`
```json
{
  "service": "dispatch-notification",
  "status": "ok",
  "provider": "resend",
  "email_configured": true,
  "timestamp": "2026-10-09T08:00:00.000Z"
}
```

### 4.2 Test Hall Ticket Generator
```bash
curl -i -X GET https://<project-ref>.supabase.co/functions/v1/generate-hall-ticket
```
**Expected Status:** `HTTP/1.1 200 OK`
```json
{
  "service": "generate-hall-ticket",
  "status": "ok",
  "storage_bucket": "hall-tickets",
  "timestamp": "2026-10-09T08:00:00.000Z"
}
```

### 4.3 Test Public Hall Ticket Verifier
```bash
curl -i -X GET https://<project-ref>.supabase.co/functions/v1/verify-hall-ticket
```
**Expected Status:** `HTTP/1.1 200 OK`
```json
{
  "service": "verify-hall-ticket",
  "status": "ok",
  "endpoint": "public-verification",
  "timestamp": "2026-10-09T08:00:00.000Z"
}
```

### 4.4 Test Campus AI Assistant
```bash
curl -i -X GET https://<project-ref>.supabase.co/functions/v1/campus-ai-assistant
```
**Expected Status:** `HTTP/1.1 200 OK`
```json
{
  "service": "campus-ai-assistant",
  "status": "ok",
  "provider": "gemini",
  "ai_features_enabled": true,
  "timestamp": "2026-10-09T08:00:00.000Z"
}
```

---

## 5. Live Function Log Monitoring

To inspect real-time execution logs and debug issues:

```bash
# Stream live logs for a specific function
supabase functions logs dispatch-notification

# Stream live logs with error filter
supabase functions logs campus-ai-assistant --tail
```

---

## 6. Rollback Guidance

If a deployed function encounters unexpected errors in production:

1. **Check Live Logs:** Run `supabase functions logs <function-name>` to identify error trace.
2. **Revert to Previous Git Commit:**
   ```bash
   git checkout HEAD~1 -- supabase/functions/<function-name>
   supabase functions deploy <function-name>
   ```
3. **Emergency Secret Fallback:**
   If third-party API issues occur (e.g. Gemini quota exhausted):
   ```bash
   supabase secrets set AI_PROVIDER=openai
   supabase secrets set OPENAI_API_KEY=sk-fallback_key
   ```
