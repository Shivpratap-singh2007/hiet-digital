// =============================================================================
// HIET DIGITAL CAMPUS — COMPLETE MULTI-ROLE DEMO DATA SEED SCRIPT
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// 5 Faculty + 2 HODs + 1 Class In-Charge + 2 Wardens + 30 Students (15 CSE, 15 ECE)
// Strictly DEVELOPMENT-ONLY. Gated by DEMO_SEED_ENABLED=true
// Runs server-side with SUPABASE_SERVICE_ROLE_KEY
// =============================================================================

import { createClient } from '@supabase/supabase-js';

// 1. SAFETY & ENVIRONMENT CHECKS
if (process.env.DEMO_SEED_ENABLED !== 'true') {
  console.log('----------------------------------------------------------------------');
  console.log('SAFETY SHIELD: Demo seed execution is disabled.');
  console.log('To run this development seed script, set: DEMO_SEED_ENABLED=true');
  console.log('Example: DEMO_SEED_ENABLED=true npx tsx supabase/seed-demo-multirole.ts');
  console.log('----------------------------------------------------------------------');
  process.exit(0);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Fatal Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  console.error('Ensure these are set in your local environment and never committed to public repositories.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEFAULT_PASSWORD = 'Hiet@12345';
const ACADEMIC_YEAR = '2026-2027';

// =============================================================================
// DEMO FACULTY (5) WITH MULTI-ROLE RESPONSIBILITIES
// =============================================================================
interface DemoFacultySpec {
  email: string;
  name: string;
  employeeCode: string;
  department: 'CSE' | 'ECE';
  designation: string;
  phone: string;
  roles: Array<{
    roleKey: 'faculty' | 'hod' | 'class_incharge' | 'warden';
    isPrimary: boolean;
    scopeType: string;
    scopeValue?: string;
    semester?: number;
    section?: string;
  }>;
  isHod: boolean;
  isClassIncharge: boolean;
  isWarden: boolean;
  hostelCode?: string;
}

const DEMO_FACULTY: DemoFacultySpec[] = [
  {
    email: 'anuj.sharma@hiet.demo',
    name: 'Dr. Anuj Sharma',
    employeeCode: 'HIET-FAC-CSE-001',
    department: 'CSE',
    designation: 'HOD & Assistant Professor',
    phone: '+91 98160 55001',
    roles: [
      { roleKey: 'faculty', isPrimary: true, scopeType: 'department' },
      { roleKey: 'hod', isPrimary: false, scopeType: 'department' }
    ],
    isHod: true,
    isClassIncharge: false,
    isWarden: false
  },
  {
    email: 'kavita.joshi@hiet.demo',
    name: 'Dr. Kavita Joshi',
    employeeCode: 'HIET-FAC-ECE-001',
    department: 'ECE',
    designation: 'HOD & Assistant Professor',
    phone: '+91 98160 55002',
    roles: [
      { roleKey: 'faculty', isPrimary: true, scopeType: 'department' },
      { roleKey: 'hod', isPrimary: false, scopeType: 'department' }
    ],
    isHod: true,
    isClassIncharge: false,
    isWarden: false
  },
  {
    email: 'rohit.mehta@hiet.demo',
    name: 'Mr. Rohit Mehta',
    employeeCode: 'HIET-FAC-CSE-002',
    department: 'CSE',
    designation: 'Assistant Professor',
    phone: '+91 98160 55003',
    roles: [
      { roleKey: 'faculty', isPrimary: true, scopeType: 'department' },
      { roleKey: 'class_incharge', isPrimary: false, scopeType: 'class', semester: 1, section: 'A' }
    ],
    isHod: false,
    isClassIncharge: true,
    isWarden: false
  },
  {
    email: 'neha.kapoor@hiet.demo',
    name: 'Ms. Neha Kapoor',
    employeeCode: 'HIET-FAC-CSE-003',
    department: 'CSE',
    designation: 'Assistant Professor',
    phone: '+91 98160 55004',
    roles: [
      { roleKey: 'faculty', isPrimary: true, scopeType: 'department' },
      { roleKey: 'warden', isPrimary: false, scopeType: 'hostel', scopeValue: 'GIRLS-HOSTEL-A' }
    ],
    isHod: false,
    isClassIncharge: false,
    isWarden: true,
    hostelCode: 'GIRLS-HOSTEL-A'
  },
  {
    email: 'pooja.thakur@hiet.demo',
    name: 'Ms. Pooja Thakur',
    employeeCode: 'HIET-FAC-ECE-002',
    department: 'ECE',
    designation: 'Assistant Professor',
    phone: '+91 98160 55005',
    roles: [
      { roleKey: 'faculty', isPrimary: true, scopeType: 'department' },
      { roleKey: 'warden', isPrimary: false, scopeType: 'hostel', scopeValue: 'BOYS-HOSTEL-B' }
    ],
    isHod: false,
    isClassIncharge: false,
    isWarden: true,
    hostelCode: 'BOYS-HOSTEL-B'
  }
];

// =============================================================================
// DEMO STUDENTS (30: 15 CSE + 15 ECE) AS SPECIFIED
// =============================================================================
interface DemoStudentSpec {
  rollNo: string;
  name: string;
  email: string;
  gender: 'Male' | 'Female';
  hostel: string;
  attendance: number;
  cgpa: number;
  testCase: string;
  department: 'CSE' | 'ECE';
}

const DEMO_STUDENTS: DemoStudentSpec[] = [
  // CSE Students — 15
  { rollNo: 'HIET-CSE-2026-001', name: 'Aditya Nanda', email: 'student.cse01@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 82, cgpa: 8.10, testCase: 'Normal student', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-002', name: 'Aarav Sharma', email: 'student.cse02@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 71, cgpa: 7.20, testCase: 'HOD leave test', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-003', name: 'Priya Verma', email: 'student.cse03@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 91, cgpa: 9.15, testCase: 'Achievement/topper', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-004', name: 'Riya Sharma', email: 'student.cse04@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 68, cgpa: 6.80, testCase: 'High attendance risk', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-005', name: 'Mohit Kumar', email: 'student.cse05@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 76, cgpa: 7.45, testCase: 'Assignment pending', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-006', name: 'Ananya Verma', email: 'student.cse06@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 85, cgpa: 8.40, testCase: 'Leave approved', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-007', name: 'Karan Thakur', email: 'student.cse07@hiet.demo', gender: 'Male', hostel: 'Day Scholar', attendance: 74, cgpa: 7.00, testCase: 'Complaint test', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-008', name: 'Simran Kaur', email: 'student.cse08@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 88, cgpa: 8.75, testCase: 'Syllabus/Smart Board test', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-009', name: 'Rahul Singh', email: 'student.cse09@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 79, cgpa: 7.90, testCase: 'Gate pass test', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-010', name: 'Nisha Devi', email: 'student.cse10@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 64, cgpa: 6.50, testCase: 'Critical attendance risk', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-011', name: 'Dev Raj', email: 'student.cse11@hiet.demo', gender: 'Male', hostel: 'Day Scholar', attendance: 83, cgpa: 8.30, testCase: 'Regular student', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-012', name: 'Mehak Gupta', email: 'student.cse12@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 77, cgpa: 7.65, testCase: 'Doubt test', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-013', name: 'Arjun Rana', email: 'student.cse13@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 73, cgpa: 7.10, testCase: 'Attendance warning', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-014', name: 'Ishita Sharma', email: 'student.cse14@hiet.demo', gender: 'Female', hostel: 'Day Scholar', attendance: 86, cgpa: 8.60, testCase: 'PYQ test', department: 'CSE' },
  { rollNo: 'HIET-CSE-2026-015', name: 'Yash Kumar', email: 'student.cse15@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 69, cgpa: 6.90, testCase: 'Low attendance', department: 'CSE' },

  // ECE Students — 15
  { rollNo: 'HIET-ECE-2026-001', name: 'Aditi Sharma', email: 'student.ece01@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 84, cgpa: 8.20, testCase: 'Normal ECE student', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-002', name: 'Harsh Vardhan', email: 'student.ece02@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 72, cgpa: 7.30, testCase: 'Low attendance', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-003', name: 'Kritika Singh', email: 'student.ece03@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 93, cgpa: 9.25, testCase: 'ECE topper', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-004', name: 'Aman Verma', email: 'student.ece04@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 66, cgpa: 6.60, testCase: 'Critical attendance', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-005', name: 'Palak Thakur', email: 'student.ece05@hiet.demo', gender: 'Female', hostel: 'Day Scholar', attendance: 80, cgpa: 8.00, testCase: 'Leave test', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-006', name: 'Deepak Kumar', email: 'student.ece06@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 75, cgpa: 7.50, testCase: 'Boundary attendance', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-007', name: 'Sakshi Verma', email: 'student.ece07@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 89, cgpa: 8.90, testCase: 'Achievement', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-008', name: 'Manish Rana', email: 'student.ece08@hiet.demo', gender: 'Male', hostel: 'Day Scholar', attendance: 70, cgpa: 7.10, testCase: 'Doubt test', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-009', name: 'Tanya Gupta', email: 'student.ece09@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 87, cgpa: 8.55, testCase: 'Assignment test', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-010', name: 'Rohan Mehta', email: 'student.ece10@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 62, cgpa: 6.20, testCase: 'High risk', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-011', name: 'Muskan Kaur', email: 'student.ece11@hiet.demo', gender: 'Female', hostel: 'Day Scholar', attendance: 81, cgpa: 8.15, testCase: 'PYQ test', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-012', name: 'Abhishek Joshi', email: 'student.ece12@hiet.demo', gender: 'Male', hostel: 'BOYS-HOSTEL-B', attendance: 78, cgpa: 7.80, testCase: 'Gate pass', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-013', name: 'Khushi Sharma', email: 'student.ece13@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 85, cgpa: 8.35, testCase: 'Regular student', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-014', name: 'Nitin Kumar', email: 'student.ece14@hiet.demo', gender: 'Male', hostel: 'Day Scholar', attendance: 74, cgpa: 7.00, testCase: 'Complaint test', department: 'ECE' },
  { rollNo: 'HIET-ECE-2026-015', name: 'Pooja Devi', email: 'student.ece15@hiet.demo', gender: 'Female', hostel: 'GIRLS-HOSTEL-A', attendance: 90, cgpa: 9.00, testCase: 'Smart Board data', department: 'ECE' }
];

// Institutional executive and support users
const INSTITUTIONAL_USERS = [
  { email: 'principal@hiet.demo', name: 'Dr. Rajesh Kumar', identifier: 'HIET-PRI-001', role: 'principal' },
  { email: 'md@hiet.demo', name: 'Mr. R. K. Sharma', identifier: 'HIET-MD-001', role: 'managing_director' },
  { email: 'security@hiet.demo', name: 'Ramesh Thakur', identifier: 'HIET-SEC-001', role: 'security' },
  { email: 'library@hiet.demo', name: 'Sunita Devi', identifier: 'HIET-LIB-001', role: 'library_staff' },
  { email: 'lab@hiet.demo', name: 'Mohit Kumar', identifier: 'HIET-LAB-001', role: 'lab_staff' },
  { email: 'it@hiet.demo', name: 'Vikram Singh', identifier: 'HIET-IT-001', role: 'it_staff' }
];

// Helper: Ensure or reuse auth user idempotently
async function getOrCreateAuthUser(email: string, fullName: string, role: string, identifier: string): Promise<string> {
  const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      identifier,
      demo: true,
      is_demo_account: true,
      data_environment: 'development'
    }
  });

  if (!createErr && createData?.user) {
    return createData.user.id;
  }

  // If already exists, retrieve auth user ID
  if (createErr && (createErr.message.includes('already exists') || createErr.message.includes('duplicate'))) {
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      // Safely update password and metadata
      await supabase.auth.admin.updateUserById(existing.id, {
        password: DEFAULT_PASSWORD,
        user_metadata: {
          full_name: fullName,
          role,
          identifier,
          demo: true,
          is_demo_account: true,
          data_environment: 'development'
        }
      });
      return existing.id;
    }
  }

  throw new Error(`Failed to create or retrieve auth user ${email}: ${createErr?.message}`);
}

