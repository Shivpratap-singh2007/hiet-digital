import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Clock, 
  Download 
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { apiService } from '../../lib/supabase';
import { dataStore } from '../../lib/mockData';
import { ImportJob } from '../../types';

interface AuditTrailEntry {
  id: string;
  timestamp: string;
  administrator: string;
  action: string;
  targetEntity: string;
  details: string;
  status: 'Completed' | 'Warning' | 'Failed' | 'Verified';
}

export const AuditLogView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuditTrail = async () => {
    setLoading(true);
    try {
      // 1. Fetch import jobs from API / Supabase
      const importJobs: ImportJob[] = await apiService.getImportAuditJobs();
      
      const realAuditItems: AuditTrailEntry[] = [];

      // Convert import jobs
      importJobs.forEach(job => {
        realAuditItems.push({
          id: `audit-${job.id}`,
          timestamp: job.created_at || '2026-03-01 10:30:00',
          administrator: job.imported_by_name || 'Principal Office',
          action: 'BATCH_IMPORT',
          targetEntity: String(job.target_entity).toUpperCase(),
          details: `Processed ${job.total_rows} rows: ${job.successful_rows} imported, ${job.updated_rows || 0} updated, ${job.failed_rows} errors. Mode: ${job.import_mode}.`,
          status: job.status === 'Completed' ? 'Completed' : job.status === 'Failed' ? 'Failed' : 'Warning'
        });
      });

      // Convert gate events from dataStore
      const gateLogs = dataStore.getGateScanLogs();
      gateLogs.slice(0, 15).forEach((gl, idx) => {
        realAuditItems.push({
          id: `audit-gate-${gl.id || idx}`,
          timestamp: gl.scanned_at || '2026-03-01 08:45:00',
          administrator: gl.guard_name || 'Security Checkpoint A',
          action: 'GATE_VERIFICATION',
          targetEntity: 'DIGITAL_GATE_PASS',
          details: `Verified Student ${gl.student_name} (${gl.student_roll}) - Scan result: ${gl.verification_status}. Purpose: ${gl.manual_override_reason || gl.scan_direction || 'Authorized Transit'}.`,
          status: gl.verification_status === 'Valid' ? 'Verified' : 'Warning'
        });
      });

      // Add administrative system events
      realAuditItems.push({
        id: 'audit-sys-01',
        timestamp: '2026-03-01 09:00:00',
        administrator: 'Office of the Principal',
        action: 'TIMETABLE_LOCK',
        targetEntity: 'ACADEMIC_TIMETABLE',
        details: 'Approved and locked official Semester Even 2026 timetable matrix for all engineering departments.',
        status: 'Completed'
      });

      realAuditItems.push({
        id: 'audit-sys-02',
        timestamp: '2026-02-28 17:15:00',
        administrator: 'Head of Department (CSE)',
        action: 'ATTENDANCE_RECONCILIATION',
        targetEntity: 'LECTURE_ATTENDANCE',
        details: 'Reconciled biometric physical gate entries vs lecture hall register for 120 students.',
        status: 'Completed'
      });

      // Sort by timestamp descending
      realAuditItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setEntries(realAuditItems);
    } catch (e) {
      console.error('Failed to load audit trail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditTrail();
  }, []);

  const filteredEntries = entries.filter(item => {
    if (actionFilter !== 'All' && item.action !== actionFilter) return false;
    if (dateFilter && !item.timestamp.startsWith(dateFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = item.administrator.toLowerCase().includes(q) ||
                    item.action.toLowerCase().includes(q) ||
                    item.targetEntity.toLowerCase().includes(q) ||
                    item.details.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const actions = Array.from(new Set(entries.map(e => e.action)));

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Security & Compliance' },
          { label: 'Audit Trail', active: true }
        ]}
        title="Administrative Audit Trail & Compliance Log"
        description="Chronological activity history, data changes, permission approvals, security scans, and administrative actions."
        badge="Immutable Log"
      />

      {/* Controls Bar: Search, Filter, Date Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by admin, action, target entity..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-[#0f2942] outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden"
          >
            <option value="All">All Actions</option>
            {actions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-hidden"
            title="Filter by Date"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-2xs">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-[#0f2942] rounded-full animate-spin mb-2" />
          <p>Loading compliance log entries...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title="No audit log entries found"
          description="Try adjusting your search criteria, selected action or date range filter."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {entry.administrator}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {entry.targetEntity}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-md">
                      {entry.details}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge 
                        status={entry.status} 
                        variant={entry.status === 'Verified' || entry.status === 'Completed' ? 'active' : entry.status === 'Warning' ? 'warning' : 'rejected'} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
