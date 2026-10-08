import { ImportEntityType } from '../types';
import { IMPORT_MODULE_CONFIGS } from './importTemplates';

export interface RowValidationError {
  rowNumber: number;
  column: string;
  message: string;
  invalidValue?: string;
  reason?: string;
  suggestedCorrection?: string;
}

export interface ValidatedRow {
  rowNumber: number;
  raw: Record<string, any>;
  data: Record<string, any>;
  errors: RowValidationError[];
  isDuplicate: boolean;
  duplicateReason?: string;
  status: 'valid' | 'invalid' | 'duplicate';
  targetTable: string;
}

export interface ValidationSummary {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  errors: RowValidationError[];
  rows: ValidatedRow[];
}

export interface ValidationMasterContext {
  studentsMap: Map<string, any>; // roll_no (uppercase) -> student
  facultyMap: Map<string, any>;  // employee_code / faculty_id (uppercase) -> faculty
  departmentsSet: Set<string>;  // department codes (uppercase)
  branchesSet: Set<string>;     // branch codes (uppercase)
  subjectsMap: Map<string, any>; // subject_code (uppercase) -> subject
  timetableSlots: Array<{
    id?: string;
    branch?: string;
    department?: string;
    semester: number;
    section: string;
    day: string;
    startMinutes: number;
    endMinutes: number;
    startTime: string;
    endTime: string;
    subjectCode: string;
    facultyId: string;
    room?: string;
    roomCode?: string;
  }>;
  attendanceSet: Set<string>; // roll_no + '|' + subject_code + '|' + date
  teacherSubjectSet: Set<string>; // faculty_id + '|' + subject_code + '|' + semester + '|' + section
  gradesSet: Set<string>; // roll_no + '|' + subject_code + '|' + semester
  classInchargeSet?: Set<string>; // dept + '|' + sem + '|' + sec + '|' + academic_year
  hodAssignmentsSet?: Set<string>; // dept + '|' + employee_code
  userEmailsSet?: Set<string>; // existing emails
}

/**
 * Creates a structured error object adhering to:
 * Row number, Column, Invalid value, Reason, Suggested correction
 */
export function createRowError(
  rowNumber: number,
  column: string,
  message: string,
  invalidValue: any,
  reason: string,
  suggestedCorrection: string
): RowValidationError {
  return {
    rowNumber,
    column,
    message,
    invalidValue: invalidValue === undefined || invalidValue === null ? '' : String(invalidValue),
    reason: reason || message,
    suggestedCorrection
  };
}

/**
 * Parses time string (e.g., "09:30 AM", "9:30 AM", "14:15", "02:15 PM") into minutes from midnight
 */
export function parseTimeToMinutes(timeStr: any): number | null {
  if (typeof timeStr !== 'string' && typeof timeStr !== 'number') return null;
  const str = String(timeStr).trim().toUpperCase();
  
  // Format: "HH:MM AM/PM" or "H:MM AM/PM"
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const min = parseInt(ampmMatch[2], 10);
    const modifier = ampmMatch[3];
    if (min < 0 || min > 59 || hour < 1 || hour > 12) return null;
    if (modifier === 'PM' && hour < 12) hour += 12;
    if (modifier === 'AM' && hour === 12) hour = 0;
    return hour * 60 + min;
  }

  // Format: "HH:MM" (24 hour)
  const h24Match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    const hour = parseInt(h24Match[1], 10);
    const min = parseInt(h24Match[2], 10);
    if (min < 0 || min > 59 || hour < 0 || hour > 23) return null;
    return hour * 60 + min;
  }

  return null;
}

export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;

/**
 * Main validator for a batch of raw records across all 16 modules
 */
