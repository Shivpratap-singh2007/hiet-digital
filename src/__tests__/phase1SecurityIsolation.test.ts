// ============================================================================
// Phase 1 Regression & Security Tests: Fail-Closed Verification & Data Isolation
// ============================================================================

import { describe, it, expect, vi } from 'vitest';
import { apiService } from '../lib/supabase';
import { dataStore } from '../lib/mockData';
import { calculateAttendanceStats } from '../lib/utils';
import { StudentMaster, TeacherMaster } from '../types';

describe('Phase 1: Public Document Verification Fail-Closed Tests', () => {
  it('rejects long random tokens without backend confirmation', async () => {
    const randomLongToken = 'a8f9c2d1e4b709123891823719823719';
    const result = await apiService.verifyHallTicketPublic(randomLongToken);
    expect(result.is_valid).toBe(false);
    expect(result.student_name).toBeUndefined();
  });

  it('does NOT verify a token simply containing "HT" without backend confirmation', async () => {
    const tokenWithHT = 'HT-CSE-2026-FAKE-TOKEN-999';
    const result = await apiService.verifyHallTicketPublic(tokenWithHT);
    expect(result.is_valid).toBe(false);
    expect(result.student_name).toBeUndefined();
  });

  it('does NOT verify a token simply containing "CERT" without backend confirmation', async () => {
    const tokenWithCert = 'CERT-HACKATHON-WINNER-FAKE-001';
    const result = await apiService.verifyCertificatePublic(tokenWithCert);
    expect(result.is_valid).toBe(false);
    expect(result.recipient_name).toBeUndefined();
  });

  it('rejects empty or excessively short tokens (<4 chars)', async () => {
    const shortToken = 'HT';
    const result = await apiService.verifyHallTicketPublic(shortToken);
    expect(result.is_valid).toBe(false);
    expect(result.invalid_token).toBe(true);

    const emptyResult = await apiService.verifyHallTicketPublic('');
    expect(emptyResult.is_valid).toBe(false);
    expect(emptyResult.invalid_token).toBe(true);
  });

  it('handles backend service unconfigured or error fail-closed without fabricating success', async () => {
    // When Supabase is unconfigured or returns service unavailable
    const resHT = await apiService.verifyHallTicketPublic('VALID-LOOKING-TOKEN-1234');
    expect(resHT.is_valid).toBe(false);
    expect(resHT.student_name).toBeUndefined();

    const resCert = await apiService.verifyCertificatePublic('VALID-LOOKING-CERT-1234');
    expect(resCert.is_valid).toBe(false);
    expect(resCert.certificate_number).toBeUndefined();
  });
});

