// =============================================================================
// HIET DIGITAL CAMPUS — MASTER DEMO USERS DEFINITION STORE
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// 5 Faculty + 2 HODs + 1 Class In-Charge + 2 Wardens + 30 Students (15 CSE, 15 ECE)
// Strictly DEVELOPMENT-ONLY. Universal password: Hiet@12345
// =============================================================================

import { Profile, StudentMaster, TeacherMaster } from '../types';

export const DEMO_COMMON_PASSWORD = 'Hiet@12345';
export const DEMO_ACADEMIC_YEAR = '2026-2027';

// -----------------------------------------------------------------------------
// 1. FIVE FACULTY SPECIFICATIONS
// -----------------------------------------------------------------------------
export interface DemoFacultyData {
  name: string;
  email: string;
  employeeCode: string;
  department: 'CSE' | 'ECE';
  designation: string;
  phone: string;
  activeRoles: string[];
  responsibilities: string[];
  isHod: boolean;
  isClassIncharge: boolean;
  isWarden: boolean;
  hostelCode?: string;
  subjects: string[];
}

export const DEMO_FACULTY_LIST: DemoFacultyData[] = [
  {
    name: 'Dr. Anuj Sharma',
    email: 'anuj.sharma@hiet.demo',
    employeeCode: 'HIET-FAC-CSE-001',
    department: 'CSE',
    designation: 'HOD & Assistant Professor',
    phone: '+91 98160 55001',
    activeRoles: ['faculty', 'hod'],
    responsibilities: ['HOD of CSE', 'Teaches Applied Physics', 'Teaches Programming for Problem Solving'],
    isHod: true,
    isClassIncharge: false,
    isWarden: false,
    subjects: ['Applied Physics (BTPH101)', 'Programming for Problem Solving (BTCS104)', 'Programming Lab (BTCS106)']
  },
  {
    name: 'Dr. Kavita Joshi',
    email: 'kavita.joshi@hiet.demo',
    employeeCode: 'HIET-FAC-ECE-001',
    department: 'ECE',
    designation: 'HOD & Assistant Professor',
    phone: '+91 98160 55002',
    activeRoles: ['faculty', 'hod'],
    responsibilities: ['HOD of ECE', 'Teaches Engineering Physics', 'Teaches Engineering Mathematics-I for ECE'],
    isHod: true,
    isClassIncharge: false,
    isWarden: false,
    subjects: ['Engineering Physics (ECPH101)', 'Engineering Mathematics-I (ECMA102)']
  },
  {
    name: 'Mr. Rohit Mehta',
    email: 'rohit.mehta@hiet.demo',
    employeeCode: 'HIET-FAC-CSE-002',
    department: 'CSE',
    designation: 'Assistant Professor',
    phone: '+91 98160 55003',
    activeRoles: ['faculty', 'class_incharge'],
    responsibilities: [
      'Class In-Charge of CSE Semester 1 Section A',
      'Teaches Basic Electrical Engineering',
      'First approver for short leave requests in CSE Sem 1-A'
    ],
    isHod: false,
    isClassIncharge: true,
    isWarden: false,
    subjects: ['Basic Electrical Engineering (BTEE103)']
  },
  {
    name: 'Ms. Neha Kapoor',
    email: 'neha.kapoor@hiet.demo',
    employeeCode: 'HIET-FAC-CSE-003',
    department: 'CSE',
    designation: 'Assistant Professor',
    phone: '+91 98160 55004',
    activeRoles: ['faculty', 'warden'],
    responsibilities: ['Teaches Engineering Mathematics-I for CSE', 'Warden of Girls Hostel Block A'],
    isHod: false,
    isClassIncharge: false,
    isWarden: true,
    hostelCode: 'GIRLS-HOSTEL-A',
    subjects: ['Engineering Mathematics-I (BTMA102)']
  },
  {
    name: 'Ms. Pooja Thakur',
    email: 'pooja.thakur@hiet.demo',
    employeeCode: 'HIET-FAC-ECE-002',
    department: 'ECE',
    designation: 'Assistant Professor',
    phone: '+91 98160 55005',
    activeRoles: ['faculty', 'warden'],
    responsibilities: ['Teaches Basic Electronics for ECE', 'Warden of Boys Hostel Block B'],
    isHod: false,
    isClassIncharge: false,
    isWarden: true,
    hostelCode: 'BOYS-HOSTEL-B',
    subjects: ['Basic Electronics (ECEC103)', 'Electronics Lab (ECPR104)']
  }
];