export function validateImportBatch(
  entityType: ImportEntityType,
  rawRows: Record<string, any>[],
  ctx: ValidationMasterContext
): ValidationSummary {
  const config = IMPORT_MODULE_CONFIGS[entityType] || {
    id: entityType,
    requiredHeaders: []
  };
  const validatedRows: ValidatedRow[] = [];
  const allErrors: RowValidationError[] = [];

  // Track intra-file uniqueness keys
  const intraFileKeys = new Set<string>();
  const intraFileEmails = new Set<string>();
  const intraFileTimetableFaculty: Array<{ day: string; fid: string; start: number; end: number; row: number }> = [];
  const intraFileTimetableRoom: Array<{ day: string; room: string; start: number; end: number; row: number }> = [];

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 2; // 1-based accounting for header row
    const rowErrors: RowValidationError[] = [];
    const cleanData: Record<string, any> = {};

    // Normalize keys: trim & lowercase
    Object.keys(raw).forEach(k => {
      const cleanKey = k.trim().toLowerCase();
      let val = raw[k];
      if (typeof val === 'string') {
        val = val.trim();
      }
      cleanData[cleanKey] = val;
    });

    // Alias mapping for backward compatibility and diverse naming
    if (cleanData.roll_number && !cleanData.roll_no) cleanData.roll_no = cleanData.roll_number;
    if (cleanData.name && !cleanData.full_name) cleanData.full_name = cleanData.name;
    if (cleanData.faculty_id && !cleanData.employee_code) cleanData.employee_code = cleanData.faculty_id;
    if (cleanData.employee_code && !cleanData.faculty_id) cleanData.faculty_id = cleanData.employee_code;
    if (cleanData.department && !cleanData.department_code) cleanData.department_code = cleanData.department;
    if (cleanData.dept && !cleanData.department_code) cleanData.department_code = cleanData.dept;
    if (cleanData.day && !cleanData.day_of_week) cleanData.day_of_week = cleanData.day;
    if (cleanData.day_of_week && !cleanData.day) cleanData.day = cleanData.day_of_week;
    if (cleanData.room && !cleanData.room_code) cleanData.room_code = cleanData.room;
    if (cleanData.room_number && !cleanData.room_code) cleanData.room_code = cleanData.room_number;
    if (cleanData.marks_obtained !== undefined && cleanData.obtained_marks === undefined) {
      cleanData.obtained_marks = cleanData.marks_obtained;
    }

    // Check required fields based on config
    (config.requiredHeaders || []).forEach(reqKey => {
      const val = cleanData[reqKey];
      if (val === undefined || val === null || val === '') {
        rowErrors.push(
          createRowError(
            rowNumber,
            reqKey,
            `Missing required field "${reqKey}"`,
            val,
            `The column "${reqKey}" is required for ${entityType} import but was empty.`,
            `Provide a valid value for "${reqKey}" in row ${rowNumber}.`
          )
        );
      }
    });

    let isDuplicate = false;
    let duplicateReason: string | undefined = undefined;

    // Module-specific validation logic
    switch (entityType) {
      case 'students': {
        const roll = String(cleanData.roll_no || '').trim().toUpperCase();
        if (roll) {
          if (intraFileKeys.has(roll)) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'roll_no',
                `Duplicate roll_no "${roll}" found in uploaded file`,
                roll,
                `The roll number "${roll}" appears multiple times in the uploaded CSV/XLSX.`,
                `Ensure each student has a unique roll number.`
              )
            );
          } else {
            intraFileKeys.add(roll);
          }

          if (ctx.studentsMap.has(roll)) {
            isDuplicate = true;
            duplicateReason = `Student with roll number "${roll}" already exists in students master.`;
          }
        }

        // Full Name check
        if (!cleanData.full_name && !cleanData.name) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'full_name',
              'Student full_name is required',
              cleanData.full_name,
              'Student record must contain a non-empty full name.',
              'Provide student name (e.g., "Aarav Sharma").'
            )
          );
        }

        // Department check
        const dept = String(cleanData.department_code || cleanData.department || cleanData.branch || '').trim().toUpperCase();
        if (dept && ctx.departmentsSet.size > 0 && !ctx.departmentsSet.has(dept) && !ctx.branchesSet.has(dept)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'department_code',
              `Unknown department/branch code "${dept}"`,
              dept,
              `Department code "${dept}" is not registered in the system.`,
              `Use one of the existing departments: ${Array.from(ctx.departmentsSet).join(', ') || 'CSE, ECE, ME, CE'}`
            )
          );
        }

        // Semester validation (Must be integer 1-8)
        const sem = Number(cleanData.semester);
        if (cleanData.semester !== undefined && cleanData.semester !== '') {
          if (isNaN(sem) || !Number.isInteger(sem) || sem < 1 || sem > 8) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'semester',
                `Invalid semester "${cleanData.semester}"`,
                cleanData.semester,
                'Semester must be an integer between 1 and 8.',
                'Specify a valid semester number from 1 to 8.'
              )
            );
          } else {
            cleanData.semester = sem;
          }
        }

        // Section validation
        if (cleanData.section) {
          const sec = String(cleanData.section).trim().toUpperCase();
          if (sec.length > 5) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'section',
                `Invalid section code "${cleanData.section}"`,
                cleanData.section,
                'Section code should typically be a short code like A, B, C, or 1, 2.',
                'Use short section identifier like "A" or "B".'
              )
            );
          } else {
            cleanData.section = sec;
          }
        } else {
          cleanData.section = 'A';
        }

        // Academic Year validation
        if (cleanData.academic_year) {
          const ay = String(cleanData.academic_year).trim();
          if (!ACADEMIC_YEAR_REGEX.test(ay)) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'academic_year',
                `Invalid academic year format "${ay}"`,
                ay,
                'Academic year must follow the YYYY-YYYY format (e.g., 2026-2027).',
                'Change format to "YYYY-YYYY" such as "2026-2027".'
              )
            );
          }
        }

        // Email validation
        if (cleanData.email) {
          const em = String(cleanData.email).trim().toLowerCase();
          if (!EMAIL_REGEX.test(em)) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'email',
                `Invalid email format "${cleanData.email}"`,
                cleanData.email,
                'Email does not match standard email pattern.',
                'Provide valid email address e.g. student@hiet.org'
              )
            );
          } else {
            if (intraFileEmails.has(em)) {
              rowErrors.push(
                createRowError(
                  rowNumber,
                  'email',
                  `Duplicate email "${em}" in uploaded file`,
                  em,
                  'Email address is assigned to multiple students in the same import file.',
                  'Each student must have a distinct institutional or personal email.'
                )
              );
            } else {
              intraFileEmails.add(em);
            }

            if (ctx.userEmailsSet && ctx.userEmailsSet.has(em)) {
              rowErrors.push(
                createRowError(
                  rowNumber,
                  'email',
                  `Email "${em}" already assigned to another user`,
                  em,
                  'An existing user in the database is already registered with this email address.',
                  'Provide a unique email address or verify user record.'
                )
              );
            }
          }
        }
        break;
      }

      case 'faculty': {
        const empCode = String(cleanData.employee_code || cleanData.faculty_id || '').trim().toUpperCase();
        if (empCode) {
          if (intraFileKeys.has(empCode)) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'employee_code',
                `Duplicate employee_code "${empCode}" found in uploaded file`,
                empCode,
                'Employee code must be unique per faculty member.',
                'Assign unique employee code (e.g., "FAC-001").'
              )
            );
          } else {
            intraFileKeys.add(empCode);
          }

          if (ctx.facultyMap.has(empCode)) {
            isDuplicate = true;
            duplicateReason = `Faculty member with code "${empCode}" already exists in faculty records.`;
          }
        }

        // Full Name check
        if (!cleanData.full_name && !cleanData.name) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'full_name',
              'Faculty full_name is required',
              cleanData.full_name,
              'Faculty record must contain a non-empty name.',
              'Provide full name e.g. "Dr. Ramesh Sharma".'
            )
          );
        }

        // Designation check
        if (!cleanData.designation) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'designation',
              'Faculty designation is required',
              cleanData.designation,
              'Designation field is empty.',
              'Provide designation such as "Assistant Professor", "Associate Professor", or "Professor".'
            )
          );
        }

        // Department check
        const dept = String(cleanData.department_code || cleanData.department || '').trim().toUpperCase();
        if (dept && ctx.departmentsSet.size > 0 && !ctx.departmentsSet.has(dept)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'department_code',
              `Unknown department_code "${dept}"`,
              dept,
              `Department code "${dept}" does not exist in college department master.`,
              `Import department master first or use one of: ${Array.from(ctx.departmentsSet).join(', ')}`
            )
          );
        }

        // Email validation
        if (cleanData.email) {
          const em = String(cleanData.email).trim().toLowerCase();
          if (!EMAIL_REGEX.test(em)) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'email',
                `Invalid email format "${cleanData.email}"`,
                cleanData.email,
                'Faculty email does not conform to standard format.',
                'Provide valid email e.g. faculty@hiet.org'
              )
            );
          } else {
            if (intraFileEmails.has(em)) {
              rowErrors.push(
                createRowError(
                  rowNumber,
                  'email',
                  `Duplicate email "${em}" in uploaded file`,
                  em,
                  'Multiple faculty rows share the same email address.',
                  'Provide unique email address for each faculty member.'
                )
              );
            } else {
              intraFileEmails.add(em);
            }
          }
        }
        break;
      }

      case 'departments':
      case 'departments_branches': {
        const dCode = String(cleanData.department_code || cleanData.code || '').trim().toUpperCase();
        if (dCode) {
          if (intraFileKeys.has(dCode)) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'department_code',
                `Duplicate department_code "${dCode}" in uploaded file`,
                dCode,
                'Department code must be unique.',
                'Use distinct department code.'
              )
            );
          } else {
            intraFileKeys.add(dCode);
          }

          if (ctx.departmentsSet.has(dCode)) {
            isDuplicate = true;
            duplicateReason = `Department code "${dCode}" already exists.`;
          }
        }
        break;
      }

      case 'subjects': {
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        if (scode) {
          if (intraFileKeys.has(scode)) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'subject_code',
                `Duplicate subject_code "${scode}" found in uploaded file`,
                scode,
                'Subject code must be unique across the college.',
                'Ensure distinct subject codes (e.g., CS-601).'
              )
            );
          } else {
            intraFileKeys.add(scode);
          }

          if (ctx.subjectsMap.has(scode)) {
            isDuplicate = true;
            duplicateReason = `Subject "${scode}" already exists in subjects catalog.`;
          }
        }

        // Department check
        const dept = String(cleanData.department_code || cleanData.department || cleanData.branch || '').trim().toUpperCase();
        if (dept && ctx.departmentsSet.size > 0 && !ctx.departmentsSet.has(dept) && !ctx.branchesSet.has(dept)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'department_code',
              `Unknown department code "${dept}"`,
              dept,
              'Department does not exist in master records.',
              `Select an existing department: ${Array.from(ctx.departmentsSet).join(', ')}`
            )
          );
        }

        // Semester
        const sem = Number(cleanData.semester);
        if (isNaN(sem) || !Number.isInteger(sem) || sem < 1 || sem > 8) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'semester',
              `Invalid semester "${cleanData.semester}"`,
              cleanData.semester,
              'Semester must be an integer between 1 and 8.',
              'Set semester between 1 and 8.'
            )
          );
        } else {
          cleanData.semester = sem;
        }

        // Credits
        if (cleanData.credits !== undefined && cleanData.credits !== '') {
          const cr = Number(cleanData.credits);
          if (isNaN(cr) || cr <= 0 || cr > 12) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'credits',
                `Invalid credits "${cleanData.credits}"`,
                cleanData.credits,
                'Credits must be a positive number up to 12.',
                'Set credits between 1.0 and 8.0.'
              )
            );
          } else {
            cleanData.credits = cr;
          }
        } else {
          cleanData.credits = 4.0;
        }
        break;
      }

      case 'teacher_subjects': {
        const empCode = String(cleanData.employee_code || cleanData.faculty_id || '').trim().toUpperCase();
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        const sem = Number(cleanData.semester);
        const sec = String(cleanData.section || 'A').trim().toUpperCase();
        const ay = String(cleanData.academic_year || '').trim();

        if (empCode && !ctx.facultyMap.has(empCode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'employee_code',
              `Faculty "${empCode}" does not exist in Faculty Master`,
              empCode,
              'Cannot map an unverified employee code.',
              'Import or register faculty member first.'
            )
          );
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'subject_code',
              `Subject code "${scode}" does not exist in Subjects Master`,
              scode,
              'Subject is not present in subject catalog.',
              'Import subject into catalog before mapping.'
            )
          );
        }

        // Department consistency check (Cross-department policy check)
        const facultyObj = ctx.facultyMap.get(empCode);
        const subjectObj = ctx.subjectsMap.get(scode);
        if (facultyObj && subjectObj) {
          const facDept = String(facultyObj.department || facultyObj.department_code || '').trim().toUpperCase();
          const subDept = String(subjectObj.department || subjectObj.department_code || subjectObj.branch || '').trim().toUpperCase();
          if (facDept && subDept && facDept !== subDept) {
            // Note: cross-department assignment allowed with warning unless invalid
            cleanData.is_cross_department = true;
          }
        }

        if (isNaN(sem) || sem < 1 || sem > 8) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'semester',
              `Invalid semester "${cleanData.semester}"`,
              cleanData.semester,
              'Semester must be between 1 and 8.',
              'Enter semester 1-8.'
            )
          );
        } else {
          cleanData.semester = sem;
        }

        const mapKey = `${empCode}|${scode}|${sem}|${sec}|${ay}`;
        if (intraFileKeys.has(mapKey)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'subject_code',
              'Duplicate teacher-subject mapping entry in file',
              mapKey,
              'Same faculty is already mapped to this subject, semester, section, and academic year in this file.',
              'Remove duplicate mapping row.'
            )
          );
        } else {
          intraFileKeys.add(mapKey);
        }

        const legacyMapKey = `${empCode}|${scode}|${sem}|${sec}`;
        if (ctx.teacherSubjectSet.has(legacyMapKey) || ctx.teacherSubjectSet.has(mapKey)) {
          isDuplicate = true;
          duplicateReason = `Mapping for Faculty ${empCode} to ${scode} (Sem ${sem}, Sec ${sec}) already exists.`;
        }
        break;
      }

      case 'class_incharge': {
        const empCode = String(cleanData.employee_code || cleanData.faculty_id || '').trim().toUpperCase();
        const dept = String(cleanData.department_code || cleanData.department || '').trim().toUpperCase();
        const sem = Number(cleanData.semester);
        const sec = String(cleanData.section || 'A').trim().toUpperCase();
        const ay = String(cleanData.academic_year || '').trim();

        if (empCode && !ctx.facultyMap.has(empCode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'employee_code',
              `Faculty "${empCode}" does not exist in Faculty Master`,
              empCode,
              'Class in-charge must be an existing verified faculty member.',
              'Verify employee code against Faculty Master.'
            )
          );
        }

        // Faculty must belong to same department
        const facultyObj = ctx.facultyMap.get(empCode);
        if (facultyObj && dept) {
          const facDept = String(facultyObj.department || facultyObj.department_code || '').trim().toUpperCase();
          if (facDept && facDept !== dept) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'employee_code',
                `Faculty ${empCode} belongs to ${facDept}, not ${dept}`,
                empCode,
                'Class In-Charge must belong to the same department as the class.',
                `Assign a faculty member from ${dept} or update department assignment.`
              )
            );
          }
        }

        if (isNaN(sem) || sem < 1 || sem > 8) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'semester',
              `Invalid semester "${cleanData.semester}"`,
              cleanData.semester,
              'Semester must be an integer between 1 and 8.',
              'Specify valid semester 1-8.'
            )
          );
        }

        // One active class in-charge per department + semester + section + academic year
        const classKey = `${dept}|${sem}|${sec}|${ay}`;
        if (intraFileKeys.has(classKey)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'section',
              `Multiple in-charges assigned to ${dept} Sem ${sem}-${sec} for ${ay}`,
              classKey,
              'Only one active class in-charge is permitted per class section per academic year.',
              'Remove duplicate in-charge assignment.'
            )
          );
        } else {
          intraFileKeys.add(classKey);
        }

        if (ctx.classInchargeSet && ctx.classInchargeSet.has(classKey)) {
          isDuplicate = true;
          duplicateReason = `Class in-charge for ${dept} Sem ${sem}-${sec} (${ay}) already exists.`;
        }
        break;
      }

      case 'hod_assignment': {
        const empCode = String(cleanData.employee_code || cleanData.faculty_id || '').trim().toUpperCase();
        const dept = String(cleanData.department_code || cleanData.department || '').trim().toUpperCase();
        const effFrom = String(cleanData.effective_from || '').trim();
        const effUntil = String(cleanData.effective_until || '').trim();

        if (dept && ctx.departmentsSet.size > 0 && !ctx.departmentsSet.has(dept)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'department_code',
              `Unknown department code "${dept}"`,
              dept,
              'HOD can only be assigned to a registered department.',
              `Choose an existing department: ${Array.from(ctx.departmentsSet).join(', ')}`
            )
          );
        }

        if (empCode && !ctx.facultyMap.has(empCode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'employee_code',
              `Faculty "${empCode}" does not exist in Faculty Master`,
              empCode,
              'HOD must be a valid faculty member.',
              'Verify faculty employee code.'
            )
          );
        }

        // Faculty must belong to that department
        const facultyObj = ctx.facultyMap.get(empCode);
        if (facultyObj && dept) {
          const facDept = String(facultyObj.department || facultyObj.department_code || '').trim().toUpperCase();
          if (facDept && facDept !== dept) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'employee_code',
                `Faculty ${empCode} belongs to ${facDept}, cannot be assigned as HOD of ${dept}`,
                empCode,
                'HOD must be a faculty member of the corresponding department.',
                `Select a faculty member belonging to ${dept}.`
              )
            );
          }
        }

        // Validate effective dates
        if (effFrom) {
          const dFrom = new Date(effFrom);
          if (isNaN(dFrom.getTime())) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'effective_from',
                `Invalid effective_from date "${effFrom}"`,
                effFrom,
                'Date must be in YYYY-MM-DD format.',
                'Use format "YYYY-MM-DD".'
              )
            );
          }
        }

        if (effUntil) {
          const dUntil = new Date(effUntil);
          const dFrom = new Date(effFrom);
          if (isNaN(dUntil.getTime())) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'effective_until',
                `Invalid effective_until date "${effUntil}"`,
                effUntil,
                'Date must be in YYYY-MM-DD format.',
                'Use format "YYYY-MM-DD".'
              )
            );
          } else if (!isNaN(dFrom.getTime()) && dUntil < dFrom) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'effective_until',
                'effective_until cannot be earlier than effective_from',
                effUntil,
                'End date of HOD tenure must be after start date.',
                'Adjust effective_until to a date after effective_from.'
              )
            );
          }
        }
        break;
      }

      case 'timetable': {
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        const empCode = String(cleanData.employee_code || cleanData.faculty_id || '').trim().toUpperCase();
        const day = String(cleanData.day_of_week || cleanData.day || '').trim();
        const sem = Number(cleanData.semester);
        const sec = String(cleanData.section || 'A').trim().toUpperCase();
        const room = String(cleanData.room_code || cleanData.room || '').trim().toUpperCase();

        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayMatch = validDays.find(d => d.toLowerCase() === day.toLowerCase());
        if (!dayMatch) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'day_of_week',
              `Invalid day "${day}"`,
              day,
              'Day of week must be Monday through Saturday.',
              'Use one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.'
            )
          );
        } else {
          cleanData.day = dayMatch;
          cleanData.day_of_week = dayMatch;
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'subject_code',
              `Subject "${scode}" does not exist in Subjects Master`,
              scode,
              'Cannot schedule a timetable slot for an unregistered subject.',
              'Import subject into Subjects Master first.'
            )
          );
        }

        if (empCode && !ctx.facultyMap.has(empCode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'employee_code',
              `Faculty "${empCode}" does not exist in Faculty Master`,
              empCode,
              'Cannot schedule timetable slot for an unverified faculty member.',
              'Import faculty record into Faculty Master first.'
            )
          );
        }

        if (!room) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'room_code',
              'room_code is required for timetable slot',
              room,
              'Every timetable slot must specify a classroom or lab room code.',
              'Specify room code (e.g., "LH-101", "CS-LAB-1").'
            )
          );
        }

        const startMin = parseTimeToMinutes(cleanData.start_time);
        const endMin = parseTimeToMinutes(cleanData.end_time);

        if (startMin === null) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'start_time',
              `Invalid start_time format "${cleanData.start_time}"`,
              cleanData.start_time,
              'Start time must be in HH:MM AM/PM or HH:MM 24-hr format.',
              'Use format like "09:30 AM" or "09:30".'
            )
          );
        }

        if (endMin === null) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'end_time',
              `Invalid end_time format "${cleanData.end_time}"`,
              cleanData.end_time,
              'End time must be in HH:MM AM/PM or HH:MM 24-hr format.',
              'Use format like "10:30 AM" or "10:30".'
            )
          );
        }

        if (startMin !== null && endMin !== null) {
          if (startMin >= endMin) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'end_time',
                `end_time must be later than start_time`,
                cleanData.end_time,
                `Lecture end time must be after start time (${formatMinutesToTime(startMin)} vs ${formatMinutesToTime(endMin)}).`,
                'Set end_time to be after start_time.'
              )
            );
          } else {
            const slotDay = cleanData.day;

            // 1. Intra-file Faculty Conflict
            if (empCode) {
              const fileFacConflict = intraFileTimetableFaculty.find(f => 
                f.day.toLowerCase() === slotDay.toLowerCase() &&
                f.fid === empCode &&
                Math.max(startMin, f.start) < Math.min(endMin, f.end)
              );
              if (fileFacConflict) {
                rowErrors.push(
                  createRowError(
                    rowNumber,
                    'employee_code',
                    `Faculty conflict with row ${fileFacConflict.row}`,
                    empCode,
                    `Faculty "${empCode}" is scheduled concurrently in row ${fileFacConflict.row} on ${slotDay}.`,
                    'Adjust class timing or reassign faculty.'
                  )
                );
              } else {
                intraFileTimetableFaculty.push({ day: slotDay, fid: empCode, start: startMin, end: endMin, row: rowNumber });
              }

              // DB Faculty conflict
              const dbFacConflict = ctx.timetableSlots.find(slot => 
                slot.day.toLowerCase() === slotDay.toLowerCase() &&
                slot.facultyId.toUpperCase() === empCode &&
                Math.max(startMin, slot.startMinutes) < Math.min(endMin, slot.endMinutes)
              );
              if (dbFacConflict) {
                rowErrors.push(
                  createRowError(
                    rowNumber,
                    'employee_code',
                    `Faculty timetable conflict with existing schedule`,
                    empCode,
                    `Faculty "${empCode}" is already teaching ${dbFacConflict.subjectCode} on ${slotDay} from ${dbFacConflict.startTime} to ${dbFacConflict.endTime}.`,
                    'Choose an unbooked timeslot for this faculty member.'
                  )
                );
              }
            }

            // 2. Intra-file Room Conflict
            if (room) {
              const fileRoomConflict = intraFileTimetableRoom.find(r => 
                r.day.toLowerCase() === slotDay.toLowerCase() &&
                r.room === room &&
                Math.max(startMin, r.start) < Math.min(endMin, r.end)
              );
              if (fileRoomConflict) {
                rowErrors.push(
                  createRowError(
                    rowNumber,
                    'room_code',
                    `Room conflict with row ${fileRoomConflict.row}`,
                    room,
                    `Room "${room}" is already assigned concurrently in row ${fileRoomConflict.row} on ${slotDay}.`,
                    'Assign a different room for this slot.'
                  )
                );
              } else {
                intraFileTimetableRoom.push({ day: slotDay, room, start: startMin, end: endMin, row: rowNumber });
              }

              // DB Room conflict
              const dbRoomConflict = ctx.timetableSlots.find(slot => 
                slot.day.toLowerCase() === slotDay.toLowerCase() &&
                (slot.roomCode || slot.room || '').toUpperCase() === room &&
                Math.max(startMin, slot.startMinutes) < Math.min(endMin, slot.endMinutes)
              );
              if (dbRoomConflict) {
                rowErrors.push(
                  createRowError(
                    rowNumber,
                    'room_code',
                    `Room conflict with existing schedule`,
                    room,
                    `Room "${room}" is already booked on ${slotDay} (${dbRoomConflict.startTime} - ${dbRoomConflict.endTime}).`,
                    'Choose an alternative room or adjust timing.'
                  )
                );
              }
            }
          }
        }

        // GPS Coordinates validation
        if (cleanData.room_lat !== undefined && cleanData.room_lat !== '') {
          const lat = Number(cleanData.room_lat);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'room_lat',
                `Invalid latitude "${cleanData.room_lat}"`,
                cleanData.room_lat,
                'Latitude must be a valid number between -90 and +90 degrees.',
                'Provide valid decimal degrees (e.g., 28.6139).'
              )
            );
          }
        }

        if (cleanData.room_long !== undefined && cleanData.room_long !== '') {
          const lng = Number(cleanData.room_long);
          if (isNaN(lng) || lng < -180 || lng > 180) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'room_long',
                `Invalid longitude "${cleanData.room_long}"`,
                cleanData.room_long,
                'Longitude must be a valid number between -180 and +180 degrees.',
                'Provide valid decimal degrees (e.g., 77.2090).'
              )
            );
          }
        }

        if (cleanData.geofence_radius_meters !== undefined && cleanData.geofence_radius_meters !== '') {
          const rad = Number(cleanData.geofence_radius_meters);
          if (isNaN(rad) || rad < 5 || rad > 1000) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'geofence_radius_meters',
                `Invalid geofence radius "${cleanData.geofence_radius_meters}"`,
                cleanData.geofence_radius_meters,
                'Geofence radius must be between 5m and 1000m (default is 30m).',
                'Specify realistic radius e.g. 30.'
              )
            );
          }
        }
        break;
      }

      case 'sessional_marks': {
        const roll = String(cleanData.roll_no || '').trim().toUpperCase();
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();

        if (roll && !ctx.studentsMap.has(roll)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'roll_no',
              `Student roll number "${roll}" does not exist in Students Master`,
              roll,
              'Marks can only be recorded for students present in the master database.',
              'Import student record first.'
            )
          );
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'subject_code',
              `Subject "${scode}" does not exist in Subjects Master`,
              scode,
              'Subject must be in catalog to record marks.',
              'Verify subject code in catalog.'
            )
          );
        }

        const marksObtained = Number(cleanData.obtained_marks !== undefined ? cleanData.obtained_marks : cleanData.marks_obtained);
        const maxMarks = Number(cleanData.max_marks);

        if (isNaN(marksObtained) || marksObtained < 0) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'obtained_marks',
              `obtained_marks must be a non-negative number`,
              cleanData.obtained_marks,
              'Negative or non-numeric marks are not allowed.',
              'Enter a valid score >= 0.'
            )
          );
        }

        if (isNaN(maxMarks) || maxMarks <= 0) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'max_marks',
              `max_marks must be a positive number`,
              cleanData.max_marks,
              'Maximum marks for an assessment must be greater than zero.',
              'Set max_marks to assessment scale (e.g., 20, 50, 100).'
            )
          );
        }

        if (!isNaN(marksObtained) && !isNaN(maxMarks)) {
          if (marksObtained > maxMarks) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'obtained_marks',
                `Marks obtained (${marksObtained}) cannot exceed max_marks (${maxMarks})`,
                marksObtained,
                'Student score cannot exceed the maximum possible marks.',
                'Ensure obtained_marks <= max_marks.'
              )
            );
          }
        }
        break;
      }

      case 'results_grades': {
        const roll = String(cleanData.roll_no || '').trim().toUpperCase();
        const sem = Number(cleanData.semester);

        if (roll && !ctx.studentsMap.has(roll)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'roll_no',
              `Student roll number "${roll}" does not exist`,
              roll,
              'Result entry requires valid student roll number.',
              'Check roll number in Students Master.'
            )
          );
        }

        if (isNaN(sem) || sem < 1 || sem > 8) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'semester',
              `Invalid semester "${cleanData.semester}"`,
              cleanData.semester,
              'Semester must be between 1 and 8.',
              'Set semester to 1-8.'
            )
          );
        }

        if (cleanData.sgpa !== undefined && cleanData.sgpa !== '') {
          const sgpa = Number(cleanData.sgpa);
          if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'sgpa',
                `Invalid SGPA "${cleanData.sgpa}"`,
                cleanData.sgpa,
                'SGPA must be on a 10-point scale (0.00 to 10.00).',
                'Enter SGPA between 0.0 and 10.0.'
              )
            );
          }
        }

        if (cleanData.cgpa !== undefined && cleanData.cgpa !== '') {
          const cgpa = Number(cleanData.cgpa);
          if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
            rowErrors.push(
              createRowError(
                rowNumber,
                'cgpa',
                `Invalid CGPA "${cleanData.cgpa}"`,
                cleanData.cgpa,
                'CGPA must be on a 10-point scale (0.00 to 10.00).',
                'Enter CGPA between 0.0 and 10.0.'
              )
            );
          }
        }
        break;
      }

      case 'user_invitations': {
        const email = String(cleanData.email || '').trim().toLowerCase();
        const role = String(cleanData.role || '').trim().toLowerCase();
        const identifier = String(cleanData.identifier || '').trim().toUpperCase();

        if (!EMAIL_REGEX.test(email)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'email',
              `Invalid invitation email "${email}"`,
              email,
              'Email does not match standard email pattern.',
              'Provide valid destination email address.'
            )
          );
        }

        if (!['student', 'teacher', 'hod'].includes(role)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'role',
              `Invalid invitation role "${cleanData.role}"`,
              cleanData.role,
              'Invitations can only be sent for student, teacher, or hod roles. Admin/Principal cannot be created via import.',
              'Set role to "student", "teacher", or "hod".'
            )
          );
        }

        if (role === 'student' && identifier && !ctx.studentsMap.has(identifier)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'identifier',
              `Student roll number "${identifier}" does not exist in master records`,
              identifier,
              'User account invitation requires a pre-existing student master record.',
              'Import student into Students Master before inviting.'
            )
          );
        }

        if ((role === 'teacher' || role === 'hod') && identifier && !ctx.facultyMap.has(identifier)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'identifier',
              `Faculty code "${identifier}" does not exist in master records`,
              identifier,
              'User account invitation requires a pre-existing faculty master record.',
              'Import faculty into Faculty Master before inviting.'
            )
          );
        }
        break;
      }

      case 'attendance': {
        const roll = String(cleanData.roll_no || '').trim().toUpperCase();
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        const dateStr = String(cleanData.date || '').trim();

        if (roll && !ctx.studentsMap.has(roll)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'roll_no',
              `Student roll number "${roll}" does not exist`,
              roll,
              'Attendance requires registered student.',
              'Import student first.'
            )
          );
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'subject_code',
              `Subject "${scode}" does not exist`,
              scode,
              'Attendance requires valid subject.',
              'Import subject first.'
            )
          );
        }

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'date',
              `Invalid attendance date "${dateStr}"`,
              dateStr,
              'Date must be in YYYY-MM-DD format.',
              'Use YYYY-MM-DD format.'
            )
          );
        }

        const rawStat = String(cleanData.status || '').toLowerCase().trim();
        const allowedStatuses: Record<string, string> = {
          present: 'Present',
          absent: 'Absent',
          late: 'Late',
          leave: 'Excused',
          excused: 'Excused'
        };

        if (!allowedStatuses[rawStat]) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'status',
              `Invalid attendance status "${cleanData.status}"`,
              cleanData.status,
              'Allowed values: present, absent, late, leave.',
              'Use present, absent, late, or leave.'
            )
          );
        } else {
          cleanData.status = allowedStatuses[rawStat];
        }
        break;
      }

      case 'syllabus': {
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'subject_code',
              `Subject "${scode}" does not exist in Subjects Master`,
              scode,
              'Syllabus must link to existing subject.',
              'Check subject code.'
            )
          );
        }
        break;
      }

      case 'calendar': {
        const startDate = String(cleanData.start_date || '').trim();
        const endDate = String(cleanData.end_date || '').trim();
        if (startDate && isNaN(new Date(startDate).getTime())) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'start_date',
              `Invalid start date "${startDate}"`,
              startDate,
              'Date must be in YYYY-MM-DD format.',
              'Use format YYYY-MM-DD.'
            )
          );
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'end_date',
              `Invalid end date "${endDate}"`,
              endDate,
              'Date must be in YYYY-MM-DD format.',
              'Use format YYYY-MM-DD.'
            )
          );
        }
        break;
      }

      case 'notices': {
        if (!cleanData.title) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'title',
              'Notice title is required',
              cleanData.title,
              'Notice must have a title headline.',
              'Provide notice title.'
            )
          );
        }
        break;
      }

      case 'pyqs': {
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push(
            createRowError(
              rowNumber,
              'subject_code',
              `Subject "${scode}" does not exist`,
              scode,
              'PYQ must belong to valid subject.',
              'Verify subject code.'
            )
          );
        }
        break;
      }
    }

    let status: 'valid' | 'invalid' | 'duplicate' = 'valid';
    if (rowErrors.length > 0) {
      status = 'invalid';
      allErrors.push(...rowErrors);
    } else if (isDuplicate) {
      status = 'duplicate';
    }

    validatedRows.push({
      rowNumber,
      raw,
      data: cleanData,
      errors: rowErrors,
      isDuplicate,
      duplicateReason,
      status,
      targetTable: config.id
    });
  });

  const validCount = validatedRows.filter(r => r.status === 'valid').length;
  const duplicateCount = validatedRows.filter(r => r.status === 'duplicate').length;
  const invalidCount = validatedRows.filter(r => r.status === 'invalid').length;

  return {
    totalRows: rawRows.length,
    validCount,
    duplicateCount,
    invalidCount,
    errors: allErrors,
    rows: validatedRows
  };
}
