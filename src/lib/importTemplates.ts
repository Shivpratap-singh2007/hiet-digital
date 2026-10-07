import * as XLSX from 'xlsx';
import { ImportEntityType } from '../types';

export interface EntityModuleConfig {
  id: ImportEntityType;
  title: string;
  category: 'core' | 'academics' | 'records' | 'curriculum';
  description: string;
  headers: string[];
  requiredHeaders: string[];
  sampleRows: Record<string, any>[];
  fieldDescriptions: Record<string, string>;
  identifierField: string;
}

export const IMPORT_MODULE_CONFIGS: Record<ImportEntityType, EntityModuleConfig> = {
  students: {
    id: 'students',
    title: 'Students Master',
    category: 'core',
    description: 'Enrolled student records, roll numbers, branches, semesters, sections, and contact info',
    headers: [
      'roll_no',
      'student_id',
      'full_name',
      'email',
      'branch',
      'department',
      'semester',
      'section',
      'academic_year',
      'phone',
      'status'
    ],
    requiredHeaders: ['roll_no', 'full_name', 'email', 'branch', 'department', 'semester'],
    identifierField: 'roll_no',
    sampleRows: [
      {
        roll_no: 'CSE001',
        student_id: 'STU-2026-001',
        full_name: 'Aarav Sharma',
        email: 'aarav.sharma@hiet.ac.in',
        branch: 'CSE',
        department: 'CSE',
        semester: 6,
        section: 'A',
        academic_year: '2026-2027',
        phone: '9876543210',
        status: 'active'
      },
      {
        roll_no: 'CSE002',
        student_id: 'STU-2026-002',
        full_name: 'Aditya Verma',
        email: 'aditya.verma@hiet.ac.in',
        branch: 'CSE',
        department: 'CSE',
        semester: 6,
        section: 'B',
        academic_year: '2026-2027',
        phone: '9876543211',
        status: 'active'
      }
    ],
    fieldDescriptions: {
      roll_no: 'Unique college roll number (e.g. CSE001, 210106)',
      student_id: 'Optional institutional student ID / registration code',
      full_name: 'Student full legal name',
      email: 'Official or personal student email address',
      branch: 'Academic branch code (e.g. CSE, CSE AI/ML, ECE, ME, CE)',
      department: 'Academic department code (e.g. CSE, ECE, ME, CE, AS&H)',
      semester: 'Current semester number (1 to 8)',
      section: 'Class section (e.g. A, B)',
      academic_year: 'Enrollment academic session (e.g. 2026-2027)',
      phone: 'Contact phone number (10 digits)',
      status: 'Enrollment status: active, disabled, graduated, suspended'
    }
  },

  faculty: {
    id: 'faculty',
    title: 'Faculty & Teachers',
    category: 'core',
    description: 'Faculty directory, designated roles (teacher / hod), departments, and official emails',
    headers: [
      'faculty_id',
      'full_name',
      'email',
      'department',
      'branch',
      'designation',
      'role',
      'status'
    ],
    requiredHeaders: ['faculty_id', 'full_name', 'email', 'department', 'designation', 'role'],
    identifierField: 'faculty_id',
    sampleRows: [
      {
        faculty_id: 'FAC005',
        full_name: 'Dr. Neeraj Sharma',
        email: 'neeraj.sharma@hiet.ac.in',
        department: 'CSE',
        branch: 'CSE',
        designation: 'Assistant Professor',
        role: 'teacher',
        status: 'active'
      },
      {
        faculty_id: 'FAC006',
        full_name: 'Dr. Meenakshi Katoch',
        email: 'meenakshi.katoch@hiet.ac.in',
        department: 'ECE',
        branch: 'ECE',
        designation: 'Associate Professor',
        role: 'hod',
        status: 'active'
      }
    ],
    fieldDescriptions: {
      faculty_id: 'Unique faculty employee ID (e.g. FAC001, FAC-CSE-01)',
      full_name: 'Faculty member full name with title',
      email: 'Official college email address',
      department: 'Department code (e.g. CSE, ECE, ME, CE, AS&H)',
      branch: 'Primary associated branch (e.g. CSE, ECE)',
      designation: 'Title (e.g. Professor, Assistant Professor, HOD)',
      role: 'System role: strictly teacher or hod (Admin/Principal cannot be assigned via CSV)',
      status: 'Status: active, inactive, disabled, on_leave, resigned'
    }
  },

  departments_branches: {
    id: 'departments_branches',
    title: 'Departments & Branches',
    category: 'core',
    description: 'Academic departments, branch names, unique program codes, and activation statuses',
    headers: [
      'department_code',
      'department_name',
      'branch_code',
      'branch_name',
      'status'
    ],
    requiredHeaders: ['department_code', 'department_name', 'branch_code', 'branch_name'],
    identifierField: 'branch_code',
    sampleRows: [
      {
        department_code: 'CSE',
        department_name: 'Computer Science & Engineering',
        branch_code: 'CSE',
        branch_name: 'B.Tech Computer Science & Engineering',
        status: 'active'
      },
      {
        department_code: 'CSE',
        department_name: 'Computer Science & Engineering',
        branch_code: 'CSE AI/ML',
        branch_name: 'B.Tech CSE (Artificial Intelligence & Machine Learning)',
        status: 'active'
      },
      {
        department_code: 'ECE',
        department_name: 'Electronics & Communication Engineering',
        branch_code: 'ECE',
        branch_name: 'B.Tech Electronics & Communication Engineering',
        status: 'active'
      }
    ],
    fieldDescriptions: {
      department_code: 'Unique code for academic department (e.g. CSE, ECE, ME, CE, AS&H)',
      department_name: 'Full title of the department',
      branch_code: 'Unique code for degree course branch (e.g. CSE, CSE AI/ML, ECE)',
      branch_name: 'Official title of the engineering degree program',
      status: 'Status: active or inactive'
    }
  },

  subjects: {
    id: 'subjects',
    title: 'Subjects & Courses',
    category: 'academics',
    description: 'Curriculum subjects, codes, semester allocation, credits, type, and primary teacher assignment',
    headers: [
      'subject_code',
      'subject_name',
      'department',
      'branch',
      'semester',
      'credits',
      'subject_type',
      'teacher_faculty_id',
      'status'
    ],
    requiredHeaders: ['subject_code', 'subject_name', 'department', 'branch', 'semester'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        subject_code: 'CS-601',
        subject_name: 'Applied Mathematics-III',
        department: 'CSE',
        branch: 'CSE',
        semester: 6,
        credits: 4,
        subject_type: 'theory',
        teacher_faculty_id: 'FAC001',
        status: 'active'
      },
      {
        subject_code: 'CS-606',
        subject_name: 'Computer Networks Lab',
        department: 'CSE',
        branch: 'CSE',
        semester: 6,
        credits: 2,
        subject_type: 'lab',
        teacher_faculty_id: 'FAC002',
        status: 'active'
      }
    ],
    fieldDescriptions: {
      subject_code: 'Unique syllabus course code (e.g. CS-601, EC-402)',
      subject_name: 'Complete subject title',
      department: 'Department offering the course (e.g. CSE)',
      branch: 'Associated branch program (e.g. CSE)',
      semester: 'Semester in which subject is taught (1 to 8)',
      credits: 'Credit weightage (e.g. 4.0, 3.0, 2.0)',
      subject_type: 'Course category: theory, practical, elective, lab',
      teacher_faculty_id: 'Optional Faculty ID of assigned teacher (must exist in Faculty Master)',
      status: 'Status: active or inactive'
    }
  },

  teacher_subjects: {
    id: 'teacher_subjects',
    title: 'Teacher-Subject Mapping',
    category: 'academics',
    description: 'Faculty allocations to specific subject codes, academic sessions, semesters, and sections',
    headers: [
      'faculty_id',
      'subject_code',
      'academic_year',
      'semester',
      'section',
      'status'
    ],
    requiredHeaders: ['faculty_id', 'subject_code', 'academic_year', 'semester', 'section'],
    identifierField: 'faculty_id',
    sampleRows: [
      {
        faculty_id: 'FAC001',
        subject_code: 'CS-601',
        academic_year: '2026-2027',
        semester: 6,
        section: 'A',
        status: 'active'
      },
      {
        faculty_id: 'FAC002',
        subject_code: 'CS-602',
        academic_year: '2026-2027',
        semester: 6,
        section: 'A',
        status: 'active'
      }
    ],
    fieldDescriptions: {
      faculty_id: 'Valid Faculty ID from Faculty Master (e.g. FAC001)',
      subject_code: 'Valid Subject Code from Subjects Master (e.g. CS-601)',
      academic_year: 'Session year (e.g. 2026-2027)',
      semester: 'Semester number (1 to 8)',
      section: 'Target class section (e.g. A, B)',
      status: 'Allocation status: active or inactive'
    }
  },

  timetable: {
    id: 'timetable',
    title: 'College Timetable',
    category: 'academics',
    description: 'Weekly schedule slots, period timings, room allocations, section and faculty conflict checks',
    headers: [
      'branch',
      'semester',
      'section',
      'day',
      'period',
      'start_time',
      'end_time',
      'subject_code',
      'faculty_id',
      'room'
    ],
    requiredHeaders: ['branch', 'semester', 'section', 'day', 'start_time', 'end_time', 'subject_code', 'faculty_id', 'room'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        branch: 'CSE',
        semester: 6,
        section: 'A',
        day: 'Monday',
        period: 1,
        start_time: '09:30 AM',
        end_time: '10:25 AM',
        subject_code: 'CS-601',
        faculty_id: 'FAC001',
        room: 'LH-101'
      },
      {
        branch: 'CSE',
        semester: 6,
        section: 'A',
        day: 'Monday',
        period: 2,
        start_time: '10:25 AM',
        end_time: '11:20 AM',
        subject_code: 'CS-602',
        faculty_id: 'FAC002',
        room: 'LH-101'
      }
    ],
    fieldDescriptions: {
      branch: 'Branch program (e.g. CSE)',
      semester: 'Semester (1 to 8)',
      section: 'Section (e.g. A, B)',
      day: 'Day of week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
      period: 'Optional period sequence number (1, 2, 3...)',
      start_time: 'Start time format (e.g. 09:30 AM or 09:30)',
      end_time: 'End time format (e.g. 10:25 AM or 10:25)',
      subject_code: 'Valid Subject Code from Subjects Master',
      faculty_id: 'Valid Faculty ID from Faculty Master (Checked for schedule conflicts)',
      room: 'Classroom / Lecture Hall / Lab room number (e.g. LH-101, LAB-3)'
    }
  },

  attendance: {
    id: 'attendance',
    title: 'Daily Attendance',
    category: 'records',
    description: 'Student subject-wise attendance logs, presence tracking, and duplicate day verification',
    headers: [
      'roll_no',
      'subject_code',
      'date',
      'status'
    ],
    requiredHeaders: ['roll_no', 'subject_code', 'date', 'status'],
    identifierField: 'roll_no',
    sampleRows: [
      {
        roll_no: 'CSE001',
        subject_code: 'CS-601',
        date: '2026-09-28',
        status: 'present'
      },
      {
        roll_no: 'CSE002',
        subject_code: 'CS-601',
        date: '2026-09-28',
        status: 'absent'
      }
    ],
    fieldDescriptions: {
      roll_no: 'Valid student roll number enrolled in matching branch/semester',
      subject_code: 'Valid subject code',
      date: 'Attendance date in YYYY-MM-DD format (e.g. 2026-09-28)',
      status: 'Attendance state: present, absent, late, leave (or excused)'
    }
  },

  sessional_marks: {
    id: 'sessional_marks',
    title: 'Sessional / Internal Marks',
    category: 'records',
    description: 'Internal examinations, sessional test scores, max marks bounds checking, and academic year records',
    headers: [
      'roll_no',
      'subject_code',
      'exam_type',
      'exam_name',
      'marks_obtained',
      'max_marks',
      'academic_year',
      'semester'
    ],
    requiredHeaders: ['roll_no', 'subject_code', 'exam_type', 'marks_obtained', 'max_marks', 'semester'],
    identifierField: 'roll_no',
    sampleRows: [
      {
        roll_no: 'CSE001',
        subject_code: 'CS-601',
        exam_type: 'Sessional 1',
        exam_name: 'Mid Term Test 1',
        marks_obtained: 22.5,
        max_marks: 25,
        academic_year: '2026-2027',
        semester: 6
      },
      {
        roll_no: 'CSE002',
        subject_code: 'CS-601',
        exam_type: 'Sessional 1',
        exam_name: 'Mid Term Test 1',
        marks_obtained: 19.0,
        max_marks: 25,
        academic_year: '2026-2027',
        semester: 6
      }
    ],
    fieldDescriptions: {
      roll_no: 'Valid student roll number',
      subject_code: 'Valid subject code',
      exam_type: 'Exam category: Sessional 1, Sessional 2, Class Test',
      exam_name: 'Descriptive test name',
      marks_obtained: 'Marks scored (must be >= 0 and <= max_marks)',
      max_marks: 'Maximum total marks (e.g. 25, 20, 50, 100)',
      academic_year: 'Academic session (e.g. 2026-2027)',
      semester: 'Semester number (1 to 8)'
    }
  },

  results_grades: {
    id: 'results_grades',
    title: 'Results / End-Sem Grades',
    category: 'records',
    description: 'Semester university exam results, SGPA/CGPA grade points, letter grades, and credits earned',
    headers: [
      'roll_no',
      'semester',
      'subject_code',
      'grade',
      'grade_point',
      'credits',
      'academic_year'
    ],
    requiredHeaders: ['roll_no', 'semester', 'subject_code', 'grade', 'grade_point', 'credits'],
    identifierField: 'roll_no',
    sampleRows: [
      {
        roll_no: 'CSE001',
        semester: 6,
        subject_code: 'CS-601',
        grade: 'A+',
        grade_point: 10,
        credits: 4,
        academic_year: '2026-2027'
      },
      {
        roll_no: 'CSE001',
        semester: 6,
        subject_code: 'CS-602',
        grade: 'A',
        grade_point: 9,
        credits: 4,
        academic_year: '2026-2027'
      }
    ],
    fieldDescriptions: {
      roll_no: 'Valid student roll number',
      semester: 'Exam semester (1 to 8)',
      subject_code: 'Valid subject code',
      grade: 'Letter grade: O, A+, A, B+, B, C, P, F',
      grade_point: 'Numeric grade points (0.0 to 10.0)',
      credits: 'Course credits earned (e.g. 4.0)',
      academic_year: 'Academic year (e.g. 2026-2027)'
    }
  },

  syllabus: {
    id: 'syllabus',
    title: 'Course Syllabus',
    category: 'curriculum',
    description: 'Official university syllabus records, course objectives, academic session links, and document URLs',
    headers: [
      'branch',
      'semester',
      'subject_code',
      'title',
      'description',
      'academic_year',
      'document_url'
    ],
    requiredHeaders: ['branch', 'semester', 'subject_code', 'title', 'document_url'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        branch: 'CSE',
        semester: 6,
        subject_code: 'CS-601',
        title: 'Applied Mathematics-III Official Syllabus',
        description: 'Complete unit-wise syllabus covering transforms, probability and numerical methods',
        academic_year: '2026-2027',
        document_url: 'https://hiet.ac.in/syllabus/cs-601-syllabus.pdf'
      }
    ],
    fieldDescriptions: {
      branch: 'Branch program (e.g. CSE)',
      semester: 'Semester (1 to 8)',
      subject_code: 'Valid subject code from subjects master',
      title: 'Descriptive title of syllabus document',
      description: 'Overview / notes / unit summary',
      academic_year: 'Academic year (e.g. 2026-2027)',
      document_url: 'Public or secure URL to PDF/document'
    }
  },

  pyqs: {
    id: 'pyqs',
    title: 'Previous Year Questions (PYQs)',
    category: 'curriculum',
    description: 'Past university examination question papers, session years, exam types, and download URLs',
    headers: [
      'branch',
      'semester',
      'subject_code',
      'year',
      'exam_type',
      'title',
      'document_url',
      'description'
    ],
    requiredHeaders: ['branch', 'semester', 'subject_code', 'year', 'exam_type', 'title', 'document_url'],
    identifierField: 'subject_code',
    sampleRows: [
      {
        branch: 'CSE',
        semester: 6,
        subject_code: 'CS-601',
        year: 2025,
        exam_type: 'End Sem',
        title: 'CS-601 Applied Mathematics End Semester Paper 2025',
        document_url: 'https://hiet.ac.in/pyqs/cs-601-2025.pdf',
        description: 'HIET University final examination question paper'
      }
    ],
    fieldDescriptions: {
      branch: 'Branch program (e.g. CSE)',
      semester: 'Semester (1 to 8)',
      subject_code: 'Valid subject code from subjects master',
      year: 'Examination year (e.g. 2023, 2024, 2025)',
      exam_type: 'Exam category: End Sem, Mid Sem, Sessional',
      title: 'Title of the question paper',
      document_url: 'Link to question paper PDF',
      description: 'Optional paper remarks'
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
  const colWidths = config.headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));
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
    error: string;
    rawData?: any;
  }>,
  entityName: string
): void => {
  if (errors.length === 0) return;

  const reportRows = errors.map(err => ({
    row_number: err.rowNumber,
    record_identifier: err.identifier || 'N/A',
    column_field: err.field || 'General',
    error_reason: err.error,
    submitted_data: err.rawData ? JSON.stringify(err.rawData) : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(reportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Error_Report');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  XLSX.writeFile(workbook, `HIET_${entityName}_Import_Errors_${timestamp}.csv`, { bookType: 'csv' });
};

/**
 * Returns CSV string content for a given template configuration
 */
export const generateTemplateCsv = (config: any): string => {
  const ws = XLSX.utils.json_to_sheet(config.sampleRows, { header: config.headers });
  return XLSX.utils.sheet_to_csv(ws);
};

/**
 * Returns CSV string content for failed rows error report
 */
export const generateFailedRowsCsv = (
  errors: Array<{
    rowNumber: number;
    identifier?: string;
    column?: string;
    field?: string;
    message?: string;
    error?: string;
  }>
): string => {
  const reportRows = errors.map(err => ({
    row_number: err.rowNumber,
    identifier: err.identifier || 'N/A',
    column_name: err.column || err.field || 'general',
    error_message: err.message || err.error || ''
  }));
  const ws = XLSX.utils.json_to_sheet(reportRows);
  return XLSX.utils.sheet_to_csv(ws);
};

