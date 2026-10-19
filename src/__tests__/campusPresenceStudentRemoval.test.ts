import { describe, it, expect } from 'vitest';
import { STUDENT_NAV, getNavigationForRole } from '../config/navigation';
import fs from 'fs';
import path from 'path';

describe('HIET Digital Campus — Removal of Campus Presence from Student Interface', () => {
  // 1. Student Sidebar & Navigation Menu Cleanliness
  describe('1. Student Sidebar & Navigation Menu Cleanliness', () => {
    it('completely removes Campus Presence from student navigation items', () => {
      const studentNav = getNavigationForRole('student');
      const studentNavIds = studentNav.map(item => item.id);
      const studentNavLabels = studentNav.map(item => item.label.toLowerCase());

      expect(studentNavIds).not.toContain('campus_presence');
      expect(studentNavLabels).not.toContain('campus presence');
    });

    it('ensures STUDENT_NAV constant does not declare campus_presence', () => {
      const rawPresence = STUDENT_NAV.find(item => item.id === 'campus_presence');
      expect(rawPresence).toBeUndefined();
    });

    it('retains essential pass modules (gate_pass, hostel_outpass) in student navigation', () => {
      const studentNav = getNavigationForRole('student');
      const studentNavIds = studentNav.map(item => item.id);

      expect(studentNavIds).toContain('gate_pass');
      expect(studentNavIds).toContain('hostel_outpass');
    });

    it('preserves campus_presence navigation for authorized security and administration roles', () => {
      const securityNav = getNavigationForRole('security');
      const securityGuardNav = getNavigationForRole('security_guard');
      const wardenNav = getNavigationForRole('warden');
      const mdNav = getNavigationForRole('managing_director');

      expect(securityNav.map(n => n.id)).toContain('campus_presence');
      expect(securityGuardNav.map(n => n.id)).toContain('campus_presence');
      expect(wardenNav.map(n => n.id)).toContain('campus_presence');
      expect(mdNav.map(n => n.id)).toContain('campus_presence');
    });
  });

  // 2. Student Dashboard Source Verification
  describe('2. Student Dashboard Source Verification', () => {
    const studentDashboardPath = path.resolve(__dirname, '../views/StudentDashboard.tsx');
    const studentDashboardSource = fs.readFileSync(studentDashboardPath, 'utf-8');

    it('does not import CampusPresenceView in StudentDashboard', () => {
      expect(studentDashboardSource).not.toContain("import { CampusPresenceView }");
    });

    it('does not render CampusPresenceView in StudentDashboard', () => {
      expect(studentDashboardSource).not.toContain("<CampusPresenceView");
    });

    it('includes a fallback redirect for campus_presence tab to dashboard overview', () => {
      expect(studentDashboardSource).toContain("currentTab as string) === 'campus_presence'");
      expect(studentDashboardSource).toContain("onNavigateTab('dashboard')");
    });

    it('preserves all other quick action cards and dashboard stats intact', () => {
      expect(studentDashboardSource).toContain('scan_attendance');
      expect(studentDashboardSource).toContain('gate_pass');
      expect(studentDashboardSource).toContain('hostel_outpass');
      expect(studentDashboardSource).toContain('apply_leave');
      expect(studentDashboardSource).toContain('voice_ai');
    });
  });

  // 3. Command Palette Cleanliness
  describe('3. Command Palette Modal Verification', () => {
    const cmdPalettePath = path.resolve(__dirname, '../components/common/CommandPaletteModal.tsx');
    const cmdPaletteSource = fs.readFileSync(cmdPalettePath, 'utf-8');

    it('does not contain "Campus Presence & Passes" category in command palette', () => {
      expect(cmdPaletteSource).not.toContain("'Campus Presence & Passes'");
      expect(cmdPaletteSource).toContain("'Campus Passes & Clearance'");
    });

    it('does not register any campus_presence tab item in command palette items', () => {
      expect(cmdPaletteSource).not.toContain("tab: 'campus_presence'");
    });
  });

  // 4. Mobile Bottom Navigation Preservation
  describe('4. Mobile Bottom Navigation Preservation', () => {
    const mobileBottomNavPath = path.resolve(__dirname, '../components/common/MobileBottomNav.tsx');
    const mobileBottomNavSource = fs.readFileSync(mobileBottomNavPath, 'utf-8');

    it('preserves Home, Academics, and Profile bottom navigation for students', () => {
      expect(mobileBottomNavSource).toContain("label: 'Home'");
      expect(mobileBottomNavSource).toContain("label: 'Academics'");
      expect(mobileBottomNavSource).toContain("label: 'Profile'");
    });

    it('does not include campus_presence in active tabs for bottom navigation', () => {
      expect(mobileBottomNavSource).not.toContain("'campus_presence'");
    });
  });
});
