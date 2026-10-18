import { describe, it, expect, beforeEach } from 'vitest';
import { campusLifeStore, INITIAL_EMERGENCY_CONTACTS, INITIAL_HPTU_INTERNAL_SCORES } from '../lib/campusLifeData';
import { getNavigationForRole } from '../config/navigation';

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

describe('Advanced Campus Institutional Features Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. HPTU Internal Marks Assessment & Theory Pass Calculator', () => {
    it('calculates 5 attendance bonus points for attendance >= 85%', () => {
      const result = campusLifeStore.calculateHptuInternal(14, 14, 9, 88);
      expect(result.attendanceMarks).toBe(5);
      expect(result.totalInternal).toBe(42);
      // If total internal is 42, minimum theory pass is max(21, 40 - 42) = 21
      expect(result.minPassingTheory).toBe(21);
    });

    it('calculates 4 attendance bonus points for attendance between 80% and 84.9%', () => {
      const result = campusLifeStore.calculateHptuInternal(12, 12, 8, 82);
      expect(result.attendanceMarks).toBe(4);
      expect(result.totalInternal).toBe(36);
      expect(result.minPassingTheory).toBe(21);
    });

    it('calculates 3 attendance bonus points for attendance between 75% and 79.9%', () => {
      const result = campusLifeStore.calculateHptuInternal(10, 10, 7, 76);
      expect(result.attendanceMarks).toBe(3);
      expect(result.totalInternal).toBe(30);
      expect(result.minPassingTheory).toBe(21);
    });

    it('awards 0 attendance bonus points for attendance below 75%', () => {
      const result = campusLifeStore.calculateHptuInternal(5, 5, 4, 68);
      expect(result.attendanceMarks).toBe(0);
      expect(result.totalInternal).toBe(14);
      // Needed for 40 aggregate = 40 - 14 = 26 marks in theory
      expect(result.minPassingTheory).toBe(26);
    });

    it('caps total internal at 50 marks maximum', () => {
      const result = campusLifeStore.calculateHptuInternal(25, 25, 10, 95);
      expect(result.totalInternal).toBeLessThanOrEqual(50);
    });

    it('retrieves HPTU internal scores correctly for student subjects', () => {
      const subjects = campusLifeStore.getHptuInternalScores('26CSE001');
      expect(subjects.length).toBeGreaterThanOrEqual(4);
      expect(subjects[0]).toHaveProperty('subject_code');
      expect(subjects[0]).toHaveProperty('total_internal');
      expect(subjects[0]).toHaveProperty('min_theory_passing_marks');
    });
  });

  describe('2. Campus Emergency SOS & Rapid Directory', () => {
    it('returns official emergency numbers with 24x7 response', () => {
      const contacts = campusLifeStore.getEmergencyContacts();
      expect(contacts.length).toBeGreaterThanOrEqual(5);

      const ambulance = contacts.find(c => c.department === 'Medical Services');
      expect(ambulance).toBeDefined();
      expect(ambulance?.phone).toContain('98160');
      expect(ambulance?.is_24x7).toBe(true);
      expect(ambulance?.priority_level).toBe('Immediate');

      const security = contacts.find(c => c.department === 'Campus Security');
      expect(security).toBeDefined();
      expect(security?.location).toContain('Gate No. 1');
    });
  });

  describe('3. Campus Dispensary & Medical Attendance Exemption', () => {
    it('returns dispensary OPD records for student roll', () => {
      const visits = campusLifeStore.getDispensaryVisits('26CSE001');
      expect(visits.length).toBeGreaterThanOrEqual(1);
      expect(visits[0]).toHaveProperty('diagnosis');
      expect(visits[0]).toHaveProperty('prescribed_medicines');
      expect(visits[0].medical_exemption_issued).toBe(true);
    });

    it('allows recording a new dispensary visit and persists to storage', () => {
      const newVisit = {
        id: 'disp-test-999',
        student_id: 'prof-std-cse-001',
        student_roll: '26CSE001',
        student_name: 'Aarav Sharma',
        visit_date: '2026-04-10',
        symptoms: 'Mild migraine headache and fatigue',
        diagnosis: 'Tension Headache',
        prescribed_medicines: ['Naproxen 250mg', 'Rest'],
        rest_advised_hours: 6,
        medical_exemption_issued: true,
        attending_doctor: 'Dr. R. K. Sharma'
      };

      campusLifeStore.addDispensaryVisit(newVisit);
      const visits = campusLifeStore.getDispensaryVisits('26CSE001');
      const found = visits.find(v => v.id === 'disp-test-999');
      expect(found).toBeDefined();
      expect(found?.diagnosis).toBe('Tension Headache');
    });
  });

  describe('4. Student Role Navigation Integration', () => {
    it('includes all newly implemented institutional modules in STUDENT_NAV', () => {
      const navItems = getNavigationForRole('student');
      const navIds = navItems.map(n => n.id);

      expect(navIds).toContain('id_card');
      expect(navIds).toContain('internals');
      expect(navIds).toContain('events');
      expect(navIds).toContain('lost_found');
      expect(navIds).toContain('emergency_sos');
      expect(navIds).toContain('parent_portal');
      expect(navIds).toContain('admit_card');
      expect(navIds).toContain('fees');
      expect(navIds).toContain('library');
      expect(navIds).toContain('transport');
      expect(navIds).toContain('mess');
      expect(navIds).toContain('placements');
    });
  });
});
