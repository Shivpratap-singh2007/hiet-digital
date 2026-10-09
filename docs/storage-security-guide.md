# HIET DIGITAL CAMPUS — STORAGE SECURITY & RLS GUIDE
**Classification:** Information Security Architecture  
**Target Audience:** DevOps Engineers, Database Administrators, Security Auditors  

---

## 1. Storage Security Overview

In HIET Digital Campus, student files (assignments, medical leave proofs, certificates, grievances) and institutional documents (hall tickets, smart board lessons) contain private personal and academic data. 

To prevent unauthorized access, data scraping, or path-guessing attacks, the storage architecture enforces three concentric lines of defense:
1. **Strict Folder Path Partitioning:** Every private upload is locked to `{owner_user_id}/{entity_id}/{sanitized-uuid-filename}`.
2. **Database-Validated Storage RLS:** Supabase `storage.objects` policies enforce ownership and academic relationships (e.g. assigned teachers, department HODs) via `SECURITY DEFINER` helper functions.
3. **Expiring Signed URLs:** No persistent public URLs are generated for private files. Files can only be accessed via temporary signed URLs with a **900-second (15-minute)** time-to-live.

---

## 2. Private Buckets Catalog

The following buckets are configured as **Private** (`public = false`) in Supabase Storage:

| Bucket ID | Purpose | Permitted Uploaders | Permitted Readers | Max Size | Allowed Extensions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `assignment-submissions` | Student homework/code | Students (own folder) | Student owner, Subject Teachers, Dept HOD, Principal | 20 MB | `.pdf`, `.doc`, `.docx`, `.txt`, `.zip` |
| `leave-documents` | Medical/duty proofs | Students (own folder) | Student owner, Class In-Charge, Dept HOD, Principal | 10 MB | `.pdf`, `.jpg`, `.jpeg`, `.png` |
| `achievement-certificates`| Extracurricular awards| Students (own folder) | Student owner, Dept HOD, Principal | 10 MB | `.pdf`, `.jpg`, `.jpeg`, `.png` |
| `smart-board-lessons` | Whiteboard exports | Faculty (own folder) | Faculty owner, Dept Students, Dept HOD, Principal | 25 MB | `.pdf`, `.ppt`, `.pptx`, `.jpg`, `.png` |
| `complaint-attachments` | Grievance evidence | Creator (own folder) | Complaint filer, Assigned Reviewer, HOD, Principal | 10 MB | `.pdf`, `.jpg`, `.jpeg`, `.png` |
| `doubt-attachments` | Student question photos| Students (own folder) | Student owner, Subject Faculty, Dept HOD | 10 MB | `.pdf`, `.jpg`, `.jpeg`, `.png` |
| `hall-tickets` | Signed exam admit cards | Server / Service Role | Student owner, Principal, Exam Cell | 5 MB | `.pdf` |
| `event-certificates` | College event certs | Server / Admin | Student recipient, Principal | 5 MB | `.pdf`, `.png` |
| `syllabus-files` | Official curricula | HOD / Admin | All authenticated students and faculty | 15 MB | `.pdf` |
| `pyq-files` | Past question papers | Faculty / Admin | All authenticated students and faculty | 15 MB | `.pdf` |

---

## 3. Path Naming Conventions

All uploads must follow deterministic structural naming. Raw client-provided filenames must never be stored directly in the storage path.

### Standardized Format:
```text
<bucket-id>/<owner_user_id>/<entity_id>/<timestamp>-<sanitized-name>.<ext>
```

### Examples:
- **Assignment Submission:**
  `assignment-submissions/43e7c85e-bdf1-4a12-8789-53e346ff175d/8191eb70-e48f-4ba3-ab0e-c90a187680bb/1760000000000-lab_report.pdf`
- **Leave Document:**
  `leave-documents/43e7c85e-bdf1-4a12-8789-53e346ff175d/6c20573c-f4b7-4fc9-b9d9-f54245ad545b/1760000000000-doctor_slip.jpg`
- **Smart Board Lesson:**
  `smart-board-lessons/f586940a-9d29-450f-9694-ba595304bf52/8f8955d8-c89b-43fe-a864-4e3a479ff73a/1760000000000-unit3_notes.pdf`

---

## 4. Storage RLS Policies & Helper Functions

The storage policies reside in migration `supabase/migrations/20261009000001_harden_storage_policies.sql`.

### 4.1 Folder Extraction
The first directory in the path represents the owner's UUID:
```sql
CREATE OR REPLACE FUNCTION public.get_storage_owner_uuid(object_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ((storage.foldername(object_name))[1])::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
```

### 4.2 Security Definer Access Helpers
To verify whether a faculty member or HOD is authorized to read an assignment submission:
```sql
CREATE OR REPLACE FUNCTION public.can_read_assignment_submission_file(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.teacher_subjects ts ON ts.subject_id = a.subject_id
    WHERE ts.teacher_id = auth.uid()
      AND a.assignment_id = ((storage.foldername(object_name))[2])::uuid
  )
  OR EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.departments d ON d.department_id = a.department_id
    WHERE d.hod_user_id = auth.uid()
      AND a.assignment_id = ((storage.foldername(object_name))[2])::uuid
  )
  OR public.has_role(auth.uid(), 'principal');
$$;
```

---

## 5. Signed URL Workflow

Direct browser requests to Supabase storage for private files will receive HTTP 403 Forbidden.

### Authorized Download Lifecycle:
```text
Client Application 
  │
  ├─► Calls getAuthorizedSignedUrl(bucket, path, 900) in src/lib/storage.ts
  │
  ├─► Supabase Storage API verifies auth.uid() against storage.objects SELECT policy
  │
  ├─► Generates HMAC-signed URL valid for 900 seconds (15 minutes)
  │
  └─► Client opens or downloads file securely
```

### Frontend Implementation (`src/lib/storage.ts`):
```ts
export async function getAuthorizedSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds: number = 900
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Access Denied: You do not have permission to access this file.`);
  }

  return data.signedUrl;
}
```

---

## 6. Client-Side Upload Validation

Before any upload request is dispatched, `validateFileUpload` runs the following checks:

1. **Size Limit Check:** Rejects files exceeding the bucket's designated megabyte limit.
2. **MIME Type Allowlist:** Verifies MIME type matching expected formats (e.g., `application/pdf`, `image/jpeg`).
3. **Extension & Script Blocking:** Explicitly blocks dangerous and executable extensions (`.exe`, `.sh`, `.bat`, `.html`, `.js`, `.py`, `.bin`).

```ts
validateFileUpload(file, 'assignment-submissions');
// Returns { valid: true } or { valid: false, error: '...' }
```

---

## 7. Verification & Compliance Checklist

- [x] Broad policy `auth.uid() IS NOT NULL` is removed from all private storage buckets.
- [x] Students cannot read objects in other students' folder paths.
- [x] Teachers can only read assignments for their assigned subjects.
- [x] HOD access is restricted to their respective departmental workflows.
- [x] Security guards cannot access academic or medical files.
- [x] Signed URLs expire after 15 minutes.
- [x] Unit test suite `src/__tests__/storageSecurity.test.ts` passes 7/7 automated security assertions.
