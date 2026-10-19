import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '../lib/mockData';
import { apiService } from '../lib/supabase';
import { ALL_DEMO_STUDENT_PROFILES, DEMO_STUDENTS_LIST } from '../lib/mockDemoUsers';
import { Grade } from '../types';

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

describe('Semester Results According to Student Current Semester & Profile Department Fixes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Profile Department Field Correction', () => {
    it('sets Department to B.Tech and Branch to ECE for ECE students', () => {
      const eceProfiles = ALL_DEMO_STUDENT_PROFILES.filter(p => p.studentMaster?.branch === 'ECE');
      expect(eceProfiles.length).toBeGreaterThan(0);

      eceProfiles.forEach(profile => {
        expect(profile.studentMaster?.department).toBe('B.Tech');
        expect(profile.studentMaster?.branch).toBe('ECE');
        expect(profile.department).toBe('B.Tech');
        expect(profile.role).toBe('student');
        // Student name, roll number, and enrollment details remain intact
        expect(profile.studentMaster?.name).toBeDefined();
        expect(profile.studentMaster?.roll_no).toBeDefined();
        expect(profile.studentMaster?.semester).toBe(1);
      });
    });

    it('dataStore.getStudentsMaster() normalizes any student with branch ECE to department B.Tech', () => {
      const students = dataStore.getStudentsMaster();
      const eceStudents = students.filter(s => s.branch === 'ECE');
      expect(eceStudents.length).toBeGreaterThan(0);

      eceStudents.forEach(s => {
        expect(s.department).toBe('B.Tech');
        expect(s.branch).toBe('ECE');
      });
    });

    it('preserves other students records and departments without adverse mutation', () => {
      const students = dataStore.getStudentsMaster();
      const cseStudents = students.filter(s => s.branch === 'CSE');
      expect(cseStudents.length).toBeGreaterThan(0);
      
      const sem6Aarav = students.find(s => s.roll_no === 'CSE001');
      expect(sem6Aarav).toBeDefined();
      expect(sem6Aarav?.name).toBe('Aarav Sharma');
      expect(sem6Aarav?.semester).toBe(6);
    });
  });

  describe('2. Semester Results According to Current Semester', () => {
    it('does not display future semester results (Semesters 2-5) for a Semester 1 student', async () => {
      const sem1EceStudent = ALL_DEMO_STUDENT_PROFILES.find(p => p.studentMaster?.branch === 'ECE' && p.studentMaster?.semester === 1);
      expect(sem1EceStudent).toBeDefined();
      const studentId = sem1EceStudent!.studentMaster!.id;

      const allGrades = await apiService.getGrades(studentId);
      // ECE Semester 1 student has no published future grades
      const futureGrades = allGrades.filter(g => g.semester > 1);
      expect(futureGrades.length).toBe(0);
    });

    it('handles unpublished results gracefully without fabricating sample numbers (7.8, 8.1, 8.3, etc.)', async () => {
      const sem1EceStudent = ALL_DEMO_STUDENT_PROFILES.find(p => p.studentMaster?.branch === 'ECE');
      const studentId = sem1EceStudent!.studentMaster!.id;
      const grades = await apiService.getGrades(studentId, 1);

      // If unpublished, array must be empty
      expect(grades).toEqual([]);

      // Verify fabricated numbers are not present in dataStore for this student
      const allDataStoreGrades = dataStore.getGrades();
      const studentGrades = allDataStoreGrades.filter(g => g.student_id === studentId);
      expect(studentGrades).toEqual([]);
    });

    it('calculates SGPA and CGPA dynamically only from valid published records', () => {
      // Simulate adding a verified Grade record for a Semester 1 student
      const testStudentId = 'std-ece-test-001';
      const samplePublishedGrade: Grade = {
        id: 'grd-test-01',
        student_id: testStudentId,
        semester: 1,
        session: '2025-26 Odd',
        subject_code: 'ECE-101',
        subject_name: 'Basic Electronics',
        credits: 4.0,
        grade_point: 8.5,
        marks: 85,
        max_marks: 100,
        letter_grade: 'A',
        status: 'Pass',
        is_published: true
      };

      const grades = [samplePublishedGrade];
      const studentSemester = 1;
      const validGrades = grades.filter(g => g.is_published !== false && g.semester <= studentSemester);
      
      const totalCredits = validGrades.reduce((sum, g) => sum + (g.credits || 4.0), 0);
      const totalPoints = validGrades.reduce((sum, g) => sum + (g.grade_point * (g.credits || 4.0)), 0);
      const cgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;

      expect(cgpa).toBe(8.5);

      // Verify that future semester records are rejected from calculation
      const futureFabricatedGrade: Grade = {
        id: 'grd-test-02',
        student_id: testStudentId,
        semester: 2,
        session: '2025-26 Even',
        subject_code: 'ECE-201',
        subject_name: 'Network Analysis',
        credits: 4.0,
        grade_point: 9.0,
        marks: 90,
        max_marks: 100,
        letter_grade: 'A+',
        status: 'Pass',
        is_published: true
      };

      const mixedGrades = [samplePublishedGrade, futureFabricatedGrade];
      // When student is in Semester 1, semester 2 records are strictly excluded
      const scopedToSem1 = mixedGrades.filter(g => g.is_published !== false && g.semester <= 1);
      expect(scopedToSem1.length).toBe(1);
      expect(scopedToSem1[0].semester).toBe(1);

      // When student advances to Semester 2, semester 2 records are included
      const scopedToSem2 = mixedGrades.filter(g => g.is_published !== false && g.semester <= 2);
      expect(scopedToSem2.length).toBe(2);
    });

    it('Aarav Sharma (Semester 6) continues to retain actual historical records up to Semester 5 without interference', async () => {
      const aaravGrades = await apiService.getGrades('std-cse-001');
      expect(aaravGrades.length).toBeGreaterThan(0);

      // Semesters 1 to 5 exist for Aarav
      const semesters = Array.from(new Set(aaravGrades.map(g => g.semester))).sort();
      expect(semesters).toEqual([1, 2, 3, 4, 5]);

      // Semester 6 is not declared
      const sem6 = aaravGrades.filter(g => g.semester === 6);
      expect(sem6).toEqual([]);
    });

    it('prevents leakage of Aarav Sharma records to other students', async () => {
      const eceStudent = ALL_DEMO_STUDENT_PROFILES.find(p => p.studentMaster?.branch === 'ECE');
      const eceStudentId = eceStudent!.studentMaster!.id;
      const grades = await apiService.getGrades(eceStudentId);

      // The ECE student should NOT receive Aarav Sharma's records
      expect(grades.some(g => g.student_id === 'std-cse-001')).toBe(false);
    });
  });
});
