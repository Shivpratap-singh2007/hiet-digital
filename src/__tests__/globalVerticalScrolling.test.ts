import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Global Vertical Scrolling & Layout Integrity Across All Roles', () => {
  const readComponent = (relPath: string) => {
    return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf-8');
  };

  it('verifies src/index.css does not lock vertical touch scrolling or gestures', () => {
    const css = readComponent('src/index.css');
    // Ensure overscroll-behavior-y locks are removed
    expect(css).not.toContain('overscroll-behavior: none');
    expect(css).not.toContain('overscroll-behavior-y: none');
    // Ensure body enables natural vertical scrolling
    expect(css).toContain('overflow-y: auto');
    expect(css).toContain('-webkit-overflow-scrolling: touch');
    // Ensure #root does not have overflow-x: hidden which forces overflow-y to auto and traps scroll
    const rootBlockMatch = css.match(/#root\s*\{([^}]+)\}/);
    expect(rootBlockMatch).toBeTruthy();
    if (rootBlockMatch) {
      expect(rootBlockMatch[1]).not.toContain('overflow-x: hidden');
      expect(rootBlockMatch[1]).not.toContain('overflow: hidden');
    }
  });

  it('verifies src/App.tsx authenticated shell enables natural document growth and bottom spacing', () => {
    const appCode = readComponent('src/App.tsx');
    // Must not have overflow-hidden or overflow-x-hidden on the authenticated wrapper
    expect(appCode).not.toContain('min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans relative selection:bg-[#0f2942] selection:text-white overflow-x-hidden');
    expect(appCode).not.toContain('min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans relative selection:bg-[#0f2942] selection:text-white overflow-hidden');
    // Main container must have padding bottom so fixed bottom nav does not overlap last action items
    expect(appCode).toContain('pb-28');
  });

  it('verifies ManagingDirectorDashboard root container allows vertical scrolling', () => {
    const code = readComponent('src/views/ManagingDirectorDashboard.tsx');
    // Root container must use min-w-0 / natural flow without overflow-hidden
    expect(code).not.toContain('<div className="space-y-6 font-sans text-black dark:text-white w-full max-w-full overflow-hidden">');
    expect(code).toContain('space-y-6 font-sans text-black dark:text-white w-full max-w-full');
  });

  it('verifies HodDashboard student and overview containers allow vertical scrolling', () => {
    const code = readComponent('src/views/HodDashboard.tsx');
    expect(code).not.toContain('<div className="space-y-6 font-sans w-full max-w-full overflow-hidden">');
    expect(code).not.toContain('<div className="space-y-5 animate-fade-in w-full max-w-full overflow-hidden">');
    expect(code).toContain('space-y-6 animate-fade-in font-sans w-full max-w-full');
    expect(code).toContain('space-y-5 animate-fade-in w-full max-w-full');
  });

  it('verifies AuditLogView root container allows vertical scrolling', () => {
    const code = readComponent('src/components/admin/AuditLogView.tsx');
    expect(code).not.toContain('space-y-5 font-sans pb-12 animate-fade-in text-black dark:text-white w-full max-w-full overflow-hidden');
    expect(code).toContain('space-y-5 font-sans pb-12 animate-fade-in text-black dark:text-white w-full max-w-full');
  });

  it('verifies Faculty & Teacher views root containers do not lock vertical scrolling', () => {
    const achievements = readComponent('src/components/teacher/TeacherAchievementsView.tsx');
    expect(achievements).not.toContain('space-y-6 animate-fade-in w-full max-w-full overflow-hidden');
    expect(achievements).toContain('space-y-6 animate-fade-in w-full max-w-full');

    const attendance = readComponent('src/components/teacher/TeacherAttendanceView.tsx');
    expect(attendance).not.toContain('space-y-4 animate-fade-in font-sans w-full max-w-full overflow-hidden');
    expect(attendance).toContain('space-y-4 animate-fade-in font-sans w-full max-w-full');

    const sessional = readComponent('src/components/teacher/TeacherSessionalView.tsx');
    expect(sessional).not.toContain('space-y-5 animate-fade-in font-sans w-full max-w-full overflow-hidden');
    expect(sessional).toContain('space-y-5 animate-fade-in font-sans w-full max-w-full min-w-0');

    const leaves = readComponent('src/components/teacher/TeacherLeavesView.tsx');
    expect(leaves).not.toContain('space-y-6 animate-fade-in w-full max-w-full overflow-hidden');
    expect(leaves).toContain('space-y-6 animate-fade-in w-full max-w-full min-w-0');
  });

  it('verifies Student view roots do not lock vertical scrolling', () => {
    const cgpa = readComponent('src/components/student/CgpaView.tsx');
    expect(cgpa).not.toContain('space-y-6 font-sans pb-24 w-full max-w-full overflow-hidden');
    expect(cgpa).toContain('space-y-6 font-sans pb-24 w-full max-w-full min-w-0');

    const gatePass = readComponent('src/components/student/DigitalGatePassView.tsx');
    expect(gatePass).not.toContain('space-y-6 animate-fade-in font-sans max-w-4xl mx-auto pb-10 w-full max-w-full overflow-hidden');
    expect(gatePass).toContain('space-y-6 animate-fade-in font-sans max-w-4xl mx-auto pb-10 w-full max-w-full min-w-0');

    const fees = readComponent('src/components/student/FeeReceiptsView.tsx');
    expect(fees).not.toContain('space-y-6 font-sans animate-fade-in pb-12 w-full max-w-full overflow-hidden');
    expect(fees).toContain('space-y-6 font-sans animate-fade-in pb-12 w-full max-w-full min-w-0');

    const hostel = readComponent('src/components/student/HostelOutpassView.tsx');
    expect(hostel).not.toContain('space-y-6 font-sans w-full max-w-full overflow-hidden');
    expect(hostel).toContain('space-y-6 font-sans w-full max-w-full min-w-0');

    const studentLeaves = readComponent('src/components/student/LeaveApplicationView.tsx');
    expect(studentLeaves).not.toContain('space-y-6 animate-fade-in w-full max-w-full overflow-hidden');
    expect(studentLeaves).toContain('space-y-6 animate-fade-in w-full max-w-full min-w-0');

    const admitCard = readComponent('src/components/student/AdmitCardPrintView.tsx');
    expect(admitCard).not.toContain('<div className="w-full max-w-full overflow-hidden space-y-6 font-sans animate-fade-in pb-12">');
    expect(admitCard).toContain('w-full max-w-full min-w-0 space-y-6 font-sans animate-fade-in pb-12');

    const studentAttendance = readComponent('src/components/student/AttendanceView.tsx');
    expect(studentAttendance).not.toContain('space-y-6 animate-fade-in font-sans w-full max-w-full overflow-hidden');
    expect(studentAttendance).toContain('space-y-6 animate-fade-in font-sans w-full max-w-full min-w-0');
  });

  it('verifies Administrative, Security and Campus Operations views root containers allow vertical scrolling', () => {
    const security = readComponent('src/components/security/SecurityScannerView.tsx');
    expect(security).not.toContain('space-y-6 animate-fade-in font-sans pb-10 w-full max-w-full overflow-hidden');
    expect(security).toContain('space-y-6 animate-fade-in font-sans pb-10 w-full max-w-full min-w-0');

    const ops = readComponent('src/components/operations/SmartCampusOperationsView.tsx');
    expect(ops).not.toContain('space-y-6 font-sans animate-fade-in w-full max-w-full overflow-hidden');
    expect(ops).toContain('space-y-6 font-sans animate-fade-in w-full max-w-full min-w-0');

    const presence = readComponent('src/components/presence/CampusPresenceView.tsx');
    expect(presence).not.toContain('space-y-6 font-sans animate-fade-in w-full max-w-full overflow-hidden');
    expect(presence).toContain('space-y-6 font-sans animate-fade-in w-full max-w-full min-w-0');

    const reconciliation = readComponent('src/components/attendance/AttendanceReconciliationView.tsx');
    expect(reconciliation).not.toContain('space-y-6 animate-fade-in font-sans max-w-5xl mx-auto pb-10 w-full max-w-full overflow-hidden');
    expect(reconciliation).toContain('space-y-6 animate-fade-in font-sans max-w-5xl mx-auto pb-10 w-full max-w-full min-w-0');

    const approvals = readComponent('src/components/attendance/AttendanceApprovalsView.tsx');
    expect(approvals).not.toContain('space-y-5 animate-fade-in font-sans w-full max-w-full overflow-hidden');
    expect(approvals).toContain('space-y-5 animate-fade-in font-sans w-full max-w-full min-w-0');
  });
});
