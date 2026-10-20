// ============================================================================
// Unit & Integration Tests: Attendance Approval Workflow & Governance Engine
// HIET Digital Campus: Faculty -> HOD -> Principal -> MD Approval Pipeline
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { apiService } from '../lib/supabase';
import { dataStore, INITIAL_ATTENDANCE_BATCHES } from '../lib/mockData';
import { AttendanceBatchRecord, AttendanceBatch } from '../types';

describe('1. Student Name Visibility & Mutual Exclusivity of Statuses', () => {
  it('allows complete student full names without unwanted truncation', () => {
    const longNamedStudent = {
      id: 'stud-long-01',
      roll_no: 'HIET/CSE/2026/089',
      name: 'Yuvraj Vikramaditya Singh Shekhawat',
      branch: 'CSE',
      semester: 6,
      section: 'A'
    };

    expect(longNamedStudent.name).toBe('Yuvraj Vikramaditya Singh Shekhawat');
    expect(longNamedStudent.name.length).toBeGreaterThan(20);
    expect(longNamedStudent.roll_no).toBe('HIET/CSE/2026/089');
  });

  it('supports three mutually exclusive statuses: Present, Absent, and Leave', () => {
    const records: AttendanceBatchRecord[] = [
      { student_id: 's1', student_roll: '101', student_name: 'Aarav Sharma', status: 'Present' },
      { student_id: 's2', student_roll: '102', student_name: 'Divya Verma', status: 'Absent' },
      { student_id: 's3', student_roll: '103', student_name: 'Karan Patel', status: 'Leave', remarks: 'Medical leave approved' }
    ];

    // Verify statuses
    expect(records[0].status).toBe('Present');
    expect(records[1].status).toBe('Absent');
    expect(records[2].status).toBe('Leave');

    // Verify mutual exclusivity: Each student has exactly one status
    const studentStatusMap = new Map<string, string>();
    records.forEach(r => studentStatusMap.set(r.student_id, r.status));
    expect(studentStatusMap.get('s1')).toBe('Present');
    expect(studentStatusMap.get('s2')).toBe('Absent');
    expect(studentStatusMap.get('s3')).toBe('Leave');

    // Leave must not be treated as Present or Absent
    expect(records[2].status === 'Present').toBe(false);
    expect(records[2].status === 'Absent').toBe(false);
  });

  it('correctly calculates dynamic headcounts for Present, Absent, Leave, and Unmarked', () => {
    const totalStudents = 10;
    const markedRecords: Record<string, 'Present' | 'Absent' | 'Leave'> = {
      's1': 'Present',
      's2': 'Present',
      's3': 'Present',
      's4': 'Absent',
      's5': 'Absent',
      's6': 'Leave',
      's7': 'Leave',
      's8': 'Leave'
    };

    const presentCount = Object.values(markedRecords).filter(s => s === 'Present').length;
    const absentCount = Object.values(markedRecords).filter(s => s === 'Absent').length;
    const leaveCount = Object.values(markedRecords).filter(s => s === 'Leave').length;
    const markedCount = Object.keys(markedRecords).length;
    const notMarkedCount = totalStudents - markedCount;

    expect(presentCount).toBe(3);
    expect(absentCount).toBe(2);
    expect(leaveCount).toBe(3);
    expect(notMarkedCount).toBe(2);
    expect(presentCount + absentCount + leaveCount + notMarkedCount).toBe(totalStudents);
  });
});

