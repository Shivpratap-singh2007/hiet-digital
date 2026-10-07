// =============================================================================
// HIET DIGITAL CAMPUS — PERMISSION-BASED COMPONENT GUARD
// Himachal Institute of Engineering & Technology, Shahpur
// =============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  permission?: string;
  condition?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<Props> = ({
  permission,
  condition = true,
  children,
  fallback = null
}) => {
  const { user, role } = useAuth();

  if (!user || !role) {
    return <>{fallback}</>;
  }

  // Check custom boolean condition
  if (!condition) {
    return <>{fallback}</>;
  }

  // Example permission mapping checks
  if (permission) {
    if (permission === 'can_grade' && role !== 'faculty' && role !== 'teacher' && role !== 'hod') {
      return <>{fallback}</>;
    }
    if (permission === 'can_approve_leave' && role !== 'faculty' && role !== 'teacher' && role !== 'hod' && role !== 'principal' && role !== 'admin') {
      return <>{fallback}</>;
    }
    if (permission === 'can_scan_gate' && role !== 'security' && role !== 'security_guard') {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
