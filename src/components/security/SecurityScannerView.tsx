/* oxlint-disable react/immutability, react/purity */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  User, 
  MapPin, 
  RefreshCw, 
  Search, 
  Key,
  AlertCircle,
  ArrowRightLeft,
  Calendar,
  FileText
} from 'lucide-react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { GateScanLog, GatePass, StudentMaster } from '../../types';
import { PageHeader } from '../common/PageHeader';

export const SecurityScannerView: React.FC = () => {
  const { user } = useAuth();
  const guardName = user?.name || 'Hav. R. S. Katoch (Campus Security)';
  const guardId = user?.id || 'prof-security-01';

  // Scanner State
  const [scanDirection, setScanDirection] = useState<'Exit' | 'Entry'>('Exit');
  const [gateLocation, setGateLocation] = useState('Main Highway Gate 1');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'Valid' | 'Invalid_Signature' | 'Expired' | 'Already_Used' | 'Manual_Override' | 'Revoked';
    message: string;
    pass?: GatePass;
    student?: StudentMaster;
    scanLog?: GateScanLog;
  } | null>(null);

  // Manual Override Form State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualRollNo, setManualRollNo] = useState('');
  const [manualPassCode, setManualPassCode] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Scan Logs
  const [scanLogs, setScanLogs] = useState<GateScanLog[]>(() => dataStore.getGateScanLogs());

  // Fetch live logs from Supabase
  useEffect(() => {
    let isMounted = true;
    apiService.getGateScanLogs(50).then(logs => {
      if (isMounted && logs && logs.length > 0) setScanLogs(logs);
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, []);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Initialize html5-qrcode camera scanner
  useEffect(() => {
    if (!isScanning) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader-container',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        handleProcessQrCode(decodedText);
        // Temporarily pause scanner while showing result
        scanner.pause(true);
      },
      (error) => {
        // scan failure/searching - non-blocking
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isScanning, scanDirection, gateLocation]);

  // Core Backend Verification Algorithm
  const handleProcessQrCode = async (decodedText: string, isManual = false, overrideReason = '') => {
    // Expected format: HIET:PASS:v1:{passCode}:{rollNo}:{timestamp}:{signature}
    // Or plain pass_code for backwards compatibility
    const parts = decodedText.split(':');
    let passCodeToLookup = decodedText.trim();
    let rollToVerify = '';

    if (parts.length >= 4 && parts[0] === 'HIET' && parts[1] === 'PASS') {
      passCodeToLookup = parts[3];
      rollToVerify = parts[4] || '';
    } else if (parts[0] === 'HIET' && parts[1] === 'GATEPASS') {
      // Legacy format
      rollToVerify = parts[2] || '';
    }

    // Lookup pass in dataStore
    const passes = dataStore.getGatePasses();
    const pass = passes.find(p => 
      p.pass_code.toUpperCase() === passCodeToLookup.toUpperCase() ||
      (rollToVerify && p.student_roll.toUpperCase() === rollToVerify.toUpperCase() && p.status === 'Active')
    );

    const students = dataStore.getStudentsMaster();

    if (!pass) {
      const failedLog: GateScanLog = {
        id: `gsl-${Date.now()}`,
        student_roll: rollToVerify || 'UNKNOWN',
        student_name: 'Unknown Individual',
        branch: 'N/A',
        scan_direction: scanDirection,
        gate_location: gateLocation,
        verified_by_guard_id: guardId,
        guard_name: guardName,
        verification_status: 'Invalid_Signature',
        is_manual_override: isManual,
        manual_override_reason: overrideReason || 'Unrecognized QR token or invalid digital pass code.',
        scanned_at: new Date().toISOString()
      };
      dataStore.addGateScanLog(failedLog);
      setScanLogs(dataStore.getGateScanLogs());

      setScanResult({
        status: 'Invalid_Signature',
        message: 'Invalid Pass Token! No matching active gate pass record found in college database.',
        scanLog: failedLog
      });
      return;
    }

    const student = students.find(s => s.id === pass.student_id || s.roll_no === pass.student_roll);

    // 1. Expiry Check
    const now = new Date();
    const validUntil = pass.valid_until ? new Date(pass.valid_until) : new Date(`${pass.valid_date}T23:59:59`);
    const isExpired = now > validUntil || pass.status === 'Expired';

    if (isExpired && !isManual) {
      const expLog: GateScanLog = {
        id: `gsl-${Date.now()}`,
        pass_id: pass.id,
        student_id: pass.student_id,
        student_roll: pass.student_roll,
        student_name: pass.student_name,
        branch: pass.student_branch,
        scan_direction: scanDirection,
        gate_location: gateLocation,
        verified_by_guard_id: guardId,
        guard_name: guardName,
        verification_status: 'Expired',
        is_manual_override: false,
        scanned_at: new Date().toISOString()
      };
      dataStore.addGateScanLog(expLog);
      setScanLogs(dataStore.getGateScanLogs());

      setScanResult({
        status: 'Expired',
        message: `Pass Expired on ${validUntil.toLocaleTimeString()}! Student cannot transit without renewed HOD authorization.`,
        pass,
        student,
        scanLog: expLog
      });
      return;
    }

    // 2. Anti-Replay Check (Duplicate Exit or Duplicate Entry)
    if (scanDirection === 'Exit' && pass.exit_logged && !isManual) {
      const replayLog: GateScanLog = {
        id: `gsl-${Date.now()}`,
        pass_id: pass.id,
        student_id: pass.student_id,
        student_roll: pass.student_roll,
        student_name: pass.student_name,
        branch: pass.student_branch,
        scan_direction: scanDirection,
        gate_location: gateLocation,
        verified_by_guard_id: guardId,
        guard_name: guardName,
        verification_status: 'Already_Used',
        is_manual_override: false,
        manual_override_reason: 'Duplicate Exit attempt detected. Student already logged as exited.',
        scanned_at: new Date().toISOString()
      };
      dataStore.addGateScanLog(replayLog);
      setScanLogs(dataStore.getGateScanLogs());

      setScanResult({
        status: 'Already_Used',
        message: 'Anti-Replay Alert: This pass has ALREADY been used for campus exit! Re-use blocked.',
        pass,
        student,
        scanLog: replayLog
      });
      return;
    }

    // 3. Mark Valid Scan and update pass transit flags
    const updatedPass: GatePass = {
      ...pass,
      exit_logged: scanDirection === 'Exit' ? true : pass.exit_logged,
      entry_logged: scanDirection === 'Entry' ? true : pass.entry_logged,
      status: (scanDirection === 'Entry' && pass.exit_logged) ? 'Used' : pass.status
    };

    const currentPasses = dataStore.getGatePasses();
    dataStore.setGatePasses(currentPasses.map(p => p.id === pass.id ? updatedPass : p));

    const successLog: GateScanLog = {
      id: `gsl-${Date.now()}`,
      pass_id: pass.id,
      student_id: pass.student_id,
      student_roll: pass.student_roll,
      student_name: pass.student_name,
      branch: pass.student_branch,
      scan_direction: scanDirection,
      gate_location: gateLocation,
      verified_by_guard_id: guardId,
      guard_name: guardName,
      verification_status: isManual ? 'Manual_Override' : 'Valid',
      is_manual_override: isManual,
      manual_override_reason: overrideReason || undefined,
      scanned_at: new Date().toISOString()
    };
    apiService.recordGateScan(successLog).catch(console.warn);
    dataStore.addGateScanLog(successLog);
    setScanLogs(dataStore.getGateScanLogs());

    // Also update gate_entries store
    dataStore.setGateEntries([
      {
        id: `ge-${Date.now()}`,
        student_id: pass.student_id,
        student_roll: pass.student_roll,
        student_name: pass.student_name,
        student_branch: pass.student_branch,
        entry_time: scanDirection === 'Entry' ? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}` : 'N/A',
        exit_time: scanDirection === 'Exit' ? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}` : undefined,
        gate_location: gateLocation,
        security_officer: guardName,
        status: scanDirection === 'Entry' ? 'Inside Campus' : 'Exited'
      },
      ...dataStore.getGateEntries()
    ]);

    setScanResult({
      status: isManual ? 'Manual_Override' : 'Valid',
      message: `${scanDirection} Authorized: Verified student transit record created.`,
      pass: updatedPass,
      student,
      scanLog: successLog
    });
  };

  const handleResumeScanning = () => {
    setScanResult(null);
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (e) {
        setIsScanning(false);
        setTimeout(() => setIsScanning(true), 200);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    if (!manualRollNo.trim() || !manualReason.trim()) {
      setManualError('Both Student Roll Number and Mandatory Audit Reason are required.');
      return;
    }

    handleProcessQrCode(manualPassCode || manualRollNo, true, manualReason);
    setShowManualModal(false);
    setManualRollNo('');
    setManualPassCode('');
    setManualReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      <PageHeader
        breadcrumb={[
          { label: 'Security & Campus Safety' },
          { label: 'Gate Control' }
        ]}
        title="QR Entry & Exit Verification Scanner"
        subtitle={`Campus security console • Officer: ${guardName} • HIET Main Perimeter Gate`}
        badge={{
          label: 'Checkpoint Active',
          variant: 'success'
        }}
        actions={
          <button
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0f2942] border border-[#0f2942]/30 text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <Key className="w-4 h-4 text-amber-600" />
            <span>Manual Override</span>
          </button>
        }
      />

      {/* Control Strip: Direction & Gate Location */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Transit Direction:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => { setScanDirection('Exit'); setScanResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                scanDirection === 'Exit'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🚗 Campus Exit
            </button>
            <button
              onClick={() => { setScanDirection('Entry'); setScanResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                scanDirection === 'Entry'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Campus Entry
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={gateLocation}
            onChange={(e) => setGateLocation(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="Main Highway Gate 1">Main Highway Gate 1</option>
            <option value="Hostel Transit Gate 2">Hostel Transit Gate 2</option>
            <option value="Sports Complex Rear Gate">Sports Complex Rear Gate</option>
          </select>
        </div>
      </div>

      {/* Camera Scanner Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center space-y-4">
        {!isScanning ? (
          <div className="py-8 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Camera className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Camera QR Scanner Inactive
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Click below to grant camera permissions and start scanning student digital gate-pass QR codes in real time.
              </p>
            </div>
            <button
              onClick={() => setIsScanning(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2"
            >
              <Scan className="w-4 h-4" />
              <span>Launch Device Camera Scanner</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Live Camera Scanner Active ({scanDirection} Mode)
              </span>
              <button
                onClick={() => { setIsScanning(false); setScanResult(null); }}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close Scanner
              </button>
            </div>

            {/* html5-qrcode target div */}
            <div id="qr-reader-container" className="mx-auto max-w-sm rounded-2xl overflow-hidden border border-slate-200 shadow-inner" />
          </div>
        )}

        {/* Scan Verification Result Banner */}
        {scanResult && (
          <div className={`p-4 rounded-2xl border text-left space-y-3 animate-fade-in ${
            scanResult.status === 'Valid' || scanResult.status === 'Manual_Override'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : scanResult.status === 'Expired'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {scanResult.status === 'Valid' || scanResult.status === 'Manual_Override' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : scanResult.status === 'Expired' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wide">
                    {scanResult.status === 'Valid' ? 'Transit Approved' : scanResult.status.replace('_', ' ')}
                  </h4>
                  <p className="text-xs font-medium mt-0.5">{scanResult.message}</p>
                </div>
              </div>

              <button
                onClick={handleResumeScanning}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold shadow-2xs hover:bg-slate-50 transition flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Next Scan</span>
              </button>
            </div>

            {scanResult.pass && (
              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Student</span>
                  <span className="font-bold text-slate-800">{scanResult.pass.student_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Roll Number</span>
                  <span className="font-mono font-bold text-slate-800">{scanResult.pass.student_roll}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Branch</span>
                  <span className="font-bold text-slate-800">{scanResult.pass.student_branch}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pass Code</span>
                  <span className="font-mono font-bold text-slate-800">{scanResult.pass.pass_code}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-slate-900">Manual Guard Verification</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Use only when the student&apos;s phone screen is cracked or camera scanner fails. Mandatory audit logging applies.
            </p>

            {manualError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {manualError}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student University Roll No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE001"
                  value={manualRollNo}
                  onChange={(e) => setManualRollNo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pass Code (Optional if Roll No verified)</label>
                <input
                  type="text"
                  placeholder="e.g. HIET-PASS-78421"
                  value={manualPassCode}
                  onChange={(e) => setManualPassCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory Audit Override Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State reason: e.g. Phone battery dead; verified physical identity card & HOD verbal approval."
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                >
                  Verify & Log Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verified Gate Scan Logs Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Real-Time Verified Gate Scan Logs</h3>
            <p className="text-xs text-slate-500">Every camera scan and manual override is recorded with timestamps</p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {scanLogs.length} scans recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold text-[11px]">
                <th className="py-2 px-2">Timestamp</th>
                <th className="py-2 px-2">Student</th>
                <th className="py-2 px-2">Direction</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Gate</th>
                <th className="py-2 px-2">Guard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scanLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-2 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="font-bold text-slate-800">{log.student_name}</span>
                    <span className="block text-[10px] font-mono text-slate-500">{log.student_roll}</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.scan_direction === 'Exit'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {log.scan_direction}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.verification_status === 'Valid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.verification_status === 'Manual_Override'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.verification_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 text-[11px]">{log.gate_location}</td>
                  <td className="py-2.5 px-2 text-slate-600 text-[11px]">{log.guard_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
