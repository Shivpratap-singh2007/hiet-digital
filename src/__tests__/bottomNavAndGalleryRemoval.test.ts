import { describe, it, expect } from 'vitest';
import { STUDENT_NAV, getNavigationForRole } from '../config/navigation';
import { getTabFromPathname, getPathForTab } from '../lib/appNavigation';
import fs from 'fs';
import path from 'path';

describe('HIET Digital Campus — Services Tab and Campus Gallery Removal', () => {
  const mobileBottomNavPath = path.resolve(__dirname, '../components/common/MobileBottomNav.tsx');
  const mobileBottomNavSource = fs.readFileSync(mobileBottomNavPath, 'utf-8');

  const studentDashboardPath = path.resolve(__dirname, '../views/StudentDashboard.tsx');
  const studentDashboardSource = fs.readFileSync(studentDashboardPath, 'utf-8');

  const servicesHubPath = path.resolve(__dirname, '../components/student/ServicesHubView.tsx');
  const servicesHubSource = fs.readFileSync(servicesHubPath, 'utf-8');

  const mobileAppViewPath = path.resolve(__dirname, '../components/mobile/MobileAppView.tsx');
  const mobileAppViewSource = fs.readFileSync(mobileAppViewPath, 'utf-8');

  const appPath = path.resolve(__dirname, '../App.tsx');
  const appSource = fs.readFileSync(appPath, 'utf-8');

  // =========================================================================
  // 1. Bottom Navigation Bar Specifications
  // =========================================================================
  describe('1. Mobile Bottom Navigation Bar (Home | Academics | Profile)', () => {
    it('contains strictly Home, Academics, and Profile tabs for student role', () => {
      // Find student nav block
      const studentBlockMatch = mobileBottomNavSource.match(/case 'student':([\s\S]*?)case 'teacher':/);
      expect(studentBlockMatch).not.toBeNull();
      const studentBlock = studentBlockMatch![1];

      expect(studentBlock).toContain("label: 'Home'");
      expect(studentBlock).toContain("label: 'Academics'");
      expect(studentBlock).toContain("label: 'Profile'");
      expect(studentBlock).not.toContain("label: 'Services'");
      expect(studentBlock).not.toContain("id: 'services'");
    });

    it('contains strictly Home, Academics, and Profile tabs in default fallback', () => {
      const defaultBlockMatch = mobileBottomNavSource.match(/default:([\s\S]*?)\];/);
      expect(defaultBlockMatch).not.toBeNull();
      const defaultBlock = defaultBlockMatch![1];

      expect(defaultBlock).toContain("label: 'Home'");
      expect(defaultBlock).toContain("label: 'Academics'");
      expect(defaultBlock).toContain("label: 'Profile'");
      expect(defaultBlock).not.toContain("label: 'Services'");
    });

    it('uses Navy Blue active indicators and responsive 3-tab layout', () => {
      expect(mobileBottomNavSource).toContain('text-[#0f2942]');
      expect(mobileBottomNavSource).toContain('bg-[#0f2942]');
      expect(mobileBottomNavSource).toContain('flex items-center justify-around');
      expect(mobileBottomNavSource).toContain('flex-1');
    });

    it('does not check for services or gallery in isTabActive', () => {
      expect(mobileBottomNavSource).not.toContain("itemId === 'services'");
      expect(mobileBottomNavSource).not.toContain("'gallery'");
    });

    it('reassigns campus services to highlight Home / dashboard tab', () => {
      const dashboardTabsMatch = mobileBottomNavSource.match(/if \(itemId === 'dashboard'\) \{([\s\S]*?)\}/);
      expect(dashboardTabsMatch).not.toBeNull();
      const dashboardTabs = dashboardTabsMatch![1];

      // Key services reassigned to Home dashboard
      expect(dashboardTabs).toContain("'leaves'");
      expect(dashboardTabs).toContain("'complaints'");
      expect(dashboardTabs).toContain("'doubts'");
      expect(dashboardTabs).toContain("'gate_pass'");
      expect(dashboardTabs).toContain("'hostel_outpass'");
      expect(dashboardTabs).toContain("'fees'");
      expect(dashboardTabs).toContain("'admit_card'");
      expect(dashboardTabs).toContain("'emergency_sos'");
      expect(dashboardTabs).toContain("'notices'");
    });
  });

  // =========================================================================
  // 2. Complete Removal of Campus Gallery & Social Sphere
  // =========================================================================
  describe('2. Campus Gallery & Social Sphere Complete Removal', () => {
    it('completely removes gallery from STUDENT_NAV and getNavigationForRole', () => {
      const studentNav = getNavigationForRole('student');
      const hasGallery = studentNav.some(item => item.id === 'gallery' || item.label.toLowerCase() === 'gallery');
      expect(hasGallery).toBe(false);

      const rawGallery = STUDENT_NAV.find(item => item.id === 'gallery');
      expect(rawGallery).toBeUndefined();
    });

    it('removes Campus Life & Gallery service card from ServicesHubView', () => {
      expect(servicesHubSource).not.toContain("title: 'Campus Life & Gallery'");
      expect(servicesHubSource).not.toContain("id: 'gallery'");
    });

    it('removes Photo Gallery button and gallery subview from MobileAppView', () => {
      expect(mobileAppViewSource).not.toContain("10. Photo Gallery");
      expect(mobileAppViewSource).not.toContain("import { CampusGalleryView }");
      expect(mobileAppViewSource).not.toContain("case 'gallery': return <CampusGalleryView />;");
    });

    it('removes CampusGalleryModal from App.tsx', () => {
      expect(appSource).not.toContain("import { CampusGalleryModal }");
      expect(appSource).not.toContain("<CampusGalleryModal");
      expect(appSource).not.toContain("showGalleryModal");
    });

    it('does not render CampusGalleryView in StudentDashboard', () => {
      expect(studentDashboardSource).not.toContain("import { CampusGalleryView }");
      expect(studentDashboardSource).not.toContain("<CampusGalleryView");
    });
  });

  // =========================================================================
  // 3. Clean Up Services Navigation & Preservation of Useful Features
  // =========================================================================
  describe('3. Clean Up Services Navigation & Preservation of Features', () => {
    it('does not render ServicesHubView in StudentDashboard', () => {
      expect(studentDashboardSource).not.toContain("import { ServicesHubView }");
      expect(studentDashboardSource).not.toContain("<ServicesHubView");
    });

    it('redirects decommissioned services and gallery tabs to dashboard in StudentDashboard', () => {
      expect(studentDashboardSource).toContain("currentTab === 'services'");
      expect(studentDashboardSource).toContain("currentTab === 'gallery'");
      expect(studentDashboardSource).toContain("onNavigateTab('dashboard')");
    });

    it('redirects /app/services and /app/gallery routes to dashboard in appNavigation', () => {
      expect(getTabFromPathname('/app/services')).toBe('dashboard');
      expect(getTabFromPathname('/app/gallery')).toBe('dashboard');
      expect(getPathForTab('services')).toBe('/app/dashboard');
      expect(getPathForTab('gallery')).toBe('/app/dashboard');
    });

    it('preserves all useful academic and campus service features in student navigation', () => {
      const studentNav = getNavigationForRole('student');
      const studentNavIds = studentNav.map(n => n.id);

      const essentialServices = [
        'attendance',
        'timetable',
        'admit_card',
        'fees',
        'library',
        'transport',
        'mess',
        'placements',
        'emergency_sos',
        'parent_portal',
        'syllabus',
        'pyqs',
        'assignments',
        'cgpa',
        'leaves',
        'complaints',
        'doubts',
        'achievements',
        'gate_pass',
        'hostel_outpass',
        'calendar',
        'notices',
        'settings'
      ];

      for (const serviceId of essentialServices) {
        expect(studentNavIds).toContain(serviceId);
      }
    });
  });
});
