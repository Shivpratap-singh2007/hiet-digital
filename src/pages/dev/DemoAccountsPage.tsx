// =============================================================================
// HIET DIGITAL CAMPUS — DEVELOPMENT DEMO ACCOUNTS SWITCHER
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Visible STRICTLY in development mode (import.meta.env.DEV === true)
// =============================================================================

import React, { useState, useMemo } from 'react';
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
  HelpCircle,
  Search,
  Bed,
  UserCheck,
  Sparkles,
  School
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  DEMO_COMMON_PASSWORD,
  DEMO_FACULTY_LIST, 
  DEMO_STUDENTS_LIST, 
  ALL_DEMO_STAFF_PROFILES 
} from '../../lib/mockDemoUsers';

export type DemoCategory = 'all' | 'faculty' | 'students-cse' | 'students-ece' | 'staff';

export interface DisplayDemoAccount {
  category: 'faculty' | 'students-cse' | 'students-ece' | 'staff';
  name: string;
  email: string;
  identifier: string; // Employee Code or Roll Number
  password: string;
  roles: string[];
  department: string;
  semesterSection?: string;
  hostelInfo?: string;
  attendanceCgpa?: string;
  expectedWorkspace: string;
  initialRoute: string;
  highlights: string;
  testCase?: string;
  icon: any;
}

