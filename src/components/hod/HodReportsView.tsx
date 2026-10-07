import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  CheckCircle2, 
  FileText, 
  Download, 
  Users,
  ShieldAlert,
  Percent
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { calculateAttendanceStats } from '../../lib/utils';

export const HodReportsView: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'attendance' | 'sessional' | 'cgpa' | 'complaints'>('attendance');

  const students = dataStore.getStudentsMaster();
  const attendance = dataStore.getAttendance();
  const sessionalResults = dataStore.getSessionalResults();
  const complaints = dataStore.getComplaints();

  // Attendance Defaulters
  const attendanceReports = students.map(s => {
    const records = attendance.filter(a => a.student_id === s.id);
    const stats = calculateAttendanceStats(records);
    return {
      student: s,
      attended: stats.present,
      total: stats.total,
      percentage: stats.percentage,
      isShortage: stats.percentage < 75
    };
  });

  const defaulters = attendanceReports.filter(r => r.isShortage);

  // Complaints breakdown
  const anonComplaints = complaints.filter(c => c.is_anonymous);
  const confComplaints = complaints.filter(c => !c.is_anonymous);
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-1.5 border border-purple-100">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Departmental Analytics & Reports</span>
          <span>•</span>
          <span>HIET Shahpur</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Academic Audit & Compliance Reports
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          HOD executive reports covering attendance compliance, sessional scores, CGPA metrics, and grievance resolution.
        </p>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveReport('attendance')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeReport === 'attendance'
              ? 'bg-white text-purple-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Attendance Shortage ({defaulters.length})</span>
        </button>

        <button
          onClick={() => setActiveReport('sessional')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeReport === 'sessional'
              ? 'bg-white text-purple-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Sessional Results</span>
        </button>

        <button
          onClick={() => setActiveReport('cgpa')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeReport === 'cgpa'
              ? 'bg-white text-purple-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>CGPA & Grades</span>
        </button>

        <button
          onClick={() => setActiveReport('complaints')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeReport === 'complaints'
              ? 'bg-white text-purple-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Grievance Audit</span>
        </button>
      </div>

      {/* 1. Attendance Shortage Report */}
      {activeReport === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Attendance Defaulters List (&lt;75% Attendance)
              </h3>
              <p className="text-xs text-slate-500">Students facing university exam debarment risk.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
              {defaulters.length} Students At Risk
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Roll No</th>
                  <th className="px-4 py-2.5">Student Name</th>
                  <th className="px-4 py-2.5">Branch</th>
                  <th className="px-4 py-2.5">Attendance</th>
                  <th className="px-4 py-2.5">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defaulters.map(r => (
                  <tr key={r.student.id} className="hover:bg-rose-50/40 transition">
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{r.student.roll_no}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{r.student.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.student.branch}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-rose-600">{r.percentage}%</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Defaulter Warning Sent
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Sessional Exam Scores Report */}
      {activeReport === 'sessional' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs p-4 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Sessional Examination Performance Summary
            </h3>
            <p className="text-xs text-slate-500">Internal evaluation across core engineering courses.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Mathematics</span>
              <div className="text-xl font-black text-amber-900 mt-1">18.4 / 25 Avg</div>
              <p className="text-[11px] text-amber-700">73.6% Class Average</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Applied Physics</span>
              <div className="text-xl font-black text-blue-900 mt-1">20.8 / 25 Avg</div>
              <p className="text-[11px] text-blue-700">83.2% Class Average</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">BEE</span>
              <div className="text-xl font-black text-emerald-900 mt-1">19.5 / 25 Avg</div>
              <p className="text-[11px] text-emerald-700">78.0% Class Average</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. CGPA & Grades Report */}
      {activeReport === 'cgpa' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs p-4 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Academic CGPA Standing Distribution
            </h3>
            <p className="text-xs text-slate-500">University semester credit performance.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-2xl font-black text-emerald-700">65%</div>
              <div className="text-xs font-bold text-slate-800 mt-1">&gt; 8.0 CGPA</div>
              <span className="text-[10px] text-slate-500">Distinction</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <div className="text-2xl font-black text-blue-700">25%</div>
              <div className="text-xs font-bold text-slate-800 mt-1">7.0 - 7.9 CGPA</div>
              <span className="text-[10px] text-slate-500">First Class</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-2xl font-black text-amber-700">8%</div>
              <div className="text-xs font-bold text-slate-800 mt-1">6.0 - 6.9 CGPA</div>
              <span className="text-[10px] text-slate-500">Second Class</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-2xl font-black text-slate-700">2%</div>
              <div className="text-xs font-bold text-slate-800 mt-1">&lt; 6.0 CGPA</div>
              <span className="text-[10px] text-slate-500">Remedial Class</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Grievance Audit Report */}
      {activeReport === 'complaints' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs p-4 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600" />
              Grievance & Complaint Audit
            </h3>
            <p className="text-xs text-slate-500">
              Audit breakdown of confidential vs anonymous complaints and resolution SLAs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-600">Total Grievances</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{complaints.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {confComplaints.length} Confidential • {anonComplaints.length} Anonymous
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800">Resolved / Closed</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">{resolvedCount}</div>
              <div className="text-[11px] text-emerald-700 mt-1">Within 48h campus SLA</div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-xs font-bold text-purple-800">Under Review</span>
              <div className="text-2xl font-black text-purple-900 mt-1">{complaints.length - resolvedCount}</div>
              <div className="text-[11px] text-purple-700 mt-1">Active HOD/Admin review</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