// -----------------------------------------------------------------------------
// 2. THIRTY STUDENT SPECIFICATIONS (15 CSE + 15 ECE)
// -----------------------------------------------------------------------------
export interface DemoStudentData {
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

export const DEMO_STUDENTS_LIST: DemoStudentData[] = [
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

// -----------------------------------------------------------------------------
// 3. GENERATE FULL Profile OBJECTS FOR RUNTIME & SWITCHER
// -----------------------------------------------------------------------------

// Faculty 1: Dr. Anuj Sharma (Faculty + HOD CSE)
export const DEMO_FACULTY_ANUJ: Profile & { identifier: string } = {
  id: 'prof-tch-fac-cse-001',
  auth_user_id: 'auth-tch-fac-cse-001',
  role: 'faculty',
  teacher_id: 'tch-fac-cse-001',
  faculty_id: 'HIET-FAC-CSE-001',
  identifier: 'HIET-FAC-CSE-001',
  name: 'Dr. Anuj Sharma',
  email: 'anuj.sharma@hiet.demo',
  must_change_password: false,
  activeRoles: ['faculty', 'hod'],
  activeWorkspaceRole: 'faculty',
  workspaceRoles: [
    { roleKey: 'faculty', label: 'Faculty Workspace', departmentName: 'CSE' },
    { roleKey: 'hod', label: 'HOD — Computer Science & Engineering', departmentName: 'Computer Science & Engineering' }
  ],
  department: 'CSE',
  teacherMaster: {
    id: 'tch-fac-cse-001',
    faculty_id: 'HIET-FAC-CSE-001',
    full_name: 'Dr. Anuj Sharma',
    name: 'Dr. Anuj Sharma',
    department: 'CSE',
    designation: 'HOD & Assistant Professor',
    college_email: 'anuj.sharma@hiet.demo',
    phone: '+91 98160 55001',
    role: 'hod',
    is_hod: true,
    is_class_incharge: false,
    status: 'active'
  }
};

// Faculty 2: Dr. Kavita Joshi (Faculty + HOD ECE)
export const DEMO_FACULTY_KAVITA: Profile & { identifier: string } = {
  id: 'prof-tch-fac-ece-001',
  auth_user_id: 'auth-tch-fac-ece-001',
  role: 'faculty',
  teacher_id: 'tch-fac-ece-001',
  faculty_id: 'HIET-FAC-ECE-001',
  identifier: 'HIET-FAC-ECE-001',
  name: 'Dr. Kavita Joshi',
  email: 'kavita.joshi@hiet.demo',
  must_change_password: false,
  activeRoles: ['faculty', 'hod'],
  activeWorkspaceRole: 'faculty',
  workspaceRoles: [
    { roleKey: 'faculty', label: 'Faculty Workspace', departmentName: 'ECE' },
    { roleKey: 'hod', label: 'HOD — Electronics & Communication Engineering', departmentName: 'Electronics & Communication Engineering' }
  ],
  department: 'ECE',
  teacherMaster: {
    id: 'tch-fac-ece-001',
    faculty_id: 'HIET-FAC-ECE-001',
    full_name: 'Dr. Kavita Joshi',
    name: 'Dr. Kavita Joshi',
    department: 'ECE',
    designation: 'HOD & Assistant Professor',
    college_email: 'kavita.joshi@hiet.demo',
    phone: '+91 98160 55002',
    role: 'hod',
    is_hod: true,
    is_class_incharge: false,
    status: 'active'
  }
};

// Faculty 3: Mr. Rohit Mehta (Faculty + Class In-Charge CSE Sem 1-A)
export const DEMO_FACULTY_ROHIT: Profile & { identifier: string } = {
  id: 'prof-tch-fac-cse-002',
  auth_user_id: 'auth-tch-fac-cse-002',
  role: 'faculty',
  teacher_id: 'tch-fac-cse-002',
  faculty_id: 'HIET-FAC-CSE-002',
  identifier: 'HIET-FAC-CSE-002',
  name: 'Mr. Rohit Mehta',
  email: 'rohit.mehta@hiet.demo',
  must_change_password: false,
  activeRoles: ['faculty', 'class_incharge'],
  activeWorkspaceRole: 'faculty',
  workspaceRoles: [
    { roleKey: 'faculty', label: 'Faculty Workspace', departmentName: 'CSE' },
    { roleKey: 'class_incharge', label: 'Class In-Charge (CSE Sem 1-A)', departmentName: 'CSE' }
  ],
  department: 'CSE',
  teacherMaster: {
    id: 'tch-fac-cse-002',
    faculty_id: 'HIET-FAC-CSE-002',
    full_name: 'Mr. Rohit Mehta',
    name: 'Mr. Rohit Mehta',
    department: 'CSE',
    designation: 'Assistant Professor',
    college_email: 'rohit.mehta@hiet.demo',
    phone: '+91 98160 55003',
    role: 'teacher',
    is_hod: false,
    is_class_incharge: true,
    class_incharge_details: {
      branch: 'CSE',
      semester: 1,
      section: 'A'
    },
    status: 'active'
  }
};

// Faculty 4: Ms. Neha Kapoor (Faculty + Girls Hostel Warden)
export const DEMO_FACULTY_NEHA: Profile & { identifier: string } = {
  id: 'prof-tch-fac-cse-003',
  auth_user_id: 'auth-tch-fac-cse-003',
  role: 'faculty',
  teacher_id: 'tch-fac-cse-003',
  faculty_id: 'HIET-FAC-CSE-003',
  identifier: 'HIET-FAC-CSE-003',
  name: 'Ms. Neha Kapoor',
  email: 'neha.kapoor@hiet.demo',
  must_change_password: false,
  activeRoles: ['faculty', 'warden'],
  activeWorkspaceRole: 'faculty',
  workspaceRoles: [
    { roleKey: 'faculty', label: 'Faculty Workspace', departmentName: 'CSE' },
    { roleKey: 'warden', label: 'Hostel Warden (Girls Hostel Block A)', departmentName: 'GIRLS-HOSTEL-A' }
  ],
  department: 'CSE',
  teacherMaster: {
    id: 'tch-fac-cse-003',
    faculty_id: 'HIET-FAC-CSE-003',
    full_name: 'Ms. Neha Kapoor',
    name: 'Ms. Neha Kapoor',
    department: 'CSE',
    designation: 'Assistant Professor',
    college_email: 'neha.kapoor@hiet.demo',
    phone: '+91 98160 55004',
    role: 'teacher',
    is_hod: false,
    is_warden: true,
    warden_hostel_code: 'GIRLS-HOSTEL-A',
    status: 'active'
  }
};

// Faculty 5: Ms. Pooja Thakur (Faculty + Boys Hostel Warden)
export const DEMO_FACULTY_POOJA: Profile & { identifier: string } = {
  id: 'prof-tch-fac-ece-002',
  auth_user_id: 'auth-tch-fac-ece-002',
  role: 'faculty',
  teacher_id: 'tch-fac-ece-002',
  faculty_id: 'HIET-FAC-ECE-002',
  identifier: 'HIET-FAC-ECE-002',
  name: 'Ms. Pooja Thakur',
  email: 'pooja.thakur@hiet.demo',
  must_change_password: false,
  activeRoles: ['faculty', 'warden'],
  activeWorkspaceRole: 'faculty',
  workspaceRoles: [
    { roleKey: 'faculty', label: 'Faculty Workspace', departmentName: 'ECE' },
    { roleKey: 'warden', label: 'Hostel Warden (Boys Hostel Block B)', departmentName: 'BOYS-HOSTEL-B' }
  ],
  department: 'ECE',
  teacherMaster: {
    id: 'tch-fac-ece-002',
    faculty_id: 'HIET-FAC-ECE-002',
    full_name: 'Ms. Pooja Thakur',
    name: 'Ms. Pooja Thakur',
    department: 'ECE',
    designation: 'Assistant Professor',
    college_email: 'pooja.thakur@hiet.demo',
    phone: '+91 98160 55005',
    role: 'teacher',
    is_hod: false,
    is_warden: true,
    warden_hostel_code: 'BOYS-HOSTEL-B',
    status: 'active'
  }
};

export const ALL_DEMO_FACULTY_PROFILES: (Profile & { identifier: string })[] = [
  DEMO_FACULTY_ANUJ,
  DEMO_FACULTY_KAVITA,
  DEMO_FACULTY_ROHIT,
  DEMO_FACULTY_NEHA,
  DEMO_FACULTY_POOJA
];

// Institutional administrative profiles
export const DEMO_PRINCIPAL_RAJESH: Profile & { identifier: string } = {
  id: 'prof-principal-01',
  auth_user_id: 'auth-principal-01',
  role: 'principal',
  name: 'Dr. Rajesh Kumar',
  email: 'principal@hiet.demo',
  identifier: 'HIET-PRI-001',
  activeRoles: ['principal'],
  activeWorkspaceRole: 'principal',
  must_change_password: false
};

export const DEMO_MD_SHARMA: Profile & { identifier: string } = {
  id: 'prof-md-01',
  auth_user_id: 'auth-md-01',
  role: 'managing_director',
  name: 'Mr. R. K. Sharma',
  email: 'md@hiet.demo',
  identifier: 'HIET-MD-001',
  activeRoles: ['managing_director'],
  activeWorkspaceRole: 'managing_director',
  must_change_password: false
};

export const DEMO_SECURITY_RAMESH: Profile & { identifier: string } = {
  id: 'prof-security-01',
  auth_user_id: 'auth-security-01',
  role: 'security_guard',
  name: 'Ramesh Thakur',
  email: 'security@hiet.demo',
  identifier: 'HIET-SEC-001',
  activeRoles: ['security', 'security_guard'],
  activeWorkspaceRole: 'security',
  must_change_password: false
};

export const DEMO_LIBRARY_SUNITA: Profile & { identifier: string } = {
  id: 'prof-lib-01',
  auth_user_id: 'auth-lib-01',
  role: 'library_staff',
  name: 'Sunita Devi',
  email: 'library@hiet.demo',
  identifier: 'HIET-LIB-001',
  activeRoles: ['library_staff'],
  activeWorkspaceRole: 'library_staff',
  must_change_password: false
};

export const DEMO_LAB_MOHIT: Profile & { identifier: string } = {
  id: 'prof-lab-01',
  auth_user_id: 'auth-lab-01',
  role: 'lab_staff',
  name: 'Mohit Kumar',
  email: 'lab@hiet.demo',
  identifier: 'HIET-LAB-001',
  activeRoles: ['lab_staff'],
  activeWorkspaceRole: 'lab_staff',
  must_change_password: false
};

export const DEMO_IT_VIKRAM: Profile & { identifier: string } = {
  id: 'prof-it-01',
  auth_user_id: 'auth-it-01',
  role: 'it_staff',
  name: 'Vikram Singh',
  email: 'it@hiet.demo',
  identifier: 'HIET-IT-001',
  activeRoles: ['it_staff'],
  activeWorkspaceRole: 'it_staff',
  must_change_password: false
};

export const ALL_DEMO_STAFF_PROFILES: (Profile & { identifier: string })[] = [
  DEMO_PRINCIPAL_RAJESH,
  DEMO_MD_SHARMA,
  DEMO_SECURITY_RAMESH,
  DEMO_LIBRARY_SUNITA,
  DEMO_LAB_MOHIT,
  DEMO_IT_VIKRAM
];

// Student Profiles generation
export const ALL_DEMO_STUDENT_PROFILES: (Profile & { identifier: string })[] = DEMO_STUDENTS_LIST.map((std, idx) => {
  const masterRecord: StudentMaster = {
    id: `std-${std.department.toLowerCase()}-${String(idx + 1).padStart(3, '0')}`,
    roll_no: std.rollNo,
    name: std.name,
    father_name: `Sh. ${std.name.split(' ')[1] || 'Kumar'} Sharma`,
    mother_name: `Smt. Anita ${std.name.split(' ')[1] || 'Devi'}`,
    dob: '2004-06-12',
    course: 'B.Tech',
    department: std.department,
    branch: std.department,
    semester: 1,
    section: 'A',
    college_email: std.email,
    phone: `+91 98160 ${String(44000 + idx + 1)}`,
    cgpa: std.cgpa,
    sgpa: std.cgpa,
    gender: std.gender,
    hostel_code: std.hostel !== 'Day Scholar' ? std.hostel : undefined,
    hostel_name: std.hostel !== 'Day Scholar' ? (std.hostel === 'GIRLS-HOSTEL-A' ? 'Girls Hostel Block A' : 'Boys Hostel Block B') : undefined,
    room_no: std.hostel !== 'Day Scholar' ? `R-${String(idx + 1).padStart(3, '0')}` : undefined,
    test_case: std.testCase,
    attendance_percentage: std.attendance,
    status: 'active'
  };

  return {
    id: `prof-${masterRecord.id}`,
    auth_user_id: `auth-${masterRecord.id}`,
    role: 'student',
    student_id: masterRecord.id,
    identifier: std.rollNo,
    name: std.name,
    email: std.email,
    must_change_password: false,
    activeRoles: ['student'],
    activeWorkspaceRole: 'student',
    department: std.department,
    studentMaster: masterRecord
  };
});

// Master union of all demo accounts for authentication lookup
export const ALL_DEMO_PROFILES: (Profile & { identifier: string })[] = [
  ...ALL_DEMO_FACULTY_PROFILES,
  ...ALL_DEMO_STUDENT_PROFILES,
  ...ALL_DEMO_STAFF_PROFILES
];