export const DemoAccountsPage: React.FC = () => {
  const { login } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<DemoCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loggingInEmail, setLoggingInEmail] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Construct master display accounts array
  const allAccounts: DisplayDemoAccount[] = useMemo(() => {
    const list: DisplayDemoAccount[] = [];

    // 1. Faculty + Administrative Roles (5 Faculty)
    DEMO_FACULTY_LIST.forEach((fac) => {
      let workspaceLabel = 'Faculty Workspace';
      let route = '/app/faculty';
      if (fac.isHod) {
        workspaceLabel = `Faculty Workspace (Switchable to HOD ${fac.department})`;
        route = '/app/faculty';
      } else if (fac.isClassIncharge) {
        workspaceLabel = 'Faculty Workspace (Switchable to Class In-Charge CSE 1-A)';
        route = '/app/faculty';
      } else if (fac.isWarden) {
        workspaceLabel = `Faculty Workspace (Switchable to Hostel Warden ${fac.hostelCode})`;
        route = '/app/faculty';
      }

      list.push({
        category: 'faculty',
        name: fac.name,
        email: fac.email,
        identifier: fac.employeeCode,
        password: DEMO_COMMON_PASSWORD,
        roles: fac.activeRoles,
        department: fac.department,
        expectedWorkspace: workspaceLabel,
        initialRoute: route,
        highlights: fac.responsibilities.join(' • '),
        icon: fac.isHod ? Building : (fac.isWarden ? Bed : (fac.isClassIncharge ? UserCheck : Briefcase))
      });
    });

    // 2. Students — CSE (15 Students)
    DEMO_STUDENTS_LIST.filter(s => s.department === 'CSE').forEach((std) => {
      list.push({
        category: 'students-cse',
        name: std.name,
        email: std.email,
        identifier: std.rollNo,
        password: DEMO_COMMON_PASSWORD,
        roles: ['student'],
        department: 'CSE',
        semesterSection: 'Semester 1 • Section A',
        hostelInfo: std.hostel === 'Day Scholar' ? 'Day Scholar' : (std.hostel === 'GIRLS-HOSTEL-A' ? 'Girls Hostel Block A' : 'Boys Hostel Block B'),
        attendanceCgpa: `${std.attendance}% Attendance | ${std.cgpa.toFixed(2)} CGPA`,
        expectedWorkspace: 'Student Workspace (CSE)',
        initialRoute: '/app/student',
        highlights: `Test case: ${std.testCase} • ${std.gender}`,
        testCase: std.testCase,
        icon: GraduationCap
      });
    });

    // 3. Students — ECE (15 Students)
    DEMO_STUDENTS_LIST.filter(s => s.department === 'ECE').forEach((std) => {
      list.push({
        category: 'students-ece',
        name: std.name,
        email: std.email,
        identifier: std.rollNo,
        password: DEMO_COMMON_PASSWORD,
        roles: ['student'],
        department: 'ECE',
        semesterSection: 'Semester 1 • Section A',
        hostelInfo: std.hostel === 'Day Scholar' ? 'Day Scholar' : (std.hostel === 'GIRLS-HOSTEL-A' ? 'Girls Hostel Block A' : 'Boys Hostel Block B'),
        attendanceCgpa: `${std.attendance}% Attendance | ${std.cgpa.toFixed(2)} CGPA`,
        expectedWorkspace: 'Student Workspace (ECE)',
        initialRoute: '/app/student',
        highlights: `Test case: ${std.testCase} • ${std.gender}`,
        testCase: std.testCase,
        icon: GraduationCap
      });
    });

    // 4. Principal / Security / Staff (6 Staff Accounts)
    ALL_DEMO_STAFF_PROFILES.forEach((staff) => {
      let icon = ShieldCheck;
      let workspace = 'Administrative Portal';
      let route = '/app/admin';
      let dept = 'Administration';

      if (staff.role === 'principal') {
        workspace = 'Principal / Executive Director';
        route = '/app/admin';
        dept = 'Institutional Executive';
        icon = School;
      } else if (staff.role === 'managing_director') {
        workspace = 'Managing Director Audit Suite';
        route = '/app/md';
        dept = 'Board of Governance';
        icon = ShieldCheck;
      } else if (staff.role === 'security') {
        workspace = 'Campus Main Gate Security';
        route = '/app/security';
        dept = 'Campus Security & Gate';
        icon = ShieldAlert;
      } else if (staff.role === 'library_staff') {
        workspace = 'Central Library Desk';
        route = '/app/library';
        dept = 'Central Library';
        icon = BookOpen;
      } else if (staff.role === 'lab_staff') {
        workspace = 'Computer & Hardware Labs';
        route = '/app/lab';
        dept = 'Laboratories & Workshops';
        icon = Wrench;
      } else if (staff.role === 'it_staff') {
        workspace = 'IT Infrastructure & Network Helpdesk';
        route = '/app/it';
        dept = 'IT Infrastructure';
        icon = HelpCircle;
      }

      list.push({
        category: 'staff',
        name: staff.name,
        email: staff.email,
        identifier: staff.identifier,
        password: DEMO_COMMON_PASSWORD,
        roles: staff.activeRoles || [staff.role],
        department: dept,
        expectedWorkspace: workspace,
        initialRoute: route,
        highlights: `Institutional role: ${staff.role}`,
        icon
      });
    });

    return list;
  }, []);

  // Filter accounts by tab and search query
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      // Category filter
      if (selectedCategory !== 'all' && acc.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.identifier.toLowerCase().includes(q) ||
        acc.roles.some(r => r.toLowerCase().includes(q)) ||
        acc.department.toLowerCase().includes(q) ||
        (acc.testCase && acc.testCase.toLowerCase().includes(q))
      );
    });
  }, [allAccounts, selectedCategory, searchQuery]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyCredentials = (acc: DisplayDemoAccount) => {
    const payload = `Email: ${acc.email}\nPassword: ${acc.password}\nIdentifier: ${acc.identifier}\nRole: ${acc.roles.join(', ')}`;
    navigator.clipboard.writeText(payload);
    setCopiedKey(`creds-${acc.email}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleQuickLogin = async (acc: DisplayDemoAccount) => {
    setLoggingInEmail(acc.email);
    setStatusMessage(`Authenticating as ${acc.name} (${acc.identifier})...`);
    try {
      const res = await login(acc.email, acc.password);
      if (res.success) {
        setStatusMessage(`Successfully signed in as ${acc.name}. Redirecting to ${acc.expectedWorkspace}...`);
        setTimeout(() => {
          window.location.href = acc.initialRoute || '/';
        }, 300);
      } else {
        setStatusMessage(res.error || 'Authentication error.');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error occurred during login.');
    } finally {
      setLoggingInEmail(null);
    }
  };

  const facultyCount = allAccounts.filter(a => a.category === 'faculty').length;
  const cseStudentsCount = allAccounts.filter(a => a.category === 'students-cse').length;
  const eceStudentsCount = allAccounts.filter(a => a.category === 'students-ece').length;
  const staffCount = allAccounts.filter(a => a.category === 'staff').length;

  // Security barrier: Render strictly in development mode
  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white border border-slate-200 p-8 rounded-xl max-w-md text-center shadow-sm">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Route Disabled in Production</h2>
          <p className="text-sm text-slate-500 mt-2">
            Demo switcher accounts are restricted strictly to local engineering environments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#0f2942] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* MANDATORY WARNING BANNER */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-200/70 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Security Policy & Development Guardrail
              </div>
              <div className="text-sm font-semibold text-amber-950">
                Development-only demo accounts. Never use these credentials in production.
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                Enabled solely via <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">DEMO_SEED_ENABLED=true</code> and restricted to local development environments.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Dev Seed Active
            </span>
          </div>
        </div>

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0f2942]/10 text-[#0f2942] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HIET Digital Campus — Multi-Role Demo Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Institutional Demo Credentials Switcher
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Complete evaluation suite with 35 connected demo personas: 5 Multi-Role Faculty (2 HODs, 1 Class In-Charge, 2 Wardens), 30 B.Tech Students (15 CSE + 15 ECE), and 6 Administrative Officers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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

        {/* Status Message */}
        {statusMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-xs font-semibold underline text-blue-700">Dismiss</button>
          </div>
        )}

        {/* Universal Credentials Card & Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-slate-900 text-white p-5 rounded-xl shadow-sm flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Common Demo Password</div>
                  <div className="text-lg font-mono font-bold tracking-wider text-amber-300">
                    {DEMO_COMMON_PASSWORD}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy(DEMO_COMMON_PASSWORD, 'global-pwd')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {copiedKey === 'global-pwd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'global-pwd' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-xs text-slate-400 border-t border-white/10 pt-2.5">
              Valid across all 35 institutional demo personas. Supports login via Email or Identifier (Roll No / Employee Code).
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Persona Lookup & Instant Filter</span>
              <span className="text-xs text-slate-500 font-medium">{filteredAccounts.length} of {allAccounts.length} Accounts Displayed</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, email, roll number (e.g. HIET-CSE-2026-001), role, or test case..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2942]/30 focus:border-[#0f2942]"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              selectedCategory === 'all'
                ? 'bg-[#0f2942] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Demo Accounts ({allAccounts.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('faculty')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              selectedCategory === 'faculty'
                ? 'bg-[#0f2942] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-500" />
            <span>Faculty + Administrative Roles ({facultyCount})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('students-cse')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              selectedCategory === 'students-cse'
                ? 'bg-[#0f2942] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <span>Students — CSE ({cseStudentsCount})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('students-ece')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              selectedCategory === 'students-ece'
                ? 'bg-[#0f2942] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-purple-500" />
            <span>Students — ECE ({eceStudentsCount})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('staff')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              selectedCategory === 'staff'
                ? 'bg-[#0f2942] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Principal / Security / Other Staff ({staffCount})</span>
          </button>
        </div>

        {/* Master Accounts Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>
                {selectedCategory === 'all' && `Complete Demo Persona Directory (${filteredAccounts.length})`}
                {selectedCategory === 'faculty' && `Faculty & Administrative Leaders (${filteredAccounts.length})`}
                {selectedCategory === 'students-cse' && `B.Tech CSE Students — Semester 1 (${filteredAccounts.length})`}
                {selectedCategory === 'students-ece' && `B.Tech ECE Students — Semester 1 (${filteredAccounts.length})`}
                {selectedCategory === 'staff' && `Executive & Operational Staff (${filteredAccounts.length})`}
              </span>
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              Password for all accounts: <strong className="text-slate-800">{DEMO_COMMON_PASSWORD}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Persona & Name</th>
                  <th className="px-5 py-3.5">Login Email</th>
                  <th className="px-5 py-3.5">Employee Code / Roll No</th>
                  <th className="px-5 py-3.5">Roles & Department</th>
                  <th className="px-5 py-3.5">Scope / Academic Allocation</th>
                  <th className="px-5 py-3.5">Expected Dashboard</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAccounts.map((acc) => {
                  const Icon = acc.icon;
                  const isLoggingIn = loggingInEmail === acc.email;

                  return (
                    <tr key={`${acc.email}-${acc.identifier}`} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Persona */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            acc.category === 'faculty' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            acc.category === 'students-cse' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            acc.category === 'students-ece' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{acc.name}</span>
                              {acc.roles.includes('hod') && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">HOD</span>
                              )}
                              {acc.roles.includes('class_incharge') && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">In-Charge</span>
                              )}
                              {acc.roles.includes('warden') && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Warden</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {acc.department} {acc.semesterSection ? `• ${acc.semesterSection}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Login Email */}
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span>{acc.email}</span>
                          <button
                            onClick={() => handleCopy(acc.email, `email-${acc.email}`)}
                            title="Copy email"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {copiedKey === `email-${acc.email}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Identifier (Employee Code / Roll No) */}
                      <td className="px-5 py-3.5 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {acc.identifier}
                          </span>
                          <button
                            onClick={() => handleCopy(acc.identifier, `id-${acc.identifier}`)}
                            title="Copy identifier"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {copiedKey === `id-${acc.identifier}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Roles & Department */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {acc.roles.map((r) => (
                            <span 
                              key={r}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                                r === 'hod' ? 'bg-indigo-100 text-indigo-700' :
                                r === 'class_incharge' ? 'bg-amber-100 text-amber-800' :
                                r === 'warden' ? 'bg-teal-100 text-teal-800' :
                                r === 'faculty' ? 'bg-emerald-100 text-emerald-800' :
                                r === 'student' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">
                          {acc.department}
                        </div>
                      </td>

                      {/* Scope / Academic Allocation */}
                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs">
                        {acc.attendanceCgpa && (
                          <div className="font-medium text-slate-800 mb-0.5">
                            {acc.attendanceCgpa}
                          </div>
                        )}
                        {acc.hostelInfo && (
                          <div className="text-slate-500 flex items-center gap-1">
                            <Bed className="w-3 h-3 text-slate-400" />
                            <span>{acc.hostelInfo}</span>
                          </div>
                        )}
                        <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">
                          {acc.highlights}
                        </div>
                      </td>

                      {/* Expected Workspace */}
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-1.5 text-[#0f2942]">
                          <span>{acc.expectedWorkspace}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {acc.initialRoute}
                        </div>
                      </td>

                      {/* Quick Action Buttons */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleCopyCredentials(acc)}
                            title="Copy Email & Password"
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            {copiedKey === `creds-${acc.email}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{copiedKey === `creds-${acc.email}` ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() => handleQuickLogin(acc)}
                            disabled={loggingInEmail !== null}
                            className="px-3 py-1.5 bg-[#0f2942] hover:bg-[#163a5d] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>{isLoggingIn ? 'Logging In...' : 'Quick Login'}</span>
                          </button>
                        </div>
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
