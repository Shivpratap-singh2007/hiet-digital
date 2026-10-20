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
  UserCheck,
  AlertTriangle,
  Lock,
  Building2,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { HostelOutpass, StudentMaster } from '../../types';
import { isStudentHosteler } from '../../lib/utils';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { verifyHostelAllocation, isGirlsHostel, isBoysHostel } from '../../lib/hostelValidation';

interface Props {
  onNavigateTab?: (tab: any) => void;
}

export const HostelOutpassView: React.FC<Props> = ({ onNavigateTab }) => {
  const { user, role } = useAuth();
  const isWarden = role === 'warden' || role === 'principal' || role === 'admin';
  const isSecurity = role === 'security_guard' || role === 'security';
  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || (user as any)?.identifier || 'HIET-CSE-2026-001';
  const isHosteler = isStudentHosteler(student);

  const [outpasses, setOutpasses] = useState<HostelOutpass[]>(() => dataStore.getHostelOutpasses());
  const [allStudents, setAllStudents] = useState<StudentMaster[]>(() => dataStore.getStudentsMaster());
  const [isLoading, setIsLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedPassForQR, setSelectedPassForQR] = useState<HostelOutpass | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hostelFilter, setHostelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Authoritative student hostel allocations
  const authoritativeHostel = student?.hostel_name || student?.hostel_code || '';
  const authoritativeRoom = student?.room_no || '';

  // Form state initialized strictly from authoritative student records
  const [formData, setFormData] = useState({
    hostel_block: authoritativeHostel,
    room_no: authoritativeRoom,
    destination: '',
    reason: '',
    departure_date: new Date().toISOString().slice(0, 10),
    departure_time: '16:00',
    expected_return_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    expected_return_time: '20:00',
    parent_contact: student?.parent_phone || '+91 98165 55000',
    emergency_contact: student?.phone || '+91 98160 44000'
  });

  // Re-sync form data if student authentication context updates
  useEffect(() => {
    if (student) {
      setFormData(prev => ({
        ...prev,
        hostel_block: student.hostel_name || student.hostel_code || prev.hostel_block,
        room_no: student.room_no || prev.room_no,
        parent_contact: student.parent_phone || prev.parent_contact,
        emergency_contact: student.phone || prev.emergency_contact
      }));
    }
  }, [student]);

  // Load live outpasses and student master directory
  const loadData = async () => {
    setIsLoading(true);
    try {
      const livePasses = await apiService.getHostelOutpasses();
      if (livePasses && livePasses.length > 0) {
        setOutpasses(livePasses);
      } else {
        setOutpasses(dataStore.getHostelOutpasses());
      }
      setAllStudents(dataStore.getStudentsMaster());
    } catch (e) {
      console.warn('Hostel outpass load warning:', e);
      setOutpasses(dataStore.getHostelOutpasses());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-outpass-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-outpass-updated', handleSync);
    };
  }, []);

  // If accessed by a Day Scholar student, show clear institutional guidance
  if (role === 'student' && !isHosteler) {
    return (
      <div className="p-8 sm:p-12 max-w-xl mx-auto my-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xs space-y-5 animate-fade-in font-sans">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/60">
          <Home className="w-8 h-8 text-blue-600 dark:text-sky-400" />
        </div>
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Day Scholar Account
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Outpass Not Required
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            You are enrolled as a <strong>Day Scholar</strong> at HIET. Overnight and weekend hostel outpass clearances are specifically maintained for on-campus residential students.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Need to leave campus during academic hours?</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            For academic, medical, or official transit during college hours, please utilize the <strong>Digital Gate Pass</strong> module.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onNavigateTab) {
              onNavigateTab('gate_pass');
            } else if (typeof window !== 'undefined') {
              window.history.pushState(null, '', '/app/gate-pass');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#1a3d60] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>Open Digital Gate Pass</span>
        </button>
      </div>
    );
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);

    try {
      const studentMaster = allStudents.find(s => 
        (user?.student_id && s.id === user.student_id) || 
        (s.roll_no && s.roll_no.toUpperCase() === currentRoll.toUpperCase())
      ) || student;

      const verification = verifyHostelAllocation(studentMaster, formData.hostel_block, formData.room_no);

      if (!verification.isValid && verification.status === 'gender_mismatch') {
        setApplyError(verification.warning || 'Gender and hostel allocation mismatch detected.');
        return;
      }
      if (verification.status === 'day_scholar') {
        setApplyError('Day Scholars are not eligible for residential hostel outpasses.');
        return;
      }
      if (verification.status === 'not_assigned' && !formData.hostel_block) {
        setApplyError('You must have an assigned hostel block to request an outpass. Please contact the Hostel Administration.');
        return;
      }

      await apiService.createHostelOutpass({
        student_id: user?.student_id || student?.id || 'std-demo-1',
        student_name: student?.name || user?.name || 'Student',
        student_roll: currentRoll,
        branch: student?.branch || 'CSE',
        room_no: formData.room_no,
        room_number: formData.room_no,
        hostel_block: verification.isValid ? verification.displayHostel : formData.hostel_block,
        destination: formData.destination,
        departure_date: formData.departure_date,
        departure_time: formData.departure_time,
        expected_return_date: formData.expected_return_date,
        expected_return_time: formData.expected_return_time,
        parent_contact: formData.parent_contact,
        emergency_contact: formData.emergency_contact,
        reason: formData.reason,
        status: 'Pending',
        qr_token: `OUTPASS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      });

      setShowApplyModal(false);
      await loadData();
    } catch (err: any) {
      setApplyError(err?.message || 'Failed to submit outpass request');
    }
  };

  const handleWardenAction = async (id: string, action: 'Approved' | 'Rejected') => {
    const remarks = action === 'Approved' ? 'Approved by Hostel Warden' : 'Request declined by Warden';
    await apiService.updateHostelOutpassStatus(id, action, remarks, user?.name || 'Hostel Warden');
    await loadData();
  };

  // Filtered list
  const filteredPasses = outpasses.filter(p => {
    if (!isWarden && !isSecurity && p.student_roll.toUpperCase() !== currentRoll.toUpperCase()) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    
    // Hostel Block Filter
    if (hostelFilter === 'girls' && !isGirlsHostel(p.hostel_block)) return false;
    if (hostelFilter === 'boys' && !isBoysHostel(p.hostel_block)) return false;
    if (hostelFilter === 'flagged') {
      const studentMaster = allStudents.find(s => 
        (p.student_id && s.id === p.student_id) || 
        (p.student_roll && s.roll_no.toUpperCase() === p.student_roll.toUpperCase())
      );
      const v = verifyHostelAllocation(studentMaster, p.hostel_block, p.room_number || p.room_no);
      if (v.status !== 'gender_mismatch' && v.status !== 'not_assigned') return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.student_name.toLowerCase().includes(q) || 
             p.student_roll.toLowerCase().includes(q) || 
             p.destination.toLowerCase().includes(q) ||
             p.hostel_block.toLowerCase().includes(q);
    }
    return true;
  });

  // Metrics
  const pendingCount = outpasses.filter(p => p.status === 'Pending').length;
  const approvedCount = outpasses.filter(p => p.status === 'Approved').length;
  const activeCount = outpasses.filter(p => p.status === 'Exited').length;
  const overdueCount = outpasses.filter(p => p.status === 'Overdue').length;

  return (
    <div className="space-y-6 font-sans w-full max-w-full overflow-hidden">
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
              onClick={() => {
                setApplyError(null);
                setShowApplyModal(true);
              }}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
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
          label="Overdue / Curfew Alerts"
          value={overdueCount}
          icon={AlertCircle}
          badgeColor="rose"
          badge={overdueCount > 0 ? "Alert" : "Curfew Normal"}
          subtext="Expected return time exceeded"
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, roll, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="all">All Outpass Statuses</option>
              <option value="Pending">Pending Warden</option>
              <option value="Approved">Approved</option>
              <option value="Exited">Active Outside</option>
              <option value="Returned">Returned / Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Hostel Wing Filter */}
            {(isWarden || isSecurity) && (
              <select
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
              >
                <option value="all">All Hostel Wings</option>
                <option value="girls">Girls Hostel (Block A)</option>
                <option value="boys">Boys Hostel (Block B)</option>
                <option value="flagged">⚠️ Integrity Check Flagged</option>
              </select>
            )}
          </div>
        </div>

        {/* Desktop Outpasses Table */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 min-w-[170px] whitespace-nowrap">Student Details</th>
                <th className="py-3 px-4 min-w-[160px]">Assigned Hostel & Room</th>
                <th className="py-3 px-4 min-w-[160px]">Destination & Reason</th>
                <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">Departure & Return</th>
                <th className="py-3 px-4 min-w-[110px] whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right min-w-[120px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <Home className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No hostel outpass records found matching criteria
                  </td>
                </tr>
              ) : (
                filteredPasses.map(pass => {
                  const studentMaster = allStudents.find(s => 
                    (pass.student_id && s.id === pass.student_id) || 
                    (pass.student_roll && s.roll_no.toUpperCase() === pass.student_roll.toUpperCase())
                  );

                  const verification = verifyHostelAllocation(
                    studentMaster,
                    pass.hostel_block,
                    pass.room_number || pass.room_no
                  );

                  const isMismatched = verification.status === 'gender_mismatch';
                  const isUnverified = verification.status === 'unverified';
                  const isNotAssigned = verification.status === 'not_assigned';

                  return (
                    <tr 
                      key={pass.id} 
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition ${
                        isMismatched ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      {/* 1. Student Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{pass.student_name}</span>
                          {studentMaster?.gender && (
                            <span 
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                studentMaster.gender.toLowerCase() === 'female'
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-sky-300 border border-blue-200 dark:border-blue-800'
                              }`}
                            >
                              {studentMaster.gender}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Roll: <span className="font-mono font-semibold">{pass.student_roll}</span>
                          <span className="mx-1.5">•</span>
                          {studentMaster?.department || pass.branch || 'CSE'}
                        </div>
                      </td>

                      {/* 2. Assigned Hostel & Room */}
                      <td className="py-3 px-4">
                        {isMismatched ? (
                          <div className="space-y-1">
                            <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{pass.hostel_block}</span>
                            </div>
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                              Room #{pass.room_number || pass.room_no || 'N/A'}
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              ⚠️ Allocation Inconsistent
                            </div>
                            {(isWarden || isSecurity) && verification.warning && (
                              <div className="text-[10px] text-rose-700 dark:text-rose-300 leading-tight">
                                {verification.warning}
                              </div>
                            )}
                          </div>
                        ) : isNotAssigned ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                              <AlertCircle className="w-3 h-3" />
                              Not Assigned
                            </span>
                            <div className="text-[10px] text-slate-400">Office Allocation Pending</div>
                          </div>
                        ) : isUnverified ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Verification Required
                            </span>
                            <div className="text-[10px] text-slate-400">Unmapped Record</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{verification.displayHostel}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              Room #{verification.displayRoom}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 3. Destination & Reason */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={pass.destination}>
                          {pass.destination}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={pass.reason}>
                          {pass.reason}
                        </div>
                      </td>

                      {/* 4. Departure & Return */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          Out: <span className="font-semibold">{pass.departure_date}</span> ({pass.departure_time || '16:00'})
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          In: <span className="font-semibold">{pass.expected_return_date}</span> ({pass.expected_return_time || '20:00'})
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          pass.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                          pass.status === 'Pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                          pass.status === 'Exited' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-sky-400 border border-blue-200 dark:border-blue-800' :
                          pass.status === 'Overdue' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {pass.status}
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {pass.status === 'Approved' && (
                            <button
                              type="button"
                              onClick={() => setSelectedPassForQR(pass)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
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
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWardenAction(pass.id, 'Rejected')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-bold text-[11px] transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Outpasses Cards (320px - 768px) */}
        <div className="md:hidden space-y-3 p-3">
          {filteredPasses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Home className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No hostel outpass records found matching criteria
            </div>
          ) : (
            filteredPasses.map(pass => {
              const studentMaster = allStudents.find(s => 
                (pass.student_id && s.id === pass.student_id) || 
                (pass.student_roll && s.roll_no.toUpperCase() === pass.student_roll.toUpperCase())
              );

              const verification = verifyHostelAllocation(
                studentMaster,
                pass.hostel_block,
                pass.room_number || pass.room_no
              );

              const isMismatched = verification.status === 'gender_mismatch';

              return (
                <div
                  key={pass.id}
                  className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-xs space-y-3 ${
                    isMismatched ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>{pass.student_name}</span>
                        {studentMaster?.gender && (
                          <span 
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              studentMaster.gender.toLowerCase() === 'female'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-sky-300 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {studentMaster.gender}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        Roll: {pass.student_roll} • {studentMaster?.department || pass.branch || 'CSE'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                      pass.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200' :
                      pass.status === 'Pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200' :
                      pass.status === 'Exited' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-sky-400 border border-blue-200' :
                      pass.status === 'Overdue' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {pass.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Hostel & Room</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{verification.displayHostel}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">Room #{verification.displayRoom}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Out / Return</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium block text-[11px]">{pass.departure_date}</span>
                      <span className="text-slate-500 text-[10px] block">to {pass.expected_return_date}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-50 dark:border-slate-800/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination & Reason</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{pass.destination}</p>
                      <p className="text-slate-500 text-xs line-clamp-2 mt-0.5">{pass.reason}</p>
                    </div>
                  </div>

                  {(pass.status === 'Approved' || (isWarden && pass.status === 'Pending')) && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {pass.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={() => setSelectedPassForQR(pass)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View Pass QR</span>
                        </button>
                      )}
                      {isWarden && pass.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleWardenAction(pass.id, 'Approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWardenAction(pass.id, 'Rejected')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Apply Outpass Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-[#0f2942] dark:text-sky-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Request Hostel Outpass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applyError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{applyError}</span>
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-3.5 text-xs">
              {/* Institutional Hostel & Room (Locked to Authoritative Master Record) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Hostel Block</span>
                    {authoritativeHostel && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={Boolean(authoritativeHostel)}
                    value={formData.hostel_block}
                    onChange={(e) => setFormData(p => ({ ...p, hostel_block: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f2942] ${
                      authoritativeHostel ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold cursor-not-allowed' : 'dark:bg-slate-800 dark:text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Room Number</span>
                    {authoritativeRoom && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={Boolean(authoritativeRoom)}
                    value={formData.room_no}
                    onChange={(e) => setFormData(p => ({ ...p, room_no: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f2942] ${
                      authoritativeRoom ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold cursor-not-allowed' : 'dark:bg-slate-800 dark:text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Destination Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home Visit (Village, Tehsil, District)"
                  value={formData.destination}
                  onChange={(e) => setFormData(p => ({ ...p, destination: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Departure Date & Time</label>
                  <input
                    type="date"
                    required
                    value={formData.departure_date}
                    onChange={(e) => setFormData(p => ({ ...p, departure_date: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white mb-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                  <input
                    type="time"
                    required
                    value={formData.departure_time}
                    onChange={(e) => setFormData(p => ({ ...p, departure_time: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Return Date & Time</label>
                  <input
                    type="date"
                    required
                    value={formData.expected_return_date}
                    onChange={(e) => setFormData(p => ({ ...p, expected_return_date: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white mb-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                  <input
                    type="time"
                    required
                    value={formData.expected_return_time}
                    onChange={(e) => setFormData(p => ({ ...p, expected_return_time: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Parent Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.parent_contact}
                    onChange={(e) => setFormData(p => ({ ...p, parent_contact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(p => ({ ...p, emergency_contact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Leave</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Specify academic or personal necessity..."
                  value={formData.reason}
                  onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold transition shadow-xs cursor-pointer active:scale-95"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPassForQR(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Hostel Gate Movement Pass</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">HIET Institutional Security Verification</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
              <div className="w-36 h-36 bg-white border border-slate-300 rounded-lg flex items-center justify-center font-mono text-xs shadow-inner">
                <QrCode className="w-28 h-28 text-slate-800" />
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {selectedPassForQR.qr_token}
              </span>
            </div>

            <div className="text-xs text-left space-y-1.5 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPassForQR.student_name} ({selectedPassForQR.student_roll})</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Assigned Hostel:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPassForQR.hostel_block} (Rm #{selectedPassForQR.room_number || selectedPassForQR.room_no})</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Destination:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{selectedPassForQR.destination}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Approved by:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedPassForQR.warden_name || 'Hostel Warden'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPassForQR(null)}
              className="w-full py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
