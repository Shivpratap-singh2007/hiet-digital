// =============================================================================
// HIET DIGITAL CAMPUS — ROLE-BASED ACCESS GUARD
// Himachal Institute of Engineering & Technology, Shahpur
// =============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, LogIn } from 'lucide-react';

interface Props {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<Props> = ({ allowedRoles, children, fallback }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2942]"></div>
      </div>
    );
  }

  if (!user || !role) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto text-center mt-12 shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Authentication Required</h3>
        <p className="text-sm text-slate-500 mb-6">
          Please sign in with your institutional credentials to access this protected area.
        </p>
        <button
          onClick={() => { window.location.href = '/login'; }}
          className="w-full py-2.5 px-4 bg-[#0f2942] hover:bg-[#163a5d] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const normalizedCurrent = role.toLowerCase();
  const hasAccess = allowedRoles.some(r => r.toLowerCase() === normalizedCurrent);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="bg-white border border-rose-200 rounded-xl p-8 max-w-md mx-auto text-center mt-12 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h3>
        <p className="text-sm text-slate-500 mb-6">
          Your institutional account ({role}) does not have permission to view this resource.
        </p>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
        >
          Return to My Workspace
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
