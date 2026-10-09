import React, { useState, useEffect, useRef } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Save, Filter, QrCode, AlertTriangle, ShieldCheck, RefreshCw, Radio, Sparkles } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { AttendanceRecord } from '../../types';
import { calculateAttendanceRisk } from '../../lib/attendanceRisk';
import { DynamicQRCodeCanvas } from '../common/DynamicQRCodeCanvas';
import { 
  attendanceService, 
  CLASSROOM_COORDINATES, 
  DynamicSessionState, 
  LiveScanLogEntry 
} from '../../lib/attendanceService';

export const TeacherAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.teacher_id || 'tch-01';

  // Mode: Manual Register vs Dynamic QR Session vs Attendance Risk Insights
  const [activeTab, setActiveTab] = useState<'manual' | 'dynamic_qr' | 'risk_insights'>('manual');

  // Cascading Selector States as strictly specified in Section 26
  const [department, setDepartment] = useState<string>('CSE');
  const [branch, setBranch] = useState<string>('CSE');
  const [semester, setSemester] = useState<number>(6);
  const [section, setSection] = useState<string>('A');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Filter students based on cascading selections
  const allStudents = dataStore.getStudentsMaster();
  const matchingStudents = allStudents.filter(s => 
    s.department === department &&
    s.branch === branch &&
    s.semester === semester &&
    s.section === section
  );

  // If no students match (e.g. branch switch), fallback to branch students
  const displayStudents = matchingStudents.length > 0 
    ? matchingStudents 
    : allStudents.filter(s => s.branch === branch);

  // Local Attendance State
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent'>>(() => {
    const existing = dataStore.getAttendance().filter(a => a.date === date && a.subject_name === subject);
    const map: Record<string, 'Present' | 'Absent'> = {};
    displayStudents.forEach(s => {
      const match = existing.find(e => e.student_id === s.id);
      map[s.id] = (match ? match.status : 'Present') as 'Present' | 'Absent';
    });
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamic QR Session State
  const [qrSession, setQrSession] = useState<DynamicSessionState | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(6);
  const [liveScanLogs, setLiveScanLogs] = useState<LiveScanLogEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Subject code helper
  const getSubjectCode = () => {
    if (subject === 'Mathematics') return 'CS-601';
    if (subject === 'Physics') return 'CS-602';
    if (subject === 'Machine Learning Foundations') return 'AIML-401';
    return 'CS-603';
  };

  // Start or manage dynamic session
  const startDynamicSession = () => {
    const session = attendanceService.startOrRefreshSession({
      subjectName: subject,
      subjectCode: getSubjectCode(),
      semester,
      branch,
      section,
      facultyId: teacherId,
      facultyName: user?.name || 'Dr. Anuj Sharma',
      roomName: CLASSROOM_COORDINATES.roomName,
    });
    setQrSession(session);
    setSecondsRemaining(6);
    setLiveScanLogs(attendanceService.getSessionLogs(session.sessionId));
  };

  // 6-second dynamic refresh loop when Dynamic QR tab is active
  useEffect(() => {
    if (activeTab !== 'dynamic_qr') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Initialize or refresh
    startDynamicSession();

    // 1-second countdown interval
    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Time to refresh dynamic token
          const refreshed = attendanceService.startOrRefreshSession({
            subjectName: subject,
            subjectCode: getSubjectCode(),
            semester,
            branch,
            section,
            facultyId: teacherId,
            facultyName: user?.name || 'Dr. Anuj Sharma',
          });
          setQrSession(refreshed);
          return 6;
        }
        return prev - 1;
      });
    }, 1000);

    // Listen to live student scans
    const unsubscribe = attendanceService.subscribe((event) => {
      if (event.type === 'SCAN_RECEIVED' || event.type === 'OVERRIDE_APPROVED') {
        const active = attendanceService.getActiveSession();
        if (active) {
          const updatedLogs = attendanceService.getSessionLogs(active.sessionId);
          setLiveScanLogs([...updatedLogs]);
          // Also mark present in attendance map
          if (event.entry && typeof event.entry === 'object') {
            const entry = event.entry as LiveScanLogEntry;
            if (entry.status === 'verified') {
              setAttendanceMap(m => ({ ...m, [entry.studentId]: 'Present' }));
            }
          }
        }
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      unsubscribe();
    };
  }, [activeTab, subject, branch, semester, section]);

  // Toggle single student
  const handleToggle = (studentId: string, status: 'Present' | 'Absent') => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  // Mark All Present / Absent
  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const map: Record<string, 'Present' | 'Absent'> = {};
    displayStudents.forEach(s => {
      map[s.id] = status;
    });
    setAttendanceMap(map);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const records: Partial<AttendanceRecord>[] = displayStudents.map(s => ({
      student_id: s.id,
      subject_id: `sub-${branch.toLowerCase()}-${semester}`,
      subject_name: subject,
      subject_code: getSubjectCode(),
      date,
      status: attendanceMap[s.id] || 'Present',
      marked_by: teacherId
    }));

    await apiService.saveAttendance(records);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Manual Override approval for flagged student
  const handleApproveFlagged = async (studentId: string) => {
    if (!qrSession) return;
    const reason = window.prompt('Enter reason for manual attendance correction (audited):', 'Indoor GPS variance; student verified present in lecture hall.');
    if (!reason || !reason.trim()) return;

    try {
      await apiService.recordManualAttendanceOverride({
        sessionId: qrSession.sessionId,
        studentId,
        status: 'Present',
        reason: reason.trim()
      });
    } catch (err) {
      console.warn('Manual override record notice:', err);
    }

    await attendanceService.approveFlaggedStudent(qrSession.sessionId, studentId);
    setAttendanceMap(prev => ({ ...prev, [studentId]: 'Present' }));
    setLiveScanLogs([...attendanceService.getSessionLogs(qrSession.sessionId)]);
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'Absent').length;

  const verifiedScansCount = liveScanLogs.filter(l => l.status === 'verified').length;
  const flaggedScansCount = liveScanLogs.filter(l => l.status === 'flagged').length;
  const invalidScansCount = liveScanLogs.filter(l => l.status === 'invalid').length;

  // JSON payload for QR code
  const qrPayload = qrSession ? JSON.stringify({
    institution: 'HIET',
    sessionId: qrSession.sessionId,
    subject: qrSession.subjectName,
    subjectCode: qrSession.subjectCode,
    branch: qrSession.branch,
    semester: qrSession.semester,
    section: qrSession.section,
    lat: qrSession.geofenceLat,
    lng: qrSession.geofenceLng,
    radius: qrSession.geofenceRadius,
    token: qrSession.qrToken,
    issuedAt: qrSession.issuedAt,
    expiresAt: qrSession.expiresAt
  }) : '';

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-600" />
            <span>Classroom Attendance Register</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Select course criteria, mark student presence, or launch 30m geofenced dynamic QR
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Top-Right Tab Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <span>Manual Register</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dynamic_qr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'dynamic_qr'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Dynamic QR Session (30m)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('risk_insights')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'risk_insights'
                  ? 'bg-[#0f2942] text-white shadow-xs dark:bg-blue-600'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Attendance Risk Insights</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Records'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Attendance register saved and synced to student transcripts!</span>
        </div>
      )}

      {/* Cascading Filter Strip: Dept -> Branch -> Semester -> Section -> Subject -> Date */}
      <div className="p-3.5 bg-slate-50 dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Course & Lecture Filter Criteria:</span>
          </div>
          {activeTab === 'dynamic_qr' && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              <Radio className="w-3 h-3 animate-pulse text-amber-600" />
              Live Dynamic Broadcast
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* 1. Department */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase block mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 focus:outline-none dark:text-white"
            >
              <option value="CSE">CSE Department</option>
            </select>
          </div>

          {/* 2. Branch */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase block mb-1">
              Branch
            </label>
            <select
              value={branch}
              onChange={e => {
                const b = e.target.value;
                setBranch(b);
                setSemester(b === 'CSE AI & ML' ? 4 : 6);
              }}
              className="w-full text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 focus:outline-none dark:text-white"
            >
              <option value="CSE">CSE</option>
              <option value="CSE AI & ML">CSE AI & ML</option>
            </select>
          </div>

          {/* 3. Semester */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase block mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={e => setSemester(Number(e.target.value))}
              className="w-full text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 focus:outline-none dark:text-white"
            >
              {branch === 'CSE' ? (
                <>
                  <option value={6}>Semester 6</option>
                  <option value={4}>Semester 4</option>
                </>
              ) : (
                <>
                  <option value={4}>Semester 4</option>
                  <option value={2}>Semester 2</option>
                </>
              )}
            </select>
          </div>

          {/* 4. Section */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase block mb-1">
              Section
            </label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="w-full text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 focus:outline-none dark:text-white"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* 5. Subject */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase block mb-1">
              Subject
            </label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 focus:outline-none dark:text-white"
            >
              {branch === 'CSE' ? (
                <>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="BEE">BEE</option>
                  <option value="Communication">Communication</option>
                  <option value="EVS">EVS</option>
                </>
              ) : (
                <>
                  <option value="Machine Learning Foundations">Machine Learning</option>
                  <option value="Data Structures & Algorithms">Data Structures</option>
                </>
              )}
            </select>
          </div>

          {/* 6. Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase block mb-1">
              Lecture Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl px-2 py-1.5 focus:outline-none dark:text-white"
            />
          </div>
        </div>

        {/* Quick Batch Summary & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-neutral-300 font-medium">Batch Roster: <strong>{displayStudents.length} Students</strong></span>
            <span className="text-slate-300 dark:text-neutral-600">•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{presentCount} Present</span>
            <span className="text-slate-300 dark:text-neutral-600">•</span>
            <span className="text-rose-700 dark:text-rose-400 font-bold">{absentCount} Absent</span>
          </div>

          {activeTab === 'manual' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] transition"
              >
                Mark All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DYNAMIC QR SESSION VIEW */}
      {activeTab === 'dynamic_qr' && qrSession && (
        <div className="space-y-4">
          {/* Geofence & Countdown Banner */}
          <div className="p-4 bg-gradient-to-r from-neutral-900 to-slate-900 text-white rounded-2xl border border-neutral-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 className="text-sm font-extrabold text-white">
                  30m Classroom Geofence Active: {qrSession.roomName}
                </h3>
              </div>
              <p className="text-xs text-neutral-300">
                Center Coordinates: <code className="font-mono text-amber-300">32.2190000° N, 76.2708000° E</code> • Radius: <strong className="text-white">30 Meters</strong> • Max GPS Uncertainty: <strong className="text-white">20 Meters</strong>
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
                <span className="text-[10px] uppercase font-bold text-neutral-300 tracking-wider">Dynamic Token</span>
                <span className="text-lg font-mono font-black text-amber-400 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  {secondsRemaining}s
                </span>
              </div>
            </div>
          </div>

          {/* Development Attendance Diagnostics (Dev-Only) */}
          {(Boolean(import.meta.env.DEV) || Boolean(import.meta.env.VITE_ATTENDANCE_TEST_MODE === 'true')) && (
            <div className="p-3 bg-neutral-900 text-neutral-100 rounded-xl border border-neutral-700 text-[11px] font-mono space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-400 border-b border-neutral-800 pb-1">
                <span>Development Attendance Diagnostics (Faculty Monitor)</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-sans">Dev Only</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                <div>Session: <span className="text-emerald-400 font-bold">active</span></div>
                <div>Rolling Interval: <span className="text-amber-400 font-bold">6s</span></div>
                <div>Allowed Radius: <span className="font-bold">30.0m</span></div>
                <div>Max Accuracy: <span className="font-bold">±20.0m</span></div>
                <div>Scans Logged: <span className="text-white font-bold">{liveScanLogs.length}</span></div>
                <div>Verified: <span className="text-emerald-400 font-bold">{verifiedScansCount}</span></div>
                <div>Flagged: <span className="text-amber-400 font-bold">{flaggedScansCount}</span></div>
                <div>Rejected: <span className="text-rose-400 font-bold">{invalidScansCount}</span></div>
              </div>
            </div>
          )}

          {/* QR Code and Live Scanner Feed Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Dynamic QR Display Column */}
            <div className="lg:col-span-5 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Projector / Smart Board View
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {subject} ({getSubjectCode()})
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Semester {semester} • Section {section} • Room C-101
                </p>
              </div>

              {/* Live Canvas Dynamic QR */}
              <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-neutral-700">
                <DynamicQRCodeCanvas value={qrPayload} size={220} />
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-semibold text-slate-700 dark:text-neutral-300">
                  Students must scan using the Student Portal camera
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                  QR dynamically rotates cryptographic payload every 6 seconds to prevent screenshot proxies.
                </p>
              </div>
            </div>

            {/* Live Session Feed & Override Panel */}
            <div className="lg:col-span-7 space-y-3">
              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Verified (≤30m)</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{verifiedScansCount}</span>
                </div>
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Flagged (&gt;20m acc)</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{flaggedScansCount}</span>
                </div>
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Invalid (&gt;30m)</span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{invalidScansCount}</span>
                </div>
              </div>

              {/* Scanned Student Stream Table */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-xs">
                <div className="p-3 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                  <span>Live Incoming Scans ({liveScanLogs.length})</span>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-normal">Real-time GPS validation</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-neutral-800 max-h-72 overflow-y-auto">
                  {liveScanLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-neutral-500 space-y-1">
                      <QrCode className="w-8 h-8 text-slate-300 dark:text-neutral-700 mx-auto" />
                      <p className="font-semibold">Waiting for student classroom scans...</p>
                      <p className="text-[11px]">Scans within 30m of Room C-101 will appear here in real time.</p>
                    </div>
                  ) : (
                    liveScanLogs.map(log => (
                      <div key={log.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                              {log.studentRoll}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                              {log.studentName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                            Dist: <strong className="text-slate-800 dark:text-neutral-200">{log.distanceMeters.toFixed(1)}m</strong> • Accuracy: ±{log.accuracyMeters.toFixed(1)}m • {log.timestamp}
                          </p>
                          {log.reason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                              {log.reason}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {log.status === 'verified' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {log.manualOverride ? 'Overridden' : 'Present'}
                            </span>
                          )}

                          {log.status === 'flagged' && (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Flagged
                              </span>
                              <button
                                type="button"
                                onClick={() => handleApproveFlagged(log.studentId)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition"
                              >
                                Approve
                              </button>
                            </div>
                          )}

                          {log.status === 'invalid' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL REGISTER VIEW */}
      {activeTab === 'manual' && (
        <div className="space-y-2">
          {displayStudents.map((s, idx) => {
            const isPresent = (attendanceMap[s.id] || 'Present') === 'Present';
            return (
              <div
                key={s.id}
                className={`p-3 sm:p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isPresent
                    ? 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800'
                    : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-400 dark:text-neutral-500">
                    {idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                        {s.roll_no}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {s.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                      {s.branch} • Sec {s.section}
                    </p>
                  </div>
                </div>

                {/* Present / Absent Segmented Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(s.id, 'Present')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggle(s.id, 'Absent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      !isPresent
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ATTENDANCE RISK INSIGHTS VIEW (Phase 1) */}
      {activeTab === 'risk_insights' && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  Course Attendance Risk Roster ({subject} • {branch} Sem {semester})
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Explainable rule-based intelligence based on 75% statutory requirement
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
              Assigned Faculty View
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-neutral-800/80 text-slate-600 dark:text-neutral-300 font-bold border-b border-slate-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Attendance %</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Classes Needed</th>
                  <th className="py-3 px-4">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {displayStudents.map((s) => {
                  const studentAttendance = dataStore.getAttendance().filter(
                    a => a.student_id === s.id && (a.subject_name === subject || a.subject_id?.includes(branch.toLowerCase()))
                  );
                  const conducted = studentAttendance.length > 0 ? studentAttendance.length : 17;
                  const attended = studentAttendance.length > 0 
                    ? studentAttendance.filter(a => a.status === 'Present').length
                    : (s.roll_no === 'CSE001' ? 12 : s.roll_no === 'CSE002' ? 10 : 15);

                  const risk = calculateAttendanceRisk(attended, conducted, 75);

                  const getRiskBadge = (level: string) => {
                    switch (level) {
                      case 'low':
                        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                      case 'medium':
                        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                      case 'high':
                      case 'critical':
                      default:
                        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
                    }
                  };

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {s.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-700 dark:text-blue-400">
                        {s.roll_no}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-neutral-300">
                        {subject}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {risk.percentage.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {attended}/{conducted} classes
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getRiskBadge(risk.riskLevel)}`}>
                          {risk.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {risk.classesNeededForTarget > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {risk.classesNeededForTarget} consecutive
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-neutral-300 max-w-xs">
                        {risk.recommendation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
