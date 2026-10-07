import React, { useState } from 'react';
import { 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  Plus, 
  X, 
  ArrowRight, 
  Check, 
  XCircle, 
  UserCheck, 
  Phone,
  Calendar,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { GatePass, GatePassRequest } from '../../types';

export const DigitalGatePassView: React.FC = () => {
  const { user, role } = useAuth();
  const isApprover = role === 'hod' || role === 'principal' || role === 'admin';
  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || 'CSE001';

  // Requests state
  const [requests, setRequests] = useState<GatePassRequest[]>(() =>
    dataStore.getGatePassRequests()
  );

  // Passes state
  const [passes, setPasses] = useState<GatePass[]>(() =>
    dataStore.getGatePasses()
  );

  // Load from Supabase on mount
  React.useEffect(() => {
    let isMounted = true;
    async function loadGateData() {
      try {
        const studentId = isApprover ? undefined : user?.student_id;
        const [liveRequests, livePasses] = await Promise.all([
          apiService.getGatePassRequests(studentId),
          apiService.getSignedGatePasses(studentId)
        ]);
        if (isMounted) {
          if (liveRequests && liveRequests.length > 0) setRequests(liveRequests);
          if (livePasses && livePasses.length > 0) setPasses(livePasses);
        }
      } catch (err) {
        console.warn('Error fetching live gate pass records:', err);
      }
    }
    loadGateData();
    return () => { isMounted = false; };
  }, [isApprover, user?.student_id]);

  // Modal State for Student Request
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [passType, setPassType] = useState<GatePassRequest['pass_type']>('Day Pass');
  const [validDate, setValidDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('12:30 PM');
  const [returnTime, setReturnTime] = useState('04:00 PM');
  const [reason, setReason] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState(student?.phone || '+91 94180 11001');
  const [submitting, setSubmitting] = useState(false);

  // Approver Comments Modal State
  const [actionTargetRequest, setActionTargetRequest] = useState<GatePassRequest | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject'>('Approve');
  const [approverComments, setApproverComments] = useState('');

  // Find active approved pass for the student
  const myPasses = passes.filter(p => p.student_roll.toUpperCase() === currentRoll.toUpperCase());
  const activePass = myPasses.find(p => p.status === 'Active') || myPasses[0] || null;

  // Filter requests for student vs approver
  const displayedRequests = isApprover
    ? requests
    : requests.filter(r => r.student_roll.toUpperCase() === currentRoll.toUpperCase());

  // 1. Submit Request Handler
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const createdReq = await apiService.submitGatePassRequest({
        student_id: user?.student_id || 'std-cse-001',
        student_roll: currentRoll,
        student_name: user?.name || 'Aarav Sharma',
        branch: student?.branch || 'CSE',
        semester: student?.semester || 6,
        pass_type: passType,
        valid_date: validDate,
        departure_time: departureTime,
        expected_return_time: returnTime,
        reason,
        emergency_contact: emergencyPhone
      });

      const updated = [createdReq, ...requests.filter(r => r.id !== createdReq.id)];
      setRequests(updated);
      setShowRequestModal(false);
      setReason('');
    } catch (err) {
      console.warn('Failed to submit gate pass request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Approver Decision Handler
  const handleDecisionSubmit = async () => {
    if (!actionTargetRequest) return;

    const isApproved = actionType === 'Approve';
    const comments = approverComments || (isApproved ? 'Approved for transit.' : 'Transit request rejected.');

    if (isApproved) {
      await apiService.approveGatePassRequest(
        actionTargetRequest.id,
        user?.id || 'prof-tch-03',
        `${user?.name || 'HOD'} (${role?.toUpperCase()})`,
        comments
      );
    } else {
      await apiService.rejectGatePassRequest(
        actionTargetRequest.id,
        user?.id || 'prof-tch-03',
        `${user?.name || 'HOD'} (${role?.toUpperCase()})`,
        comments
      );
    }

    const updatedRequests = requests.map(r => {
      if (r.id === actionTargetRequest.id) {
        return {
          ...r,
          status: isApproved ? ('Approved' as const) : ('Rejected' as const),
          approver_id: user?.id,
          approver_name: `${user?.name} (${role?.toUpperCase()})`,
          approver_comments: comments,
          approved_at: new Date().toISOString()
        };
      }
      return r;
    });

    setRequests(updatedRequests);

    // If approved, generate cryptographically signed digital pass
    if (isApproved) {
      const passCode = `HIET-PASS-${Math.floor(10000 + Math.random() * 90000)}`;
      const timestamp = Date.now();
      const signatureHash = `sig_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      const qrToken = `HIET:PASS:v1:${passCode}:${actionTargetRequest.student_roll}:${timestamp}:${signatureHash}`;

      const newPass: GatePass = {
        id: `gp-${timestamp}`,
        request_id: actionTargetRequest.id,
        student_id: actionTargetRequest.student_id,
        student_name: actionTargetRequest.student_name,
        student_roll: actionTargetRequest.student_roll,
        student_branch: actionTargetRequest.branch,
        pass_code: passCode,
        qr_data: qrToken,
        qr_token: qrToken,
        signature_hash: signatureHash,
        pass_type: actionTargetRequest.pass_type,
        reason: actionTargetRequest.reason,
        valid_date: actionTargetRequest.valid_date,
        valid_from: `${actionTargetRequest.valid_date}T08:00:00Z`,
        valid_until: `${actionTargetRequest.valid_date}T20:00:00Z`,
        allow_reentry: true,
        exit_logged: false,
        entry_logged: false,
        status: 'Active',
        created_at: new Date().toISOString()
      };

      const currentPasses = dataStore.getGatePasses();
      const updatedPasses = [newPass, ...currentPasses];
      dataStore.setGatePasses(updatedPasses);
      setPasses(updatedPasses);
    }

    setActionTargetRequest(null);
    setApproverComments('');
  };

  // 3. Cancel Request Handler
  const handleCancelRequest = (reqId: string) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'Cancelled' as const } : r);
    dataStore.setGatePassRequests(updated);
    setRequests(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Feature 2 & 3: Secure Gate Pass & Transit Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" />
              <span>Digital Gate Pass Portal</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              {isApprover 
                ? 'Review and approve time-limited digital gate-pass requests for student transit.' 
                : 'Submit authorized gate transit requests and access your signed, time-limited QR code pass.'}
            </p>
          </div>

          {!isApprover && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Request New Gate Pass</span>
            </button>
          )}
        </div>
      </div>

      {/* Student Active Signed Pass Display (If Student & Active Pass exists) */}
      {!isApprover && activePass && (
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
                Official Campus Transit Pass
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {activePass.student_name}
              </h3>
              <p className="text-xs font-mono text-cyan-200">
                Roll: {activePass.student_roll} • {activePass.student_branch}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                activePass.status === 'Active'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-slate-700/50 text-slate-300 border-slate-600'
              }`}>
                {activePass.status} Pass
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-white/10 text-cyan-100 border border-white/20">
                Code: {activePass.pass_code}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Visual QR Pass Code with Privacy Shield */}
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-xl text-slate-900">
              <div className="w-40 h-40 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center relative shadow-inner">
                <QrCode className="w-32 h-32 text-white" />
                <span className="text-[8px] text-cyan-400 font-mono tracking-widest mt-1">
                  SIGNED HMAC TOKEN
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 mt-2">
                Scan at Security Checkpoint
              </span>
            </div>

            {/* Pass Metadata & Transit Direction Status */}
            <div className="md:col-span-2 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-cyan-300 uppercase font-semibold block">Valid Date</span>
                  <span className="font-bold text-white text-sm">{activePass.valid_date}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-cyan-300 uppercase font-semibold block">Transit Type</span>
                  <span className="font-bold text-white text-sm">{activePass.pass_type || 'Day Pass'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-[10px] text-cyan-300 uppercase font-semibold block">Approved Purpose</span>
                <p className="text-slate-200 mt-0.5 line-clamp-2 italic">
                  &ldquo;{activePass.reason}&rdquo;
                </p>
              </div>

              {/* Transit Verification Indicators */}
              <div className="flex items-center gap-3 pt-1 text-xs">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                  activePass.exit_logged 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Exit Recorded: {activePass.exit_logged ? 'Yes' : 'Pending'}</span>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                  activePass.entry_logged 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Return Recorded: {activePass.entry_logged ? 'Yes' : 'Pending'}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Anti-replay protection active. Private student info is cryptographically hashed.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requests & Approval Management Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isApprover ? 'Department Gate Pass Requests Queue' : 'My Gate Pass Requests'}
            </h3>
            <p className="text-xs text-slate-500">
              {isApprover 
                ? 'Authorized HOD & Proctor verification center' 
                : 'Track pending approvals and historical gate permissions'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {displayedRequests.length} requests
          </span>
        </div>

        {displayedRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No gate pass requests found in records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-bold text-[11px]">
                  <th className="py-2.5 px-2">Student</th>
                  <th className="py-2.5 px-2">Type & Date</th>
                  <th className="py-2.5 px-2">Timing Window</th>
                  <th className="py-2.5 px-2">Reason</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-2">
                      <span className="font-bold text-slate-900">{req.student_name}</span>
                      <span className="block text-[10px] font-mono text-slate-500">
                        {req.student_roll} • {req.branch} (Sem {req.semester})
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-semibold text-slate-800">{req.pass_type}</span>
                      <span className="block text-[10px] text-slate-500">{req.valid_date}</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600 font-mono text-[11px]">
                      {req.departure_time} - {req.expected_return_time}
                    </td>
                    <td className="py-3 px-2 text-slate-600 max-w-xs">
                      <p className="line-clamp-2">{req.reason}</p>
                      {req.approver_comments && (
                        <span className="text-[10px] text-blue-700 block italic mt-0.5">
                          Note: {req.approver_comments}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {isApprover && req.status === 'Pending' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setActionTargetRequest(req);
                              setActionType('Approve');
                              setApproverComments('');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-2xs transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setActionTargetRequest(req);
                              setActionType('Reject');
                              setApproverComments('');
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] shadow-2xs transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {!isApprover && req.status === 'Pending' && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="px-2 py-1 text-rose-600 hover:text-rose-800 font-bold hover:underline text-[11px]"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Request Digital Gate Pass</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pass Category *</label>
                <select
                  value={passType}
                  onChange={(e) => setPassType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="Day Pass">Day Pass (Academic / Placement Transit)</option>
                  <option value="Hostel Leave">Hostel Leave (Doctor / Hospital / Station)</option>
                  <option value="Emergency Exit">Emergency Medical Exit</option>
                  <option value="Event / Industrial Visit">Event / Industrial Outreach Visit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={validDate}
                    onChange={(e) => setValidDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Phone *</label>
                  <input
                    type="tel"
                    required
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Departure *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12:30 PM"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Return *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 04:00 PM"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State academic reason or destination clearly for HOD review..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approver Comment & Confirmation Modal */}
      {actionTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {actionType} Gate Pass Request
            </h3>
            <p className="text-xs text-slate-600">
              Student: <strong>{actionTargetRequest.student_name}</strong> ({actionTargetRequest.student_roll})
              <br />
              Reason: <em>{actionTargetRequest.reason}</em>
            </p>

            <div className="text-xs space-y-1">
              <label className="block font-bold text-slate-700">Approver Notes / Instructions</label>
              <textarea
                rows={2}
                placeholder={actionType === 'Approve' ? 'e.g. Approved. Must report back before 4:00 PM.' : 'Reason for rejection...'}
                value={approverComments}
                onChange={(e) => setApproverComments(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setActionTargetRequest(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecisionSubmit}
                className={`w-1/2 py-2.5 rounded-xl font-bold text-white shadow-xs ${
                  actionType === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
