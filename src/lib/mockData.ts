// HIET Digital Campus - Comprehensive Master Seed Store & Local State Manager
// Himachal Institute of Engineering & Technology, Shahpur
// Mirrors Supabase PostgreSQL tables for standalone, offline & live operation

import { 
  StudentMaster, 
  TeacherMaster, 
  Profile, 
  Subject, 
  AttendanceRecord, 
  AcademicRecord, 
  Grade,
  Achievement, 
  SyllabusItem, 
  PYQItem, 
  LeaveRequest, 
  LeaveRequestHistory,
  LeaveWorkflowConfig,
  Complaint, 
  Doubt, 
  CalendarEvent, 
  Notice, 
  CampusLocation, 
  NotificationItem,
  SessionalResult,
  TimetableSlot,
  SyllabusProgress,
  CollegeSocialLink,
  GatePass,
  GateEntry,
  GatePassRequest,
  GateScanLog,
  FineRule,
  StudentFine,
  FineAppeal,
  ImportJob,
  ImportError,
  AiKnowledgeDocument,
  DeviceToken,
  NotificationPreferences,
  PushDeliveryLog,
  SmartBoardLesson,
  CampusZone,
  CampusPresenceRecord,
  ClassInchargeRecord,
  HodAssignmentRecord
} from '../types';

// =============================================================================
// 1. VERIFIED STUDENTS MASTER RECORDS (20 STUDENTS AS SPECIFIED)
// 10 B.Tech CSE + 10 B.Tech CSE AI/ML
// =============================================================================
export const INITIAL_STUDENTS_MASTER: StudentMaster[] = [
  // --- Demo Student (Part C & D Specification) ---
  {
    id: 'std-cse-2026-001',
    roll_no: 'HIET-CSE-2026-001',
    name: 'Aditya Nanda',
    father_name: 'Sh. Raman Nanda',
    mother_name: 'Smt. Kavita Nanda',
    dob: '2004-06-12',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 1,
    section: 'A',
    college_email: 'student.cse01@hiet.demo',
    phone: '+91 98160 44001',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    cgpa: 8.24,
    sgpa: 8.18,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z'
  },
  // --- 10 CSE Students (Semester 6) ---
  {
    id: 'std-cse-001',
    roll_no: 'CSE001',
    name: 'Aarav Sharma',
    father_name: 'Sh. Rajesh Sharma',
    mother_name: 'Smt. Sunita Sharma',
    dob: '2003-08-15',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'A',
    college_email: 'aarav.cse001@hiet.ac.in',
    phone: '+91 94180 11001',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-002',
    roll_no: 'CSE002',
    name: 'Aditya Verma',
    father_name: 'Sh. Sunil Verma',
    mother_name: 'Smt. Rekha Verma',
    dob: '2003-09-20',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'A',
    college_email: 'aditya.cse002@hiet.ac.in',
    phone: '+91 94180 11002',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-003',
    roll_no: 'CSE003',
    name: 'Rahul Thakur',
    father_name: 'Sh. Kuldeep Thakur',
    mother_name: 'Smt. Meena Thakur',
    dob: '2003-04-12',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'A',
    college_email: 'rahul.cse003@hiet.ac.in',
    phone: '+91 94180 11003',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-004',
    roll_no: 'CSE004',
    name: 'Arjun Kumar',
    father_name: 'Sh. Vijay Kumar',
    mother_name: 'Smt. Asha Devi',
    dob: '2003-11-05',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'A',
    college_email: 'arjun.cse004@hiet.ac.in',
    phone: '+91 94180 11004',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-005',
    roll_no: 'CSE005',
    name: 'Rohit Sharma',
    father_name: 'Sh. Anil Sharma',
    mother_name: 'Smt. Poonam Sharma',
    dob: '2003-06-18',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'B',
    college_email: 'rohit.cse005@hiet.ac.in',
    phone: '+91 94180 11005',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-006',
    roll_no: 'CSE006',
    name: 'Karan Singh',
    father_name: 'Sh. Daljit Singh',
    mother_name: 'Smt. Gurpreet Kaur',
    dob: '2003-01-25',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'B',
    college_email: 'karan.cse006@hiet.ac.in',
    phone: '+91 94180 11006',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-007',
    roll_no: 'CSE007',
    name: 'Aman Verma',
    father_name: 'Sh. Ramesh Verma',
    mother_name: 'Smt. Saroj Verma',
    dob: '2003-07-30',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'B',
    college_email: 'aman.cse007@hiet.ac.in',
    phone: '+91 94180 11007',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-008',
    roll_no: 'CSE008',
    name: 'Yash Thakur',
    father_name: 'Sh. Jagdish Thakur',
    mother_name: 'Smt. Anita Thakur',
    dob: '2003-12-10',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'B',
    college_email: 'yash.cse008@hiet.ac.in',
    phone: '+91 94180 11008',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-009',
    roll_no: 'CSE009',
    name: 'Shiv Kumar',
    father_name: 'Sh. Prem Chand',
    mother_name: 'Smt. Kamlesh Devi',
    dob: '2003-03-08',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'B',
    college_email: 'shiv.cse009@hiet.ac.in',
    phone: '+91 94180 11009',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },
  {
    id: 'std-cse-010',
    roll_no: 'CSE010',
    name: 'Harshit Sharma',
    father_name: 'Sh. Suresh Sharma',
    mother_name: 'Smt. Neelam Sharma',
    dob: '2003-10-14',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    section: 'B',
    college_email: 'harshit.cse010@hiet.ac.in',
    phone: '+91 94180 11010',
    status: 'active',
    created_at: '2023-08-01T10:00:00Z'
  },

  // --- 10 CSE AI/ML Students (Semester 4) ---
  {
    id: 'std-aiml-001',
    roll_no: 'AIML001',
    name: 'Ansh Gupta',
    father_name: 'Sh. Sanjay Gupta',
    mother_name: 'Smt. Ritu Gupta',
    dob: '2004-02-18',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'A',
    college_email: 'ansh.aiml001@hiet.ac.in',
    phone: '+91 94180 22001',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-002',
    roll_no: 'AIML002',
    name: 'Ayush Sharma',
    father_name: 'Sh. Dev Raj Sharma',
    mother_name: 'Smt. Kanta Sharma',
    dob: '2004-05-22',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'A',
    college_email: 'ayush.aiml002@hiet.ac.in',
    phone: '+91 94180 22002',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-003',
    roll_no: 'AIML003',
    name: 'Harsh Verma',
    father_name: 'Sh. Vinod Verma',
    mother_name: 'Smt. Geeta Verma',
    dob: '2004-08-11',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'A',
    college_email: 'harsh.aiml003@hiet.ac.in',
    phone: '+91 94180 22003',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-004',
    roll_no: 'AIML004',
    name: 'Rohan Singh',
    father_name: 'Sh. Manjit Singh',
    mother_name: 'Smt. Rajinder Kaur',
    dob: '2004-01-19',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'A',
    college_email: 'rohan.aiml004@hiet.ac.in',
    phone: '+91 94180 22004',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-005',
    roll_no: 'AIML005',
    name: 'Mohit Kumar',
    father_name: 'Sh. Rattan Chand',
    mother_name: 'Smt. Urmila Devi',
    dob: '2004-09-03',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'A',
    college_email: 'mohit.aiml005@hiet.ac.in',
    phone: '+91 94180 22005',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-006',
    roll_no: 'AIML006',
    name: 'Abhishek Thakur',
    father_name: 'Sh. Gian Chand Thakur',
    mother_name: 'Smt. Shanti Devi',
    dob: '2004-11-28',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'B',
    college_email: 'abhishek.aiml006@hiet.ac.in',
    phone: '+91 94180 22006',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-007',
    roll_no: 'AIML007',
    name: 'Vivek Sharma',
    father_name: 'Sh. Naresh Sharma',
    mother_name: 'Smt. Seema Sharma',
    dob: '2004-03-15',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'B',
    college_email: 'vivek.aiml007@hiet.ac.in',
    phone: '+91 94180 22007',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-008',
    roll_no: 'AIML008',
    name: 'Dev Kumar',
    father_name: 'Sh. Pawan Kumar',
    mother_name: 'Smt. Reena Kumari',
    dob: '2004-07-09',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'B',
    college_email: 'dev.aiml008@hiet.ac.in',
    phone: '+91 94180 22008',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-009',
    roll_no: 'AIML009',
    name: 'Aryan Verma',
    father_name: 'Sh. Ashok Verma',
    mother_name: 'Smt. Madhu Verma',
    dob: '2004-12-04',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'B',
    college_email: 'aryan.aiml009@hiet.ac.in',
    phone: '+91 94180 22009',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  },
  {
    id: 'std-aiml-010',
    roll_no: 'AIML010',
    name: 'Manish Thakur',
    father_name: 'Sh. Rakesh Thakur',
    mother_name: 'Smt. Pushpa Thakur',
    dob: '2004-04-27',
    course: 'B.Tech',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    section: 'B',
    college_email: 'manish.aiml010@hiet.ac.in',
    phone: '+91 94180 22010',
    status: 'active',
    created_at: '2024-08-01T10:00:00Z'
  }
];

// =============================================================================
// 2. VERIFIED TEACHERS MASTER RECORDS (3 FACULTY AS SPECIFIED)
// FAC001 - Teacher, FAC002 - Teacher, FAC003 - HOD
// =============================================================================
export const INITIAL_TEACHERS_MASTER: TeacherMaster[] = [
  // --- Demo Faculty & HOD (Part C & D Specification) ---
  {
    id: 'tch-fac-cse-001',
    faculty_id: 'HIET-FAC-CSE-001',
    full_name: 'Dr. Anuj Sharma',
    name: 'Dr. Anuj Sharma',
    department: 'CSE',
    designation: 'Associate Professor',
    college_email: 'faculty.cse01@hiet.demo',
    phone: '+91 98160 55001',
    role: 'teacher',
    is_hod: false,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: '2021-01-15T09:00:00Z'
  },
  {
    id: 'tch-hod-cse-001',
    faculty_id: 'HIET-HOD-CSE-001',
    full_name: 'Dr. Anuj Sharma (HOD)',
    name: 'Dr. Anuj Sharma (HOD)',
    department: 'CSE',
    designation: 'Professor & Head',
    college_email: 'hod.cse@hiet.demo',
    phone: '+91 98160 55002',
    role: 'hod',
    is_hod: true,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: '2019-03-10T09:00:00Z'
  },
  {
    id: 'tch-01',
    faculty_id: 'FAC001',
    full_name: 'Dr. Rajesh Kumar',
    name: 'Dr. Rajesh Kumar',
    department: 'CSE',
    designation: 'Professor',
    college_email: 'rajesh.kumar@hiet.ac.in',
    phone: '+91 98160 11001',
    role: 'teacher',
    is_hod: false,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: '2020-01-15T09:00:00Z'
  },
  {
    id: 'tch-02',
    faculty_id: 'FAC002',
    full_name: 'Er. Neha Sharma',
    name: 'Er. Neha Sharma',
    department: 'CSE AI/ML',
    designation: 'Assistant Professor',
    college_email: 'neha.sharma@hiet.ac.in',
    phone: '+91 98160 11002',
    role: 'teacher',
    is_hod: false,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: '2021-07-20T09:00:00Z'
  },
  {
    id: 'tch-03',
    faculty_id: 'FAC003',
    full_name: 'Dr. Amit Thakur',
    name: 'Dr. Amit Thakur',
    department: 'CSE',
    designation: 'HOD',
    college_email: 'amit.thakur@hiet.ac.in',
    phone: '+91 98160 11003',
    role: 'hod',
    is_hod: true,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: '2019-03-10T09:00:00Z'
  },
  {
    id: 'tch-04',
    faculty_id: 'FAC004',
    full_name: 'Dr. Sunita Verma',
    name: 'Dr. Sunita Verma',
    department: 'CSE',
    designation: 'Assistant Professor',
    college_email: 'sunita.verma@hiet.ac.in',
    phone: '+91 98160 11004',
    role: 'teacher',
    is_hod: false,
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'inactive',
    created_at: '2022-04-10T09:00:00Z'
  }
];

// =============================================================================
// 3. SUBJECTS MASTER
// =============================================================================
export const INITIAL_SUBJECTS: Subject[] = [
  // --- Semester 1 Core Subjects (Part D Specification) ---
  {
    id: 'sub-btph101',
    subject_code: 'BTPH101',
    subject_name: 'Applied Physics',
    department: 'CSE',
    branch: 'CSE',
    semester: 1,
    credits: 4,
    subject_type: 'Theory',
    teacher_id: 'tch-fac-cse-001',
    teacher_name: 'Dr. Anuj Sharma'
  },
  {
    id: 'sub-btma102',
    subject_code: 'BTMA102',
    subject_name: 'Engineering Mathematics-I',
    department: 'CSE',
    branch: 'CSE',
    semester: 1,
    credits: 4,
    subject_type: 'Theory',
    teacher_id: 'tch-fac-cse-001',
    teacher_name: 'Dr. Anuj Sharma'
  },
  {
    id: 'sub-btee103',
    subject_code: 'BTEE103',
    subject_name: 'Basic Electrical Engineering',
    department: 'CSE',
    branch: 'CSE',
    semester: 1,
    credits: 4,
    subject_type: 'Theory',
    teacher_id: 'tch-fac-cse-001',
    teacher_name: 'Dr. Anuj Sharma'
  },
  {
    id: 'sub-btcs104',
    subject_code: 'BTCS104',
    subject_name: 'Programming for Problem Solving',
    department: 'CSE',
    branch: 'CSE',
    semester: 1,
    credits: 4,
    subject_type: 'Theory',
    teacher_id: 'tch-fac-cse-001',
    teacher_name: 'Dr. Anuj Sharma'
  },
  {
    id: 'sub-bthm105',
    subject_code: 'BTHM105',
    subject_name: 'Communication Skills',
    department: 'CSE',
    branch: 'CSE',
    semester: 1,
    credits: 3,
    subject_type: 'Theory',
    teacher_id: 'tch-fac-cse-001',
    teacher_name: 'Dr. Anuj Sharma'
  },
  {
    id: 'sub-cs601',
    subject_code: 'CS-601',
    subject_name: 'Mathematics',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    teacher_id: 'tch-01',
    teacher_name: 'Dr. Rajesh Kumar'
  },
  {
    id: 'sub-cs602',
    subject_code: 'CS-602',
    subject_name: 'Physics',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    teacher_id: 'tch-02',
    teacher_name: 'Er. Neha Sharma'
  },
  {
    id: 'sub-cs603',
    subject_code: 'CS-603',
    subject_name: 'BEE',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    teacher_id: 'tch-03',
    teacher_name: 'Dr. Amit Thakur'
  },
  {
    id: 'sub-cs604',
    subject_code: 'CS-604',
    subject_name: 'Communication',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    teacher_id: 'tch-01',
    teacher_name: 'Dr. Rajesh Kumar'
  },
  {
    id: 'sub-cs605',
    subject_code: 'CS-605',
    subject_name: 'EVS',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    teacher_id: 'tch-02',
    teacher_name: 'Er. Neha Sharma'
  },
  // AI/ML Semester 4
  {
    id: 'sub-aiml-401',
    subject_code: 'AI-401',
    subject_name: 'Machine Learning Foundations',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    teacher_id: 'tch-02',
    teacher_name: 'Er. Neha Sharma'
  },
  {
    id: 'sub-aiml-402',
    subject_code: 'AI-402',
    subject_name: 'Data Structures & Algorithms',
    department: 'CSE',
    branch: 'CSE AI & ML',
    semester: 4,
    teacher_id: 'tch-03',
    teacher_name: 'Dr. Amit Thakur'
  }
];

