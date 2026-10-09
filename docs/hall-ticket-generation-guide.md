# HIET DIGITAL CAMPUS — HALL TICKET GENERATION & VERIFICATION GUIDE
**Classification:** Examination Security & Clearance Protocol  
**Target Audience:** Examination Cell, Academic Deans, Developers, Invigilators  

---

## 1. Institutional Clearance Mandate (No-Dues Policy)

At Himachal Institute of Engineering & Technology, end-semester examination hall tickets cannot be issued on arbitrary or unverified student requests. 

A student is eligible for an official Hall Ticket **only after all 5 institutional departments** record an explicit `CLEARED` status in `public.no_dues_clearances`:

```text
┌────────────────────────────────────────────────────────┐
│               No-Dues Clearance Gate                   │
├─────────────────┬──────────────────────────────────────┤
│ 1. Accounts     │ Tuition & Exam Fees Settled          │
│ 2. Library      │ All Borrowed Books Returned          │
│ 3. Laboratories │ Equipment Dues / Breakage Cleared    │
│ 4. Sports       │ Sports Gear Returned                 │
│ 5. Hostel       │ Mess & Room Dues Cleared (if resident│
└─────────────────┴──────────────────────────────────────┘
                           │
                           ▼
              ALL 5 DEPARTMENTS CLEARED?
             /                          \
          YES                            NO
          /                                \
  Generate Admit Card                Reject Generation
  & Cryptographic Token             (List Pending Clearances)
```

Frontend checkboxes or mock state flags are never trusted. The backend verifies actual database clearance records.

---

## 2. Hall Ticket Generation Lifecycle

The generation lifecycle executes securely through Supabase Edge Function `generate-hall-ticket`:

```text
Student Clicks "Download Hall Ticket"
  │
  ├─► [1] Client invokes Edge Function generate-hall-ticket
  │
  ├─► [2] Function authenticates student session via Supabase JWT
  │
  ├─► [3] Executes public.request_hall_ticket_generation RPC
  │        └── Verifies real status in public.no_dues_clearances
  │
  ├─► [4] Generates Cryptographic Verification Token
  │        (e.g., HT-8191EB70-1760000000000)
  │
  ├─► [5] Creates or Updates public.hall_tickets record
  │        (pdf_path = hall-tickets/{student_id}/{ticket_id}/admit_card.html)
  │
  ├─► [6] Compiles Official Admit Card Document
  │        ├── HIET Emblem & Institution Header
  │        ├── Student Name, Roll Number, Branch & Semester
  │        ├── Exam Term & Examination Schedule
  │        ├── Candidate Instructions & Authorized Signatures
  │        └── Verification QR Code (URL to public verification route)
  │
  ├─► [7] Uploads Admit Card to Private Bucket hall-tickets
  │
  └─► [8] Generates 900-Second (15-Minute) Signed Download URL
           └── Returns signed URL to Student browser
```

---

## 3. Data Sensitivity Rules

### 3.1 What is Included on the Hall Ticket:
- Institution Name & Affiliation (HIET Shahpur / HPTU)
- Student Full Name & University Roll Number
- Academic Department, Semester & Section
- Examination Term (e.g. End Semester Exams — Dec 2026)
- Registered Subject Codes & Exam Dates
- Issue Timestamp
- Public Verification Token & QR Code

### 3.2 What is NEVER Included (Privacy & Security Guardrails):
- ❌ Secret Cryptographic Keys or Hashing Salts
- ❌ Internal Database Primary Keys
- ❌ Specific Fee Amounts or Clearance Notes
- ❌ Disciplinary History or Medical Leave Logs
- ❌ Invigilator Master Signing Keys

---

## 4. Public QR Verification Endpoint (`verify-hall-ticket`)

During examinations, exam invigilators or gate security can scan the QR code printed on any student's hall ticket using a standard smartphone camera.

### Verification Request:
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/verify-hall-ticket \
  -H "Content-Type: application/json" \
  -d '{"token": "HT-8191EB70-1760000000000"}'
```

### Safe Public Verification Response (HTTP 200):
```json
{
  "valid": true,
  "hall_ticket": {
    "student_name": "Shiv Pratap Singh",
    "roll_number": "21040101001",
    "department": "Computer Science & Engineering",
    "semester": 5,
    "exam_term": "End Semester Exams — Dec 2026",
    "status": "issued",
    "issued_at": "2026-10-09T06:00:00.000Z"
  }
}
```

### Tampered / Invalid Token Response (HTTP 404):
```json
{
  "valid": false,
  "error": "Hall ticket verification failed. Token is invalid, expired, or revoked."
}
```

No internal system details, clearances logs, or private data are ever revealed to the public verifier.

---

## 5. Storage Protection for Generated Tickets

Hall tickets are stored inside the private bucket `hall-tickets` under:
```text
hall-tickets/{student_id}/{hall_ticket_id}/admit_card.html
```

- **Student Owner:** Can download via 15-minute signed URL.
- **Other Students:** Blocked by RLS (HTTP 403 Forbidden).
- **Public:** Blocked from raw bucket access; must verify via the token endpoint.
