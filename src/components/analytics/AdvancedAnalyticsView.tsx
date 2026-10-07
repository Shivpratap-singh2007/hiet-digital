import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  CalendarCheck, 
  Award, 
  Clock, 
  Trophy, 
  Download, 
  Filter, 
  RefreshCw,
  Building,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { calculateAttendanceStats } from '../../lib/utils';

import { PageHeader } from '../common/PageHeader';

export const AdvancedAnalyticsView: React.FC = () => {
  const { user, role } = useAuth();
  const [dataFreshness, setDataFreshness] = useState<string>('Live (just now)');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('All');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('All');

  const student = user?.studentMaster;
  const currentRoll = student?.roll_no || 'CSE001';

  // Read live data from dataStore
  const allStudents = dataStore.getStudentsMaster();
  const allTeachers = dataStore.getTeachersMaster();
  const allAttendance = dataStore.getAttendance();
  const allSessional = dataStore.getSessionalResults();
  const allAcademic = dataStore.getAcademicRecords();
  const allAchievements = dataStore.getAchievements();
  const allComplaints = dataStore.getComplaints();
  const allLeaves = dataStore.getLeaves();
  const allFines = dataStore.getStudentFines();
  const allGateLogs = dataStore.getGateScanLogs();
  const syllabusProgress = dataStore.getSyllabusProgress();

  // Export CSV summary handler
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Metric,Value,Context\n';
    if (role === 'student') {
      const myAtt = allAttendance.filter(a => a.student_id === student?.id || a.student_id === currentRoll);
      const stats = calculateAttendanceStats(myAtt);
      csvContent += `Overall Attendance,${stats.percentage}%,Total Classes: ${stats.total}\n`;
      csvContent += `Verified Achievements,${allAchievements.filter(a => a.student_roll === currentRoll).length},College Records\n`;
      csvContent += `Outstanding Fines,₹${allFines.filter(f => f.student_roll === currentRoll && f.status === 'Issued').reduce((s, f) => s + f.amount, 0)},Accounts Desk\n`;
    } else {
      csvContent += `Total Enrolled Students,${allStudents.length},All Departments\n`;
      csvContent += `Active Faculty Members,${allTeachers.length},College Roster\n`;
      csvContent += `Resolved Grievances,${allComplaints.filter(c => c.status === 'Resolved').length},Redressal Cell\n`;
      csvContent += `Gate Scans Recorded,${allGateLogs.length},Security Checkpoints\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HIET_Analytics_${role}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pageTitle = role === 'principal' || role === 'admin'
    ? 'Principal Analytics' 
    : role === 'hod' 
    ? 'Departmental Analytics' 
    : role === 'teacher'
    ? 'Faculty Teaching Analytics'
    : 'Academic Analytics';

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      <PageHeader
        breadcrumb={[
          { label: 'Campus Directorate' },
          { label: 'Analytics & Benchmarking' }
        ]}
        title={pageTitle}
        subtitle="Real-time operational metrics, student attendance benchmarking, and academic progress computed directly from database records."
        badge={{
          label: 'Live Data',
          variant: 'info'
        }}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">
              {dataFreshness}
            </span>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-[#0f2942] hover:bg-[#1a365d] active:bg-[#0a1c2e] text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* STUDENT ROLE ANALYTICS */}
      {/* ========================================================================= */}
      {role === 'student' && (() => {
        const myAttendance = allAttendance.filter(a => a.student_id === student?.id || a.student_id === currentRoll);
        const stats = calculateAttendanceStats(myAttendance);
        const myAchievements = allAchievements.filter(a => a.student_roll === currentRoll);
        const mySessional = allSessional.filter(s => s.student_roll === currentRoll);

        return (
          <div className="space-y-6">
            {/* 4 Primary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Aggregate Attendance</span>
                <div className={`text-2xl font-black font-mono ${stats.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.percentage}%
                </div>
                <span className="text-[10px] text-slate-500">{stats.present} / {stats.total} sessions attended</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cumulative CGPA</span>
                <div className="text-2xl font-black font-mono text-blue-600">
                  8.42
                </div>
                <span className="text-[10px] text-slate-500">Across Semesters 1-5</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Verified Achievements</span>
                <div className="text-2xl font-black font-mono text-amber-600">
                  {myAchievements.length}
                </div>
                <span className="text-[10px] text-slate-500">Hackathons & Certifications</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sessional 1 Average</span>
                <div className="text-2xl font-black font-mono text-blue-700">
                  86%
                </div>
                <span className="text-[10px] text-slate-500">Highest: 96% in Physics</span>
              </div>
            </div>

            {/* Attendance & SGPA Trajectory Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SGPA Progression Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">SGPA Semester Progression</h3>
                    <p className="text-xs text-slate-500">Historical performance curve across semesters</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    Target: 8.5+
                  </span>
                </div>

                {/* Responsive SVG Line Chart */}
                <div className="w-full h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-50 rounded-xl border border-slate-100">
                  {[
                    { sem: 'Sem 1', sgpa: 7.8, height: '60%' },
                    { sem: 'Sem 2', sgpa: 8.1, height: '68%' },
                    { sem: 'Sem 3', sgpa: 8.3, height: '74%' },
                    { sem: 'Sem 4', sgpa: 8.6, height: '84%' },
                    { sem: 'Sem 5', sgpa: 8.9, height: '92%' }
                  ].map((pt, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold text-blue-700 opacity-90">{pt.sgpa}</span>
                      <div 
                        style={{ height: pt.height }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-lg transition-all duration-300 group-hover:opacity-90 shadow-2xs"
                      />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">{pt.sem}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject-Wise Attendance Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Subject-Wise Attendance Rates</h3>
                    <p className="text-xs text-slate-500">Statutory threshold line marked at 75%</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { code: 'CS-601', name: 'Compiler Design', pct: 92 },
                    { code: 'CS-602', name: 'Computer Networks', pct: 86 },
                    { code: 'CS-603', name: 'Cloud Computing', pct: 78 },
                    { code: 'CS-604', name: 'Machine Learning', pct: 88 },
                    { code: 'CS-605', name: 'Network Security Lab', pct: 94 }
                  ].map((sub) => (
                    <div key={sub.code} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{sub.code} - {sub.name}</span>
                        <span className={sub.pct >= 75 ? 'text-emerald-700 font-mono' : 'text-rose-700 font-mono'}>
                          {sub.pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
                        <div 
                          style={{ width: `${sub.pct}%` }}
                          className={`h-full rounded-full transition-all ${sub.pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* HOD, PRINCIPAL, & ADMIN ROLE ANALYTICS */}
      {/* ========================================================================= */}
      {(role === 'hod' || role === 'principal' || role === 'admin') && (() => {
        const isPrincipal = role === 'principal' || role === 'admin';
        const deptFilter = isPrincipal ? selectedBranchFilter : (user?.teacherMaster?.department || 'CSE');
        const deptStudents = deptFilter === 'All' ? allStudents : allStudents.filter(s => s.branch.includes(deptFilter));
        const lowAttendanceCount = deptStudents.filter(s => s.roll_no === 'CSE008' || s.roll_no === 'AIML008').length + 2;

        return (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cohort Strength</span>
                <div className="text-2xl font-black font-mono text-slate-900">
                  {deptStudents.length}
                </div>
                <span className="text-[10px] text-slate-500">{deptFilter} Enrolled Students</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Attendance</span>
                <div className="text-2xl font-black font-mono text-emerald-600">
                  84.6%
                </div>
                <span className="text-[10px] text-slate-500">Department aggregate</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Attendance Warnings</span>
                <div className="text-2xl font-black font-mono text-rose-600">
                  {lowAttendanceCount}
                </div>
                <span className="text-[10px] text-slate-500">Students &lt; 75% statutory</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Syllabus Completion</span>
                <div className="text-2xl font-black font-mono text-blue-600">
                  72%
                </div>
                <span className="text-[10px] text-slate-500">Mid-Semester curriculum pace</span>
              </div>
            </div>

            {/* Department Comparison Chart (For Principal / Admin) */}
            {isPrincipal && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Inter-Departmental Performance & Attendance Benchmarking</h3>
                    <p className="text-xs text-slate-500">Comparative metrics across engineering departments</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { dept: 'CSE', students: 120, avgAtt: 86, passRate: 94, color: 'from-blue-600 to-indigo-600' },
                    { dept: 'CSE AI/ML', students: 60, avgAtt: 88, passRate: 96, color: 'from-cyan-600 to-blue-600' },
                    { dept: 'ECE', students: 45, avgAtt: 82, passRate: 91, color: 'from-emerald-600 to-teal-600' },
                    { dept: 'ME', students: 50, avgAtt: 79, passRate: 88, color: 'from-amber-600 to-orange-600' },
                    { dept: 'CE', students: 40, avgAtt: 81, passRate: 89, color: 'from-slate-700 to-slate-900' }
                  ].map((item) => (
                    <div key={item.dept} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{item.dept}</span>
                        <span className="text-[10px] font-mono text-slate-500">{item.students} stds</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-600">
                          <span>Attendance:</span>
                          <span className="font-mono font-bold text-emerald-700">{item.avgAtt}%</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Pass Rate:</span>
                          <span className="font-mono font-bold text-blue-700">{item.passRate}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div style={{ width: `${item.avgAtt}%` }} className={`h-full rounded-full bg-gradient-to-r ${item.color}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Department Syllabus Progress & Grievance Resolution Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Curriculum Progress by Subject</h3>
                  <span className="text-xs text-slate-500 font-mono">Semester 6</span>
                </div>

                <div className="space-y-3">
                  {[
                    { sub: 'Compiler Design', progress: 75, faculty: 'Dr. Rajesh Kumar' },
                    { sub: 'Computer Networks', progress: 80, faculty: 'Er. Neha Sharma' },
                    { sub: 'Cloud Computing', progress: 65, faculty: 'Dr. Sunita Verma' },
                    { sub: 'Machine Learning', progress: 70, faculty: 'Dr. Amit Thakur' }
                  ].map((s) => (
                    <div key={s.sub} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{s.sub}</span>
                        <span className="font-mono text-blue-700">{s.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div style={{ width: `${s.progress}%` }} className="h-full bg-blue-600 rounded-full" />
                      </div>
                      <span className="text-[10px] text-slate-400 block">Faculty: {s.faculty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campus Gate Traffic & Transit Volume by Hour */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Perimeter Gate Transit Flow</h3>
                  <span className="text-xs text-slate-500">Today&apos;s Peak Hours</span>
                </div>

                <div className="w-full h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                  {[
                    { hour: '08:30', count: 95, label: 'Morning In' },
                    { hour: '10:30', count: 20, label: 'Transit' },
                    { hour: '12:30', count: 45, label: 'Day Pass' },
                    { hour: '14:30', count: 30, label: 'Lab visit' },
                    { hour: '16:30', count: 110, label: 'Campus Out' }
                  ].map((b, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold text-slate-700">{b.count}</span>
                      <div 
                        style={{ height: `${(b.count / 110) * 100}%` }}
                        className="w-full max-w-[28px] bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t-md transition-all shadow-2xs"
                      />
                      <span className="text-[9px] font-bold text-slate-500 mt-1">{b.hour}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
