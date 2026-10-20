import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Lock,
  Building,
  ArrowUpRight,
  Send,
  User, 
  FileText,
  Calendar,
  ChevronDown,
  Flame,
  ShieldCheck,
  History
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { Complaint, GrievanceStatus } from '../../types';
import { formatIndiaDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

type ReportTab = 'all' | 'principal_queue' | 'md_queue' | 'under_review' | 'resolved';

interface ReportsManagementViewProps {
  roleMode?: 'principal' | 'md' | 'hod' | 'admin';
}

export const ReportsManagementView: React.FC<ReportsManagementViewProps> = ({ roleMode }) => {
  const { role: authRole } = useAuth();
  const effectiveRole = roleMode || (authRole === 'principal' ? 'principal' : authRole === 'managing_director' ? 'md' : 'admin');

  const defaultTab: ReportTab = effectiveRole === 'md' ? 'md_queue' : effectiveRole === 'principal' ? 'principal_queue' : 'all';
  const [activeTab, setActiveTab] = useState<ReportTab>(defaultTab);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState<Complaint | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>(() => dataStore.getComplaints());
  const [remarks, setRemarks] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiService.getComplaints().then(data => {
      if (isMounted && data) {
        setComplaints(data);
      }
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, []);

  const categories = Array.from(new Set(complaints.map(c => c.category || 'Other')));

  const handlePrincipalAction = async (newStatus: GrievanceStatus) => {
    if (!selectedReport) return;
    setIsUpdating(true);
    const actionDesc = actionTaken.trim() || (newStatus === 'Under Review' ? 'Review initiated by Principal' : newStatus === 'Resolved' ? 'Grievance redressed by Principal' : 'Escalated to Managing Director');
    
    await apiService.reviewComplaintByPrincipal(selectedReport.id, {
      remarks: remarks.trim() || undefined,
      actionTaken: actionDesc,
      newStatus
    });

    const refreshed = await apiService.getComplaints();
    setComplaints(refreshed);
    const updated = refreshed.find(c => c.id === selectedReport.id);
    if (updated) setSelectedReport(updated);
    setRemarks('');
    setActionTaken('');
    setIsUpdating(false);
  };

  const handleMdResolution = async (newStatus: GrievanceStatus = 'Resolved') => {
    if (!selectedReport) return;
    setIsUpdating(true);
    const resolutionDesc = actionTaken.trim() || 'Final executive resolution approved by Managing Director.';

    await apiService.resolveComplaintByMD(selectedReport.id, {
      remarks: remarks.trim() || undefined,
      resolution: resolutionDesc,
      newStatus
    });

    const refreshed = await apiService.getComplaints();
    setComplaints(refreshed);
    const updated = refreshed.find(c => c.id === selectedReport.id);
    if (updated) setSelectedReport(updated);
    setRemarks('');
    setActionTaken('');
    setIsUpdating(false);
  };

  const filteredReports = complaints.filter(c => {
    if (activeTab === 'principal_queue') {
      if (c.status !== 'Pending Principal Review' && c.status !== 'Principal Action Overdue' && (c.status as string) !== 'Submitted') {
        return false;
      }
    }
    if (activeTab === 'md_queue') {
      if (c.status !== 'Escalated to MD' && !c.escalated_to_md) return false;
    }
    if (activeTab === 'under_review') {
      if (c.status !== 'Under Review') return false;
    }
    if (activeTab === 'resolved') {
      if (c.status !== 'Resolved' && c.status !== 'Closed') return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const match = c.title.toLowerCase().includes(q) || 
                    c.description.toLowerCase().includes(q) || 
                    (c.reference_id && c.reference_id.toLowerCase().includes(q)) ||
                    (!c.is_anonymous && c.student_name && c.student_name.toLowerCase().includes(q)) ||
                    (!c.is_anonymous && c.student_roll && c.student_roll.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;

    return true;
  });

  const counts = {
    principal_queue: complaints.filter(c => c.status === 'Pending Principal Review' || c.status === 'Principal Action Overdue' || (c.status as string) === 'Submitted').length,
    md_queue: complaints.filter(c => c.status === 'Escalated to MD' || c.escalated_to_md).length,
    under_review: complaints.filter(c => c.status === 'Under Review').length,
    resolved: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    all: complaints.length
  };

  const getStatusBadge = (s: Complaint['status']) => {
    switch (s) {
      case 'Pending Principal Review':
      case 'Submitted':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'Principal Action Overdue':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800 animate-pulse';
      case 'Escalated to MD':
        return 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs';
      case 'Under Review':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 font-sans w-full max-w-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: 'Institutional Compliance' },
          { label: 'Reports & Grievance Workspace', active: true }
        ]}
        title="Student Grievance Redressal Desk"
        description="Statutory grievance hierarchy: Student → Principal (48-Hour SLA) → Managing Director (MD Escalation). Strict complainant confidentiality enforced."
        badge={effectiveRole === 'md' ? 'Office of the Managing Director' : effectiveRole === 'principal' ? 'Office of the Principal' : 'Central Compliance'}
      />

      {/* Structured Queue Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-px" aria-label="Grievance Queue Tabs">
          {[
            { id: 'principal_queue' as ReportTab, label: "Stage 1: Principal Review", count: counts.principal_queue },
            { id: 'md_queue' as ReportTab, label: "Stage 3: Escalated to MD", count: counts.md_queue },
            { id: 'under_review' as ReportTab, label: "Under Review", count: counts.under_review },
            { id: 'resolved' as ReportTab, label: "Resolved History", count: counts.resolved },
            { id: 'all' as ReportTab, label: "All Grievances", count: counts.all }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedReport(null);
                }}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[#0f2942] text-[#0f2942]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive 
                    ? 'bg-[#0f2942] text-white' 
                    : tab.id === 'md_queue' && tab.count > 0 
                    ? 'bg-rose-600 text-white animate-pulse'
                    : tab.id === 'principal_queue' && tab.count > 0
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ref ID, subject, category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-[#0f2942] outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden w-full sm:w-auto"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table and Details Split */}
      {filteredReports.length === 0 ? (
        <EmptyState
          title="No grievances found"
          description="There are no grievances in this queue matching your current filters."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List Table / Cards (2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 min-w-[180px]">Ticket & Subject</th>
                      <th className="py-3 px-4 min-w-[110px] whitespace-nowrap">Category</th>
                      <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Submitted Date</th>
                      <th className="py-3 px-4 min-w-[120px] whitespace-nowrap">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredReports.map(item => {
                      const isSelected = selectedReport?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedReport(item)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                                {item.reference_id || item.id.slice(-6).toUpperCase()}
                              </span>
                              {item.is_anonymous ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Lock className="w-2.5 h-2.5" /> Anonymous
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  • {item.student_name}
                                </span>
                              )}
                            </div>
                            <div className="truncate font-semibold text-slate-900">{item.title}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold whitespace-nowrap">
                              {item.category || 'Other'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {item.created_at ? formatIndiaDateTime(item.created_at) : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (sm:hidden) */}
            <div className="sm:hidden space-y-2.5">
              {filteredReports.map(item => {
                const isSelected = selectedReport?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReport(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-2.5 text-xs ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                          {item.reference_id || item.id.slice(-6).toUpperCase()}
                        </span>
                        {item.is_anonymous ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Lock className="w-2.5 h-2.5" /> Anonymous
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600 font-medium">
                            {item.student_name}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-slate-900 break-words">
                      {item.title}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {item.category || 'Other'}
                      </span>
                      <span className="font-mono">
                        {item.created_at ? formatIndiaDateTime(item.created_at) : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Panel (1 col on desktop) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs sticky top-20">
            {selectedReport ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-bold uppercase">
                      {selectedReport.reference_id || `Ticket #${selectedReport.id.slice(0, 8)}`}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                      {selectedReport.title}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>

                <div className="text-xs space-y-3 text-slate-600">
                  {/* Complainant Confidentiality Banner */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-700 block text-[10px] uppercase">Complainant Identity</span>
                      <p className="text-slate-900 font-semibold mt-0.5">
                        {selectedReport.is_anonymous ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <Lock className="w-3.5 h-3.5" /> Anonymous Student (Protected Under Anti-Retaliation Policy)
                          </span>
                        ) : (
                          `${selectedReport.student_name || 'Student'} (${selectedReport.student_roll || 'Confidential ID'})`
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Incident Details */}
                  {(selectedReport.incident_date || selectedReport.incident_location) && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 border border-slate-100">
                      {selectedReport.incident_date && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">Incident Date</span>
                          <span className="font-semibold text-slate-800">{selectedReport.incident_date}</span>
                        </div>
                      )}
                      {selectedReport.incident_location && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">Incident Location</span>
                          <span className="font-semibold text-slate-800">{selectedReport.incident_location}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase">Grievance Narrative</span>
                    <p className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed text-xs">
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* Principal Remarks & Action Recorded */}
                  {(selectedReport.principal_remarks || selectedReport.principal_action_taken) && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                      <span className="font-bold text-blue-900 flex items-center gap-1 text-[11px] uppercase mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Principal Redressal Record
                      </span>
                      {selectedReport.principal_action_taken && (
                        <p className="text-blue-900 font-medium">
                          <strong>Action Taken:</strong> {selectedReport.principal_action_taken}
                        </p>
                      )}
                      {selectedReport.principal_remarks && (
                        <p className="text-blue-800 mt-1">
                          <strong>Remarks:</strong> {selectedReport.principal_remarks}
                        </p>
                      )}
                      {selectedReport.principal_reviewed_at && (
                        <span className="text-[10px] text-blue-600 block mt-1">
                          Recorded: {formatIndiaDateTime(selectedReport.principal_reviewed_at)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* MD Resolution Card */}
                  {(selectedReport.md_resolution || selectedReport.md_remarks || selectedReport.md_notes) && (
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                      <span className="font-bold text-purple-900 flex items-center gap-1 text-[11px] uppercase mb-1">
                        <Building className="w-3.5 h-3.5 text-purple-600" /> Managing Director Final Decision
                      </span>
                      {selectedReport.md_resolution && (
                        <p className="text-purple-900 font-medium">
                          <strong>Final Resolution:</strong> {selectedReport.md_resolution}
                        </p>
                      )}
                      {(selectedReport.md_remarks || selectedReport.md_notes) && (
                        <p className="text-purple-800 mt-1">
                          <strong>MD Remarks:</strong> {selectedReport.md_remarks || selectedReport.md_notes}
                        </p>
                      )}
                      {selectedReport.md_resolved_at && (
                        <span className="text-[10px] text-purple-600 block mt-1">
                          Decided: {formatIndiaDateTime(selectedReport.md_resolved_at)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Escalation Audit History */}
                  {selectedReport.escalation_history && selectedReport.escalation_history.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px] uppercase mb-2">
                        <History className="w-3 h-3 text-slate-500" /> Escalation History & Audit Trail
                      </span>
                      <div className="space-y-2 text-[11px]">
                        {selectedReport.escalation_history.map((hist, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{hist.stage}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {hist.timestamp ? formatIndiaDateTime(hist.timestamp) : ''}
                              </span>
                            </div>
                            <p className="text-slate-700 mt-0.5">{hist.action}</p>
                            {hist.remarks && (
                              <p className="text-slate-500 italic mt-0.5 text-[10px]">{hist.remarks}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Action Form (for Principal / MD / Admin) */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase">
                    {effectiveRole === 'md' || selectedReport.status === 'Escalated to MD' 
                      ? 'Managing Director Executive Action' 
                      : 'Principal Review & Action'}
                  </span>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Action Taken / Proposed Resolution
                    </label>
                    <input
                      type="text"
                      value={actionTaken}
                      onChange={e => setActionTaken(e.target.value)}
                      placeholder={effectiveRole === 'md' ? 'Enter final resolution decree...' : 'Enter action taken, investigation order, or redressal details...'}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0f2942] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Remarks / Directives
                    </label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Add formal remarks..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0f2942] outline-hidden"
                    />
                  </div>

                  {effectiveRole === 'md' || selectedReport.status === 'Escalated to MD' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleMdResolution('Resolved')}
                        className="flex-1 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0c2135] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isUpdating ? 'Saving...' : 'Record MD Resolution & Resolve'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handlePrincipalAction('Under Review')}
                        className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-[11px] transition text-center"
                      >
                        Mark In Review
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handlePrincipalAction('Resolved')}
                        className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] transition text-center"
                      >
                        Resolve Grievance
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handlePrincipalAction('Escalated to MD')}
                        className="py-2 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] transition text-center"
                        title="Forward to Managing Director Executive Queue"
                      >
                        Escalate to MD
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">Select a grievance from the list</p>
                <p className="text-slate-400 mt-0.5">Click any ticket to view details, 48-hour SLA status, and record review actions.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