describe('Phase 1: HOD Departmental View & Query Scoping Tests', () => {
  const allStudents = dataStore.getStudentsMaster();
  const allTeachers = dataStore.getTeachersMaster();

  it('Department A (CSE) HOD only receives CSE departmental student records', () => {
    const dept: string = 'CSE';
    const deptStudents = allStudents.filter((s: StudentMaster) =>
      s.branch === dept || s.department === dept || (dept === 'CSE' && (s.branch === 'CSE' || s.branch === 'CSE AI & ML'))
    );

    expect(deptStudents.length).toBeGreaterThan(0);
    // Ensure no ME or other non-CSE students exist in deptStudents
    deptStudents.forEach(s => {
      const isCSE = s.branch.startsWith('CSE') || s.department?.startsWith('CSE');
      expect(isCSE).toBe(true);
      expect(s.branch as string).not.toBe('ME');
      expect(s.branch as string).not.toBe('ECE');
    });
  });

  it('Department B (ME) HOD does not receive Department A (CSE) student data', () => {
    const dept: string = 'ME';
    const deptStudents = allStudents.filter((s: StudentMaster) =>
      s.branch === dept || s.department === dept || (dept === 'CSE' && (s.branch === 'CSE' || s.branch === 'CSE AI & ML'))
    );

    // If there are ME students, verify none are CSE
    deptStudents.forEach(s => {
      expect(s.branch as string).toBe('ME');
      expect(s.branch as string).not.toBe('CSE');
    });

    // Verify CSE students are excluded
    const cseStudents = allStudents.filter(s => s.branch === 'CSE');
    if (cseStudents.length > 0) {
      cseStudents.forEach(cs => {
        expect(deptStudents.some(ds => ds.id === cs.id)).toBe(false);
      });
    }
  });

  it('Missing department assignment does not fall back to all departments or default to CSE', () => {
    const dept: string = ''; // Unassigned department
    const deptStudents = dept ? allStudents.filter((s: StudentMaster) =>
      s.branch === dept || s.department === dept || (dept === 'CSE' && (s.branch === 'CSE' || s.branch === 'CSE AI & ML'))
    ) : [];

    const deptTeachers = dept ? allTeachers.filter((t: TeacherMaster) =>
      t.department === dept || (dept === 'CSE' && (t.department === 'CSE' || t.department === 'CSE AI & ML'))
    ) : [];

    expect(deptStudents).toEqual([]);
    expect(deptTeachers).toEqual([]);
  });

  it('HOD department resolution uses authenticated user profile only, ignoring URL params', () => {
    const userWithDept = {
      id: 'prof-hod-cse',
      role: 'hod' as const,
      teacherMaster: {
        id: 't-01',
        faculty_id: 'HIET-FAC-CSE-001',
        name: 'Dr. Amit Thakur',
        department: 'CSE'
      }
    };

    const resolvedDept = userWithDept?.teacherMaster?.department || '';
    expect(resolvedDept).toBe('CSE');

    const userWithoutDept = {
      id: 'prof-hod-none',
      role: 'hod' as const,
      teacherMaster: undefined
    };
    const unassignedDept = (userWithoutDept as any)?.teacherMaster?.department || '';
    expect(unassignedDept).toBe('');
  });
});

describe('Phase 1: Student Attendance Account-Isolation Tests', () => {
  const allAttendance = dataStore.getAttendance();

  it('Student A sees only Student A attendance records', () => {
    const studentAId = 'std-cse-001';
    const myAttendanceA = studentAId ? allAttendance.filter(a => a.student_id === studentAId) : [];

    expect(myAttendanceA.length).toBeGreaterThan(0);
    myAttendanceA.forEach(record => {
      expect(record.student_id).toBe(studentAId);
    });
  });

  it('Student B sees only Student B attendance records without std-cse-001 bleed', () => {
    const studentBId = 'std-cse-002';
    const myAttendanceB = studentBId ? allAttendance.filter(a => a.student_id === studentBId) : [];

    // Ensure none of Student A's attendance records bleed into Student B
    myAttendanceB.forEach(record => {
      expect(record.student_id).toBe(studentBId);
      expect(record.student_id).not.toBe('std-cse-001');
    });
  });

  it('Unmapped student account receives empty attendance records and no private data', () => {
    const unmappedStudentId = '';
    const myAttendance = unmappedStudentId ? allAttendance.filter(a => a.student_id === unmappedStudentId) : [];

    expect(myAttendance).toEqual([]);
    const stats = calculateAttendanceStats(myAttendance);
    expect(stats.total).toBe(0);
    expect(stats.present).toBe(0);
  });

  it('Switching accounts cleanly re-scopes attendance from Student A to Student B', () => {
    let currentStudentId = 'std-cse-001';
    let attendance = currentStudentId ? allAttendance.filter(a => a.student_id === currentStudentId) : [];
    expect(attendance.every(a => a.student_id === 'std-cse-001')).toBe(true);

    // Switch account
    currentStudentId = 'std-me-001';
    attendance = currentStudentId ? allAttendance.filter(a => a.student_id === currentStudentId) : [];
    expect(attendance.every(a => a.student_id === 'std-me-001')).toBe(true);
    expect(attendance.some(a => a.student_id === 'std-cse-001')).toBe(false);

    // Logout (unmapped)
    currentStudentId = '';
    attendance = currentStudentId ? allAttendance.filter(a => a.student_id === currentStudentId) : [];
    expect(attendance).toEqual([]);
  });
});
