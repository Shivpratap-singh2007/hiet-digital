import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Send, 
  FileText, 
  Info, 
  DollarSign, 
  CreditCard,
  Building,
  Check,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { StudentFine, FineAppeal } from '../../types';

export const StudentFinesView: React.FC = () => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || 'CSE001';

  const [fines, setFines] = useState<StudentFine[]>(() =>
    dataStore.getStudentFines().filter(f => f.student_roll.toUpperCase() === currentRoll.toUpperCase())
  );

  const [appeals, setAppeals] = useState<FineAppeal[]>(() =>
    dataStore.getFineAppeals().filter(a => a.student_roll.toUpperCase() === currentRoll.toUpperCase())
  );

  React.useEffect(() => {
    let isMounted = true;
    async function loadFines() {
      try {
        const [liveFines, liveAppeals] = await Promise.all([
          apiService.getStudentFines(user?.student_id),
          apiService.getFineAppeals(undefined, user?.student_id)
        ]);
        if (isMounted) {
          if (liveFines && liveFines.length > 0) setFines(liveFines.filter(f => f.student_roll.toUpperCase() === currentRoll.toUpperCase()));
          if (liveAppeals && liveAppeals.length > 0) setAppeals(liveAppeals.filter(a => a.student_roll.toUpperCase() === currentRoll.toUpperCase()));
        }
      } catch (err) {
        console.warn('Error loading live fines:', err);
      }
    }
    loadFines();
    return () => { isMounted = false; };
  }, [user?.student_id, currentRoll]);

  // Dispute Modal State
  const [selectedFineForDispute, setSelectedFineForDispute] = useState<StudentFine | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  const totalOutstanding = fines
    .filter(f => f.status === 'Issued' || f.status === 'Under_Dispute')
    .reduce((sum, f) => sum + f.amount, 0);

  const handleOpenDispute = (fine: StudentFine) => {
    setSelectedFineForDispute(fine);
    setAppealReason('');
    setDisputeSuccess(false);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFineForDispute || !appealReason.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Create Fine Appeal Record via apiService
      const newAppeal = await apiService.submitFineAppeal({
        fine_id: selectedFineForDispute.id,
        student_id: selectedFineForDispute.student_id,
        student_roll: selectedFineForDispute.student_roll,
        student_name: selectedFineForDispute.student_name,
        appeal_reason: appealReason
      });

      setAppeals([newAppeal, ...appeals]);

      // 2. Update Fine status to 'Under_Dispute'
      await apiService.updateStudentFineStatus(selectedFineForDispute.id, 'Under_Dispute');

      const allFines = dataStore.getStudentFines();
      const updatedFines = allFines.map(f => {
        if (f.id === selectedFineForDispute.id) {
          return { ...f, status: 'Under_Dispute' as const, updated_at: new Date().toISOString() };
        }
        return f;
      });
      dataStore.setStudentFines(updatedFines);
      setFines(updatedFines.filter(f => f.student_roll.toUpperCase() === currentRoll.toUpperCase()));

      setDisputeSuccess(true);
      setTimeout(() => {
        setSelectedFineForDispute(null);
        setDisputeSuccess(false);
      }, 1500);
    } catch (err) {
      console.warn('Error submitting fine appeal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Feature 5: Configurable Fine & Dispute System</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Fines, Dues & Appeals
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Inspect assessed college dues, track payment references, or file formal grievance appeals for HOD/Admin review.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-right shrink-0">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              Total Outstanding Dues
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              ₹{totalOutstanding}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Gateway Guardrail Advisory */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
        <div className="font-bold flex items-center gap-1.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>College Dues & Payment Settlement Notice</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          In compliance with state higher education finance regulations, online card debiting is withheld until institutional merchant credentials are activated. To settle legitimate dues, visit the <strong>HIET Accounts Office (Block A, Room 102)</strong> with your Student Roll Number to obtain an official bank challan receipt.
        </p>
      </div>

      {/* Fines List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assessed Dues & Fine Records</h3>
            <p className="text-xs text-slate-500">Record history of library, lab, and administrative assessments</p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {fines.length} records
          </span>
        </div>

        {fines.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span className="font-bold text-slate-700">No Fines or Outstanding Dues!</span>
            <span>Your student academic record is in full good standing.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {fines.map((fine) => {
              const hasPendingAppeal = appeals.some(a => a.fine_id === fine.id && a.status === 'Pending');
              return (
                <div 
                  key={fine.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition bg-white space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {fine.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Due Date: {fine.due_date}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {fine.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 max-w-xl">
                        {fine.reason}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Assessed by: {fine.issued_by_name} • Date: {new Date(fine.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                      <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        ₹{fine.amount}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        fine.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : fine.status === 'Waived'
                          ? 'bg-blue-100 text-blue-800'
                          : fine.status === 'Under_Dispute'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {fine.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Payment or Dispute Details */}
                  {fine.status === 'Paid' && fine.payment_ref && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] flex items-center justify-between">
                      <span className="font-semibold">Settled via Accounts Challan</span>
                      <span className="font-mono font-bold">{fine.payment_ref}</span>
                    </div>
                  )}

                  {fine.status === 'Waived' && fine.waiver_reason && (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-[11px]">
                      <span className="font-semibold block">Fine Formally Waived by Administration</span>
                      <span className="italic">{fine.waiver_reason}</span>
                    </div>
                  )}

                  {/* Dispute Action Button */}
                  {(fine.status === 'Issued' || fine.status === 'Under_Dispute') && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {fine.status === 'Under_Dispute' ? (
                        <span className="text-amber-700 text-xs font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Appeal is currently under review by Department HOD
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenDispute(fine)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition inline-flex items-center gap-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Dispute or Appeal Fine</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {selectedFineForDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Submit Formal Fine Dispute
              </h3>
              <button
                onClick={() => setSelectedFineForDispute(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Disputing Item</span>
              <p className="font-bold text-slate-800">{selectedFineForDispute.title}</p>
              <p className="text-slate-600">Assessed: ₹{selectedFineForDispute.amount} • {selectedFineForDispute.category}</p>
            </div>

            {disputeSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <span className="font-extrabold block">Appeal Submitted Successfully!</span>
                <p>Status changed to &lsquo;Under Dispute&rsquo;. Your department HOD will review your statement.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDispute} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Justification / Reason for Appeal *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Explain clearly why this fee should be waived or revised (e.g. library was closed on due date, equipment malfunction, medical leave)..."
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFineForDispute(null)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                  >
                    {isSubmitting ? 'Filing Appeal...' : 'Submit to HOD'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
