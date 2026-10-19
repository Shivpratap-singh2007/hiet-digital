import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getTabFromPathname, 
  getPathForTab, 
  navigateTo, 
  subscribeToNavigation, 
  setupClientSideLinkInterceptor
} from '../lib/appNavigation';

describe('SPA App Navigation Engine', () => {
  describe('Route resolution (getTabFromPathname)', () => {
    it('resolves root and login paths to dashboard', () => {
      expect(getTabFromPathname('/')).toBe('dashboard');
      expect(getTabFromPathname('/login')).toBe('dashboard');
      expect(getTabFromPathname('')).toBe('dashboard');
    });

    it('resolves direct student module routes and redirects decommissioned services to dashboard', () => {
      expect(getTabFromPathname('/app/dashboard')).toBe('dashboard');
      expect(getTabFromPathname('/app/academics')).toBe('academics');
      expect(getTabFromPathname('/app/services')).toBe('dashboard');
      expect(getTabFromPathname('/app/gallery')).toBe('dashboard');
      expect(getTabFromPathname('/app/profile')).toBe('profile');
      expect(getTabFromPathname('/app/attendance')).toBe('attendance');
      expect(getTabFromPathname('/app/timetable')).toBe('timetable');
      expect(getTabFromPathname('/app/results')).toBe('cgpa');
      expect(getTabFromPathname('/app/leave')).toBe('leaves');
      expect(getTabFromPathname('/app/complaints')).toBe('complaints');
      expect(getTabFromPathname('/app/settings')).toBe('settings');
    });

    it('resolves role-prefixed routes gracefully', () => {
      expect(getTabFromPathname('/app/student/attendance')).toBe('attendance');
      expect(getTabFromPathname('/app/faculty/faculty')).toBe('teachers_mgmt');
      expect(getTabFromPathname('/app/hod/department')).toBe('department');
      expect(getTabFromPathname('/app/principal/analytics')).toBe('principal_analytics');
    });

    it('resolves AI sub-routes', () => {
      expect(getTabFromPathname('/app/ai')).toBe('ai_campus');
      expect(getTabFromPathname('/app/ai/attendance-insights')).toBe('ai_attendance_insights');
      expect(getTabFromPathname('/app/ai/smart-board-summary')).toBe('ai_smart_board_summary');
      expect(getTabFromPathname('/app/campus-assistant')).toBe('ai_campus_assistant');
    });

    it('handles legacy and alias routes', () => {
      expect(getTabFromPathname('/app/internal-calculator')).toBe('cgpa');
      expect(getTabFromPathname('/app/internals')).toBe('cgpa');
      expect(getTabFromPathname('/app/grades')).toBe('cgpa');
      expect(getTabFromPathname('/app/hall-ticket')).toBe('admit_card');
      expect(getTabFromPathname('/app/outpass')).toBe('hostel_outpass');
    });
  });

  describe('Path generation (getPathForTab)', () => {
    it('returns canonical path for tabs', () => {
      expect(getPathForTab('dashboard')).toBe('/app/dashboard');
      expect(getPathForTab('attendance')).toBe('/app/attendance');
      expect(getPathForTab('academics')).toBe('/app/academics');
      expect(getPathForTab('services')).toBe('/app/dashboard');
      expect(getPathForTab('profile')).toBe('/app/profile');
      expect(getPathForTab('ai_campus')).toBe('/app/ai');
    });
  });

  describe('Client-Side Navigation & Subscription', () => {
    beforeEach(() => {
      // Mock minimal window globals for node test environment
      (globalThis as any).window = {
        location: { pathname: '/' },
        history: {
          pushState: vi.fn((_state, _title, url) => {
            (globalThis as any).window.location.pathname = url;
          }),
          replaceState: vi.fn((_state, _title, url) => {
            (globalThis as any).window.location.pathname = url;
          })
        },
        scrollTo: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
    });

    it('pushes history state without full page reload', () => {
      navigateTo('attendance');
      expect((globalThis as any).window.history.pushState).toHaveBeenCalledWith(
        { tab: 'attendance' }, 
        '', 
        '/app/attendance'
      );
      expect((globalThis as any).window.location.pathname).toBe('/app/attendance');
    });

    it('notifies subscribers of tab change', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToNavigation(listener);

      navigateTo('timetable');
      expect(listener).toHaveBeenCalledWith('timetable');

      unsubscribe();
      navigateTo('leaves');
      expect(listener).not.toHaveBeenCalledWith('leaves');
    });
  });
});