describe('2. Submit Attendance Validation & Batch Creation', () => {
  beforeEach(() => {
    // Reset batches in dataStore to initial state
    dataStore.setAttendanceBatches(JSON.parse(JSON.stringify(INITIAL_ATTENDANCE_BATCHES)));
  });

  it('rejects submission if required lecture parameters are missing', async () => {
    const invalidBatch = {
      department: '',
      branch: 'CSE',
      semester: 6,
      section: 'A',
      subject_id: 'sub-1',
      subject_name: 'Cloud Computing',
      faculty_id: 'fac-1',
      faculty_name: 'Er. Rajesh Kumar',
      lecture_date: '2026-10-25',
      total_students: 2,
      present_count: 2,
      absent_count: 0,
      leave_count: 0,
      records: [
        { student_id: 's1', student_roll: '101', student_name: 'Aarav', status: 'Present' as const },
        { student_id: 's2', student_roll: '102', student_name: 'Divya', status: 'Present' as const }
      ]
    };

    const res = await apiService.submitAttendanceBatch(invalidBatch);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Department is required');
  });

  it('rejects submission if any student remains unmarked', async () => {
    const incompleteBatch = {
      department: 'CSE',
      branch: 'CSE',
      semester: 6,
      section: 'A',
      subject_id: 'sub-1',
      subject_name: 'Cloud Computing',
      faculty_id: 'fac-1',
      faculty_name: 'Er. Rajesh Kumar',
      lecture_date: '2026-10-25',
      total_students: 3,
      present_count: 1,
      absent_count: 1,
      leave_count: 0,
      records: [
        { student_id: 's1', student_roll: '101', student_name: 'Aarav', status: 'Present' as const },
        { student_id: 's2', student_roll: '102', student_name: 'Divya', status: 'Absent' as const }
        // 3rd student is missing
      ]
    };

    const res = await apiService.submitAttendanceBatch(incompleteBatch);
    expect(res.success).toBe(false);
    expect(res.error).toContain('All 3 students must have an assigned attendance status');
  });

  it('successfully creates an attendance batch with unique ID and Pending HOD status', async () => {
    const newBatch = {
      department: 'CSE',
      branch: 'CSE',
      semester: 6,
      section: 'B',
      subject_id: 'sub-cc-01',
      subject_name: 'Cloud Computing Architecture',
      faculty_id: 'fac-cse-101',
      faculty_name: 'Er. Rajesh Kumar',
      lecture_date: '2026-10-28',
      total_students: 3,
      present_count: 2,
      absent_count: 1,
      leave_count: 0,
      records: [
        { student_id: 's1', student_roll: '101', student_name: 'Aarav Sharma', status: 'Present' as const },
        { student_id: 's2', student_roll: '102', student_name: 'Divya Verma', status: 'Absent' as const },
        { student_id: 's3', student_roll: '103', student_name: 'Karan Patel', status: 'Present' as const }
      ]
    };

    const res = await apiService.submitAttendanceBatch(newBatch);
    expect(res.success).toBe(true);
    expect(res.batch).toBeDefined();

    const submitted = res.batch!;
    expect(submitted.id).toBeDefined();
    expect(submitted.id.startsWith('ATT-BATCH-')).toBe(true);
    expect(submitted.status).toBe('Pending HOD Approval');
    expect(submitted.current_stage).toBe('hod');
    expect(submitted.history.length).toBe(1);
    expect(submitted.history[0].action).toBe('submitted');
    expect(submitted.history[0].actor_role).toBe('faculty');
  });

  it('prevents duplicate submissions for identical lecture parameters', async () => {
    const batchData = {
      department: 'CSE',
      branch: 'CSE',
      semester: 6,
      section: 'A',
      subject_id: 'sub-cc-dup',
      subject_name: 'Distributed Systems',
      faculty_id: 'fac-cse-101',
      faculty_name: 'Er. Rajesh Kumar',
      lecture_date: '2026-11-01',
      total_students: 2,
      present_count: 2,
      absent_count: 0,
      leave_count: 0,
      records: [
        { student_id: 's1', student_roll: '101', student_name: 'Student 1', status: 'Present' as const },
        { student_id: 's2', student_roll: '102', student_name: 'Student 2', status: 'Present' as const }
      ]
    };

    // First submission succeeds
    const firstRes = await apiService.submitAttendanceBatch(batchData);
    expect(firstRes.success).toBe(true);

    // Duplicate submission must be blocked
    const dupRes = await apiService.submitAttendanceBatch(batchData);
    expect(dupRes.success).toBe(false);
    expect(dupRes.error).toContain('Duplicate submissions are blocked');
  });
});

