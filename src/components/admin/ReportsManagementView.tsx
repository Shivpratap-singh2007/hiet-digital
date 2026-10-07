import React, { useState } from 'react';
import { 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldAlert, 
  User, 
  FileText,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { dataStore } from '../../lib/mockData';
import { Complaint } from '../../types';

type ReportTab = 'open' | 'under_review' | 'resolved' | 'all';

export const ReportsManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('open');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState<Complaint | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>(() => dataStore.getComplaints());

  const categories = Array.from(new Set(complaints.map(c => c.category || 'General')));

  const handleUpdateStatus = (id: string, newStatus: 'Submitted' | 'Under Review' | 'Resolved' | 'Closed') => {
    const updated = complaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setComplaints(updated);
    dataStore.setComplaints(updated);
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport({ ...selectedReport, status: newStatus });
    }
  };

  const filteredReports = complaints.filter(c => {
    if (activeTab === 'open' && c.status !== 'Submitted') return false;
    if (activeTab === 'under_review' && c.status !== 'Under Review') return false;
    if (activeTab === 'resolved' && c.status !== 'Resolved' && c.status !== 'Closed') return false;

    if (search) {
      const q = search.toLowerCase();
      const match = c.title.toLowerCase().includes(q) || 
                    c.description.toLowerCase().includes(q) || 
                    (c.student_name && c.student_name.toLowerCase().includes(q)) ||
                    (c.student_roll && c.student_roll.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;

    return true;
  });

  const counts = {
    open: complaints.filter(c => c.status === 'Submitted').length,
    under_review: complaints.filter(c => c.status === 'Under Review').length,
    resolved: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    all: complaints.length
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Institutional Compliance' },
          { label: 'Reports & Grievances', active: true }
        ]}
        title="Reports & Grievance Workspace"
        description="Structured redressal queue for campus incidents, disciplinary reports, department feedback, and student queries."
        badge="Redressal Desk"
      />

      {/* Structured Queue Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-px" aria-label="Report Queue Tabs">
          {[
            { id: 'open' as ReportTab, label: 'Open Reports', count: counts.open },
            { id: 'under_review' as ReportTab, label: 'Under Review', count: counts.under_review },
            { id: 'resolved' as ReportTab, label: 'Resolved History', count: counts.resolved },
            { id: 'all' as ReportTab, label: 'All Reports', count: counts.all }
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
                    : tab.id === 'open' && tab.count > 0 
                    ? 'bg-rose-100 text-rose-800'
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
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reports by title, student, roll no..."
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
          title="No reports found"
          description="There are no grievance or compliance reports matching your current filter parameters."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List Table (2 cols on desktop) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Subject & Student</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
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
                          <div className="truncate font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.student_name || 'Anonymous Student'} ({item.student_roll || 'ID: Confidential'})
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : '2026-03-01'}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge 
                            status={item.status} 
                            variant={item.status === 'Under Review' ? 'under_review' : item.status === 'Submitted' ? 'pending' : item.status === 'Resolved' || item.status === 'Closed' ? 'resolved' : 'info'}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Panel (1 col on desktop) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs sticky top-20">
            {selectedReport ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      Ticket #{selectedReport.id.slice(0, 8)}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                      {selectedReport.title}
                    </h3>
                  </div>
                  <StatusBadge 
                    status={selectedReport.status} 
                    variant={selectedReport.status === 'Under Review' ? 'under_review' : selectedReport.status === 'Submitted' ? 'pending' : selectedReport.status === 'Resolved' || selectedReport.status === 'Closed' ? 'resolved' : 'info'}
                  />
                </div>

                <div className="text-xs space-y-2.5 text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase">Complainant / Reporter</span>
                    <p className="text-slate-900 font-medium mt-0.5">
                      {selectedReport.student_name} ({selectedReport.student_roll})
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase">Grievance Narrative</span>
                    <p className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed text-xs">
                      {selectedReport.description}
                    </p>
                  </div>

                  {selectedReport.admin_response && (
                    <div>
                      <span className="font-semibold text-slate-700 block text-[11px] uppercase">Administrative Redressal Note</span>
                      <p className="mt-1 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                        {selectedReport.admin_response}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase">Update Case Status:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedReport.id, 'Under Review')}
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs transition text-center"
                    >
                      Mark Under Review
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedReport.id, 'Resolved')}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition text-center"
                    >
                      Resolve Case
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">Select a report from the list</p>
                <p className="text-slate-400 mt-0.5">Click any report row to view full details and submit redressal status.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
