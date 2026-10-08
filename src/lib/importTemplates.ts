import * as XLSX from 'xlsx';
import { ImportEntityType } from '../types';

export interface EntityModuleConfig {
  id: ImportEntityType;
  title: string;
  category: 'core' | 'academics' | 'records' | 'curriculum' | 'system';
  description: string;
  headers: string[];
  requiredHeaders: string[];
  optionalHeaders?: string[];
  sampleRows: Record<string, any>[];
  fieldDescriptions: Record<string, string>;
  validationRules: Record<string, string>;
  identifierField: string;
}

export const IMPORT_MODULE_CONFIGS: Record<ImportEntityType, EntityModuleConfig> = {
  // 1. Departments Master
  departments: {
    id: 'departments',
    title: 'Departments & Branches',
    category: 'core',
    description: 'Academic departments, branch programs, established years, and student intake capacities',
    headers: [
      'department_code',
      'department_name',
      'established_year',
      'intake_capacity',
      'is_active'
    ],
    requiredHeaders: ['department_code', 'department_name'],
    optionalHeaders: ['established_year', 'intake_capacity', 'is_active'],
    identifierField: 'department_code',
    sampleRows: [
      {
        department_code: 'CSE',
        department_name: 'Computer Science & Engineering',
        established_year: 2008,
        intake_capacity: 60,
        is_active: 'true'
      },
      {
        department_code: 'ECE',
        department_name: 'Electronics & Communication Engineering',
        established_year: 2008,
        intake_capacity: 60,
        is_active: 'true'
      },
      {
        department_code: 'ME',
        department_name: 'Mechanical Engineering',
        established_year: 2008,
        intake_capacity: 60,
        is_active: 'true'
      },
      {
        department_code: 'CE',
        department_name: 'Civil Engineering',
        established_year: 2008,
        intake_capacity: 60,
        is_active: 'true'
      },
      {
        department_code: 'AS&H',
        department_name: 'Applied Sciences & Humanities',
        established_year: 2008,
        intake_capacity: 120,
        is_active: 'true'
      }
    ],
    fieldDescriptions: {
      department_code: 'Short uppercase code (e.g. CSE, ECE, ME, CE, AS&H)',
      department_name: 'Official full department title',
      established_year: 'Year department was founded at HIET (e.g. 2008)',
      intake_capacity: 'Approved total intake seats per batch',
      is_active: 'Active status (true / false)'
    },
    validationRules: {
      department_code: 'Required, uppercase, alphanumeric without spaces (2-10 chars)',
      department_name: 'Required non-empty string',
      established_year: 'Optional integer between 1950 and current year',
      intake_capacity: 'Optional positive integer',
      is_active: 'true or false (defaults to true)'
    }
  },

  departments_branches: {
    id: 'departments_branches',
    title: 'Departments & Branches (Legacy)',
    category: 'core',
    description: 'Alias for departments and degree branches',
    headers: [
      'department_code',
      'department_name',
      'established_year',
      'intake_capacity',
      'is_active'
    ],
    requiredHeaders: ['department_code', 'department_name'],
    optionalHeaders: ['established_year', 'intake_capacity', 'is_active'],
    identifierField: 'department_code',
    sampleRows: [
      {
        department_code: 'CSE',
        department_name: 'Computer Science & Engineering',
        established_year: 2008,
        intake_capacity: 60,
        is_active: 'true'
      }
    ],
    fieldDescriptions: {
      department_code: 'Short uppercase code (e.g. CSE)',
      department_name: 'Official full department title',
      established_year: 'Year founded',
      intake_capacity: 'Intake seats',
      is_active: 'Status (true/false)'
    },
    validationRules: {
      department_code: 'Required uppercase code',
      department_name: 'Required string',
      established_year: 'Optional integer',
      intake_capacity: 'Optional integer',
      is_active: 'Optional boolean'
    }
  },

  // 2. Faculty Master
  faculty: {
    id: 'faculty',
    title: 'Faculty Master',
    category: 'core',
    description: 'Faculty directory, employee codes, designations, qualifications, and department associations',
    headers: [
      'employee_code',
      'full_name',
      'email',
      'phone',
      'department_code',
      'designation',
      'qualification',
      'is_active'
    ],
    requiredHeaders: ['employee_code', 'full_name', 'department_code', 'designation'],
    optionalHeaders: ['email', 'phone', 'qualification', 'is_active'],
    identifierField: 'employee_code',
    sampleRows: [
      {
        employee_code: 'FAC001',
        full_name: 'Er. Anuj Sharma',
        email: 'anuj.sharma@hiet.ac.in',
        phone: '9816000001',
        department_code: 'CSE',
        designation: 'Associate Professor',
        qualification: 'M.Tech (CSE), Ph.D (Pursuing)',
        is_active: 'true'
      },
      {
        employee_code: 'FAC002',
        full_name: 'Er. Rohit Kumar',
        email: 'rohit.kumar@hiet.ac.in',
        phone: '9816000002',
        department_code: 'CSE',
        designation: 'Assistant Professor',
        qualification: 'M.Tech (CSE)',
        is_active: 'true'
      },
      {
        employee_code: 'FAC003',
        full_name: 'Er. Priya Sen',
        email: 'priya.sen@hiet.ac.in',
        phone: '9816000003',
        department_code: 'CSE',
        designation: 'Assistant Professor',
        qualification: 'M.Tech (Information Technology)',
        is_active: 'true'
      }
    ],
    fieldDescriptions: {
      employee_code: 'Unique institutional employee code (e.g. FAC001, EMP-2026-01)',
      full_name: 'Faculty member legal full name with title',
      email: 'Official college institutional or personal email address',
      phone: '10-digit mobile contact number',
      department_code: 'Department code where faculty is appointed (e.g. CSE, ECE, AS&H)',
      designation: 'Academic designation (Assistant Professor, Associate Professor, Professor)',
      qualification: 'Highest degree obtained (e.g. M.Tech, Ph.D, B.Tech)',
      is_active: 'Employment status (true / false)'
    },
    validationRules: {
      employee_code: 'Required, unique, non-empty uppercase alphanumeric',
      full_name: 'Required non-empty string',
      department_code: 'Required, must exist in registered departments',
      designation: 'Required string',
      email: 'Valid email format if provided; must not duplicate another active faculty member',
      phone: 'Optional 10-digit valid mobile number',
      is_active: 'Optional boolean (defaults to true)'
    }
  },

  // 3. Student Master
  students: {
    id: 'students',
    title: 'Student Master',
    category: 'core',
    description: 'Enrolled students, university roll numbers, programs, semesters, sections, and contact profiles',
    headers: [
      'roll_no',
      'full_name',
      'email',
      'phone',
      'department_code',
      'semester',
      'section',
      'academic_year',
      'enrolled_year',
      'is_active'
    ],
    requiredHeaders: ['roll_no', 'full_name', 'department_code', 'semester', 'section', 'academic_year'],
    optionalHeaders: ['email', 'phone', 'enrolled_year', 'is_active'],
    identifierField: 'roll_no',
    sampleRows: [
      {
        roll_no: 'CSE001',
        full_name: 'Aarav Sharma',
        email: 'aarav.sharma@hiet.ac.in',
        phone: '9876543210',
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        academic_year: '2026-2027',
        enrolled_year: 2023,
        is_active: 'true'
      },
      {
        roll_no: 'CSE002',
        full_name: 'Aditya Verma',
        email: 'aditya.verma@hiet.ac.in',
        phone: '9876543211',
        department_code: 'CSE',
        semester: 6,
        section: 'B',
        academic_year: '2026-2027',
        enrolled_year: 2023,
        is_active: 'true'
      },
      {
        roll_no: 'CSE003',
        full_name: 'Ananya Kapoor',
        email: 'ananya.kapoor@hiet.ac.in',
        phone: '9876543212',
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        academic_year: '2026-2027',
        enrolled_year: 2023,
        is_active: 'true'
      }
    ],
    fieldDescriptions: {
      roll_no: 'Unique university or college roll number (e.g. CSE001, 210101)',
      full_name: 'Student official full legal name',
      email: 'Official college email or communication address',
      phone: '10-digit primary mobile contact number',
      department_code: 'Academic department code (e.g. CSE, ECE, ME, CE)',
      semester: 'Current semester number (1 to 8)',
      section: 'Section assignment (e.g. A, B, C)',
      academic_year: 'Session academic year in YYYY-YYYY format (e.g. 2026-2027)',
      enrolled_year: 'First admission year (e.g. 2023)',
      is_active: 'Active student status (true / false)'
    },
    validationRules: {
      roll_no: 'Required, unique, non-empty uppercase alphanumeric',
      full_name: 'Required non-empty string',
      department_code: 'Required, must exist in registered departments',
      semester: 'Required integer between 1 and 8',
      section: 'Required uppercase letter (A, B, C)',
      academic_year: 'Required format YYYY-YYYY (e.g. 2026-2027)',
      email: 'Valid email format if provided; must not duplicate another active student',
      is_active: 'Optional boolean (defaults to true)'
    }
  },

  // 4. Subjects Master
  subjects: {
    id: 'subjects',
    title: 'Subjects Master',
    category: 'academics',
    description: 'Course curriculum catalog, subject codes, credits, semesters, and subject classification',
    headers: [
      'subject_code',
      'subject_name',
      'department_code',
      'semester',
      'credits',
      'subject_type',
      'academic_year',
      'is_active'
    ],
    requiredHeaders: ['subject_code', 'subject_name', 'department_code', 'semester', 'credits'],
    optionalHeaders: ['subject_type', 'academic_year', 'is_active'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        subject_code: 'CS-601',
        subject_name: 'Compiler Design',
        department_code: 'CSE',
        semester: 6,
        credits: 4.0,
        subject_type: 'theory',
        academic_year: '2026-2027',
        is_active: 'true'
      },
      {
        subject_code: 'CS-602',
        subject_name: 'Computer Networks',
        department_code: 'CSE',
        semester: 6,
        credits: 4.0,
        subject_type: 'theory',
        academic_year: '2026-2027',
        is_active: 'true'
      },
      {
        subject_code: 'CS-603',
        subject_name: 'Computer Networks Lab',
        department_code: 'CSE',
        semester: 6,
        credits: 1.5,
        subject_type: 'lab',
        academic_year: '2026-2027',
        is_active: 'true'
      }
    ],
    fieldDescriptions: {
      subject_code: 'Official university course code (e.g. CS-601, ME-301)',
      subject_name: 'Full course subject title',
      department_code: 'Department offering this course (e.g. CSE)',
      semester: 'Curriculum semester level (1 to 8)',
      credits: 'Academic credit value (e.g. 4.0, 3.0, 1.5)',
      subject_type: 'Course nature: theory, lab, elective, seminar, project',
      academic_year: 'Academic year curriculum (e.g. 2026-2027)',
      is_active: 'Active subject status (true / false)'
    },
    validationRules: {
      subject_code: 'Required, unique, non-empty uppercase alphanumeric with hyphens',
      subject_name: 'Required non-empty string',
      department_code: 'Required, must exist in registered departments',
      semester: 'Required integer between 1 and 8',
      credits: 'Required positive number between 0.5 and 10.0',
      subject_type: 'Optional: theory | lab | elective | project | seminar',
      is_active: 'Optional boolean (defaults to true)'
    }
  },

  // 5. Faculty Subject Mapping
  teacher_subjects: {
    id: 'teacher_subjects',
    title: 'Faculty-Subject Mapping',
    category: 'academics',
    description: 'Course instructor allocations, sections assigned, and primary teacher designations',
    headers: [
      'employee_code',
      'subject_code',
      'department_code',
      'semester',
      'section',
      'academic_year',
      'is_primary'
    ],
    requiredHeaders: ['employee_code', 'subject_code', 'department_code', 'semester', 'section'],
    optionalHeaders: ['academic_year', 'is_primary'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        employee_code: 'FAC001',
        subject_code: 'CS-601',
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        academic_year: '2026-2027',
        is_primary: 'true'
      },
      {
        employee_code: 'FAC002',
        subject_code: 'CS-602',
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        academic_year: '2026-2027',
        is_primary: 'true'
      },
      {
        employee_code: 'FAC003',
        subject_code: 'CS-603',
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        academic_year: '2026-2027',
        is_primary: 'true'
      }
    ],
    fieldDescriptions: {
      employee_code: 'Faculty employee code from Faculty Master (e.g. FAC001)',
      subject_code: 'Course code from Subjects Master (e.g. CS-601)',
      department_code: 'Department code (e.g. CSE)',
      semester: 'Class semester (1 to 8)',
      section: 'Assigned section (e.g. A, B)',
      academic_year: 'Academic session (e.g. 2026-2027)',
      is_primary: 'Whether primary evaluation instructor (true / false)'
    },
    validationRules: {
      employee_code: 'Required, must exist in Faculty Master',
      subject_code: 'Required, must exist in Subjects Master',
      department_code: 'Required, must match subject department unless cross-dept permitted',
      semester: 'Required integer between 1 and 8',
      section: 'Required section (A, B, C)',
      is_primary: 'Optional boolean (defaults to true)'
    }
  },

  // 6. Class In-Charge Mapping
  class_incharge: {
    id: 'class_incharge',
    title: 'Class In-Charge Mapping',
    category: 'academics',
    description: 'Designate faculty members as class mentors and first-line leave approval authorities for specific sections',
    headers: [
      'department_code',
      'semester',
      'section',
      'academic_year',
      'employee_code'
    ],
    requiredHeaders: ['department_code', 'semester', 'section', 'academic_year', 'employee_code'],
    identifierField: 'employee_code',
    sampleRows: [
      {
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        academic_year: '2026-2027',
        employee_code: 'FAC002'
      },
      {
        department_code: 'CSE',
        semester: 6,
        section: 'B',
        academic_year: '2026-2027',
        employee_code: 'FAC003'
      }
    ],
    fieldDescriptions: {
      department_code: 'Department code (e.g. CSE)',
      semester: 'Semester level (1 to 8)',
      section: 'Section mentored (e.g. A, B)',
      academic_year: 'Academic year (e.g. 2026-2027)',
      employee_code: 'Faculty employee code designated as Class In-Charge (e.g. FAC002)'
    },
    validationRules: {
      department_code: 'Required, must exist in registered departments',
      semester: 'Required integer between 1 and 8',
      section: 'Required section code',
      academic_year: 'Required format YYYY-YYYY',
      employee_code: 'Required, must exist in Faculty Master and belong to the same department. Exactly one active in-charge allowed per dept + sem + sec + academic_year.'
    }
  },

  // 7. HOD Assignment
  hod_assignment: {
    id: 'hod_assignment',
    title: 'HOD Assignment',
    category: 'academics',
    description: 'Appoint Department Heads, define effective appointment tenures, and grant departmental approval authority',
    headers: [
      'department_code',
      'employee_code',
      'effective_from',
      'effective_until',
      'remarks'
    ],
    requiredHeaders: ['department_code', 'employee_code', 'effective_from'],
    optionalHeaders: ['effective_until', 'remarks'],
    identifierField: 'employee_code',
    sampleRows: [
      {
        department_code: 'CSE',
        employee_code: 'FAC001',
        effective_from: '2026-07-01',
        effective_until: '2028-06-30',
        remarks: 'Official HOD appointment by Board of Governors'
      }
    ],
    fieldDescriptions: {
      department_code: 'Department code to lead (e.g. CSE)',
      employee_code: 'Faculty employee code appointed as HOD (e.g. FAC001)',
      effective_from: 'Tenure start date in YYYY-MM-DD format',
      effective_until: 'Optional tenure conclusion date in YYYY-MM-DD format',
      remarks: 'Appointment order reference or official notes'
    },
    validationRules: {
      department_code: 'Required, must exist in registered departments',
      employee_code: 'Required, must exist in Faculty Master and belong to this department',
      effective_from: 'Required valid ISO date (YYYY-MM-DD)',
      effective_until: 'Optional ISO date; must be after effective_from if specified. Existing faculty teaching role is strictly preserved.'
    }
  },

  // 8. Timetable Schedule
  timetable: {
    id: 'timetable',
    title: 'Timetable Schedule',
    category: 'academics',
    description: 'Weekly schedule slots, lecture hours, room codes, instructor allocation, and geofence verification coordinates',
    headers: [
      'department_code',
      'semester',
      'section',
      'day_of_week',
      'start_time',
      'end_time',
      'subject_code',
      'employee_code',
      'room_code',
      'room_lat',
      'room_long',
      'geofence_radius_meters',
      'academic_year'
    ],
    requiredHeaders: ['department_code', 'semester', 'section', 'day_of_week', 'start_time', 'end_time', 'subject_code', 'employee_code', 'room_code'],
    optionalHeaders: ['room_lat', 'room_long', 'geofence_radius_meters', 'academic_year'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        day_of_week: 'Monday',
        start_time: '09:30 AM',
        end_time: '10:20 AM',
        subject_code: 'CS-601',
        employee_code: 'FAC001',
        room_code: 'LH-301',
        room_lat: '32.2190',
        room_long: '76.3234',
        geofence_radius_meters: 30,
        academic_year: '2026-2027'
      },
      {
        department_code: 'CSE',
        semester: 6,
        section: 'A',
        day_of_week: 'Monday',
        start_time: '10:20 AM',
        end_time: '11:10 AM',
        subject_code: 'CS-602',
        employee_code: 'FAC002',
        room_code: 'LH-301',
        room_lat: '32.2190',
        room_long: '76.3234',
        geofence_radius_meters: 30,
        academic_year: '2026-2027'
      }
    ],
    fieldDescriptions: {
      department_code: 'Department code (e.g. CSE)',
      semester: 'Semester level (1 to 8)',
      section: 'Section (e.g. A, B)',
      day_of_week: 'Day of week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
      start_time: 'Class start time in 12-hr (09:30 AM) or 24-hr (09:30) format',
      end_time: 'Class end time in 12-hr (10:20 AM) or 24-hr (10:20) format',
      subject_code: 'Course code from Subjects Master (e.g. CS-601)',
      employee_code: 'Faculty employee code assigned to lecture (e.g. FAC001)',
      room_code: 'Classroom / Lecture Hall code (e.g. LH-301, LAB-02)',
      room_lat: 'Optional GPS latitude of classroom for geofenced attendance',
      room_long: 'Optional GPS longitude of classroom for geofenced attendance',
      geofence_radius_meters: 'Permitted attendance check-in radius (default 30m)',
      academic_year: 'Academic year (e.g. 2026-2027)'
    },
    validationRules: {
      subject_code: 'Required, must exist in Subjects Master',
      employee_code: 'Required, must exist in Faculty Master and have subject mapping',
      day_of_week: 'Monday | Tuesday | Wednesday | Thursday | Friday | Saturday',
      start_time: 'Valid time format; must be earlier than end_time',
      end_time: 'Valid time format; must be after start_time',
      room_code: 'Required non-empty room string',
      room_lat: 'Optional decimal between -90 and 90',
      room_long: 'Optional decimal between -180 and 180',
      geofence_radius_meters: 'Optional positive integer (default 30)',
      conflict_check: 'No instructor or room may be booked for overlapping time slots on the same day'
    }
  },

  // 9. Syllabus Outline
  syllabus: {
    id: 'syllabus',
    title: 'Syllabus Outline',
    category: 'curriculum',
    description: 'Unit-by-unit syllabus roadmap, topics covered, descriptions, and learning objectives',
    headers: [
      'subject_code',
      'unit_number',
      'topic_name',
      'topic_description',
      'academic_year'
    ],
    requiredHeaders: ['subject_code', 'unit_number', 'topic_name'],
    optionalHeaders: ['topic_description', 'academic_year'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        subject_code: 'CS-601',
        unit_number: 1,
        topic_name: 'Introduction to Compilers & Lexical Analysis',
        topic_description: 'Lexical analysis, regular expressions, finite automata, lex tool',
        academic_year: '2026-2027'
      },
      {
        subject_code: 'CS-601',
        unit_number: 2,
        topic_name: 'Syntax Analysis & Parsing Techniques',
        topic_description: 'Context-free grammars, LL(1) parsers, LR parsers, YACC tool',
        academic_year: '2026-2027'
      }
    ],
    fieldDescriptions: {
      subject_code: 'Course code from Subjects Master (e.g. CS-601)',
      unit_number: 'Curriculum unit sequence number (1 to 6)',
      topic_name: 'Official syllabus topic title',
      topic_description: 'Detailed topic concepts and scope',
      academic_year: 'Academic session (e.g. 2026-2027)'
    },
    validationRules: {
      subject_code: 'Required, must exist in Subjects Master',
      unit_number: 'Required positive integer between 1 and 8',
      topic_name: 'Required non-empty string',
      academic_year: 'Optional format YYYY-YYYY'
    }
  },

  // 10. Historical Sessional Marks
  sessional_marks: {
    id: 'sessional_marks',
    title: 'Historical Sessional Marks',
    category: 'records',
    description: 'Mid-term, sessional, and internal assessment test scorecards',
    headers: [
      'roll_no',
      'subject_code',
      'assessment_name',
      'assessment_type',
      'obtained_marks',
      'max_marks',
      'academic_year'
    ],
    requiredHeaders: ['roll_no', 'subject_code', 'assessment_name', 'obtained_marks', 'max_marks'],
    optionalHeaders: ['assessment_type', 'academic_year'],
    identifierField: 'roll_no',
    sampleRows: [
      {
        roll_no: 'CSE001',
        subject_code: 'CS-601',
        assessment_name: 'Sessional 1',
        assessment_type: 'Mid-Term',
        obtained_marks: 26,
        max_marks: 30,
        academic_year: '2026-2027'
      },
      {
        roll_no: 'CSE002',
        subject_code: 'CS-601',
        assessment_name: 'Sessional 1',
        assessment_type: 'Mid-Term',
        obtained_marks: 24,
        max_marks: 30,
        academic_year: '2026-2027'
      }
    ],
    fieldDescriptions: {
      roll_no: 'Student roll number from Student Master',
      subject_code: 'Course code from Subjects Master',
      assessment_name: 'Evaluation title (e.g. Sessional 1, Quiz 2, Mid-Term)',
      assessment_type: 'Test classification (Mid-Term, Assignment, Practical)',
      obtained_marks: 'Score achieved by the student (numeric)',
      max_marks: 'Maximum possible marks (numeric > 0)',
      academic_year: 'Academic session (e.g. 2026-2027)'
    },
    validationRules: {
      roll_no: 'Required, must exist in Student Master',
      subject_code: 'Required, must exist in Subjects Master',
      obtained_marks: 'Required numeric value between 0 and max_marks',
      max_marks: 'Required positive number > 0. obtained_marks cannot exceed max_marks.'
    }
  },

  // 11. Historical Results & Grades
  results_grades: {
    id: 'results_grades',
    title: 'Historical Results & CGPA',
    category: 'records',
    description: 'End-semester examination grade reports, SGPA, CGPA standings, and university results',
    headers: [
      'roll_no',
      'semester',
      'sgpa',
      'cgpa',
      'result_status',
      'academic_year'
    ],
    requiredHeaders: ['roll_no', 'semester', 'sgpa', 'cgpa'],
    optionalHeaders: ['result_status', 'academic_year'],
    identifierField: 'roll_no',
    sampleRows: [
      {
        roll_no: 'CSE001',
        semester: 5,
        sgpa: 8.85,
        cgpa: 8.62,
        result_status: 'Pass',
        academic_year: '2025-2026'
      },
      {
        roll_no: 'CSE002',
        semester: 5,
        sgpa: 7.90,
        cgpa: 7.84,
        result_status: 'Pass',
        academic_year: '2025-2026'
      }
    ],
    fieldDescriptions: {
      roll_no: 'Student roll number from Student Master',
      semester: 'Examined semester level (1 to 8)',
      sgpa: 'Semester Grade Point Average (0.00 to 10.00)',
      cgpa: 'Cumulative Grade Point Average (0.00 to 10.00)',
      result_status: 'Final status: Pass, Fail, Re-appear, Withheld',
      academic_year: 'Academic session (e.g. 2025-2026)'
    },
    validationRules: {
      roll_no: 'Required, must exist in Student Master',
      semester: 'Required integer between 1 and 8',
      sgpa: 'Required decimal between 0.00 and 10.00',
      cgpa: 'Required decimal between 0.00 and 10.00'
    }
  },

  // 12. Historical Attendance Records
  attendance: {
    id: 'attendance',
    title: 'Historical Attendance Records',
    category: 'records',
    description: 'Prior attendance sheets, session attendances, present/absent logs',
    headers: [
      'roll_no',
      'subject_code',
      'date',
      'status',
      'session_type',
      'academic_year'
    ],
    requiredHeaders: ['roll_no', 'subject_code', 'date', 'status'],
    optionalHeaders: ['session_type', 'academic_year'],
    identifierField: 'roll_no',
    sampleRows: [
      {
        roll_no: 'CSE001',
        subject_code: 'CS-601',
        date: '2026-09-01',
        status: 'Present',
        session_type: 'Lecture',
        academic_year: '2026-2027'
      },
      {
        roll_no: 'CSE002',
        subject_code: 'CS-601',
        date: '2026-09-01',
        status: 'Absent',
        session_type: 'Lecture',
        academic_year: '2026-2027'
      }
    ],
    fieldDescriptions: {
      roll_no: 'Student roll number from Student Master',
      subject_code: 'Course code from Subjects Master',
      date: 'Date of lecture in YYYY-MM-DD format',
      status: 'Attendance state: Present, Absent, Late',
      session_type: 'Lecture, Lab, Tutorial, Extra Class',
      academic_year: 'Academic year (e.g. 2026-2027)'
    },
    validationRules: {
      roll_no: 'Required, must exist in Student Master',
      subject_code: 'Required, must exist in Subjects Master',
      date: 'Required valid date format (YYYY-MM-DD)',
      status: 'Present | Absent | Late'
    }
  },

  // 13. College Calendar
  calendar: {
    id: 'calendar',
    title: 'College Calendar & Holidays',
    category: 'curriculum',
    description: 'Institutional academic calendar, mid-term exam dates, semester breaks, holidays, and campus events',
    headers: [
      'event_title',
      'event_type',
      'start_date',
      'end_date',
      'description',
      'academic_year',
      'is_holiday'
    ],
    requiredHeaders: ['event_title', 'event_type', 'start_date', 'end_date'],
    optionalHeaders: ['description', 'academic_year', 'is_holiday'],
    identifierField: 'event_title',
    sampleRows: [
      {
        event_title: 'Commencement of Even Semester 2026',
        event_type: 'Academic',
        start_date: '2026-08-01',
        end_date: '2026-08-01',
        description: 'First instructional day for 2nd, 4th, 6th, and 8th semester students',
        academic_year: '2026-2027',
        is_holiday: 'false'
      },
      {
        event_title: 'Gandhi Jayanti',
        event_type: 'Holiday',
        start_date: '2026-10-02',
        end_date: '2026-10-02',
        description: 'National holiday in honor of Mahatma Gandhi',
        academic_year: '2026-2027',
        is_holiday: 'true'
      }
    ],
    fieldDescriptions: {
      event_title: 'Title of academic event or holiday',
      event_type: 'Category: Academic, Exam, Holiday, Sports, Cultural',
      start_date: 'Event starting date in YYYY-MM-DD format',
      end_date: 'Event conclusion date in YYYY-MM-DD format',
      description: 'Event briefing or official notes',
      academic_year: 'Academic session (e.g. 2026-2027)',
      is_holiday: 'Whether institute is closed (true / false)'
    },
    validationRules: {
      event_title: 'Required non-empty string',
      event_type: 'Academic | Exam | Holiday | Sports | Cultural',
      start_date: 'Required ISO date format (YYYY-MM-DD)',
      end_date: 'Required ISO date format (YYYY-MM-DD); cannot precede start_date',
      is_holiday: 'Optional boolean (defaults to false)'
    }
  },

  // 14. Notices & Announcements
  notices: {
    id: 'notices',
    title: 'Notices & Announcements',
    category: 'curriculum',
    description: 'Official administrative notices, circulars, exam notifications, and department directives',
    headers: [
      'title',
      'content',
      'priority',
      'audience',
      'department_code',
      'published_date'
    ],
    requiredHeaders: ['title', 'content', 'priority', 'audience'],
    optionalHeaders: ['department_code', 'published_date'],
    identifierField: 'title',
    sampleRows: [
      {
        title: 'Submission of Even Semester Exam Forms 2026',
        content: 'All eligible students must submit university examination registration forms before October 25, 2026.',
        priority: 'Important',
        audience: 'All',
        department_code: 'ALL',
        published_date: '2026-10-01'
      }
    ],
    fieldDescriptions: {
      title: 'Notice headline title',
      content: 'Full official text circular content',
      priority: 'Notice urgency: Normal, Important, Urgent',
      audience: 'Target group: All, Students, Faculty, HODs',
      department_code: 'Specific department (e.g. CSE) or ALL',
      published_date: 'Date circular issued (YYYY-MM-DD)'
    },
    validationRules: {
      title: 'Required non-empty string',
      content: 'Required non-empty string',
      priority: 'Normal | Important | Urgent',
      audience: 'All | Students | Faculty | HODs'
    }
  },

  // 15. Previous Year Questions (PYQs)
  pyqs: {
    id: 'pyqs',
    title: 'Previous Year Questions (PYQs)',
    category: 'curriculum',
    description: 'Past university examination question papers, session years, exam types, and download URLs',
    headers: [
      'subject_code',
      'semester',
      'year',
      'exam_type',
      'title',
      'file_url',
      'academic_year'
    ],
    requiredHeaders: ['subject_code', 'semester', 'year', 'exam_type', 'title', 'file_url'],
    optionalHeaders: ['academic_year'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        subject_code: 'CS-601',
        semester: 6,
        year: 2025,
        exam_type: 'End Sem',
        title: 'CS-601 Compiler Design End Semester Exam 2025',
        file_url: 'https://hiet.ac.in/pyqs/cs-601-2025.pdf',
        academic_year: '2025-2026'
      }
    ],
    fieldDescriptions: {
      subject_code: 'Course code from Subjects Master (e.g. CS-601)',
      semester: 'Semester level (1 to 8)',
      year: 'Year paper was administered (e.g. 2025)',
      exam_type: 'Exam category: End Sem, Mid Sem, Sessional',
      title: 'Descriptive title of question paper',
      file_url: 'URL link to paper document or PDF',
      academic_year: 'Academic session (e.g. 2025-2026)'
    },
    validationRules: {
      subject_code: 'Required, must exist in Subjects Master',
      semester: 'Required integer between 1 and 8',
      year: 'Required integer year (e.g. 2020-2026)',
      file_url: 'Required URL link'
    }
  },

  // 16. User Account Invitations
  user_invitations: {
    id: 'user_invitations',
    title: 'User Account Invitations',
    category: 'system',
    description: 'Batch onboard official accounts for already-imported students and faculty via secure email invitations. No plaintext passwords.',
    headers: [
      'role',
      'identifier',
      'full_name',
      'email',
      'department_code'
    ],
    requiredHeaders: ['role', 'identifier', 'email'],
    optionalHeaders: ['full_name', 'department_code'],
    identifierField: 'email',
    sampleRows: [
      {
        role: 'student',
        identifier: 'CSE001',
        full_name: 'Aarav Sharma',
        email: 'aarav.sharma@hiet.ac.in',
        department_code: 'CSE'
      },
      {
        role: 'faculty',
        identifier: 'FAC001',
        full_name: 'Er. Anuj Sharma',
        email: 'anuj.sharma@hiet.ac.in',
        department_code: 'CSE'
      }
    ],
    fieldDescriptions: {
      role: 'User role type: student, faculty, hod, principal',
      identifier: 'Student Roll No (e.g. CSE001) or Faculty Employee Code (e.g. FAC001)',
      full_name: 'Official legal full name of recipient',
      email: 'Official email where secure activation link will be delivered',
      department_code: 'Associated academic department code'
    },
    validationRules: {
      role: 'student | faculty | hod | principal',
      identifier: 'Must correspond to an existing record in Student Master or Faculty Master',
      email: 'Required valid email address. Plaintext passwords must NEVER be provided.'
    }
  }
};

