import { describe, it, expect, beforeEach } from 'vitest';
import { campusLifeStore } from '../lib/campusLifeData';
import { StudentFeeRecord, BorrowedBookRecord, MessFeedbackRecord } from '../types';

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

describe('Campus Life & Accounts Modules', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Fee Payment & Official Receipts', () => {
    it('retrieves initial fee records with institutional breakdown', () => {
      const records = campusLifeStore.getFeeRecords('26CSE001');
      expect(records.length).toBeGreaterThan(0);

      const rec = records[0];
      expect(rec.receipt_no).toContain('HIET/REC');
      expect(rec.student_roll).toBe('26CSE001');
      expect(rec.payment_status).toBe('paid');
      expect(rec.breakdown.length).toBeGreaterThan(0);
      expect(rec.breakdown.some(b => b.head.includes('Tuition Fee'))).toBe(true);
    });

    it('records a new fee payment and updates persistent store', () => {
      const newPay: StudentFeeRecord = {
        id: 'test-pay-001',
        receipt_no: 'HIET/REC/2026/9999',
        student_id: 'std-test',
        student_roll: '26CSE001',
        student_name: 'Aarav Sharma',
        semester: 6,
        academic_year: '2025-2026',
        total_amount: 30000,
        paid_amount: 30000,
        due_amount: 0,
        payment_status: 'paid',
        payment_mode: 'UPI',
        transaction_ref: 'UPI/999999999',
        payment_date: '2026-10-18',
        breakdown: [{ head: 'Tuition Advance', amount: 30000 }],
        created_at: new Date().toISOString()
      };

      campusLifeStore.addFeePayment(newPay);
      const updated = campusLifeStore.getFeeRecords('26CSE001');
      expect(updated.some(r => r.receipt_no === 'HIET/REC/2026/9999')).toBe(true);
    });
  });

  describe('Central Library & Book Tracking (OPAC)', () => {
    it('retrieves official book catalog with rack and shelf locations', () => {
      const books = campusLifeStore.getLibraryBooks();
      expect(books.length).toBeGreaterThan(3);

      const clrs = books.find(b => b.title.includes('Algorithms'));
      expect(clrs).toBeDefined();
      expect(clrs?.shelf_location).toContain('Stack Hall');
      expect(clrs?.available_copies).toBeGreaterThan(0);
    });

    it('allows book borrowing and extends due date on renewal', () => {
      const initialBorrowed = campusLifeStore.getBorrowedBooks();
      expect(initialBorrowed.length).toBeGreaterThan(0);

      const firstBook = initialBorrowed[0];
      const initialDue = firstBook.due_date;
      campusLifeStore.renewBook(firstBook.id);

      const afterRenew = campusLifeStore.getBorrowedBooks();
      const updatedBook = afterRenew.find(b => b.id === firstBook.id);
      expect(updatedBook?.renew_count).toBe(firstBook.renew_count + 1);
      expect(new Date(updatedBook!.due_date).getTime()).toBeGreaterThan(new Date(initialDue).getTime());
    });
  });

  describe('Campus Bus Transport Tracker', () => {
    it('provides all 4 major HIET bus routes with verified driver contacts', () => {
      const routes = campusLifeStore.getBusRoutes();
      expect(routes.length).toBe(4);

      const dharamshalaRoute = routes.find(r => r.route_number === 'Route 1');
      expect(dharamshalaRoute).toBeDefined();
      expect(dharamshalaRoute?.driver_name).toContain('Ramesh Kumar');
      expect(dharamshalaRoute?.driver_phone).toBeDefined();
      expect(dharamshalaRoute?.stops.length).toBeGreaterThan(3);
    });
  });

  describe('Hostel Mess Menu & Feedback', () => {
    it('provides 7-day FSSAI-compliant balanced meal schedules', () => {
      const menu = campusLifeStore.getMessMenu();
      expect(menu.length).toBe(7);

      const monday = menu.find(m => m.day === 'Monday');
      expect(monday).toBeDefined();
      expect(monday?.breakfast).toContain('Paratha');
      expect(monday?.lunch).toContain('Rajma');
      expect(monday?.dinner).toContain('Dal Makhani');
    });

    it('records student daily meal feedback with ratings', () => {
      const fb: MessFeedbackRecord = {
        id: 'fb-test-1',
        student_id: 'std-test',
        student_name: 'Aarav Sharma',
        meal_type: 'Dinner',
        date: '2026-10-18',
        rating: 5,
        hygiene_rating: 5,
        comment: 'Great dinner tonight!',
        created_at: new Date().toISOString()
      };

      campusLifeStore.addMessFeedback(fb);
      const allFb = campusLifeStore.getMessFeedback();
      expect(allFb.some(f => f.id === 'fb-test-1')).toBe(true);
    });
  });

  describe('Training & Placement (T&P) and Alumni Network', () => {
    it('provides active campus placement drives with package and criteria', () => {
      const drives = campusLifeStore.getPlacementDrives();
      expect(drives.length).toBeGreaterThan(2);

      const tcs = drives.find(d => d.company_name.includes('TCS'));
      expect(tcs).toBeDefined();
      expect(tcs?.package_lpa).toContain('LPA');
      expect(tcs?.eligible_branches).toContain('CSE');
    });

    it('contains alumni mentorship network profiles', () => {
      const alumni = campusLifeStore.getAlumniProfiles();
      expect(alumni.length).toBeGreaterThan(2);

      const msftAlum = alumni.find(a => a.current_company.includes('Microsoft'));
      expect(msftAlum).toBeDefined();
      expect(msftAlum?.available_for_mentorship).toBe(true);
    });
  });
});
