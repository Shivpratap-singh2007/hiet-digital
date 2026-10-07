import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { ChangePasswordModal } from './components/common/ChangePasswordModal';
import { StudentRegisterModal } from './components/auth/StudentRegisterModal';
import { TeacherRegisterModal } from './components/auth/TeacherRegisterModal';
import { LoginModal } from './components/auth/LoginModal';
import { UserRole } from './types';

// Views
import { LandingPage } from './views/LandingPage';
import { ManagingDirectorDashboard } from './views/ManagingDirectorDashboard';
import { StudentDashboard } from './views/StudentDashboard';
import { TeacherDashboard } from './views/TeacherDashboard';
import { HodDashboard } from './views/HodDashboard';
import { PrincipalDashboard } from './views/PrincipalDashboard';
import { SecurityDashboard } from './views/SecurityDashboard';
import { CampusGalleryModal } from './components/common/CampusGalleryModal';
import { NotificationsModal } from './components/common/NotificationsModal';
import { VerifyPublicDoc } from './components/common/VerifyPublicDoc';
import { DemoAccountsPage } from './pages/dev/DemoAccountsPage';

const MainLayout: React.FC = () => {
  const { user, role, mustChangePassword } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Auth Modals state (auto-open if URL is /login)
  const [showLoginModal, setShowLoginModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === '/login';
    }
    return false;
  });
  const [showStudentRegModal, setShowStudentRegModal] = useState(false);
  const [showTeacherRegModal, setShowTeacherRegModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isDev = Boolean(import.meta.env.DEV);

  // Synchronize URL paths under /app/* with currentTab
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (path.startsWith('/app/')) {
      const seg = path.replace('/app/', '').split('/')[0];
      const tabMap: Record<string, NavTab> = {
        'dashboard': 'dashboard',
        'attendance': 'attendance',
        'timetable': 'timetable',
        'syllabus': 'syllabus',
        'pyqs': 'pyqs',
        'assignments': 'assignments',
        'results': 'cgpa',
        'sessional-marks': 'sessional_results',
        'leave': 'leaves',
        'complaints': 'complaints',
        'doubts': 'doubts',
        'achievements': 'achievements',
        'gate-pass': 'gate_pass',
        'hostel-outpass': 'hostel_outpass',
        'presence': 'campus_presence',
        'calendar': 'calendar',
        'gallery': 'gallery',
        'smart-board': 'smartboard',
        'students': 'students_mgmt',
        'faculty': 'teachers_mgmt',
        'academic-catalog': 'academic_catalog',
        'departments': 'department',
        'syllabus-progress': 'syllabus_progress',
        'no-dues': 'no_dues',
        'events': 'events',
        'maintenance': 'maintenance',
        'lost-found': 'lost_found',
        'import': 'import_data',
        'reports': 'reports',
        'analytics': 'principal_analytics',
        'audit-log': 'audit_log',
        'scan': 'gate_scanner',
        'entry-exit-logs': 'reconciliation',
        'security-alerts': 'fines',
        'notifications': 'notices',
        'settings': 'settings'
      };
      if (tabMap[seg]) {
        setCurrentTab(tabMap[seg]);
      }
    }
  }, []);

  // Development Demo Accounts Switcher (/dev/demo-accounts)
  if (isDev && pathname === '/dev/demo-accounts') {
    return <DemoAccountsPage />;
  }

  // 0. Public Document Verification Route Handling (/verify/hall-ticket/:token & /verify/certificate/:token)
  if (pathname.startsWith('/verify/hall-ticket/')) {
    const token = pathname.replace('/verify/hall-ticket/', '').split('/')[0] || '';
    return <VerifyPublicDoc type="hall-ticket" token={token} onGoHome={() => { window.location.href = '/'; }} />;
  }
  if (pathname.startsWith('/verify/certificate/')) {
    const token = pathname.replace('/verify/certificate/', '').split('/')[0] || '';
    return <VerifyPublicDoc type="certificate" token={token} onGoHome={() => { window.location.href = '/'; }} />;
  }

  // Development Role Preview Support (?previewRole=student|faculty|hod|principal|security)
  let effectiveRole = role;
  let devPreviewActive = false;

  if (isDev && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const pRole = params.get('previewRole');
    if (pRole) {
      devPreviewActive = true;
      if (pRole === 'faculty') effectiveRole = 'teacher';
      else if (pRole === 'principal') effectiveRole = 'principal';
      else if (pRole === 'hod') effectiveRole = 'hod';
      else if (pRole === 'student') effectiveRole = 'student';
      else if (pRole === 'security') effectiveRole = 'security_guard';
    }
  }

  const handleOpenLogin = () => {
    setShowLoginModal(true);
  };

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const renderDashboard = () => {
    switch (effectiveRole) {
      case 'managing_director':
      case 'md':
        return <ManagingDirectorDashboard currentTab={currentTab} onNavigateTab={handleTabChange} />;
      case 'student':
        return <StudentDashboard currentTab={currentTab} onNavigateTab={handleTabChange} />;
      case 'teacher':
      case 'faculty':
        return <TeacherDashboard currentTab={currentTab} onNavigateTab={handleTabChange} />;
      case 'hod':
        return <HodDashboard currentTab={currentTab} onNavigateTab={handleTabChange} />;
      case 'admin':
      case 'principal':
        return <PrincipalDashboard currentTab={currentTab} onNavigateTab={handleTabChange} />;
      case 'security_guard':
      case 'security':
        return <SecurityDashboard currentTab={currentTab} onNavigateTab={handleTabChange} />;
      case 'warden':
        return <SecurityDashboard currentTab={currentTab === 'dashboard' ? 'hostel_outpass' : currentTab} onNavigateTab={handleTabChange} />;
      case 'library_staff':
        return <PrincipalDashboard currentTab={currentTab === 'dashboard' ? 'no_dues' : currentTab} onNavigateTab={handleTabChange} />;
      case 'lab_staff':
      case 'it_staff':
      case 'technical_staff':
        return <PrincipalDashboard currentTab={currentTab === 'dashboard' ? 'maintenance' : currentTab} onNavigateTab={handleTabChange} />;
      default:
        return <StudentDashboard currentTab={currentTab} onNavigateTab={handleTabChange} />;
    }
  };

  // 1. Unauthenticated Experience: Clean Institutional Portal & Login Screen
  if (!user && !devPreviewActive) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] text-slate-800 dark:text-[#f5f5f5] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#0f2942] selection:text-white transition-colors duration-200">
        <StudentRegisterModal
          isOpen={showStudentRegModal}
          onClose={() => setShowStudentRegModal(false)}
          onSuccess={() => {
            setShowStudentRegModal(false);
            setCurrentTab('dashboard');
          }}
        />

        <TeacherRegisterModal
          isOpen={showTeacherRegModal}
          onClose={() => setShowTeacherRegModal(false)}
          onSuccess={() => {
            setShowTeacherRegModal(false);
            setCurrentTab('dashboard');
          }}
        />

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            setCurrentTab('dashboard');
          }}
          onOpenStudentRegister={() => setShowStudentRegModal(true)}
          onOpenTeacherRegister={() => setShowTeacherRegModal(true)}
        />

        <CampusGalleryModal
          isOpen={showGalleryModal}
          onClose={() => setShowGalleryModal(false)}
        />

        <LandingPage
          onOpenLogin={handleOpenLogin}
          onOpenStudentRegister={() => setShowStudentRegModal(true)}
          onOpenTeacherRegister={() => setShowTeacherRegModal(true)}
          onOpenGallery={() => setShowGalleryModal(true)}
        />
      </div>
    );
  }

  // 2. Authenticated Experience: Responsive shell with Sticky Top Header, Left Sidebar & Main Content
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] text-slate-800 dark:text-[#f5f5f5] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#0f2942] selection:text-white transition-colors duration-200">
      {/* Sticky Top Header */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenProfile={() => handleTabChange('profile')}
        onOpenLogin={handleOpenLogin}
      />

      {/* Global Modals */}
      {mustChangePassword && <ChangePasswordModal />}

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        onNavigateTab={handleTabChange}
      />

      <CampusGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
      />

      <StudentRegisterModal
        isOpen={showStudentRegModal}
        onClose={() => setShowStudentRegModal(false)}
        onSuccess={() => setShowStudentRegModal(false)}
      />

      <TeacherRegisterModal
        isOpen={showTeacherRegModal}
        onClose={() => setShowTeacherRegModal(false)}
        onSuccess={() => setShowTeacherRegModal(false)}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
        onOpenStudentRegister={() => setShowStudentRegModal(true)}
        onOpenTeacherRegister={() => setShowTeacherRegModal(true)}
      />

      {/* Authenticated Workspace Shell */}
      <div className="flex-1 flex relative">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleTabChange}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 lg:pl-64 w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto transition-all pb-20">
          {renderDashboard()}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible on mobile screens < lg) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={handleTabChange}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