/**
 * Downloads a pre-formatted template with headers and example rows in CSV or XLSX format
 */
export const downloadImportTemplate = (entityType: ImportEntityType, format: 'csv' | 'xlsx'): void => {
  const config = IMPORT_MODULE_CONFIGS[entityType];
  if (!config) return;

  const filename = `HIET_${config.id}_Template.${format}`;
  const worksheet = XLSX.utils.json_to_sheet(config.sampleRows, { header: config.headers });
  
  // Format column widths nicely
  const colWidths = config.headers.map(h => ({ wch: Math.max(h.length + 4, 18) }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, config.title.slice(0, 31));

  XLSX.writeFile(workbook, filename, { bookType: format });
};

/**
 * Downloads a structured CSV report of rows that failed validation during the import
 */
export const downloadFailedRowsCsv = (
  errors: Array<{
    rowNumber: number;
    identifier?: string;
    field?: string;
    column?: string;
    invalidValue?: string;
    reason?: string;
    suggestedCorrection?: string;
    error: string;
    rawData?: any;
  }>,
  entityName: string
): void => {
  if (errors.length === 0) return;

  const reportRows = errors.map(err => ({
    row_number: err.rowNumber,
    record_identifier: err.identifier || 'N/A',
    column: err.column || err.field || 'General',
    invalid_value: err.invalidValue || '',
    error_reason: err.reason || err.error,
    suggested_correction: err.suggestedCorrection || '',
    submitted_data: err.rawData ? JSON.stringify(err.rawData) : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(reportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Error_Report');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  XLSX.writeFile(workbook, `HIET_${entityName}_Validation_Errors_${timestamp}.csv`, { bookType: 'csv' });
};
