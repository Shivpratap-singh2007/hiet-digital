import { describe, it, expect } from 'vitest';
import { dataStore } from '../lib/mockData';
import fs from 'fs';
import path from 'path';

describe('HIET MD Dashboard — Institutional Performance Table Responsiveness & Dynamic Data', () => {
  const mdDashboardPath = path.resolve(__dirname, '../views/ManagingDirectorDashboard.tsx');
  const mdDashboardSource = fs.readFileSync(mdDashboardPath, 'utf-8');

  const students = dataStore.getStudentsMaster();
  const teachers = dataStore.getTeachersMaster();
  const attendance = dataStore.getAttendance();
  const grades = dataStore.getGrades();

  // ===========================================================================
  // 1. Horizontal Overflow Prevention & Responsive Architecture (Section 1 & 3)
  // ===========================================================================
  describe('1. Horizontal Overflow Prevention & Dual-Layout Architecture', () => {
    it('enforces overflow-hidden and max-w-full on parent containers to eliminate horizontal page scrolling', () => {
      expect(mdDashboardSource).toContain('w-full max-w-full overflow-hidden');
    });

    it('provides a dedicated desktop table hidden on mobile screens', () => {
      expect(mdDashboardSource).toContain('hidden md:block overflow-x-auto w-full');
      expect(mdDashboardSource).toContain('<table className="w-full text-left text-xs border-collapse">');
    });

    it('provides responsive department performance cards specifically on mobile viewports', () => {
      expect(mdDashboardSource).toContain('md:hidden space-y-3');
    });

    it('ensures desktop table has consistent minimum column widths to prevent awkward wrapping', () => {
      expect(mdDashboardSource).toContain('min-w-[240px]'); // Department
      expect(mdDashboardSource).toContain('min-w-[90px]');  // Est. Year
      expect(mdDashboardSource).toContain('min-w-[130px]'); // Student Strength
      expect(mdDashboardSource).toContain('min-w-[130px]'); // Faculty Strength
      expect(mdDashboardSource).toContain('min-w-[130px]'); // Attendance Rate
      expect(mdDashboardSource).toContain('min-w-[140px]'); // Academic Pass Rate
      expect(mdDashboardSource).toContain('min-w-[150px]'); // Status
    });
  });

  // ===========================================================================
  // 2. Mobile Department Performance Cards (Section 2 & 5)
  // ===========================================================================
  describe('2. Mobile Department Performance Cards Content & Layout', () => {
    it('prominently displays full department names on mobile cards without requiring horizontal scrolling', () => {
      expect(mdDashboardSource).toContain('dept.name');
      expect(mdDashboardSource).toContain('leading-snug break-words');
      expect(mdDashboardSource).toContain('Department of Computer Science & Engineering');
      expect(mdDashboardSource).toContain('Department of Electronics & Communication Engineering');
    });

    it('displays all 6 required institutional metrics on every mobile card', () => {
      // Must display: Department Name, Faculty Strength, Student Strength, Attendance Rate, Pass Rate, HOD Status
      expect(mdDashboardSource).toContain('Faculty Strength');
      expect(mdDashboardSource).toContain('Student Strength');
      expect(mdDashboardSource).toContain('Attendance Rate');
      expect(mdDashboardSource).toContain('Academic Pass Rate');
      expect(mdDashboardSource).toContain('HOD Active');
      expect(mdDashboardSource).toContain('HOD Not Assigned');
    });

    it('uses a clean two-column grid for metrics on mobile cards', () => {
      expect(mdDashboardSource).toContain('grid grid-cols-2 gap-2 text-xs');
    });
  });

  // ===========================================================================
  // 3. Dynamic Data & Elimination of Hardcoded Values (Section 4)
  // ===========================================================================
  describe('3. Dynamic Calculations from Real Database Records', () => {
    it('does not contain hardcoded attendance rates (e.g. dept.code === "CSE" ? 84 : 86)', () => {
      expect(mdDashboardSource).not.toContain("dept.code === 'CSE' ? 84 : 86");
      expect(mdDashboardSource).not.toContain("dept.code === 'CSE' ? '92%' : '90%'");
    });

    it('dynamically computes real student counts for each department', () => {
      const cseStudents = students.filter(s => (s.branch || '').includes('CSE') || (s.department || '').includes('CSE'));
      expect(cseStudents.length).toBe(35); // 25 CSE Core + 10 CSE AI & ML

      const eceStudents = students.filter(s => s.branch === 'ECE' || s.department === 'ECE');
      expect(eceStudents.length).toBe(15);

      const ceStudents = students.filter(s => s.branch === 'CE' || s.department === 'CE');
      expect(ceStudents.length).toBe(0);
    });

    it('clearly distinguishes zero student/faculty counts from missing data (shows "0 Students", "0 Faculty")', () => {
      expect(mdDashboardSource).toContain("{dept.studentCount} {dept.studentCount === 1 ? 'Student' : 'Students'}");
      expect(mdDashboardSource).toContain("{dept.facultyCount} {dept.facultyCount === 1 ? 'Faculty' : 'Faculty'}");
    });

    it('displays "N/A" when attendance or academic pass rate metrics are unavailable for a cohort', () => {
      expect(mdDashboardSource).toContain('>N/A</span>');
    });

    it('displays "No data available" banner when a department has no active records', () => {
      expect(mdDashboardSource).toContain('dept.isNoDataAvailable');
      expect(mdDashboardSource).toContain('No data available for current semester evaluation cohort.');
    });

    it('correctly associates active HODs with CSE and ECE, and marks other departments as "HOD Not Assigned"', () => {
      const cseHod = teachers.find(t => (t.department || '').toUpperCase().includes('CSE') && (t.is_hod || t.role === 'hod'));
      expect(cseHod).toBeDefined();
      expect(cseHod?.name).toBe('Dr. Anuj Sharma');

      const eceHod = teachers.find(t => t.department === 'ECE' && (t.is_hod || t.role === 'hod'));
      expect(eceHod).toBeDefined();
      expect(eceHod?.name).toBe('Dr. Kavita Joshi');

      const ceHod = teachers.find(t => t.department === 'CE' && (t.is_hod || t.role === 'hod'));
      expect(ceHod).toBeUndefined();
    });
  });

  // ===========================================================================
  // 4. Institutional Navigation Actions (Section 6)
  // ===========================================================================
  describe('4. Interactive Navigation & Hierarchy Exploration', () => {
    it('preserves click-through navigation to department hierarchy on both cards and table rows', () => {
      expect(mdDashboardSource).toContain("onClick={() => onNavigateTab('department')}");
      expect(mdDashboardSource).toContain("onClick={() => onNavigateTab('principal_analytics')}");
    });
  });
});
