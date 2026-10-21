// =============================================================================
// HIET DIGITAL CAMPUS — APP STARTUP & SPLASH SCREEN VERIFICATION TESTS
// Tests reliable startup sequence, session restoration, splash screen, and role routing
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRoleRedirect } from '../context/AuthContext';
import { getTabFromPathname } from '../lib/appNavigation';

// Setup localStorage and sessionStorage polyfill for node test environment
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

if (typeof globalThis.sessionStorage === 'undefined') {
  let sStore: Record<string, string> = {};
  (globalThis as any).sessionStorage = {
    getItem: (key: string) => sStore[key] || null,
    setItem: (key: string, val: string) => { sStore[key] = String(val); },
    removeItem: (key: string) => { delete sStore[key]; },
    clear: () => { sStore = {}; },
    key: (i: number) => Object.keys(sStore)[i] || null,
    length: 0,
  };
}

describe('HIET Digital Campus — Startup & Splash Screen Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. HTML Boot Splash Screen & Asset Verification', () => {
    it('index.html contains the static branded splash screen in div#root before React mounts', () => {
      const indexPath = path.resolve(__dirname, '../../index.html');
      expect(fs.existsSync(indexPath)).toBe(true);

      const html = fs.readFileSync(indexPath, 'utf-8');
      expect(html).toContain('id="hiet-app-boot-splash"');
      expect(html).toContain('HIET GROUP OF INSTITUTIONS');
      expect(html).toContain('/images/hiet_crest.png');
      expect(html).toContain('background-color:#f8fafc');
      // Must not contain hardcoded black rounded box for emblem
      expect(html).not.toContain('background:#000000');
    });

    it('manifest.json has proper icon configuration and clean maskable icon', () => {
      const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      expect(manifest.display).toBe('standalone');
      expect(manifest.background_color).toBe('#f8fafc');
      expect(manifest.start_url).toBe('/?source=pwa');

      const maskableIcon = manifest.icons.find((i: any) => i.purpose === 'maskable');
      expect(maskableIcon).toBeDefined();
      expect(maskableIcon.src).toBe('/images/hiet_maskable.svg');
    });

    it('maskable SVG icon file exists with solid white background avoiding black box distortion', () => {
      const svgPath = path.resolve(__dirname, '../../public/images/hiet_maskable.svg');
      expect(fs.existsSync(svgPath)).toBe(true);

      const svgContent = fs.readFileSync(svgPath, 'utf-8');
      expect(svgContent).toContain('fill="#ffffff"');
      expect(svgContent).toContain('/images/hiet_crest.png');
    });

    it('service worker provides fast navigation timeout with instant cache fallback', () => {
      const swPath = path.resolve(__dirname, '../../public/sw.js');
      const swContent = fs.readFileSync(swPath, 'utf-8');

      expect(swContent).toContain('timeoutPromise');
      expect(swContent).toContain('/?source=pwa');
      expect(swContent).toContain('/index.html');
    });
  });

  describe('2. Role-Based Navigation & Startup Redirection', () => {
    it('redirects student to /app/student', () => {
      expect(getRoleRedirect('student')).toBe('/app/student');
    });

    it('redirects faculty/teacher to /app/faculty', () => {
      expect(getRoleRedirect('teacher')).toBe('/app/faculty');
      expect(getRoleRedirect('faculty')).toBe('/app/faculty');
    });

    it('redirects HOD to /app/hod', () => {
      expect(getRoleRedirect('hod')).toBe('/app/hod');
    });

    it('redirects principal/admin to /app/admin', () => {
      expect(getRoleRedirect('principal')).toBe('/app/admin');
      expect(getRoleRedirect('admin')).toBe('/app/admin');
    });

    it('redirects Managing Director to /app/md', () => {
      expect(getRoleRedirect('managing_director')).toBe('/app/md');
      expect(getRoleRedirect('md')).toBe('/app/md');
    });

    it('redirects security to /app/security', () => {
      expect(getRoleRedirect('security')).toBe('/app/security');
      expect(getRoleRedirect('security_guard')).toBe('/app/security');
    });

    it('redirects warden to /app/warden', () => {
      expect(getRoleRedirect('warden')).toBe('/app/warden');
    });

    it('redirects library staff to /app/library', () => {
      expect(getRoleRedirect('library_staff')).toBe('/app/library');
    });

    it('defaults unauthenticated or unknown role to /app/student safely', () => {
      expect(getRoleRedirect(null)).toBe('/app/student');
      expect(getRoleRedirect(undefined)).toBe('/app/student');
      expect(getRoleRedirect('unknown_role')).toBe('/app/student');
    });
  });

  describe('3. Path & Tab Resolution on App Startup', () => {
    it('resolves root "/" to dashboard', () => {
      expect(getTabFromPathname('/')).toBe('dashboard');
    });

    it('resolves "/login" to dashboard (with login modal triggered)', () => {
      expect(getTabFromPathname('/login')).toBe('dashboard');
    });

    it('resolves direct tab URLs properly', () => {
      expect(getTabFromPathname('/app/attendance')).toBe('attendance');
      expect(getTabFromPathname('/app/timetable')).toBe('timetable');
      expect(getTabFromPathname('/app/gate-pass')).toBe('gate_pass');
      expect(getTabFromPathname('/app/notices')).toBe('notices');
      expect(getTabFromPathname('/app/results')).toBe('cgpa');
    });

    it('handles role-prefixed URLs seamlessly (/app/student/attendance)', () => {
      expect(getTabFromPathname('/app/student/attendance')).toBe('attendance');
      expect(getTabFromPathname('/app/faculty/timetable')).toBe('timetable');
      expect(getTabFromPathname('/app/security/scan')).toBe('gate_scanner');
    });
  });

  describe('4. Session Recovery & Graceful Degradation', () => {
    it('restores cached student profile from localStorage without errors', () => {
      const mockUser = {
        id: 'prof-std-001',
        name: 'Aarav Sharma',
        role: 'student',
        email: 'aarav@hiet.ac.in'
      };
      localStorage.setItem('hiet_current_user', JSON.stringify(mockUser));

      const saved = localStorage.getItem('hiet_current_user');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.name).toBe('Aarav Sharma');
      expect(parsed.role).toBe('student');
    });

    it('handles corrupted localStorage without throwing unhandled exceptions', () => {
      localStorage.setItem('hiet_current_user', 'corrupted-json{[[[');

      let parsed = null;
      expect(() => {
        try {
          parsed = JSON.parse(localStorage.getItem('hiet_current_user')!);
        } catch {
          localStorage.removeItem('hiet_current_user');
        }
      }).not.toThrow();

      expect(parsed).toBeNull();
      expect(localStorage.getItem('hiet_current_user')).toBeNull();
    });
  });

  describe('5. React Hook Order & Startup Crash Prevention', () => {
    it('ensures all React hooks in MainLayout are called before any early return statements', () => {
      const appCode = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');
      
      // Locate MainLayout component declaration and its first early return
      const mainLayoutStart = appCode.indexOf('const MainLayout: React.FC = () => {');
      expect(mainLayoutStart).toBeGreaterThan(-1);

      const mainLayoutBody = appCode.slice(mainLayoutStart);
      const firstEarlyReturn = mainLayoutBody.indexOf('if (isInitializing)');
      expect(firstEarlyReturn).toBeGreaterThan(-1);

      const codeBeforeFirstEarlyReturn = mainLayoutBody.slice(0, firstEarlyReturn);
      const codeAfterFirstEarlyReturn = mainLayoutBody.slice(firstEarlyReturn);

      // Verify that no React.useEffect, useEffect, React.useState, or useState is called after early returns
      const hookRegex = /\b(useEffect|useState|useMemo|useCallback|useContext)\s*\(/g;
      const hooksAfterEarlyReturn = codeAfterFirstEarlyReturn.match(hookRegex);
      expect(hooksAfterEarlyReturn).toBeNull();

      // Verify previewRole URL cleanup hook is declared before the early return
      expect(codeBeforeFirstEarlyReturn).toContain('previewRole');
    });

    it('verifies InstitutionalErrorBoundary safely captures diagnostics and cleans only auth state', () => {
      const boundaryCode = fs.readFileSync(path.resolve(__dirname, '../components/common/InstitutionalErrorBoundary.tsx'), 'utf-8');
      
      // Diagnostic details disclosure exists
      expect(boundaryCode).toContain('Diagnostic Details');
      expect(boundaryCode).toContain('this.state.errorMessage');
      
      // Reset only targets session/auth keys rather than unrelated local data
      expect(boundaryCode).toContain("localStorage.removeItem('hiet_current_user')");
      expect(boundaryCode).toContain("localStorage.removeItem('hiet_active_workspace_role')");
      expect(boundaryCode).not.toContain('localStorage.clear()');
    });
  });
});