// =============================================================================
// 4. ATTENDANCE (Overall 84% - Mathematics 86%, Physics 78%, BEE 81%, Comm 91%, EVS 88%)
// =============================================================================
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // --- Demo Student: Aditya Nanda (std-cse-2026-001) ---
  // Engineering Mathematics-I (12 of 17 -> 70.59% - Medium Risk, 3 classes needed)
  { id: 'att-demo-m1', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-01', status: 'Present' },
  { id: 'att-demo-m2', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-02', status: 'Present' },
  { id: 'att-demo-m3', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-03', status: 'Present' },
  { id: 'att-demo-m4', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-04', status: 'Absent' },
  { id: 'att-demo-m5', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-07', status: 'Absent' },
  { id: 'att-demo-m6', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-08', status: 'Present' },
  { id: 'att-demo-m7', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-09', status: 'Present' },
  { id: 'att-demo-m8', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-10', status: 'Present' },
  { id: 'att-demo-m9', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-11', status: 'Absent' },
  { id: 'att-demo-m10', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-14', status: 'Present' },
  { id: 'att-demo-m11', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-15', status: 'Present' },
  { id: 'att-demo-m12', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-16', status: 'Present' },
  { id: 'att-demo-m13', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-17', status: 'Absent' },
  { id: 'att-demo-m14', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-18', status: 'Absent' },
  { id: 'att-demo-m15', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-21', status: 'Present' },
  { id: 'att-demo-m16', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-22', status: 'Present' },
  { id: 'att-demo-m17', student_id: 'std-cse-2026-001', subject_id: 'sub-btma102', subject_name: 'Engineering Mathematics-I', subject_code: 'BTMA102', date: '2026-09-23', status: 'Present' },

  // --- Demo Student: Aarav Sharma (std-cse-2026-002) - High Risk Scenario (10 of 16 -> 62.50%) ---
  { id: 'att-demo-s2-1', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-01', status: 'Present' },
  { id: 'att-demo-s2-2', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-02', status: 'Absent' },
  { id: 'att-demo-s2-3', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-03', status: 'Present' },
  { id: 'att-demo-s2-4', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-04', status: 'Absent' },
  { id: 'att-demo-s2-5', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-07', status: 'Present' },
  { id: 'att-demo-s2-6', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-08', status: 'Present' },
  { id: 'att-demo-s2-7', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-09', status: 'Absent' },
  { id: 'att-demo-s2-8', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-10', status: 'Present' },
  { id: 'att-demo-s2-9', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-11', status: 'Absent' },
  { id: 'att-demo-s2-10', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-14', status: 'Present' },
  { id: 'att-demo-s2-11', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-15', status: 'Absent' },
  { id: 'att-demo-s2-12', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-16', status: 'Present' },
  { id: 'att-demo-s2-13', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-17', status: 'Present' },
  { id: 'att-demo-s2-14', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-18', status: 'Absent' },
  { id: 'att-demo-s2-15', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-21', status: 'Present' },
  { id: 'att-demo-s2-16', student_id: 'std-cse-2026-002', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-22', status: 'Present' },

  // --- Demo Student: Priya Verma (std-cse-2026-003) - Low Risk Scenario (18 of 19 -> 94.74%) ---
  { id: 'att-demo-s3-1', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-01', status: 'Present' },
  { id: 'att-demo-s3-2', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-02', status: 'Present' },
  { id: 'att-demo-s3-3', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-03', status: 'Present' },
  { id: 'att-demo-s3-4', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-04', status: 'Present' },
  { id: 'att-demo-s3-5', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-07', status: 'Present' },
  { id: 'att-demo-s3-6', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-08', status: 'Present' },
  { id: 'att-demo-s3-7', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-09', status: 'Present' },
  { id: 'att-demo-s3-8', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-10', status: 'Present' },
  { id: 'att-demo-s3-9', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-11', status: 'Present' },
  { id: 'att-demo-s3-10', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-14', status: 'Absent' },
  { id: 'att-demo-s3-11', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-15', status: 'Present' },
  { id: 'att-demo-s3-12', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-16', status: 'Present' },
  { id: 'att-demo-s3-13', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-17', status: 'Present' },
  { id: 'att-demo-s3-14', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-18', status: 'Present' },
  { id: 'att-demo-s3-15', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-21', status: 'Present' },
  { id: 'att-demo-s3-16', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-22', status: 'Present' },
  { id: 'att-demo-s3-17', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-23', status: 'Present' },
  { id: 'att-demo-s3-18', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-24', status: 'Present' },
  { id: 'att-demo-s3-19', student_id: 'std-cse-2026-003', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-25', status: 'Present' },

  // Applied Physics (8 of 9 -> 88.9%)
  { id: 'att-demo-p1', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-15', status: 'Present' },
  { id: 'att-demo-p2', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-16', status: 'Present' },
  { id: 'att-demo-p3', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-17', status: 'Absent' },
  { id: 'att-demo-p4', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-18', status: 'Present' },
  { id: 'att-demo-p5', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-21', status: 'Present' },
  { id: 'att-demo-p6', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-22', status: 'Present' },
  { id: 'att-demo-p7', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-23', status: 'Present' },
  { id: 'att-demo-p8', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-24', status: 'Present' },
  { id: 'att-demo-p9', student_id: 'std-cse-2026-001', subject_id: 'sub-btph101', subject_name: 'Applied Physics', subject_code: 'BTPH101', date: '2026-09-25', status: 'Present' },

  // Programming for Problem Solving (9 of 10 -> 90%)
  { id: 'att-demo-pr1', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-15', status: 'Present' },
  { id: 'att-demo-pr2', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-16', status: 'Present' },
  { id: 'att-demo-pr3', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-17', status: 'Present' },
  { id: 'att-demo-pr4', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-18', status: 'Present' },
  { id: 'att-demo-pr5', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-21', status: 'Present' },
  { id: 'att-demo-pr6', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-22', status: 'Present' },
  { id: 'att-demo-pr7', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-23', status: 'Present' },
  { id: 'att-demo-pr8', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-24', status: 'Absent' },
  { id: 'att-demo-pr9', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-25', status: 'Present' },
  { id: 'att-demo-pr10', student_id: 'std-cse-2026-001', subject_id: 'sub-btcs104', subject_name: 'Programming for Problem Solving', subject_code: 'BTCS104', date: '2026-09-26', status: 'Present' },

  // Basic Electrical Engineering (8 of 10 -> 80%)
  { id: 'att-demo-b1', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-15', status: 'Present' },
  { id: 'att-demo-b2', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-16', status: 'Absent' },
  { id: 'att-demo-b3', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-17', status: 'Present' },
  { id: 'att-demo-b4', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-18', status: 'Present' },
  { id: 'att-demo-b5', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-21', status: 'Present' },
  { id: 'att-demo-b6', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-22', status: 'Absent' },
  { id: 'att-demo-b7', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-23', status: 'Present' },
  { id: 'att-demo-b8', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-24', status: 'Present' },
  { id: 'att-demo-b9', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-25', status: 'Present' },
  { id: 'att-demo-b10', student_id: 'std-cse-2026-001', subject_id: 'sub-btee103', subject_name: 'Basic Electrical Engineering', subject_code: 'BTEE103', date: '2026-09-26', status: 'Present' },

  // Communication Skills (8 of 10 -> 80%)
  { id: 'att-demo-c1', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-15', status: 'Present' },
  { id: 'att-demo-c2', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-16', status: 'Present' },
  { id: 'att-demo-c3', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-17', status: 'Present' },
  { id: 'att-demo-c4', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-18', status: 'Present' },
  { id: 'att-demo-c5', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-19', status: 'Absent' },
  { id: 'att-demo-c6', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-21', status: 'Present' },
  { id: 'att-demo-c7', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-22', status: 'Present' },
  { id: 'att-demo-c8', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-23', status: 'Present' },
  { id: 'att-demo-c9', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-24', status: 'Present' },
  { id: 'att-demo-c10', student_id: 'std-cse-2026-001', subject_id: 'sub-bthm105', subject_name: 'Communication Skills', subject_code: 'BTHM105', date: '2026-09-25', status: 'Absent' },

  // Mathematics (86% -> 6 of 7 present)
  { id: 'att-01', student_id: 'std-cse-001', subject_id: 'sub-cs601', subject_name: 'Mathematics', subject_code: 'CS-601', date: '2026-09-15', status: 'Present' },
  { id: 'att-02', student_id: 'std-cse-001', subject_id: 'sub-cs601', subject_name: 'Mathematics', subject_code: 'CS-601', date: '2026-09-16', status: 'Present' },
  { id: 'att-03', student_id: 'std-cse-001', subject_id: 'sub-cs601', subject_name: 'Mathematics', subject_code: 'CS-601', date: '2026-09-17', status: 'Present' },
  { id: 'att-04', student_id: 'std-cse-001', subject_id: 'sub-cs601', subject_name: 'Mathematics', subject_code: 'CS-601', date: '2026-09-18', status: 'Absent' },
  { id: 'att-05', student_id: 'std-cse-001', subject_id: 'sub-cs601', subject_name: 'Mathematics', subject_code: 'CS-601', date: '2026-09-21', status: 'Present' },
  { id: 'att-06', student_id: 'std-cse-001', subject_id: 'sub-cs601', subject_name: 'Mathematics', subject_code: 'CS-601', date: '2026-09-22', status: 'Present' },
  { id: 'att-07', student_id: 'std-cse-001', subject_id: 'sub-cs601', subject_name: 'Mathematics', subject_code: 'CS-601', date: '2026-09-23', status: 'Present' },

  // Physics (78% -> 7 of 9 present)
  { id: 'att-08', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-15', status: 'Present' },
  { id: 'att-09', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-16', status: 'Present' },
  { id: 'att-10', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-17', status: 'Absent' },
  { id: 'att-11', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-18', status: 'Present' },
  { id: 'att-12', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-21', status: 'Absent' },
  { id: 'att-13', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-22', status: 'Present' },
  { id: 'att-14', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-23', status: 'Present' },
  { id: 'att-15', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-24', status: 'Present' },
  { id: 'att-16', student_id: 'std-cse-001', subject_id: 'sub-cs602', subject_name: 'Physics', subject_code: 'CS-602', date: '2026-09-25', status: 'Present' },

  // BEE (81% -> 9 of 11 present)
  { id: 'att-17', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-15', status: 'Present' },
  { id: 'att-18', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-16', status: 'Absent' },
  { id: 'att-19', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-17', status: 'Present' },
  { id: 'att-20', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-18', status: 'Present' },
  { id: 'att-21', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-21', status: 'Present' },
  { id: 'att-22', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-22', status: 'Absent' },
  { id: 'att-23', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-23', status: 'Present' },
  { id: 'att-24', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-24', status: 'Present' },
  { id: 'att-25', student_id: 'std-cse-001', subject_id: 'sub-cs603', subject_name: 'BEE', subject_code: 'CS-603', date: '2026-09-25', status: 'Present' },

  // Communication (91% -> 10 of 11 present)
  { id: 'att-26', student_id: 'std-cse-001', subject_id: 'sub-cs604', subject_name: 'Communication', subject_code: 'CS-604', date: '2026-09-15', status: 'Present' },
  { id: 'att-27', student_id: 'std-cse-001', subject_id: 'sub-cs604', subject_name: 'Communication', subject_code: 'CS-604', date: '2026-09-16', status: 'Present' },
  { id: 'att-28', student_id: 'std-cse-001', subject_id: 'sub-cs604', subject_name: 'Communication', subject_code: 'CS-604', date: '2026-09-17', status: 'Present' },
  { id: 'att-29', student_id: 'std-cse-001', subject_id: 'sub-cs604', subject_name: 'Communication', subject_code: 'CS-604', date: '2026-09-18', status: 'Present' },
  { id: 'att-30', student_id: 'std-cse-001', subject_id: 'sub-cs604', subject_name: 'Communication', subject_code: 'CS-604', date: '2026-09-21', status: 'Absent' },
  { id: 'att-31', student_id: 'std-cse-001', subject_id: 'sub-cs604', subject_name: 'Communication', subject_code: 'CS-604', date: '2026-09-22', status: 'Present' },
  { id: 'att-32', student_id: 'std-cse-001', subject_id: 'sub-cs604', subject_name: 'Communication', subject_code: 'CS-604', date: '2026-09-23', status: 'Present' },
  { id: 'att-33', student_id: 'std-cse-001', subject_id: 'sub-cs604', subject_name: 'Communication', subject_code: 'CS-604', date: '2026-09-24', status: 'Present' },

  // EVS (88% -> 7 of 8 present)
  { id: 'att-34', student_id: 'std-cse-001', subject_id: 'sub-cs605', subject_name: 'EVS', subject_code: 'CS-605', date: '2026-09-15', status: 'Present' },
  { id: 'att-35', student_id: 'std-cse-001', subject_id: 'sub-cs605', subject_name: 'EVS', subject_code: 'CS-605', date: '2026-09-16', status: 'Present' },
  { id: 'att-36', student_id: 'std-cse-001', subject_id: 'sub-cs605', subject_name: 'EVS', subject_code: 'CS-605', date: '2026-09-17', status: 'Present' },
  { id: 'att-37', student_id: 'std-cse-001', subject_id: 'sub-cs605', subject_name: 'EVS', subject_code: 'CS-605', date: '2026-09-18', status: 'Absent' },
  { id: 'att-38', student_id: 'std-cse-001', subject_id: 'sub-cs605', subject_name: 'EVS', subject_code: 'CS-605', date: '2026-09-21', status: 'Present' },
  { id: 'att-39', student_id: 'std-cse-001', subject_id: 'sub-cs605', subject_name: 'EVS', subject_code: 'CS-605', date: '2026-09-22', status: 'Present' },
  { id: 'att-40', student_id: 'std-cse-001', subject_id: 'sub-cs605', subject_name: 'EVS', subject_code: 'CS-605', date: '2026-09-23', status: 'Present' }
];

// =============================================================================
// 5. SESSIONAL EXAM RESULTS (Sessional 1 & 2 as specified: Math 18/25, Physics 21/25, BEE 20/25)
// =============================================================================
export const INITIAL_SESSIONAL_RESULTS: SessionalResult[] = [
  // Sessional 1
  {
    id: 'ses-01',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    subject_name: 'Mathematics',
    subject_code: 'CS-601',
    exam_type: 'Sessional 1',
    marks_obtained: 18,
    max_marks: 25,
    percentage: 72,
    semester: 6,
    branch: 'CSE',
    is_published: true,
    remarks: 'Good analytical clarity in differential calculus.'
  },
  {
    id: 'ses-02',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    subject_name: 'Physics',
    subject_code: 'CS-602',
    exam_type: 'Sessional 1',
    marks_obtained: 21,
    max_marks: 25,
    percentage: 84,
    semester: 6,
    branch: 'CSE',
    is_published: true,
    remarks: 'Excellent numerical problem solving.'
  },
  {
    id: 'ses-03',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    subject_name: 'BEE',
    subject_code: 'CS-603',
    exam_type: 'Sessional 1',
    marks_obtained: 20,
    max_marks: 25,
    percentage: 80,
    semester: 6,
    branch: 'CSE',
    is_published: true,
    remarks: 'Clear circuit analysis and theorem derivations.'
  },
  {
    id: 'ses-04',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    subject_name: 'Communication',
    subject_code: 'CS-604',
    exam_type: 'Sessional 1',
    marks_obtained: 23,
    max_marks: 25,
    percentage: 92,
    semester: 6,
    branch: 'CSE',
    is_published: true,
    remarks: 'Superb presentation and professional writing.'
  },
  {
    id: 'ses-05',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    subject_name: 'EVS',
    subject_code: 'CS-605',
    exam_type: 'Sessional 1',
    marks_obtained: 22,
    max_marks: 25,
    percentage: 88,
    semester: 6,
    branch: 'CSE',
    is_published: true,
    remarks: 'In-depth case study on Himalayan biodiversity.'
  },

  // Sessional 2
  {
    id: 'ses-06',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    subject_name: 'Mathematics',
    subject_code: 'CS-601',
    exam_type: 'Sessional 2',
    marks_obtained: 22,
    max_marks: 25,
    percentage: 88,
    semester: 6,
    branch: 'CSE',
    is_published: true,
    remarks: 'Significant improvement in vector algebra.'
  },
  {
    id: 'ses-07',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    subject_name: 'Physics',
    subject_code: 'CS-602',
    exam_type: 'Sessional 2',
    marks_obtained: 23,
    max_marks: 25,
    percentage: 92,
    semester: 6,
    branch: 'CSE',
    is_published: true,
    remarks: 'Outstanding quantum physics derivations.'
  },
  {
    id: 'ses-08',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    subject_name: 'BEE',
    subject_code: 'CS-603',
    exam_type: 'Sessional 2',
    marks_obtained: 21,
    max_marks: 25,
    percentage: 84,
    semester: 6,
    branch: 'CSE',
    is_published: true,
    remarks: 'Strong understanding of AC circuits and transformers.'
  }
];

// =============================================================================
// 6. TIMETABLE SLOTS (With Time Bounds for Auto-Highlighting "Active / NOW" Class)
// =============================================================================
export const INITIAL_TIMETABLE: TimetableSlot[] = [
  {
    id: 'tt-01',
    day: 'Monday',
    start_time: '09:00 AM',
    end_time: '10:00 AM',
    start_hour_24: 9,
    start_minute: 0,
    end_hour_24: 10,
    end_minute: 0,
    subject_name: 'Mathematics',
    subject_code: 'CS-601',
    room_number: 'Room 204',
    teacher_name: 'Dr. Rajesh Kumar',
    branch: 'CSE',
    semester: 6,
    section: 'A'
  },
  {
    id: 'tt-02',
    day: 'Monday',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    start_hour_24: 10,
    start_minute: 0,
    end_hour_24: 11,
    end_minute: 0,
    subject_name: 'Physics',
    subject_code: 'CS-602',
    room_number: 'Lab 1',
    teacher_name: 'Er. Neha Sharma',
    branch: 'CSE',
    semester: 6,
    section: 'A'
  },
  {
    id: 'tt-03',
    day: 'Monday',
    start_time: '11:00 AM',
    end_time: '12:00 PM',
    start_hour_24: 11,
    start_minute: 0,
    end_hour_24: 12,
    end_minute: 0,
    subject_name: 'BEE',
    subject_code: 'CS-603',
    room_number: 'Room 105',
    teacher_name: 'Dr. Amit Thakur',
    branch: 'CSE',
    semester: 6,
    section: 'A'
  },
  {
    id: 'tt-04',
    day: 'Monday',
    start_time: '12:00 PM',
    end_time: '01:00 PM',
    start_hour_24: 12,
    start_minute: 0,
    end_hour_24: 13,
    end_minute: 0,
    subject_name: 'Communication',
    subject_code: 'CS-604',
    room_number: 'Room 201',
    teacher_name: 'Dr. Rajesh Kumar',
    branch: 'CSE',
    semester: 6,
    section: 'A'
  },
  {
    id: 'tt-05',
    day: 'Monday',
    start_time: '02:00 PM',
    end_time: '03:00 PM',
    start_hour_24: 14,
    start_minute: 0,
    end_hour_24: 15,
    end_minute: 0,
    subject_name: 'EVS',
    subject_code: 'CS-605',
    room_number: 'Room 204',
    teacher_name: 'Er. Neha Sharma',
    branch: 'CSE',
    semester: 6,
    section: 'A'
  },
  {
    id: 'tt-06',
    day: 'Monday',
    start_time: '03:00 PM',
    end_time: '04:30 PM',
    start_hour_24: 15,
    start_minute: 0,
    end_hour_24: 16,
    end_minute: 30,
    subject_name: 'Computing Lab Practical',
    subject_code: 'CS-606',
    room_number: 'Aryabhatta Lab',
    teacher_name: 'Dr. Rajesh Kumar',
    branch: 'CSE',
    semester: 6,
    section: 'A'
  }
];

// =============================================================================
// 7. SYLLABUS PROGRESS TRACKER (Unit-wise progress as specified)
// =============================================================================
export const INITIAL_SYLLABUS_PROGRESS: SyllabusProgress[] = [
  // Applied Physics (Unit 1 80%, Unit 2 60%, Unit 3 40%, Unit 4 20%)
  {
    id: 'sp-01',
    subject_name: 'Applied Physics',
    subject_code: 'CS-602',
    branch: 'CSE',
    semester: 6,
    unit_number: 1,
    unit_title: 'Unit 1: Quantum Mechanics & Wave Optics',
    progress_percentage: 80,
    important_topics: ['Schrodinger wave equation', 'Heisenberg uncertainty principle', 'Interference in thin films']
  },
  {
    id: 'sp-02',
    subject_name: 'Applied Physics',
    subject_code: 'CS-602',
    branch: 'CSE',
    semester: 6,
    unit_number: 2,
    unit_title: 'Unit 2: Lasers & Fiber Optics',
    progress_percentage: 60,
    important_topics: ['Einstein coefficients', 'He-Ne laser operation', 'Numerical aperture of optical fiber']
  },
  {
    id: 'sp-03',
    subject_name: 'Applied Physics',
    subject_code: 'CS-602',
    branch: 'CSE',
    semester: 6,
    unit_number: 3,
    unit_title: 'Unit 3: Electromagnetism & Dielectrics',
    progress_percentage: 40,
    important_topics: ['Maxwell equations in differential form', 'Poynting vector', 'Clausius-Mossotti equation']
  },
  {
    id: 'sp-04',
    subject_name: 'Applied Physics',
    subject_code: 'CS-602',
    branch: 'CSE',
    semester: 6,
    unit_number: 4,
    unit_title: 'Unit 4: Superconductivity & Nanomaterials',
    progress_percentage: 20,
    important_topics: ['Meissner effect', 'Type I and Type II superconductors', 'Carbon nanotubes synthesis']
  },

  // Mathematics
  {
    id: 'sp-05',
    subject_name: 'Mathematics',
    subject_code: 'CS-601',
    branch: 'CSE',
    semester: 6,
    unit_number: 1,
    unit_title: 'Unit 1: Differential Equations & Applications',
    progress_percentage: 100,
    important_topics: ['Exact differential equations', 'Cauchy-Euler equations', 'Orthogonal trajectories']
  },
  {
    id: 'sp-06',
    subject_name: 'Mathematics',
    subject_code: 'CS-601',
    branch: 'CSE',
    semester: 6,
    unit_number: 2,
    unit_title: 'Unit 2: Linear Algebra & Matrices',
    progress_percentage: 85,
    important_topics: ['Eigenvalues & Eigenvectors', 'Cayley-Hamilton theorem', 'Diagonalization of matrices']
  },
  {
    id: 'sp-07',
    subject_name: 'Mathematics',
    subject_code: 'CS-601',
    branch: 'CSE',
    semester: 6,
    unit_number: 3,
    unit_title: 'Unit 3: Complex Variables',
    progress_percentage: 50,
    important_topics: ['Cauchy-Riemann equations', 'Residue theorem', 'Conformal mapping']
  },
  {
    id: 'sp-08',
    subject_name: 'Mathematics',
    subject_code: 'CS-601',
    branch: 'CSE',
    semester: 6,
    unit_number: 4,
    unit_title: 'Unit 4: Probability & Statistics',
    progress_percentage: 15,
    important_topics: ['Bayes theorem', 'Normal distribution', 'Hypothesis testing']
  },

  // BEE
  {
    id: 'sp-09',
    subject_name: 'BEE',
    subject_code: 'CS-603',
    branch: 'CSE',
    semester: 6,
    unit_number: 1,
    unit_title: 'Unit 1: DC Circuit Analysis & Theorems',
    progress_percentage: 85,
    important_topics: ['Thevenin theorem', 'Norton theorem', 'Maximum power transfer theorem']
  },
  {
    id: 'sp-10',
    subject_name: 'BEE',
    subject_code: 'CS-603',
    branch: 'CSE',
    semester: 6,
    unit_number: 2,
    unit_title: 'Unit 2: AC Circuits & Resonance',
    progress_percentage: 70,
    important_topics: ['Series RLC resonance', 'Power factor improvement', 'Three-phase star-delta circuits']
  },
  {
    id: 'sp-11',
    subject_name: 'BEE',
    subject_code: 'CS-603',
    branch: 'CSE',
    semester: 6,
    unit_number: 3,
    unit_title: 'Unit 3: Electrical Machines & Transformers',
    progress_percentage: 35,
    important_topics: ['Single phase transformer equivalent circuit', 'DC motor characteristics', 'Induction motors']
  },
  {
    id: 'sp-12',
    subject_name: 'BEE',
    subject_code: 'CS-603',
    branch: 'CSE',
    semester: 6,
    unit_number: 4,
    unit_title: 'Unit 4: Electrical Installations & Safety',
    progress_percentage: 10,
    important_topics: ['Earthing systems', 'MCB and ELCB working', 'Battery types and ratings']
  }
];

// =============================================================================
// 8. ACADEMIC RECORDS (CGPA & Semester-wise SGPA)
// =============================================================================
export const INITIAL_ACADEMIC_RECORDS: AcademicRecord[] = [
  // Semester 1 (SGPA: 8.20)
  { id: 'ac-01', student_id: 'std-cse-001', semester: 1, subject_name: 'Engineering Mathematics I', subject_code: 'MA-101', marks: 84, grade: 'A', grade_point: 8.5, sgpa: 8.20, cgpa: 8.20 },
  { id: 'ac-02', student_id: 'std-cse-001', semester: 1, subject_name: 'Applied Physics I', subject_code: 'PH-101', marks: 79, grade: 'B+', grade_point: 8.0, sgpa: 8.20, cgpa: 8.20 },
  { id: 'ac-03', student_id: 'std-cse-001', semester: 1, subject_name: 'Basic Electrical Engg', subject_code: 'EE-101', marks: 82, grade: 'A', grade_point: 8.5, sgpa: 8.20, cgpa: 8.20 },

  // Semester 2 (SGPA: 8.50)
  { id: 'ac-04', student_id: 'std-cse-001', semester: 2, subject_name: 'Engineering Mathematics II', subject_code: 'MA-201', marks: 88, grade: 'A+', grade_point: 9.0, sgpa: 8.50, cgpa: 8.35 },
  { id: 'ac-05', student_id: 'std-cse-001', semester: 2, subject_name: 'Programming for Problem Solving', subject_code: 'CS-201', marks: 91, grade: 'A+', grade_point: 9.5, sgpa: 8.50, cgpa: 8.35 },

  // Semester 3 (SGPA: 8.40)
  { id: 'ac-06', student_id: 'std-cse-001', semester: 3, subject_name: 'Data Structures & Algorithms', subject_code: 'CS-301', marks: 86, grade: 'A', grade_point: 8.8, sgpa: 8.40, cgpa: 8.37 },
  { id: 'ac-07', student_id: 'std-cse-001', semester: 3, subject_name: 'Digital Electronics', subject_code: 'EC-301', marks: 81, grade: 'A', grade_point: 8.2, sgpa: 8.40, cgpa: 8.37 },

  // Semester 4 (SGPA: 8.60)
  { id: 'ac-08', student_id: 'std-cse-001', semester: 4, subject_name: 'Operating Systems', subject_code: 'CS-401', marks: 87, grade: 'A', grade_point: 8.8, sgpa: 8.60, cgpa: 8.42 },
  { id: 'ac-09', student_id: 'std-cse-001', semester: 4, subject_name: 'Database Management Systems', subject_code: 'CS-402', marks: 89, grade: 'A+', grade_point: 9.0, sgpa: 8.60, cgpa: 8.42 },

  // Semester 5 (SGPA: 8.65)
  { id: 'ac-10', student_id: 'std-cse-001', semester: 5, subject_name: 'Computer Networks', subject_code: 'CS-501', marks: 89, grade: 'A+', grade_point: 9.0, sgpa: 8.65, cgpa: 8.47 },
  { id: 'ac-11', student_id: 'std-cse-001', semester: 5, subject_name: 'Theory of Computation', subject_code: 'CS-502', marks: 84, grade: 'A', grade_point: 8.5, sgpa: 8.65, cgpa: 8.47 }
];

// =============================================================================
// 8b. GRADES MASTER (Phase 8: Weighted Credits & Dynamic CGPA / SGPA Calculation)
// =============================================================================
export const INITIAL_GRADES: Grade[] = [
  // Aarav Sharma (std-cse-001) - Sem 1: Credits 20, SGPA = 8.80
  { id: 'grd-01', student_id: 'std-cse-001', semester: 1, subject_code: 'AS-101', subject_name: 'Engineering Mathematics-I', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 84 },
  { id: 'grd-02', student_id: 'std-cse-001', semester: 1, subject_code: 'AS-102', subject_name: 'Engineering Physics', credits: 4.0, letter_grade: 'A', grade_point: 8.0, marks: 78 },
  { id: 'grd-03', student_id: 'std-cse-001', semester: 1, subject_code: 'CS-101', subject_name: 'Programming in C & Data Structures', credits: 4.0, letter_grade: 'A+', grade_point: 10.0, marks: 92 },
  { id: 'grd-04', student_id: 'std-cse-001', semester: 1, subject_code: 'EE-101', subject_name: 'Basic Electrical & Electronics', credits: 4.0, letter_grade: 'B+', grade_point: 8.0, marks: 76 },
  { id: 'grd-05', student_id: 'std-cse-001', semester: 1, subject_code: 'HU-101', subject_name: 'Professional Communication', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 85 },

  // Aarav Sharma (std-cse-001) - Sem 2: Credits 20, SGPA = 8.80
  { id: 'grd-06', student_id: 'std-cse-001', semester: 2, subject_code: 'AS-201', subject_name: 'Engineering Mathematics-II', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 86 },
  { id: 'grd-07', student_id: 'std-cse-001', semester: 2, subject_code: 'CS-201', subject_name: 'Object Oriented Programming with C++', credits: 4.0, letter_grade: 'A+', grade_point: 10.0, marks: 95 },
  { id: 'grd-08', student_id: 'std-cse-001', semester: 2, subject_code: 'CS-202', subject_name: 'Digital Logic & Design', credits: 4.0, letter_grade: 'A', grade_point: 8.0, marks: 77 },
  { id: 'grd-09', student_id: 'std-cse-001', semester: 2, subject_code: 'AS-202', subject_name: 'Environmental Science', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 82 },
  { id: 'grd-10', student_id: 'std-cse-001', semester: 2, subject_code: 'ME-201', subject_name: 'Engineering Workshop & CAD', credits: 4.0, letter_grade: 'B+', grade_point: 8.0, marks: 75 },

  // Aarav Sharma (std-cse-001) - Sem 3: Credits 20, SGPA = 9.00
  { id: 'grd-11', student_id: 'std-cse-001', semester: 3, subject_code: 'CS-301', subject_name: 'Data Structures & Algorithms', credits: 4.0, letter_grade: 'A+', grade_point: 10.0, marks: 93 },
  { id: 'grd-12', student_id: 'std-cse-001', semester: 3, subject_code: 'CS-302', subject_name: 'Discrete Mathematics', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 85 },
  { id: 'grd-13', student_id: 'std-cse-001', semester: 3, subject_code: 'CS-303', subject_name: 'Computer Architecture & Org.', credits: 4.0, letter_grade: 'A', grade_point: 8.0, marks: 79 },
  { id: 'grd-14', student_id: 'std-cse-001', semester: 3, subject_code: 'CS-304', subject_name: 'Database Management Systems', credits: 4.0, letter_grade: 'A+', grade_point: 10.0, marks: 94 },
  { id: 'grd-15', student_id: 'std-cse-001', semester: 3, subject_code: 'CS-305', subject_name: 'Data Structures Lab', credits: 4.0, letter_grade: 'A', grade_point: 8.0, marks: 80 },

  // Aarav Sharma (std-cse-001) - Sem 4: Credits 20, SGPA = 8.80
  { id: 'grd-16', student_id: 'std-cse-001', semester: 4, subject_code: 'CS-401', subject_name: 'Operating Systems', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 87 },
  { id: 'grd-17', student_id: 'std-cse-001', semester: 4, subject_code: 'CS-402', subject_name: 'Design & Analysis of Algorithms', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 88 },
  { id: 'grd-18', student_id: 'std-cse-001', semester: 4, subject_code: 'CS-403', subject_name: 'Theory of Computation', credits: 4.0, letter_grade: 'B+', grade_point: 8.0, marks: 74 },
  { id: 'grd-19', student_id: 'std-cse-001', semester: 4, subject_code: 'CS-404', subject_name: 'Computer Networks', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 86 },
  { id: 'grd-20', student_id: 'std-cse-001', semester: 4, subject_code: 'CS-405', subject_name: 'OS & Networks Lab', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 85 },

  // Aarav Sharma (std-cse-001) - Sem 5: Credits 20, SGPA = 9.20
  { id: 'grd-21', student_id: 'std-cse-001', semester: 5, subject_code: 'CS-501', subject_name: 'Web Technologies & Frameworks', credits: 4.0, letter_grade: 'A+', grade_point: 10.0, marks: 95 },
  { id: 'grd-22', student_id: 'std-cse-001', semester: 5, subject_code: 'CS-502', subject_name: 'Compiler Design', credits: 4.0, letter_grade: 'A', grade_point: 8.0, marks: 81 },
  { id: 'grd-23', student_id: 'std-cse-001', semester: 5, subject_code: 'CS-503', subject_name: 'Software Engineering & Agile', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 89 },
  { id: 'grd-24', student_id: 'std-cse-001', semester: 5, subject_code: 'CS-504', subject_name: 'Cloud Computing & DevOps', credits: 4.0, letter_grade: 'A+', grade_point: 10.0, marks: 92 },
  { id: 'grd-25', student_id: 'std-cse-001', semester: 5, subject_code: 'CS-505', subject_name: 'Web Technologies Lab', credits: 4.0, letter_grade: 'A', grade_point: 9.0, marks: 88 }
];

// =============================================================================
// 9. SYLLABUS & UNIT-WISE PDF DOCUMENTS
// =============================================================================
export const INITIAL_SYLLABUS: SyllabusItem[] = [
  {
    id: 'syl-01',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    subject_id: 'sub-cs601',
    subject_code: 'CS-601',
    subject_name: 'Mathematics',
    title: 'HPTU B.Tech CSE Semester 6 Mathematics Syllabus',
    credits: 4,
    file_url: 'https://hiet.ac.in/syllabus/CSE-Sem6-Maths.pdf',
    created_at: '2026-01-10T10:00:00Z',
    units: [
      { unitNumber: 1, title: 'Differential Equations', topics: ['Exact ODEs', 'Integrating factors', 'Second order linear equations'], hours: 10 },
      { unitNumber: 2, title: 'Linear Algebra', topics: ['Vector spaces', 'Subspaces', 'Linear transformations', 'Eigenvalues'], hours: 12 },
      { unitNumber: 3, title: 'Complex Analysis', topics: ['Analytic functions', 'Cauchy integral formula', 'Taylor & Laurent series'], hours: 10 },
      { unitNumber: 4, title: 'Probability Theory', topics: ['Random variables', 'Binomial, Poisson, Normal distributions'], hours: 8 }
    ]
  },
  {
    id: 'syl-02',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    subject_id: 'sub-cs602',
    subject_code: 'CS-602',
    subject_name: 'Applied Physics',
    title: 'HPTU B.Tech CSE Semester 6 Applied Physics Syllabus',
    credits: 4,
    file_url: 'https://hiet.ac.in/syllabus/CSE-Sem6-Physics.pdf',
    created_at: '2026-01-10T10:00:00Z',
    units: [
      { unitNumber: 1, title: 'Quantum Mechanics', topics: ['Wave-particle duality', 'De Broglie hypothesis', 'Schrodinger equation'], hours: 10 },
      { unitNumber: 2, title: 'Laser & Fiber Optics', topics: ['Spontaneous & stimulated emission', 'Semiconductor lasers', 'Optical fiber types'], hours: 10 },
      { unitNumber: 3, title: 'Electromagnetics', topics: ['Displacement current', 'Electromagnetic wave propagation in free space'], hours: 10 },
      { unitNumber: 4, title: 'Superconductivity', topics: ['BCS theory basics', 'Josephson junctions', 'High Tc superconductors'], hours: 10 }
    ]
  },
  {
    id: 'syl-03',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    subject_id: 'sub-cs603',
    subject_code: 'CS-603',
    subject_name: 'BEE',
    title: 'Basic Electrical Engineering Comprehensive Syllabus',
    credits: 3,
    file_url: 'https://hiet.ac.in/syllabus/CSE-Sem6-BEE.pdf',
    created_at: '2026-01-10T10:00:00Z',
    units: [
      { unitNumber: 1, title: 'DC Circuits', topics: ['Mesh & Nodal analysis', 'Superposition & Thevenin theorem'], hours: 9 },
      { unitNumber: 2, title: 'AC Fundamentals', topics: ['Sinusoidal steady state analysis', 'Phasor diagrams', 'Power factor'], hours: 9 },
      { unitNumber: 3, title: 'Transformers', topics: ['Core & Copper losses', 'Open circuit & short circuit tests'], hours: 9 },
      { unitNumber: 4, title: 'Electrical Safety', topics: ['Earthing', 'Fuses & circuit breakers', 'Energy conservation'], hours: 7 }
    ]
  }
];

// =============================================================================
// 10. PREVIOUS YEAR QUESTION PAPERS (PYQs) (2026, 2025, 2024, 2023)
// =============================================================================
export const INITIAL_PYQS: PYQItem[] = [
  {
    id: 'pyq-01',
    subject_code: 'CS-601',
    subject_name: 'Mathematics',
    semester: 6,
    branch: 'CSE',
    year: 2026,
    exam_type: 'Mid Semester',
    file_url: 'https://hiet.ac.in/pyq/CS601-Maths-2026-MidSem.pdf',
    created_at: '2026-04-15T10:00:00Z'
  },
  {
    id: 'pyq-02',
    subject_code: 'CS-601',
    subject_name: 'Mathematics',
    semester: 6,
    branch: 'CSE',
    year: 2025,
    exam_type: 'End Semester',
    file_url: 'https://hiet.ac.in/pyq/CS601-Maths-2025-EndSem.pdf',
    created_at: '2025-12-20T10:00:00Z'
  },
  {
    id: 'pyq-03',
    subject_code: 'CS-601',
    subject_name: 'Mathematics',
    semester: 6,
    branch: 'CSE',
    year: 2024,
    exam_type: 'End Semester',
    file_url: 'https://hiet.ac.in/pyq/CS601-Maths-2024-EndSem.pdf',
    created_at: '2024-12-18T10:00:00Z'
  },
  {
    id: 'pyq-04',
    subject_code: 'CS-601',
    subject_name: 'Mathematics',
    semester: 6,
    branch: 'CSE',
    year: 2023,
    exam_type: 'End Semester',
    file_url: 'https://hiet.ac.in/pyq/CS601-Maths-2023-EndSem.pdf',
    created_at: '2023-12-19T10:00:00Z'
  },
  {
    id: 'pyq-05',
    subject_code: 'CS-602',
    subject_name: 'Physics',
    semester: 6,
    branch: 'CSE',
    year: 2025,
    exam_type: 'End Semester',
    file_url: 'https://hiet.ac.in/pyq/CS602-Physics-2025-EndSem.pdf',
    created_at: '2025-12-20T10:00:00Z'
  },
  {
    id: 'pyq-06',
    subject_code: 'CS-602',
    subject_name: 'Physics',
    semester: 6,
    branch: 'CSE',
    year: 2024,
    exam_type: 'End Semester',
    file_url: 'https://hiet.ac.in/pyq/CS602-Physics-2024-EndSem.pdf',
    created_at: '2024-12-18T10:00:00Z'
  },
  {
    id: 'pyq-07',
    subject_code: 'CS-603',
    subject_name: 'BEE',
    semester: 6,
    branch: 'CSE',
    year: 2025,
    exam_type: 'End Semester',
    file_url: 'https://hiet.ac.in/pyq/CS603-BEE-2025-EndSem.pdf',
    created_at: '2025-12-20T10:00:00Z'
  },
  {
    id: 'pyq-08',
    subject_code: 'CS-603',
    subject_name: 'BEE',
    semester: 6,
    branch: 'CSE',
    year: 2024,
    exam_type: 'End Semester',
    file_url: 'https://hiet.ac.in/pyq/CS603-BEE-2024-EndSem.pdf',
    created_at: '2024-12-18T10:00:00Z'
  }
];

// =============================================================================
// 11. ONLINE LEAVE REQUESTS (Multi-Stage Workflow: Faculty -> HOD -> Principal)
// =============================================================================

export const DEFAULT_LEAVE_CONFIG: LeaveWorkflowConfig = {
  config_id: 'cfg-default-01',
  short_leave_max_days: 2,
  hod_required_after_days: 3,
  principal_required_after_days: 7,
  first_approver_role_key: 'class_incharge',
  is_active: true
};

export const INITIAL_LEAVES: LeaveRequest[] = [
  // Test 1 — Short Leave (1-2 days): Student Aditya Nanda -> Class In-Charge Mr. Rohit Mehta
  {
    id: 'lv-test-01',
    leave_id: 'lv-test-01',
    student_id: 'std-cse-2026-001',
    student_name: 'Aditya Nanda',
    student_roll: 'HIET-CSE-2026-001',
    student_branch: 'CSE',
    student_semester: 1,
    student_section: 'A',
    start_date: '2026-10-12',
    end_date: '2026-10-13',
    from_date: '2026-10-12',
    to_date: '2026-10-13',
    total_days: 2,
    reason: 'Severe dental toothache and scheduled clinic root canal procedure.',
    document_url: 'https://hiet.ac.in/documents/medical_dental_slip.pdf',
    document_path: 'leaves/medical_dental_slip.pdf',
    status: 'pending_faculty',
    current_stage: 'faculty',
    current_assignee_user_id: 'prof-tch-fac-cse-003',
    current_assignee_role_key: 'class_incharge',
    current_assignee_name: 'Mr. Rohit Mehta (Class In-Charge)',
    submitted_by_user_id: 'prof-std-cse-2026-001',
    submitted_at: '2026-10-07T09:30:00Z',
    created_at: '2026-10-07T09:30:00Z',
    updated_at: '2026-10-07T09:30:00Z'
  },
  // Test 2 — HOD Leave (3-6 days): Student Aarav Sharma -> Class In-Charge approved -> Pending with Dr. Anuj Sharma (HOD CSE)
  {
    id: 'lv-test-02',
    leave_id: 'lv-test-02',
    student_id: 'std-cse-2026-002',
    student_name: 'Aarav Sharma',
    student_roll: 'HIET-CSE-2026-002',
    student_branch: 'CSE',
    student_semester: 1,
    student_section: 'A',
    start_date: '2026-10-14',
    end_date: '2026-10-17',
    from_date: '2026-10-14',
    to_date: '2026-10-17',
    total_days: 4,
    reason: 'Attending Smart India Hackathon Grand Finale representing HIET Shahpur team.',
    document_url: 'https://hiet.ac.in/documents/sih_invitation_letter.pdf',
    document_path: 'leaves/sih_invitation_letter.pdf',
    status: 'pending_hod',
    current_stage: 'hod',
    current_assignee_user_id: 'prof-tch-fac-cse-001',
    current_assignee_role_key: 'hod',
    current_assignee_name: 'Dr. Anuj Sharma (HOD CSE)',
    submitted_by_user_id: 'prof-std-cse-2026-002',
    submitted_at: '2026-10-06T11:00:00Z',
    reviewed_by: 'prof-tch-fac-cse-003',
    reviewed_by_name: 'Mr. Rohit Mehta',
    approval_remarks: 'Recommended by Class In-Charge. Forwarded to HOD for department clearance.',
    remarks: 'Recommended by Class In-Charge. Forwarded to HOD for department clearance.',
    created_at: '2026-10-06T11:00:00Z',
    updated_at: '2026-10-06T14:20:00Z'
  },
  // Test 3 — Principal Leave (7+ days): Student Priya Verma -> Faculty + HOD approved -> Pending with Dr. Rajesh Kumar (Principal)
  {
    id: 'lv-test-03',
    leave_id: 'lv-test-03',
    student_id: 'std-cse-2026-003',
    student_name: 'Priya Verma',
    student_roll: 'HIET-CSE-2026-003',
    student_branch: 'CSE',
    student_semester: 1,
    student_section: 'A',
    start_date: '2026-10-15',
    end_date: '2026-10-22',
    from_date: '2026-10-15',
    to_date: '2026-10-22',
    total_days: 8,
    reason: 'Hospitalization and post-operative surgical recovery period at Zonal Hospital.',
    document_url: 'https://hiet.ac.in/documents/hospital_discharge_summary.pdf',
    document_path: 'leaves/hospital_discharge_summary.pdf',
    status: 'pending_principal',
    current_stage: 'principal',
    current_assignee_user_id: 'prof-principal-01',
    current_assignee_role_key: 'principal',
    current_assignee_name: 'Dr. Rajesh Kumar (Principal)',
    submitted_by_user_id: 'prof-std-cse-2026-003',
    submitted_at: '2026-10-05T08:15:00Z',
    reviewed_by: 'prof-tch-fac-cse-001',
    reviewed_by_name: 'Dr. Anuj Sharma (HOD)',
    approval_remarks: 'Recommended by Faculty & HOD CSE. Requires Principal sanction for > 7 days.',
    remarks: 'Recommended by Faculty & HOD CSE. Requires Principal sanction for > 7 days.',
    created_at: '2026-10-05T08:15:00Z',
    updated_at: '2026-10-05T12:00:00Z'
  },
  // Historical Completed Leaves
  {
    id: 'lv-01',
    leave_id: 'lv-01',
    student_id: 'std-cse-2026-002',
    student_name: 'Aarav Sharma',
    student_roll: 'HIET-CSE-2026-002',
    student_branch: 'CSE',
    student_semester: 1,
    student_section: 'A',
    start_date: '2026-09-15',
    end_date: '2026-09-16',
    from_date: '2026-09-15',
    to_date: '2026-09-16',
    total_days: 2,
    reason: 'Medical Leave - Severe viral fever diagnosed at Civil Hospital Shahpur.',
    document_url: 'https://hiet.ac.in/documents/medical_cert_aarav.pdf',
    document_path: 'leaves/medical_cert_aarav.pdf',
    status: 'approved',
    current_stage: 'completed',
    current_assignee_user_id: null,
    current_assignee_role_key: null,
    submitted_by_user_id: 'prof-std-cse-2026-002',
    submitted_at: '2026-09-14T09:00:00Z',
    final_decision_by_user_id: 'prof-tch-fac-cse-003',
    final_decision_at: '2026-09-14T11:00:00Z',
    approved_at: '2026-09-14T11:00:00Z',
    reviewed_by: 'prof-tch-fac-cse-003',
    reviewed_by_name: 'Mr. Rohit Mehta',
    approval_remarks: 'Medical certificate verified. 2 days excused attendance granted.',
    remarks: 'Medical certificate verified. 2 days excused attendance granted.',
    created_at: '2026-09-14T09:00:00Z',
    updated_at: '2026-09-14T11:00:00Z'
  }
];

export const INITIAL_LEAVE_HISTORY: LeaveRequestHistory[] = [
  // History for lv-test-01 (Aditya Nanda, pending_faculty)
  {
    history_id: 'lvh-01-1',
    leave_id: 'lv-test-01',
    action_key: 'created',
    from_status: 'draft',
    to_status: 'pending_faculty',
    stage_role_key: 'student',
    performed_by_user_id: 'prof-std-cse-2026-001',
    performed_by_name: 'Aditya Nanda',
    remarks: 'Leave request created by student.',
    created_at: '2026-10-07T09:30:00Z'
  },
  {
    history_id: 'lvh-01-2',
    leave_id: 'lv-test-01',
    action_key: 'submitted',
    from_status: 'draft',
    to_status: 'pending_faculty',
    stage_role_key: 'student',
    performed_by_user_id: 'prof-std-cse-2026-001',
    performed_by_name: 'Aditya Nanda',
    remarks: 'Leave application submitted for Class In-Charge review.',
    created_at: '2026-10-07T09:30:01Z'
  },
  {
    history_id: 'lvh-01-3',
    leave_id: 'lv-test-01',
    action_key: 'forwarded_to_faculty',
    from_status: 'draft',
    to_status: 'pending_faculty',
    stage_role_key: 'class_incharge',
    performed_by_user_id: 'prof-tch-fac-cse-003',
    performed_by_name: 'Mr. Rohit Mehta',
    remarks: 'Routed to Mr. Rohit Mehta (Class In-Charge, CSE Sem 1 Sec A).',
    created_at: '2026-10-07T09:30:02Z'
  },

  // History for lv-test-02 (Aarav Sharma, pending_hod)
  {
    history_id: 'lvh-02-1',
    leave_id: 'lv-test-02',
    action_key: 'created',
    from_status: 'draft',
    to_status: 'pending_faculty',
    stage_role_key: 'student',
    performed_by_user_id: 'prof-std-cse-2026-002',
    performed_by_name: 'Aarav Sharma',
    remarks: 'Leave request created by student.',
    created_at: '2026-10-06T11:00:00Z'
  },
  {
    history_id: 'lvh-02-2',
    leave_id: 'lv-test-02',
    action_key: 'submitted',
    from_status: 'draft',
    to_status: 'pending_faculty',
    stage_role_key: 'student',
    performed_by_user_id: 'prof-std-cse-2026-002',
    performed_by_name: 'Aarav Sharma',
    remarks: 'Leave application submitted.',
    created_at: '2026-10-06T11:00:01Z'
  },
  {
    history_id: 'lvh-02-3',
    leave_id: 'lv-test-02',
    action_key: 'forwarded_to_faculty',
    from_status: 'draft',
    to_status: 'pending_faculty',
    stage_role_key: 'class_incharge',
    performed_by_user_id: 'prof-tch-fac-cse-003',
    performed_by_name: 'Mr. Rohit Mehta',
    remarks: 'Routed to Class In-Charge.',
    created_at: '2026-10-06T11:00:02Z'
  },
  {
    history_id: 'lvh-02-4',
    leave_id: 'lv-test-02',
    action_key: 'approved',
    from_status: 'pending_faculty',
    to_status: 'pending_hod',
    stage_role_key: 'faculty',
    performed_by_user_id: 'prof-tch-fac-cse-003',
    performed_by_name: 'Mr. Rohit Mehta',
    remarks: 'Recommended by Class In-Charge. Duration > 2 days requires HOD review.',
    created_at: '2026-10-06T14:20:00Z'
  },
  {
    history_id: 'lvh-02-5',
    leave_id: 'lv-test-02',
    action_key: 'forwarded_to_hod',
    from_status: 'pending_faculty',
    to_status: 'pending_hod',
    stage_role_key: 'hod',
    performed_by_user_id: 'prof-tch-fac-cse-001',
    performed_by_name: 'Dr. Anuj Sharma',
    remarks: 'Forwarded to Dr. Anuj Sharma (HOD CSE) for department approval.',
    created_at: '2026-10-06T14:20:01Z'
  },

  // History for lv-test-03 (Priya Verma, pending_principal)
  {
    history_id: 'lvh-03-1',
    leave_id: 'lv-test-03',
    action_key: 'created',
    from_status: 'draft',
    to_status: 'pending_faculty',
    stage_role_key: 'student',
    performed_by_user_id: 'prof-std-cse-2026-003',
    performed_by_name: 'Priya Verma',
    remarks: 'Leave request created by student.',
    created_at: '2026-10-05T08:15:00Z'
  },
  {
    history_id: 'lvh-03-2',
    leave_id: 'lv-test-03',
    action_key: 'forwarded_to_faculty',
    from_status: 'draft',
    to_status: 'pending_faculty',
    stage_role_key: 'class_incharge',
    performed_by_user_id: 'prof-tch-fac-cse-003',
    performed_by_name: 'Mr. Rohit Mehta',
    remarks: 'Routed to Class In-Charge.',
    created_at: '2026-10-05T08:15:02Z'
  },
  {
    history_id: 'lvh-03-3',
    leave_id: 'lv-test-03',
    action_key: 'approved',
    from_status: 'pending_faculty',
    to_status: 'pending_hod',
    stage_role_key: 'faculty',
    performed_by_user_id: 'prof-tch-fac-cse-003',
    performed_by_name: 'Mr. Rohit Mehta',
    remarks: 'Faculty recommended.',
    created_at: '2026-10-05T10:00:00Z'
  },
  {
    history_id: 'lvh-03-4',
    leave_id: 'lv-test-03',
    action_key: 'approved',
    from_status: 'pending_hod',
    to_status: 'pending_principal',
    stage_role_key: 'hod',
    performed_by_user_id: 'prof-tch-fac-cse-001',
    performed_by_name: 'Dr. Anuj Sharma',
    remarks: 'HOD CSE approved. Duration (8 days) exceeds 7 days threshold; forwarded to Principal.',
    created_at: '2026-10-05T12:00:00Z'
  },
  {
    history_id: 'lvh-03-5',
    leave_id: 'lv-test-03',
    action_key: 'forwarded_to_principal',
    from_status: 'pending_hod',
    to_status: 'pending_principal',
    stage_role_key: 'principal',
    performed_by_user_id: 'prof-principal-01',
    performed_by_name: 'Dr. Rajesh Kumar',
    remarks: 'Forwarded to Principal for final institutional decision.',
    created_at: '2026-10-05T12:00:01Z'
  }
];

// =============================================================================
// 12. COMPLAINT BOX (With CONFIDENTIAL vs ANONYMOUS toggle as specified)
// Categories: Academic, Hostel, Infrastructure, Faculty, Transport, Other
// =============================================================================
export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp-ai-demo-01',
    student_id: 'std-cse-2026-001',
    student_name: 'Aditya Nanda',
    student_roll: 'HIET-CSE-2026-001',
    student_branch: 'CSE',
    student_semester: 1,
    student_section: 'A',
    is_anonymous: false,
    category: 'Infrastructure',
    title: 'Defective ceiling fan in classroom C-101',
    description: 'The fan in C-101 is not working and the classroom becomes too hot.',
    priority: 'Medium',
    status: 'Submitted',
    ai_suggested_category: 'infrastructure',
    ai_suggested_assignee_role: 'maintenance_staff',
    ai_suggested_priority: 'normal',
    ai_confidence: 91,
    ai_routing_reason: 'The description refers to a classroom equipment/facility issue.',
    ai_suggestion_confirmed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cmp-ai-demo-02',
    student_id: 'std-cse-2026-002',
    student_name: 'Aarav Sharma',
    student_roll: 'HIET-CSE-2026-002',
    student_branch: 'CSE',
    student_semester: 1,
    student_section: 'A',
    is_anonymous: true,
    category: 'Other',
    title: 'Workstation #12 power failure in programming lab',
    description: 'Computer number 12 in the programming lab does not start.',
    priority: 'Medium',
    status: 'Submitted',
    ai_suggested_category: 'lab',
    ai_suggested_assignee_role: 'lab_staff',
    ai_suggested_priority: 'normal',
    ai_confidence: 89,
    ai_routing_reason: 'The issue concerns computer equipment inside the programming laboratory.',
    ai_suggestion_confirmed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cmp-ai-demo-03',
    student_id: 'std-cse-2026-003',
    student_name: 'Priya Verma',
    student_roll: 'HIET-CSE-2026-003',
    student_branch: 'CSE',
    student_semester: 1,
    student_section: 'A',
    is_anonymous: false,
    category: 'Academic',
    title: 'Missing internal assessment marks for Mathematics',
    description: 'My internal marks have not been updated for Engineering Mathematics-I.',
    priority: 'Medium',
    status: 'Under Review',
    ai_suggested_category: 'academic',
    ai_suggested_assignee_role: 'faculty',
    ai_suggested_priority: 'normal',
    ai_confidence: 94,
    ai_routing_reason: 'The complaint relates to academic marks update and course evaluation.',
    ai_suggestion_confirmed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cmp-01',
    student_id: 'std-cse-001',
    student_name: 'Aarav Sharma',
    student_roll: 'CSE001',
    student_branch: 'CSE',
    student_semester: 6,
    student_section: 'A',
    is_anonymous: false, // CONFIDENTIAL COMPLAINT (HOD/Admin can see identity)
    category: 'Academic',
    title: 'Reference textbook shortage in Central Library for Compiler Design',
    description: 'The Ullman & Aho "Dragon Book" is only available in 2 copies in the reference section. For a batch of 60 students, we need at least 8 more copies.',
    priority: 'Medium',
    status: 'Under Review',
    assigned_to: 'tch-03',
    assigned_to_name: 'Dr. Amit Thakur (HOD CSE)',
    admin_response: 'HOD Office: Library requisition form approved for procurement of 10 new copies.',
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-22T14:30:00Z'
  },
  {
    id: 'cmp-02',
    student_id: 'std-cse-002',
    student_name: 'Anonymous Student',
    student_roll: 'PROTECTED',
    student_branch: 'CSE',
    student_semester: 6,
    student_section: 'A',
    is_anonymous: true, // ANONYMOUS COMPLAINT (Student identity shielded from reviewers)
    category: 'Hostel',
    title: 'Hot water geyser breakdown in Dhauladhar Boys Hostel 2nd Floor',
    description: 'Due to temperature drops in Shahpur mornings, the heating coil has fused. Please replace the heating element before winters set in.',
    priority: 'High',
    status: 'Resolved',
    admin_response: 'Maintenance team replaced the 25L geyser unit on 23rd September. Checked and verified functional.',
    created_at: '2026-09-21T08:00:00Z',
    updated_at: '2026-09-23T16:00:00Z'
  },
  {
    id: 'cmp-03',
    student_id: 'std-cse-004',
    student_name: 'Arjun Kumar',
    student_roll: 'CSE004',
    student_branch: 'CSE',
    student_semester: 6,
    is_anonymous: false,
    category: 'Transport',
    title: 'Dharamshala to Shahpur College Bus Route 4 delayed by 25 mins daily',
    description: 'Due to road construction near Gaggal, Bus 4 departs late resulting in students missing the 9:00 AM Mathematics lecture.',
    priority: 'Urgent',
    status: 'Submitted',
    created_at: '2026-09-25T07:45:00Z',
    updated_at: '2026-09-25T07:45:00Z'
  }
];

// =============================================================================
// 13. ACHIEVEMENTS (Hackathons, Sports, Competitions, Certificates, Internships)
// =============================================================================
export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-01',
    student_id: 'std-cse-001',
    student_name: 'Aarav Sharma',
    student_roll: 'CSE001',
    student_branch: 'CSE',
    title: 'First Prize Winner: Himachal State Level Hackathon 2026',
    event_name: 'Himachal State Level Hackathon 2026',
    achievement_type: 'Technical Hackathon',
    position: '1st Place (Winner)',
    description: 'Built an AI-driven landslide detection and early alert system using IoT sensors and edge computing for hilly terrains.',
    achievement_date: '2026-09-08',
    category: 'Hackathons',
    certificate_url: 'https://hiet.ac.in/certificates/hackathon_first_prize.pdf',
    verification_status: 'Verified',
    verified_by: 'Dr. Amit Thakur (HOD CSE)',
    added_by: 'tch-03',
    added_by_name: 'Dr. Amit Thakur (HOD CSE)',
    remarks: 'Outstanding technical innovation representing HIET Shahpur. Awarded Rs. 50,000 cash prize.',
    created_at: '2026-09-10T14:00:00Z',
    updated_at: '2026-09-10T14:00:00Z'
  },
  {
    id: 'ach-02',
    student_id: 'std-cse-001',
    student_name: 'Aarav Sharma',
    student_roll: 'CSE001',
    student_branch: 'CSE',
    title: 'AWS Certified Solutions Architect - Associate',
    event_name: 'Amazon Web Services Global Certification',
    achievement_type: 'Industry Certification',
    position: 'Certified (Score: 890/1000)',
    description: 'Successfully passed the official AWS SAA-C03 global certification with 890/1000 score.',
    achievement_date: '2026-08-20',
    category: 'Certificates',
    certificate_url: 'https://hiet.ac.in/certificates/aws_certified_architect.pdf',
    verification_status: 'Verified',
    verified_by: 'Er. Neha Sharma',
    added_by: 'tch-02',
    added_by_name: 'Er. Neha Sharma',
    remarks: 'Verified via AWS Credly digital badge verification portal.',
    created_at: '2026-08-25T11:00:00Z',
    updated_at: '2026-08-25T11:00:00Z'
  },
  {
    id: 'ach-03',
    student_id: 'std-cse-001',
    student_name: 'Aarav Sharma',
    student_roll: 'CSE001',
    student_branch: 'CSE',
    title: 'Captain: HIET Inter-College Badminton Championship Team',
    event_name: 'HPTU Annual Sports Meet Hamirpur',
    achievement_type: 'Sports Tournament',
    position: 'Gold Medalist (Men Doubles)',
    description: 'Led the men doubles team to gold medal victory at HPTU Sports Meet Hamirpur.',
    achievement_date: '2026-09-20',
    category: 'Sports',
    verification_status: 'Verified',
    verified_by: 'Dr. Amit Thakur (HOD CSE)',
    added_by: 'tch-03',
    added_by_name: 'Dr. Amit Thakur (HOD CSE)',
    remarks: 'College sports colors awarded.',
    created_at: '2026-09-22T16:00:00Z',
    updated_at: '2026-09-22T16:00:00Z'
  },
  {
    id: 'ach-04',
    student_id: 'std-aiml-001',
    student_name: 'Ansh Gupta',
    student_roll: 'AIML001',
    student_branch: 'CSE AI & ML',
    title: 'Runner-Up: National AI Robotics Challenge',
    event_name: 'Techfest IIT Bombay 2026',
    achievement_type: 'Technical Competition',
    position: '2nd Place',
    description: 'Designed autonomous drone flight controller using reinforcement learning in ROS Gazebo simulation.',
    achievement_date: '2026-08-15',
    category: 'Competitions',
    certificate_url: 'https://hiet.ac.in/certificates/ai_robotics_runnerup.pdf',
    verification_status: 'Verified',
    verified_by: 'Dr. Amit Thakur (HOD CSE)',
    added_by: 'tch-03',
    added_by_name: 'Dr. Amit Thakur (HOD CSE)',
    created_at: '2026-08-18T10:00:00Z',
    updated_at: '2026-08-18T10:00:00Z'
  }
];

// =============================================================================
// 14. DOUBTS & DIRECT FACULTY CHAT
// =============================================================================
export const INITIAL_DOUBTS: Doubt[] = [
  {
    id: 'dbt-01',
    student_id: 'std-cse-001',
    student_name: 'Aarav Sharma',
    student_roll: 'CSE001',
    student_branch: 'CSE',
    student_semester: 6,
    student_section: 'A',
    teacher_id: 'tch-01',
    teacher_name: 'Dr. Rajesh Kumar',
    subject_id: 'sub-cs601',
    subject_name: 'Mathematics',
    question: 'Sir, how do we resolve the boundary condition when finding orthogonal trajectories for r^n = a^n cos(n theta)?',
    status: 'Answered',
    created_at: '2026-09-20T16:00:00Z',
    messages: [
      {
        id: 'msg-01',
        doubt_id: 'dbt-01',
        sender_id: 'std-cse-001',
        sender_name: 'Aarav Sharma',
        sender_role: 'student',
        message: 'Sir, how do we resolve the boundary condition when finding orthogonal trajectories for r^n = a^n cos(n theta)?',
        created_at: '2026-09-20T16:00:00Z'
      },
      {
        id: 'msg-02',
        doubt_id: 'dbt-01',
        sender_id: 'tch-01',
        sender_name: 'Dr. Rajesh Kumar',
        sender_role: 'teacher',
        message: 'Take logarithm on both sides first: n ln(r) = n ln(a) + ln(cos(n theta)). Differentiate with respect to theta and replace dr/dtheta with -r^2 (dtheta/dr). You will obtain r^n = c^n sin(n theta). See lecture note 4.2.',
        created_at: '2026-09-20T18:30:00Z'
      },
      {
        id: 'msg-03',
        doubt_id: 'dbt-01',
        sender_id: 'std-cse-001',
        sender_name: 'Aarav Sharma',
        sender_role: 'student',
        message: 'Understood sir, the logarithm substitution simplifies the product rule. Thank you so much!',
        created_at: '2026-09-21T08:15:00Z'
      }
    ]
  },
  {
    id: 'dbt-02',
    student_id: 'std-cse-001',
    student_name: 'Aarav Sharma',
    student_roll: 'CSE001',
    student_branch: 'CSE',
    student_semester: 6,
    student_section: 'A',
    teacher_id: 'tch-02',
    teacher_name: 'Er. Neha Sharma',
    subject_id: 'sub-cs602',
    subject_name: 'Physics',
    question: 'Ma’am, will numerical questions from Einstein coefficients be included in Sessional 2?',
    status: 'Open',
    created_at: '2026-09-24T10:00:00Z',
    messages: [
      {
        id: 'msg-04',
        doubt_id: 'dbt-02',
        sender_id: 'std-cse-001',
        sender_name: 'Aarav Sharma',
        sender_role: 'student',
        message: 'Ma’am, will numerical questions from Einstein coefficients be included in Sessional 2?',
        created_at: '2026-09-24T10:00:00Z'
      }
    ]
  }
];

// =============================================================================
// 15. COLLEGE CALENDAR EVENTS
// Exams, Holidays, Seminars, Workshops, Hackathons, College Events, Important Dates
// =============================================================================
export const INITIAL_CALENDAR: CalendarEvent[] = [
  {
    id: 'cal-01',
    title: 'Sessional 1 Examinations (B.Tech)',
    description: 'Mandatory written midterm exam across all branches.',
    event_type: 'Exams',
    start_datetime: '2026-10-05T09:30:00Z',
    end_datetime: '2026-10-10T17:00:00Z',
    department: 'ALL',
    location: 'Academic Block A Exam Halls'
  },
  {
    id: 'cal-02',
    title: 'Mahatma Gandhi Jayanti (Holiday)',
    description: 'National Gazetted Holiday. Campus academic offices closed.',
    event_type: 'Holidays',
    start_datetime: '2026-10-02T00:00:00Z',
    end_datetime: '2026-10-02T23:59:59Z',
    department: 'ALL'
  },
  {
    id: 'cal-03',
    title: 'Workshop: Generative AI & LLM Systems',
    description: 'Hands-on training session organized by CSE AI/ML Department in Aryabhatta Computing Lab.',
    event_type: 'Seminars',
    start_datetime: '2026-09-28T10:00:00Z',
    end_datetime: '2026-09-29T16:00:00Z',
    department: 'CSE',
    location: 'Aryabhatta AI Lab, Block A'
  },
  {
    id: 'cal-04',
    title: 'HIET Inter-College Hackathon "Dhauladhar CodeFest 2026"',
    description: '36-hour non-stop hackathon with themes in HealthTech, AgriTech & Sustainable Energy.',
    event_type: 'Hackathons',
    start_datetime: '2026-10-16T09:00:00Z',
    end_datetime: '2026-10-17T21:00:00Z',
    department: 'CSE',
    location: 'Central Auditorium'
  },
  {
    id: 'cal-05',
    title: 'HPTU End-Semester Examination Form Submission Deadline',
    description: 'Last date to submit examination forms with zero late fee.',
    event_type: 'Important Dates',
    start_datetime: '2026-10-30T17:00:00Z',
    end_datetime: '2026-10-30T17:00:00Z',
    department: 'ALL',
    location: 'Student Section / Digital Portal'
  }
];

// =============================================================================
// 16. COLLEGE NOTICES
// =============================================================================
export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'not-01',
    title: 'Mandatory Submission of Examination Forms for Nov/Dec 2026 End-Sem',
    content: 'All B.Tech students (2nd, 4th, 6th & 8th Semesters) are hereby informed to verify their subject credits and clear any pending tuition/hostel dues by 30th September 2026. Hall tickets will only be released for students with >= 75% attendance in each registered subject.',
    audience: 'Students',
    priority: 'Urgent',
    created_by_name: 'Controller of Examinations, HIET Shahpur',
    created_at: '2026-09-24T10:00:00Z'
  },
  {
    id: 'not-02',
    title: 'CSE Department: Minor Project Mid-Term Progress Review',
    content: 'The review panel committee will evaluate B.Tech CSE 6th Semester minor projects in Room 208 on Monday, 28th September 2026 starting at 10:00 AM. Bring your architecture diagram and working prototype.',
    audience: 'CSE',
    priority: 'Important',
    created_by_name: 'Dr. Amit Thakur (HOD CSE)',
    created_at: '2026-09-25T14:30:00Z'
  },
  {
    id: 'not-03',
    title: 'Hostel Night Curfew & Biometric Check-in Timing Guidelines',
    content: 'Residents of Dhauladhar Boys Hostel and Kangra Valley Girls Hostel are reminded that biometric check-in closes at 8:30 PM sharp. Any night leave requires prior digital approval through this portal.',
    audience: 'Students',
    priority: 'Normal',
    created_by_name: 'Chief Warden Office, HIET',
    created_at: '2026-09-20T16:00:00Z'
  },
  {
    id: 'not-04',
    title: 'Faculty NAAC Criteria 2 & 3 Compliance Meeting',
    content: 'All faculty members are requested to assemble in the Conference Hall on Friday at 3:30 PM with updated course files and lab continuous evaluation records.',
    audience: 'Teachers',
    priority: 'Important',
    created_by_name: 'Director HIET Shahpur',
    created_at: '2026-09-23T11:00:00Z'
  }
];

// =============================================================================
// 17. CAMPUS LOCATIONS (Interactive Campus Map)
// Main Gate, Academic Block, CSE Dept, AI/ML Dept, Library, Labs, Hostel, Canteen, Admin Office
// =============================================================================
export const INITIAL_CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'loc-01',
    name: 'Main Campus Entrance Gate & Security Checkpost',
    category: 'Gate',
    description: 'Main highway entry gate with digital QR scanner pass, security booth, visitor vehicle checkpoint.',
    building_code: 'GATE-01',
    floor_info: 'Ground Level Entry',
    latitude: 32.2260,
    longitude: 76.3230,
    icon: 'ShieldCheck',
    contact_ext: '100'
  },
  {
    id: 'loc-02',
    name: 'Main Academic Block (Ramanujan Hall)',
    category: 'Academic Block',
    description: 'Primary academic hub with multimedia smart classrooms, seminar halls, and Dean Office.',
    building_code: 'BLOCK-A',
    floor_info: 'Ground, 1st, 2nd, 3rd Floors',
    latitude: 32.2274,
    longitude: 76.3242,
    icon: 'Building2',
    contact_ext: '101'
  },
  {
    id: 'loc-03',
    name: 'Department of Computer Science & Engineering (CSE)',
    category: 'Department',
    description: 'Chamber of HOD Dr. Amit Thakur, faculty research rooms, software engineering and algorithm design labs.',
    building_code: 'CSE-DEPT',
    floor_info: '1st Floor, Ramanujan Block A',
    latitude: 32.2276,
    longitude: 76.3244,
    icon: 'Code2',
    contact_ext: '110'
  },
  {
    id: 'loc-04',
    name: 'Department of CSE Artificial Intelligence & Machine Learning',
    category: 'Department',
    description: 'Specialized department wing dedicated to deep learning research, data science projects, and neural computing.',
    building_code: 'AIML-DEPT',
    floor_info: '2nd Floor, Ramanujan Block A',
    latitude: 32.2277,
    longitude: 76.3246,
    icon: 'Bot',
    contact_ext: '115'
  },
  {
    id: 'loc-05',
    name: 'Aryabhatta Advanced Computing Lab & Labs Complex',
    category: 'Laboratory',
    description: '180 high-performance workstations with NVIDIA GPU clusters, Cisco network racks, and IoT development kits.',
    building_code: 'LAB-01',
    floor_info: '2nd Floor, Room 201-205, Block A',
    latitude: 32.2275,
    longitude: 76.3245,
    icon: 'Cpu',
    contact_ext: '112'
  },
  {
    id: 'loc-06',
    name: 'Central Library & Digital Resource Center',
    category: 'Library',
    description: 'Over 32,000 reference volumes, IEEE Xplore digital library access, and 200-seat air-conditioned reading halls.',
    building_code: 'LIB-01',
    floor_info: 'Dedicated Two-Storey Complex',
    latitude: 32.2270,
    longitude: 76.3248,
    icon: 'BookOpen',
    contact_ext: '301'
  },
  {
    id: 'loc-07',
    name: 'Dhauladhar Boys & Kangra Valley Girls Hostels',
    category: 'Hostel',
    description: 'Secure student residences equipped with high-speed Wi-Fi, indoor games room, gym, and 24x7 biometric security.',
    building_code: 'HOSTEL-01',
    floor_info: 'Hostel Enclave (East Campus)',
    latitude: 32.2290,
    longitude: 76.3260,
    icon: 'Home',
    contact_ext: '401'
  },
  {
    id: 'loc-08',
    name: 'Pine Grove Student Cafeteria & Food Court',
    category: 'Canteen',
    description: 'Hygienic multi-cuisine cafe serving fresh wholesome meals, tea/coffee counters, and open mountain-view terrace.',
    building_code: 'CAN-01',
    floor_info: 'Ground Floor Plaza',
    latitude: 32.2278,
    longitude: 76.3250,
    icon: 'Coffee',
    contact_ext: '501'
  },
  {
    id: 'loc-09',
    name: 'Central Administrative Directorate & Help Desk',
    category: 'Administration',
    description: 'Director Office, Registrar Office, Accounts & Fee Section, Admissions Cell and Student Help Desk.',
    building_code: 'ADMIN-01',
    floor_info: 'Ground & 1st Floor Admin Building',
    latitude: 32.2268,
    longitude: 76.3238,
    icon: 'ShieldCheck',
    contact_ext: '001'
  }
];

// =============================================================================
// 18. COLLEGE SOCIAL LINKS (Official College Platforms)
// =============================================================================
export const INITIAL_SOCIAL_LINKS: CollegeSocialLink[] = [
  {
    id: 'soc-01',
    platform: 'Official Website',
    title: 'HIET Official Portal',
    url: 'https://hiet.ac.in',
    handle: 'www.hiet.ac.in',
    icon: 'Globe',
    color: 'bg-blue-500'
  },
  {
    id: 'soc-02',
    platform: 'Instagram',
    title: 'HIET Shahpur Campus Life',
    url: 'https://instagram.com/hiet_shahpur_official',
    handle: '@hiet_shahpur_official',
    icon: 'Instagram',
    color: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
  },
  {
    id: 'soc-03',
    platform: 'Facebook',
    title: 'HIET Official Facebook Page',
    url: 'https://facebook.com/hietshahpur',
    handle: '/hietshahpur',
    icon: 'Facebook',
    color: 'bg-blue-600'
  },
  {
    id: 'soc-04',
    platform: 'YouTube',
    title: 'HIET Shahpur Media Channel',
    url: 'https://youtube.com/@hietshahpur',
    handle: '@hietshahpur',
    icon: 'Youtube',
    color: 'bg-red-600'
  }
];

// =============================================================================
// 19. DIGITAL GATE PASS (Future Architecture Demo)
// =============================================================================
export const INITIAL_GATE_PASSES: GatePass[] = [
  {
    id: 'gp-01',
    student_id: 'std-cse-001',
    student_name: 'Aarav Sharma',
    student_roll: 'CSE001',
    student_branch: 'CSE',
    pass_code: 'HIET-PASS-90821',
    qr_data: 'HIET:GATEPASS:CSE001:2026-09-27:VALID',
    reason: 'Authorized Industrial Visit to STPI Kangra',
    valid_date: '2026-09-27',
    status: 'Active',
    created_at: '2026-09-27T08:00:00Z'
  }
];

export const INITIAL_GATE_ENTRIES: GateEntry[] = [
  {
    id: 'ge-01',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    student_branch: 'CSE',
    entry_time: '2026-09-27 08:35 AM',
    gate_location: 'Main Highway Gate 1',
    security_officer: 'Hav. R. S. Katoch',
    status: 'Inside Campus'
  }
];

// =============================================================================
// 21. PROFILES MASTER (Links Supabase auth.users to College Records)
// =============================================================================
export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'prof-std-cse-001',
    auth_user_id: 'auth-std-cse-001',
    role: 'student',
    student_id: 'std-cse-001',
    name: 'Aarav Sharma',
    email: 'aarav.cse001@hiet.ac.in',
    must_change_password: false,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'prof-std-aiml-001',
    auth_user_id: 'auth-std-aiml-001',
    role: 'student',
    student_id: 'std-aiml-001',
    name: 'Ansh Gupta',
    email: 'ansh.aiml001@hiet.ac.in',
    must_change_password: false,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'prof-tch-01',
    auth_user_id: 'auth-tch-01',
    role: 'teacher',
    teacher_id: 'tch-01',
    faculty_id: 'tch-01',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@hiet.ac.in',
    must_change_password: false,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'prof-tch-02',
    auth_user_id: 'auth-tch-02',
    role: 'teacher',
    teacher_id: 'tch-02',
    faculty_id: 'tch-02',
    name: 'Er. Neha Sharma',
    email: 'neha.sharma@hiet.ac.in',
    must_change_password: false,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'prof-tch-03',
    auth_user_id: 'auth-tch-03',
    role: 'hod',
    teacher_id: 'tch-03',
    faculty_id: 'tch-03',
    name: 'Dr. Amit Thakur',
    email: 'amit.thakur@hiet.ac.in',
    must_change_password: false,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'prof-admin-01',
    auth_user_id: 'auth-admin-01',
    role: 'admin',
    name: 'HIET Central Administration',
    email: 'admin@hiet.ac.in',
    must_change_password: false,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'prof-principal-01',
    auth_user_id: 'auth-principal-01',
    role: 'principal',
    name: 'Dr. Vinod Kumar (Principal / Director)',
    email: 'principal@hiet.ac.in',
    must_change_password: false,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'prof-security-01',
    auth_user_id: 'auth-security-01',
    role: 'security_guard',
    name: 'Hav. R. S. Katoch (Campus Security)',
    email: 'security@hiet.ac.in',
    must_change_password: false,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  }
];

// =============================================================================
// 22. NOTIFICATIONS & CAMPUS ALERTS
// =============================================================================
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  // For HOD (Dr. Amit Thakur - prof-tch-03)
  {
    id: 'notif-hod-01',
    recipient_user_id: 'prof-tch-03',
    user_id: 'prof-tch-03',
    title: 'New Student Leave Request',
    message: 'Aarav Sharma (CSE001) applied for 2 days leave (2026-09-28 to 2026-09-29) - Medical Checkup.',
    type: 'leave',
    related_record_id: 'leave-01',
    is_read: false,
    read: false,
    created_at: '2026-09-27T08:30:00Z'
  },
  {
    id: 'notif-hod-02',
    recipient_user_id: 'prof-tch-03',
    user_id: 'prof-tch-03',
    title: 'Low Attendance Alert (<75%)',
    message: 'Statutory Warning: Student Yash Thakur (CSE008) attendance has fallen to 68% in Semester 6.',
    type: 'attendance',
    related_record_id: 'std-cse-008',
    is_read: false,
    read: false,
    created_at: '2026-09-26T14:15:00Z'
  },
  {
    id: 'notif-hod-03',
    recipient_user_id: 'prof-tch-03',
    user_id: 'prof-tch-03',
    title: 'New Confidential Complaint',
    message: 'Confidential grievance submitted under Academic category: Lab equipment availability.',
    type: 'complaint',
    related_record_id: 'comp-01',
    is_read: true,
    read: true,
    created_at: '2026-09-25T11:20:00Z'
  },

  // For Teacher (Dr. Rajesh Kumar - prof-tch-01)
  {
    id: 'notif-tch-01',
    recipient_user_id: 'prof-tch-01',
    user_id: 'prof-tch-01',
    title: 'New Academic Doubt',
    message: 'Student (CSE • Sem 6 • Sec A) asked a doubt in Applied Physics on Maxwell Equations.',
    type: 'doubt',
    related_record_id: 'dbt-01',
    is_read: false,
    read: false,
    created_at: '2026-09-27T09:10:00Z'
  },
  {
    id: 'notif-tch-02',
    recipient_user_id: 'prof-tch-01',
    user_id: 'prof-tch-01',
    title: 'Attendance Reminder',
    message: 'Please verify and finalize today\'s attendance for Lecture 3 (CS-602).',
    type: 'attendance',
    related_record_id: 'sub-cs602',
    is_read: false,
    read: false,
    created_at: '2026-09-27T07:45:00Z'
  },

  // For Student (Aarav Sharma - prof-std-cse-001)
  {
    id: 'notif-std-01',
    recipient_user_id: 'prof-std-cse-001',
    user_id: 'prof-std-cse-001',
    title: 'New Achievement Added by HOD',
    message: 'Congratulations! HOD added verified achievement: "First Prize Winner: Himachal State Level Hackathon 2026".',
    type: 'achievement',
    related_record_id: 'ach-01',
    is_read: false,
    read: false,
    created_at: '2026-09-27T09:00:00Z'
  },
  {
    id: 'notif-std-02',
    recipient_user_id: 'prof-std-cse-001',
    user_id: 'prof-std-cse-001',
    title: 'Leave Application Status Update',
    message: 'Your leave application for 2026-09-25 has been Approved by Er. Neha Sharma.',
    type: 'leave',
    related_record_id: 'leave-02',
    is_read: false,
    read: false,
    created_at: '2026-09-26T16:30:00Z'
  },
  {
    id: 'notif-std-03',
    recipient_user_id: 'prof-std-cse-001',
    user_id: 'prof-std-cse-001',
    title: 'College Notice Published',
    message: 'Technical Symposium InnoTech 2026 registrations are now open for B.Tech students.',
    type: 'notice',
    related_record_id: 'not-01',
    is_read: true,
    read: true,
    created_at: '2026-09-25T10:00:00Z'
  },
  {
    id: 'notif-std-04',
    recipient_user_id: 'prof-std-cse-001',
    user_id: 'prof-std-cse-001',
    title: 'Sessional 1 Results Published',
    message: 'Sessional 1 scores for Mathematics, Physics, and BEE are now available in your academics portal.',
    type: 'academic',
    related_record_id: 'ses-01',
    is_read: true,
    read: true,
    created_at: '2026-09-24T12:00:00Z'
  }
];

// =============================================================================
// 23. ENTERPRISE SEED DATA (Features 1 - 10)
// =============================================================================

export const INITIAL_DEVICE_TOKENS: DeviceToken[] = [
  {
    id: 'tok-01',
    user_id: 'prof-std-cse-001',
    token: 'web-push-fcm-token-aarav-sharma-hiet-001',
    platform: 'web',
    device_info: { browser: 'Chrome 128', os: 'Android 14', screen: '390x844' },
    is_active: true,
    created_at: '2026-09-20T08:00:00Z',
    updated_at: '2026-09-27T08:00:00Z'
  }
];

export const INITIAL_NOTIFICATION_PREFERENCES: NotificationPreferences[] = [
  {
    user_id: 'prof-std-cse-001',
    class_reminders: true,
    attendance_warnings: true,
    leave_updates: true,
    achievement_alerts: true,
    notice_alerts: true,
    gate_pass_updates: true,
    fine_alerts: true,
    exam_announcements: true
  }
];

export const INITIAL_PUSH_DELIVERY_LOGS: PushDeliveryLog[] = [
  {
    id: 'log-p-01',
    user_id: 'prof-std-cse-001',
    notification_type: 'gate_pass',
    title: 'Gate Pass Approved',
    preview_message: 'Your gate pass HIET-PASS-78421 has been approved by HOD.',
    deep_link: 'gate_pass',
    platform: 'web',
    status: 'delivered',
    delivered_at: '2026-09-27T08:15:00Z'
  },
  {
    id: 'log-p-02',
    user_id: 'prof-std-cse-001',
    notification_type: 'fine',
    title: 'Fine Status Updated',
    preview_message: 'Library fine dispute under review by central library administration.',
    deep_link: 'fines',
    platform: 'web',
    status: 'delivered',
    delivered_at: '2026-09-26T14:00:00Z'
  }
];

export const INITIAL_GATE_PASS_REQUESTS: GatePassRequest[] = [
  {
    id: 'gpr-01',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    branch: 'CSE',
    semester: 6,
    pass_type: 'Day Pass',
    valid_date: '2026-09-27',
    departure_time: '12:30 PM',
    expected_return_time: '04:00 PM',
    reason: 'Authorized Academic & Tech Project Submission visit to Regional IT Center Kangra',
    emergency_contact: '+91 94180 11001',
    status: 'Approved',
    approver_id: 'tch-03',
    approver_name: 'Dr. Amit Thakur (HOD CSE)',
    approver_comments: 'Approved for official project work. Ensure return before 4:00 PM.',
    approved_at: '2026-09-27T08:15:00Z',
    created_at: '2026-09-27T08:00:00Z'
  },
  {
    id: 'gpr-02',
    student_id: 'std-cse-002',
    student_roll: 'CSE002',
    student_name: 'Aditya Verma',
    branch: 'CSE',
    semester: 6,
    pass_type: 'Hostel Leave',
    valid_date: '2026-09-28',
    departure_time: '02:00 PM',
    expected_return_time: '07:30 PM',
    reason: 'Family emergency / Doctor appointment at Kangra Civil Hospital',
    emergency_contact: '+91 94180 11002',
    status: 'Pending',
    created_at: '2026-09-27T10:00:00Z'
  },
  {
    id: 'gpr-03',
    student_id: 'std-aiml-001',
    student_roll: 'AIML001',
    student_name: 'Ansh Gupta',
    branch: 'CSE AI & ML',
    semester: 4,
    pass_type: 'Event / Industrial Visit',
    valid_date: '2026-09-27',
    departure_time: '11:00 AM',
    expected_return_time: '05:00 PM',
    reason: 'Hackathon team representation at NIT Hamirpur outreach',
    emergency_contact: '+91 94180 22001',
    status: 'Approved',
    approver_id: 'tch-03',
    approver_name: 'Dr. Amit Thakur (HOD CSE)',
    approver_comments: 'Best of luck to the team.',
    approved_at: '2026-09-27T07:30:00Z',
    created_at: '2026-09-26T18:00:00Z'
  }
];

export const INITIAL_GATE_SCAN_LOGS: GateScanLog[] = [
  {
    id: 'gsl-01',
    pass_id: 'gp-01',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    branch: 'CSE',
    scan_direction: 'Exit',
    gate_location: 'Main Highway Gate 1',
    verified_by_guard_id: 'prof-security-01',
    guard_name: 'Hav. R. S. Katoch',
    verification_status: 'Valid',
    is_manual_override: false,
    scanned_at: '2026-09-27T12:35:00Z'
  },
  {
    id: 'gsl-02',
    pass_id: 'gp-01',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    branch: 'CSE',
    scan_direction: 'Entry',
    gate_location: 'Main Highway Gate 1',
    verified_by_guard_id: 'prof-security-01',
    guard_name: 'Hav. R. S. Katoch',
    verification_status: 'Valid',
    is_manual_override: false,
    scanned_at: '2026-09-27T15:45:00Z'
  }
];

export const INITIAL_FINE_RULES: FineRule[] = [
  {
    id: 'frule-01',
    code: 'LIB_OVERDUE',
    category: 'Library Overdue',
    title: 'Central Library Book Overdue',
    default_amount: 10,
    description: 'Rs. 10 per day after standard 14 days borrowing period.',
    is_active: true
  },
  {
    id: 'frule-02',
    code: 'ID_CARD_LOSS',
    category: 'ID Card Loss',
    title: 'Replacement of Lost Student RFID Identity Card',
    default_amount: 150,
    description: 'Administrative reissuing fee for duplicate RFID smart college ID card.',
    is_active: true
  },
  {
    id: 'frule-03',
    code: 'LAB_BREAKAGE',
    category: 'Laboratory Breakage',
    title: 'Laboratory Apparatus or Hardware Damage',
    default_amount: 350,
    description: 'Replacement cost for damaged oscilloscopes, sensors, or glassware under faculty report.',
    is_active: true
  },
  {
    id: 'frule-04',
    code: 'CAMPUS_DISCIPLINE',
    category: 'Campus Discipline',
    title: 'Unauthorized Parking / Helmet Violation / Noise Disruption',
    default_amount: 250,
    description: 'Statutory disciplinary penalty enforced by Campus Proctorial Board.',
    is_active: true
  },
  {
    id: 'frule-05',
    code: 'HOSTEL_RULE',
    category: 'Hostel Rule Violation',
    title: 'Hostel Late In-Time / Unauthorized Electrical Appliance',
    default_amount: 500,
    description: 'Hostel warden disciplinary assessment under HIET residence policy.',
    is_active: true
  }
];

export const INITIAL_STUDENT_FINES: StudentFine[] = [
  {
    id: 'fine-01',
    student_id: 'std-cse-001',
    student_roll: 'CSE001',
    student_name: 'Aarav Sharma',
    branch: 'CSE',
    semester: 6,
    rule_id: 'frule-02',
    category: 'ID Card Loss',
    title: 'Replacement Smart ID Card Fee',
    reason: 'Application for duplicate student ID card with RFID tag.',
    amount: 150,
    status: 'Paid',
    issued_by: 'prof-admin-01',
    issued_by_name: 'Registrar Office',
    due_date: '2026-09-20',
    paid_at: '2026-09-18T11:00:00Z',
    payment_ref: 'HIET-CHALLAN-2026-8812',
    created_at: '2026-09-15T09:00:00Z',
    updated_at: '2026-09-18T11:00:00Z'
  },
  {
    id: 'fine-02',
    student_id: 'std-cse-003',
    student_roll: 'CSE003',
    student_name: 'Rahul Thakur',
    branch: 'CSE',
    semester: 6,
    rule_id: 'frule-01',
    category: 'Library Overdue',
    title: '14 Days Overdue: "Operating System Concepts"',
    reason: 'Book overdue since 2026-09-10. Standard late fee applied.',
    amount: 140,
    status: 'Under_Dispute',
    issued_by: 'prof-admin-01',
    issued_by_name: 'Central Library Desk',
    due_date: '2026-09-30',
    created_at: '2026-09-24T10:00:00Z',
    updated_at: '2026-09-25T14:30:00Z'
  },
  {
    id: 'fine-03',
    student_id: 'std-cse-004',
    student_roll: 'CSE004',
    student_name: 'Arjun Kumar',
    branch: 'CSE',
    semester: 6,
    rule_id: 'frule-03',
    category: 'Laboratory Breakage',
    title: 'IoT Sensor Kit Damaged in Lab 3',
    reason: 'Reported by Lab Assistant during Embedded Systems practical.',
    amount: 350,
    status: 'Issued',
    issued_by: 'prof-tch-01',
    issued_by_name: 'Dr. Rajesh Kumar (Faculty CSE)',
    due_date: '2026-10-05',
    created_at: '2026-09-26T15:00:00Z',
    updated_at: '2026-09-26T15:00:00Z'
  }
];

export const INITIAL_FINE_APPEALS: FineAppeal[] = [
  {
    id: 'appeal-01',
    fine_id: 'fine-02',
    student_id: 'std-cse-003',
    student_roll: 'CSE003',
    student_name: 'Rahul Thakur',
    appeal_reason: 'I visited the campus library on Friday but the book returns counter was closed early due to the NAAC preparation meeting. I returned it on Monday morning immediately.',
    document_url: '',
    status: 'Pending',
    created_at: '2026-09-25T14:30:00Z'
  }
];

export const INITIAL_IMPORT_JOBS: ImportJob[] = [
  {
    id: 'job-01',
    file_name: 'HIET_CSE_Sem6_Master_Batch2023.csv',
    target_entity: 'students',
    import_mode: 'update_existing',
    total_rows: 20,
    successful_rows: 20,
    failed_rows: 0,
    imported_by: 'prof-admin-01',
    imported_by_name: 'Admin Directorate',
    status: 'Completed',
    created_at: '2026-09-20T10:30:00Z'
  }
];

export const INITIAL_AI_KNOWLEDGE_DOCUMENTS: AiKnowledgeDocument[] = [
  {
    id: 'aidoc-01',
    title: 'HIET Statutory Attendance Policy (75% Rule)',
    category: 'Academic Policy',
    content: 'In accordance with HPU/HPTU guidelines and HIET Academic Senate regulations, every student must maintain a minimum of 75% aggregate attendance in each registered subject to be eligible for Sessional and End-Semester University examinations. Medical condonation up to 10% is permissible upon submitting a valid Medical Certificate within 3 days of resuming classes, subject to HOD and Principal recommendation.',
    document_version: '2026.1',
    source_reference: 'HIET Academic Handbook 2025-26, Section 4.2',
    is_active: true
  },
  {
    id: 'aidoc-02',
    title: 'Campus Timings and Digital Gate Pass Protocol',
    category: 'Campus Security',
    content: 'The HIET Shahpur campus opens at 8:30 AM. Classes run from 9:00 AM to 4:30 PM. Day scholar students wishing to leave campus during college hours must submit a Digital Gate Pass request via the portal and obtain approval from their Department HOD or designated Proctor. Security guards verify the time-limited QR code at Main Gate 1. Hostel in-time is strictly 8:00 PM for all resident scholars.',
    document_version: '2026.1',
    source_reference: 'HIET Campus Security Manual 2026, Section 7',
    is_active: true
  },
  {
    id: 'aidoc-03',
    title: 'Anti-Ragging and Zero-Tolerance Discipline Policy',
    category: 'Anti-Ragging',
    content: 'HIET maintains a zero-tolerance policy towards ragging in campus, hostels, canteen, and college transport. Ragging in any form is a cognizable criminal offence under UGC and State Regulations. Immediate assistance: Anti-Ragging Helpline 1800-180-5522, Campus Proctor Mobile +91 98160 33003, or report confidentially through the Complaint Box in this portal.',
    document_version: '2026.1',
    source_reference: 'HIET Anti-Ragging Mandate 2026',
    is_active: true
  },
  {
    id: 'aidoc-04',
    title: 'Internal Assessment & Sessional Examination Framework',
    category: 'Examination Rules',
    content: 'Each semester includes two compulsory Sessional Examinations (Sessional 1 and Sessional 2) of 25 maximum marks each, covering Unit 1-2 and Unit 3-4 respectively. Internal assessment is computed using best marks, attendance weightage, and tutorial assignments.',
    document_version: '2026.1',
    source_reference: 'HIET Examination Senate Regulation 2026',
    is_active: true
  },
  {
    id: 'aidoc-05',
    title: 'Campus Block & Laboratory Navigation Directory',
    category: 'Campus Navigation',
    content: 'HIET Shahpur Campus Layout: Block A (Ground: Central Library, 1st: Director & Registrar Offices, 2nd: Conference Hall). Block B (Ground: Mechanical & Civil Labs, 1st: ECE Labs & Seminar Hall, 2nd: CSE Department & HOD Office, 3rd: AI/ML Specialized Lab Room 304). Cafeteria & Canteen are located behind Block B next to the Sports Ground.',
    document_version: '2026.1',
    source_reference: 'HIET Campus Directory 2026',
    is_active: true
  }
];

// =============================================================================
// CAMPUS ZONES & PRESENCE SEED (Sections 48-51)
// =============================================================================
export const INITIAL_CAMPUS_ZONES: CampusZone[] = [
  { id: 'zone-01', code: 'main_gate', name: 'Main Gate Checkpoint', description: 'Primary security checkpoint and vehicular/pedestrian transit gate', detection_method: 'Gate Checkpoint', active_students_count: 3 },
  { id: 'zone-02', code: 'academic_block', name: 'Academic Block A', description: 'Central lecture halls, smart classrooms, and faculty offices', detection_method: 'Wi-Fi AP Zone', active_students_count: 14 },
  { id: 'zone-03', code: 'cse_dept', name: 'CSE Department Wing', description: 'Computer Science Department laboratories and seminar hall', detection_method: 'Wi-Fi AP Zone', active_students_count: 8 },
  { id: 'zone-04', code: 'aiml_lab', name: 'AI/ML Specialized Lab', description: 'NVIDIA GPU workstation lab and robotics development bay', detection_method: 'RFID/NFC Scanner', active_students_count: 4 },
  { id: 'zone-05', code: 'library', name: 'Central Library', description: 'Digital reference center, reading halls, and journal section', detection_method: 'RFID/NFC Scanner', active_students_count: 5 },
  { id: 'zone-06', code: 'workshop', name: 'Engineering Workshops', description: 'Mechanical, carpentry, and electrical fabrication facilities', detection_method: 'Wi-Fi AP Zone', active_students_count: 2 },
  { id: 'zone-07', code: 'canteen', name: 'Campus Cafeteria', description: 'Student recreation dining hall and cafeteria area', detection_method: 'Wi-Fi AP Zone', active_students_count: 6 },
  { id: 'zone-08', code: 'ground', name: 'Sports Complex / Ground', description: 'Outdoor athletics tracks, basketball court, and open lawns', detection_method: 'Gate Checkpoint', active_students_count: 2 },
  { id: 'zone-09', code: 'hostel', name: 'Student Residences / Hostel', description: 'Boys and Girls residential blocks with access-controlled gates', detection_method: 'Gate Checkpoint', active_students_count: 7 },
  { id: 'zone-10', code: 'parking', name: 'Campus Parking Lot', description: 'Student & faculty two-wheeler and four-wheeler parking bay', detection_method: 'Gate Checkpoint', active_students_count: 1 }
];

export const INITIAL_CAMPUS_PRESENCE: CampusPresenceRecord[] = [
  {
    id: 'pres-01',
    student_id: 'std-cse-001',
    student_roll: '210106',
    student_name: 'Aarav Sharma',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    status: 'Present',
    current_zone: 'Academic Block A',
    last_detected: '10:42 AM',
    confidence: 'High confidence',
    detection_source: 'Academic Block Wi-Fi AP-04',
    updated_at: '2026-03-01 10:42:00'
  },
  {
    id: 'pres-02',
    student_id: 'std-cse-002',
    student_roll: '210107',
    student_name: 'Aditya Verma',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    status: 'Present',
    current_zone: 'AI/ML Specialized Lab',
    last_detected: '10:35 AM',
    confidence: 'High confidence',
    detection_source: 'Lab RFID Badge Terminal 1',
    updated_at: '2026-03-01 10:35:00'
  },
  {
    id: 'pres-03',
    student_id: 'std-cse-003',
    student_roll: '210108',
    student_name: 'Ananya Patel',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    status: 'Present',
    current_zone: 'Central Library',
    last_detected: '10:15 AM',
    confidence: 'High confidence',
    detection_source: 'Library Turnstile RFID In',
    updated_at: '2026-03-01 10:15:00'
  },
  {
    id: 'pres-04',
    student_id: 'std-cse-004',
    student_roll: '210109',
    student_name: 'Devansh Gupta',
    department: 'CSE',
    branch: 'CSE',
    semester: 6,
    status: 'Exited',
    current_zone: 'Main Gate Checkpoint',
    last_detected: '09:50 AM',
    confidence: 'High confidence',
    detection_source: 'Main Gate QR Exit Scanner',
    updated_at: '2026-03-01 09:50:00'
  }
];

// =============================================================================
// SMART BOARD LESSONS SEED (Sections 39-47)
// =============================================================================
export const INITIAL_SMARTBOARD_LESSONS: SmartBoardLesson[] = [
  {
    id: 'sb-demo-anuj-01',
    teacher_id: 'HIET-FAC-CSE-001',
    teacher_name: 'Dr. Anuj Sharma',
    subject_id: 'sub-btph-101',
    subject_name: 'Applied Physics',
    subject_code: 'BTPH101',
    department: 'CSE',
    semester: 1,
    section: 'A',
    room_number: 'C-101',
    class_date: new Date().toISOString().slice(0, 10),
    start_time: '10:00',
    end_time: '10:50',
    duration_minutes: 50,
    unit: 'Unit 1: Laser',
    topic: 'He-Ne Laser',
    syllabus_topic_id: 'topic-laser-01',
    lesson_file_url: '/lessons/he_ne_laser_notes.pdf',
    file_name: 'He_Ne_Laser_SmartBoard_Export.pdf',
    file_type: 'pdf',
    notes_summary: 'He-Ne Laser four-level pumping scheme, population inversion, resonant cavity modes, and 632.8 nm transition derivation.',
    ai_summary: 'Detailed explanation of He-Ne laser construction, helium-neon gas mixture ratio, four-level pumping system, population inversion, resonant cavity optical feedback, 632.8 nm emission wavelength, and practical engineering applications.',
    ai_learning_objectives: [
      'Explain construction and gas mixture ratio of Helium-Neon laser system',
      'Describe excitation of Helium and resonant collision transfer to Neon atoms',
      'Understand optical resonant cavity feedback and 632.8 nm red output beam generation',
      'Identify industrial and laboratory applications of continuous wave gas lasers'
    ],
    ai_keywords: ['He-Ne Laser', 'Helium-Neon', 'Population Inversion', 'Resonant Cavity', '632.8 nm', 'Metrology'],
    ai_recommended_next_topic: 'Semiconductor Diode Lasers & Industrial CO2 Lasers',
    ai_summary_status: 'generated',
    sync_status: 'Synced',
    created_at: new Date().toISOString()
  },
  {
    id: 'sb-demo-neha-01',
    teacher_id: 'HIET-FAC-CSE-002',
    teacher_name: 'Dr. Neha Kapoor',
    subject_id: 'sub-btma-102',
    subject_name: 'Engineering Mathematics-I',
    subject_code: 'BTMA102',
    department: 'CSE',
    semester: 1,
    section: 'A',
    room_number: 'C-102',
    class_date: new Date().toISOString().slice(0, 10),
    start_time: '11:00',
    end_time: '11:50',
    duration_minutes: 50,
    unit: 'Unit 2: Differential Equations',
    topic: 'Differential Equations',
    syllabus_topic_id: 'topic-diff-01',
    lesson_file_url: '/lessons/diff_equations_notes.pdf',
    file_name: 'Differential_Equations_Whiteboard.pdf',
    file_type: 'pdf',
    notes_summary: 'Exact differential equations, integrating factor calculation methods, and second-order linear differential equations.',
    sync_status: 'Pending Sync',
    created_at: new Date().toISOString()
  },
  {
    id: 'sb-demo-rohit-01',
    teacher_id: 'HIET-FAC-CSE-003',
    teacher_name: 'Mr. Rohit Mehta',
    subject_id: 'sub-btee-103',
    subject_name: 'Basic Electrical Engineering',
    subject_code: 'BTEE103',
    department: 'CSE',
    semester: 1,
    section: 'A',
    room_number: 'C-LAB-1',
    class_date: new Date().toISOString().slice(0, 10),
    start_time: '12:00',
    end_time: '12:45',
    duration_minutes: 45,
    unit: 'Unit 3: Transformer Basics',
    topic: 'Transformer Basics',
    syllabus_topic_id: 'topic-trans-01',
    lesson_file_url: '/lessons/transformer_basics.pdf',
    file_name: 'Transformer_Basics_Notes.pdf',
    file_type: 'pdf',
    notes_summary: 'Core construction, mutual induction principle, EMF equation, and equivalent circuit parameter reflection.',
    sync_status: 'Synced',
    created_at: new Date().toISOString()
  },
  {
    id: 'sb-01',
    teacher_id: 'fac-cse-01',
    teacher_name: 'Er. Rajesh Kumar',
    subject_id: 'sub-cse-601',
    subject_name: 'Compiler Design',
    subject_code: 'CS-601',
    department: 'CSE',
    semester: 6,
    section: 'A',
    room_number: 'LH-301',
    class_date: '2026-03-01',
    start_time: '09:00',
    end_time: '09:50',
    duration_minutes: 50,
    unit: 'Unit 2: Syntax Analysis',
    topic: 'LR(0) and SLR(1) Parsing Table Construction',
    syllabus_topic_id: 'topic-cd-04',
    lesson_file_url: '/lessons/cd_slr_parsing_table.pdf',
    file_name: 'CD_Unit2_LR_Parsing_Export.pdf',
    file_type: 'pdf',
    notes_summary: 'Worked through canonical collection of LR(0) items and follow set conflicts on Interactive Smart Board 3.',
    sync_status: 'Synced',
    created_at: '2026-03-01 09:55:00'
  },
  {
    id: 'sb-02',
    teacher_id: 'fac-cse-01',
    teacher_name: 'Er. Rajesh Kumar',
    subject_id: 'sub-cse-601',
    subject_name: 'Compiler Design',
    subject_code: 'CS-601',
    department: 'CSE',
    semester: 6,
    section: 'A',
    room_number: 'LH-301',
    class_date: '2026-02-28',
    start_time: '10:00',
    end_time: '10:50',
    duration_minutes: 50,
    unit: 'Unit 2: Syntax Analysis',
    topic: 'Top-Down Parsing & LL(1) Grammar Elimination',
    syllabus_topic_id: 'topic-cd-03',
    lesson_file_url: '/lessons/cd_top_down_parsing.pdf',
    file_name: 'CD_Unit2_LL1_Export.pdf',
    file_type: 'pdf',
    notes_summary: 'Grammar transformation rules and FIRST / FOLLOW calculation walkthrough.',
    sync_status: 'Synced',
    created_at: '2026-02-28 10:55:00'
  },
  {
    id: 'sb-03',
    teacher_id: 'fac-cse-02',
    teacher_name: 'Dr. Amit Thakur',
    subject_id: 'sub-cse-602',
    subject_name: 'Computer Networks',
    subject_code: 'CS-602',
    department: 'CSE',
    semester: 6,
    section: 'A',
    room_number: 'LH-302',
    class_date: '2026-03-01',
    start_time: '11:00',
    end_time: '11:50',
    duration_minutes: 50,
    unit: 'Unit 3: Network Layer',
    topic: 'Dijkstra Link State Routing Algorithm',
    syllabus_topic_id: 'topic-cn-05',
    lesson_file_url: '/lessons/cn_dijkstra_link_state.pdf',
    file_name: 'CN_LinkState_Board_Export.pdf',
    file_type: 'pdf',
    notes_summary: 'Step-by-step shortest path tree calculation and routing table construction.',
    sync_status: 'Synced',
    created_at: '2026-03-01 11:55:00'
  }
];

// =============================================================================
// LOCAL DATA STORE CLASS
// =============================================================================
const memoryStore = new Map<string, any>();

function getLocalItem<T>(key: string, defaultVal: T): T {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(`hiet_${key}`);
      return item ? JSON.parse(item) : defaultVal;
    }
    return memoryStore.has(key) ? memoryStore.get(key) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocalItem<T>(key: string, val: T): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(`hiet_${key}`, JSON.stringify(val));
    }
    memoryStore.set(key, val);
  } catch (e) {
    console.error('Storage error', e);
  }
}

class DataStore {
  getStudentsMaster(): StudentMaster[] {
    return getLocalItem('students_master', INITIAL_STUDENTS_MASTER);
  }
  setStudentsMaster(data: StudentMaster[]): void {
    setLocalItem('students_master', data);
  }

  getTeachersMaster(): TeacherMaster[] {
    const raw = getLocalItem('teachers_master', INITIAL_TEACHERS_MASTER);
    const map = new Map<string, TeacherMaster>();
    INITIAL_TEACHERS_MASTER.forEach(t => map.set(t.faculty_id.toUpperCase(), t));
    raw.forEach(t => {
      const existing = map.get(t.faculty_id.toUpperCase());
      map.set(t.faculty_id.toUpperCase(), {
        ...existing,
        ...t,
        full_name: t.full_name || t.name || existing?.full_name || '',
        name: t.name || t.full_name || existing?.name || '',
        role: (t.role || existing?.role || (t.is_hod ? 'hod' : 'teacher')) as 'teacher' | 'hod',
        status: t.status || existing?.status || 'active'
      });
    });
    return Array.from(map.values());
  }
  setTeachersMaster(data: TeacherMaster[]): void {
    setLocalItem('teachers_master', data);
  }

  getSubjects(): Subject[] {
    return getLocalItem('subjects', INITIAL_SUBJECTS);
  }
  setSubjects(data: Subject[]): void {
    setLocalItem('subjects', data);
  }

  getAttendance(): AttendanceRecord[] {
    return getLocalItem('attendance', INITIAL_ATTENDANCE);
  }
  setAttendance(data: AttendanceRecord[]): void {
    setLocalItem('attendance', data);
  }

  getSessionalResults(): SessionalResult[] {
    return getLocalItem('sessional_results', INITIAL_SESSIONAL_RESULTS);
  }
  setSessionalResults(data: SessionalResult[]): void {
    setLocalItem('sessional_results', data);
  }

  getTimetable(): TimetableSlot[] {
    return getLocalItem('timetable', INITIAL_TIMETABLE);
  }
  setTimetable(data: TimetableSlot[]): void {
    setLocalItem('timetable', data);
  }

  getSyllabusProgress(): SyllabusProgress[] {
    return getLocalItem('syllabus_progress', INITIAL_SYLLABUS_PROGRESS);
  }
  setSyllabusProgress(data: SyllabusProgress[]): void {
    setLocalItem('syllabus_progress', data);
  }

  getAcademicRecords(): AcademicRecord[] {
    return getLocalItem('academic_records', INITIAL_ACADEMIC_RECORDS);
  }
  setAcademicRecords(data: AcademicRecord[]): void {
    setLocalItem('academic_records', data);
  }

  getAchievements(): Achievement[] {
    return getLocalItem('achievements', INITIAL_ACHIEVEMENTS);
  }
  setAchievements(data: Achievement[]): void {
    setLocalItem('achievements', data);
  }

  getSyllabus(): SyllabusItem[] {
    return getLocalItem('syllabus', INITIAL_SYLLABUS);
  }
  setSyllabus(data: SyllabusItem[]): void {
    setLocalItem('syllabus', data);
  }

  getPyqs(): PYQItem[] {
    return getLocalItem('pyqs', INITIAL_PYQS);
  }
  setPyqs(data: PYQItem[]): void {
    setLocalItem('pyqs', data);
  }

  getLeaves(): LeaveRequest[] {
    return getLocalItem('leaves', INITIAL_LEAVES);
  }
  setLeaves(data: LeaveRequest[]): void {
    setLocalItem('leaves', data);
  }

  getLeaveHistory(leaveId?: string): LeaveRequestHistory[] {
    const list = getLocalItem('leave_history', INITIAL_LEAVE_HISTORY);
    return leaveId ? list.filter(h => h.leave_id === leaveId) : list;
  }
  setLeaveHistory(data: LeaveRequestHistory[]): void {
    setLocalItem('leave_history', data);
  }
  addLeaveHistory(item: LeaveRequestHistory): void {
    const list = this.getLeaveHistory();
    this.setLeaveHistory([...list, item]);
  }

  getLeaveConfig(departmentId?: string): LeaveWorkflowConfig {
    const configs = getLocalItem('leave_configs', [DEFAULT_LEAVE_CONFIG]);
    return configs.find(c => c.department_id === departmentId) || configs[0] || DEFAULT_LEAVE_CONFIG;
  }

  getComplaints(): Complaint[] {
    return getLocalItem('complaints', INITIAL_COMPLAINTS);
  }
  setComplaints(data: Complaint[]): void {
    setLocalItem('complaints', data);
  }

  getDoubts(): Doubt[] {
    return getLocalItem('doubts', INITIAL_DOUBTS);
  }
  setDoubts(data: Doubt[]): void {
    setLocalItem('doubts', data);
  }

  getCalendar(): CalendarEvent[] {
    return getLocalItem('calendar', INITIAL_CALENDAR);
  }
  setCalendar(data: CalendarEvent[]): void {
    setLocalItem('calendar', data);
  }

  getNotices(): Notice[] {
    return getLocalItem('notices', INITIAL_NOTICES);
  }
  setNotices(data: Notice[]): void {
    setLocalItem('notices', data);
  }

  getLocations(): CampusLocation[] {
    return INITIAL_CAMPUS_LOCATIONS;
  }

  getSocialLinks(): CollegeSocialLink[] {
    return getLocalItem('social_links', INITIAL_SOCIAL_LINKS);
  }
  setSocialLinks(data: CollegeSocialLink[]): void {
    setLocalItem('social_links', data);
  }

  getGatePasses(): GatePass[] {
    return getLocalItem('gate_passes', INITIAL_GATE_PASSES);
  }
  setGatePasses(data: GatePass[]): void {
    setLocalItem('gate_passes', data);
  }

  getGateEntries(): GateEntry[] {
    return getLocalItem('gate_entries', INITIAL_GATE_ENTRIES);
  }
  setGateEntries(data: GateEntry[]): void {
    setLocalItem('gate_entries', data);
  }

  getProfiles(): Profile[] {
    return getLocalItem('profiles', INITIAL_PROFILES);
  }
  setProfiles(data: Profile[]): void {
    setLocalItem('profiles', data);
  }

  getNotifications(): NotificationItem[] {
    return getLocalItem('notifications', INITIAL_NOTIFICATIONS);
  }
  setNotifications(data: NotificationItem[]): void {
    setLocalItem('notifications', data);
  }

  // Feature 1: Push Notifications & Preferences
  getDeviceTokens(): DeviceToken[] {
    return getLocalItem('device_tokens', INITIAL_DEVICE_TOKENS);
  }
  setDeviceTokens(data: DeviceToken[]): void {
    setLocalItem('device_tokens', data);
  }

  getNotificationPreferences(userId?: string): NotificationPreferences {
    const list = getLocalItem('notification_preferences', INITIAL_NOTIFICATION_PREFERENCES);
    if (!userId) return list[0];
    const match = list.find(p => p.user_id === userId);
    return match || {
      user_id: userId,
      class_reminders: true,
      attendance_warnings: true,
      leave_updates: true,
      achievement_alerts: true,
      notice_alerts: true,
      gate_pass_updates: true,
      fine_alerts: true,
      exam_announcements: true
    };
  }
  setNotificationPreferences(pref: NotificationPreferences): void {
    const list = getLocalItem('notification_preferences', INITIAL_NOTIFICATION_PREFERENCES);
    const filtered = list.filter(p => p.user_id !== pref.user_id);
    setLocalItem('notification_preferences', [...filtered, pref]);
  }

  getPushDeliveryLogs(): PushDeliveryLog[] {
    return getLocalItem('push_delivery_logs', INITIAL_PUSH_DELIVERY_LOGS);
  }
  addPushDeliveryLog(log: PushDeliveryLog): void {
    const current = this.getPushDeliveryLogs();
    setLocalItem('push_delivery_logs', [log, ...current]);
  }

  // Feature 2 & 3: Gate Pass Requests & Scan Logs
  getGatePassRequests(): GatePassRequest[] {
    return getLocalItem('gate_pass_requests', INITIAL_GATE_PASS_REQUESTS);
  }
  setGatePassRequests(data: GatePassRequest[]): void {
    setLocalItem('gate_pass_requests', data);
  }

  getGateScanLogs(): GateScanLog[] {
    return getLocalItem('gate_scan_logs', INITIAL_GATE_SCAN_LOGS);
  }
  setGateScanLogs(data: GateScanLog[]): void {
    setLocalItem('gate_scan_logs', data);
  }
  addGateScanLog(log: GateScanLog): void {
    const list = this.getGateScanLogs();
    setLocalItem('gate_scan_logs', [log, ...list]);
  }

  // Feature 5: Fine Management & Appeals
  getFineRules(): FineRule[] {
    return getLocalItem('fine_rules', INITIAL_FINE_RULES);
  }
  setFineRules(data: FineRule[]): void {
    setLocalItem('fine_rules', data);
  }

  getStudentFines(): StudentFine[] {
    return getLocalItem('student_fines', INITIAL_STUDENT_FINES);
  }
  setStudentFines(data: StudentFine[]): void {
    setLocalItem('student_fines', data);
  }

  getFineAppeals(): FineAppeal[] {
    return getLocalItem('fine_appeals', INITIAL_FINE_APPEALS);
  }
  setFineAppeals(data: FineAppeal[]): void {
    setLocalItem('fine_appeals', data);
  }

  // Feature 10: Import Jobs & Errors
  getImportJobs(): ImportJob[] {
    return getLocalItem('import_jobs', INITIAL_IMPORT_JOBS);
  }
  setImportJobs(jobs: ImportJob[]): void {
    setLocalItem('import_jobs', jobs);
  }
  addImportJob(job: ImportJob): void {
    const list = this.getImportJobs();
    setLocalItem('import_jobs', [job, ...list]);
  }

  getImportErrors(jobId?: string): ImportError[] {
    const list = getLocalItem('import_errors', [] as ImportError[]);
    return jobId ? list.filter(e => e.job_id === jobId) : list;
  }
  setImportErrors(errors: ImportError[]): void {
    const current = getLocalItem('import_errors', [] as ImportError[]);
    setLocalItem('import_errors', [...current, ...errors]);
  }

  // Feature 7: AI Knowledge Documents
  getAiKnowledgeDocuments(): AiKnowledgeDocument[] {
    return getLocalItem('ai_knowledge_docs', INITIAL_AI_KNOWLEDGE_DOCUMENTS);
  }
  setAiKnowledgeDocuments(docs: AiKnowledgeDocument[]): void {
    setLocalItem('ai_knowledge_docs', docs);
  }

  // Feature 8: Grades (Dynamic SGPA / CGPA Calculation)
  getGrades(): Grade[] {
    return getLocalItem('grades', INITIAL_GRADES);
  }
  setGrades(data: Grade[]): void {
    setLocalItem('grades', data);
  }

  // Feature 9: Audit Logs Ledger
  getAuditLogs(): any[] {
    const importJobs = this.getImportJobs();
    const gateLogs = this.getGateScanLogs();
    const logs: any[] = [];
    importJobs.forEach(job => {
      logs.push({
        id: `audit-${job.id}`,
        timestamp: job.created_at || '2026-03-01 10:30:00',
        administrator: job.imported_by_name || 'Principal Office',
        action: 'BATCH_IMPORT',
        targetEntity: String(job.target_entity).toUpperCase(),
        details: `Processed ${job.total_rows} rows: ${job.successful_rows} imported, ${job.failed_rows} errors.`,
        status: job.status === 'Completed' ? 'Completed' : 'Warning'
      });
    });
    gateLogs.slice(0, 10).forEach((gl, idx) => {
      logs.push({
        id: `audit-gate-${gl.id || idx}`,
        timestamp: gl.scanned_at || '2026-03-01 08:45:00',
        administrator: gl.guard_name || 'Security Checkpoint A',
        action: 'GATE_VERIFICATION',
        targetEntity: 'DIGITAL_GATE_PASS',
        details: `Verified ${gl.student_name} (${gl.student_roll}) - ${gl.verification_status}`,
        status: gl.verification_status === 'Valid' ? 'Verified' : 'Warning'
      });
    });
    if (logs.length === 0) {
      logs.push({
        id: 'audit-init-01',
        timestamp: '2026-03-01 09:00:00',
        administrator: 'Office of the Principal',
        action: 'SYSTEM_AUDIT',
        targetEntity: 'ADMINISTRATION',
        details: 'Institutional ledger initialized with verified academic master records.',
        status: 'Completed'
      });
    }
    return logs;
  }

  // Feature 11: Smart Board Lessons (Sections 39-47)
  getSmartBoardLessons(): SmartBoardLesson[] {
    return getLocalItem('smartboard_lessons', INITIAL_SMARTBOARD_LESSONS);
  }
  setSmartBoardLessons(data: SmartBoardLesson[]): void {
    setLocalItem('smartboard_lessons', data);
  }
  addSmartBoardLesson(lesson: SmartBoardLesson): void {
    const list = this.getSmartBoardLessons();
    setLocalItem('smartboard_lessons', [lesson, ...list]);
  }
  updateSmartBoardLesson(id: string, updates: Partial<SmartBoardLesson>): void {
    const list = this.getSmartBoardLessons();
    setLocalItem('smartboard_lessons', list.map(l => l.id === id ? { ...l, ...updates } : l));
  }

  // Feature 12: Campus Presence & Zones (Sections 48-51)
  getCampusZones(): CampusZone[] {
    return getLocalItem('campus_zones', INITIAL_CAMPUS_ZONES);
  }
  setCampusZones(data: CampusZone[]): void {
    setLocalItem('campus_zones', data);
  }
  getCampusPresence(): CampusPresenceRecord[] {
    return getLocalItem('campus_presence', INITIAL_CAMPUS_PRESENCE);
  }
  setCampusPresence(data: CampusPresenceRecord[]): void {
    setLocalItem('campus_presence', data);
  }

  // Feature 13: Class In-Charges & HOD Assignments
  getClassIncharges(): ClassInchargeRecord[] {
    return getLocalItem('class_incharges', [
      {
        id: 'cic-01',
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        academic_year: '2026-2027',
        employee_code: 'FAC-001',
        created_at: '2026-01-15T00:00:00Z'
      },
      {
        id: 'cic-02',
        department_code: 'CSE',
        semester: 4,
        section: 'A',
        academic_year: '2026-2027',
        employee_code: 'FAC-002',
        created_at: '2026-01-15T00:00:00Z'
      }
    ]);
  }
  setClassIncharges(data: ClassInchargeRecord[]): void {
    setLocalItem('class_incharges', data);
  }

  getHodAssignments(): HodAssignmentRecord[] {
    return getLocalItem('hod_assignments', [
      {
        id: 'hod-01',
        department_code: 'CSE',
        employee_code: 'FAC-001',
        effective_from: '2026-01-01',
        remarks: 'Appointed HOD Computer Science & Engineering',
        created_at: '2026-01-01T00:00:00Z'
      }
    ]);
  }
  setHodAssignments(data: HodAssignmentRecord[]): void {
    setLocalItem('hod_assignments', data);
  }

  // Atomic Transaction Rollback & Recovery Snapshots
  getEntitySnapshot(entity: string): any {
    switch (entity) {
      case 'students': return JSON.parse(JSON.stringify(this.getStudentsMaster()));
      case 'faculty': return JSON.parse(JSON.stringify(this.getTeachersMaster()));
      case 'subjects': return JSON.parse(JSON.stringify(this.getSubjects()));
      case 'attendance': return JSON.parse(JSON.stringify(this.getAttendance()));
      case 'sessional_marks': return JSON.parse(JSON.stringify(this.getSessionalResults()));
      case 'timetable': return JSON.parse(JSON.stringify(this.getTimetable()));
      case 'results_grades': return JSON.parse(JSON.stringify(this.getAcademicRecords()));
      case 'syllabus': return JSON.parse(JSON.stringify(this.getSyllabus()));
      case 'pyqs': return JSON.parse(JSON.stringify(this.getPyqs()));
      case 'class_incharge': return JSON.parse(JSON.stringify(this.getClassIncharges()));
      case 'hod_assignment': return JSON.parse(JSON.stringify(this.getHodAssignments()));
      default: return null;
    }
  }

  restoreEntitySnapshot(entity: string, snapshot: any): void {
    if (!snapshot) return;
    switch (entity) {
      case 'students': this.setStudentsMaster(snapshot); break;
      case 'faculty': this.setTeachersMaster(snapshot); break;
      case 'subjects': this.setSubjects(snapshot); break;
      case 'attendance': this.setAttendance(snapshot); break;
      case 'sessional_marks': this.setSessionalResults(snapshot); break;
      case 'timetable': this.setTimetable(snapshot); break;
      case 'results_grades': this.setAcademicRecords(snapshot); break;
      case 'syllabus': this.setSyllabus(snapshot); break;
      case 'pyqs': this.setPyqs(snapshot); break;
      case 'class_incharge': this.setClassIncharges(snapshot); break;
      case 'hod_assignment': this.setHodAssignments(snapshot); break;
    }
  }

  // Feature 14: Demo Data Management (Development & Staging Only)
  getDemoStats(): {
    demoStudentsCount: number;
    demoFacultyCount: number;
    demoAttendanceCount: number;
    demoMarksCount: number;
    isDemoAccountsDisabled: boolean;
    isDemoArchived: boolean;
    dataEnvironment: string;
  } {
    const students = this.getStudentsMaster();
    const faculty = this.getTeachersMaster();
    const attendance = this.getAttendance();
    const marks = this.getSessionalResults();
    const isAccountsDisabled = Boolean(getLocalItem('hiet_demo_accounts_disabled', false));
    const isArchived = Boolean(getLocalItem('hiet_demo_archived', false));

    return {
      demoStudentsCount: students.length,
      demoFacultyCount: faculty.length,
      demoAttendanceCount: attendance.length,
      demoMarksCount: marks.length,
      isDemoAccountsDisabled: isAccountsDisabled,
      isDemoArchived: isArchived,
      dataEnvironment: (import.meta as any).env?.VITE_APP_ENV || 'development'
    };
  }

  disableDemoAccounts(): { disabledStudents: number; disabledFaculty: number } {
    const students = this.getStudentsMaster().map(s => ({
      ...s,
      status: 'disabled' as const,
      is_demo_account: true,
      data_environment: 'development'
    }));
    this.setStudentsMaster(students);

    const faculty = this.getTeachersMaster().map(f => ({
      ...f,
      status: 'disabled' as const,
      is_demo_account: true,
      data_environment: 'development'
    }));
    this.setTeachersMaster(faculty);

    setLocalItem('hiet_demo_accounts_disabled', true);

    return {
      disabledStudents: students.length,
      disabledFaculty: faculty.length
    };
  }

  archiveDemoRecords(): { archiveTimestamp: string; recordsArchived: number } {
    const archivePayload = this.exportDemoBackup();
    setLocalItem('hiet_demo_records_archive', archivePayload);
    setLocalItem('hiet_demo_archived', true);

    return {
      archiveTimestamp: new Date().toISOString(),
      recordsArchived:
        (archivePayload.students?.length || 0) +
        (archivePayload.faculty?.length || 0) +
        (archivePayload.attendance?.length || 0)
    };
  }

  exportDemoBackup(): Record<string, any> {
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      institution: 'Himachal Institute of Engineering & Technology (HIET), Shahpur',
      environment: (import.meta as any).env?.VITE_APP_ENV || 'development',
      students: this.getStudentsMaster(),
      faculty: this.getTeachersMaster(),
      subjects: this.getSubjects(),
      attendance: this.getAttendance(),
      sessional_marks: this.getSessionalResults(),
      academic_records: this.getAcademicRecords(),
      timetable: this.getTimetable(),
      class_incharges: this.getClassIncharges(),
      hod_assignments: this.getHodAssignments()
    };
  }
}

export const dataStore = new DataStore();
