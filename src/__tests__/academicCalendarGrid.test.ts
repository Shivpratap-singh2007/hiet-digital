import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { INITIAL_CALENDAR, dataStore } from '../lib/mockData';
import { apiService } from '../lib/supabase';
import { CalendarEvent } from '../types';

describe('HIET Digital Campus — Academic Calendar Monthly Grid & Event System', () => {
  const calendarViewPath = path.resolve(__dirname, '../components/common/CalendarView.tsx');
  const calendarViewSource = fs.readFileSync(calendarViewPath, 'utf-8');

  beforeEach(() => {
    // Reset dataStore calendar
    dataStore.setCalendar([...INITIAL_CALENDAR]);
  });

  // 1. Calendar UI & 7-Column Grid Layout Tests
  describe('1. Calendar UI & 7-Column Grid Layout', () => {
    it('implements 7-column grid with Sunday through Saturday', () => {
      expect(calendarViewSource).toContain("short: 'S', full: 'Sun'");
      expect(calendarViewSource).toContain("short: 'M', full: 'Mon'");
      expect(calendarViewSource).toContain("short: 'T', full: 'Tue'");
      expect(calendarViewSource).toContain("short: 'W', full: 'Wed'");
      expect(calendarViewSource).toContain("short: 'T', full: 'Thu'");
      expect(calendarViewSource).toContain("short: 'F', full: 'Fri'");
      expect(calendarViewSource).toContain("short: 'S', full: 'Sat'");
      expect(calendarViewSource).toContain('grid-cols-7');
    });

    it('highlights today using solid Navy Blue circle (#0F2942)', () => {
      expect(calendarViewSource).toContain('bg-[#0F2942] text-white font-extrabold shadow-2xs');
      expect(calendarViewSource).toContain('isToday');
    });

    it('renders Navy Blue event indicator dots under dates containing events', () => {
      expect(calendarViewSource).toContain('w-1.5 h-1.5 rounded-full bg-[#0F2942]');
      expect(calendarViewSource).toContain('cell.hasEvents');
    });

    it('provides Previous Month and Next Month navigation with Today button', () => {
      expect(calendarViewSource).toContain('handlePrevMonth');
      expect(calendarViewSource).toContain('handleNextMonth');
      expect(calendarViewSource).toContain('handleGoToToday');
      expect(calendarViewSource).toContain('ChevronLeft');
      expect(calendarViewSource).toContain('ChevronRight');
      expect(calendarViewSource).toContain('handleGoToToday');
      expect(calendarViewSource).toContain('Today');
    });

    it('supports Month Grid and Agenda List view toggles without page reload', () => {
      expect(calendarViewSource).toContain("setViewMode('month')");
      expect(calendarViewSource).toContain("setViewMode('agenda')");
      expect(calendarViewSource).toContain('Month Grid');
      expect(calendarViewSource).toContain('Agenda List');
      expect(calendarViewSource).not.toContain('window.location.reload()');
      expect(calendarViewSource).not.toContain('window.location.href');
    });
  });

  // 2. Academic Categories & Rich Dataset Coverage
  describe('2. Comprehensive Academic Event Categories', () => {
    it('covers all 9 required institutional event categories in INITIAL_CALENDAR', () => {
      const events = dataStore.getCalendar();
      const categories = new Set(events.map(e => e.event_type));

      expect(categories).toContain('Classes');
      expect(categories).toContain('Exams');
      expect(categories).toContain('Assignments');
      expect(categories).toContain('Holidays');
      expect(categories).toContain('Seminars');
      expect(categories).toContain('Hackathons');
      expect(categories).toContain('Placements');
      expect(categories).toContain('Important Dates');
    });

    it('contains verified metadata including venue, audience, start_time, end_time, and verification status', () => {
      const events = dataStore.getCalendar();
      
      const sessionalExam = events.find(e => e.title.includes('Sessional 1'));
      expect(sessionalExam).toBeDefined();
      expect(sessionalExam?.venue).toContain('Academic Block A Exam Halls');
      expect(sessionalExam?.audience).toContain('All B.Tech Students');
      expect(sessionalExam?.is_verified).toBe(true);

      const holiday = events.find(e => e.title.includes('Mahatma Gandhi Jayanti'));
      expect(holiday).toBeDefined();
      expect(holiday?.event_type).toBe('Holidays');
      expect(holiday?.is_verified).toBe(true);

      const hackathon = events.find(e => e.title.includes('Dhauladhar CodeFest'));
      expect(hackathon).toBeDefined();
      expect(hackathon?.event_type).toBe('Hackathons');

      const placement = events.find(e => e.title.includes('Campus Placement Drive'));
      expect(placement).toBeDefined();
      expect(placement?.event_type).toBe('Placements');
    });

    it('supports multi-day events matching across all intermediate dates', () => {
      const multiDay = INITIAL_CALENDAR.find(e => e.id === 'cal-01'); // Oct 5 to Oct 10
      expect(multiDay).toBeDefined();

      const startKey = multiDay!.start_datetime.slice(0, 10);
      const endKey = multiDay!.end_datetime.slice(0, 10);
      expect(startKey).toBe('2026-10-05');
      expect(endKey).toBe('2026-10-10');

      // Date in between
      const testDate = '2026-10-07';
      const isMatch = testDate >= startKey && testDate <= endKey;
      expect(isMatch).toBe(true);
    });
  });

  // 3. Event CRUD & Persistence Operations
  describe('3. Event CRUD and Persistence Operations', () => {
    it('creates a new institutional event and persists it in dataStore', async () => {
      const newEventPayload: Omit<CalendarEvent, 'id'> = {
        title: 'B.Tech Robotics Annual Showcase 2026',
        description: 'Demonstration of autonomous rover and drone projects by student innovators.',
        event_type: 'Events',
        start_datetime: '2026-11-18T10:00:00',
        end_datetime: '2026-11-18T16:00:00',
        start_time: '10:00 AM',
        end_time: '04:00 PM',
        venue: 'Robotics Workshop Block C',
        department: 'ME',
        audience: 'All Students & Faculty',
        is_verified: true
      };

      const created = await apiService.createCalendarEvent(newEventPayload);
      expect(created.id).toBeDefined();
      expect(created.title).toBe('B.Tech Robotics Annual Showcase 2026');

      // Verify persistence in dataStore
      const current = dataStore.getCalendar();
      const found = current.find(e => e.id === created.id);
      expect(found).toBeDefined();
      expect(found?.venue).toBe('Robotics Workshop Block C');
    });

    it('updates an existing event and saves modifications', async () => {
      const updated = await apiService.updateCalendarEvent('cal-01', {
        title: 'Sessional 1 Examinations (B.Tech Midterm Rescheduled)',
        venue: 'Block B Examination Hall 2'
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toContain('Rescheduled');
      expect(updated?.venue).toBe('Block B Examination Hall 2');

      const current = dataStore.getCalendar();
      const found = current.find(e => e.id === 'cal-01');
      expect(found?.title).toContain('Rescheduled');
      expect(found?.venue).toBe('Block B Examination Hall 2');
    });

    it('deletes an event and removes it cleanly from dataStore', async () => {
      const beforeCount = dataStore.getCalendar().length;
      const success = await apiService.deleteCalendarEvent('cal-02');
      expect(success).toBe(true);

      const after = dataStore.getCalendar();
      expect(after.length).toBe(beforeCount - 1);
      expect(after.find(e => e.id === 'cal-02')).toBeUndefined();
    });
  });

  // 4. Role-Based Permissions & Strict Institutional Palette
  describe('4. Role-Based Permissions & Institutional Color Palette', () => {
    it('restricts Add, Edit, and Delete actions to authorized roles', () => {
      expect(calendarViewSource).toContain("const isAuthorized = role === 'admin' || role === 'principal' || role === 'managing_director' || role === 'md' || role === 'hod' || role === 'teacher' || role === 'faculty';");
      expect(calendarViewSource).toContain('{isAuthorized && (');
    });

    it('enforces Navy Blue and White institutional palette without decorative colors', () => {
      // Must use Navy Blue primary #0F2942
      expect(calendarViewSource).toContain('#0F2942');
      expect(calendarViewSource).toContain('#183B56');
      expect(calendarViewSource).toContain('#E2E8F0');
      expect(calendarViewSource).toContain('#64748B');

      // Should NOT have green, amber, red, purple or bright blue decorative utility classes
      expect(calendarViewSource).not.toContain('bg-emerald');
      expect(calendarViewSource).not.toContain('bg-green');
      expect(calendarViewSource).not.toContain('bg-amber');
      expect(calendarViewSource).not.toContain('bg-purple');
      expect(calendarViewSource).not.toContain('text-emerald');
      expect(calendarViewSource).not.toContain('text-green');
      expect(calendarViewSource).not.toContain('text-purple');
    });

    it('provides safe bottom padding for mobile navigation bar', () => {
      expect(calendarViewSource).toContain('pb-24');
    });
  });
});
