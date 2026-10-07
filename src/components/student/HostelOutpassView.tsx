import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  QrCode, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  X, 
  Search,
  Filter,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { HostelOutpass } from '../../types';

export const HostelOutpassView: React.FC = () => {
  const { user, role } = useAuth();
  const isWarden = role === 'warden' || role === 'principal' || role === 'admin';
  const isSecurity = role === 'security_guard' || role === 'security';
  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || 'CSE001';

  const [outpasses, setOutpasses] = useState<HostelOutpass[]>([
    {
      id: 'outpass-001',
      student_id: user?.student_id || 'std-cse-001',
      student_name: student?.name || user?.name || 'Aarav Sharma',
      student_roll: currentRoll,
      branch: student?.branch || 'CSE',
      room_no: '204',
      hostel_block: 'Block A (Boys)',
      destination: 'Kangra Home Visit',
      departure_date: new Date().toISOString().slice(0, 10),
      departure_time: '17:00',
      expected_return_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      expected_return_time: '20:00',
      parent_contact: '+91 98160 00000',
      emergency_contact: '+91 98160 11111',
      reason: 'Family visit over the weekend',
      status: 'Approved',
      room_number: '204',
      qr_token: 'OUTPASS-DEMO-2026-001',
      warden_name: 'Sh. Suresh Rana',
      warden_remarks: 'Verified with parents via phone',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'outpass-002',
      student_id: 'std-cse-002',
      student_name: 'Rohan Verma',
      student_roll: 'CSE002',
      branch: 'CSE',
      room_no: '205',
      room_number: '205',
      hostel_block: 'Block A (Boys)',
      destination: 'Dharamshala Library',
      departure_date: new Date().toISOString().slice(0, 10),
      departure_time: '14:00',
      expected_return_date: new Date().toISOString().slice(0, 10),
      expected_return_time: '19:00',
      parent_contact: '+91 98160 22222',
      reason: 'Reference books collection at regional library',
      status: 'Pending',
      qr_token: 'OUTPASS-DEMO-2026-002',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedPassForQR, setSelectedPassForQR] = useState<HostelOutpass | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    hostel_block: 'Block A (Boys)',
    room_no: '204',
    destination: '',
    reason: '',
    departure_date: new Date().toISOString().slice(0, 10),
    departure_time: '16:00',
    expected_return_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    expected_return_time: '20:00',
    parent_contact: '+91 98160 00000',
    emergency_contact: '+91 98160 11111'
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const newPass: HostelOutpass = {
      id: `outpass-${Date.now()}`,
      student_id: user?.student_id || 'std-cse-001',
      student_name: student?.name || user?.name || 'Student',
      student_roll: currentRoll,
      branch: student?.branch || 'CSE',
      room_no: formData.room_no,
      room_number: formData.room_no,
      hostel_block: formData.hostel_block,
      destination: formData.destination,
      departure_date: formData.departure_date,
      departure_time: formData.departure_time,
      expected_return_date: formData.expected_return_date,
      expected_return_time: formData.expected_return_time,
      parent_contact: formData.parent_contact,
      emergency_contact: formData.emergency_contact,
      reason: formData.reason,
      status: 'Pending',
      qr_token: `OUTPASS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      created_at: new Date().toISOString()
    };
    setOutpasses(prev => [newPass, ...prev]);
    setShowApplyModal(false);
  };

  const handleWardenAction = (id: string, action: 'Approved' | 'Rejected') => {
    setOutpasses(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: action,
          warden_name: user?.name || 'Warden',
          warden_remarks: action === 'Approved' ? 'Approved by Hostel Office' : 'Request declined'
        };
      }
      return p;
    }));
  };

  // Filtered list
  const filteredPasses = outpasses.filter(p => {
    if (!isWarden && !isSecurity && p.student_roll !== currentRoll) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.student_name.toLowerCase().includes(q) || 
             p.student_roll.toLowerCase().includes(q) || 
             p.destination.toLowerCase().includes(q);
    }
    return true;
  });

  // Metrics
  const pendingCount = outpasses.filter(p => p.status === 'Pending').length;
  const approvedCount = outpasses.filter(p => p.status === 'Approved').length;
  const activeCount = outpasses.filter(p => p.status === 'Exited').length;
  const overdueCount = outpasses.filter(p => p.status === 'Overdue').length;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Campus Services' },
          { label: 'Hostel Outpass & Movement', active: true }
        ]}
        title="Hostel Outpass System"
        description="Digital leave authorization, parent contact verification & security gate movement logs"
        badge={isWarden ? 'Warden Command' : 'Hostel Resident'}
        actions={
          !isWarden && !isSecurity ? (
            <button
              type="button"
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Request Hostel Outpass</span>
            </button>
          ) : undefined
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Approvals"
          value={pendingCount}
          icon={Clock}
          badgeColor="amber"
          badge="Review"
          subtext="Awaiting Warden review"
        />
        <StatCard
          label="Approved Outpasses"
          value={approvedCount}
          icon={CheckCircle2}
          badgeColor="emerald"
          badge="Valid"
          subtext="Ready for Gate Verification"
        />
        <StatCard
          label="Currently Outside"
          value={activeCount}
          icon={MapPin}
          badgeColor="blue"
          badge="Logged"
          subtext="Exit logged at main gate"
        />
        <StatCard
          label="Overdue / Alerts"
          value={overdueCount}
          icon={AlertCircle}
          badgeColor="rose"
          badge={overdueCount > 0 ? "Alert" : "Zero"}
          subtext="Expected return time exceeded"
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, roll, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="all">All Outpass Statuses</option>
              <option value="Pending">Pending Warden</option>
              <option value="Approved">Approved</option>
              <option value="Exited">Active Outside</option>
              <option value="Returned">Returned / Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Outpasses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student Details</th>
                <th className="py-3 px-4">Hostel / Room</th>
                <th className="py-3 px-4">Destination & Reason</th>
                <th className="py-3 px-4">Departure & Return</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <Home className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No hostel outpass records found matching criteria
                  </td>
                </tr>
              ) : (
                filteredPasses.map(pass => (
                  <tr key={pass.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{pass.student_name}</div>
                      <div className="text-[11px] text-slate-500">Roll: {pass.student_roll} • {pass.branch || 'CSE'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{pass.hostel_block}</div>
                      <div className="text-[11px] text-slate-500">Room #{pass.room_number || pass.room_no}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 truncate" title={pass.destination}>{pass.destination}</div>
                      <div className="text-[11px] text-slate-500 truncate" title={pass.reason}>{pass.reason}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">Out: <span className="font-semibold">{pass.departure_date}</span> ({pass.departure_time || '16:00'})</div>
                      <div className="text-slate-500 text-[11px]">In: <span className="font-semibold">{pass.expected_return_date}</span> ({pass.expected_return_time || '20:00'})</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        pass.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        pass.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        pass.status === 'Exited' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        pass.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {pass.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {pass.status === 'Approved' && (
                          <button
                            type="button"
                            onClick={() => setSelectedPassForQR(pass)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View Pass</span>
                          </button>
                        )}
                        {isWarden && pass.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleWardenAction(pass.id, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] transition"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleWardenAction(pass.id, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-[11px] transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Outpass Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-[#0f2942]" />
                <h3 className="font-bold text-slate-900 text-base">Request Hostel Outpass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hostel Block</label>
                  <input
                    type="text"
                    required
                    value={formData.hostel_block}
                    onChange={(e) => setFormData(p => ({ ...p, hostel_block: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={formData.room_no}
                    onChange={(e) => setFormData(p => ({ ...p, room_no: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home Visit (Village, Tehsil, District)"
                  value={formData.destination}
                  onChange={(e) => setFormData(p => ({ ...p, destination: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departure Date & Time</label>
                  <input
                    type="date"
                    required
                    value={formData.departure_date}
                    onChange={(e) => setFormData(p => ({ ...p, departure_date: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 mb-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                  <input
                    type="time"
                    required
                    value={formData.departure_time}
                    onChange={(e) => setFormData(p => ({ ...p, departure_time: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Return Date & Time</label>
                  <input
                    type="date"
                    required
                    value={formData.expected_return_date}
                    onChange={(e) => setFormData(p => ({ ...p, expected_return_date: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 mb-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                  <input
                    type="time"
                    required
                    value={formData.expected_return_time}
                    onChange={(e) => setFormData(p => ({ ...p, expected_return_time: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.parent_contact}
                    onChange={(e) => setFormData(p => ({ ...p, parent_contact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(p => ({ ...p, emergency_contact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Leave</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Specify academic or personal necessity..."
                  value={formData.reason}
                  onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition shadow-xs"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Pass Verification Modal */}
      {selectedPassForQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPassForQR(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Hostel Gate Movement Pass</h3>
              <p className="text-xs text-slate-500">HIET Institutional Security Verification</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center gap-2">
              <div className="w-36 h-36 bg-white border border-slate-300 rounded-lg flex items-center justify-center font-mono text-xs shadow-inner">
                <QrCode className="w-28 h-28 text-slate-800" />
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {selectedPassForQR.qr_token}
              </span>
            </div>

            <div className="text-xs text-left space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Student:</span>
                <span className="font-bold text-slate-900">{selectedPassForQR.student_name} ({selectedPassForQR.student_roll})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Destination:</span>
                <span className="font-bold text-slate-900 truncate max-w-[150px]">{selectedPassForQR.destination}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Approved by:</span>
                <span className="font-bold text-emerald-700">{selectedPassForQR.warden_name || 'Hostel Warden'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPassForQR(null)}
              className="w-full py-2 rounded-xl bg-[#0f2942] text-white text-xs font-bold hover:bg-[#0a1c2e] transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
