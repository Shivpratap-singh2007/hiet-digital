import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Global Responsive Tables & Dual Layout Verification', () => {
  const readComponent = (relPath: string) => {
    return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf-8');
  };

  it('verifies index.css enforces zero horizontal overflow on html, body, and #root', () => {
    const css = readComponent('src/index.css');
    expect(css).toContain('max-width: 100vw');
    expect(css).toContain('overflow-x: hidden');
  });

  it('verifies ManagingDirectorDashboard has dual responsive layout for institutional performance', () => {
    const code = readComponent('src/views/ManagingDirectorDashboard.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies CampusPresenceView has dual responsive layout for student presence register', () => {
    const code = readComponent('src/components/presence/CampusPresenceView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies DepartmentStructureView has dual responsive layout for student roster', () => {
    const code = readComponent('src/components/hod/DepartmentStructureView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies TeacherAttendanceView has dual responsive layout for risk insights', () => {
    const code = readComponent('src/components/teacher/TeacherAttendanceView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies TeacherSessionalView has dual responsive layout for marks entry registry', () => {
    const code = readComponent('src/components/teacher/TeacherSessionalView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies AttendanceReconciliationView has dual responsive layout', () => {
    const code = readComponent('src/components/attendance/AttendanceReconciliationView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies ReportsManagementView has dual responsive layout', () => {
    const code = readComponent('src/components/admin/ReportsManagementView.tsx');
    expect(code).toContain('hidden sm:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('sm:hidden');
  });

  it('verifies TeacherManagementView has dual responsive layout', () => {
    const code = readComponent('src/components/admin/TeacherManagementView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies AdminComplaintsView has dual responsive layout', () => {
    const code = readComponent('src/components/admin/AdminComplaintsView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies MdDepartmentSummary has dual responsive layout', () => {
    const code = readComponent('src/components/md/MdDepartmentSummary.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies TeacherLeavesView has dual responsive layout', () => {
    const code = readComponent('src/components/teacher/TeacherLeavesView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies DigitalGatePassView has dual responsive layout', () => {
    const code = readComponent('src/components/student/DigitalGatePassView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies HostelOutpassView has dual responsive layout', () => {
    const code = readComponent('src/components/student/HostelOutpassView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies FeeReceiptsView has dual responsive layout', () => {
    const code = readComponent('src/components/student/FeeReceiptsView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies AdminFinesManagementView has dual responsive layout', () => {
    const code = readComponent('src/components/fines/AdminFinesManagementView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies HodDashboard has dual responsive layout in both student and attendance tabs', () => {
    const code = readComponent('src/views/HodDashboard.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies HodReportsView has dual responsive layout', () => {
    const code = readComponent('src/components/hod/HodReportsView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies SecurityScannerView has dual responsive layout', () => {
    const code = readComponent('src/components/security/SecurityScannerView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies SmartCampusOperationsView has dual responsive layout', () => {
    const code = readComponent('src/components/operations/SmartCampusOperationsView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies AcademicCatalogView has dual responsive layout', () => {
    const code = readComponent('src/components/admin/AcademicCatalogView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies CampusZonesManagementView has dual responsive layout', () => {
    const code = readComponent('src/components/admin/CampusZonesManagementView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies ResourcesManagementView has dual responsive layout', () => {
    const code = readComponent('src/components/admin/ResourcesManagementView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies ContentManagementView has dual responsive layout', () => {
    const code = readComponent('src/components/admin/ContentManagementView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies MasterDataImportView has dual responsive layout', () => {
    const code = readComponent('src/components/admin/MasterDataImportView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies MaintenanceGrievanceView has dual responsive layout', () => {
    const code = readComponent('src/components/common/MaintenanceGrievanceView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies ParentNotificationDispatchView has dual responsive layout', () => {
    const code = readComponent('src/components/parent/ParentNotificationDispatchView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies TeacherAchievementsView has dual responsive layout', () => {
    const code = readComponent('src/components/teacher/TeacherAchievementsView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies DemoAccountsPage has dual responsive layout', () => {
    const code = readComponent('src/pages/dev/DemoAccountsPage.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies SyllabusPyqView has dual responsive layout', () => {
    const code = readComponent('src/components/student/SyllabusPyqView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies SmartBoardTeachingView has dual responsive layout', () => {
    const code = readComponent('src/components/smartboard/SmartBoardTeachingView.tsx');
    expect(code).toContain('hidden md:block');
    expect(code).toContain('overflow-x-auto');
    expect(code).toContain('md:hidden');
  });

  it('verifies AdmitCardPrintView has overflow safety', () => {
    const code = readComponent('src/components/student/AdmitCardPrintView.tsx');
    expect(code).toContain('overflow-x-auto w-full');
    expect(code).toContain('w-full max-w-full overflow-hidden');
  });
});
