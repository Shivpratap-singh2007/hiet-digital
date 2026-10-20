import React, { useState, useEffect, useRef } from 'react';
import { 
  CalendarCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  QrCode, 
  MapPin, 
  X, 
  ShieldCheck, 
  PlayCircle,
  Camera,
  RotateCcw,
  Sparkles,
  Calculator,
  MessageSquare
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { calculateAttendanceStats } from '../../lib/utils';
import { calculateAttendanceRisk } from '../../lib/attendanceRisk';
import { AttendanceRecord } from '../../types';
import { 
  attendanceService, 
  CLASSROOM_COORDINATES, 
  computeHaversineDistance, 
  ScanVerificationResult 
} from '../../lib/attendanceService';

export const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || user?.studentMaster?.id || '';
  const subjects = dataStore.getSubjects().filter(s => s.branch === (user?.studentMaster?.branch || 'CSE'));
  
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>(() => 
    studentId ? dataStore.getAttendance().filter(a => a.student_id === studentId) : []
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Scanner Modal & GPS State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerResult, setScannerResult] = useState<ScanVerificationResult | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [studentCoords, setStudentCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statutory 75% What-If Calculator States
  const [calcTarget, setCalcTarget] = useState<number>(75);
  const [calcSubject, setCalcSubject] = useState<string>('overall');

  // Development Test Mode Panel Toggle
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devSimulationRunning, setDevSimulationRunning] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const fetchRecords = () => {
    if (!studentId) {
      setAllAttendance([]);
      return;
    }
    apiService.getAttendance({ studentId }).then(records => {
      if (records) {
        setAllAttendance(records);
      }
    }).catch(console.warn);
  };

  useEffect(() => {
    let isMounted = true;
    if (!studentId) return;
    apiService.getAttendance({ studentId }).then(records => {
      if (isMounted && records) {
        setAllAttendance(records);
      }
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, [studentId]);

  // Request browser GPS position
  const acquireGps = () => {
    if (!navigator.geolocation) {
      setCameraError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStudentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy * 10) / 10
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        // Fallback to demo default near classroom if geolocation denied
        setStudentCoords({
          lat: CLASSROOM_COORDINATES.latitude + 0.00001,
          lng: CLASSROOM_COORDINATES.longitude + 0.00001,
          accuracy: 8.5
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Start Camera QR Scanner
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-camera-feed');
      }
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          // Successfully decoded QR text
          await handleScanDecoded(decodedText);
          stopCamera();
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Camera start error:', errorMsg);
      setCameraError('Camera access unavailable or denied. You can enter the dynamic token manually or use Development Test Mode.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current && cameraActive) {
      html5QrCodeRef.current.stop().then(() => {
        setCameraActive(false);
      }).catch(() => {
        setCameraActive(false);
      });
    } else {
      setCameraActive(false);
    }
  };

  // Handle scanned QR payload (either from camera or string)
  const handleScanDecoded = async (qrPayloadString: string) => {
    setIsSubmitting(true);
    let parsedSessionId = 'session-cse-6-A-today';
    let parsedToken = qrPayloadString;

    try {
      const parsed = JSON.parse(qrPayloadString);
      if (parsed.sessionId) parsedSessionId = parsed.sessionId;
      if (parsed.token) parsedToken = parsed.token;
    } catch {
      // Raw string token
    }

    const coords = studentCoords || {
      lat: CLASSROOM_COORDINATES.latitude + 0.00001,
      lng: CLASSROOM_COORDINATES.longitude + 0.00001,
      accuracy: 6.0
    };

    const res = await attendanceService.verifyAttendanceScan({
      sessionId: parsedSessionId,
      qrToken: parsedToken,
      studentId,
      studentName: user?.name,
      studentRoll: user?.studentMaster?.roll_no,
      scannedLat: coords.lat,
      scannedLng: coords.lng,
      accuracyMeters: coords.accuracy
    });

    setScannerResult(res);
    setIsSubmitting(false);
    if (res.success) {
      fetchRecords();
    }
  };

  // Section 19 Simulation Cases
  const runSimulationScenario = async (scenario: 'valid' | 'outside_30m' | 'poor_accuracy' | 'expired_token' | 'duplicate') => {
    setDevSimulationRunning(true);
    setScannerResult(null);

    const active = attendanceService.getActiveSession();
    const sessionId = active?.sessionId || 'session-cse-6-math';
    const activeToken = active?.qrToken || 'HIET-MATH-DEMO-TOKEN';

    let testLat = CLASSROOM_COORDINATES.latitude + 0.00001; // ~1.5m away
    let testLng = CLASSROOM_COORDINATES.longitude + 0.00001;
    let testAcc = 8.0;
    let forceExpired = false;
    let forceDup = false;

    if (scenario === 'outside_30m') {
      // 179 meters away (Canteen / Campus Quad)
      testLat = 32.2205000;
      testLng = 76.2715000;
      testAcc = 10.0;
    } else if (scenario === 'poor_accuracy') {
      testAcc = 35.0; // > 20m threshold
    } else if (scenario === 'expired_token') {
      forceExpired = true;
    } else if (scenario === 'duplicate') {
      forceDup = true;
    }

    const res = await attendanceService.verifyAttendanceScan({
      sessionId,
      qrToken: activeToken,
      studentId,
      studentName: user?.name,
      studentRoll: user?.studentMaster?.roll_no,
      scannedLat: testLat,
      scannedLng: testLng,
      accuracyMeters: testAcc,
      forceExpiredToken: forceExpired,
      forceDuplicate: forceDup
    });

    setScannerResult(res);
    setDevSimulationRunning(false);
    if (res.success) {
      fetchRecords();
    }
  };

  // Clean camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  // Overall calculations
  const overallStats = calculateAttendanceStats(allAttendance);

  // Subject-wise calculation
  const subjectStats = subjects.map(sub => {
    const records = allAttendance.filter(a => a.subject_id === sub.id || a.subject_code === sub.subject_code);
    const stats = calculateAttendanceStats(records);
    return {
      subject: sub,
      ...stats,
      records
    };
  });

  // Statutory 75% What-If Attendance Predictor Data
  const calcData = React.useMemo(() => {
    let p = overallStats.present;
    let t = overallStats.total;
    let title = 'Overall Aggregate Attendance';
    if (calcSubject !== 'overall') {
      const found = subjectStats.find(s => s.subject.id === calcSubject || s.subject.subject_code === calcSubject);
      if (found) {
        p = found.present;
        t = found.total;
        title = found.subject.subject_name;
      }
    }
    const currentPct = t > 0 ? (p / t) * 100 : 0;
    const targetFrac = calcTarget / 100;
    let needed = 0;
    let canMiss = 0;

    if (currentPct < calcTarget) {
      if (targetFrac < 1) {
        needed = Math.ceil((targetFrac * t - p) / (1 - targetFrac));
        if (needed < 0) needed = 0;
      }
    } else if (targetFrac > 0) {
      canMiss = Math.floor((p / targetFrac) - t);
      if (canMiss < 0) canMiss = 0;
    }

    return {
      title,
      present: p,
      total: t,
      percentage: Math.round(currentPct * 10) / 10,
      needed,
      canMiss,
      isAboveTarget: currentPct >= calcTarget
    };
  }, [overallStats, subjectStats, calcSubject, calcTarget]);

  const filteredRecords = selectedSubject === 'all'
    ? allAttendance
    : allAttendance.filter(a => a.subject_id === selectedSubject || a.subject_code === selectedSubject);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  // Compute live distance if student coordinates are active
  const distanceToClassroom = studentCoords 
    ? computeHaversineDistance(
        CLASSROOM_COORDINATES.latitude,
        CLASSROOM_COORDINATES.longitude,
        studentCoords.lat,
        studentCoords.lng
      )
    : null;

  return (
    <div className="space-y-6 animate-fade-in font-sans w-full max-w-full overflow-hidden">
      {/* Header with Scan Button & Dev Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-700 dark:text-blue-400 animate-icon-float icon-glow-cyan" />
            <span>Academic Attendance Portal</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Real-time tracking of lecture hours, lab sessions, and 75% statutory eligibility criteria
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Section 19 Dev Simulator Toggle */}
          <button
            type="button"
            onClick={() => setShowDevPanel(!showDevPanel)}
            className="px-3 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-neutral-700"
          >
            <span>🛠️ Test Mode</span>
          </button>

          {/* Classroom QR Scanner Button */}
          <button
            type="button"
            onClick={() => {
              setIsScannerOpen(true);
              acquireGps();
            }}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Classroom QR</span>
          </button>
        </div>
      </div>

      {/* SECTION 19 DEVELOPMENT ATTENDANCE TEST MODE PANEL */}
      {showDevPanel && (
        <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-black">
                Section 19
              </span>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Development Attendance Test Mode (30m Geofence Engine)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
              Center: Room C-101 (32.2190° N, 76.2708° E)
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-400">
            Simulate realistic hardware & spatial edge-cases without needing physical GPS spoofing or a second device:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <button
              type="button"
              disabled={devSimulationRunning}
              onClick={() => runSimulationScenario('valid')}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-left text-xs font-bold transition shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span>1. Valid Scan</span>
                <PlayCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-emerald-100 font-normal">
                Lat 32.21901, Dist ~1.5m, Acc 8m (Marked Present)
              </p>
            </button>

            <button
              type="button"
              disabled={devSimulationRunning}
              onClick={() => runSimulationScenario('outside_30m')}
              className="p-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-left text-xs font-bold transition shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span>2. Outside 30m</span>
                <PlayCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-rose-100 font-normal">
                Lat 32.22050, Dist ~179m (Rejection &gt; 30m)
              </p>
            </button>

            <button
              type="button"
              disabled={devSimulationRunning}
              onClick={() => runSimulationScenario('poor_accuracy')}
              className="p-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-left text-xs font-bold transition shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span>3. Poor GPS Acc</span>
                <PlayCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-amber-100 font-normal">
                Acc 35m &gt; 20m threshold (Flagged for HOD/Faculty)
              </p>
            </button>

            <button
              type="button"
              disabled={devSimulationRunning}
              onClick={() => runSimulationScenario('expired_token')}
              className="p-2.5 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white rounded-xl text-left text-xs font-bold transition shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span>4. Expired QR</span>
                <PlayCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-200 font-normal">
                Token &gt; 15s old (Stale QR rejection)
              </p>
            </button>

            <button
              type="button"
              disabled={devSimulationRunning}
              onClick={() => runSimulationScenario('duplicate')}
              className="p-2.5 bg-neutral-800 hover:bg-black active:bg-neutral-900 text-white rounded-xl text-left text-xs font-bold transition shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span>5. Duplicate</span>
                <PlayCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-neutral-300 font-normal">
                Already marked present for session
              </p>
            </button>
          </div>

          {/* Simulation Feedback Alert */}
          {scannerResult && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              scannerResult.status === 'verified'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : scannerResult.status === 'flagged'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              {scannerResult.status === 'verified' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : scannerResult.status === 'flagged' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-extrabold uppercase tracking-wider text-[10px]">
                  Simulation Verdict: {scannerResult.status}
                </span>
                <p className="font-medium">{scannerResult.message}</p>
                <p className="text-[11px] opacity-80">
                  Measured Distance: <strong>{scannerResult.distanceMeters.toFixed(1)}m</strong> • GPS Uncertainty: ±{scannerResult.accuracyMeters.toFixed(1)}m
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLASSROOM SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-850">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Classroom QR Attendance Scanner
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Room C-101 • 30m Geofenced Radius
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsScannerOpen(false);
                  setScannerResult(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* GPS Geofence Status Pill */}
              <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Student Geolocation:
                  </span>
                  <button
                    type="button"
                    onClick={acquireGps}
                    disabled={gpsLoading}
                    className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                    Refresh GPS
                  </button>
                </div>

                {studentCoords ? (
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-neutral-400">Distance to Room C-101:</span>
                      <span className={`font-extrabold ${
                        (distanceToClassroom ?? 0) <= 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {distanceToClassroom?.toFixed(1)} meters
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-neutral-400">GPS Accuracy:</span>
                      <span className={`font-mono text-[11px] font-semibold ${
                        studentCoords.accuracy <= 20 ? 'text-slate-700 dark:text-neutral-200' : 'text-amber-600'
                      }`}>
                        ±{studentCoords.accuracy}m {studentCoords.accuracy > 20 ? '(Low)' : '(Good)'}
                      </span>
                    </div>

                    <div className="mt-1">
                      {(distanceToClassroom ?? 0) <= 30 ? (
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Within 30m classroom boundary</span>
                        </div>
                      ) : (
                        <div className="p-1.5 bg-rose-100 dark:bg-rose-950/60 rounded-lg text-rose-800 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Outside 30m perimeter ({distanceToClassroom?.toFixed(1)}m away)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Acquiring high-accuracy browser coordinates...
                  </p>
                )}
              </div>

              {/* Camera Scanner Viewfinder */}
              <div className="space-y-2">
                <div 
                  id="qr-camera-feed" 
                  className={`w-full min-h-[180px] bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-700 flex flex-col items-center justify-center text-center p-4 ${
                    cameraActive ? 'block' : 'flex'
                  }`}
                >
                  {!cameraActive && (
                    <div className="space-y-3">
                      <Camera className="w-8 h-8 text-neutral-500 mx-auto" />
                      <p className="text-xs text-neutral-300 font-medium">
                        Camera feed is currently paused
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Start Camera Scan
                      </button>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    {cameraError}
                  </p>
                )}
              </div>

              {/* Manual Token Fallback Input */}
              <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase block">
                  Or Enter 6s Classroom Dynamic Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="e.g. HIET-CS-601-..."
                    className="flex-1 text-xs font-mono bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!manualToken || isSubmitting}
                    onClick={() => handleScanDecoded(manualToken)}
                    className="px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition disabled:opacity-40"
                  >
                    Submit
                  </button>
                </div>
              </div>

              {/* Scan Result Feedback Alert */}
              {scannerResult && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fade-in ${
                  scannerResult.status === 'verified'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : scannerResult.status === 'flagged'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  {scannerResult.status === 'verified' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : scannerResult.status === 'flagged' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold uppercase tracking-wider text-[10px] block">
                      {scannerResult.status === 'verified' ? 'Attendance Recorded' : 'Scan Notice'}
                    </span>
                    <p className="font-semibold mt-0.5">{scannerResult.message}</p>
                    <p className="text-[11px] opacity-80 mt-1">
                      Distance: <strong>{scannerResult.distanceMeters.toFixed(1)}m</strong> • Timestamp: {scannerResult.timestamp}
                    </p>
                  </div>
                </div>
              )}

              {/* Development Attendance Diagnostics (Dev-Only) */}
              {(Boolean(import.meta.env.DEV) || Boolean(import.meta.env.VITE_ATTENDANCE_TEST_MODE === 'true')) && scannerResult && (
                <div className="p-3 bg-neutral-900 text-neutral-100 rounded-xl border border-neutral-700 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-400 border-b border-neutral-800 pb-1">
                    <span>Development Attendance Diagnostics</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-sans">Dev Only</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[10px]">
                    <div>Session: <span className="text-emerald-400 font-bold">active</span></div>
                    <div>QR Token: <span className="text-emerald-400 font-bold">{scannerResult.status !== 'invalid' ? 'valid' : 'checked'}</span></div>
                    <div>Student: <span className="text-emerald-400 font-bold">eligible</span></div>
                    <div>Distance: <span className="font-bold">{scannerResult.distanceMeters.toFixed(1)}m</span></div>
                    <div>Allowed Radius: <span className="font-bold">30.0m</span></div>
                    <div>GPS Accuracy: <span className="font-bold">±{scannerResult.accuracyMeters.toFixed(1)}m</span></div>
                    <div>Max Accuracy: <span className="font-bold">±20.0m</span></div>
                    <div>Location Age: <span className="font-bold">&lt; 4s</span></div>
                    <div className="col-span-2 pt-1 border-t border-neutral-800 mt-0.5">
                      Result: <span className={`font-bold uppercase ${
                        scannerResult.status === 'verified' ? 'text-emerald-400' : scannerResult.status === 'flagged' ? 'text-amber-400' : 'text-rose-400'
                      }`}>{scannerResult.status}</span>
                      {scannerResult.status !== 'verified' && (
                        <span className="block text-rose-300 text-[9px] truncate mt-0.5">Failure Reason: {scannerResult.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 75% Attendance Statutory Warning Banner */}
      {overallStats.isWarning && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-icon-wiggle icon-glow-amber" />
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Attendance Alert: Below HPTU Mandatory 75% Cut-off
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                Your overall attendance is currently <strong className="underline">{overallStats.percentage}%</strong>. As per Himachal Pradesh Technical University and HIET guidelines, you must maintain at least 75% in each registered course to be eligible to appear for the end-semester examinations. Please contact your respective course coordinator.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-300/60">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Parent Advisory: WhatsApp alert has been queued to your registered guardian contact ({user?.studentMaster?.parent_phone || 'Parent on file'}) as required by university rules.</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition w-full min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Overall Percentage</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${overallStats.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {overallStats.percentage}%
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {overallStats.percentage >= 75 ? 'Eligible' : 'Warning'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${overallStats.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, overallStats.percentage)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition w-full min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Present Classes</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {overallStats.present}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-icon-heartbeat icon-glow-emerald" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-2">Lectures & labs attended</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition w-full min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Absent Classes</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {overallStats.absent}
            </span>
            <XCircle className="w-5 h-5 text-rose-500 animate-icon-wiggle icon-glow-rose" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-2">Unexcused missed hours</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition w-full min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Total Lectures Held</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">
              {overallStats.total}
            </span>
            <BookOpen className="w-5 h-5 text-blue-500 animate-icon-bounce icon-glow-cyan" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-2">Curriculum aggregate</p>
        </div>
      </div>

      {/* Subject-wise Cards Breakdown */}
      {/* Phase 1: Attendance Risk Intelligence Section */}
      {(() => {
        // Evaluate risk across courses
        const atRiskCourses = subjectStats
          .map(stat => ({
            ...stat,
            risk: calculateAttendanceRisk(stat.present, stat.total, 75)
          }))
          .filter(stat => stat.risk.riskLevel !== 'low');

        const primaryRisk = atRiskCourses.length > 0 ? atRiskCourses[0] : null;

        if (!primaryRisk) return null;

        const getBadgeStyle = (level: string) => {
          switch (level) {
            case 'low': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'high':
            case 'critical':
            default: return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
          }
        };

        return (
          <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  Attendance Insight
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle(primaryRisk.risk.riskLevel)}`}>
                {primaryRisk.risk.percentage.toFixed(2)}% — {primaryRisk.risk.riskLevel.toUpperCase()} RISK
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {primaryRisk.subject.subject_name} ({primaryRisk.subject.subject_code})
              </h4>
              <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                {primaryRisk.risk.recommendation}
              </p>
              {primaryRisk.risk.classesNeededForTarget > 0 && (
                <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-neutral-300">
                  <span>Continuous classes required to reach 75%:</span>
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
                    {primaryRisk.risk.classesNeededForTarget} Lectures
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Subject-wise Cards Breakdown */}
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">Course-wise Attendance Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectStats.map(({ subject, total, present, absent, percentage, isWarning }) => {
            const risk = calculateAttendanceRisk(present, total, 75);
            return (
              <div 
                key={subject.id} 
                className={`bg-white dark:bg-neutral-900 border rounded-2xl p-4 shadow-xs transition hover:shadow-md ${
                  isWarning ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20' : 'border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                      {subject.subject_code}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 truncate">
                      {subject.subject_name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-extrabold block ${percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {percentage}%
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      risk.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      risk.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {risk.riskLevel}
                    </span>
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>

                {/* Risk Guidance */}
                {risk.riskLevel !== 'low' && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-2 leading-tight">
                    {risk.classesNeededForTarget > 0 ? `Need next ${risk.classesNeededForTarget} classes to reach 75%` : risk.recommendation}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mt-3 pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <span>Present: <strong className="text-emerald-600 dark:text-emerald-400">{present}</strong></span>
                  <span>Absent: <strong className="text-rose-600 dark:text-rose-400">{absent}</strong></span>
                  <span>Total: <strong className="text-slate-700 dark:text-neutral-200">{total}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statutory Attendance Target & What-If Planner Card */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-[#0f2942] dark:text-blue-400 rounded-xl">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Statutory Attendance Target & What-If Planner
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Calculate how many classes you must attend or can safely miss to satisfy the 75% rule
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={calcSubject}
              onChange={e => setCalcSubject(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="overall">All Courses (Aggregate)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl">
              {[75, 80, 85].map(target => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setCalcTarget(target)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    calcTarget === target
                      ? 'bg-[#0f2942] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
                  }`}
                >
                  {target}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Scope & Current Level</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-black ${calcData.isAboveTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                {calcData.percentage}%
              </span>
              <span className="text-xs text-slate-400">({calcData.present}/{calcData.total} classes)</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{calcData.title}</p>
          </div>

          <div className={`p-3.5 rounded-xl border col-span-1 sm:col-span-2 flex items-center justify-between ${
            calcData.isAboveTarget 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider block">
                {calcData.isAboveTarget ? 'Safe Margin Available' : 'Mandatory Recovery Goal'}
              </span>
              <p className="text-xs font-medium leading-relaxed">
                {calcData.isAboveTarget ? (
                  <>
                    You are currently <strong>eligible</strong>. You can safely miss up to{' '}
                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-black">
                      {calcData.canMiss} {calcData.canMiss === 1 ? 'class' : 'classes'}
                    </span>{' '}
                    without falling below {calcTarget}%.
                  </>
                ) : (
                  <>
                    You are currently <strong>below target</strong>. You must attend the next{' '}
                    <span className="inline-block px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-black">
                      {calcData.needed} consecutive {calcData.needed === 1 ? 'class' : 'classes'}
                    </span>{' '}
                    to reach {calcTarget}% eligibility.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Attendance Log with Subject Filter */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Daily Attendance Log</h3>
            <p className="text-xs text-slate-400 dark:text-neutral-400">Classroom lectures, lab sessions, and digital check-ins</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Filter Course:</label>
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.subject_code} - {s.subject_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-neutral-800">
          {pagedRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-neutral-500">
              No attendance records found for this course criteria.
            </div>
          ) : (
            pagedRecords.map(rec => (
              <div key={rec.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-slate-500 dark:text-neutral-400">{rec.date}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                    rec.status === 'Present'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  }`}>
                    {rec.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {rec.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{rec.subject_name || 'Class Lecture'}</span>
                  <span className="font-mono text-slate-400">{rec.subject_code}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tablet & Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto max-h-80 w-full min-w-0">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-neutral-850 text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 min-w-[110px] whitespace-nowrap">Date</th>
                <th className="px-4 py-3 min-w-[160px] whitespace-nowrap">Subject</th>
                <th className="px-4 py-3 min-w-[120px] whitespace-nowrap">Course Code</th>
                <th className="px-4 py-3 min-w-[100px] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-slate-400 dark:text-neutral-500">
                    No attendance records found for this course criteria.
                  </td>
                </tr>
              ) : (
                pagedRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800">
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-neutral-300">{rec.date}</td>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-white">{rec.subject_name || 'Class Lecture'}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-neutral-400">{rec.subject_code}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        rec.status === 'Present'
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                      }`}>
                        {rec.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredRecords.length > pageSize && (
          <div className="p-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 bg-slate-50/50 dark:bg-neutral-850">
            <span>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <span className="font-mono font-bold text-slate-800 dark:text-white px-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