async function runSeed() {
  console.log('======================================================================');
  console.log('HIET DIGITAL CAMPUS — INITIALIZING COMPLETE MULTI-ROLE DEMO DATA SEED');
  console.log('5 Faculty + 2 HODs + 1 Class In-Charge + 2 Wardens + 30 Students');
  console.log(`Academic Year: ${ACADEMIC_YEAR}`);
  console.log('======================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. DEPARTMENTS SETUP
  // ---------------------------------------------------------------------------
  console.log('1. Upserting Academic Departments (CSE, ECE, ME, CE, EE)...');
  const departmentsData = [
    { code: 'CSE', name: 'Computer Science & Engineering', intake_capacity: 60, academic_year: ACADEMIC_YEAR },
    { code: 'ECE', name: 'Electronics & Communication Engineering', intake_capacity: 60, academic_year: ACADEMIC_YEAR },
    { code: 'ME', name: 'Mechanical Engineering', intake_capacity: 60, academic_year: ACADEMIC_YEAR },
    { code: 'CE', name: 'Civil Engineering', intake_capacity: 60, academic_year: ACADEMIC_YEAR },
    { code: 'EE', name: 'Electrical Engineering', intake_capacity: 60, academic_year: ACADEMIC_YEAR }
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of departmentsData) {
    const { data: deptRec, error: deptErr } = await supabase
      .from('departments')
      .upsert(dept, { onConflict: 'code' })
      .select('id, code')
      .single();

    if (deptErr) {
      console.error(`Error upserting department ${dept.code}:`, deptErr.message);
    } else if (deptRec) {
      deptMap[deptRec.code] = deptRec.id;
    }
  }
  console.log(`✓ Departments synchronized: ${Object.keys(deptMap).join(', ')}`);

  // ---------------------------------------------------------------------------
  // 2. APP ROLES LOOKUP
  // ---------------------------------------------------------------------------
  console.log('\n2. Verifying App Roles Registry...');
  const { data: appRoles } = await supabase.from('app_roles').select('role_id, role_key');
  const roleMap: Record<string, string> = {};
  appRoles?.forEach(r => { roleMap[r.role_key] = r.role_id; });

  // ---------------------------------------------------------------------------
  // 3. FACULTY ACCOUNTS (5) WITH MULTI-ROLE APPOINTMENTS
  // ---------------------------------------------------------------------------
  console.log('\n3. Creating 5 Faculty Accounts with Multi-Role Mappings...');
  const facultyUserMap: Record<string, { userId: string; teacherMasterId: string }> = {};

  for (const fac of DEMO_FACULTY) {
    const authId = await getOrCreateAuthUser(fac.email, fac.name, 'faculty', fac.employeeCode);

    // Upsert public.users
    const { data: userRec, error: userErr } = await supabase
      .from('users')
      .upsert({
        supabase_auth_id: authId,
        email: fac.email,
        role: 'faculty',
        department_id: deptMap[fac.department],
        is_active: true,
        is_demo_account: true,
        data_environment: 'development'
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (userErr || !userRec) {
      throw new Error(`Failed to upsert public.users for ${fac.email}: ${userErr?.message}`);
    }

    const userId = userRec.id;

    // Upsert teachers_master
    const { data: tmRec, error: tmErr } = await supabase
      .from('teachers_master')
      .upsert({
        user_id: userId,
        faculty_id: fac.employeeCode,
        name: fac.name,
        full_name: fac.name,
        department: fac.department,
        department_id: deptMap[fac.department],
        designation: fac.designation,
        role: fac.isHod ? 'hod' : 'teacher',
        college_email: fac.email,
        phone: fac.phone,
        is_hod: fac.isHod,
        is_class_incharge: fac.isClassIncharge,
        class_incharge_branch: fac.isClassIncharge ? 'CSE' : null,
        class_incharge_semester: fac.isClassIncharge ? 1 : null,
        class_incharge_section: fac.isClassIncharge ? 'A' : null,
        status: 'active',
        is_demo_account: true,
        data_environment: 'development'
      }, { onConflict: 'faculty_id' })
      .select('id')
      .single();

    if (tmErr || !tmRec) {
      throw new Error(`Failed to upsert teachers_master for ${fac.employeeCode}: ${tmErr?.message}`);
    }

    facultyUserMap[fac.employeeCode] = { userId, teacherMasterId: tmRec.id };

    // Upsert user_roles for every mapped role
    for (const r of fac.roles) {
      const roleId = roleMap[r.roleKey];
      if (!roleId) continue;

      await supabase.from('user_roles').upsert({
        user_id: userId,
        role_id: roleId,
        department_id: r.scopeType === 'department' ? deptMap[fac.department] : null,
        scope_type: r.scopeType,
        scope_value: r.scopeValue || null,
        semester: r.semester || null,
        section: r.section || null,
        academic_year: ACADEMIC_YEAR,
        is_primary: r.isPrimary,
        is_active: true,
        assignment_reason: `Demo appointment for ${r.roleKey}`
      }, { onConflict: 'user_id,role_id,department_id,scope_type,scope_id' });
    }

    // Default workspace preference
    await supabase.from('user_workspace_preferences').upsert({
      user_id: userId,
      active_workspace_role_key: 'faculty',
      active_department_id: deptMap[fac.department]
    }, { onConflict: 'user_id' });

    console.log(`✓ Faculty: ${fac.name} [${fac.employeeCode}] -> Roles: ${fac.roles.map(r => r.roleKey).join(', ')}`);
  }

  // ---------------------------------------------------------------------------
  // 4. HOD ASSIGNMENTS (CSE: Dr. Anuj Sharma, ECE: Dr. Kavita Joshi)
  // ---------------------------------------------------------------------------
  console.log('\n4. Recording Department HOD Assignments...');
  const anujUserId = facultyUserMap['HIET-FAC-CSE-001'].userId;
  const kavitaUserId = facultyUserMap['HIET-FAC-ECE-001'].userId;

  // Update departments.hod_user_id
  await supabase.from('departments').update({ hod_user_id: anujUserId }).eq('code', 'CSE');
  await supabase.from('departments').update({ hod_user_id: kavitaUserId }).eq('code', 'ECE');

  // Insert into department_hod_assignments
  await supabase.from('department_hod_assignments').upsert({
    department_id: deptMap['CSE'],
    faculty_user_id: anujUserId,
    effective_from: '2026-07-01',
    is_active: true,
    remarks: 'Demo HOD assignment for CSE department'
  }, { onConflict: 'department_id,faculty_user_id' });

  await supabase.from('department_hod_assignments').upsert({
    department_id: deptMap['ECE'],
    faculty_user_id: kavitaUserId,
    effective_from: '2026-07-01',
    is_active: true,
    remarks: 'Demo HOD assignment for ECE department'
  }, { onConflict: 'department_id,faculty_user_id' });

  // Notifications for HOD assignments
  await supabase.from('notifications').insert([
    {
      recipient_user_id: anujUserId,
      recipient_role: 'hod',
      title: 'You have been assigned as HOD',
      message: 'You have been assigned as Head of Department for Computer Science & Engineering. Your Faculty workspace remains active.',
      type: 'notice',
      is_read: false
    },
    {
      recipient_user_id: kavitaUserId,
      recipient_role: 'hod',
      title: 'You have been assigned as HOD',
      message: 'You have been assigned as Head of Department for Electronics & Communication Engineering. Your Faculty workspace remains active.',
      type: 'notice',
      is_read: false
    }
  ]);
  console.log('✓ HOD assignments and notifications initialized for CSE and ECE');

  // ---------------------------------------------------------------------------
  // 5. CLASS IN-CHARGE ASSIGNMENT (Mr. Rohit Mehta for CSE Sem 1-A)
  // ---------------------------------------------------------------------------
  console.log('\n5. Recording Class In-Charge Assignment for CSE Sem 1-A...');
  await supabase.from('class_incharges').upsert({
    department_code: 'CSE',
    semester: 1,
    section: 'A',
    academic_year: ACADEMIC_YEAR,
    employee_code: 'HIET-FAC-CSE-002',
    is_active: true
  }, { onConflict: 'department_code,semester,section,academic_year' });
  console.log('✓ Class In-Charge assigned: Mr. Rohit Mehta (CSE Sem 1-A, 2026-2027)');

  // ---------------------------------------------------------------------------
  // 6. HOSTELS AND WARDEN ASSIGNMENTS
  // ---------------------------------------------------------------------------
  console.log('\n6. Initializing Hostels and Warden Assignments...');
  const nehaUserId = facultyUserMap['HIET-FAC-CSE-003'].userId;
  const poojaUserId = facultyUserMap['HIET-FAC-ECE-002'].userId;

  const hostelRecords = [
    {
      code: 'GIRLS-HOSTEL-A',
      name: 'Girls Hostel Block A',
      type: 'girls',
      warden_user_id: nehaUserId,
      warden_employee_code: 'HIET-FAC-CSE-003',
      warden_name: 'Ms. Neha Kapoor',
      capacity: 120,
      is_active: true,
      data_environment: 'development',
      is_demo_account: true
    },
    {
      code: 'BOYS-HOSTEL-B',
      name: 'Boys Hostel Block B',
      type: 'boys',
      warden_user_id: poojaUserId,
      warden_employee_code: 'HIET-FAC-ECE-002',
      warden_name: 'Ms. Pooja Thakur',
      capacity: 150,
      is_active: true,
      data_environment: 'development',
      is_demo_account: true
    }
  ];

  for (const h of hostelRecords) {
    await supabase.from('hostels').upsert(h, { onConflict: 'code' });
  }
  console.log('✓ Girls Hostel Block A (Ms. Neha Kapoor) and Boys Hostel Block B (Ms. Pooja Thakur) configured');

  // ---------------------------------------------------------------------------
  // 7. INSTITUTIONAL ADMINISTRATIVE USERS
  // ---------------------------------------------------------------------------
  console.log('\n7. Synchronizing Institutional Support Users (Principal, MD, Security, Staff)...');
  const instUserMap: Record<string, string> = {};
  for (const inst of INSTITUTIONAL_USERS) {
    const authId = await getOrCreateAuthUser(inst.email, inst.name, inst.role, inst.identifier);
    const { data: userRec } = await supabase
      .from('users')
      .upsert({
        supabase_auth_id: authId,
        email: inst.email,
        role: inst.role,
        is_active: true,
        is_demo_account: true,
        data_environment: 'development'
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (userRec) {
      instUserMap[inst.role] = userRec.id;
      const roleId = roleMap[inst.role];
      if (roleId) {
        await supabase.from('user_roles').upsert({
          user_id: userRec.id,
          role_id: roleId,
          scope_type: 'institution',
          is_primary: true,
          is_active: true
        }, { onConflict: 'user_id,role_id,department_id,scope_type,scope_id' });
      }
    }
  }
  console.log('✓ Institutional staff accounts configured');

  // ---------------------------------------------------------------------------
  // 8. 30 STUDENT ACCOUNTS (15 CSE + 15 ECE)
  // ---------------------------------------------------------------------------
  console.log('\n8. Creating 30 Student Accounts (15 CSE + 15 ECE)...');
  const studentUserMap: Record<string, { userId: string; studentMasterId: string }> = {};

  for (const std of DEMO_STUDENTS) {
    const authId = await getOrCreateAuthUser(std.email, std.name, 'student', std.rollNo);

    // Upsert public.users
    const { data: userRec, error: userErr } = await supabase
      .from('users')
      .upsert({
        supabase_auth_id: authId,
        email: std.email,
        role: 'student',
        department_id: deptMap[std.department],
        is_active: true,
        is_demo_account: true,
        data_environment: 'development'
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (userErr || !userRec) {
      throw new Error(`Failed to upsert public.users for student ${std.email}: ${userErr?.message}`);
    }

    const userId = userRec.id;

    // Upsert students_master
    const { data: smRec, error: smErr } = await supabase
      .from('students_master')
      .upsert({
        user_id: userId,
        student_id: std.rollNo,
        roll_no: std.rollNo,
        name: std.name,
        full_name: std.name,
        course: 'B.Tech',
        department: std.department,
        department_id: deptMap[std.department],
        branch: std.department,
        semester: 1,
        section: 'A',
        academic_year: ACADEMIC_YEAR,
        gender: std.gender,
        hostel_code: std.hostel !== 'Day Scholar' ? std.hostel : null,
        hostel_name: std.hostel !== 'Day Scholar' ? (std.hostel === 'GIRLS-HOSTEL-A' ? 'Girls Hostel Block A' : 'Boys Hostel Block B') : null,
        room_no: std.hostel !== 'Day Scholar' ? `R-${std.rollNo.slice(-3)}` : null,
        college_email: std.email,
        phone: `+91 98160 ${std.rollNo.slice(-5)}`,
        cgpa: std.cgpa,
        sgpa: std.cgpa,
        status: 'active',
        is_demo_account: true,
        data_environment: 'development'
      }, { onConflict: 'roll_no' })
      .select('id')
      .single();

    if (smErr || !smRec) {
      throw new Error(`Failed to upsert students_master for ${std.rollNo}: ${smErr?.message}`);
    }

    studentUserMap[std.rollNo] = { userId, studentMasterId: smRec.id };

    // Upsert student role
    const studentRoleId = roleMap['student'];
    if (studentRoleId) {
      await supabase.from('user_roles').upsert({
        user_id: userId,
        role_id: studentRoleId,
        department_id: deptMap[std.department],
        scope_type: 'department',
        semester: 1,
        section: 'A',
        academic_year: ACADEMIC_YEAR,
        is_primary: true,
        is_active: true
      }, { onConflict: 'user_id,role_id,department_id,scope_type,scope_id' });
    }
  }
  console.log('✓ 30 student profiles, master records, and role mappings registered');

  // ---------------------------------------------------------------------------
  // 9. ACADEMIC SUBJECTS & TEACHER ASSIGNMENTS
  // ---------------------------------------------------------------------------
  console.log('\n9. Registering Semester 1 Subjects & Faculty Allocations...');
  const cseSubjects = [
    { code: 'BTPH101', name: 'Applied Physics', dept: 'CSE', sem: 1, credits: 4, facId: 'HIET-FAC-CSE-001' },
    { code: 'BTCS104', name: 'Programming for Problem Solving', dept: 'CSE', sem: 1, credits: 4, facId: 'HIET-FAC-CSE-001' },
    { code: 'BTMA102', name: 'Engineering Mathematics-I', dept: 'CSE', sem: 1, credits: 4, facId: 'HIET-FAC-CSE-003' }, // Ms. Neha Kapoor
    { code: 'BTEE103', name: 'Basic Electrical Engineering', dept: 'CSE', sem: 1, credits: 4, facId: 'HIET-FAC-CSE-002' }, // Mr. Rohit Mehta
    { code: 'BTHM105', name: 'Communication Skills', dept: 'CSE', sem: 1, credits: 3, facId: null },
    { code: 'BTCS106', name: 'Programming Lab', dept: 'CSE', sem: 1, credits: 2, facId: 'HIET-FAC-CSE-001' }
  ];

  const eceSubjects = [
    { code: 'ECPH101', name: 'Engineering Physics', dept: 'ECE', sem: 1, credits: 4, facId: 'HIET-FAC-ECE-001' }, // Dr. Kavita Joshi
    { code: 'ECMA102', name: 'Engineering Mathematics-I', dept: 'ECE', sem: 1, credits: 4, facId: 'HIET-FAC-ECE-001' }, // Dr. Kavita Joshi
    { code: 'ECEC103', name: 'Basic Electronics', dept: 'ECE', sem: 1, credits: 4, facId: 'HIET-FAC-ECE-002' }, // Ms. Pooja Thakur
    { code: 'ECPR104', name: 'Electronics Lab', dept: 'ECE', sem: 1, credits: 2, facId: 'HIET-FAC-ECE-002' } // Ms. Pooja Thakur
  ];

  const subjectIdMap: Record<string, string> = {};

  for (const s of [...cseSubjects, ...eceSubjects]) {
    const teacherMasterId = s.facId ? facultyUserMap[s.facId]?.teacherMasterId : null;
    const { data: subRec } = await supabase
      .from('subjects')
      .upsert({
        subject_code: s.code,
        subject_name: s.name,
        branch: s.dept,
        semester: s.sem,
        credits: s.credits,
        teacher_id: teacherMasterId
      }, { onConflict: 'subject_code' })
      .select('id, subject_code')
      .single();

    if (subRec) {
      subjectIdMap[subRec.subject_code] = subRec.id;
    }
  }
  console.log(`✓ Synchronized ${Object.keys(subjectIdMap).length} subjects across CSE and ECE`);

  // ---------------------------------------------------------------------------
  // 10. CSE TIMETABLE (CSE Sem 1 Sec A)
  // ---------------------------------------------------------------------------
  console.log('\n10. Configuring CSE Semester 1 Section A Timetable...');
  const timetableSlots = [
    // Monday
    { day_of_week: 'Monday', start_time: '09:00:00', end_time: '10:00:00', subject_code: 'BTPH101', room: 'C-101', teacher_code: 'HIET-FAC-CSE-001' },
    { day_of_week: 'Monday', start_time: '10:00:00', end_time: '11:00:00', subject_code: 'BTMA102', room: 'C-102', teacher_code: 'HIET-FAC-CSE-003' },
    { day_of_week: 'Monday', start_time: '11:00:00', end_time: '12:00:00', subject_code: 'BTCS104', room: 'C-103', teacher_code: 'HIET-FAC-CSE-001' },
    { day_of_week: 'Monday', start_time: '12:00:00', end_time: '13:00:00', subject_code: 'BTEE103', room: 'C-104', teacher_code: 'HIET-FAC-CSE-002' },
    { day_of_week: 'Monday', start_time: '14:00:00', end_time: '15:00:00', subject_code: 'BTHM105', room: 'C-105', teacher_code: null },
    // Tuesday
    { day_of_week: 'Tuesday', start_time: '09:00:00', end_time: '10:00:00', subject_code: 'BTCS106', room: 'C-LAB-1', teacher_code: 'HIET-FAC-CSE-001' },
    { day_of_week: 'Tuesday', start_time: '10:00:00', end_time: '11:00:00', subject_code: 'BTPH101', room: 'C-101', teacher_code: 'HIET-FAC-CSE-001' },
    { day_of_week: 'Tuesday', start_time: '11:00:00', end_time: '12:00:00', subject_code: 'BTMA102', room: 'C-102', teacher_code: 'HIET-FAC-CSE-003' },
    { day_of_week: 'Tuesday', start_time: '12:00:00', end_time: '13:00:00', subject_code: 'BTEE103', room: 'C-104', teacher_code: 'HIET-FAC-CSE-002' }
  ];

  for (const slot of timetableSlots) {
    const subId = subjectIdMap[slot.subject_code];
    const tId = slot.teacher_code ? facultyUserMap[slot.teacher_code]?.teacherMasterId : null;
    if (subId) {
      await supabase.from('timetables').upsert({
        branch: 'CSE',
        semester: 1,
        section: 'A',
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        subject_id: subId,
        teacher_id: tId,
        room: slot.room,
        academic_year: ACADEMIC_YEAR
      }, { onConflict: 'branch,semester,section,day_of_week,start_time' });
    }
  }
  console.log('✓ Monday and Tuesday CSE 1-A timetable established');

  // ---------------------------------------------------------------------------
  // 11. ACTIVE ATTENDANCE SESSION & CURRENT SCANS
  // ---------------------------------------------------------------------------
  console.log('\n11. Creating Active Attendance Session for Applied Physics (C-101)...');
  const anujTeacherId = facultyUserMap['HIET-FAC-CSE-001'].teacherMasterId;
  const appliedPhysicsId = subjectIdMap['BTPH101'];

  const { data: sessionRec } = await supabase
    .from('attendance_sessions')
    .insert({
      teacher_id: anujTeacherId,
      subject_id: appliedPhysicsId,
      course: 'B.Tech',
      branch: 'CSE',
      semester: 1,
      section: 'A',
      room_code: 'C-101',
      qr_token: 'DEMO-LIVE-APPLIED-PHYSICS-TOKEN',
      qr_refresh_seconds: 6,
      geofence_lat: 32.2190000,
      geofence_lng: 76.2708000,
      geofence_radius_meters: 30,
      total_marked: 2,
      is_active: true
    })
    .select('id')
    .single();

  if (sessionRec) {
    const sessionId = sessionRec.id;
    console.log(`✓ Active test session launched: C-101 (Session ID: ${sessionId})`);

    // Insert sample live attendance records
    const liveScans = [
      { roll: 'HIET-CSE-2026-001', status: 'verified', dist: 18.0, acc: 8.0, reason: null },
      { roll: 'HIET-CSE-2026-003', status: 'verified', dist: 12.0, acc: 6.0, reason: null },
      { roll: 'HIET-CSE-2026-002', status: 'flagged', dist: 27.0, acc: 24.0, reason: 'Location accuracy > 20m' },
      { roll: 'HIET-CSE-2026-004', status: 'invalid', dist: 48.0, acc: 10.0, reason: 'Outside 30m geofence' }
    ];

    for (const scan of liveScans) {
      const sId = studentUserMap[scan.roll]?.studentMasterId;
      if (sId) {
        await supabase.from('attendance_records').insert({
          session_id: sessionId,
          student_id: sId,
          student_roll: scan.roll,
          subject_id: appliedPhysicsId,
          date: new Date().toISOString().split('T')[0],
          status: scan.status === 'invalid' ? 'Absent' : 'Present',
          verification_status: scan.status,
          distance_meters: scan.dist,
          location_accuracy_meters: scan.acc,
          is_flagged: scan.status === 'flagged',
          flagged_reason: scan.reason
        });
      }
    }
    console.log('✓ Current test attendance scan records logged');
  }

  // ---------------------------------------------------------------------------
  // 12. DEMO LEAVE REQUESTS & WORKFLOW ROUTING
  // ---------------------------------------------------------------------------
  console.log('\n12. Generating Multi-Tiered Leave Workflow Requests...');
  const rohitUserId = facultyUserMap['HIET-FAC-CSE-002'].userId;

  // Leave 1: Short Leave (Aditya Nanda -> Mr. Rohit Mehta, Class In-Charge)
  const adityaUserId = studentUserMap['HIET-CSE-2026-001'].userId;
  const adityaSmId = studentUserMap['HIET-CSE-2026-001'].studentMasterId;

  await supabase.from('leave_requests').insert({
    student_id: adityaSmId,
    user_id: adityaUserId,
    department_id: deptMap['CSE'],
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    total_days: 2,
    reason: 'Family function attendance in hometown',
    leave_type: 'Casual',
    status: 'pending_faculty',
    current_stage: 'faculty',
    current_assignee_user_id: rohitUserId,
    current_assignee_role_key: 'class_incharge',
    submitted_by_user_id: adityaUserId
  });

  // Leave 2: HOD Leave (Aarav Sharma -> Approved by Rohit -> Pending HOD Anuj Sharma)
  const aaravUserId = studentUserMap['HIET-CSE-2026-002'].userId;
  const aaravSmId = studentUserMap['HIET-CSE-2026-002'].studentMasterId;

  const { data: aaravLeave } = await supabase.from('leave_requests').insert({
    student_id: aaravSmId,
    user_id: aaravUserId,
    department_id: deptMap['CSE'],
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    total_days: 4,
    reason: 'Medical treatment and doctor-prescribed rest',
    leave_type: 'Medical',
    status: 'pending_hod',
    current_stage: 'hod',
    current_assignee_user_id: anujUserId,
    current_assignee_role_key: 'hod',
    submitted_by_user_id: aaravUserId
  }).select('id').single();

  if (aaravLeave) {
    await supabase.from('leave_request_history').insert([
      { leave_id: aaravLeave.id, action_key: 'submitted', from_status: 'draft', to_status: 'pending_faculty', stage_role_key: 'student', performed_by_user_id: aaravUserId, remarks: 'Submitted medical leave' },
      { leave_id: aaravLeave.id, action_key: 'approved', from_status: 'pending_faculty', to_status: 'pending_hod', stage_role_key: 'class_incharge', performed_by_user_id: rohitUserId, remarks: 'Verified medical certificate. Forwarded to HOD for leave > 2 days.' }
    ]);
  }

  // Leave 3: Approved Leave (Ananya Verma -> Approved by Rohit)
  const ananyaUserId = studentUserMap['HIET-CSE-2026-006'].userId;
  const ananyaSmId = studentUserMap['HIET-CSE-2026-006'].studentMasterId;

  await supabase.from('leave_requests').insert({
    student_id: ananyaSmId,
    user_id: ananyaUserId,
    department_id: deptMap['CSE'],
    start_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    total_days: 2,
    reason: 'Urgent domestic personal leave',
    leave_type: 'Casual',
    status: 'approved',
    current_stage: 'faculty',
    final_decision_by_user_id: rohitUserId,
    final_decision_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    approval_remarks: 'Approved by Class In-Charge Mr. Rohit Mehta'
  });

  // Leave 4: Long Leave (Priya Verma -> Approved Rohit -> Approved Anuj -> Pending Principal)
  const priyaUserId = studentUserMap['HIET-CSE-2026-003'].userId;
  const priyaSmId = studentUserMap['HIET-CSE-2026-003'].studentMasterId;
  const principalUserId = instUserMap['principal'];

  const { data: priyaLeave } = await supabase.from('leave_requests').insert({
    student_id: priyaSmId,
    user_id: priyaUserId,
    department_id: deptMap['CSE'],
    start_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    total_days: 8,
    reason: 'Representing HIET in National-level Smart India Hackathon',
    leave_type: 'Duty',
    status: 'pending_principal',
    current_stage: 'principal',
    current_assignee_user_id: principalUserId,
    current_assignee_role_key: 'principal',
    submitted_by_user_id: priyaUserId
  }).select('id').single();

  if (priyaLeave) {
    await supabase.from('leave_request_history').insert([
      { leave_id: priyaLeave.id, action_key: 'submitted', from_status: 'draft', to_status: 'pending_faculty', stage_role_key: 'student', performed_by_user_id: priyaUserId, remarks: 'Applied for hackathon duty leave' },
      { leave_id: priyaLeave.id, action_key: 'approved', from_status: 'pending_faculty', to_status: 'pending_hod', stage_role_key: 'class_incharge', performed_by_user_id: rohitUserId, remarks: 'Class In-Charge recommended participation' },
      { leave_id: priyaLeave.id, action_key: 'approved', from_status: 'pending_hod', to_status: 'pending_principal', stage_role_key: 'hod', performed_by_user_id: anujUserId, remarks: 'HOD approved national coding event. Forwarded to Principal for final sanction.' }
    ]);
  }
  console.log('✓ 4 Leave test scenarios seeded (Short -> Rohit, Medical -> Anuj, Approved, Long -> Principal)');

  // ---------------------------------------------------------------------------
  // 13. DEMO COMPLAINTS & SLA ESCALATION
  // ---------------------------------------------------------------------------
  console.log('\n13. Seeding Complaints & SLA Escalation Test Cases...');
  const complaints = [
    {
      studentRoll: 'HIET-CSE-2026-007',
      category: 'Infrastructure issue',
      title: 'C-101 fan is not working',
      description: 'Ceiling fan #2 in classroom C-101 makes screeching noise and does not rotate.',
      status: 'Open',
      assignedRole: 'maintenance_staff'
    },
    {
      studentRoll: 'HIET-CSE-2026-002',
      category: 'Academic issue',
      title: 'Internal Mathematics marks not visible',
      description: 'First sessional test score for Engineering Mathematics-I is not showing in student portal.',
      status: 'In Progress',
      assignedRole: 'faculty'
    },
    {
      studentRoll: 'HIET-CSE-2026-003',
      category: 'Lab issue',
      title: 'Programming lab computer 12 does not start',
      description: 'Workstation 12 in C-LAB-1 fails to power on during lab sessions.',
      status: 'Open',
      assignedRole: 'lab_staff'
    },
    {
      studentRoll: 'HIET-CSE-2026-001',
      category: 'Hostel issue',
      title: 'Hostel Wi-Fi issue in Block B',
      description: 'Wi-Fi access point on 2nd floor Boys Hostel Block B drops connection repeatedly after 8 PM.',
      status: 'In Progress',
      assignedRole: 'it_staff'
    },
    {
      studentRoll: 'HIET-ECE-2026-014',
      category: 'Classroom issue',
      title: 'Projector in ECE classroom is not working',
      description: 'Overhead HDMI projector in E-201 displays blank blue screen.',
      status: 'Open',
      assignedRole: 'maintenance_staff'
    },
    // SLA Escalation Test Case (> 48 hours old)
    {
      studentRoll: 'HIET-CSE-2026-007',
      category: 'Infrastructure issue',
      title: 'C-101 Water leakage near switchboard [SLA Escalated]',
      description: 'Rainwater seepage noticed on north wall near main electrical switchboard in classroom C-101. Exceeded 48h resolution SLA.',
      status: 'escalated',
      assignedRole: 'maintenance_staff',
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
    }
  ];

  for (const c of complaints) {
    const sId = studentUserMap[c.studentRoll]?.studentMasterId;
    if (sId) {
      await supabase.from('complaints').insert({
        student_id: sId,
        category: c.category,
        subject: c.title,
        description: c.description,
        status: c.status,
        created_at: c.createdAt || new Date().toISOString()
      });
    }
  }
  console.log('✓ 6 Complaints seeded including 48h SLA escalation case');

  // ---------------------------------------------------------------------------
  // 14. SMART BOARD LESSONS
  // ---------------------------------------------------------------------------
  console.log('\n14. Seeding Smart Board Lessons & Syllabus Progress...');
  const smartLessons = [
    { teacherId: anujTeacherId, subjectCode: 'BTPH101', unit: '1 — Laser', topic: 'He-Ne Laser', duration: 50, status: 'synced', summary: 'Unit 1: Laser - He-Ne Laser principles, energy levels, and output wavelength calculation.' },
    { teacherId: anujTeacherId, subjectCode: 'BTCS104', unit: '1', topic: 'Introduction to C Programming', duration: 50, status: 'synced', summary: 'C syntax, compiler structure, standard input/output printf/scanf routines.' },
    { teacherId: facultyUserMap['HIET-FAC-CSE-003'].teacherMasterId, subjectCode: 'BTMA102', unit: '1', topic: 'Differential Equations', duration: 50, status: 'pending_sync', summary: 'First-order exact differential forms and integrating factors.' },
    { teacherId: facultyUserMap['HIET-FAC-CSE-002'].teacherMasterId, subjectCode: 'BTEE103', unit: '1', topic: 'Transformer Basics', duration: 45, status: 'reviewed', summary: 'Core construction, EMF equation, and equivalent circuit.' },
    { teacherId: facultyUserMap['HIET-FAC-ECE-001'].teacherMasterId, subjectCode: 'ECPH101', unit: '1', topic: 'Wave Optics', duration: 50, status: 'synced', summary: 'Interference, Young double slit experiment, and coherence length.' },
    { teacherId: facultyUserMap['HIET-FAC-ECE-002'].teacherMasterId, subjectCode: 'ECEC103', unit: '1', topic: 'Semiconductor Diodes', duration: 45, status: 'synced', summary: 'PN junction under forward and reverse bias, I-V characteristics.' }
  ];

  for (const l of smartLessons) {
    const subId = subjectIdMap[l.subjectCode];
    if (subId && l.teacherId) {
      await supabase.from('smart_board_lessons').insert({
        teacher_id: l.teacherId,
        subject_id: subId,
        teaching_date: new Date().toISOString().split('T')[0],
        duration_minutes: l.duration,
        unit: l.unit,
        topic: l.topic,
        summary: l.summary,
        sync_status: l.status
      });
    }
  }
  console.log('✓ Smart Board demo lessons recorded across departments');

  // ---------------------------------------------------------------------------
  // 15. ASSIGNMENTS & SUBMISSIONS
  // ---------------------------------------------------------------------------
  console.log('\n15. Seeding Academic Assignments & Submissions...');
  const progSubjectId = subjectIdMap['BTCS104'];
  const electronicsSubId = subjectIdMap['ECEC103'];

  // CSE Assignment
  const { data: cseAssign } = await supabase.from('assignments').insert({
    subject_id: progSubjectId,
    teacher_id: anujTeacherId,
    title: 'C Programming Basics',
    description: 'Implement calculator using switch-case and fibonacci sequence with loops.',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    total_marks: 20
  }).select('id').single();

  if (cseAssign) {
    const adityaId = studentUserMap['HIET-CSE-2026-001'].studentMasterId;
    const aaravId = studentUserMap['HIET-CSE-2026-002'].studentMasterId;
    const priyaId = studentUserMap['HIET-CSE-2026-003'].studentMasterId;

    // Aditya: Graded 18/20
    await supabase.from('assignment_submissions').insert({
      assignment_id: cseAssign.id,
      student_id: adityaId,
      submission_date: new Date(Date.now() - 86400000).toISOString(),
      marks: 18,
      feedback: 'Good use of loops and functions.',
      status: 'Graded'
    });

    // Aarav: Submitted late
    await supabase.from('assignment_submissions').insert({
      assignment_id: cseAssign.id,
      student_id: aaravId,
      submission_date: new Date().toISOString(),
      status: 'Submitted Late'
    });

    // Priya: Submitted pending grading
    await supabase.from('assignment_submissions').insert({
      assignment_id: cseAssign.id,
      student_id: priyaId,
      submission_date: new Date().toISOString(),
      status: 'Submitted'
    });
  }

  // ECE Assignment
  const poojaTeacherId = facultyUserMap['HIET-FAC-ECE-002'].teacherMasterId;
  await supabase.from('assignments').insert({
    subject_id: electronicsSubId,
    teacher_id: poojaTeacherId,
    title: 'Diode Characteristics',
    description: 'Plot forward and reverse bias characteristics of 1N4007 silicon diode.',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    total_marks: 20
  });
  console.log('✓ Assignments and student submissions initialized');

  // ---------------------------------------------------------------------------
  // 16. HOSTEL OUTPASS & GATE PASS
  // ---------------------------------------------------------------------------
  console.log('\n16. Seeding Hostel Outpasses & Gate Passes...');
  const priyaSmId2 = studentUserMap['HIET-CSE-2026-003'].studentMasterId;
  const adityaSmId2 = studentUserMap['HIET-CSE-2026-001'].studentMasterId;
  const rahulSmId = studentUserMap['HIET-CSE-2026-009'].studentMasterId;

  // Girls Hostel Outpass (Priya Verma -> Warden Ms. Neha Kapoor)
  await supabase.from('hostel_outpasses').insert({
    student_id: priyaSmId2,
    hostel_block: 'GIRLS-HOSTEL-A',
    room_number: 'R-003',
    destination: 'Shimla',
    reason: 'Family visit over weekend',
    parent_contact: '+91 94180 55101',
    departure_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    departure_time: '17:00:00',
    expected_return_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    expected_return_time: '18:00:00',
    status: 'pending',
    verification_token: 'DEV-OUTPASS-PRIYA-003',
    warden_id: nehaUserId
  });

  // Boys Hostel Outpass (Aditya Nanda -> Approved by Ms. Pooja Thakur)
  await supabase.from('hostel_outpasses').insert({
    student_id: adityaSmId2,
    hostel_block: 'BOYS-HOSTEL-B',
    room_number: 'R-001',
    destination: 'Home',
    reason: 'Attending family occasion',
    parent_contact: '+91 94180 44001',
    departure_date: new Date().toISOString().split('T')[0],
    departure_time: '16:00:00',
    expected_return_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    expected_return_time: '19:00:00',
    status: 'approved',
    verification_token: 'DEV-OUTPASS-ADITYA-001',
    warden_id: poojaUserId,
    warden_remarks: 'Approved after telephone confirmation from parent'
  });

  // Gate Pass (Rahul Singh -> Approved)
  await supabase.from('gate_passes').insert({
    student_id: rahulSmId,
    destination: 'Kangra',
    reason: 'Personal banking work',
    requested_out_time: new Date().toISOString(),
    expected_return_time: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    status: 'approved',
    verification_token: 'DEV-GATEPASS-RAHUL-009',
    token_expires_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString()
  });
  console.log('✓ Hostel outpasses and campus gate pass test records seeded');

  // ---------------------------------------------------------------------------
  // 17. NOTIFICATIONS SUITE (FACULTY, HOD, WARDEN, STUDENTS)
  // ---------------------------------------------------------------------------
  console.log('\n17. Seeding Targeted Role Notifications...');
  const facultyNotifications = [
    // Dr. Anuj Sharma
    { user_id: anujUserId, role: 'hod', title: 'HOD Approval Required', message: 'Aarav Sharma medical leave application (4 days) requires your approval.', type: 'alert' },
    { user_id: anujUserId, role: 'hod', title: 'Attendance Risk Alert', message: 'Four CSE Semester 1-A students are currently below the 75% attendance threshold.', type: 'warning' },
    { user_id: anujUserId, role: 'hod', title: 'SLA Escalation Alert', message: 'C-101 infrastructure complaint exceeded 48-hour resolution SLA.', type: 'alert' },
    { user_id: anujUserId, role: 'faculty', title: 'Smart Board Review Needed', message: 'Smart Board lesson submitted by Ms. Neha Kapoor for BTMA102 requires peer review.', type: 'notice' },

    // Dr. Kavita Joshi
    { user_id: kavitaUserId, role: 'hod', title: 'ECE Attendance Alert', message: 'Two ECE Semester 1-A students are below the 75% mandatory attendance threshold.', type: 'warning' },
    { user_id: kavitaUserId, role: 'hod', title: 'Department Complaint Open', message: 'ECE classroom projector complaint in E-201 is currently open.', type: 'notice' },

    // Mr. Rohit Mehta
    { user_id: rohitUserId, role: 'faculty', title: 'Class In-Charge Action Required', message: 'Aditya Nanda (CSE Sem 1-A) has submitted a 2-day casual leave request.', type: 'alert' },
    { user_id: rohitUserId, role: 'faculty', title: 'Class Attendance Watch', message: 'CSE Sem 1-A average attendance (76.8%) is slightly below the department target (80%).', type: 'warning' },
    { user_id: rohitUserId, role: 'faculty', title: 'Assignment Submissions Pending', message: 'Three Basic Electrical Engineering assignment submissions are pending evaluation.', type: 'notice' },

    // Ms. Neha Kapoor
    { user_id: nehaUserId, role: 'warden', title: 'Hostel Outpass Request', message: 'Priya Verma (GIRLS-HOSTEL-A, R-003) has requested an outpass to Shimla.', type: 'alert' },
    { user_id: nehaUserId, role: 'faculty', title: 'Student Query in Progress', message: 'Aarav Sharma academic score inquiry for Engineering Mathematics-I is assigned to you.', type: 'notice' },

    // Ms. Pooja Thakur
    { user_id: poojaUserId, role: 'warden', title: 'Outpass Approved', message: 'Aditya Nanda boys hostel outpass has been approved and QR verification token issued.', type: 'notice' },
    { user_id: poojaUserId, role: 'faculty', title: 'New Lab Submission', message: 'New Basic Electronics diode characteristics assignment submission received.', type: 'notice' }
  ];

  for (const n of facultyNotifications) {
    await supabase.from('notifications').insert({
      recipient_user_id: n.user_id,
      recipient_role: n.role,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: false
    });
  }

  // Student Notifications
  for (const std of DEMO_STUDENTS) {
    const sUserId = studentUserMap[std.rollNo]?.userId;
    if (!sUserId) continue;

    if (std.attendance < 75) {
      await supabase.from('notifications').insert({
        recipient_user_id: sUserId,
        recipient_role: 'student',
        title: 'Attendance Advisory Notice',
        message: `Your current attendance is ${std.attendance}%, which is below the university mandate of 75%. Please attend regular classes.`,
        type: 'warning',
        is_read: false
      });
    }

    await supabase.from('notifications').insert({
      recipient_user_id: sUserId,
      recipient_role: 'student',
      title: 'Assignment Reminder: C Programming Basics',
      message: 'Assignment on Programming for Problem Solving is due next week. Please submit via student portal.',
      type: 'notice',
      is_read: false
    });
  }
  console.log('✓ Notifications generated for faculty, HODs, wardens, and students');

  console.log('\n======================================================================');
  console.log('DEMO SEEDING COMPLETED SUCCESSFULLY!');
  console.log('✓ 5 Faculty with active multi-roles');
  console.log('✓ 2 HODs (CSE: Dr. Anuj Sharma, ECE: Dr. Kavita Joshi)');
  console.log('✓ 1 Class In-Charge (CSE 1-A: Mr. Rohit Mehta)');
  console.log('✓ 2 Wardens (Girls: Ms. Neha Kapoor, Boys: Ms. Pooja Thakur)');
  console.log('✓ 30 Students (15 CSE + 15 ECE) with live attendance & leaves');
  console.log('✓ Common password for all demo accounts: Hiet@12345');
  console.log('======================================================================');
}

runSeed().catch(err => {
  console.error('\nFatal error during demo seed execution:', err);
  process.exit(1);
});
