import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, MessageSquare, Send, ShieldAlert, Lock, Flame, Building, ArrowUpRight, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Complaint } from '../../types';
import { formatDate } from '../../lib/utils';

export const AdminComplaintsView: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>(() => dataStore.getComplaints());
  const [filter, setFilter] = useState<'all' | 'escalated' | 'pending' | 'resolved'>('all');
  const [selectedComp, setSelectedComp] = useState<Complaint | null>(null);
  const [status, setStatus] = useState<Complaint['status']>('Under Review');
  const [assignedToName, setAssignedToName] = useState('');
  const [response, setResponse] = useState('');
  const [mdNotes, setMdNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination for large dataset
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    let isMounted = true;
    apiService.getComplaints().then(data => {
      if (isMounted && data && data.length > 0) setComplaints(data);
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, []);

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'escalated') return c.status === 'Escalated to MD' || c.escalated_to_md;
    if (filter === 'pending') return c.status === 'Submitted' || c.status === 'Under Review';
    if (filter === 'resolved') return c.status === 'Resolved' || c.status === 'Closed';
    return true;
  });

  const totalPages = Math.ceil(filteredComplaints.length / pageSize) || 1;
  const pagedComplaints = filteredComplaints.slice((page - 1) * pageSize, page * pageSize);

  const escalatedCount = complaints.filter(c => c.status === 'Escalated to MD' || c.escalated_to_md).length;

  const handleUpdate = async () => {
    if (!selectedComp) return;

    setLoading(true);
    await apiService.updateComplaint(selectedComp.id, {
      status,
      assigned_to_name: assignedToName || selectedComp.assigned_to_name,
      admin_response: response || selectedComp.admin_response,
      md_notes: mdNotes || selectedComp.md_notes
    });

    setComplaints(prev => prev.map(c => 
      c.id === selectedComp.id ? { 
        ...c, 
        status, 
        assigned_to_name: assignedToName || c.assigned_to_name, 
        admin_response: response || c.admin_response,
        md_notes: mdNotes || c.md_notes
      } : c
    ));
    setLoading(false);
    setSelectedComp(null);
  };

  const handleManualEscalate = async (comp: Complaint) => {
    await apiService.escalateComplaintToMD(
      comp.id,
      'Administrative review identified urgent unresolved grievance. Escalated to College MD Desk.'
    );
    setComplaints(prev => prev.map(c => 
      c.id === comp.id ? { 
        ...c, 
        status: 'Escalated to MD', 
        escalated_to_md: true,
        escalation_reason: 'Administrative review identified urgent unresolved grievance. Escalated to College MD Desk.',
        escalated_at: new Date().toISOString()
      } : c
    ));
    if (selectedComp?.id === comp.id) {
      setSelectedComp(prev => prev ? { ...prev, status: 'Escalated to MD', escalated_to_md: true } : null);
      setStatus('Escalated to MD');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              Central Campus Grievance Desk
            </h2>
            {escalatedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5" />
                {escalatedCount} Escalated to MD
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Triage, assign maintenance work orders, respect anonymous student privacy, and manage direct MD escalation tickets
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
          >
            All Tickets ({complaints.length})
          </button>
          <button
            onClick={() => setFilter('escalated')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${filter === 'escalated' ? 'bg-red-600 text-white shadow-xs' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'}`}
          >
            <Flame className="w-3 h-3" />
            MD Escalated ({escalatedCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'pending' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'resolved' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[640px]">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Student Identity</th>
              <th className="px-4 py-3">Category & Priority</th>
              <th className="px-4 py-3">Title & Issue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Triage & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {pagedComplaints.map(comp => (
              <tr key={comp.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-750 ${comp.escalated_to_md ? 'bg-red-50/40 dark:bg-red-950/20' : ''}`}>
                <td className="px-4 py-3 font-mono font-bold text-slate-400">#{comp.id.slice(-5).toUpperCase()}</td>
                <td className="px-4 py-3">
                  {comp.is_anonymous ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Anonymous Student</span>
                      <span className="text-[10px] font-normal text-slate-400">({comp.student_branch || 'CSE'} Sem {comp.student_semester || 6})</span>
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{comp.student_name}</div>
                      <div className="text-[10px] font-mono text-blue-600">Roll: {comp.student_roll || '210101'}</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{comp.category}</span>
                  <span className="text-[10px] font-semibold text-rose-600">{comp.priority} Priority</span>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{comp.title}</div>
                  <p className="line-clamp-1 text-slate-500 text-[11px] mt-0.5">{comp.description}</p>
                </td>
                <td className="px-4 py-3">
                  {comp.status === 'Escalated to MD' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse flex items-center gap-1 w-max shadow-xs">
                      <Flame className="w-3 h-3" />
                      Escalated to MD
                    </span>
                  ) : (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {comp.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setSelectedComp(comp);
                      setStatus(comp.status);
                      setAssignedToName(comp.assigned_to_name || '');
                      setResponse(comp.admin_response || '');
                      setMdNotes(comp.md_notes || '');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      comp.escalated_to_md 
                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 text-slate-700 dark:text-slate-200 hover:text-rose-700'
                    }`}
                  >
                    {comp.escalated_to_md ? 'Review MD Escalation' : 'Action'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Toolbar */}
        {filteredComplaints.length > pageSize && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
            <span>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredComplaints.length)} of {filteredComplaints.length} tickets
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 px-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Grievance Redressal Action
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ticket #{selectedComp.id.slice(-5).toUpperCase()} • {selectedComp.title}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 space-y-1 text-xs mb-4">
              <span className="text-slate-400 block font-semibold">Student Description:</span>
              <p className="text-slate-700 dark:text-slate-300">{selectedComp.description}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-600 mb-1">Ticket Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Escalated to MD">Escalated to MD (Direct Directorate)</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-600 mb-1">Assign Responsible Officer</label>
                  <input
                    type="text"
                    value={assignedToName}
                    onChange={e => setAssignedToName(e.target.value)}
                    placeholder="e.g. Electrical Division, Chief Warden, MD Office"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-600 mb-1">Administrative Response / Action Note</label>
                <textarea
                  rows={2}
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Describe the remediation step taken..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* MD Executive Review Notes */}
              <div>
                <label className="block font-semibold uppercase text-red-600 dark:text-red-400 mb-1 flex items-center justify-between">
                  <span>🏛️ MD Office Direct Directives & Notes</span>
                  {status !== 'Escalated to MD' && (
                    <button
                      type="button"
                      onClick={() => handleManualEscalate(selectedComp)}
                      className="text-[10px] text-red-600 underline hover:text-red-700 font-bold"
                    >
                      Trigger Immediate Escalation to MD
                    </button>
                  )}
                </label>
                <textarea
                  rows={2}
                  value={mdNotes}
                  onChange={e => setMdNotes(e.target.value)}
                  placeholder="Direct instructions issued by College Managing Director..."
                  className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedComp(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleUpdate}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg"
                >
                  Save Grievance Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
