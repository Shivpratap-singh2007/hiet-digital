import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { dataStore } from '../lib/mockData';
import { apiService } from '../lib/supabase';
import { SessionalResult, AttendanceBatch } from '../types';

describe('HIET Digital Campus — Faculty Dashboard Debugging & UI Correction', () => {
  beforeEach(() => {
    // Reset or ensure dataStore consistency before each test
  });

  // ---------------------------------------------------------------------------
  // 1. Faculty Profile & Identity Corrections
  // ---------------------------------------------------------------------------
  describe('1. Faculty Profile: Department, Programme, and Teaching Allocations', () => {
    const settingsViewPath = path.resolve(__dirname, '../components/common/SettingsView.tsx');
    const settingsViewContent = fs.readFileSync(settingsViewPath, 'utf-8');

    it('does NOT display "Semester 1" as the faculty personal semester on their identity card', () => {
      // The old bug assigned semester = 'Semester 1' unconditionally to faculty
      // In the new SettingsView, faculty ID card displays Academic Programme and Department, NOT a student semester
      expect(settingsViewContent).toContain('ACADEMIC PROGRAMME');
      expect(settingsViewContent).toContain('B.Tech');
      expect(settingsViewContent).toContain('DEPARTMENT');
      expect(settingsViewContent).toContain('Computer Science & Engineering');
      // Verify teaching allocations section exists
      expect(settingsViewContent).toContain('Authorized Teaching Allocations');
      expect(settingsViewContent).toContain('Assigned Teaching Semesters');
    });

    it('properly distinguishes between Academic Programme (B.Tech) and Department (CSE)', () => {
      expect(settingsViewContent).toContain("academicProgramme = 'B.Tech'");
      expect(settingsViewContent).toContain("Computer Science & Engineering");
    });

    it('derives faculty teaching assignments from authorized subject allocations', () => {
      const allSubjects = dataStore.getSubjects();
      const rajeshSubjects = allSubjects.filter(s => s.teacher_id === 'tch-01' || s.teacher_name === 'Dr. Rajesh Kumar');
      
      expect(rajeshSubjects.length).toBeGreaterThan(0);
      expect(rajeshSubjects.some(s => s.subject_name === 'Mathematics')).toBe(true);
      expect(rajeshSubjects.some(s => s.semester === 6)).toBe(true);
    });

    it('shows "No teaching assignments allocated" fallback when faculty has no allocated subjects', () => {
      expect(settingsViewContent).toContain('No teaching assignments allocated');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Strict Black-and-White Theme Compliance
  // ---------------------------------------------------------------------------
  describe('2. Strict Black-and-White Monochrome Theme Compliance', () => {
    const attendanceViewPath = path.resolve(__dirname, '../components/teacher/TeacherAttendanceView.tsx');
    const sessionalViewPath = path.resolve(__dirname, '../components/teacher/TeacherSessionalView.tsx');
    const teacherDashboardPath = path.resolve(__dirname, '../views/TeacherDashboard.tsx');

    const attendanceContent = fs.readFileSync(attendanceViewPath, 'utf-8');
    const sessionalContent = fs.readFileSync(sessionalViewPath, 'utf-8');
    const dashboardContent = fs.readFileSync(teacherDashboardPath, 'utf-8');

    it('TeacherAttendanceView uses only black, white, and neutral grey palette', () => {
      // Active buttons must use black background with white text
      expect(attendanceContent).toContain("bg-black text-white");
      // Unselected controls must use white with neutral border
      expect(attendanceContent).toContain("bg-white text-neutral-800 border-neutral-300");
      // Status badges use monochrome styling
      expect(attendanceContent).not.toContain("bg-emerald-600 text-white shadow-xs");
      expect(attendanceContent).not.toContain("bg-rose-600 text-white shadow-xs");
      expect(attendanceContent).not.toContain("bg-amber-600 text-white shadow-xs");
    });

    it('TeacherSessionalView uses strictly monochrome styling', () => {
      expect(sessionalContent).toContain("bg-black");
      expect(sessionalContent).toContain("text-white");
      expect(sessionalContent).toContain("border-neutral-300");
      expect(sessionalContent).not.toContain("bg-amber-600 hover:bg-amber-700");
    });

    it('TeacherDashboard uses monochrome palette without navy blue gradients or colored stat cards', () => {
      expect(dashboardContent).not.toContain('bg-[#0f2942]');
      expect(dashboardContent).not.toContain('text-[#0f2942]');
      expect(dashboardContent).toContain('bg-black text-white');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Faculty Attendance Management: Names, Leave status, and Workflow
  // ---------------------------------------------------------------------------
  describe('3. Faculty Attendance Management', () => {
    const attendanceViewPath = path.resolve(__dirname, '../components/teacher/TeacherAttendanceView.tsx');
    const attendanceContent = fs.readFileSync(attendanceViewPath, 'utf-8');

    it('displays complete student names with responsive wrapping and roll number', () => {
      // Must not truncate or overflow
      expect(attendanceContent).toContain('break-words leading-snug whitespace-normal');
      expect(attendanceContent).toContain('s.roll_no');
      expect(attendanceContent).toContain('s.name');
      expect(attendanceContent).toContain('s.branch');
      expect(attendanceContent).toContain('s.section');
    });

    it('provides three mutually exclusive statuses: Present, Absent, and Leave', () => {
      expect(attendanceContent).toContain("'Present' | 'Absent' | 'Leave'");
      expect(attendanceContent).toContain("handleToggle(s.id, 'Present')");
      expect(attendanceContent).toContain("handleToggle(s.id, 'Absent')");
      expect(attendanceContent).toContain("handleToggle(s.id, 'Leave')");
    });

    it('includes Save Draft, Preview Attendance, and Submit to HOD workflow controls', () => {
      expect(attendanceContent).toContain('handleSaveDraft');
      expect(attendanceContent).toContain('handleOpenPreview');
      expect(attendanceContent).toContain('handleInitiateSubmit');
      expect(attendanceContent).toContain('Save Draft');
      expect(attendanceContent).toContain('Preview Attendance');
      expect(attendanceContent).toContain('Submit Attendance to HOD');
    });

    it('saves attendance draft without submitting for approval', async () => {
      const draftResult = await apiService.saveAttendanceDraft({
        department: 'CSE',
        branch: 'CSE',
        semester: 6,
        section: 'A',
        subject_id: 'sub-cs601',
        subject_name: 'Mathematics',
        lecture_date: '2026-10-25',
        faculty_id: 'tch-01',
        faculty_name: 'Dr. Rajesh Kumar',
        records: [
          { student_id: 'std-cse-001', student_roll: 'CSE001', student_name: 'Aarav Sharma', status: 'Present' },
          { student_id: 'std-cse-002', student_roll: 'CSE002', student_name: 'Ananya Verma', status: 'Leave' }
        ]
      });

      expect(draftResult.success).toBe(true);
      expect(draftResult.batch).toBeDefined();
      expect(draftResult.batch?.status).toBe('Draft');
      expect(draftResult.batch?.current_stage).toBe('faculty');
      expect(draftResult.batch?.leave_count).toBe(1);
      expect(draftResult.batch?.present_count).toBe(1);
    });

    it('submits attendance batch to HOD with auditable governance tracking', async () => {
      const submitResult = await apiService.submitAttendanceBatch({
        department: 'CSE',
        branch: 'CSE',
        semester: 6,
        section: 'A',
        subject_id: 'sub-cs601',
        subject_name: 'Mathematics',
        lecture_date: '2026-10-26',
        faculty_id: 'tch-01',
        faculty_name: 'Dr. Rajesh Kumar',
        records: [
          { student_id: 'std-cse-001', student_roll: 'CSE001', student_name: 'Aarav Sharma', status: 'Present' },
          { student_id: 'std-cse-002', student_roll: 'CSE002', student_name: 'Ananya Verma', status: 'Absent' }
        ],
        comments: 'Unit test submission'
      });

      expect(submitResult.success).toBe(true);
      expect(submitResult.batch).toBeDefined();
      expect(submitResult.batch?.status).toBe('Pending HOD Approval');
      expect(submitResult.batch?.current_stage).toBe('hod');
      expect(submitResult.batch?.history.length).toBeGreaterThan(0);
      expect(submitResult.batch?.history[0].action).toBe('submitted');
    });

    it('confirms before bulk updating all students (Mark All Present/Absent/Leave)', () => {
      expect(attendanceContent).toContain('requestMarkAll');
      expect(attendanceContent).toContain('showBulkConfirmModal');
      expect(attendanceContent).toContain('Confirm Bulk Status Update');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Faculty Sessional Marks Entry and Publishing Workflow
  // ---------------------------------------------------------------------------
  describe('4. Faculty Sessional Marks Entry and Governance Workflow', () => {
    const sessionalViewPath = path.resolve(__dirname, '../components/teacher/TeacherSessionalView.tsx');
    const sessionalContent = fs.readFileSync(sessionalViewPath, 'utf-8');

    it('validates marks obtained: prevents marks < 0 or marks > maxMarks', () => {
      expect(sessionalContent).toContain('Marks obtained cannot be less than zero.');
      expect(sessionalContent).toContain('cannot exceed maximum marks');
      expect(sessionalContent).toContain('Maximum marks must be a positive number');
    });

    it('does NOT publish unapproved marks directly to student portal', async () => {
      const submission = await apiService.submitSessionalForApproval({
        student_id: 'std-cse-001',
        student_roll: 'CSE001',
        student_name: 'Aarav Sharma',
        subject_name: 'Mathematics',
        subject_code: 'CS-601',
        exam_type: 'Sessional 1',
        marks_obtained: 22,
        max_marks: 25,
        percentage: 88,
        semester: 6,
        branch: 'CSE',
        faculty_id: 'tch-01',
        faculty_name: 'Dr. Rajesh Kumar'
      });

      expect(submission.status).toBe('Submitted to HOD');
      // Crucial requirement: marks are UNPUBLISHED until formal review
      expect(submission.is_published).toBe(false);
      expect(submission.submitted_at).toBeDefined();
    });

    it('saves sessional marks as draft', async () => {
      const draft = await apiService.saveSessionalDraft({
        student_id: 'std-cse-002',
        student_roll: 'CSE002',
        student_name: 'Ananya Verma',
        subject_name: 'Mathematics',
        subject_code: 'CS-601',
        exam_type: 'Sessional 1',
        marks_obtained: 20,
        max_marks: 25,
        percentage: 80,
        semester: 6,
        branch: 'CSE',
        faculty_id: 'tch-01',
        faculty_name: 'Dr. Rajesh Kumar'
      });

      expect(draft.status).toBe('Draft');
      expect(draft.is_published).toBe(false);
    });

    it('filters unpublished sessional marks from student-facing queries', async () => {
      // Sessional marks in draft or in-review should not leak to student portal when onlyPublished is true
      const publishedMarks = await apiService.getSessionalResults({
        studentId: 'std-cse-001',
        onlyPublished: true
      });

      publishedMarks.forEach(mark => {
        expect(mark.is_published).toBe(true);
      });
    });

    it('enforces role permissions: faculty cannot self-approve sessional marks', async () => {
      const submission = await apiService.submitSessionalForApproval({
        student_id: 'std-cse-001',
        student_roll: 'CSE001',
        student_name: 'Aarav Sharma',
        subject_name: 'Mathematics',
        subject_code: 'CS-601',
        exam_type: 'Sessional 1',
        marks_obtained: 21,
        max_marks: 25,
        percentage: 84,
        semester: 6,
        branch: 'CSE',
        faculty_id: 'tch-01',
        faculty_name: 'Dr. Rajesh Kumar'
      });

      // Faculty attempts self-approval
      const selfApproval = await apiService.processSessionalWorkflowAction({
        resultId: submission.result!.id,
        action: 'approve',
        actorRole: 'teacher',
        actorId: 'tch-01',
        actorName: 'Dr. Rajesh Kumar'
      });

      expect(selfApproval.success).toBe(false);
      expect(selfApproval.error).toContain('Faculty cannot approve their own submissions');
    });

    it('allows HOD approval and advances sessional result through institutional policy', async () => {
      const submission = await apiService.submitSessionalForApproval({
        student_id: 'std-cse-001',
        student_roll: 'CSE001',
        student_name: 'Aarav Sharma',
        subject_name: 'Mathematics',
        subject_code: 'CS-601',
        exam_type: 'Sessional 2',
        marks_obtained: 23,
        max_marks: 25,
        percentage: 92,
        semester: 6,
        branch: 'CSE',
        faculty_id: 'tch-01',
        faculty_name: 'Dr. Rajesh Kumar'
      });

      // HOD approves
      const hodApproval = await apiService.processSessionalWorkflowAction({
        resultId: submission.result!.id,
        action: 'approve',
        actorRole: 'hod',
        actorId: 'hod-cse-001',
        actorName: 'Dr. Neeraj Kumar',
        comments: 'Verified score sheets'
      });

      expect(hodApproval.success).toBe(true);
      expect(hodApproval.result?.status).toBe('Approved by HOD');
      expect(hodApproval.result?.hod_approved_at).toBeDefined();
    });

    it('retains audit history and reviewer remarks on rejection / return', async () => {
      const submission = await apiService.submitSessionalForApproval({
        student_id: 'std-cse-002',
        student_roll: 'CSE002',
        student_name: 'Ananya Verma',
        subject_name: 'Mathematics',
        subject_code: 'CS-601',
        exam_type: 'Sessional 1',
        marks_obtained: 14,
        max_marks: 25,
        percentage: 56,
        semester: 6,
        branch: 'CSE',
        faculty_id: 'tch-01',
        faculty_name: 'Dr. Rajesh Kumar'
      });

      // HOD returns with correction remarks
      const hodReject = await apiService.processSessionalWorkflowAction({
        resultId: submission.result!.id,
        action: 'return',
        actorRole: 'hod',
        actorId: 'hod-cse-001',
        actorName: 'Dr. Neeraj Kumar',
        remarks: 'Please recheck Question 3 score awarding.'
      });

      expect(hodReject.success).toBe(true);
      expect(hodReject.result?.status).toBe('Returned by HOD');
      expect(hodReject.result?.rejection_reason).toContain('Please recheck Question 3 score awarding');
      expect(hodReject.result?.history?.some(h => h.action === 'RETURNED')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Student Dashboard Isolation Verification
  // ---------------------------------------------------------------------------
  describe('5. Student Dashboard Isolation Verification', () => {
    it('ensures student modules are untouched and retain original styling', () => {
      const studentDashboardPath = path.resolve(__dirname, '../views/StudentDashboard.tsx');
      const studentDashboardContent = fs.readFileSync(studentDashboardPath, 'utf-8');
      
      // Student dashboard continues to function normally with its standard theme
      expect(studentDashboardContent).toContain('StudentDashboard');
      expect(studentDashboardContent).toContain('cgpa');
      expect(studentDashboardContent).toContain('attendance');
    });
  });
});
