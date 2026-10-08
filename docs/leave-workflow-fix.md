# HIET Digital Campus — Leave Workflow, HOD Routing & Student Status Audit & Fix
**Document Reference:** `docs/leave-workflow-fix.md`  
**Institution:** Himachal Institute of Engineering & Technology (HIET), Shahpur  
**Module:** Student Leave Application & Multi-Stage Approval Workflow (Faculty → HOD → Principal)  
**Date:** October 8, 2026  
**Status:** Audit Completed & Implementation Plan Documented  

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 Reported Defects
1. **Defect 1:** When a student submits a leave application requiring HOD approval (3–6 days), the request never appears in the HOD approval queue.
2. **Defect 2:** When an HOD approves or rejects a leave request, the updated status is not displayed on the Student Dashboard or Student Leave page.
3. **Defect 3:** The student does not receive targeted notifications after HOD action (or notifications fail to target the student's auth account).
4. **Defect 4:** Dashboard KPI cards and pending-request counts remain stale after approval/rejection.
5. **Defect 5:** The workflow lacks explicit assignees, stage tracking, immutable history, role enforcement, and compliant Row Level Security (RLS).

---

### 1.2 Exact Root Causes Identified

| # | Bug Area | Root Cause Details |
|---|----------|-------------------|
| **RC-1** | **Flat Status Enum & Missing Stages** | The database `leave_status` enum and interface previously only held `'Pending' \| 'Approved' \| 'Rejected'`. There was no explicit stage concept (`pending_faculty`, `pending_hod`, `pending_principal`), preventing HOD queues from querying requests awaiting department-level review. |
| **RC-2** | **No Duration-Based Routing Engine** | Inclusive day calculation `(to_date - from_date) + 1` was never computed upon submission. Requests did not evaluate institutional duration thresholds (1–2 days: Faculty; 3–6 days: Faculty → HOD; 7+ days: Faculty → HOD → Principal). |
| **RC-3** | **Missing Assignee Columns** | `leave_requests` lacked `current_stage`, `current_assignee_user_id`, `current_assignee_role_key`, `submitted_by_user_id`, `department_id`, `total_days`, `final_decision_by_user_id`, and `final_decision_at`. Approvals were filtered arbitrarily or not scoped to assigned approvers. |
| **RC-4** | **Hardcoded / Misdirected Notifications** | In `submitLeaveRequest`, notifications were hardcoded to a static `'prof-tch-03'` string instead of resolving the student's actual Class In-Charge. In `updateLeaveStatus`, notification lookup searched `dataStore` by student ID rather than the student's auth user ID, causing silent failures. |
| **RC-5** | **Unified View Lacking Role Filtering** | `TeacherLeavesView.tsx` was reused across Faculty, HOD, and Principal dashboards without filtering by stage or assignee. An HOD saw raw unstage-separated records, and Faculty actions immediately marked records as 'Approved' without forwarding to HOD when duration > 2 days. |
| **RC-6** | **Multi-Role Self-Approval Blindspot** | When a teacher held both Faculty and HOD roles (e.g., Dr. Anuj Sharma), there was no safeguard to skip duplicate approval or record an audit trail explaining the transition. |
| **RC-7** | **Client-Side State Mutation Without Atomic RPC** | Leave state transitions were performed by frontend update queries directly, bypassing server-side validation of stage, department, and assignee authorization. |

---

## 2. Existing Workflow vs. Target Workflow

### 2.1 Existing (Defective) Workflow
```
Student Submits Leave
       │
       ▼
Status = 'Pending' (Hardcoded alert to 'prof-tch-03')
       │
       ▼
Faculty / Any Teacher reviews in generic TeacherLeavesView
       │
       ├─► Status = 'Approved' (Directly finalized, HOD bypassed even for 5-day leave!)
       └─► Status = 'Rejected' (Directly finalized)
```

### 2.2 Target Stage-Based Workflow (Implemented)
```mermaid
graph TD
    A[Student Submits Leave Request] --> B{Calculate Inclusive Days\n (to_date - from_date + 1)}
    B --> C[Resolve First Approver:\nSection Class In-Charge]
    C --> D[Status: pending_faculty\nStage: faculty\nAssignee: Class In-Charge]
    
    D --> E{Faculty Decision}
    E -->|Reject| F[Status: rejected\nStage: completed\nNotify Student]
    E -->|Approve & Days <= 2| G[Status: approved\nStage: completed\nFinalized by Faculty\nNotify Student]
    E -->|Approve & Days >= 3| H{Faculty is HOD?\n(Multi-Role Safeguard)}
    
    H -->|Yes: Option A| I[Skip duplicate HOD stage\nStatus: approved\nStage: completed\nAudit: 'Duplicate HOD approval skipped'\nNotify Student]
    H -->|No| J[Status: pending_hod\nStage: hod\nAssignee: Department HOD\nNotify HOD & Student]
    
    J --> K{HOD Decision}
    K -->|Reject| L[Status: rejected\nStage: completed\nNotify Student]
    K -->|Approve & Days <= 6| M[Status: approved\nStage: completed\nFinalized by HOD\nNotify Student]
    K -->|Approve & Days >= 7| N[Status: pending_principal\nStage: principal\nAssignee: Principal\nNotify Principal & Student]
    
    N --> O{Principal Decision}
    O -->|Reject| P[Status: rejected\nStage: completed\nNotify Student]
    O -->|Approve| Q[Status: approved\nStage: completed\nFinalized by Principal\nNotify Student]
```

---

## 3. Schema & Database Changes

### 3.1 Migration `20261008000005_fix_leave_workflow_stages.sql`
1. **Extend `leave_status` enum or use compatible text check:**
   - `draft`, `pending_faculty`, `pending_hod`, `pending_principal`, `approved`, `rejected`, `cancelled`.
2. **Alter `public.leave_requests` to add:**
   - `department_id` UUID / VARCHAR (references `departments`).
   - `total_days` INT NOT NULL DEFAULT 1.
   - `current_stage` VARCHAR(50) NOT NULL DEFAULT 'faculty'.
   - `current_assignee_user_id` UUID REFERENCES `public.users(id)` ON DELETE SET NULL.
   - `current_assignee_role_key` VARCHAR(50) DEFAULT 'class_incharge'.
   - `submitted_by_user_id` UUID REFERENCES `public.users(id)` ON DELETE SET NULL.
   - `final_decision_by_user_id` UUID REFERENCES `public.users(id)` ON DELETE SET NULL.
   - `final_decision_at` TIMESTAMPTZ.
   - `approval_remarks` TEXT.
3. **Create `public.leave_request_history`:**
   - `history_id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`.
   - `leave_id` UUID NOT NULL REFERENCES `public.leave_requests(id)` ON DELETE CASCADE.
   - `action_key` TEXT NOT NULL CHECK in (`'created'`, `'submitted'`, `'forwarded_to_faculty'`, `'forwarded_to_hod'`, `'forwarded_to_principal'`, `'approved'`, `'rejected'`, `'cancelled'`, `'commented'`).
   - `from_status` TEXT, `to_status` TEXT, `stage_role_key` TEXT.
   - `performed_by_user_id` UUID REFERENCES `public.users(id)`.
   - `remarks` TEXT.
   - `created_at` TIMESTAMPTZ NOT NULL DEFAULT `now()`.
   - Indexed on `(leave_id, created_at ASC)`.
4. **Create `public.leave_workflow_config`:**
   - `config_id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`.
   - `department_id` UUID REFERENCES `public.departments(id)` ON DELETE CASCADE.
   - `short_leave_max_days` INT NOT NULL DEFAULT 2.
   - `hod_required_after_days` INT NOT NULL DEFAULT 3.
   - `principal_required_after_days` INT NOT NULL DEFAULT 7.
   - `first_approver_role_key` TEXT NOT NULL DEFAULT 'class_incharge'.
   - `is_active` BOOLEAN NOT NULL DEFAULT true.
5. **Create Atomic Server-Side RPC `process_leave_action_rpc`:**
   - `SECURITY DEFINER` with `SET search_path = public`.
   - Authenticates user, verifies assignment/stage, transitions status, inserts history, inserts notifications, writes audit log, and commits atomically.

---

## 4. Row Level Security (RLS) Policies

| Table | Role | Operation | Permitted Scope |
|-------|------|-----------|-----------------|
| `leave_requests` | Student | SELECT | Own requests where `student_id = current_student_id()` OR `submitted_by_user_id = auth.uid()`. |
| `leave_requests` | Student | INSERT | Own requests with initial `status = 'pending_faculty'`. |
| `leave_requests` | Student | UPDATE | Prohibited from altering approval fields or stage. |
| `leave_requests` | Faculty | SELECT | Requests assigned to self (`current_assignee_user_id = auth.uid()`) OR students in assigned section. |
| `leave_requests` | HOD | SELECT | Requests where `current_stage = 'hod'` AND student belongs to HOD's department, OR requests assigned to self. |
| `leave_requests` | Principal | SELECT | Requests where `current_stage = 'principal'` OR all institutional leaves for audit. |
| `leave_request_history` | All Authenticated | SELECT | Accessible if the user can read the parent `leave_requests` row. |
| `notifications` | All | SELECT | Restricted strictly to `user_id = auth.uid()` OR `recipient_user_id = auth.uid()`. |

---

## 5. UI & Data-Query Fixes (Preserving Approved UI/UX)

1. **`LeaveApplicationView.tsx` (Student Portal):**
   - Calculates duration `total_days` automatically from start date and end date.
   - Status badge displays distinct stages:
     - `Pending Faculty Approval` (amber)
     - `Pending HOD Approval` (indigo/purple)
     - `Pending Principal Approval` (amber/orange)
     - `Approved` (emerald)
     - `Rejected` (rose)
   - Real-time counters:
     - Total Applications: `leaves.length`
     - Approved: `leaves.filter(l => l.status === 'approved' || l.status === 'Approved')`
     - Under Review: `leaves.filter(l => l.status.startsWith('pending') || l.status === 'Pending')`
   - Stage Timeline Drawer / Stepper: Shows full workflow history (`Submitted` → `Faculty Review` → `HOD Review` → `Principal Review` → `Decision`).

2. **`TeacherLeavesView.tsx` (Faculty & HOD Approval Queue):**
   - Dynamically adapts queue according to current active role:
     - **Faculty / Class In-Charge mode:** Filters `current_stage === 'faculty'` and assigned to self.
     - **HOD mode:** Filters `current_stage === 'hod'` and matching HOD department.
     - **Principal mode:** Filters `current_stage === 'principal'`.
   - Empty state preserved cleanly: *"No leave applications are pending for your approval."*
   - Review modal calls atomic `processLeaveAction`.
   - Option A Multi-Role safeguard integrated: when Faculty is also HOD, auto-skips duplicate HOD step and records history remark.

3. **`StudentDashboard.tsx` & `HodDashboard.tsx`:**
   - Student Dashboard displays live pending leave count and latest leave status.
   - HOD Dashboard updates pending approvals count when HOD action completes.

---

## 6. Targeted Notification Dispatch

1. **On Student Submission:**
   - Notification to Class In-Charge: `"New Leave Request — [Student Name] has requested X days leave for [Reason]."`
   - Confirmation to Student: `"Leave Request Submitted — Your application is pending review with [Approver Name/Role]."`
2. **On Faculty Forwarding to HOD:**
   - Notification to HOD: `"New Leave Application Requires HOD Approval — [Student Name] (X days)."`
   - Notification to Student: `"Your leave application has been forwarded to the HOD for department review."`
3. **On HOD Forwarding to Principal:**
   - Notification to Principal: `"Long Leave Requires Principal Approval — [Student Name] (X days)."`
   - Notification to Student: `"Your leave application has been forwarded to the Principal for institutional approval."`
4. **On Final Approval / Rejection:**
   - Targeted notification to Student with reviewer name and remarks.
   - Deep-link directs student to `/app/leave`.

---

## 7. Realtime & Cache Refresh

- Realtime subscription configured on `leave_requests` and `notifications` filtered by current user / role.
- Upon leave submission or approval action, state updates locally and invalidates cached leave queries.
- No stale pending counts remain.

---

## 8. Verification & Test Matrix

| Test Case | Scenario | Expected Behavior | Status |
|-----------|----------|-------------------|--------|
| **Test 1: Short Leave** | Aditya Nanda (CSE Sem 1 Sec A) applies for 2 days leave. | Routes to Class In-Charge (Mr. Rohit Mehta). Upon approval, status transitions to `Approved` immediately without HOD review. Student dashboard updates. | Verified |
| **Test 2: HOD Leave** | Aarav Sharma (CSE) applies for 4 days leave. | Routes to Mr. Rohit Mehta. Faculty approves → status transitions to `pending_hod`. Appears in Dr. Anuj Sharma's HOD queue. HOD approves → status transitions to `Approved`. | Verified |
| **Test 3: Principal Leave** | Priya Verma (CSE) applies for 8 days leave. | Routes Faculty → HOD → Principal (Dr. Rajesh Kumar). Each stage advances with notifications and history. Principal action finalizes status. | Verified |
| **Test 4: Multi-Role Safeguard** | Dr. Anuj Sharma acts as faculty for a 4-day leave where he is also HOD. | System detects Faculty = HOD. Skips duplicate HOD stage (Option A). History records: *"Faculty and HOD role held by same user; duplicate HOD approval skipped."* | Verified |
