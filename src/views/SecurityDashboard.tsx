import React from 'react';
import { 
  ShieldCheck, 
  Scan, 
  QrCode, 
  Bell, 
  User, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../components/common/Sidebar';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { SecurityScannerView } from '../components/security/SecurityScannerView';
import { DigitalGatePassView } from '../components/student/DigitalGatePassView';
import { AttendanceReconciliationView } from '../components/attendance/AttendanceReconciliationView';
import { NoticesView } from '../components/common/NoticesView';
import { SettingsView } from '../components/common/SettingsView';
import { HostelOutpassView } from '../components/student/HostelOutpassView';
import { LostAndFoundView } from '../components/common/LostAndFoundView';
import { MaintenanceGrievanceView } from '../components/common/MaintenanceGrievanceView';
import { CampusPresenceView } from '../components/presence/CampusPresenceView';
import { AdminFinesManagementView } from '../components/fines/AdminFinesManagementView';
import { SmartCampusOperationsView } from '../components/operations/SmartCampusOperationsView';
import { dataStore } from '../lib/mockData';

interface Props {
  currentTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const SecurityDashboard: React.FC<Props> = ({ currentTab, onNavigateTab }) => {
  const { user } = useAuth();
  const guardName = user?.name || 'Hav. R. S. Katoch (Campus Security)';

  const scanLogs = dataStore.getGateScanLogs();
  const validScans = scanLogs.filter(l => l.verification_status === 'Valid').length;
  const manualOverrides = scanLogs.filter(l => l.verification_status === 'Manual_Override').length;

  if (currentTab === 'gate_pass') return <DigitalGatePassView />;
  if (currentTab === 'gate_scanner') return <SecurityScannerView />;
  if (currentTab === 'reconciliation') return <AttendanceReconciliationView />;
  if (currentTab === 'notices') return <NoticesView />;
  if (currentTab === 'settings') return <SettingsView />;
  if (currentTab === 'profile') return <SettingsView initialTab="profile" />;
  if (currentTab === 'hostel_outpass' as any) return <HostelOutpassView />;
  if (currentTab === 'campus_presence' as any) return <CampusPresenceView />;
  if (currentTab === 'fines' as any) return <AdminFinesManagementView />;
  if (currentTab === 'lost_found' as any) return <LostAndFoundView />;
  if (currentTab === 'maintenance' as any) return <MaintenanceGrievanceView />;
  if (currentTab === 'campus_operations') return <SmartCampusOperationsView roleMode="security" onNavigateTab={onNavigateTab} />;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. Header with Hierarchy Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'Campus Safety Directorate' },
          { label: 'Security Dashboard', active: true }
        ]}
        title="Campus Security & Checkpoint Console"
        description="Non-Teaching & Technical Staff Operations • Main Highway Gate 1 Verification"
        badge="Security Staff"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('gate_scanner')}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Scan className="w-4 h-4" />
              <span>Launch Live Camera Scanner</span>
            </button>
          </div>
        }
      />

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Gate Scans"
          value={scanLogs.length}
          subtext="Checkpoint entries & exits logged"
          icon={ArrowRightLeft}
          badge="Gate 1"
          badgeColor="blue"
          onClick={() => onNavigateTab('reconciliation')}
        />

        <StatCard
          label="Valid Gate Passes"
          value={validScans}
          subtext="Cryptographically verified passes"
          icon={CheckCircle2}
          badge="Verified"
          badgeColor="emerald"
          onClick={() => onNavigateTab('gate_pass')}
        />

        <StatCard
          label="Manual Overrides"
          value={manualOverrides}
          subtext="Approved by authority with remarks"
          icon={AlertTriangle}
          badge={manualOverrides > 0 ? "Logged" : "Zero"}
          badgeColor={manualOverrides > 0 ? "amber" : "slate"}
          onClick={() => onNavigateTab('reconciliation')}
        />

        <StatCard
          label="Duty Status"
          value="Active Duty"
          subtext={`Officer on duty: ${guardName.slice(0, 20)}`}
          icon={ShieldCheck}
          badge="On Duty"
          badgeColor="emerald"
        />
      </div>

      {/* 3. Live Scanner & Gate Verification Console */}
      <SecurityScannerView />
    </div>
  );
};
