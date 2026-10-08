// HIET College Help Desk - General Utility Functions
export { formatIndiaDateTime, formatIndiaDate, formatIndiaTime, formatDateTime, formatDate } from './dateTime';

export function calculateAttendanceStats(records: { status: string }[]) {
  const total = records.length;
  if (total === 0) return { total: 0, present: 0, absent: 0, late: 0, percentage: 100, isWarning: false };
  
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const late = records.filter(r => r.status === 'Late').length;
  
  // Late counts as 0.5 present in standard college calculations
  const effectivePresent = present + (late * 0.5);
  const percentage = Math.round((effectivePresent / total) * 100);
  
  return {
    total,
    present,
    absent,
    late,
    percentage,
    isWarning: percentage < 75 // Mandatory HIET < 75% warning flag
  };
}

// Case and spacing normalization for faculty verification
export function normalizeFacultyId(id: string): string {
  return (id || '').trim().toUpperCase();
}

export function normalizeName(name: string): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
}

// CSV Parser for Master Data Imports
export interface CsvParseResult<T> {
  valid: T[];
  duplicates: T[];
  errors: { row: number; reason: string; raw: string }[];
  total: number;
}

export function parseStudentCsv(csvText: string, existingRolls: Set<string>): CsvParseResult<{
  roll_no: string;
  name: string;
  course: string;
  branch: string;
  semester: number;
  section: string;
  college_email: string;
  phone: string;
}> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    return { valid: [], duplicates: [], errors: [{ row: 1, reason: 'Empty CSV or header only', raw: '' }], total: 0 };
  }

  // Header check
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredCols = ['roll_no', 'name', 'course', 'branch', 'semester', 'section'];
  const hasHeaders = requiredCols.every(col => header.includes(col));

  const valid: any[] = [];
  const duplicates: any[] = [];
  const errors: { row: number; reason: string; raw: string }[] = [];
  const seenInBatch = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const parts = raw.split(',').map(p => p.trim());
    
    if (parts.length < 6) {
      errors.push({ row: i + 1, reason: 'Insufficient columns (expected 8 columns)', raw });
      continue;
    }

    const roll_no = parts[0];
    const name = parts[1];
    const course = parts[2];
    const branch = parts[3].toUpperCase();
    const semester = parseInt(parts[4], 10);
    const section = parts[5];
    const college_email = parts[6] 
      ? parts[6].trim().toLowerCase().replace(/^["'`]+|["'`]+$/g, '')
      : `${roll_no.toLowerCase()}@hiet.ac.in`;
    const phone = parts[7] || '';

    if (!roll_no || !name) {
      errors.push({ row: i + 1, reason: 'Roll No and Name are mandatory', raw });
      continue;
    }

    if (isNaN(semester) || semester < 1 || semester > 8) {
      errors.push({ row: i + 1, reason: `Invalid semester: ${parts[4]} (must be 1-8)`, raw });
      continue;
    }

    const cleanRoll = roll_no.toUpperCase();
    if (existingRolls.has(cleanRoll) || seenInBatch.has(cleanRoll)) {
      duplicates.push({ roll_no, name, course, branch, semester, section, college_email, phone });
      continue;
    }

    seenInBatch.add(cleanRoll);
    valid.push({
      roll_no,
      name,
      course,
      branch,
      semester,
      section,
      college_email,
      phone
    });
  }

  return {
    valid,
    duplicates,
    errors,
    total: lines.length - 1
  };
}

export function parseTeacherCsv(csvText: string, existingIds: Set<string>): CsvParseResult<{
  faculty_id: string;
  name: string;
  department: string;
  designation: string;
  college_email: string;
  phone: string;
}> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    return { valid: [], duplicates: [], errors: [{ row: 1, reason: 'Empty CSV or header only', raw: '' }], total: 0 };
  }

  const valid: any[] = [];
  const duplicates: any[] = [];
  const errors: { row: number; reason: string; raw: string }[] = [];
  const seenInBatch = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const parts = raw.split(',').map(p => p.trim());
    if (parts.length < 5) {
      errors.push({ row: i + 1, reason: 'Insufficient columns (expected 6 columns)', raw });
      continue;
    }

    const faculty_id = parts[0];
    const name = parts[1];
    const department = parts[2].toUpperCase();
    const designation = parts[3];
    const college_email = parts[4];
    const phone = parts[5] || '';

    if (!faculty_id || !name || !college_email) {
      errors.push({ row: i + 1, reason: 'Faculty ID, Name, and Email are mandatory', raw });
      continue;
    }

    const cleanId = faculty_id.toUpperCase();
    if (existingIds.has(cleanId) || seenInBatch.has(cleanId)) {
      duplicates.push({ faculty_id, name, department, designation, college_email, phone });
      continue;
    }

    seenInBatch.add(cleanId);
    valid.push({
      faculty_id,
      name,
      department,
      designation,
      college_email,
      phone
    });
  }

  return {
    valid,
    duplicates,
    errors,
    total: lines.length - 1
  };
}
