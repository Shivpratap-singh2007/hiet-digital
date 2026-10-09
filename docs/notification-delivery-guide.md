# HIET DIGITAL CAMPUS — NOTIFICATION DISPATCHER GUIDE
**Classification:** Notification Subsystem Architecture & Integration  
**Target Audience:** Backend Engineers, System Administrators  

---

## 1. Notification Architecture

HIET Digital Campus implements a decoupled, layered notification system:

```text
Academic Workflow Event (e.g. Leave Approval, Assignment Graded, Gate Pass)
  │
  ├─► [1] Insert into public.notifications
  │        └── Instantly visible in In-App Notification Bell & Dashboard
  │
  ├─► [2] Database Trigger (trg_enqueue_high_priority_notification)
  │        └── Auto-enqueues urgent events into public.notification_deliveries
  │
  └─► [3] Dispatch Worker (Supabase Edge Function: dispatch-notification)
           │
           ├─► Email Channel (Resend API)
           ├─► Web Push Channel (VAPID / Service Worker)
           └─► Delivery Log & Retry Tracking
```

### Critical Resiliency Rule:
**Notification dispatching never blocks primary business workflows.** If an external email provider experiences downtime or network timeout, the student's leave approval or assignment submission succeeds uninterrupted.

---

## 2. Notification Delivery Schema (`notification_deliveries`)

Migration `supabase/migrations/20261009000002_add_notification_deliveries.sql` creates the queue:

| Column | Type | Description |
| :--- | :--- | :--- |
| `delivery_id` | `uuid` | Primary Key. |
| `notification_id`| `uuid` | References `public.notifications(notification_id)`. |
| `channel` | `text` | Channel: `'in_app'`, `'email'`, `'web_push'`, `'whatsapp'`, `'sms'`. |
| `recipient_address` | `text` | Target email address or phone number. |
| `delivery_status` | `text` | `'queued'`, `'sending'`, `'sent'`, `'failed'`, `'skipped'`. |
| `provider` | `text` | Name of the delivery provider (e.g., `'resend'`). |
| `provider_message_id` | `text` | Message ID returned by third-party provider for tracking. |
| `error_message` | `text` | Error details if delivery fails. |
| `attempts` | `integer` | Count of send attempts (max retries: 3). |
| `sent_at` | `timestamptz` | Exact timestamp of verified external transmission. |

---

## 3. Email Delivery via Resend

### 3.1 Edge Function Implementation
The dispatcher lives at `supabase/functions/dispatch-notification/index.ts`.

It runs via:
1. **Direct Invocation:** Called immediately after critical actions.
2. **Scheduled Cron / Webhook:** Periodically picks up unhandled rows where `delivery_status = 'queued' AND attempts < 3`.

### 3.2 Required Server Secrets
```bash
supabase secrets set EMAIL_PROVIDER=resend
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set EMAIL_FROM="HIET Digital Campus <noreply@notifications.hiet.ac.in>"
```

### 3.3 High-Priority Events Mapped to Email:
- **Leave Applications:** Leave submitted, approved by Class In-Charge, approved by HOD, or rejected.
- **Academic Deadlines:** Assignment deadline approaching (24h reminder), assignment graded.
- **Attendance Alerts:** Student attendance risk marked as High or Critical (<75%).
- **Campus Security:** Hostel Outpass approved, Gate Pass verified/closed.
- **Institutional Onboarding:** User account activation invites issued by Principal.

---

## 4. Web Push Readiness

The foundation for Progressive Web App (PWA) push notifications is deployed in `public.web_push_subscriptions`:

```sql
CREATE TABLE public.web_push_subscriptions (
  subscription_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Activation Protocol:
1. Generate VAPID Keys: `npx web-push generate-vapid-keys`.
2. Add public key to frontend: `VITE_VAPID_PUBLIC_KEY=<public_key>`.
3. Add private key to Edge Function secrets: `supabase secrets set VAPID_PRIVATE_KEY=<private_key>`.
4. Register browser Service Worker (`service-worker.js`) to capture user push permission.
5. Store push endpoint in `public.web_push_subscriptions`.

> **Note:** Until VAPID keys and mobile service workers are verified, Web Push notifications remain gracefully queued or skipped.

---

## 5. WhatsApp & SMS Readiness

- The delivery status enum supports `'whatsapp'` and `'sms'`.
- In the current release, these channels are stubbed as `"Coming Soon"` to prevent false claims of SMS dispatching without an active institutional SMS gateway (such as Twilio or NIC SMS).
- When configured, adapters can plug directly into `dispatch-notification` without schema changes.

---

## 6. Health & Verification Check

The notification dispatcher provides a zero-secret health check endpoint:

```bash
curl -X GET https://<project-ref>.supabase.co/functions/v1/dispatch-notification
```

**Expected Response (HTTP 200):**
```json
{
  "service": "dispatch-notification",
  "status": "ok",
  "provider": "resend",
  "email_configured": true,
  "timestamp": "2026-10-09T07:30:00.000Z"
}
```
