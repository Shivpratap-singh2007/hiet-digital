import { describe, it, expect, beforeEach } from 'vitest';
import { STUDENT_NAV, getNavigationForRole } from '../config/navigation';
import { apiService } from '../lib/supabase';
import { dataStore } from '../lib/mockData';
import { Grade, SessionalResult } from '../types';

// Setup localStorage polyfill for node test environment
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] || null,
    length: 0,
  };
}

describe('Official Results & Internal Calculator Removal Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Removal of Internal Calculator from Student Navigation', () => {
    it('completely excludes internal calculator from student navigation', () => {
      const studentNav = getNavigationForRole('student');
      const navIds = studentNav.map(item => item.id);
      const navLabels = studentNav.map(item => item.label.toLowerCase());

      // Confirm 'internals' is removed
      expect(navIds).not.toContain('internals');
      expect(navIds).not.toContain('internal_calculator');
      expect(navIds).not.toContain('calculator');

      // Confirm no calculator label
      const hasCalculatorLabel = navLabels.some(l => l.includes('calculator'));
      expect(hasCalculatorLabel).toBe(false);
    });

    it('retains official Results navigation item under student navigation', () => {
      const studentNav = getNavigationForRole('student');
      const resultsItem = studentNav.find(item => item.id === 'cgpa');

      expect(resultsItem).toBeDefined();
      expect(resultsItem?.label).toBe('Results');
      expect(resultsItem?.href).toBe('/app/results');
    });

    it('STUDENT_NAV static config does not have calculator or internals', () => {
      const ids = STUDENT_NAV.map((n: { id: string }) => n.id);
      expect(ids).not.toContain('internals');
      expect(ids).not.toContain('internal_calculator');
      expect(ids).toContain('cgpa');
    });
  });

  describe('2. Official Examination Results Data Integrity', () => {
    it('fetches published academic records for student ID std-cse-001', async () => {
      const grades = await apiService.getGrades('std-cse-001');
      expect(grades.length).toBeGreaterThan(0);

      // Verify all essential academic fields are present
      const sample = grades[0];
      expect(sample).toHaveProperty('subject_name');
      expect(sample).toHaveProperty('subject_code');
      expect(sample).toHaveProperty('semester');
      expect(sample).toHaveProperty('credits');
      expect(sample).toHaveProperty('marks');
      expect(sample).toHaveProperty('max_marks');
      expect(sample).toHaveProperty('letter_grade');
      expect(sample).toHaveProperty('grade_point');
      expect(sample).toHaveProperty('internal_marks');
      expect(sample).toHaveProperty('sessional_marks');
      expect(sample).toHaveProperty('external_marks');
      expect(sample).toHaveProperty('status');
      expect(sample).toHaveProperty('session');
      expect(sample.is_published).toBe(true);
    });

    it('contains lab course with practical marks evaluation', async () => {
      const grades = await apiService.getGrades('std-cse-001', 3);
      const labCourse = grades.find(g => g.subject_code === 'CS-305');
      
      expect(labCourse).toBeDefined();
      expect(labCourse?.subject_name).toBe('Data Structures Lab');
      expect(labCourse?.practical_marks).toBeDefined();
      expect(labCourse?.practical_marks).toBe(25);
    });

    it('returns empty array when results for semester have not been declared (e.g. Semester 6)', async () => {
      const sem6Grades = await apiService.getGrades('std-cse-001', 6);
      expect(sem6Grades).toEqual([]);
    });

    it('does not invent or fabricate marks for unknown student', async () => {
      const unknownGrades = await apiService.getGrades('unknown-student-999');
      expect(unknownGrades).toEqual([]);
    });

    it('filters out unpublished grades from student-visible records', async () => {
      const testUnpublishedGrade: Grade = {
        id: 'grd-unpub-test',
        student_id: 'std-cse-001',
        semester: 6,
        subject_code: 'CS-601',
        subject_name: 'Test Future Subject',
        credits: 4,
        letter_grade: 'A',
        grade_point: 9,
        marks: 85,
        is_published: false
      };

      const current = dataStore.getGrades();
      dataStore.setGrades([testUnpublishedGrade, ...current]);

      const retrieved = await apiService.getGrades('std-cse-001', 6);
      expect(retrieved.some(g => g.id === 'grd-unpub-test')).toBe(false);
    });
  });

  describe('3. College-Controlled Result & Marks Management Preservation', () => {
    it('preserves faculty sessional result submission workflow', async () => {
      const sessionalPayload: Omit<SessionalResult, 'id' | 'created_at'> = {
        student_id: 'std-cse-001',
        student_roll: 'CSE001',
        student_name: 'Aarav Sharma',
        subject_name: 'Machine Learning',
        subject_code: 'CS-602',
        exam_type: 'Sessional 1',
        marks_obtained: 28,
        max_marks: 30,
        percentage: 93.3,
        semester: 6,
        branch: 'CSE',
        is_published: true,
        remarks: 'Excellent analytical reasoning'
      };

      const saved = await apiService.saveSessionalResult(sessionalPayload);
      expect(saved).toBeDefined();
      expect(saved.id).toBeDefined();
      expect(saved.marks_obtained).toBe(28);

      const all = dataStore.getSessionalResults();
      expect(all.some(r => r.id === saved.id)).toBe(true);
    });

    it('preserves faculty / admin saveGrade workflow', async () => {
      const gradePayload: Omit<Grade, 'id' | 'created_at'> = {
        student_id: 'std-cse-test-save',
        semester: 1,
        subject_code: 'AS-101',
        subject_name: 'Engineering Mathematics-I',
        credits: 4,
        internal_marks: 14,
        sessional_marks: 25,
        external_marks: 50,
        marks: 89,
        max_marks: 100,
        letter_grade: 'A+',
        grade_point: 10,
        status: 'Pass',
        is_published: true
      };

      const saved = await apiService.saveGrade(gradePayload);
      expect(saved).toBeDefined();
      expect(saved.id).toBeDefined();
      expect(saved.marks).toBe(89);
    });
  });
});
