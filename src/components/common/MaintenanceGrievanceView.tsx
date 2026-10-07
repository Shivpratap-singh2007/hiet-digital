import React, { useState } from 'react';
import { 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  User, 
  MapPin, 
  Calendar, 
  ArrowUpRight,
  ShieldAlert,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from './PageHeader';
import { StatCard } from './StatCard';
import { MaintenanceTicket, MaintenanceUpdate } from '../../types';

export const MaintenanceGrievanceView: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'principal' || role === 'hod';
  const isStaff = role === 'it_staff' || role === 'lab_staff' || role === 'non_teaching';
  const student = user?.studentMaster;

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([
    {
      id: 'tkt-001',
      ticket_number: 'TKT-2026-001',
      category: 'Classroom',
      title: 'Smart Board Projector Alignment in LH-201',
      description: 'The ceiling projector in Lecture Hall 201 has optical distortion on the right side and requires re-calibration before next sessional test.',
      location: 'Block B, 2nd Floor, Room 201',
      priority: 'High',
      status: 'In Progress',
      reported_by: user?.student_id || 'std-cse-001',
      reporter_name: user?.name || 'Aarav Sharma',
      reporter_role: 'Student',
      assigned_name: 'Manoj Pathania (IT Cell)',
      sla_deadline: new Date(Date.now() + 3600000 * 20).toISOString(),
      is_sla_breached: false,
      created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'tkt-002',
      ticket_number: 'TKT-2026-002',
      category: 'IT / Network',
      title: 'Wi-Fi Access Point Low Throughput in Library Hall',
      description: 'Wi-Fi connection drops intermittently near the journal reading zone.',
      location: 'Central Library, 1st Floor',
      priority: 'Emergency',
      status: 'Escalated',
      reported_by: 'std-cse-002',
      reporter_name: 'Pooja Gupta',
      reporter_role: 'Library Staff',
      sla_deadline: new Date(Date.now() - 3600000 * 4).toISOString(),
      is_sla_breached: true,
      escalated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 52).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<MaintenanceTicket | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Form
  const [newTicket, setNewTicket] = useState({
    category: 'Classroom' as const,
    title: '',
    description: '',
    location: '',
    priority: 'Medium' as const,
    is_anonymous: false
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const created: MaintenanceTicket = {
      id: `tkt-${Date.now()}`,
      ticket_number: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
      category: newTicket.category,
      title: newTicket.title,
      description: newTicket.description,
      location: newTicket.location,
      priority: newTicket.priority,
      status: 'Open',
      reported_by: user?.student_id || 'usr-001',
      reporter_name: newTicket.is_anonymous ? 'Anonymous Resident' : (user?.name || 'Campus Member'),
      reporter_role: role || 'Student',
      sla_deadline: new Date(Date.now() + 3600000 * 48).toISOString(), // 48-hour institutional SLA
      is_sla_breached: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTickets(prev => [created, ...prev]);
    setShowCreateModal(false);
  };

  const handleStatusChange = (ticketId: string, newStatus: MaintenanceTicket['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          resolved_at: newStatus === 'Resolved' ? new Date().toISOString() : t.resolved_at,
          resolution_notes: newStatus === 'Resolved' ? (resolutionNote || 'Resolved by engineering/facilities desk') : t.resolution_notes,
          updated_at: new Date().toISOString()
        };
      }
      return t;
    }));
    setSelectedTicketForDetail(null);
    setResolutionNote('');
  };

  const filteredTickets = tickets.filter(t => {
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || 
             t.location.toLowerCase().includes(q) || 
             t.ticket_number.toLowerCase().includes(q);
    }
    return true;
  });

  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated' || t.is_sla_breached).length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Campus Operations' },
          { label: 'Maintenance & 48h SLA Grievances', active: true }
        ]}
        title="Campus Grievance & Maintenance Desk"
        description="Classroom, laboratory, network and hostel facility tickets with 48-hour automated SLA escalation"
        badge="Operations & Infrastructure"
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Grievance / Maintenance</span>
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Tickets"
          value={openCount}
          icon={Clock}
          badgeColor="blue"
          subtext="Awaiting technician assignment"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={Wrench}
          badgeColor="amber"
          subtext="Active repair or troubleshooting"
        />
        <StatCard
          label="48h SLA Escalated"
          value={escalatedCount}
          icon={ShieldAlert}
          badgeColor="rose"
          badge={escalatedCount > 0 ? "Alert" : "Zero"}
          subtext="Breached resolution window"
        />
        <StatCard
          label="Resolved Tickets"
          value={resolvedCount}
          icon={CheckCircle2}
          badgeColor="emerald"
          subtext="Satisfactorily completed"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, location, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="All">All Categories</option>
              <option value="Classroom">Classroom</option>
              <option value="Laboratory">Laboratory</option>
              <option value="IT / Network">IT / Network</option>
              <option value="Hostel">Hostel</option>
              <option value="Electrical">Electrical</option>
              <option value="Sanitation">Sanitation</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Category & Location</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">SLA Resolution Timer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No grievance or maintenance tickets found
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{t.ticket_number}</div>
                      <div className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{t.title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{t.category}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[160px]">{t.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.priority === 'Emergency' ? 'bg-rose-100 text-rose-800 font-black' :
                        t.priority === 'High' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        t.priority === 'Medium' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {t.is_sla_breached ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> SLA Breached (&gt;48h)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Within 48h Window
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === 'Escalated' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        t.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicketForDetail(t)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-[11px] transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail / Action Modal */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-[#0f2942]">{selectedTicketForDetail.ticket_number}</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedTicketForDetail.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900">{selectedTicketForDetail.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-900">{selectedTicketForDetail.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reported by:</span>
                <span className="font-bold text-slate-900">{selectedTicketForDetail.reporter_name} ({selectedTicketForDetail.reporter_role})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned To:</span>
                <span className="font-bold text-slate-900">{selectedTicketForDetail.assigned_name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-700">Detailed Description:</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">{selectedTicketForDetail.description}</p>
            </div>

            {(isAdmin || isStaff) && selectedTicketForDetail.status !== 'Resolved' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resolution / Action Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Describe parts replaced or resolution procedure..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedTicketForDetail.id, 'In Progress')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    Set In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedTicketForDetail.id, 'Escalated')}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 transition"
                  >
                    Escalate to HOD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedTicketForDetail.id, 'Resolved')}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Submit Campus Grievance / Maintenance</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket(p => ({ ...p, category: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  >
                    <option value="Classroom">Classroom issue</option>
                    <option value="Laboratory">Laboratory issue</option>
                    <option value="IT / Network">IT / Wi-Fi issue</option>
                    <option value="Hostel">Hostel issue</option>
                    <option value="Electrical">Electrical issue</option>
                    <option value="Sanitation">Sanitation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket(p => ({ ...p, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  >
                    <option value="Low">Low (General)</option>
                    <option value="Medium">Medium (Needs attention)</option>
                    <option value="High">High (Impacting classes)</option>
                    <option value="Emergency">Emergency (Safety/Critical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exact Campus Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block B, LH-201, 2nd Floor"
                  value={newTicket.location}
                  onChange={(e) => setNewTicket(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Summary Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Projector power failure during afternoon lectures"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Include specific equipment codes, error lights, or symptoms..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-anon"
                  checked={newTicket.is_anonymous}
                  onChange={(e) => setNewTicket(p => ({ ...p, is_anonymous: e.target.checked }))}
                  className="rounded border-slate-300 text-[#0f2942] focus:ring-[#0f2942]"
                />
                <label htmlFor="chk-anon" className="text-slate-700 font-semibold cursor-pointer">
                  Submit anonymously (Identity concealed from public logs)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
