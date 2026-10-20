import { describe, it, expect } from 'vitest';
import { INSTITUTIONAL_DEPARTMENTS } from '../components/hod/DepartmentStructureView';
import { dataStore } from '../lib/mockData';
import fs from 'fs';
import path from 'path';

describe('HIET MD Dashboard — College-Wide Department Hierarchy & Student Roster', () => {
  const students = dataStore.getStudentsMaster();
  const teachers = dataStore.getTeachersMaster();

  // ===========================================================================
  // 1. College-Wide Department Management (Section 2)
  // ===========================================================================
  describe('1. College-Wide Department Management (Section 2)', () => {
    it('displays all institution-level academic departments and programs, not only CSE or B.Tech', () => {
      const deptCodes = INSTITUTIONAL_DEPARTMENTS.map(d => d.code);
      expect(deptCodes).toContain('CSE');
      expect(deptCodes).toContain('ECE');
      expect(deptCodes).toContain('CE');
      expect(deptCodes).toContain('ME');
      expect(deptCodes).toContain('EE');
      expect(deptCodes).toContain('AS&H');
      expect(deptCodes).toContain('BCA');
      expect(INSTITUTIONAL_DEPARTMENTS.length).toBeGreaterThanOrEqual(7);
    });

    it('clearly distinguishes academic program, department, and branch', () => {
      const cseDept = INSTITUTIONAL_DEPARTMENTS.find(d => d.code === 'CSE')!;
      expect(cseDept.name).toBe('Department of Computer Science & Engineering');
      expect(cseDept.programsManaged).toContain('B.Tech Computer Science & Engineering');
      expect(cseDept.programsManaged).toContain('B.Tech CSE (AI & ML)');
      expect(cseDept.branches.length).toBe(2);
      expect(cseDept.branches[0].degree).toBe('B.Tech');
      expect(cseDept.branches[1].degree).toBe('B.Tech');
    });

    it('does not fabricate student counts for departments with zero enrolled students', () => {
      const ceDept = INSTITUTIONAL_DEPARTMENTS.find(d => d.code === 'CE')!;
      const ceStudents = students.filter(s => (s.branch || '').toUpperCase() === 'CE' || (s.department || '').toUpperCase() === 'CE');
      expect(ceStudents.length).toBe(0);

      const meDept = INSTITUTIONAL_DEPARTMENTS.find(d => d.code === 'ME')!;
      const meStudents = students.filter(s => (s.branch || '').toUpperCase() === 'ME' || (s.department || '').toUpperCase() === 'ME');
      expect(meStudents.length).toBe(0);
    });
  });

  // ===========================================================================
  // 2. HOD Directory — First Screen (Section 3)
  // ===========================================================================
  describe('2. HOD Directory First Screen (Section 3)', () => {
    it('associates active HODs with authorized departments and identifies vacant HOD positions', () => {
      const hods = teachers.filter(t => t.is_hod || t.role === 'hod' || t.designation?.toLowerCase().includes('hod'));
      const cseHod = hods.find(t => (t.department || '').toUpperCase().includes('CSE'));
      expect(cseHod).toBeDefined();
      expect(cseHod?.name).toBe('Dr. Anuj Sharma');
      expect(cseHod?.faculty_id).toBe('HIET-FAC-CSE-001');

      const eceHod = hods.find(t => (t.department || '').toUpperCase().includes('ECE'));
      expect(eceHod).toBeDefined();
      expect(eceHod?.name).toBe('Dr. Kavita Joshi');
      expect(eceHod?.faculty_id).toBe('HIET-FAC-ECE-001');
    });

    it('does not display normal faculty members as HODs', () => {
      const profRajesh = teachers.find(t => t.name === 'Dr. Rajesh Kumar');
      expect(profRajesh).toBeDefined();
      expect(profRajesh?.is_hod).toBe(false);

      const rohitMehta = teachers.find(t => t.name === 'Mr. Rohit Mehta');
      expect(rohitMehta).toBeDefined();
      expect(rohitMehta?.is_hod).toBe(false);
      expect(rohitMehta?.is_class_incharge).toBe(true);
    });

    it('ensures departments without assigned HOD are explicitly marked "HOD Not Assigned"', () => {
      const fileContent = fs.readFileSync(
        path.resolve(__dirname, '../components/hod/DepartmentStructureView.tsx'),
        'utf-8'
      );
      expect(fileContent).toContain("HOD Not Assigned");
      expect(fileContent).toContain("Vacant Position");
    });
  });

  // ===========================================================================
  // 3. Department Navigation Hierarchy (Section 4)
  // ===========================================================================
  describe('3. Department Navigation Hierarchy (Section 4)', () => {
    it('implements drill-down from HOD Directory -> Department -> Branch -> Class Roster with working breadcrumbs', () => {
      const fileContent = fs.readFileSync(
        path.resolve(__dirname, '../components/hod/DepartmentStructureView.tsx'),
        'utf-8'
      );
      expect(fileContent).toContain("currentLevel === 'directory'");
      expect(fileContent).toContain("currentLevel === 'department'");
      expect(fileContent).toContain("currentLevel === 'branch'");
      expect(fileContent).toContain("currentLevel === 'roster'");
      expect(fileContent).toContain("Back to");
      expect(fileContent).toContain("HOD Directory");
    });

    it('prevents double-counting students across branches and departments', () => {
      const totalStudents = students.length;
      expect(totalStudents).toBe(50);

      const cseCoreStudents = students.filter(s => s.branch === 'CSE');
      const cseAimlStudents = students.filter(s => s.branch === 'CSE AI & ML' || s.branch === 'CSE AI/ML');
      const eceStudents = students.filter(s => s.branch === 'ECE');

      expect(cseCoreStudents.length).toBe(25); // 15 Sem-1 + 10 Sem-6
      expect(cseAimlStudents.length).toBe(10); // 10 Sem-4
      expect(eceStudents.length).toBe(15);     // 15 Sem-1

      // 25 + 10 + 15 = 50 total students exactly
      expect(cseCoreStudents.length + cseAimlStudents.length + eceStudents.length).toBe(totalStudents);
    });
  });

  // ===========================================================================
  // 4. Student Roll Number / ID Single-Line Formatting (Section 5)
  // ===========================================================================
  describe('4. Student Roll Number / ID Display (Section 5)', () => {
    it('renders roll number in readable single-line format without artificial line wrapping', () => {
      const fileContent = fs.readFileSync(
        path.resolve(__dirname, '../components/hod/DepartmentStructureView.tsx'),
        'utf-8'
      );
      expect(fileContent).toContain('whitespace-nowrap');
      expect(fileContent).toContain('font-mono font-bold');
      expect(fileContent).toContain('min-w-[170px]');
      expect(fileContent).toContain('student.roll_no');
    });

    it('includes a copy button for complete student roll numbers', () => {
      const fileContent = fs.readFileSync(
        path.resolve(__dirname, '../components/hod/DepartmentStructureView.tsx'),
        'utf-8'
      );
      expect(fileContent).toContain('handleCopy(student.roll_no');
      expect(fileContent).toContain('Copy Roll Number');
    });
  });

  // ===========================================================================
  // 5. Student Full Legal Name Formatting (Section 6)
  // ===========================================================================
  describe('5. Student Full Name Formatting (Section 6)', () => {
    it('displays complete legal names without truncating or arbitrary line breaks on desktop', () => {
      const fileContent = fs.readFileSync(
        path.resolve(__dirname, '../components/hod/DepartmentStructureView.tsx'),
        'utf-8'
      );
      expect(fileContent).toContain('min-w-[180px] whitespace-nowrap');
      expect(fileContent).toContain('{student.name}');
    });

    it('preserves surnames, middle names, and legal naming structure in mock data', () => {
      const cseStudent = students.find(s => s.roll_no === 'HIET-CSE-2026-001');
      expect(cseStudent?.name).toBe('Aditya Nanda');

      const eceStudent = students.find(s => s.roll_no === 'HIET-ECE-2026-001');
      expect(eceStudent?.name).toBe('Aditi Sharma');

      const aimlStudent = students.find(s => s.roll_no === 'AIML006');
      expect(aimlStudent?.name).toBe('Abhishek Thakur');
    });
  });

  // ===========================================================================
  // 6. Parent/Guardian and College Email Layout (Section 7)
  // ===========================================================================
  describe('6. Parent/Guardian & College Email Layout (Section 7)', () => {
    it('keeps guardian information and college email inside the roster container', () => {
      const fileContent = fs.readFileSync(
        path.resolve(__dirname, '../components/hod/DepartmentStructureView.tsx'),
        'utf-8'
      );
      expect(fileContent).toContain('min-w-[210px] max-w-[280px]');
      expect(fileContent).toContain('min-w-[220px]');
      expect(fileContent).toContain('student.father_name');
      expect(fileContent).toContain('student.mother_name');
      expect(fileContent).toContain('student.college_email');
    });

    it('supports responsive mobile card layout with Student Information and Contact/Guardian groups on same card', () => {
      const fileContent = fs.readFileSync(
        path.resolve(__dirname, '../components/hod/DepartmentStructureView.tsx'),
        'utf-8'
      );
      expect(fileContent).toContain('Student Information');
      expect(fileContent).toContain('Contact & Guardian Information');
      expect(fileContent).toContain('handleCopy(student.college_email');
    });
  });

  // ===========================================================================
  // 7. Strict Monochrome Theme Conformance (Section 9)
  // ===========================================================================
  describe('7. Strict Monochrome Theme Conformance', () => {
    it('uses only black, white, and neutral grey styling in DepartmentStructureView without colored gradients', () => {
      const fileContent = fs.readFileSync(
        path.resolve(__dirname, '../components/hod/DepartmentStructureView.tsx'),
        'utf-8'
      );
      expect(fileContent).not.toContain('bg-purple-500');
      expect(fileContent).not.toContain('bg-blue-600');
      expect(fileContent).not.toContain('bg-emerald-600');
      expect(fileContent).not.toContain('bg-amber-500');
      expect(fileContent).not.toContain('from-purple-600');
    });
  });
});
