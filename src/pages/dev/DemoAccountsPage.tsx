// =============================================================================
// HIET DIGITAL CAMPUS — DEVELOPMENT DEMO ACCOUNTS SWITCHER
// Himachal Institute of Engineering & Technology, Shahpur
// Visible STRICTLY in development mode (import.meta.env.DEV === true)
// =============================================================================

import React, { useState } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  LogIn, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert,
  GraduationCap,
  Briefcase,
  Building,
  Key,
  BookOpen,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface DemoAccountItem {
  role: UserRole;
  name: string;
  email: string;
  identifier: string;
  description: string;
  icon: any;
  color: string;
}

const DEMO_ACCOUNTS: DemoAccountItem[] = [
  {
    role: 'student',
    name: 'Aditya Nanda',
    email: 'student.cse01@hiet.demo',
    identifier: 'HIET-CSE-2026-001',
    description: 'B.Tech CSE Sem 1 | 82% Attendance | Assignments & Results',
    icon: GraduationCap,
    color: 'blue'
  },
  {
    role: 'faculty',
    name: 'Dr. Anuj Sharma',
    email: 'faculty.cse01@hiet.demo',
    identifier: 'HIET-FAC-CSE-001',
    description: 'Associate Professor | Smart Board Lessons & Submissions',
    icon: Briefcase,
    color: 'emerald'
  },
  {
    role: 'hod',
    name: 'Dr. Anuj Sharma (HOD)',
    email: 'hod.cse@hiet.demo',
    identifier: 'HIET-HOD-CSE-001',
    description: 'HOD CSE | Subject Allocations, Approvals & Workload',
    icon: Building,
    color: 'indigo'
  },
  {
    role: 'principal',
    name: 'Dr. Rajesh Kumar',
    email: 'principal@hiet.demo',
    identifier: 'HIET-PRI-001',
    description: 'Institution Director | All Departments, No-Dues & Reports',
    icon: ShieldCheck,
    color: 'amber'
  },
  {
    role: 'managing_director',
    name: 'Mr. R. K. Sharma',
    email: 'md@hiet.demo',
    identifier: 'HIET-MD-001',
    description: 'Managing Director | Institutional Analytics & Audit Logs',
    icon: LineChartIcon,
    color: 'purple'
  },
  {
    role: 'security',
    name: 'Ramesh Thakur',
    email: 'security@hiet.demo',
    identifier: 'HIET-SEC-001',
    description: 'Campus Security | QR Pass Scanner & Entry/Exit Logs',
    icon: ShieldAlert,
    color: 'rose'
  },
  {
    role: 'warden',
    name: 'Ms. Neha Verma',
    email: 'warden@hiet.demo',
    identifier: 'HIET-WAR-001',
    description: 'Hostel Warden | Outpass Requests & Overdue Tracking',
    icon: Building,
    color: 'teal'
  },
  {
    role: 'library_staff',
    name: 'Sunita Devi',
    email: 'library@hiet.demo',
    identifier: 'HIET-LIB-001',
    description: 'Library Staff | Book Dues & No-Dues Clearances',
    icon: BookOpen,
    color: 'cyan'
  },
  {
    role: 'lab_staff',
    name: 'Mohit Kumar',
    email: 'lab@hiet.demo',
    identifier: 'HIET-LAB-001',
    description: 'Lab Technician | Equipment Tickets & Lab Clearances',
    icon: Wrench,
    color: 'orange'
  },
  {
    role: 'it_staff',
    name: 'Vikram Singh',
    email: 'it@hiet.demo',
    identifier: 'HIET-IT-001',
    description: 'IT Systems Admin | 48h SLA Grievances & Network Health',
    icon: HelpCircle,
    color: 'sky'
  }
];

function LineChartIcon(props: any) {
  return <Building {...props} />;
}

export const DemoAccountsPage: React.FC = () => {
  const { login } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Security barrier: Render nothing if not in development
  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white border border-slate-200 p-8 rounded-xl max-w-md text-center shadow-sm">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Route Disabled in Production</h2>
          <p className="text-sm text-slate-500 mt-2">
            Demo switcher accounts are restricted to local engineering environments.
          </p>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickLogin = async (acc: DemoAccountItem) => {
    setLoggingInRole(acc.role);
    setStatusMessage(`Authenticating as ${acc.name} (${acc.role})...`);
    try {
      const res = await login(acc.email, 'Hiet@12345');
      if (res.success) {
        setStatusMessage(`Successfully signed in. Redirecting...`);
        // Navigate to home / dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      } else {
        setStatusMessage(res.error || 'Authentication error.');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error occurred.');
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#0f2942] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
              <Key className="w-3.5 h-3.5" />
              <span>Development Environment Only</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HIET Demo Credentials Switcher</h1>
            <p className="text-sm text-slate-500 mt-1">
              Select any institutional role to evaluate connected dashboards, real-time metrics, and operational workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.href = '/login'; }}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Standard Login</span>
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0f2942] hover:bg-[#163a5d] rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <span>Back to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-xs font-semibold underline">Dismiss</button>
          </div>
        )}

        {/* Global Password Notice */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Universal Demo Password</div>
              <div className="text-lg font-mono font-bold tracking-wider text-amber-300">Hiet@12345</div>
            </div>
          </div>
          <button
            onClick={() => handleCopy('Hiet@12345', 'global-pwd')}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            {copiedId === 'global-pwd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'global-pwd' ? 'Copied Password' : 'Copy Password'}</span>
          </button>
        </div>

        {/* Accounts Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Available Institutional Demo Accounts (10 Roles)</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Role & Identity</th>
                  <th className="px-6 py-3.5">Login Email</th>
                  <th className="px-6 py-3.5">Identifier (Roll / Code)</th>
                  <th className="px-6 py-3.5">Scope & Highlights</th>
                  <th className="px-6 py-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <tr key={acc.role} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                            <Icon className="w-5 h-5 text-[#0f2942]" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{acc.name}</div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase">
                              {acc.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span>{acc.email}</span>
                          <button
                            onClick={() => handleCopy(acc.email, `email-${acc.role}`)}
                            title="Copy email"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {copiedId === `email-${acc.role}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{acc.identifier}</span>
                          <button
                            onClick={() => handleCopy(acc.identifier, `id-${acc.role}`)}
                            title="Copy identifier"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {copiedId === `id-${acc.role}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                        {acc.description}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleQuickLogin(acc)}
                          disabled={loggingInRole !== null}
                          className="px-3.5 py-1.5 bg-[#0f2942] hover:bg-[#163a5d] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>{loggingInRole === acc.role ? 'Connecting...' : 'Quick Login'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
