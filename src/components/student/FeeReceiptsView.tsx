import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  Building,
  ShieldCheck,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { campusLifeStore } from '../../lib/campusLifeData';
import { StudentFeeRecord } from '../../types';

interface Props {
  onNavigate?: (tab: any) => void;
}

export const FeeReceiptsView: React.FC<Props> = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const student = user?.studentMaster;
  const studentRoll = student?.roll_no || '26CSE001';
  const studentName = student?.name || user?.name || 'Aarav Sharma';

  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>(() =>
    campusLifeStore.getFeeRecords(studentRoll)
  );

  const [selectedReceipt, setSelectedReceipt] = useState<StudentFeeRecord | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('25000');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Netbanking' | 'Card'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPaid = feeRecords.reduce((acc, r) => acc + r.paid_amount, 0);
  const totalDue = feeRecords.reduce((acc, r) => acc + r.due_amount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      error('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newRecord: StudentFeeRecord = {
        id: `fee-rec-${Date.now()}`,
        receipt_no: `HIET/REC/2026-27/${Math.floor(1000 + Math.random() * 9000)}`,
        student_id: user?.id || 'std-active',
        student_roll: studentRoll,
        student_name: studentName,
        semester: (student?.semester || 6),
        academic_year: '2025-2026',
        total_amount: amt,
        paid_amount: amt,
        due_amount: 0,
        payment_status: 'paid',
        payment_mode: paymentMode,
        transaction_ref: `UPI/${Date.now().toString().slice(-8)}/HIET`,
        payment_date: new Date().toISOString().split('T')[0],
        breakdown: [
          { head: 'Tuition Fee Advance', amount: Math.round(amt * 0.7) },
          { head: 'Examination & University Dues', amount: Math.round(amt * 0.15) },
          { head: 'Lab & Infrastructure Maintenance', amount: Math.round(amt * 0.15) }
        ],
        created_at: new Date().toISOString()
      };

      campusLifeStore.addFeePayment(newRecord);
      setFeeRecords(campusLifeStore.getFeeRecords(studentRoll));
      setIsProcessing(false);
      setShowPayModal(false);
      setSelectedReceipt(newRecord);
      success('Payment Verified', `Fee receipt ${newRecord.receipt_no} generated successfully.`);
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Institutional Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <Receipt className="w-3 h-3 text-blue-600" />
              <span>Accounts Desk • Institutional Fee Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Fee Receipts & Accounts Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Official HPTU semester fee history, downloadable authenticated receipts with college seal, and online payment desk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPayModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Fees Online</span>
            </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Fees Paid</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">₹{totalPaid.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>All past semesters cleared</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Current Outstanding Dues</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {totalDue > 0 ? `₹${totalDue.toLocaleString('en-IN')}` : '₹0 (Nil)'}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
              No pending dues on Accounts Desk
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">University Examination Eligibility</div>
            <div className="text-sm font-black text-emerald-700 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Accounts Clearance Approved</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Eligible for HPTU Admit Card generation
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official Fee Receipts Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#0f2942]" />
            <span>Official Receipt Records</span>
          </h2>
          <span className="text-xs text-slate-500">{feeRecords.length} Authenticated Receipts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-3 px-3.5">Receipt No</th>
                <th className="py-3 px-3.5">Semester</th>
                <th className="py-3 px-3.5">Academic Year</th>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Amount</th>
                <th className="py-3 px-3.5">Mode & Ref</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feeRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">
                    {record.receipt_no}
                  </td>
                  <td className="py-3.5 px-3.5 font-semibold text-slate-700">
                    Sem {record.semester}
                  </td>
                  <td className="py-3.5 px-3.5 text-slate-600 font-mono">
                    {record.academic_year}
                  </td>
                  <td className="py-3.5 px-3.5 text-slate-600">
                    {record.payment_date || record.created_at.split('T')[0]}
                  </td>
                  <td className="py-3.5 px-3.5 font-bold text-slate-900">
                    ₹{record.paid_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3.5 text-slate-500 font-mono text-[11px]">
                    {record.payment_mode || 'Online'} • {record.transaction_ref || 'N/A'}
                  </td>
                  <td className="py-3.5 px-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Paid
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <button
                      onClick={() => setSelectedReceipt(record)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0f2942] text-slate-700 hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Official Printable Fee Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Institutional Fee Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div id="official-fee-receipt-paper" className="pt-4 space-y-4 text-slate-900">
              {/* College Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-[#0f2942] uppercase">
                  Himachal Institute of Engineering & Technology
                </h2>
                <p className="text-[11px] font-bold text-slate-600">
                  Vidya Nagar, Shahpur, Distt. Kangra (Himachal Pradesh) — 176206
                </p>
                <p className="text-[10px] text-slate-500">
                  Affiliated to HPTU Hamirpur & H.P. Takniki Shiksha Board • Approved by AICTE, New Delhi
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold uppercase tracking-wider">
                  Official Student Fee Receipt
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans">
                <div>
                  <span className="text-slate-500 font-semibold">Receipt No: </span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceipt.receipt_no}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold">Date of Payment: </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceipt.payment_date || selectedReceipt.created_at.split('T')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Student Name: </span>
                  <span className="font-bold text-slate-900">{selectedReceipt.student_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold">Roll Number: </span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceipt.student_roll}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Semester / Year: </span>
                  <span className="font-semibold text-slate-900">Semester {selectedReceipt.semester} ({selectedReceipt.academic_year})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold">Payment Mode: </span>
                  <span className="font-semibold text-slate-900">{selectedReceipt.payment_mode || 'Online UPI'}</span>
                </div>
              </div>

              {/* Itemized Heads Table */}
              <table className="w-full text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-3 text-left">S.No.</th>
                    <th className="py-2 px-3 text-left">Particulars / Fee Head</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedReceipt.breakdown.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{item.head}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {item.amount.toLocaleString('en-IN')}.00
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                    <td colSpan={2} className="py-2.5 px-3 text-right uppercase">
                      Total Amount Received:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#0f2942]">
                      ₹{selectedReceipt.paid_amount.toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures & Seal */}
              <div className="pt-6 flex items-end justify-between text-xs">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-emerald-600 text-emerald-800 font-black text-[10px] uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>HIET ACCOUNTS DESK • VERIFIED</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Txn Ref: {selectedReceipt.transaction_ref}</p>
                </div>

                <div className="text-center space-y-1">
                  <div className="w-36 border-b border-slate-800 pb-8 text-[11px] font-bold text-slate-900">
                    Accounts Officer
                  </div>
                  <p className="text-[10px] text-slate-500">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Pay Fees Online Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Online Fee Payment Desk</h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Netbanking', 'Card'] as const).map(mode => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        paymentMode === mode
                          ? 'bg-[#0f2942] text-white border-[#0f2942]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-800">
                Instant computerized receipt with college seal will be generated immediately upon confirmation.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  {isProcessing ? 'Verifying Transaction...' : `Confirm & Pay ₹${Number(payAmount || 0).toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
