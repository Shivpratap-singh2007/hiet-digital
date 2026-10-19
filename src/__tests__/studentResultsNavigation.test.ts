// ============================================================================
// Unit & Integration Tests: HIET Digital Campus - Student Navigation Menu & Results Module
// Verification of Sessional Marks removal from Student Nav and Unified Results Module
// ============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getNavigationForRole } from '../config/navigation';
import { apiService } from '../lib/supabase';
import { dataStore } from '../lib/mockData';

describe('HIET Digital Campus — Student Navigation & Unified Results Verification', () => {
  const cgpaViewPath = path.resolve(__dirname, '../components/student/CgpaView.tsx');
  const cgpaViewSource = fs.readFileSync(cgpaViewPath, 'utf-8');

  // 1. Navigation Menu Tests
  describe('1. Student Sidebar & Navigation Menu Cleanliness', () => {
    it('completely removes separate "Sessional Marks" item from student navigation', () => {
      const studentNav = getNavigationForRole('student');
      const sessionalItem = studentNav.find(item => item.id === 'sessional_results' || item.label.toLowerCase().includes('sessional marks'));
      expect(sessionalItem).toBeUndefined();
    });

    it('preserves "Results" as the single assessment entry point in student navigation', () => {
      const studentNav = getNavigationForRole('student');
      const resultsItem = studentNav.find(item => item.id === 'cgpa' && item.label === 'Results');
      expect(resultsItem).toBeDefined();
      expect(resultsItem?.href).toBe('/app/results');
    });

    it('preserves "Sessional Marks" navigation item for faculty and administration roles', () => {
      const facultyNav = getNavigationForRole('faculty');
      expect(facultyNav.some(item => item.id === 'sessional_results')).toBe(true);

      const hodNav = getNavigationForRole('hod');
      expect(hodNav.some(item => item.id === 'sessional_results')).toBe(true);

      const principalNav = getNavigationForRole('principal');
      expect(principalNav.some(item => item.id === 'sessional_results')).toBe(true);
    });
  });

  // 2. Sessional Results Under Results (Section A)
  describe('2. Section A: Sessional Results under Unified Results Page', () => {
    it('contains Sessional Results section with subject name, subject code, marks, and assessment status', () => {
      expect(cgpaViewSource).toContain('Sessional Examination Results');
      expect(cgpaViewSource).toContain('res.subject_name');
      expect(cgpaViewSource).toContain('res.subject_code');
      expect(cgpaViewSource).toContain('res.marks_obtained');
      expect(cgpaViewSource).toContain('res.max_marks');
      expect(cgpaViewSource).toContain('res.percentage');
      expect(cgpaViewSource).toContain('res.is_published');
      expect(cgpaViewSource).toContain('Published');
    });

    it('fetches authenticated student sessional records using apiService.getSessionalResults', async () => {
      const records = await apiService.getSessionalResults({ studentId: 'std-cse-001' });
      expect(records.length).toBeGreaterThan(0);
      const mathRecord = records.find(r => r.subject_name === 'Mathematics');
      expect(mathRecord).toBeDefined();
      expect(mathRecord?.marks_obtained).toBe(18);
      expect(mathRecord?.max_marks).toBe(25);
    });

    it('filters strictly by authenticated student to prevent data leakage', async () => {
      const records = await apiService.getSessionalResults({ studentId: 'non-existent-student-id' });
      expect(records).toEqual([]);
    });
  });

  // 3. Class Test Records Under Results (Section B)
  describe('3. Section B: Class Test Records under Unified Results Page', () => {
    it('contains Class Test Records section with subject, test name, test date, marks, and status', () => {
      expect(cgpaViewSource).toContain('Class Test Records & Assessment History');
      expect(cgpaViewSource).toContain('ct.subject_name');
      expect(cgpaViewSource).toContain('ct.subject_code');
      expect(cgpaViewSource).toContain('ct.test_name');
      expect(cgpaViewSource).toContain('ct.test_date');
      expect(cgpaViewSource).toContain('ct.marks_obtained');
      expect(cgpaViewSource).toContain('ct.max_marks');
      expect(cgpaViewSource).toContain('ct.status');
    });

    it('fetches student class test records via apiService.getClassTests', async () => {
      const records = await apiService.getClassTests({ studentId: 'std-cse-001' });
      expect(records.length).toBeGreaterThan(0);
      const ct1Math = records.find(r => r.subject_name === 'Mathematics' && r.test_name === 'Class Test 1');
      expect(ct1Math).toBeDefined();
      expect(ct1Math?.marks_obtained).toBe(19);
      expect(ct1Math?.max_marks).toBe(20);
      expect(ct1Math?.status).toBe('Evaluated');
    });

    it('provides clear empty state message when no class test records exist for student', async () => {
      expect(cgpaViewSource).toContain('No class test records found');
      expect(cgpaViewSource).toContain('No class test or unit assessment evaluations have been recorded for your courses yet');

      const emptyRecords = await apiService.getClassTests({ studentId: 'unknown-student-999', studentRoll: 'UNKNOWN' });
      expect(emptyRecords).toEqual([]);
    });
  });

  // 4. UI & Design System Adherence
  describe('4. Design System & Palette Adherence', () => {
    it('strictly uses institutional Navy Blue (#0F2942), White, and Neutral Gray styling', () => {
      expect(cgpaViewSource).toContain('#0F2942');
      expect(cgpaViewSource).toContain('#183B56');
      expect(cgpaViewSource).toContain('#F8FAFC');
      expect(cgpaViewSource).toContain('#E2E8F0');
      expect(cgpaViewSource).toContain('#64748B');
    });

    it('provides responsive layouts for both mobile cards and desktop table views', () => {
      expect(cgpaViewSource).toContain('sm:hidden');
      expect(cgpaViewSource).toContain('hidden sm:block');
    });

    it('preserves read-only status indicator for student security', () => {
      expect(cgpaViewSource).toContain('Read-Only Student Access');
      expect(cgpaViewSource).toContain('Marks cannot be altered by student');
    });
  });
});
