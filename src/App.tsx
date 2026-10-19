import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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
import { NotificationsModal } from './components/common/NotificationsModal';
import { CampusAiAssistantModal } from './components/ai/CampusAiAssistantModal';
import { VerifyPublicDoc } from './components/common/VerifyPublicDoc';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { DemoAccountsPage } from './pages/dev/DemoAccountsPage';
import { AiCampusView } from './pages/ai/AiCampusView';
import { areDevRoutesEnabled } from './lib/envConfig';
import { PwaProvider } from './context/PwaContext';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { 
  getTabFromPathname, 
  navigateTo, 
  subscribeToNavigation, 
  setupClientSideLinkInterceptor 
} from './lib/appNavigation';

const MainLayout: React.FC = () => {
  const { user, role, mustChangePassword } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPathname(window.location.pathname);
    }
    return 'dashboard';
  });
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState(false);
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global Command Palette Shortcut (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isDev = Boolean(import.meta.env.DEV);

  // Synchronize client-side navigation, history popstate, and SPA internal links
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const tab = getTabFromPathname(window.location.pathname);
      setCurrentTab(tab);
      setIsMobileSidebarOpen(false);
    };

    window.addEventListener('popstate', handlePopState);

    const unsubscribeNav = subscribeToNavigation((tab) => {
      setCurrentTab(tab);
      setIsMobileSidebarOpen(false);
    });

    const cleanupLinks = setupClientSideLinkInterceptor((tab) => {
      setCurrentTab(tab);
      setIsMobileSidebarOpen(false);
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      unsubscribeNav();
      cleanupLinks();
    };
  }, []);

  // Development Demo Accounts Switcher (/dev/demo-accounts)
  if (areDevRoutesEnabled() && pathname === '/dev/demo-accounts') {
    return <DemoAccountsPage />;
  }

  // 0. Public Document Verification Route Handling (/verify/hall-ticket/:token & /verify/certificate/:token)
  if (pathname.startsWith('/verify/hall-ticket/')) {
    const token = pathname.replace('/verify/hall-ticket/', '').split('/')[0] || '';
    return <VerifyPublicDoc type="hall-ticket" token={token} onGoHome={() => { navigateTo('dashboard'); }} />;
  }
  if (pathname.startsWith('/verify/certificate/')) {
    const token = pathname.replace('/verify/certificate/', '').split('/')[0] || '';
    return <VerifyPublicDoc type="certificate" token={token} onGoHome={() => { navigateTo('dashboard'); }} />;
  }

  // Development Role Preview Support (?previewRole=student|faculty|hod|principal|security)
  let effectiveRole = role;
  let devPreviewActive = false;

  if (areDevRoutesEnabled() && typeof window !== 'undefined' && user) {
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

  // Purge any previewRole param from browser URL if user logs out
  React.useEffect(() => {
    if (!user && typeof window !== 'undefined' && window.location.search.includes('previewRole')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [user]);

  const handleOpenLogin = () => {
    setShowLoginModal(true);
  };

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    setIsMobileSidebarOpen(false);
    navigateTo(tab, { scroll: true });
  };

  const renderDashboard = () => {
    if (currentTab === 'ai_campus' || currentTab.startsWith('ai_')) {
      return (
        <AiCampusView
          currentTab={currentTab}
          onNavigateTab={handleTabChange}
        />
      );
    }

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
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans relative overflow-x-hidden selection:bg-[#0f2942] selection:text-white">
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
          onClose={() => {
            setShowLoginModal(false);
            if (typeof window !== 'undefined' && window.location.pathname === '/login') {
              window.history.replaceState(null, '', '/');
            }
          }}
          onSuccess={() => {
            setShowLoginModal(false);
            setCurrentTab('dashboard');
          }}
          onOpenStudentRegister={() => setShowStudentRegModal(true)}
          onOpenTeacherRegister={() => setShowTeacherRegModal(true)}
        />

        <LandingPage
          onOpenLogin={handleOpenLogin}
          onOpenStudentRegister={() => setShowStudentRegModal(true)}
          onOpenTeacherRegister={() => setShowTeacherRegModal(true)}
        />
      </div>
    );
  }

  // 2. Authenticated Experience: Responsive shell with Sticky Top Header, Left Sidebar & Main Content
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans relative overflow-x-hidden selection:bg-[#0f2942] selection:text-white">
      {/* Sticky Top Header */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenProfile={() => handleTabChange('profile')}
        onOpenLogin={handleOpenLogin}
        onOpenAiAssistant={() => setShowAiAssistantModal(true)}
        onOpenSearch={() => setShowCommandPalette(true)}
        onNavigateHome={() => handleTabChange('dashboard')}
      />

      {/* Global Modals */}
      {mustChangePassword && role !== 'student' && <ChangePasswordModal />}

      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigateTab={handleTabChange}
        onOpenAiAssistant={() => setShowAiAssistantModal(true)}
      />

      <CampusAiAssistantModal
        isOpen={showAiAssistantModal}
        onClose={() => setShowAiAssistantModal(false)}
        onNavigateTab={handleTabChange}
      />

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        onNavigateTab={handleTabChange}
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

        <main className="flex-1 lg:pl-64 w-full min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-28 sm:pb-32 lg:pb-12">
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
    <AuthProvider>
      <ToastProvider>
        <PwaProvider>
          <MainLayout />
          <PwaInstallBanner />
        </PwaProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
