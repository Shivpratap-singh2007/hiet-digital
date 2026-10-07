import React from 'react';
import { PrincipalDashboard } from './PrincipalDashboard';
import { NavTab } from '../components/common/Sidebar';

interface Props {
  currentTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

/**
 * Admin dashboard is mapped directly to Principal Dashboard per Section 8 & 17 requirements:
 * "The current Admin dashboard should be visually transformed into: PRINCIPAL DASHBOARD.
 * Do NOT create a separate unrelated admin design."
 */
export const AdminDashboard: React.FC<Props> = ({ currentTab, onNavigateTab }) => {
  return <PrincipalDashboard currentTab={currentTab} onNavigateTab={onNavigateTab} />;
};
