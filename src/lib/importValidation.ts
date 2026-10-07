import { ImportEntityType } from '../types';
import { IMPORT_MODULE_CONFIGS } from './importTemplates';

export interface RowValidationError {
  rowNumber: number;
  column: string;
  message: string;
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
  facultyMap: Map<string, any>;  // faculty_id (uppercase) -> faculty
  departmentsSet: Set<string>;  // department codes (uppercase)
  branchesSet: Set<string>;     // branch codes (uppercase)
  subjectsMap: Map<string, any>; // subject_code (uppercase) -> subject
  timetableSlots: Array<{
    id?: string;
    branch: string;
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
  }>;
  attendanceSet: Set<string>; // roll_no + '|' + subject_code + '|' + date
  teacherSubjectSet: Set<string>; // faculty_id + '|' + subject_code + '|' + semester + '|' + section
  gradesSet: Set<string>; // roll_no + '|' + subject_code + '|' + semester
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

/**
 * Main validator for a batch of raw records for any of the 11 modules
 */
export function validateImportBatch(
  entityType: ImportEntityType,
  rawRows: Record<string, any>[],
  ctx: ValidationMasterContext
): ValidationSummary {
  const config = IMPORT_MODULE_CONFIGS[entityType];
  const validatedRows: ValidatedRow[] = [];
  const allErrors: RowValidationError[] = [];

  // Track intra-file uniqueness keys
  const intraFileKeys = new Set<string>();

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

    // Check required fields
    config.requiredHeaders.forEach(reqKey => {
      const val = cleanData[reqKey];
      if (val === undefined || val === null || val === '') {
        rowErrors.push({
          rowNumber,
          column: reqKey,
          message: `Missing required field "${reqKey}"`
        });
      }
    });

    let isDuplicate = false;
    let duplicateReason: string | undefined = undefined;

    // Module-specific validation logic
    switch (entityType) {
      case 'students': {
        const roll = String(cleanData.roll_no || '').trim().toUpperCase();
        if (roll) {
          // Check intra-file duplicate
          if (intraFileKeys.has(roll)) {
            rowErrors.push({
              rowNumber,
              column: 'roll_no',
              message: `Duplicate roll_no "${roll}" found in uploaded file`
            });
          } else {
            intraFileKeys.add(roll);
          }

          // Check DB duplicate
          if (ctx.studentsMap.has(roll)) {
            isDuplicate = true;
            duplicateReason = `Student with roll number "${roll}" already exists in students master.`;
          }
        }

        // Email validation
        if (cleanData.email && (!String(cleanData.email).includes('@') || !String(cleanData.email).includes('.'))) {
          rowErrors.push({
            rowNumber,
            column: 'email',
            message: `Invalid email address format "${cleanData.email}"`
          });
        }

        // Semester validation (Must be integer 1-8)
        const sem = Number(cleanData.semester);
        if (isNaN(sem) || !Number.isInteger(sem) || sem < 1 || sem > 8) {
          rowErrors.push({
            rowNumber,
            column: 'semester',
            message: `Invalid semester "${cleanData.semester}". Must be a number between 1 and 8.`
          });
        } else {
          cleanData.semester = sem;
        }

        // Department validation
        const dept = String(cleanData.department || '').trim().toUpperCase();
        if (dept && ctx.departmentsSet.size > 0 && !ctx.departmentsSet.has(dept)) {
          rowErrors.push({
            rowNumber,
            column: 'department',
            message: `Unknown department "${cleanData.department}". Department must exist in college records.`
          });
        }

        // Branch validation
        const br = String(cleanData.branch || '').trim().toUpperCase();
        if (br && ctx.branchesSet.size > 0 && !ctx.branchesSet.has(br)) {
          rowErrors.push({
            rowNumber,
            column: 'branch',
            message: `Unknown branch "${cleanData.branch}". Branch must exist in college records.`
          });
        }

        // Status validation
        if (cleanData.status) {
          const validStatuses = ['active', 'disabled', 'graduated', 'suspended'];
          if (!validStatuses.includes(String(cleanData.status).toLowerCase())) {
            rowErrors.push({
              rowNumber,
              column: 'status',
              message: `Invalid status "${cleanData.status}". Allowed values: ${validStatuses.join(', ')}`
            });
          }
        } else {
          cleanData.status = 'active';
        }
        break;
      }

      case 'faculty': {
        const fid = String(cleanData.faculty_id || '').trim().toUpperCase();
        if (fid) {
          if (intraFileKeys.has(fid)) {
            rowErrors.push({
              rowNumber,
              column: 'faculty_id',
              message: `Duplicate faculty_id "${fid}" found in uploaded file`
            });
          } else {
            intraFileKeys.add(fid);
          }

          if (ctx.facultyMap.has(fid)) {
            isDuplicate = true;
            duplicateReason = `Faculty member with ID "${fid}" already exists in faculty records.`;
          }
        }

        // Email validation
        if (cleanData.email && (!String(cleanData.email).includes('@') || !String(cleanData.email).includes('.'))) {
          rowErrors.push({
            rowNumber,
            column: 'email',
            message: `Invalid email address format "${cleanData.email}"`
          });
        }

        // Role restriction (SECURITY CRITICAL: Only teacher or hod allowed)
        const role = String(cleanData.role || '').toLowerCase().trim();
        if (role && !['teacher', 'hod'].includes(role)) {
          rowErrors.push({
            rowNumber,
            column: 'role',
            message: `Invalid faculty role "${cleanData.role}". Only "teacher" or "hod" roles may be imported via CSV. Admin/Principal roles cannot be created via import.`
          });
        } else {
          cleanData.role = role || 'teacher';
        }

        // Department validation
        const dept = String(cleanData.department || '').trim().toUpperCase();
        if (dept && ctx.departmentsSet.size > 0 && !ctx.departmentsSet.has(dept)) {
          rowErrors.push({
            rowNumber,
            column: 'department',
            message: `Unknown department "${cleanData.department}". Department must exist in college records.`
          });
        }

        // Status validation
        if (cleanData.status) {
          const validStatuses = ['active', 'inactive', 'disabled', 'on_leave', 'resigned'];
          if (!validStatuses.includes(String(cleanData.status).toLowerCase())) {
            rowErrors.push({
              rowNumber,
              column: 'status',
              message: `Invalid status "${cleanData.status}". Allowed: ${validStatuses.join(', ')}`
            });
          }
        } else {
          cleanData.status = 'active';
        }
        break;
      }

      case 'departments_branches': {
        const dCode = String(cleanData.department_code || '').trim().toUpperCase();
        const bCode = String(cleanData.branch_code || '').trim().toUpperCase();
        const pairKey = `${dCode}|${bCode}`;

        if (dCode && bCode) {
          if (intraFileKeys.has(pairKey)) {
            rowErrors.push({
              rowNumber,
              column: 'branch_code',
              message: `Duplicate department/branch entry "${pairKey}" in uploaded file`
            });
          } else {
            intraFileKeys.add(pairKey);
          }

          if (ctx.branchesSet.has(bCode)) {
            isDuplicate = true;
            duplicateReason = `Branch code "${bCode}" already exists.`;
          }
        }
        break;
      }

      case 'subjects': {
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        if (scode) {
          if (intraFileKeys.has(scode)) {
            rowErrors.push({
              rowNumber,
              column: 'subject_code',
              message: `Duplicate subject_code "${scode}" found in uploaded file`
            });
          } else {
            intraFileKeys.add(scode);
          }

          if (ctx.subjectsMap.has(scode)) {
            isDuplicate = true;
            duplicateReason = `Subject "${scode}" already exists in subjects catalog.`;
          }
        }

        // Semester
        const sem = Number(cleanData.semester);
        if (isNaN(sem) || !Number.isInteger(sem) || sem < 1 || sem > 8) {
          rowErrors.push({
            rowNumber,
            column: 'semester',
            message: `Invalid semester "${cleanData.semester}". Must be between 1 and 8.`
          });
        } else {
          cleanData.semester = sem;
        }

        // Credits
        if (cleanData.credits !== undefined && cleanData.credits !== '') {
          const cr = Number(cleanData.credits);
          if (isNaN(cr) || cr <= 0 || cr > 10) {
            rowErrors.push({
              rowNumber,
              column: 'credits',
              message: `Invalid credits "${cleanData.credits}". Must be a positive number.`
            });
          } else {
            cleanData.credits = cr;
          }
        } else {
          cleanData.credits = 4.0;
        }

        // Subject Type
        if (cleanData.subject_type) {
          const validTypes = ['theory', 'practical', 'elective', 'lab'];
          if (!validTypes.includes(String(cleanData.subject_type).toLowerCase())) {
            rowErrors.push({
              rowNumber,
              column: 'subject_type',
              message: `Invalid subject_type "${cleanData.subject_type}". Expected: ${validTypes.join(', ')}`
            });
          }
        }

        // Teacher Foreign Key check
        if (cleanData.teacher_faculty_id) {
          const tfid = String(cleanData.teacher_faculty_id).trim().toUpperCase();
          if (!ctx.facultyMap.has(tfid)) {
            rowErrors.push({
              rowNumber,
              column: 'teacher_faculty_id',
              message: `Assigned faculty ID "${cleanData.teacher_faculty_id}" does not exist in Faculty Master. Do not assign an unverified teacher.`
            });
          }
        }
        break;
      }

      case 'teacher_subjects': {
        const fid = String(cleanData.faculty_id || '').trim().toUpperCase();
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        const sem = Number(cleanData.semester);
        const sec = String(cleanData.section || 'A').trim().toUpperCase();

        if (fid && !ctx.facultyMap.has(fid)) {
          rowErrors.push({
            rowNumber,
            column: 'faculty_id',
            message: `Faculty member "${cleanData.faculty_id}" does not exist in Faculty Master.`
          });
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push({
            rowNumber,
            column: 'subject_code',
            message: `Subject code "${cleanData.subject_code}" does not exist in Subjects Master.`
          });
        }

        if (isNaN(sem) || sem < 1 || sem > 8) {
          rowErrors.push({
            rowNumber,
            column: 'semester',
            message: `Invalid semester "${cleanData.semester}". Must be between 1 and 8.`
          });
        } else {
          cleanData.semester = sem;
        }

        const mapKey = `${fid}|${scode}|${sem}|${sec}`;
        if (intraFileKeys.has(mapKey)) {
          rowErrors.push({
            rowNumber,
            column: 'subject_code',
            message: `Duplicate teacher-subject mapping entry found in uploaded file`
          });
        } else {
          intraFileKeys.add(mapKey);
        }

        if (ctx.teacherSubjectSet.has(mapKey)) {
          isDuplicate = true;
          duplicateReason = `Mapping for Faculty ${fid} to ${scode} (Sem ${sem}, Sec ${sec}) already exists.`;
        }
        break;
      }

      case 'timetable': {
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        const fid = String(cleanData.faculty_id || '').trim().toUpperCase();
        const day = String(cleanData.day || '').trim();
        const br = String(cleanData.branch || '').trim().toUpperCase();
        const sem = Number(cleanData.semester);
        const sec = String(cleanData.section || 'A').trim().toUpperCase();

        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayMatch = validDays.find(d => d.toLowerCase() === day.toLowerCase());
        if (!dayMatch) {
          rowErrors.push({
            rowNumber,
            column: 'day',
            message: `Invalid day "${cleanData.day}". Must be Monday through Saturday.`
          });
        } else {
          cleanData.day = dayMatch;
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push({
            rowNumber,
            column: 'subject_code',
            message: `Subject "${cleanData.subject_code}" does not exist in Subjects Master.`
          });
        }

        if (fid && !ctx.facultyMap.has(fid)) {
          rowErrors.push({
            rowNumber,
            column: 'faculty_id',
            message: `Faculty member "${cleanData.faculty_id}" does not exist in Faculty Master.`
          });
        }

        const startMin = parseTimeToMinutes(cleanData.start_time);
        const endMin = parseTimeToMinutes(cleanData.end_time);

        if (startMin === null) {
          rowErrors.push({
            rowNumber,
            column: 'start_time',
            message: `Invalid start_time format "${cleanData.start_time}". Use HH:MM AM/PM format.`
          });
        }

        if (endMin === null) {
          rowErrors.push({
            rowNumber,
            column: 'end_time',
            message: `Invalid end_time format "${cleanData.end_time}". Use HH:MM AM/PM format.`
          });
        }

        if (startMin !== null && endMin !== null) {
          if (startMin >= endMin) {
            rowErrors.push({
              rowNumber,
              column: 'end_time',
              message: `end_time must be later than start_time (${formatMinutesToTime(startMin)} vs ${formatMinutesToTime(endMin)}).`
            });
          } else {
            // Check for timetable conflicts against existing timetable slots
            const slotDay = cleanData.day;
            
            // 1. Faculty conflict check: Is faculty already teaching elsewhere at this time on this day?
            const facultyConflict = ctx.timetableSlots.find(slot => 
              slot.day.toLowerCase() === String(slotDay).toLowerCase() &&
              slot.facultyId.toUpperCase() === fid &&
              Math.max(startMin, slot.startMinutes) < Math.min(endMin, slot.endMinutes)
            );

            if (facultyConflict) {
              rowErrors.push({
                rowNumber,
                column: 'faculty_id',
                message: `Timetable Conflict: Faculty "${fid}" is already assigned to ${facultyConflict.subjectCode} (${facultyConflict.branch} Sem ${facultyConflict.semester}-${facultyConflict.section}) on ${slotDay} from ${facultyConflict.startTime} to ${facultyConflict.endTime}.`
              });
            }

            // 2. Section conflict check: Does this section already have another lecture at this time on this day?
            const sectionConflict = ctx.timetableSlots.find(slot => 
              slot.day.toLowerCase() === String(slotDay).toLowerCase() &&
              slot.branch.toUpperCase() === br &&
              slot.semester === sem &&
              slot.section.toUpperCase() === sec &&
              Math.max(startMin, slot.startMinutes) < Math.min(endMin, slot.endMinutes)
            );

            if (sectionConflict) {
              rowErrors.push({
                rowNumber,
                column: 'section',
                message: `Timetable Conflict: Section ${br} Sem ${sem}-${sec} already has a scheduled class "${sectionConflict.subjectCode}" on ${slotDay} from ${sectionConflict.startTime} to ${sectionConflict.endTime}.`
              });
            }
          }
        }
        break;
      }

      case 'attendance': {
        const roll = String(cleanData.roll_no || '').trim().toUpperCase();
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        const dateStr = String(cleanData.date || '').trim();

        if (roll && !ctx.studentsMap.has(roll)) {
          rowErrors.push({
            rowNumber,
            column: 'roll_no',
            message: `Student roll number "${cleanData.roll_no}" does not exist in Students Master.`
          });
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push({
            rowNumber,
            column: 'subject_code',
            message: `Subject code "${cleanData.subject_code}" does not exist in Subjects Master.`
          });
        }

        // Date check
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          rowErrors.push({
            rowNumber,
            column: 'date',
            message: `Invalid attendance date "${cleanData.date}". Use YYYY-MM-DD format.`
          });
        }

        // Status check: present, absent, late, leave
        const rawStat = String(cleanData.status || '').toLowerCase().trim();
        const allowedStatuses: Record<string, string> = {
          present: 'Present',
          absent: 'Absent',
          late: 'Late',
          leave: 'Excused',
          excused: 'Excused'
        };

        if (!allowedStatuses[rawStat]) {
          rowErrors.push({
            rowNumber,
            column: 'status',
            message: `Invalid attendance status "${cleanData.status}". Allowed values: present, absent, late, leave.`
          });
        } else {
          cleanData.status = allowedStatuses[rawStat];
        }

        // Duplicate attendance check (student + subject + date)
        const attKey = `${roll}|${scode}|${dateStr}`;
        if (intraFileKeys.has(attKey)) {
          rowErrors.push({
            rowNumber,
            column: 'date',
            message: `Duplicate attendance record for student ${roll}, subject ${scode}, date ${dateStr} in file.`
          });
        } else {
          intraFileKeys.add(attKey);
        }

        if (ctx.attendanceSet.has(attKey)) {
          isDuplicate = true;
          duplicateReason = `Attendance record for ${roll} on ${dateStr} for ${scode} already recorded in database.`;
        }
        break;
      }

      case 'sessional_marks': {
        const roll = String(cleanData.roll_no || '').trim().toUpperCase();
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();

        if (roll && !ctx.studentsMap.has(roll)) {
          rowErrors.push({
            rowNumber,
            column: 'roll_no',
            message: `Student with roll number "${cleanData.roll_no}" does not exist.`
          });
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push({
            rowNumber,
            column: 'subject_code',
            message: `Subject "${cleanData.subject_code}" does not exist in Subjects Master.`
          });
        }

        const marksObtained = Number(cleanData.marks_obtained);
        const maxMarks = Number(cleanData.max_marks);

        if (isNaN(marksObtained) || marksObtained < 0) {
          rowErrors.push({
            rowNumber,
            column: 'marks_obtained',
            message: `marks_obtained must be a non-negative number (got "${cleanData.marks_obtained}").`
          });
        }

        if (isNaN(maxMarks) || maxMarks <= 0) {
          rowErrors.push({
            rowNumber,
            column: 'max_marks',
            message: `max_marks must be a positive number (got "${cleanData.max_marks}").`
          });
        }

        if (!isNaN(marksObtained) && !isNaN(maxMarks)) {
          if (marksObtained > maxMarks) {
            rowErrors.push({
              rowNumber,
              column: 'marks_obtained',
              message: `Marks obtained (${marksObtained}) cannot exceed maximum marks (${maxMarks}).`
            });
          }
        }
        break;
      }

      case 'results_grades': {
        const roll = String(cleanData.roll_no || '').trim().toUpperCase();
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        const sem = Number(cleanData.semester);

        if (roll && !ctx.studentsMap.has(roll)) {
          rowErrors.push({
            rowNumber,
            column: 'roll_no',
            message: `Student with roll number "${cleanData.roll_no}" does not exist.`
          });
        }

        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push({
            rowNumber,
            column: 'subject_code',
            message: `Subject code "${cleanData.subject_code}" does not exist.`
          });
        }

        if (isNaN(sem) || sem < 1 || sem > 8) {
          rowErrors.push({
            rowNumber,
            column: 'semester',
            message: `Invalid semester "${cleanData.semester}". Must be between 1 and 8.`
          });
        } else {
          cleanData.semester = sem;
        }

        // Grade format
        const validGrades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];
        const gradeVal = String(cleanData.grade || '').toUpperCase().trim();
        if (!validGrades.includes(gradeVal)) {
          rowErrors.push({
            rowNumber,
            column: 'grade',
            message: `Invalid grade format "${cleanData.grade}". Expected one of: ${validGrades.join(', ')}`
          });
        } else {
          cleanData.grade = gradeVal;
        }

