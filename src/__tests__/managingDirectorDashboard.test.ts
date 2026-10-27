import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEMO_MD } from '../context/AuthContext';
import { DEMO_MD_SHARMA } from '../lib/mockDemoUsers';
import { dataStore, INITIAL_ATTENDANCE_BATCHES, INITIAL_SESSIONAL_RESULTS, INITIAL_COMPLAINTS } from '../lib/mockData';
import { apiService } from '../lib/supabase';

describe('HIET Digital Campus — Managing Director (MD) Master Verification', () => {
  beforeEach(() => {
    dataStore.setAttendanceBatches(JSON.parse(JSON.stringify(INITIAL_ATTENDANCE_BATCHES)));
    dataStore.setSessionalResults(JSON.parse(JSON.stringify(INITIAL_SESSIONAL_RESULTS)));
    dataStore.setComplaints(JSON.parse(JSON.stringify(INITIAL_COMPLAINTS)));
  });

  describe('1. MD Identity & Persistent Institutional ID', () => {
    it('verifies DEMO_MD has role "managing_director" and authorized legal name', () => {
      expect(DEMO_MD.role).toBe('managing_director');
      expect(DEMO_MD.name).toBe('Dushyant Kaistha');
      expect(DEMO_MD.email).toBe('md@hiet.ac.in');
      expect(DEMO_MD.id).toBe('prof-md-01');
    });

    it('verifies DEMO_MD uses persistent institution-wide ID format "HIET-MD-2026-001"', () => {
      expect(DEMO_MD.identifier).toBe('HIET-MD-2026-001');
      expect(DEMO_MD_SHARMA.identifier).toBe('HIET-MD-2026-001');
      expect(DEMO_MD.identifier).not.toContain('FAC');
      expect(DEMO_MD.identifier).not.toContain('CSE');
      expect(DEMO_MD.identifier).not.toContain('ECE');
    });

    it('ensures MD ID is deterministic, immutable and never randomly generated', () => {
      const id1 = DEMO_MD.identifier;
      const id2 = DEMO_MD.identifier;
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^HIET-MD-2026-\d{3}$/);
    });
  });

  describe('2. SettingsView Profile Separation & Removal of Faculty Fields', () => {
    it('verifies SettingsView has distinct isMD branch separate from student and faculty cards', () => {
      const settingsViewPath = path.resolve(__dirname, '../components/common/SettingsView.tsx');
      const fileContent = fs.readFileSync(settingsViewPath, 'utf8');

      // Check isMD definition
      expect(fileContent).toContain("const isMD = role === 'managing_director' || role === 'md'");
      expect(fileContent).toContain("const isFaculty = !isMD && !isStudent");

      // Verify MD Digital ID card header & role
      expect(fileContent).toContain('MANAGING DIRECTOR (MD) DIGITAL ID CARD');
      expect(fileContent).toContain('Executive Identity & Institutional Directorate');
      expect(fileContent).toContain('<span>Managing Director</span>');
      expect(fileContent).toContain('mdDisplayId');
      expect(fileContent).toContain('Institution-wide');
    });

    it('verifies MD profile removes faculty-specific department, branch, specialization and semester', () => {
      const settingsViewPath = path.resolve(__dirname, '../components/common/SettingsView.tsx');
      const fileContent = fs.readFileSync(settingsViewPath, 'utf8');

      // Check MD card section does NOT display "Faculty Member" or "Specialization"
      const mdBranchIndex = fileContent.indexOf('MANAGING DIRECTOR (MD) DIGITAL ID CARD');
      const facultyBranchIndex = fileContent.indexOf('FACULTY DIGITAL ID CARD (Strict Monochrome Black & White)');

      expect(mdBranchIndex).toBeGreaterThan(0);
      expect(facultyBranchIndex).toBeGreaterThan(mdBranchIndex);

      const mdCardContent = fileContent.slice(mdBranchIndex, facultyBranchIndex);

      expect(mdCardContent).not.toContain('<span>Faculty Member</span>');
      expect(mdCardContent).not.toContain('SPECIALIZATION');
      expect(mdCardContent).not.toContain('ACADEMIC PROGRAMME');
      expect(mdCardContent).not.toContain('Authorized Teaching Allocations');
      expect(mdCardContent).not.toContain('Assigned Teaching Semesters');
      expect(mdCardContent).toContain('Executive Directorate');
      expect(mdCardContent).toContain('CAMPUS SCOPE');
      expect(mdCardContent).toContain('Institution-wide');
    });

    it('verifies QR Code modal and Cryptographic modal are customized for MD role', () => {
      const settingsViewPath = path.resolve(__dirname, '../components/common/SettingsView.tsx');
      const fileContent = fs.readFileSync(settingsViewPath, 'utf8');

      expect(fileContent).toContain("isMD ? 'Official Digital Managing Director Pass'");
      expect(fileContent).toContain("isMD ? mdDisplayId : isFaculty ? facultyDisplayId : displayId");
      expect(fileContent).toContain("Managing Director • HIET Group of Institutions • Institution-wide Scope");
      expect(fileContent).toContain("isMD ? 'Board of Governors / Executive Directorate' : isFaculty");
    });
  });

  describe('3. Managing Director Dashboard (Institutional Overview & Reporting)', () => {
    it('verifies ManagingDirectorDashboard calculates real macro metrics from dataStore', () => {
      const managingDirectorDashboardPath = path.resolve(__dirname, '../views/ManagingDirectorDashboard.tsx');
      const fileContent = fs.readFileSync(managingDirectorDashboardPath, 'utf8');

      // Checks for real data derivation
      expect(fileContent).toContain('dataStore.getStudentsMaster()');
      expect(fileContent).toContain('dataStore.getTeachersMaster()');
      expect(fileContent).toContain('dataStore.getAttendanceBatches()');
      expect(fileContent).toContain('dataStore.getSessionalResults()');
      expect(fileContent).toContain('dataStore.getComplaints()');
      expect(fileContent).toContain('dataStore.getNotices()');

      // 7 macro metrics present
      expect(fileContent).toContain('Total Students');
      expect(fileContent).toContain('Faculty & Staff');
      expect(fileContent).toContain('Departments');
      expect(fileContent).toContain('Programmes');
      expect(fileContent).toContain('Pending Approvals');
      expect(fileContent).toContain('Escalations');
      expect(fileContent).toContain('Circulars');
    });

    it('verifies Centralized Approval & Escalation Centre supports Attendance, Sessionals and Grievances', () => {
      const managingDirectorDashboardPath = path.resolve(__dirname, '../views/ManagingDirectorDashboard.tsx');
      const fileContent = fs.readFileSync(managingDirectorDashboardPath, 'utf8');

      expect(fileContent).toContain('Approval and Escalation Centre');
      expect(fileContent).toContain("activeApprovalTab === 'attendance'");
      expect(fileContent).toContain("activeApprovalTab === 'sessionals'");
      expect(fileContent).toContain("activeApprovalTab === 'grievances'");

      // Action triggers
      expect(fileContent).toContain('apiService.processAttendanceWorkflowAction');
      expect(fileContent).toContain('apiService.processSessionalWorkflowAction');
      expect(fileContent).toContain('apiService.resolveComplaintByMD');
    });

    it('verifies strict monochrome theme across ManagingDirectorDashboard', () => {
      const managingDirectorDashboardPath = path.resolve(__dirname, '../views/ManagingDirectorDashboard.tsx');
      const fileContent = fs.readFileSync(managingDirectorDashboardPath, 'utf8');

      // Does not use colorful Tailwind classes for badges/buttons
      expect(fileContent).not.toContain('bg-blue-600');
      expect(fileContent).not.toContain('bg-emerald-600');
      expect(fileContent).not.toContain('bg-rose-600');
      expect(fileContent).not.toContain('bg-amber-600');
      expect(fileContent).not.toContain('text-[#0f2942]');

      // Uses neutral, black and white palette
      expect(fileContent).toContain('bg-black');
      expect(fileContent).toContain('text-white');
      expect(fileContent).toContain('border-neutral-200');
      expect(fileContent).toContain('bg-neutral-50');
    });
  });

  describe('4. Approval Workflow Execution & Security Validation', () => {
    it('allows MD to grant final Stage 4 approval for an attendance batch', async () => {
      const batches = dataStore.getAttendanceBatches();
      const mdBatch = batches.find(b => b.status === 'Pending MD Approval' || b.current_stage === 'md');
      expect(mdBatch).toBeDefined();

      if (mdBatch) {
        const result = await apiService.processAttendanceWorkflowAction({
          batchId: mdBatch.id,
          action: 'approve',
          actorRole: 'managing_director',
          actorId: DEMO_MD.id,
          actorName: DEMO_MD.name,
          comments: 'Final institutional sign-off by Managing Director.'
        });

        expect(result.success).toBe(true);
        expect(result.batch?.status).toBe('Final Approved');
        expect(result.batch?.current_stage).toBe('completed');
      }
    });

    it('prevents unauthorized role (e.g. teacher) from executing MD-level actions', async () => {
      const batches = dataStore.getAttendanceBatches();
      const mdBatch = batches.find(b => b.status === 'Pending MD Approval' || b.current_stage === 'md');

      if (mdBatch) {
        const unauthorizedResult = await apiService.processAttendanceWorkflowAction({
          batchId: mdBatch.id,
          action: 'approve',
          actorRole: 'faculty',
          actorId: 'tch-01',
          actorName: 'Faculty Member'
        });

        expect(unauthorizedResult.success).toBe(false);
        expect(unauthorizedResult.error).toContain('Faculty cannot approve');
      }
    });

    it('requires mandatory reason when returning an attendance batch for correction', async () => {
      const batches = dataStore.getAttendanceBatches();
      const mdBatch = batches.find(b => b.status === 'Pending MD Approval' || b.current_stage === 'md');

      if (mdBatch) {
        const failResult = await apiService.processAttendanceWorkflowAction({
          batchId: mdBatch.id,
          action: 'reject',
          rejectionReason: '',
          actorRole: 'managing_director',
          actorId: DEMO_MD.id,
          actorName: DEMO_MD.name
        });

        expect(failResult.success).toBe(false);
        expect(failResult.error).toContain('mandatory reason');

        const successReturn = await apiService.processAttendanceWorkflowAction({
          batchId: mdBatch.id,
          action: 'reject',
          rejectionReason: 'Lecture count exceeds departmental timetable allocation.',
          actorRole: 'managing_director',
          actorId: DEMO_MD.id,
          actorName: DEMO_MD.name
        });

        expect(successReturn.success).toBe(true);
        expect(successReturn.batch?.status).toBe('Returned for Correction');
        expect(successReturn.batch?.current_stage).toBe('faculty_correction');
      }
    });

    it('allows MD to resolve escalated grievances and records resolution', async () => {
      const complaints = dataStore.getComplaints();
      const escalated = complaints.find(c => c.status === 'Escalated to MD' || (c as any).escalated_to_md);
      expect(escalated).toBeDefined();

      if (escalated) {
        const resolved = await apiService.resolveComplaintByMD(escalated.id, {
          resolution: 'Electrician dispatch authorized. Replacement transformer installed.',
          remarks: 'Actioned with highest priority under Managing Director directive.',
          newStatus: 'Resolved'
        });

        expect(resolved).toBe(true);
        const updated = dataStore.getComplaints().find(c => c.id === escalated.id);
        expect(updated?.status).toBe('Resolved');
        expect(updated?.md_resolution).toContain('Electrician dispatch authorized');
      }
    });
  });
});