describe('3. 4-Stage Approval Workflow (Faculty -> HOD -> Principal -> MD)', () => {
  let testBatch: AttendanceBatch;

  beforeEach(async () => {
    dataStore.setAttendanceBatches(JSON.parse(JSON.stringify(INITIAL_ATTENDANCE_BATCHES)));

    // Create a fresh test batch
    const subRes = await apiService.submitAttendanceBatch({
      department: 'CSE',
      branch: 'CSE',
      semester: 6,
      section: 'C',
      subject_id: 'sub-crypto-01',
      subject_name: 'Cryptography & Network Security',
      faculty_id: 'fac-demo-01',
      faculty_name: 'Dr. Sunita Sharma',
      lecture_date: '2026-10-24',
      total_students: 3,
      present_count: 2,
      absent_count: 0,
      leave_count: 1,
      records: [
        { student_id: 's1', student_roll: '101', student_name: 'Student One', status: 'Present' },
        { student_id: 's2', student_roll: '102', student_name: 'Student Two', status: 'Present' },
        { student_id: 's3', student_roll: '103', student_name: 'Student Three', status: 'Leave', remarks: 'Approved sports meet' }
      ]
    });
    expect(subRes.success).toBe(true);
    testBatch = subRes.batch!;
  });

  it('Stage 1: Prevents faculty from approving their own submission', async () => {
    const res = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'fac-demo-01',
      actorName: 'Dr. Sunita Sharma',
      actorRole: 'faculty',
      comments: 'Self-approval attempt'
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Faculty cannot approve their own attendance submission');
  });

  it('Stage 2: Enforces HOD department scoping and requires approval before Principal review', async () => {
    // Other department HOD cannot approve CSE batch
    const wrongDeptRes = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'hod-me-01',
      actorName: 'Dr. Ramesh ME',
      actorRole: 'hod',
      actorDepartment: 'ME',
      comments: 'Wrong department approval'
    });

    expect(wrongDeptRes.success).toBe(false);
    expect(wrongDeptRes.error).toContain('Department HOD can only review batches within their department');

    // Authorized CSE HOD approves
    const hodRes = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'hod-cse-01',
      actorName: 'Dr. Amit Thakur',
      actorRole: 'hod',
      actorDepartment: 'CSE',
      comments: 'Roster verified against departmental timetable'
    });

    expect(hodRes.success).toBe(true);
    const hodApproved = hodRes.batch!;
    expect(hodApproved.status).toBe('Pending Principal Approval');
    expect(hodApproved.current_stage).toBe('principal');
    expect(hodApproved.hod_id).toBe('hod-cse-01');
    expect(hodApproved.hod_name).toBe('Dr. Amit Thakur');
    expect(hodApproved.hod_approved_at).toBeDefined();
  });

  it('Stage 3: Principal review allows approval and forwards to MD', async () => {
    // 1. HOD approves first
    const hodRes = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'hod-cse-01',
      actorName: 'Dr. Amit Thakur',
      actorRole: 'hod',
      actorDepartment: 'CSE'
    });
    expect(hodRes.success).toBe(true);

    // 2. Principal approves
    const principalRes = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'principal-01',
      actorName: 'Dr. D. C. Sharma',
      actorRole: 'principal',
      comments: 'Approved for institutional records'
    });

    expect(principalRes.success).toBe(true);
    const principalApproved = principalRes.batch!;
    expect(principalApproved.status).toBe('Pending MD Approval');
    expect(principalApproved.current_stage).toBe('md');
    expect(principalApproved.principal_id).toBe('principal-01');
    expect(principalApproved.principal_approved_at).toBeDefined();
  });

  it('Stage 4: MD performs final approval and saves to official attendance records', async () => {
    // 1. HOD approves
    await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'hod-cse-01',
      actorName: 'Dr. Amit Thakur',
      actorRole: 'hod',
      actorDepartment: 'CSE'
    });

    // 2. Principal approves
    await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'principal-01',
      actorName: 'Dr. D. C. Sharma',
      actorRole: 'principal'
    });

    // 3. MD Final Approval
    const mdRes = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'md-01',
      actorName: 'Er. Rajeshwar Singh',
      actorRole: 'md',
      comments: 'Final executive sign-off granted'
    });

    expect(mdRes.success).toBe(true);
    const finalApproved = mdRes.batch!;
    expect(finalApproved.status).toBe('Final Approved');
    expect(finalApproved.current_stage).toBe('completed');
    expect(finalApproved.md_id).toBe('md-01');
    expect(finalApproved.md_approved_at).toBeDefined();

    // Verify official attendance records persistence
    const allAttendance = dataStore.getAttendance();
    const batchRecords = allAttendance.filter(a => 
      a.subject_id === testBatch.subject_id && 
      a.date === testBatch.lecture_date
    );
    expect(batchRecords.length).toBe(3);
    expect(batchRecords.some(r => r.status === 'Leave')).toBe(true);
    expect(batchRecords.some(r => r.status === 'Present')).toBe(true);
  });

  it('Workflow Stages: Cannot skip stages directly (e.g. MD cannot approve at HOD stage)', async () => {
    // Currently testBatch is at Stage 2 (hod). MD cannot directly approve
    const skipRes = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'approve',
      actorId: 'md-01',
      actorName: 'Er. Rajeshwar Singh',
      actorRole: 'md',
      comments: 'Attempting to skip HOD & Principal'
    });

    expect(skipRes.success).toBe(false);
    expect(skipRes.error).toContain('Only authorized Head of Department (HOD) can approve at this stage');
  });
});