        // Grade point
        const gp = Number(cleanData.grade_point);
        if (isNaN(gp) || gp < 0 || gp > 10) {
          rowErrors.push({
            rowNumber,
            column: 'grade_point',
            message: `Invalid grade_point "${cleanData.grade_point}". Must be a number between 0.0 and 10.0.`
          });
        } else {
          cleanData.grade_point = gp;
        }

        // Credits
        const cr = Number(cleanData.credits);
        if (isNaN(cr) || cr <= 0) {
          rowErrors.push({
            rowNumber,
            column: 'credits',
            message: `Invalid credits "${cleanData.credits}". Must be greater than 0.`
          });
        } else {
          cleanData.credits = cr;
        }

        const gradeKey = `${roll}|${scode}|${sem}`;
        if (ctx.gradesSet.has(gradeKey)) {
          isDuplicate = true;
          duplicateReason = `Grade record for student ${roll}, subject ${scode}, semester ${sem} already exists.`;
        }
        break;
      }

      case 'syllabus': {
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push({
            rowNumber,
            column: 'subject_code',
            message: `Subject "${cleanData.subject_code}" does not exist in Subjects Master.`
          });
        }

        const sem = Number(cleanData.semester);
        if (isNaN(sem) || sem < 1 || sem > 8) {
          rowErrors.push({
            rowNumber,
            column: 'semester',
            message: `Invalid semester "${cleanData.semester}". Must be between 1 and 8.`
          });
        }

        if (cleanData.document_url && !cleanData.document_url.startsWith('http')) {
          rowErrors.push({
            rowNumber,
            column: 'document_url',
            message: `document_url must be a valid HTTP/HTTPS web link (got "${cleanData.document_url}").`
          });
        }
        break;
      }

      case 'pyqs': {
        const scode = String(cleanData.subject_code || '').trim().toUpperCase();
        if (scode && !ctx.subjectsMap.has(scode)) {
          rowErrors.push({
            rowNumber,
            column: 'subject_code',
            message: `Subject "${cleanData.subject_code}" does not exist in Subjects Master.`
          });
        }

        const year = Number(cleanData.year);
        if (isNaN(year) || year < 2000 || year > 2050) {
          rowErrors.push({
            rowNumber,
            column: 'year',
            message: `Invalid exam year "${cleanData.year}". Must be a 4-digit year (e.g. 2025).`
          });
        }

        const examType = String(cleanData.exam_type || '').toLowerCase();
        if (!examType.includes('sem') && !examType.includes('mid') && !examType.includes('sessional')) {
          rowErrors.push({
            rowNumber,
            column: 'exam_type',
            message: `Invalid exam_type "${cleanData.exam_type}". Expected: End Sem, Mid Sem, Sessional.`
          });
        }

        if (cleanData.document_url && !cleanData.document_url.startsWith('http')) {
          rowErrors.push({
            rowNumber,
            column: 'document_url',
            message: `document_url must be a valid HTTP/HTTPS link (got "${cleanData.document_url}").`
          });
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
