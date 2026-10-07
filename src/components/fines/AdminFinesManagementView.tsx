/* oxlint-disable react/purity */
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  HelpCircle, 
  FileText, 
  Check, 
  X, 
  Edit3, 
  Filter, 
  Search,
  DollarSign,
  AlertTriangle,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { StudentFine, FineRule, FineAppeal, StudentMaster } from '../../types';

export const AdminFinesManagementView: React.FC = () => {
  const { user, role } = useAuth();
  const isAuthorized = role === 'hod' || role === 'principal' || role === 'admin';

  const [fines, setFines] = useState<StudentFine[]>(() => dataStore.getStudentFines());
  const [rules, setRules] = useState<FineRule[]>(() => dataStore.getFineRules());
  const [appeals, setAppeals] = useState<FineAppeal[]>(() => dataStore.getFineAppeals());

  const students = dataStore.getStudentsMaster();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'fines' | 'appeals' | 'rules'>('fines');

  // Pagination
  const [finesPage, setFinesPage] = useState(1);
  const finesPageSize = 15;
  const [appealsPage, setAppealsPage] = useState(1);
  const appealsPageSize = 10;

  // Issue Fine Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(students[0]?.roll_no || 'CSE001');
  const [selectedRuleCode, setSelectedRuleCode] = useState(rules[0]?.code || 'LIB_OVERDUE');
  const [customAmount, setCustomAmount] = useState<number>(rules[0]?.default_amount || 150);
  const [customTitle, setCustomTitle] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Adjudicate Appeal Modal State
  const [targetAppeal, setTargetAppeal] = useState<FineAppeal | null>(null);
  const [adjudicateAction, setAdjudicateAction] = useState<'Waive' | 'Amend' | 'Reject'>('Waive');
  const [adjudicateReason, setAdjudicateReason] = useState('');
  const [amendedAmount, setAmendedAmount] = useState<number>(0);

  // Search & Filter
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Issue Fine Handler
  const handleIssueFine = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.roll_no === selectedStudentRoll) || students[0];
    const rule = rules.find(r => r.code === selectedRuleCode) || rules[0];

    const newFine: StudentFine = {
      id: `fine-${Date.now()}`,
      student_id: st.id,
      student_roll: st.roll_no,
      student_name: st.name,
      branch: st.branch,
      semester: st.semester,
      rule_id: rule.id,
      category: rule.category,
      title: customTitle || rule.title,
      reason: customReason || rule.description,
      amount: Number(customAmount),
      status: 'Issued',
      issued_by: user?.id,
      issued_by_name: `${user?.name} (${role?.toUpperCase()})`,
      due_date: dueDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [newFine, ...fines];
    dataStore.setStudentFines(updated);
    setFines(updated);
    setShowIssueModal(false);
    setCustomTitle('');
    setCustomReason('');
  };

  // 2. Adjudicate Appeal Handler
  const handleAdjudicateSubmit = () => {
    if (!targetAppeal || !adjudicateReason.trim()) return;

    const appealStatus = adjudicateAction === 'Waive' || adjudicateAction === 'Amend' ? 'Approved' : 'Rejected';
    
    // Update Appeal
    const updatedAppeals = appeals.map(a => {
      if (a.id === targetAppeal.id) {
        return {
          ...a,
          status: appealStatus as any,
          reviewed_by: user?.id,
          reviewed_by_name: user?.name,
          review_notes: adjudicateReason,
          reviewed_at: new Date().toISOString()
        };
      }
      return a;
    });
    dataStore.setFineAppeals(updatedAppeals);
    setAppeals(updatedAppeals);

    // Update Student Fine
    const updatedFines = fines.map(f => {
      if (f.id === targetAppeal.fine_id) {
        if (adjudicateAction === 'Waive') {
          return {
            ...f,
            status: 'Waived' as const,
            waived_at: new Date().toISOString(),
            waived_by: user?.id,
            waiver_reason: adjudicateReason,
            updated_at: new Date().toISOString()
          };
        } else if (adjudicateAction === 'Amend') {
          return {
            ...f,
            amount: Number(amendedAmount),
            status: 'Issued' as const,
            waiver_reason: `Amended by ${user?.name}: ${adjudicateReason}`,
            updated_at: new Date().toISOString()
          };
        } else {
          return {
            ...f,
            status: 'Issued' as const,
            waiver_reason: `Appeal Rejected: ${adjudicateReason}`,
            updated_at: new Date().toISOString()
          };
        }
      }
      return f;
    });
    dataStore.setStudentFines(updatedFines);
    setFines(updatedFines);

    setTargetAppeal(null);
    setAdjudicateReason('');
  };

  const filteredFines = fines.filter(f => {
    if (statusFilter !== 'All' && f.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return f.student_name.toLowerCase().includes(q) || f.student_roll.toLowerCase().includes(q) || f.title.toLowerCase().includes(q);
    }
    return true;
  });

  const totalFinesPages = Math.ceil(filteredFines.length / finesPageSize) || 1;
  const pagedFines = filteredFines.slice((finesPage - 1) * finesPageSize, finesPage * finesPageSize);

  const totalAppealsPages = Math.ceil(appeals.length / appealsPageSize) || 1;
  const pagedAppeals = appeals.slice((appealsPage - 1) * appealsPageSize, appealsPage * appealsPageSize);

  const pendingAppealsCount = appeals.filter(a => a.status === 'Pending').length;

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Restricted Administration Console</h2>
        <p className="text-xs text-slate-500">Fine and Disciplinary management is restricted to authorized HODs and College Directorate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-5xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Feature 5: Fine & Disciplinary Management Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Institutional Fines & Dispute Review Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Issue authorized dues under Senate rules, review student appeals, and manage institutional fine waivers with audit trails.
            </p>
          </div>

          <button
            onClick={() => setShowIssueModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Fine</span>
          </button>
        </div>
      </div>

      {/* Statutory Safeguard Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-slate-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Statutory Due-Process Policy</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <strong>Prohibition of Automated Attendance Fines:</strong> Under HIET Academic Regulations, low attendance (&lt;75%) requires academic counseling and formal shortage notices, not automatic fiscal fines. Fines are strictly reserved for verified physical damage, lost credentials, or disciplinary infractions following human review.
        </p>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('fines')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'fines'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Assessed Fines ({fines.length})
        </button>
        <button
          onClick={() => setActiveTab('appeals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'appeals'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Dispute Appeals</span>
          {pendingAppealsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
              {pendingAppealsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'rules'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Configurable Fine Rules ({rules.length})
        </button>
      </div>

      {/* Tab 1: Fines List */}
      {activeTab === 'fines' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setFinesPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="Issued">Issued</option>
                <option value="Under_Dispute">Under Dispute</option>
                <option value="Paid">Paid</option>
                <option value="Waived">Waived</option>
              </select>
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student or fine..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFinesPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-bold text-[11px]">
                  <th className="py-2.5 px-2">Student</th>
                  <th className="py-2.5 px-2">Item & Category</th>
                  <th className="py-2.5 px-2">Amount</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Due Date</th>
                  <th className="py-2.5 px-2">Assessor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedFines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-2">
                      <span className="font-bold text-slate-900">{f.student_name}</span>
                      <span className="block text-[10px] font-mono text-slate-500">{f.student_roll}</span>
                    </td>
                    <td className="py-3 px-2 max-w-xs">
                      <span className="font-semibold text-slate-800">{f.title}</span>
                      <span className="block text-[10px] text-blue-700">{f.category}</span>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">
                      ₹{f.amount}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        f.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : f.status === 'Waived'
                          ? 'bg-blue-100 text-blue-800'
                          : f.status === 'Under_Dispute'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {f.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-600 text-[11px]">{f.due_date}</td>
                    <td className="py-3 px-2 text-slate-600 text-[11px]">{f.issued_by_name}</td>
                  </tr>
                ))}
                {pagedFines.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No assessed fines matching the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Fines Pagination Controls */}
          {filteredFines.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-700">{(finesPage - 1) * finesPageSize + 1}</span> to{' '}
                <span className="font-semibold text-slate-700">{Math.min(finesPage * finesPageSize, filteredFines.length)}</span> of{' '}
                <span className="font-semibold text-slate-700">{filteredFines.length}</span> records
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFinesPage(prev => Math.max(prev - 1, 1))}
                  disabled={finesPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs font-semibold text-slate-700">
                  Page {finesPage} of {totalFinesPages}
                </span>
                <button
                  onClick={() => setFinesPage(prev => Math.min(prev + 1, totalFinesPages))}
                  disabled={finesPage >= totalFinesPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Appeals Review */}
      {activeTab === 'appeals' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Student Disciplinary Appeals</h3>
            <p className="text-xs text-slate-500">Review justification statements submitted by students</p>
          </div>

          <div className="space-y-3">
            {pagedAppeals.map((appeal) => {
              const fine = fines.find(f => f.id === appeal.fine_id);
              return (
                <div key={appeal.id} className="p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-xs">{appeal.student_name}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{appeal.student_roll}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          appeal.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {appeal.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        Disputed Fine: {fine?.title} (₹{fine?.amount})
                      </p>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-xs mt-2 italic">
                        &ldquo;{appeal.appeal_reason}&rdquo;
                      </div>
                      {appeal.review_notes && (
                        <p className="text-[11px] text-blue-700 mt-1 font-medium">
                          Adjudication Record: {appeal.review_notes}
                        </p>
                      )}
                    </div>

                    {appeal.status === 'Pending' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setTargetAppeal(appeal);
                            setAdjudicateAction('Waive');
                            setAdjudicateReason('Verified and approved for complete waiver upon consideration of student appeal.');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-2xs transition"
                        >
                          Waive Fine
                        </button>
                        <button
                          onClick={() => {
                            setTargetAppeal(appeal);
                            setAdjudicateAction('Amend');
                            setAmendedAmount(Math.round((fine?.amount || 100) / 2));
                            setAdjudicateReason('Partial reduction approved under hardship criteria.');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-2xs transition"
                        >
                          Amend
                        </button>
                        <button
                          onClick={() => {
                            setTargetAppeal(appeal);
                            setAdjudicateAction('Reject');
                            setAdjudicateReason('Appeal grounds do not meet exemption criteria under college rules.');
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-2xs transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {pagedAppeals.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No disciplinary appeals recorded.
              </div>
            )}
          </div>

          {/* Appeals Pagination */}
          {appeals.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-700">{(appealsPage - 1) * appealsPageSize + 1}</span> to{' '}
                <span className="font-semibold text-slate-700">{Math.min(appealsPage * appealsPageSize, appeals.length)}</span> of{' '}
                <span className="font-semibold text-slate-700">{appeals.length}</span> appeals
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAppealsPage(prev => Math.max(prev - 1, 1))}
                  disabled={appealsPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs font-semibold text-slate-700">
                  Page {appealsPage} of {totalAppealsPages}
                </span>
                <button
                  onClick={() => setAppealsPage(prev => Math.min(prev + 1, totalAppealsPages))}
                  disabled={appealsPage >= totalAppealsPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Configurable Rules */}
      {activeTab === 'rules' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Institutional Fine Rules Catalog</h3>
            <p className="text-xs text-slate-500">College approved standard penalties and default assessments</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {rule.code}
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    Default: ₹{rule.default_amount}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-800">{rule.title}</h4>
                <p className="text-[11px] text-slate-500">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issue Fine Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Issue Disciplinary Fine</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleIssueFine} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Student *</label>
                <select
                  value={selectedStudentRoll}
                  onChange={(e) => setSelectedStudentRoll(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.roll_no}>
                      {s.name} ({s.roll_no} • {s.branch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fine Rule Category *</label>
                <select
                  value={selectedRuleCode}
                  onChange={(e) => {
                    setSelectedRuleCode(e.target.value);
                    const r = rules.find(rule => rule.code === e.target.value);
                    if (r) {
                      setCustomAmount(r.default_amount);
                      setCustomTitle(r.title);
                      setCustomReason(r.description);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  {rules.map(r => (
                    <option key={r.id} value={r.code}>
                      {r.title} (₹{r.default_amount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fine Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specific Infraction Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Record specific lab equipment, incident details, or proctorial report reference..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Confirm Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjudicate Modal */}
      {targetAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-extrabold text-base text-slate-900">
              {adjudicateAction} Fine Appeal
            </h3>
            <p className="text-slate-600">
              Student: <strong>{targetAppeal.student_name}</strong> ({targetAppeal.student_roll})
            </p>

            {adjudicateAction === 'Amend' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amended Fine Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={amendedAmount}
                  onChange={(e) => setAmendedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mandatory Adjudication Reason *</label>
              <textarea
                required
                rows={3}
                value={adjudicateReason}
                onChange={(e) => setAdjudicateReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTargetAppeal(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjudicateSubmit}
                className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
