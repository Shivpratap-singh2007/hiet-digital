import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  UserCheck, 
  ShieldAlert, 
  Filter, 
  Calendar, 
  Search, 
  Download,
  AlertCircle,
  Building,
  Info,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { AttendanceReconciliationRecord } from '../../types';

export const AttendanceReconciliationView: React.FC = () => {
  const { user, role } = useAuth();
  const isAuthorized = role === 'hod' || role === 'principal' || role === 'admin';

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reconciliationDate, setReconciliationDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Read actual students, attendance records, and gate scan logs
  const students = dataStore.getStudentsMaster();
  const attendanceRecords = dataStore.getAttendance();
  const scanLogs = dataStore.getGateScanLogs();
  const timetable = dataStore.getTimetable();

  // Compute live reconciliation records
  const reconciliationRecords: AttendanceReconciliationRecord[] = students.map((student) => {
    // 1. Find gate logs for this student today
    const studentScans = scanLogs.filter(l => l.student_roll.toUpperCase() === student.roll_no.toUpperCase());
    const entryScan = studentScans.find(l => l.scan_direction === 'Entry');
    const exitScan = studentScans.find(l => l.scan_direction === 'Exit');

    let gateStatus: AttendanceReconciliationRecord['gate_status'] = 'No Gate Record';
    if (entryScan && !exitScan) {
      gateStatus = 'On Campus';
    } else if (entryScan && exitScan) {
      gateStatus = 'Exited';
    } else if (!entryScan && exitScan) {
      gateStatus = 'Exited';
    }

    // 2. Find student's academic attendance record
    const attRecord = attendanceRecords.find(a => a.student_id === student.id || a.student_id === student.roll_no);
    const classStatus: AttendanceReconciliationRecord['class_attendance_status'] = 
      attRecord?.status === 'Excused' ? 'Present' : (attRecord?.status as any || 'Present');

    // 3. Find first class time from timetable
    const studentSchedule = timetable.filter(t => t.branch === student.branch && t.semester === student.semester);
    const firstClass = studentSchedule[0];
    const firstClassTime = firstClass ? firstClass.start_time : '09:00 AM';

    // 4. Analyze discrepancies
    let discrepancyFlag: AttendanceReconciliationRecord['discrepancy_flag'] = 'None';
    let discrepancyDetails = 'Classroom attendance matches verified gate presence.';

    if (classStatus === 'Present' && !entryScan) {
      discrepancyFlag = 'Present_In_Class_No_Gate_Entry';
      discrepancyDetails = 'Student marked Present in lecture, but no security gate entry was logged today.';
    } else if (entryScan && classStatus === 'Absent') {
      discrepancyFlag = 'On_Campus_Absent_In_Class';
      discrepancyDetails = 'Student verified on campus through Main Gate 1, but marked Absent for scheduled lecture.';
    } else if (entryScan && entryScan.scanned_at.includes('12:')) {
      discrepancyFlag = 'Gate_Entry_After_Class';
      discrepancyDetails = 'Gate entry timestamp occurred after morning lecture start time.';
    }

    return {
      student_id: student.id,
      student_roll: student.roll_no,
      student_name: student.name,
      branch: student.branch,
      semester: student.semester,
      date: reconciliationDate,
      gate_entry_time: entryScan ? new Date(entryScan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      gate_exit_time: exitScan ? new Date(exitScan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      gate_status: gateStatus,
      first_class_time: firstClassTime,
      class_attendance_status: classStatus,
      discrepancy_flag: discrepancyFlag,
      discrepancy_details: discrepancyDetails
    };
  });

  // Apply filters
  const filteredRecords = reconciliationRecords.filter((rec) => {
    if (selectedBranch !== 'All' && rec.branch !== selectedBranch) return false;
    if (selectedSemester !== 'All' && rec.semester !== Number(selectedSemester)) return false;
    if (selectedDiscrepancy !== 'All' && rec.discrepancy_flag !== selectedDiscrepancy) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return rec.student_name.toLowerCase().includes(q) || rec.student_roll.toLowerCase().includes(q);
    }
    return true;
  });

  const discrepanciesCount = reconciliationRecords.filter(r => r.discrepancy_flag !== 'None').length;
  const onCampusCount = reconciliationRecords.filter(r => r.gate_status === 'On Campus').length;
  const presentInClassCount = reconciliationRecords.filter(r => r.class_attendance_status === 'Present').length;

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-3 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Restricted Access Module</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Campus Presence vs Lecture Attendance Reconciliation is restricted to authorized HODs, Principal, and College Administration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-5xl mx-auto pb-10">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Feature 4: Campus Presence vs Academic Attendance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Attendance & Gate Transit Reconciliation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Cross-reconcile perimeter security gate logs with departmental lecture attendance records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={reconciliationDate}
              onChange={(e) => setReconciliationDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Enrolled Cohort
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {students.length}
          </div>
          <span className="text-[10px] text-slate-500">Total verified students</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Verified On-Campus
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {onCampusCount}
          </div>
          <span className="text-[10px] text-slate-500">Perimeter gate check-in</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Lecture Attendance
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-600">
            {presentInClassCount}
          </div>
          <span className="text-[10px] text-slate-500">Marked present by teachers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Discrepancies Flagged
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {discrepanciesCount}
          </div>
          <span className="text-[10px] text-slate-500">Requires audit reconciliation</span>
        </div>
      </div>

      {/* Strict Architectural Boundary Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <div className="font-bold flex items-center gap-1.5 text-slate-800">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Institutional Privacy & Decoupling Governance</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          <strong>Non-Equivalence Rule:</strong> Perimeter gate entry records and classroom lecture attendance are stored as distinct datasets. A student entering campus is <em>never</em> automatically marked present in academic lectures. Location and entry records are retained for a 90-day statutory period and accessible strictly to designated Proctorial and HOD authorities.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
          >
            <option value="All">All Branches</option>
            <option value="CSE">B.Tech CSE</option>
            <option value="CSE AI/ML">B.Tech CSE AI/ML</option>
            <option value="ECE">B.Tech ECE</option>
            <option value="ME">B.Tech ME</option>
            <option value="CE">B.Tech CE</option>
          </select>

          {/* Semester Filter */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
          >
            <option value="All">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>

          {/* Discrepancy Filter */}
          <select
            value={selectedDiscrepancy}
            onChange={(e) => setSelectedDiscrepancy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
          >
            <option value="All">All Reconciliation States</option>
            <option value="None">No Discrepancy (Reconciled)</option>
            <option value="Present_In_Class_No_Gate_Entry">Present In Class, No Gate Log</option>
            <option value="On_Campus_Absent_In_Class">On Campus, Absent in Class</option>
            <option value="Gate_Entry_After_Class">Gate Entry After Class Started</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Reconciliation Records ({filteredRecords.length})
          </h3>
          <span className="text-xs text-slate-500">
            Date: <strong>{reconciliationDate}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold text-[11px]">
                <th className="py-2.5 px-2">Student</th>
                <th className="py-2.5 px-2">Gate Transit Log</th>
                <th className="py-2.5 px-2">Campus State</th>
                <th className="py-2.5 px-2">Lecture 1 Time</th>
                <th className="py-2.5 px-2">Class Attendance</th>
                <th className="py-2.5 px-2">Discrepancy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.student_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-2">
                    <span className="font-bold text-slate-900">{rec.student_name}</span>
                    <span className="block text-[10px] font-mono text-slate-500">
                      {rec.student_roll} • {rec.branch} (Sem {rec.semester})
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-700 font-mono text-[11px]">
                    {rec.gate_entry_time ? (
                      <span>In: {rec.gate_entry_time}</span>
                    ) : (
                      <span className="text-slate-400">No entry scan</span>
                    )}
                    {rec.gate_exit_time && (
                      <span className="block text-slate-500 text-[10px]">Out: {rec.gate_exit_time}</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.gate_status === 'On Campus'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rec.gate_status === 'Exited'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {rec.gate_status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-600 font-mono text-[11px]">
                    {rec.first_class_time}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.class_attendance_status === 'Present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.class_attendance_status === 'Absent'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.class_attendance_status}
                    </span>
                  </td>
                  <td className="py-3 px-2 max-w-xs">
                    {rec.discrepancy_flag === 'None' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Reconciled
                      </span>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          {rec.discrepancy_flag ? rec.discrepancy_flag.replace(/_/g, ' ') : 'None'}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{rec.discrepancy_details}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
