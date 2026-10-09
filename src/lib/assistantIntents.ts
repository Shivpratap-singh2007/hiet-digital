// =============================================================================
// HIET DIGITAL CAMPUS — CLIENT-SIDE INTENT ROUTER
// Himachal Institute of Engineering & Technology, Shahpur
// Mirrors Supabase Edge Function deterministic keyword classification
// =============================================================================

import { AssistantIntent } from './assistantTypes';

export function detectAssistantIntent(
  message: string,
  rawRoles: string[] = ['student']
): AssistantIntent {
  const text = message.toLowerCase().trim();
  const roles = rawRoles.map((r) => r.toLowerCase());

  const includesAny = (...terms: string[]) =>
    terms.some((term) => text.includes(term.toLowerCase()));

  // 1. Peer Data / Exfiltration Guard: Students asking for someone else's data
  if (
    !roles.includes('principal') &&
    !roles.includes('admin') &&
    !roles.includes('hod') &&
    !roles.includes('faculty') &&
    !roles.includes('teacher')
  ) {
    if (
      includesAny(
        'rohit',
        'sab students',
        'all students',
        'other student',
        'dusre student',
        'rohit ke marks',
        'ke marks',
        'ki attendance',
        'ka result'
      ) &&
      !includesAny('meri', 'mera', 'mere', 'my', 'mine', 'own')
    ) {
      return 'unsupported';
    }
  }

  // 2. Principal / Executive Intents
  if (roles.includes('principal') || roles.includes('admin')) {
    if (
      includesAny(
        'open complaints',
        'open complaint',
        'complaints summary',
        'complaint kitni',
        'kitni complaints',
        'grievances summary'
      )
    ) {
      return 'principal_open_complaints_summary';
    }

    if (
      includesAny(
        'pending approvals',
        'pending approval',
        'approval pending',
        'approvals',
        'sanction pending'
      )
    ) {
      return 'principal_pending_approvals';
    }

    if (
      includesAny(
        'institution summary',
        'institution overview',
        'college summary',
        'overall attendance',
        'college attendance',
        'college overview',
        'campus overview',
        'summary'
      )
    ) {
      return 'principal_institution_summary';
    }
  }

  // 3. HOD Departmental Intents
  if (roles.includes('hod')) {
    if (
      includesAny(
        'complaint',
        'complaints',
        'grievance',
        'pending complaint',
        'open complaint',
        'shikayat'
      )
    ) {
      return 'hod_pending_complaints';
    }

    if (
      includesAny(
        'smart board',
        'smartboard',
        'teaching activity',
        'smart board activity',
        'lesson',
        'lessons today'
      )
    ) {
      return 'hod_smart_board_activity';
    }

    if (
      includesAny(
        'syllabus progress',
        'department syllabus',
        'pending topics',
        'syllabus',
        'curriculum'
      )
    ) {
      return 'hod_syllabus_progress';
    }

    if (
      includesAny(
        'department attendance',
        'department ki attendance',
        'low attendance students',
        'low attendance',
        'shortage students',
        'department students',
        'cse attendance',
        'ece attendance'
      )
    ) {
      return 'hod_department_attendance';
    }
  }

  // 4. Faculty Intents
  if (roles.includes('faculty') || roles.includes('teacher')) {
    if (
      includesAny(
        'low attendance',
        'shortage',
        'at risk',
        'risk students',
        'defaulter',
        'attendance risk'
      )
    ) {
      return 'faculty_low_attendance_students';
    }

    if (
      includesAny(
        'pending submissions',
        'submission',
        'submissions',
        'grading',
        'homework check',
        'pending assignment'
      )
    ) {
      return 'faculty_pending_submissions';
    }

    if (
      includesAny(
        'syllabus progress',
        'syllabus',
        'unit completed',
        'kitna syllabus'
      )
    ) {
      return 'faculty_syllabus_progress';
    }

    if (
      includesAny(
        'aaj meri class',
        'aaj ki class',
        'today class',
        'today\'s class',
        'next class',
        'timetable',
        'schedule',
        'lecture',
        'lectures'
      )
    ) {
      return 'faculty_today_classes';
    }
  }

  // 5. Personal / Student Intents

  // 5a. Gate Pass / Outpass
  if (
    includesAny(
      'gate pass',
      'gatepass',
      'outpass',
      'pass status',
      'bahar jana',
      'exit permit',
      'hostel pass'
    )
  ) {
    return 'my_gate_pass_status';
  }

  // 5b. Leave Application Status
  if (
    includesAny(
      'leave',
      'application',
      'chutti',
      'chhutti',
      'avkaash',
      'sick leave',
      'medical leave',
      'leave status',
      'chutti status',
      'chhutti ka status',
      'leave ka status'
    )
  ) {
    return 'my_leave_status';
  }

  // 5c. Timetable / Next Class Schedule
  if (
    includesAny(
      'next class',
      'next lecture',
      'which lecture',
      'timetable',
      'schedule',
      'classes today',
      'today classes',
      'classes do i have',
      'my classes',
      'aaj class',
      'aaj meri class',
      'class kab',
      'agli class',
      'lecture kab',
      'konsi class',
      'class timing',
      'period',
      'class schedule'
    )
  ) {
    return roles.includes('faculty') || roles.includes('teacher')
      ? 'faculty_today_classes'
      : 'my_timetable';
  }

  // 5d. Assignments & LMS Submissions
  if (
    includesAny(
      'assignment',
      'assignments',
      'submission',
      'homework',
      'pending work',
      'pending task',
      'task due',
      'deadline'
    )
  ) {
    return roles.includes('faculty') || roles.includes('teacher')
      ? 'faculty_pending_submissions'
      : 'my_assignments';
  }

  // 5e. Results / CGPA / Sessional Marks
  if (
    includesAny(
      'result',
      'results',
      'cgpa',
      'sgpa',
      'marks',
      'sessional',
      'score',
      'grade',
      'grades',
      'marks kitne',
      'kitne marks'
    )
  ) {
    return 'my_results';
  }

  // 5f. Attendance
  if (
    includesAny(
      'attendance',
      'present',
      'absent',
      'hajiri',
      'hazri',
      'kitni attendance',
      'meri attendance',
      'attendance percentage',
      'shortage'
    )
  ) {
    if (roles.includes('hod')) return 'hod_department_attendance';
    return 'my_attendance';
  }

  return 'unsupported';
}