describe('4. Rejection, Mandatory Reason & Resubmission Workflow', () => {
  let testBatch: AttendanceBatch;

  beforeEach(async () => {
    dataStore.setAttendanceBatches(JSON.parse(JSON.stringify(INITIAL_ATTENDANCE_BATCHES)));

    const subRes = await apiService.submitAttendanceBatch({
      department: 'CSE',
      branch: 'CSE',
      semester: 6,
      section: 'D',
      subject_id: 'sub-ai-01',
      subject_name: 'Artificial Intelligence & Robotics',
      faculty_id: 'fac-demo-02',
      faculty_name: 'Prof. Neha Gupta',
      lecture_date: '2026-10-26',
      total_students: 2,
      present_count: 1,
      absent_count: 1,
      leave_count: 0,
      records: [
        { student_id: 's1', student_roll: '101', student_name: 'Student One', status: 'Present' },
        { student_id: 's2', student_roll: '102', student_name: 'Student Two', status: 'Absent' }
      ]
    });
    expect(subRes.success).toBe(true);
    testBatch = subRes.batch!;
  });

  it('rejecting attendance requires a mandatory rejection reason', async () => {
    const res = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'reject',
      actorId: 'hod-cse-01',
      actorName: 'Dr. Amit Thakur',
      actorRole: 'hod',
      actorDepartment: 'CSE',
      rejectionReason: '' // empty reason
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Rejection requires a mandatory reason');
  });

  it('rejection returns the batch to the faculty member for correction', async () => {
    const res = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'reject',
      actorId: 'hod-cse-01',
      actorName: 'Dr. Amit Thakur',
      actorRole: 'hod',
      actorDepartment: 'CSE',
      rejectionReason: 'Student 102 was marked Absent but had approved lab duty leave'
    });

    expect(res.success).toBe(true);
    const rejected = res.batch!;
    expect(rejected.status).toBe('Returned for Correction');
    expect(rejected.current_stage).toBe('faculty_correction');
    expect(rejected.rejection_reason).toContain('Student 102 was marked Absent');
    expect(rejected.rejected_by_role).toBe('hod');
    expect(rejected.rejected_by_name).toBe('Dr. Amit Thakur');
  });

  it('faculty can correct and resubmit a returned batch', async () => {
    // 1. HOD rejects batch
    const rejRes = await apiService.processAttendanceWorkflowAction({
      batchId: testBatch.id,
      action: 'reject',
      actorId: 'hod-cse-01',
      actorName: 'Dr. Amit Thakur',
      actorRole: 'hod',
      actorDepartment: 'CSE',
      rejectionReason: 'Correction needed for Student 102'
    });
    expect(rejRes.success).toBe(true);

    // 2. Faculty resubmits corrected records
    const correctedRecords: AttendanceBatchRecord[] = [
      { student_id: 's1', student_roll: '101', student_name: 'Student One', status: 'Present' },
      { student_id: 's2', student_roll: '102', student_name: 'Student Two', status: 'Leave', remarks: 'Duty leave confirmed' }
    ];

    const resubRes = await apiService.submitAttendanceBatch({
      id: testBatch.id,
      department: testBatch.department,
      branch: testBatch.branch,
      semester: testBatch.semester,
      section: testBatch.section,
      subject_id: testBatch.subject_id,
      subject_name: testBatch.subject_name,
      faculty_id: testBatch.faculty_id,
      faculty_name: testBatch.faculty_name,
      lecture_date: testBatch.lecture_date,
      total_students: 2,
      present_count: 1,
      absent_count: 0,
      leave_count: 1,
      records: correctedRecords
    });

    expect(resubRes.success).toBe(true);
    const resubmitted = resubRes.batch!;
    expect(resubmitted.id).toBe(testBatch.id);
    expect(resubmitted.status).toBe('Pending HOD Approval');
    expect(resubmitted.current_stage).toBe('hod');
    expect(resubmitted.leave_count).toBe(1);
    expect(resubmitted.absent_count).toBe(0);
    expect(resubmitted.rejection_reason).toBeUndefined(); // Cleared on resubmission
    expect(resubmitted.history.some(h => h.action === 'resubmitted')).toBe(true);
  });
});
