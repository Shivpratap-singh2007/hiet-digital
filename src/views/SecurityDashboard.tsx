import React from 'react';
import { 
  ShieldCheck, 
  Scan, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRightLeft,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../components/common/Sidebar';
import { CampusHero } from '../components/common/CampusHero';
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
  const guardName = user?.name || 'Hav. R. S. Katoch';

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

  // Default Minimal Security Home Screen
  return (
    <div className="space-y-5 font-sans animate-fade-in max-w-5xl mx-auto px-1 sm:px-2 pb-8">
      {/* 1. Official HIET Campus Hero & Security Staff Greeting */}
      <CampusHero
        userName={guardName}
        roleLabel="Security Staff"
        subtitle="Campus perimeter safety, digital gate pass verification and entry control."
        departmentOrBranch="Main Campus Highway Gate 1 • Safety Division"
        idNumber={`Post ID: ${user?.id || 'SEC-01'}`}
        summaryItems={[
          {
            label: 'Total Gate Scans',
            value: `${scanLogs.length} Checked`,
            subtext: 'Entries & exits logged today',
            icon: ArrowRightLeft,
            onClick: () => onNavigateTab('reconciliation')
          },
          {
            label: 'Verified Passes',
            value: `${validScans} Valid`,
            subtext: 'Cryptographically approved',
            icon: CheckCircle2,
            variant: 'success',
            onClick: () => onNavigateTab('gate_pass')
          },
          {
            label: 'Manual Exceptions',
            value: `${manualOverrides} Overrides`,
            subtext: manualOverrides > 0 ? 'Approved by authority' : 'Zero exceptions logged',
            icon: AlertTriangle,
            variant: manualOverrides > 0 ? 'warning' : 'default',
            onClick: () => onNavigateTab('reconciliation')
          },
          {
            label: 'Checkpoint Status',
            value: 'Active Duty',
            subtext: 'Highway Gate 1 Online',
            icon: ShieldCheck,
            variant: 'success'
          }
        ]}
      />

      {/* 2. Primary Action Banner: Quick Camera Scanner Trigger */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#123D70]/10 dark:bg-blue-950/60 text-[#123D70] dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#172B4D] dark:text-white">
              Launch Live QR Code Scanner
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Verify student digital gate passes and hostel outpasses in real-time with device camera.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('gate_scanner')}
          className="px-5 py-2.5 rounded-xl bg-[#123D70] hover:bg-[#0B2545] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Scan className="w-4 h-4" />
          <span>Open Gate Scanner</span>
        </button>
      </div>

      {/* 3. Essential Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('gate_scanner')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#123D70] dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
            <Scan className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">QR Scanner</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Scan pass QR</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('gate_pass')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Gate Pass Verification</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Manual roll lookup</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('reconciliation')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Entry / Exit Logs</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Daily movement ledger</div>
          </div>
        </button>
      </div>

      {/* 4. Side Drawer Guidance Notice */}
      <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-[#D7DEE8] dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-[#172B4D] dark:text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-[#123D70]/10 dark:bg-sky-400/10 flex items-center justify-center text-[#123D70] dark:text-sky-400 shrink-0 font-bold">
            ☰
          </div>
          <p className="text-[11px] sm:text-xs">
            Access <strong>Gate Pass Verification, QR Scanner, Entry and Exit Logs, Notices,</strong> and <strong>Duty Preferences</strong> from the <strong>Side Navigation Drawer</strong>.
          </p>
        </div>
      </div>

      {/* 5. Institutional Footer */}
      <div className="pt-4 text-center flex items-center justify-center gap-3 text-[11px] text-[#64748B] dark:text-slate-500 font-medium">
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
        <span>HIET Group of Institutions • Security Directorate</span>
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
      </div>
    </div>
  );
};
