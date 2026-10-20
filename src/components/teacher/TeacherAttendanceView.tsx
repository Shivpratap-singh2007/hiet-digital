import React, { useState, useEffect, useRef } from 'react';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  Filter, 
  QrCode, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Radio, 
  Sparkles, 
  Search, 
  Send, 
  RotateCcw, 
  History, 
  FileText, 
  Lock, 
  AlertCircle,
  X,
  Info,
  Eye,
  Check,
  ChevronDown
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../lib/supabase';
import { AttendanceRecord, AttendanceBatch, AttendanceBatchRecord } from '../../types';
import { calculateAttendanceRisk } from '../../lib/attendanceRisk';
import { DynamicQRCodeCanvas } from '../common/DynamicQRCodeCanvas';
import { 
  attendanceService, 
  CLASSROOM_COORDINATES, 
  DynamicSessionState, 
  LiveScanLogEntry 
} from '../../lib/attendanceService';
import { formatIndiaDateTime } from '../../lib/utils';

export const TeacherAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const teacherId = user?.teacher_id || user?.id || 'tch-01';
  const facultyName = user?.name || user?.teacherMaster?.name || 'Dr. Rajesh Kumar';

  // Mode: Manual Register vs Dynamic QR Session vs Attendance Risk Insights vs Batch History
  const [activeTab, setActiveTab] = useState<'manual' | 'dynamic_qr' | 'risk_insights' | 'batches'>('manual');

  // Search filter for student roster
  const [studentSearch, setStudentSearch] = useState('');

  // 1. Authorized Teaching Assignments Derivation
  const allSubjects = dataStore.getSubjects();
  const authorizedSubjects = allSubjects.filter(s => 
    s.teacher_id === teacherId || 
    s.teacher_name?.toLowerCase() === facultyName.toLowerCase() ||
    (teacherId === 'tch-01' && (s.teacher_id === 'tch-01' || s.teacher_name === 'Dr. Rajesh Kumar')) ||
    (!s.teacher_id && s.department === (user?.teacherMaster?.department || 'CSE'))
  );

  const authorizedBranches = Array.from(new Set(authorizedSubjects.map(s => s.branch)));
  const defaultBranch = authorizedBranches.includes('CSE') ? 'CSE' : (authorizedBranches[0] || 'CSE');

  // Cascading Selector States
  const [programme] = useState<string>('B.Tech');
  const [department] = useState<string>(user?.teacherMaster?.department || 'CSE');
  const [branch, setBranch] = useState<string>(defaultBranch);

  const availableSemesters = Array.from(
    new Set(authorizedSubjects.filter(s => s.branch === branch).map(s => s.semester))
  ).sort((a, b) => a - b);
  const defaultSemester = availableSemesters.length > 0 ? availableSemesters[availableSemesters.length - 1] : 6;

  const [semester, setSemester] = useState<number>(defaultSemester);
  const [section, setSection] = useState<string>('A');

  const availableSubjectsForCohort = authorizedSubjects.filter(
    s => s.branch === branch && s.semester === semester
  );
  const defaultSubjectName = availableSubjectsForCohort.length > 0 
    ? availableSubjectsForCohort[0].subject_name 
    : 'Mathematics';

  const [subject, setSubject] = useState<string>(defaultSubjectName);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Keep subject in sync if branch or semester changes
  useEffect(() => {
    const matching = authorizedSubjects.filter(s => s.branch === branch && s.semester === semester);
    if (matching.length > 0 && !matching.some(m => m.subject_name === subject)) {
      setSubject(matching[0].subject_name);
    }
  }, [branch, semester, authorizedSubjects]);

  // Submission & Validation States
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<'Present' | 'Absent' | 'Leave' | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submissionComments, setSubmissionComments] = useState('');
  const [selectedBatchForDetails, setSelectedBatchForDetails] = useState<AttendanceBatch | null>(null);

  // Batches state for tracking approval workflow
  const [allBatches, setAllBatches] = useState<AttendanceBatch[]>(() => dataStore.getAttendanceBatches());

  // Filter students based on cascading selections
  const allStudents = dataStore.getStudentsMaster();
  const matchingStudents = allStudents.filter(s => 
    s.branch === branch &&
    s.semester === semester &&
    s.section === section
  );

  // Fallback if branch switch has no exact section/semester match
  const displayStudents = matchingStudents.length > 0 
    ? matchingStudents 
    : allStudents.filter(s => s.branch === branch);

  const searchedStudents = displayStudents.filter(s => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.roll_no.toLowerCase().includes(q);
  });

  // Current batch for this lecture criteria if one exists
  const currentBatch = allBatches.find(b => 
    b.branch === branch &&
    b.semester === semester &&
    b.section === section &&
    b.subject_name === subject &&
    b.lecture_date === date
  );

  // Batch is locked if submitted and in review or approved
  const isLocked = Boolean(
    currentBatch && 
    currentBatch.status !== 'Returned for Correction' && 
    currentBatch.status !== 'Draft'
  );

  // Local Attendance State (mutually exclusive: Present, Absent, Leave)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Leave'>>(() => {
    const existingBatch = dataStore.getAttendanceBatches().find(b => 
      b.branch === branch &&
      b.semester === semester &&
      b.section === section &&
      b.subject_name === subject &&
      b.lecture_date === date
    );

    if (existingBatch && existingBatch.records && existingBatch.records.length > 0) {
      const map: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
      existingBatch.records.forEach(r => {
        map[r.student_id] = r.status;
      });
      return map;
    }

    const existing = dataStore.getAttendance().filter(a => a.date === date && a.subject_name === subject);
    const map: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
    displayStudents.forEach(s => {
      const match = existing.find(e => e.student_id === s.id);
      if (match) {
        map[s.id] = (match.status === 'Leave' ? 'Leave' : match.status === 'Absent' ? 'Absent' : 'Present');
      } else {
        map[s.id] = 'Present';
      }
    });
    return map;
  });

  // Dynamic QR Session State
  const [qrSession, setQrSession] = useState<DynamicSessionState | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(6);
  const [liveScanLogs, setLiveScanLogs] = useState<LiveScanLogEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reload batches when criteria change or events fire
  const loadBatches = async () => {
    try {
      const batches = await apiService.getAttendanceBatches();
      setAllBatches(batches);
    } catch (e) {
      console.warn('Attendance batches load fallback:', e);
      setAllBatches(dataStore.getAttendanceBatches());
    }
  };

  useEffect(() => {
    loadBatches();
    const handleSync = () => loadBatches();
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-attendance-batch-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-attendance-batch-updated', handleSync);
    };
  }, []);

  // Update attendanceMap when lecture criteria or current batch changes
  useEffect(() => {
    const existingBatch = allBatches.find(b => 
      b.branch === branch &&
      b.semester === semester &&
      b.section === section &&
      b.subject_name === subject &&
      b.lecture_date === date
    );

    if (existingBatch && existingBatch.records && existingBatch.records.length > 0) {
      const map: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
      existingBatch.records.forEach(r => {
        map[r.student_id] = r.status;
      });
      setAttendanceMap(map);
    } else {
      const existing = dataStore.getAttendance().filter(a => a.date === date && a.subject_name === subject);
      const map: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
      displayStudents.forEach(s => {
        const match = existing.find(e => e.student_id === s.id);
        if (match) {
          map[s.id] = (match.status === 'Leave' ? 'Leave' : match.status === 'Absent' ? 'Absent' : 'Present');
        } else {
          map[s.id] = 'Present';
        }
      });
      setAttendanceMap(map);
    }
  }, [branch, semester, section, subject, date, allBatches]);

  // Subject code helper
  const getSubjectCode = () => {
    const matched = authorizedSubjects.find(s => s.subject_name === subject);
    if (matched && matched.subject_code) return matched.subject_code;
    if (subject === 'Mathematics') return 'CS-601';
    if (subject === 'Physics') return 'CS-602';
    if (subject === 'BEE') return 'CS-603';
    if (subject === 'Communication') return 'CS-604';
    if (subject === 'EVS') return 'CS-605';
    if (subject === 'Machine Learning Foundations') return 'AI-401';
    if (subject === 'Data Structures & Algorithms') return 'AI-402';
    return 'CS-601';
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
      facultyName,
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

    startDynamicSession();

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          const refreshed = attendanceService.startOrRefreshSession({
            subjectName: subject,
            subjectCode: getSubjectCode(),
            semester,
            branch,
            section,
            facultyId: teacherId,
            facultyName,
          });
          setQrSession(refreshed);
          return 6;
        }
        return prev - 1;
      });
    }, 1000);

    const unsubscribe = attendanceService.subscribe((event) => {
      if (event.type === 'SCAN_RECEIVED' || event.type === 'OVERRIDE_APPROVED') {
        const active = attendanceService.getActiveSession();
        if (active) {
          const updatedLogs = attendanceService.getSessionLogs(active.sessionId);
          setLiveScanLogs([...updatedLogs]);
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

  // Toggle single student status (Present, Absent, Leave)
  const handleToggle = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    if (isLocked) {
      toast.warning('Attendance Locked', 'This attendance record has been submitted and is locked against modifications.');
      return;
    }
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  // Safe Mark All with Confirmation check
  const requestMarkAll = (status: 'Present' | 'Absent' | 'Leave') => {
    if (isLocked) {
      toast.warning('Attendance Locked', 'This attendance record has been submitted and is locked against modifications.');
      return;
    }
    setPendingBulkStatus(status);
    setShowBulkConfirmModal(true);
  };

  const executeMarkAll = () => {
    if (!pendingBulkStatus) return;
    const map: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
    displayStudents.forEach(s => {
      map[s.id] = pendingBulkStatus;
    });
    setAttendanceMap(map);
    setShowBulkConfirmModal(false);
    toast.info('Roster Updated', `Marked all ${displayStudents.length} students as ${pendingBulkStatus}.`);
    setPendingBulkStatus(null);
  };

  // Clear / Unmark All
  const handleClearAll = () => {
    if (isLocked) {
      toast.warning('Attendance Locked', 'Cannot clear submitted attendance.');
      return;
    }
    setAttendanceMap({});
    toast.info('Roster Reset', 'Cleared all student status selections.');
  };

  // Dynamic Headcounts
  const totalCount = displayStudents.length;
  const presentCount = displayStudents.filter(s => attendanceMap[s.id] === 'Present').length;
  const absentCount = displayStudents.filter(s => attendanceMap[s.id] === 'Absent').length;
  const leaveCount = displayStudents.filter(s => attendanceMap[s.id] === 'Leave').length;
  const notMarkedCount = displayStudents.filter(s => !attendanceMap[s.id]).length;

  const verifiedScansCount = liveScanLogs.filter(l => l.status === 'verified').length;
  const flaggedScansCount = liveScanLogs.filter(l => l.status === 'flagged').length;
  const invalidScansCount = liveScanLogs.filter(l => l.status === 'invalid').length;

  // Validate criteria before submission
  const validateSubmission = (): boolean => {
    const errors: string[] = [];

    if (!department?.trim()) errors.push('Department selection is required.');
    if (!branch?.trim()) errors.push('Branch selection is required.');
    if (!semester) errors.push('Semester selection is required.');
    if (!section?.trim()) errors.push('Section selection is required.');
    if (!subject?.trim()) errors.push('Subject selection is required.');
    if (!date?.trim()) errors.push('Lecture date is required.');
    if (!teacherId || !facultyName) errors.push('Authenticated faculty identity is required.');
    if (displayStudents.length === 0) errors.push('Student roster is empty for selected class criteria.');

    const unmarkedStudents = displayStudents.filter(s => !attendanceMap[s.id]);
    if (unmarkedStudents.length > 0) {
      errors.push(
        `${unmarkedStudents.length} student(s) remain unmarked: ${unmarkedStudents.slice(0, 5).map(s => `${s.roll_no} (${s.name})`).join(', ')}${unmarkedStudents.length > 5 ? '...' : ''}`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Open Preview Modal
  const handleOpenPreview = () => {
    const isValid = validateSubmission();
    if (!isValid) {
      setShowValidationModal(true);
      return;
    }
    setShowPreviewModal(true);
  };

  // Open confirmation modal or display validation errors
  const handleInitiateSubmit = () => {
    if (isLocked) {
      toast.warning('Attendance Locked', `This batch (${currentBatch?.id}) is already under ${currentBatch?.status}.`);
      return;
    }

    const isValid = validateSubmission();
    if (!isValid) {
      setShowValidationModal(true);
      return;
    }

    setShowPreviewModal(false);
    setShowConfirmModal(true);
  };

  // Final submission of attendance batch to HOD
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    const records: AttendanceBatchRecord[] = displayStudents.map(s => ({
      student_id: s.id,
      student_roll: s.roll_no,
      student_name: s.name,
      status: attendanceMap[s.id] || 'Present'
    }));

    const result = await apiService.submitAttendanceBatch({
      department,
      branch,
      semester,
      section,
      subject_id: `sub-${branch.toLowerCase()}-${semester}`,
      subject_name: subject,
      subject_code: getSubjectCode(),
      lecture_date: date,
      faculty_id: teacherId,
      faculty_name: facultyName,
      records,
      comments: submissionComments.trim() || undefined
    });

    setSubmitting(false);

    if (result.success && result.batch) {
      toast.success(
        'Attendance Submitted to HOD',
        `Batch ${result.batch.id} routed to Head of Department for Stage 2 Review (${presentCount} Present, ${absentCount} Absent, ${leaveCount} Leave).`
      );
      setSubmissionComments('');
      await loadBatches();
    } else {
      toast.error('Submission Failed', result.error || 'Server rejected attendance submission. Please try again.');
    }
  };

  // Save Draft Workflow
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    const records: AttendanceBatchRecord[] = displayStudents.map(s => ({
      student_id: s.id,
      student_roll: s.roll_no,
      student_name: s.name,
      status: attendanceMap[s.id] || 'Present'
    }));

    const result = await apiService.saveAttendanceDraft({
      department,
      branch,
      semester,
      section,
      subject_id: `sub-${branch.toLowerCase()}-${semester}`,
      subject_name: subject,
      subject_code: getSubjectCode(),
      lecture_date: date,
      faculty_id: teacherId,
      faculty_name: facultyName,
      records,
      comments: submissionComments.trim() || undefined
    });

    setSavingDraft(false);

    if (result.success && result.batch) {
      toast.success('Draft Saved', `Batch ${result.batch.id} saved as draft. You may resume editing anytime before HOD submission.`);
      await loadBatches();
    } else {
      toast.error('Draft Save Failed', result.error || 'Could not save attendance draft.');
    }
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
    toast.success('Attendance Override Approved', 'Student marked present and verified by faculty.');
  };

  // QR Payload
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

  // Strict Monochrome status badge helper
  const getBatchStatusBadge = (status: string) => {
    switch (status) {
      case 'Final Approved':
      case 'Approved':
        return 'bg-black text-white border-black font-extrabold';
      case 'Pending HOD Approval':
      case 'Submitted to HOD':
      case 'Pending Principal Approval':
      case 'Pending MD Approval':
        return 'bg-neutral-200 text-neutral-900 border-neutral-400 font-bold';
      case 'Returned for Correction':
      case 'Returned by HOD':
      case 'Returned by Principal':
      case 'Rejected':
        return 'bg-neutral-100 text-neutral-900 border-neutral-400 font-bold underline';
      case 'Draft':
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300 font-medium';
    }
  };

  // Empty State if no authorized teaching assignments allocated
  if (authorizedSubjects.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in font-sans">
        <div className="p-8 text-center bg-white rounded-2xl border border-neutral-300 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center mx-auto text-black">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-black">No Teaching Assignments Allocated</h3>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            Your faculty profile has no authorized course, branch, or semester allocations configured yet. Please contact the Head of Department (HOD) or Academic Dean to assign your teaching duties.
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-mono font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              Faculty ID: {teacherId} • {facultyName}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* 1. Header with Title & Action Tabs (Strict Monochrome Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-black" />
            <span>Classroom Attendance Directorate</span>
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Mark attendance, launch 30m geofenced dynamic QR, or track Faculty → HOD → Principal → MD approval status
          </p>
        </div>

        {/* Top Tab Toggle - Pure Black/White Monochrome */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-300">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <span>Manual Register</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dynamic_qr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dynamic_qr'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Dynamic QR (30m)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('risk_insights')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'risk_insights'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Risk Insights</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'batches'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Workflow History ({allBatches.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Active Batch Status Banner (Strict Monochrome) */}
      {currentBatch && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
          currentBatch.status === 'Returned for Correction'
            ? 'bg-neutral-100 border-neutral-400 text-black'
            : currentBatch.status === 'Final Approved' || currentBatch.status === 'Approved'
            ? 'bg-neutral-50 border-black text-black'
            : 'bg-neutral-50 border-neutral-300 text-black'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-white border border-neutral-400">
                {currentBatch.id}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBatchStatusBadge(currentBatch.status)}`}>
                {currentBatch.status}
              </span>
              {isLocked && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-800">
                  <Lock className="w-3 h-3 text-black" /> Locked
                </span>
              )}
            </div>

            {currentBatch.status === 'Returned for Correction' ? (
              <p className="font-medium text-xs text-black">
                <strong>Returned by {currentBatch.rejected_by_role?.toUpperCase()} ({currentBatch.rejected_by_name || 'Reviewer'}):</strong> {currentBatch.rejection_reason || 'Correction requested.'} You may modify the roster below and resubmit.
              </p>
            ) : (
              <p className="text-[11px] text-neutral-700">
                Submitted on {formatIndiaDateTime(currentBatch.submitted_at)} • {currentBatch.present_count} Present, {currentBatch.absent_count} Absent, {currentBatch.leave_count} Leave.
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold shrink-0">
            <span className="px-2.5 py-1 rounded-md bg-white border border-neutral-400 text-black uppercase">
              Stage: {currentBatch.current_stage.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* 3. Authorized Teaching Assignment Filters */}
      <div className="p-4 bg-white rounded-2xl border border-neutral-300 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-800 border-b border-neutral-200 pb-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-black" />
            <span>Authorized Course & Lecture Teaching Criteria:</span>
          </div>
          {activeTab === 'dynamic_qr' && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-black bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-300">
              <Radio className="w-3 h-3 text-black animate-pulse" />
              Live Dynamic Broadcast
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Academic Programme */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Academic Programme
            </label>
            <div className="w-full text-xs font-bold bg-neutral-100 border border-neutral-300 rounded-xl px-2.5 py-2 text-black">
              {programme}
            </div>
          </div>

          {/* 2. Institutional Department */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Department
            </label>
            <div className="w-full text-xs font-bold bg-neutral-100 border border-neutral-300 rounded-xl px-2.5 py-2 text-black">
              {department}
            </div>
          </div>

          {/* 3. Authorized Branch */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Teaching Branch
            </label>
            <select
              value={branch}
              onChange={e => {
                const b = e.target.value;
                setBranch(b);
                const sems = Array.from(new Set(authorizedSubjects.filter(s => s.branch === b).map(s => s.semester)));
                if (sems.length > 0) setSemester(sems[0]);
              }}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-black text-black"
            >
              {authorizedBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 4. Authorized Semester */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Teaching Semester
            </label>
            <select
              value={semester}
              onChange={e => setSemester(Number(e.target.value))}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-black text-black"
            >
              {availableSemesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* 5. Section */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Section
            </label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-black text-black"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* 6. Authorized Subject */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Assigned Subject
            </label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-black text-black"
            >
              {availableSubjectsForCohort.length > 0 ? (
                availableSubjectsForCohort.map(s => (
                  <option key={s.id} value={s.subject_name}>
                    {s.subject_name} ({s.subject_code})
                  </option>
                ))
              ) : (
                <option value={subject}>{subject} ({getSubjectCode()})</option>
              )}
            </select>
          </div>
        </div>

        {/* Date Row & Lecture Information */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-neutral-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-neutral-600">Lecture Date:</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-black text-black"
            />
          </div>

          <div className="text-[11px] text-neutral-600 font-medium">
            Assigned Faculty: <strong className="text-black">{facultyName}</strong> ({teacherId})
          </div>
        </div>

        {/* 4. Live Attendance Counters & Bulk Action Controls (Strict Monochrome) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2.5 border-t border-neutral-200 text-xs">
          {/* Live Headcount Counters */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="text-neutral-700 font-medium">
              Total Roster: <strong className="text-black">{totalCount}</strong>
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-black font-extrabold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" /> {presentCount} Present
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-800 font-bold flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-neutral-700" /> {absentCount} Absent
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-800 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-700" /> {leaveCount} On Leave
            </span>
            {notMarkedCount > 0 && (
              <>
                <span className="text-neutral-400">•</span>
                <span className="text-black font-extrabold bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-400">
                  {notMarkedCount} Not Marked
                </span>
              </>
            )}
          </div>

          {/* Mark All Buttons */}
          {activeTab === 'manual' && (
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => requestMarkAll('Present')}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black font-bold text-[11px] transition cursor-pointer disabled:opacity-50"
              >
                Mark All Present
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => requestMarkAll('Absent')}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black font-bold text-[11px] transition cursor-pointer disabled:opacity-50"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => requestMarkAll('Leave')}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black font-bold text-[11px] transition cursor-pointer disabled:opacity-50"
              >
                Mark All Leave
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 font-bold text-[11px] transition cursor-pointer disabled:opacity-50"
                title="Clear marked statuses"
              >
                <RotateCcw className="w-3 h-3 inline mr-1" />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: MANUAL REGISTER VIEW (Strict Black-and-White Theme) */}
      {activeTab === 'manual' && (
        <div className="space-y-3">
          {/* Instant Student Roster Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="Search student by name or roll number (e.g. CSE001, Aarav Sharma)..."
              className="w-full pl-10 pr-24 py-2.5 text-xs rounded-xl border border-neutral-300 bg-white text-black focus:outline-none focus:border-black"
            />
            {studentSearch ? (
              <button
                type="button"
                onClick={() => setStudentSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-500 hover:text-black cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-mono">
                {searchedStudents.length} of {displayStudents.length} students
              </span>
            )}
          </div>

          {/* Student Roster List: Responsive with Complete Student Names */}
          {searchedStudents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-300 text-xs text-neutral-500">
              No students found matching &quot;{studentSearch}&quot;.
            </div>
          ) : (
            <div className="space-y-2.5">
              {searchedStudents.map((s, idx) => {
                const status = attendanceMap[s.id];

                return (
                  <div
                    key={s.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                      status === 'Present'
                        ? 'bg-white border-neutral-400 shadow-2xs'
                        : status === 'Absent'
                        ? 'bg-neutral-50 border-neutral-400 shadow-2xs'
                        : status === 'Leave'
                        ? 'bg-neutral-50 border-neutral-400 shadow-2xs'
                        : 'bg-white border-dashed border-neutral-300'
                    }`}
                  >
                    {/* Student Identification Section - Full Complete Name Visible, Unclipped, Wrapped */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="w-6 text-center text-xs font-mono font-bold text-neutral-400 pt-0.5 shrink-0">
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-black bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-300 shrink-0">
                            {s.roll_no}
                          </span>
                          <h4 className="font-bold text-sm sm:text-base text-black break-words leading-snug whitespace-normal">
                            {s.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-600 font-medium flex-wrap">
                          <span>{s.branch}</span>
                          <span>•</span>
                          <span>Sem {s.semester}</span>
                          <span>•</span>
                          <span>Sec {s.section}</span>
                          {status ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ml-1 bg-black text-white">
                              {status}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-800 ml-1">
                              Not Marked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3 Attendance Controls (Present, Absent, Leave) - Strict Monochrome styling */}
                    <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl shrink-0 self-stretch md:self-auto justify-end">
                      {/* Present Button: Black when selected, white with grey border when unselected */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleToggle(s.id, 'Present')}
                        className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border ${
                          status === 'Present'
                            ? 'bg-black text-white border-black font-bold shadow-xs'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:border-black font-medium'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>

                      {/* Absent Button */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleToggle(s.id, 'Absent')}
                        className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border ${
                          status === 'Absent'
                            ? 'bg-black text-white border-black font-bold shadow-xs'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:border-black font-medium'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>

                      {/* Leave Button */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleToggle(s.id, 'Leave')}
                        className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border ${
                          status === 'Leave'
                            ? 'bg-black text-white border-black font-bold shadow-xs'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:border-black font-medium'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Leave</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. Prominent Action Strip: Save Draft, Preview Attendance, Submit Attendance to HOD */}
          <div className="pt-4 border-t border-neutral-300 bg-white p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-black" />
                <h4 className="text-sm font-extrabold text-black">
                  Formal Attendance Submission & Multi-Stage Governance
                </h4>
              </div>
              <p className="text-xs text-neutral-600 max-w-xl">
                Attendance workflow:{' '}
                <strong className="text-black">
                  Faculty Submitted → HOD Approval → Principal Approval → MD Final Approval
                </strong>.
              </p>
              {notMarkedCount > 0 && (
                <p className="text-[11px] font-bold text-neutral-900">
                  ⚠️ Action required: {notMarkedCount} student(s) remain unmarked in the roster.
                </p>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2.5 shrink-0">
              {/* 1. Save Draft */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || isLocked}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 text-neutral-700" />
                <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>

              {/* 2. Preview Attendance */}
              <button
                type="button"
                onClick={handleOpenPreview}
                disabled={isLocked}
                className="px-4 py-2.5 bg-white hover:bg-neutral-100 border border-neutral-400 text-black rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-black" />
                <span>Preview Attendance</span>
              </button>

              {/* 3. Submit Attendance to HOD */}
              <button
                type="button"
                onClick={handleInitiateSubmit}
                disabled={submitting || isLocked}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer ${
                  isLocked
                    ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                    : currentBatch?.status === 'Returned for Correction'
                    ? 'bg-black text-white hover:bg-neutral-800'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting 
                    ? 'Submitting to HOD...' 
                    : isLocked 
                    ? 'Attendance Locked' 
                    : currentBatch?.status === 'Returned for Correction'
                    ? 'Resubmit Corrected Attendance'
                    : 'Submit Attendance to HOD'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC QR SESSION VIEW (Monochrome) */}
      {activeTab === 'dynamic_qr' && qrSession && (
        <div className="space-y-4">
          <div className="p-4 bg-black text-white rounded-2xl border border-neutral-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                <h3 className="text-sm font-extrabold text-white">
                  30m Classroom Geofence Active: {qrSession.roomName}
                </h3>
              </div>
              <p className="text-xs text-neutral-300">
                Center Coordinates: <code className="font-mono text-white">32.2190000° N, 76.2708000° E</code> • Radius: <strong className="text-white">30 Meters</strong> • Max GPS Uncertainty: <strong className="text-white">20 Meters</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center justify-center bg-neutral-900 px-3.5 py-2 rounded-xl border border-neutral-700">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Dynamic Token</span>
                <span className="text-lg font-mono font-black text-white flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                  {secondsRemaining}s
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-neutral-300 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-neutral-100 text-neutral-900 border border-neutral-300 uppercase tracking-wider">
                  Smart Board Classroom Display
                </span>
                <h4 className="text-base font-extrabold text-black">
                  {subject} ({getSubjectCode()})
                </h4>
                <p className="text-xs text-neutral-600">
                  Semester {semester} • Section {section} • Room C-101
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-inner border border-neutral-300">
                <DynamicQRCodeCanvas value={qrPayload} size={220} />
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-bold text-neutral-800">
                  Students scan using Student Portal Classroom Scanner
                </p>
                <p className="text-[11px] text-neutral-500">
                  Rotates dynamic token every 6s to prevent screenshot proxies.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-neutral-300 text-center">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Verified (≤30m)</span>
                  <span className="text-2xl font-black text-black">{verifiedScansCount}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-300 text-center">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Flagged (&gt;20m)</span>
                  <span className="text-2xl font-black text-neutral-800">{flaggedScansCount}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-300 text-center">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Invalid (&gt;30m)</span>
                  <span className="text-2xl font-black text-neutral-500">{invalidScansCount}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-300 overflow-hidden shadow-xs">
                <div className="p-3 border-b border-neutral-200 flex items-center justify-between text-xs font-bold text-black">
                  <span>Live Incoming Scans ({liveScanLogs.length})</span>
                  <span className="text-[11px] text-neutral-500 font-normal">Real-time GPS validation</span>
                </div>

                <div className="divide-y divide-neutral-200 max-h-72 overflow-y-auto">
                  {liveScanLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 space-y-1">
                      <QrCode className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p className="font-semibold text-black">Waiting for student classroom scans...</p>
                      <p className="text-[11px]">Scans within 30m of Room C-101 will appear here in real time.</p>
                    </div>
                  ) : (
                    liveScanLogs.map(log => (
                      <div key={log.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-black bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">
                              {log.studentRoll}
                            </span>
                            <span className="font-extrabold text-black truncate">
                              {log.studentName}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-0.5">
                            Dist: <strong className="text-black">{log.distanceMeters.toFixed(1)}m</strong> • Accuracy: ±{log.accuracyMeters.toFixed(1)}m • {log.timestamp}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {log.status === 'verified' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black text-white flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              {log.manualOverride ? 'Overridden' : 'Present'}
                            </span>
                          )}

                          {log.status === 'flagged' && (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-black border border-neutral-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Flagged
                              </span>
                              <button
                                type="button"
                                onClick={() => handleApproveFlagged(log.studentId)}
                                className="px-2 py-1 rounded-lg bg-black text-white font-bold text-[10px] shadow-xs transition"
                              >
                                Approve
                              </button>
                            </div>
                          )}

                          {log.status === 'invalid' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-neutral-600" />
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

      {/* TAB 3: ATTENDANCE RISK INSIGHTS VIEW (Strict Monochrome) */}
      {activeTab === 'risk_insights' && (
        <div className="bg-white border border-neutral-300 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-black" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-black">
                  Course Attendance Risk Roster ({subject} • {branch} Sem {semester})
                </h3>
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                Explainable rule-based intelligence based on 75% statutory requirement
              </p>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              Assigned Faculty View
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-300">
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
              <tbody className="divide-y divide-neutral-200">
                {displayStudents.map((s) => {
                  const studentAttendance = dataStore.getAttendance().filter(
                    a => a.student_id === s.id && (a.subject_name === subject || a.subject_id?.includes(branch.toLowerCase()))
                  );
                  const conducted = studentAttendance.length > 0 ? studentAttendance.length : 17;
                  const attended = studentAttendance.length > 0 
                    ? studentAttendance.filter(a => a.status === 'Present').length
                    : (s.roll_no === 'CSE001' ? 12 : s.roll_no === 'CSE002' ? 10 : 15);

                  const risk = calculateAttendanceRisk(attended, conducted, 75);

                  return (
                    <tr key={s.id} className="hover:bg-neutral-50 transition">
                      <td className="py-3 px-4 font-bold text-black">
                        {s.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-black">
                        {s.roll_no}
                      </td>
                      <td className="py-3 px-4 text-neutral-700">
                        {subject}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-black">
                          {risk.percentage.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          {attended}/{conducted} classes
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          risk.riskLevel === 'low'
                            ? 'bg-neutral-100 text-neutral-900 border-neutral-300'
                            : risk.riskLevel === 'medium'
                            ? 'bg-neutral-200 text-black border-neutral-400 font-bold'
                            : 'bg-black text-white border-black font-extrabold'
                        }`}>
                          {risk.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {risk.classesNeededForTarget > 0 ? (
                          <span className="font-bold text-black underline">
                            {risk.classesNeededForTarget} consecutive
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-neutral-600 max-w-xs">
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

      {/* TAB 4: BATCHES & APPROVAL WORKFLOW TRACKING (Strict Monochrome) */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-black">
                Attendance Submission Batches & Governance Timeline
              </h3>
              <p className="text-xs text-neutral-600">
                Track sequential approvals across Faculty → HOD → Principal → MD
              </p>
            </div>
            <button
              type="button"
              onClick={loadBatches}
              className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {allBatches.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-300 text-xs text-neutral-500">
              No attendance batches submitted yet. Mark attendance and submit to begin the approval sequence.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {allBatches.map(batch => (
                <div
                  key={batch.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-300 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-black bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                          {batch.id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBatchStatusBadge(batch.status)}`}>
                          {batch.status}
                        </span>
                        {batch.resubmission_count && batch.resubmission_count > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-black border border-neutral-300">
                            Rev #{batch.resubmission_count}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-black">
                        {batch.subject_name} ({batch.subject_code || 'CS-601'}) • {batch.branch} Sem {batch.semester} Sec {batch.section}
                      </h4>
                      <p className="text-[11px] text-neutral-600">
                        Lecture Date: <strong className="text-black">{batch.lecture_date}</strong> • Faculty: {batch.faculty_name} • Submitted: {formatIndiaDateTime(batch.submitted_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedBatchForDetails(batch)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Roster & Audit</span>
                      </button>
                    </div>
                  </div>

                  {/* 4-Stage Approval Progress Tracker (Monochrome) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                    {/* Stage 1: Faculty */}
                    <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300">
                      <span className="text-[10px] uppercase font-bold text-neutral-600 block">
                        1. Faculty
                      </span>
                      <span className="text-xs font-extrabold text-black flex items-center justify-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-black" /> Submitted
                      </span>
                    </div>

                    {/* Stage 2: HOD */}
                    <div className={`p-2.5 rounded-xl border ${
                      batch.status === 'Pending HOD Approval'
                        ? 'bg-neutral-100 border-black font-extrabold'
                        : ['Pending Principal Approval', 'Pending MD Approval', 'Approved', 'Final Approved'].includes(batch.status)
                        ? 'bg-neutral-100 border-neutral-300'
                        : batch.rejected_by_role === 'hod'
                        ? 'bg-neutral-50 border-neutral-400'
                        : 'bg-white border-neutral-200'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-neutral-600 block">
                        2. HOD Review
                      </span>
                      <span className="text-xs font-bold text-black flex items-center justify-center gap-1 mt-0.5">
                        {batch.status === 'Pending HOD Approval'
                          ? 'In Review'
                          : ['Pending Principal Approval', 'Pending MD Approval', 'Approved', 'Final Approved'].includes(batch.status)
                          ? 'Approved'
                          : batch.rejected_by_role === 'hod'
                          ? 'Returned'
                          : 'Waiting'}
                      </span>
                    </div>

                    {/* Stage 3: Principal */}
                    <div className={`p-2.5 rounded-xl border ${
                      batch.status === 'Pending Principal Approval'
                        ? 'bg-neutral-100 border-black font-extrabold'
                        : ['Pending MD Approval', 'Approved', 'Final Approved'].includes(batch.status)
                        ? 'bg-neutral-100 border-neutral-300'
                        : batch.rejected_by_role === 'principal'
                        ? 'bg-neutral-50 border-neutral-400'
                        : 'bg-white border-neutral-200'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-neutral-600 block">
                        3. Principal
                      </span>
                      <span className="text-xs font-bold text-black flex items-center justify-center gap-1 mt-0.5">
                        {batch.status === 'Pending Principal Approval'
                          ? 'In Review'
                          : ['Pending MD Approval', 'Approved', 'Final Approved'].includes(batch.status)
                          ? 'Approved'
                          : batch.rejected_by_role === 'principal'
                          ? 'Returned'
                          : 'Waiting'}
                      </span>
                    </div>

                    {/* Stage 4: MD */}
                    <div className={`p-2.5 rounded-xl border ${
                      batch.status === 'Pending MD Approval'
                        ? 'bg-neutral-100 border-black font-extrabold'
                        : ['Approved', 'Final Approved'].includes(batch.status)
                        ? 'bg-black text-white border-black'
                        : batch.rejected_by_role === 'md'
                        ? 'bg-neutral-50 border-neutral-400'
                        : 'bg-white border-neutral-200'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold block ${['Approved', 'Final Approved'].includes(batch.status) ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        4. MD Sign-off
                      </span>
                      <span className={`text-xs font-bold flex items-center justify-center gap-1 mt-0.5 ${['Approved', 'Final Approved'].includes(batch.status) ? 'text-white' : 'text-black'}`}>
                        {batch.status === 'Pending MD Approval'
                          ? 'In Review'
                          : ['Approved', 'Final Approved'].includes(batch.status)
                          ? 'Final Approved'
                          : batch.rejected_by_role === 'md'
                          ? 'Returned'
                          : 'Waiting'}
                      </span>
                    </div>
                  </div>

                  {/* Rejection / Remarks notice if returned */}
                  {batch.rejection_reason && (
                    <div className="p-3 bg-neutral-100 border border-neutral-400 rounded-xl text-xs text-black space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-black shrink-0" />
                        <span>Returned by {batch.rejected_by_role?.toUpperCase()}:</span>
                      </div>
                      <p className="pl-5 text-[11px] leading-relaxed">
                        &quot;{batch.rejection_reason}&quot;
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. PREVIEW ATTENDANCE MODAL (New Requirement: Preview Attendance) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-400 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-black text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-white" />
                <h3 className="text-base font-extrabold">Attendance Summary Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Lecture Details Grid */}
              <div className="p-3.5 bg-neutral-100 rounded-xl space-y-2 border border-neutral-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-neutral-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Programme</span>
                    <strong className="text-black">{programme}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Department</span>
                    <strong className="text-black">{department}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Cohort</span>
                    <strong className="text-black">{branch} Sem {semester} (Sec {section})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Date</span>
                    <strong className="text-black">{date}</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-neutral-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Subject</span>
                    <strong className="text-black">{subject} ({getSubjectCode()})</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Instructor</span>
                    <strong className="text-black">{facultyName}</strong>
                  </div>
                </div>
              </div>

              {/* Headcount Stat Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300">
                  <span className="text-[10px] uppercase font-bold text-neutral-600 block">Total Enrolled</span>
                  <span className="text-xl font-black text-black">{totalCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-black">
                  <span className="text-[10px] uppercase font-bold text-neutral-800 block">Present</span>
                  <span className="text-xl font-black text-black">{presentCount}</span>
                  <span className="text-[9px] text-neutral-600 block font-bold">{totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300">
                  <span className="text-[10px] uppercase font-bold text-neutral-600 block">Absent</span>
                  <span className="text-xl font-black text-black">{absentCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300">
                  <span className="text-[10px] uppercase font-bold text-neutral-600 block">Leave</span>
                  <span className="text-xl font-black text-black">{leaveCount}</span>
                </div>
              </div>

              {/* Roster Table */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-black mb-1.5">
                  Full Student Register ({displayStudents.length} Students)
                </h4>
                <div className="border border-neutral-300 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-300">
                      <tr>
                        <th className="p-2">Roll No</th>
                        <th className="p-2">Student Name</th>
                        <th className="p-2">Branch / Sec</th>
                        <th className="p-2 text-right">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {displayStudents.map(s => {
                        const st = attendanceMap[s.id];
                        return (
                          <tr key={s.id} className="hover:bg-neutral-50">
                            <td className="p-2 font-mono font-bold text-black">{s.roll_no}</td>
                            <td className="p-2 font-bold text-black whitespace-normal break-words">{s.name}</td>
                            <td className="p-2 text-neutral-600">{s.branch} - Sec {s.section}</td>
                            <td className="p-2 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                st === 'Present'
                                  ? 'bg-black text-white'
                                  : st === 'Absent'
                                  ? 'bg-neutral-200 text-black border border-neutral-400'
                                  : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                              }`}>
                                {st || 'Unmarked'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-neutral-100 border-t border-neutral-300 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-300 text-black text-xs font-bold transition hover:bg-neutral-200 cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleInitiateSubmit}
                className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Proceed to Submit to HOD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRMATION DIALOG MODAL (Submit to HOD) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-400 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-black text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-white" />
                <h3 className="text-base font-extrabold">Confirm Attendance Submission to HOD</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-neutral-100 rounded-xl space-y-2 border border-neutral-300">
                <div className="grid grid-cols-2 gap-2 text-neutral-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Course & Subject</span>
                    <strong className="text-black">{subject} ({getSubjectCode()})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Class Cohort</span>
                    <strong className="text-black">{branch} Sem {semester} (Sec {section})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Lecture Date</span>
                    <strong className="text-black">{date}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Faculty Member</span>
                    <strong className="text-black">{facultyName}</strong>
                  </div>
                </div>
              </div>

              {/* Roster Breakdown Stats */}
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1.5">
                  Marked Attendance Summary
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total</span>
                    <span className="text-lg font-black text-black">{totalCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-black">
                    <span className="text-[10px] uppercase font-bold text-neutral-800 block">Present</span>
                    <span className="text-lg font-black text-black">{presentCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300">
                    <span className="text-[10px] uppercase font-bold text-neutral-600 block">Absent</span>
                    <span className="text-lg font-black text-black">{absentCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300">
                    <span className="text-[10px] uppercase font-bold text-neutral-600 block">Leave</span>
                    <span className="text-lg font-black text-black">{leaveCount}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Routing Note */}
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-xl flex items-start gap-2.5 text-neutral-800">
                <Info className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Upon submission, this batch will be assigned a unique Batch ID and forwarded to the <strong>Head of Department (HOD)</strong> for review. The record will be protected against modifications while in review.
                </p>
              </div>

              {/* Faculty Notes/Comments */}
              <div>
                <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                  Optional Faculty Notes / Remarks
                </label>
                <textarea
                  value={submissionComments}
                  onChange={e => setSubmissionComments(e.target.value)}
                  placeholder="e.g. Conducted extra numerical derivation problems; student verified on medical leave..."
                  rows={2}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 focus:outline-none focus:border-black text-black"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-neutral-100 border-t border-neutral-300 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-300 text-black text-xs font-bold transition hover:bg-neutral-200 cursor-pointer"
              >
                Review & Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Submit to HOD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. BULK MARK CONFIRMATION MODAL */}
      {showBulkConfirmModal && pendingBulkStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-400 shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Confirm Bulk Status Update</h3>
              <button
                type="button"
                onClick={() => setShowBulkConfirmModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <p className="text-neutral-800 leading-relaxed">
                Are you sure you want to mark all <strong>{displayStudents.length}</strong> students in this cohort as <strong>{pendingBulkStatus}</strong>? This will update any individually marked records.
              </p>
            </div>
            <div className="p-3.5 bg-neutral-100 border-t border-neutral-300 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-neutral-300 text-black text-xs font-bold hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeMarkAll}
                className="px-4 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
              >
                Confirm Mark All {pendingBulkStatus}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. VALIDATION ERROR MODAL */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-400 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-extrabold">Incomplete Attendance Requirements</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="font-semibold text-black">
                Please resolve the following before proceeding:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-neutral-800">
                {validationErrors.map((err, i) => (
                  <li key={i} className="leading-snug">
                    {err}
                  </li>
                ))}
              </ul>
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-xl text-[11px] text-neutral-800">
                Every enrolled student must be marked as <strong>Present</strong>, <strong>Absent</strong>, or <strong>Leave</strong>. Partial or incomplete registers cannot enter institutional review.
              </div>
            </div>

            <div className="p-3.5 bg-neutral-100 border-t border-neutral-300 text-right">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold transition hover:bg-neutral-800 cursor-pointer"
              >
                Back to Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. BATCH DETAILS & AUDIT ROSTER MODAL (Strict Monochrome) */}
      {selectedBatchForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-400 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 bg-black text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-800 border border-neutral-600">
                    {selectedBatchForDetails.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBatchStatusBadge(selectedBatchForDetails.status)}`}>
                    {selectedBatchForDetails.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold mt-1">
                  {selectedBatchForDetails.subject_name} • {selectedBatchForDetails.branch} Sem {selectedBatchForDetails.semester} ({selectedBatchForDetails.lecture_date})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBatchForDetails(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Batch Roster Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total</span>
                  <span className="text-base font-extrabold text-black">{selectedBatchForDetails.total_students}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-black text-black">
                  <span className="text-[10px] uppercase font-bold block">Present</span>
                  <span className="text-base font-extrabold">{selectedBatchForDetails.present_count}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300 text-black">
                  <span className="text-[10px] uppercase font-bold block">Absent</span>
                  <span className="text-base font-extrabold">{selectedBatchForDetails.absent_count}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300 text-black">
                  <span className="text-[10px] uppercase font-bold block">Leave</span>
                  <span className="text-base font-extrabold">{selectedBatchForDetails.leave_count}</span>
                </div>
              </div>

              {/* Audit Timeline */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-black mb-2">
                  Governance Audit Trail
                </h4>
                <div className="space-y-2 border-l-2 border-neutral-300 pl-3 ml-2">
                  {selectedBatchForDetails.history.map((h, i) => (
                    <div key={h.id || i} className="space-y-0.5 relative">
                      <div className="w-2 h-2 rounded-full bg-black absolute -left-[17px] top-1" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-black uppercase font-bold text-[11px]">
                          {h.action} by {h.actor_role} ({h.actor_name})
                        </strong>
                        <span className="text-[10px] text-neutral-500">
                          {formatIndiaDateTime(h.created_at)}
                        </span>
                      </div>
                      {h.comments && (
                        <p className="text-[11px] text-neutral-700 italic">
                          &quot;{h.comments}&quot;
                        </p>
                      )}
                      {h.rejection_reason && (
                        <p className="text-[11px] text-black font-bold">
                          Reviewer Remarks: {h.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Roster Table */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-black mb-2">
                  Student Marked Roster ({selectedBatchForDetails.records.length})
                </h4>
                <div className="border border-neutral-300 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 font-bold border-b border-neutral-300">
                      <tr>
                        <th className="p-2.5 text-black">Roll No</th>
                        <th className="p-2.5 text-black">Student Full Name</th>
                        <th className="p-2.5 text-black">Status</th>
                        <th className="p-2.5 text-black">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {selectedBatchForDetails.records.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-mono font-bold text-black">
                            {r.student_roll}
                          </td>
                          <td className="p-2.5 font-bold text-black break-words">
                            {r.student_name}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              r.status === 'Present'
                                ? 'bg-black text-white'
                                : r.status === 'Absent'
                                ? 'bg-neutral-200 text-black border border-neutral-400'
                                : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-[11px] text-neutral-600">
                            {r.remarks || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-100 border-t border-neutral-300 text-right shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBatchForDetails(null)}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold transition hover:bg-neutral-800 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
