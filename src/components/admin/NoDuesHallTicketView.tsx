import React, { useState } from 'react';
import { 
  FileCheck2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Printer, 
  QrCode, 
  AlertTriangle, 
  Search, 
  Building2, 
  BookOpen, 
  Cpu, 
  Trophy, 
  Home, 
  ExternalLink,
  ShieldCheck,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { NoDuesRecord, NoDuesClearance, HallTicket } from '../../types';

export const NoDuesHallTicketView: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'principal' || role === 'hod';
  const isStaff = role === 'library_staff' || role === 'lab_staff' || role === 'non_teaching' || role === 'warden';
  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || 'CSE001';

  // Sample Clearances
  const [clearances, setClearances] = useState<NoDuesClearance[]>([
    {
      id: 'c-1',
      record_id: 'rec-001',
      department_type: 'accounts',
      label: 'Accounts & Tuition Fee',
      status: 'Cleared',
      due_amount: 0,
      cleared_by_name: 'Accounts Section (Sh. Rakesh)',
      cleared_at: '2026-05-02',
      remarks: 'All tuition and examination fees verified'
    },
    {
      id: 'c-2',
      record_id: 'rec-001',
      department_type: 'library',
      label: 'Central Institutional Library',
      status: 'Cleared',
      due_amount: 0,
      cleared_by_name: 'Central Library (Ms. Pooja)',
      cleared_at: '2026-05-03',
      remarks: '0 books issued, no fines'
    },
    {
      id: 'c-3',
      record_id: 'rec-001',
      department_type: 'labs',
      label: 'Engineering Laboratories',
      status: 'Cleared',
      due_amount: 0,
      cleared_by_name: 'CSE Systems Lab (Mr. Manoj)',
      cleared_at: '2026-05-03',
      remarks: 'Lab equipment and hardware accounted for'
    },
    {
      id: 'c-4',
      record_id: 'rec-001',
      department_type: 'sports',
      label: 'Sports & Gymnasium Cell',
      status: 'Cleared',
      due_amount: 0,
      cleared_by_name: 'Sports Officer',
      cleared_at: '2026-05-04',
      remarks: 'Sports kit returned'
    },
    {
      id: 'c-5',
      record_id: 'rec-001',
      department_type: 'hostel',
      label: 'Hostel & Mess Administration',
      status: 'Cleared',
      due_amount: 0,
      cleared_by_name: 'Hostel Warden',
      cleared_at: '2026-05-04',
      remarks: 'Mess bill settled'
    }
  ]);

  const [hallTicket, setHallTicket] = useState<HallTicket | null>({
    id: 'ht-2026-001',
    student_id: user?.student_id || 'std-cse-001',
    student_name: student?.name || user?.name || 'Aarav Sharma',
    student_roll: currentRoll,
    branch: student?.branch || 'CSE',
    semester: student?.semester || 6,
    exam_session: 'End Semester Examination May-June 2026',
    verification_token: 'TEST-HT-2026-001',
    verification_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    qr_data: 'https://hiet.ac.in/verify/hall-ticket/TEST-HT-2026-001',
    issued_at: '2026-05-05T10:00:00Z',
    is_revoked: false,
    exam_subjects: [
      { code: 'CS-601', name: 'Data Structures & Algorithms', date: '2026-05-18', session: 'Morning' },
      { code: 'CS-602', name: 'Database Management Systems', date: '2026-05-21', session: 'Morning' },
      { code: 'CS-603', name: 'Operating Systems', date: '2026-05-24', session: 'Evening' },
      { code: 'CS-604', name: 'Computer Networks', date: '2026-05-28', session: 'Morning' }
    ]
  });

  const [showHallTicketModal, setShowHallTicketModal] = useState(false);

  // Check if all are cleared
  const allCleared = clearances.every(c => c.status === 'Cleared');
  const clearedCount = clearances.filter(c => c.status === 'Cleared').length;

  const handleUpdateStatus = (id: string, newStatus: 'Cleared' | 'Dues_Pending') => {
    setClearances(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: newStatus,
          cleared_by_name: user?.name || 'Authorized Staff',
          cleared_at: new Date().toISOString().slice(0, 10)
        };
      }
      return c;
    }));
  };

  const getDeptIcon = (dept: string) => {
    switch (dept) {
      case 'accounts': return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'library': return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case 'lab': return <Cpu className="w-5 h-5 text-purple-600" />;
      case 'sports': return <Trophy className="w-5 h-5 text-amber-600" />;
      case 'hostel': return <Home className="w-5 h-5 text-rose-600" />;
      default: return <FileCheck2 className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Academic & Administration' },
          { label: 'No-Dues & Digital Hall Ticket', active: true }
        ]}
        title="No-Dues & Digital Hall Ticket"
        description="Multi-department institutional clearance tracker & tamper-evident examination hall tickets"
        badge={isAdmin || isStaff ? 'Clearance Desk' : 'Student Clearance'}
        actions={
          allCleared && (
            <button
              type="button"
              onClick={() => setShowHallTicketModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>View & Print Hall Ticket</span>
            </button>
          )
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Clearance Status"
          value={allCleared ? '100% Cleared' : `${clearedCount}/5 Sections`}
          icon={FileCheck2}
          badgeColor={allCleared ? 'emerald' : 'amber'}
          badge={allCleared ? 'Eligible' : 'Pending'}
          subtext={allCleared ? 'Eligible for Examination' : 'Dues pending resolution'}
        />
        <StatCard
          label="Total Dues Amount"
          value="₹0.00"
          icon={Building2}
          badgeColor="blue"
          subtext="Institutional fee balance"
        />
        <StatCard
          label="Digital Hall Ticket"
          value={allCleared ? 'Issued' : 'Locked'}
          icon={ShieldCheck}
          badgeColor={allCleared ? 'emerald' : 'slate'}
          badge={allCleared ? 'Ready' : 'Locked'}
          subtext="Cryptographically sealed"
        />
        <StatCard
          label="Exam Session"
          value="May-June 2026"
          icon={Clock}
          badgeColor="blue"
          subtext="End Semester Examination"
        />
      </div>

      {/* Clearances Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Departmental Clearance Checklist</h3>
            <p className="text-[11px] text-slate-500">Every department must grant approval before Hall Ticket generation</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            allCleared ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {clearedCount} of 5 Cleared
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {clearances.map(c => (
            <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {getDeptIcon(c.department_type)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs capitalize flex items-center gap-2">
                    {c.label || `${c.department_type} Department`}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      c.status === 'Cleared' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {c.status}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {c.remarks} • Authenticated by <span className="font-semibold text-slate-700">{c.cleared_by_name || 'Department Staff'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {(c.due_amount || 0) > 0 && (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                    ₹{c.due_amount}
                  </span>
                )}
                {(isAdmin || isStaff) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(c.id, c.status === 'Cleared' ? 'Dues_Pending' : 'Cleared')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
                  >
                    {c.status === 'Cleared' ? 'Mark Pending' : 'Grant Clearance'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hall Ticket Preview / Modal */}
      {showHallTicketModal && hallTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header / Seal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0f2942] text-white flex items-center justify-center font-black text-xl shadow-inner">
                  H
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">HIMACHAL INSTITUTE OF ENGINEERING & TECHNOLOGY</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Digital Hall Ticket • End Semester Examination</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const { isSupabaseConfigured, supabase } = await import('../../lib/supabase');
                      if (isSupabaseConfigured && supabase) {
                        const { data } = await supabase.functions.invoke('generate-hall-ticket', {
                          body: { student_id: hallTicket.student_id, exam_session: hallTicket.exam_session }
                        });
                        if (data?.signed_url) {
                          window.open(data.signed_url, '_blank');
                          return;
                        }
                      }
                    } catch (err) {
                      console.warn('Direct PDF generator invocation notice:', err);
                    }
                    window.print();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-[#0f2942] text-white hover:bg-[#0a1c2e] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHallTicketModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Candidate & Verification Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate Name</span>
                <span className="font-bold text-slate-900">{hallTicket.student_name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll Number</span>
                <span className="font-bold text-slate-900">{hallTicket.student_roll}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Branch / Semester</span>
                <span className="font-bold text-slate-900">{hallTicket.branch} • Sem {hallTicket.semester}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Exam Center</span>
                <span className="font-bold text-slate-900">Main Academic Block, HIET</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Verification Token</span>
                <span className="font-mono text-emerald-700 font-bold">{hallTicket.verification_token}</span>
              </div>
            </div>

            {/* Subjects Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs mb-2">Permitted Subjects & Schedule</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Subject Title</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5 text-right">Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hallTicket.exam_subjects.map(s => (
                      <tr key={s.code}>
                        <td className="p-2.5 font-bold text-slate-900">{s.code}</td>
                        <td className="p-2.5 text-slate-800 font-medium">{s.name}</td>
                        <td className="p-2.5 text-slate-600">{s.date}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-700">{s.session} (09:30 AM)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Footer & QR */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-1 shadow-inner">
                  <QrCode className="w-16 h-16 text-slate-800" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Digitally Authenticated
                  </span>
                  <p className="text-[11px] text-slate-500">Scan QR to verify authentic exam record.</p>
                  <p className="text-[11px] text-slate-400 font-mono">Issued: {new Date(hallTicket.issued_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="font-serif italic font-bold text-slate-800 text-sm">Controller of Examinations</div>
                <p className="text-[10px] text-slate-400">HIET Institutional Autonomous Cell</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
