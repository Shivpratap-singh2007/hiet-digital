# HIET DIGITAL CAMPUS — MULTI-ROLE & WORKSPACE SWITCHING ARCHITECTURE

**Institution:** Himachal Institute of Engineering & Technology, Shahpur (H.P.)  
**Document:** Technical Specification & Workflow Documentation  
**Status:** Approved & Implemented  

---

## 1. Overview & Institutional Requirement

In higher education institutions, academic faculty frequently hold concurrent administrative appointments. For example, a senior professor serves simultaneously as a classroom teacher (with syllabus, lecture timetable, student doubts, and grading responsibilities) and as the **Head of Department (HOD)** (with faculty workload oversight, departmental approvals, and curriculum monitoring).

Requiring separate login credentials or forcing teachers to log out and re-login degrades usability. The HIET Digital Campus platform implements a seamless **Multi-Role Authorization & Persistent Workspace Switcher** architecture.

---

## 2. Database Schema & Relational Model

The multi-role framework is powered by four relational tables and secure PostgreSQL functions:

### 2.1 `app_roles`
Defines the institutional roles:
- `student`
- `faculty` / `teacher`
- `hod`
- `principal` / `admin`
- `managing_director`
- `security`
- `warden`
- `library_staff`
- `lab_staff`
- `it_staff`

### 2.2 `user_roles`
A many-to-many junction table binding `users.id` to one or more `role_id` values:
```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES public.app_roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role_id)
);
```

### 2.3 `user_workspace_preferences`
Remembers each user's chosen active workspace across browser refreshes and device logins:
```sql
CREATE TABLE public.user_workspace_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    last_active_role TEXT NOT NULL REFERENCES public.app_roles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 `department_hod_assignments`
Formal audit record binding an academic department to its appointed HOD:
```sql
CREATE TABLE public.department_hod_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    appointed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (department_id, user_id)
);
```

---

## 3. Reference Implementation: Dr. Anuj Sharma

| Attribute | Specification |
| :--- | :--- |
| **Full Name** | Dr. Anuj Sharma |
| **Email** | `anuj.sharma@hiet.demo` / `faculty.cse01@hiet.demo` |
| **Institutional ID** | `HIET-FAC-CSE-001` |
| **Department** | Computer Science & Engineering |
| **Active Roles** | `['faculty', 'hod']` |
| **Default Workspace** | `faculty` |
| **Switchable Workspace** | `hod` (Head of Department — CSE) |

---

## 4. Frontend Workspace Switcher Behavior

### 4.1 Visual Representation in Header
When a multi-role user logs in:
1. **Visual Badge:** A prominent `HOD` badge is displayed next to the user's name/avatar in the top navigation bar.
2. **Workspace Switcher Dropdown:** Located next to the user profile menu, displaying:
   - Current active workspace with a checkmark.
   - List of switchable workspaces:
     - `Faculty Workspace` (Classroom teaching, attendance register, dynamic QR, smart board)
     - `HOD — Computer Science & Engineering` (Departmental analytics, faculty syllabus tracking, leave approvals)
   - Visual indicator showing which workspace is currently active.

### 4.2 State Management & Persistence
- Managed by `useAuth()` in `src/context/AuthContext.tsx`.
- Changing the workspace invokes:
  ```typescript
  switchWorkspace(targetRole: UserRole): void
  ```
- The selection is immediately persisted to:
  - `localStorage.setItem('hiet_active_workspace_role', targetRole)`
  - Supabase `user_workspace_preferences` table (if connected)
- Routing automatically re-synchronizes:
  - If current route is `/app/faculty/*` and user selects HOD, the view updates to `/app/hod/*`.
  - The left sidebar updates its menu items, permissions, and header role title (`Faculty Member (HOD)`).

---

## 5. Security & Row Level Security (RLS) Policies

Database operations use the secure helper function `auth_user_has_role(role_name)`:
```sql
CREATE OR REPLACE FUNCTION public.auth_user_has_role(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.users u ON ur.user_id = u.id
        WHERE (u.id = auth.uid() OR u.supabase_auth_id = auth.uid())
          AND ur.role_id = p_role
    );
$$;
```

This guarantees that:
- Users cannot access HOD RPCs or modify departmental approvals unless they hold the corresponding verified role in `user_roles`.
- Client-side workspace switching only modifies the view context; database-level security remains locked by cryptographically signed user IDs.
