import React from 'react';
import { 
  CalendarCheck, 
  Award, 
  Clock, 
  BookOpen, 
  FileQuestion, 
  Sliders, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { calculateAttendanceStats } from '../../lib/utils';
import { NavTab } from '../common/Sidebar';

interface Props {
  onNavigate: (tab: NavTab) => void;
}

export const AcademicsHubView: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const studentRoll = student?.roll_no || 'CSE001';
  const studentId = user?.student_id || 'std-cse-001';

  // Attendance stats
  const myAttendance = dataStore.getAttendance().filter(a => a.student_id === studentId || a.student_id === 'std-cse-001');
  const stats = calculateAttendanceStats(myAttendance);

  // Timetable
  const timetable = dataStore.getTimetable().filter(t => t.day === 'Monday');
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const activeClass = timetable.find(t => {
    const start = t.start_hour_24 * 60 + t.start_minute;
    const end = t.end_hour_24 * 60 + t.end_minute;
    return currentMinutes >= start && currentMinutes < end;
  }) || timetable[0];

  // Sessional sample
  const sessionalResults = dataStore.getSessionalResults().filter(r => r.student_roll === studentRoll);

  // Syllabus progress
  const progressList = dataStore.getSyllabusProgress();

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1.5 border border-blue-100">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Academic Portal</span>
          <span>•</span>
          <span>Semester {student?.semester || 6} ({student?.branch || 'CSE'})</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Academics & Performance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Access your classroom attendance, examination scores, course syllabus, and previous year papers.
        </p>
      </div>

      {/* Grid of Key Academic Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        
        {/* 1. Attendance Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                Attendance Ledger
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                stats.percentage >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {stats.percentage}% Overall
              </span>
            </div>

            <div className="space-y-1.5 my-3">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.percentage >= 75 ? 'bg-blue-600' : 'bg-rose-500'
                  }`}
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{stats.present} / {stats.total} sessions attended</span>
                <span>Threshold: 75%</span>
              </div>
            </div>

            {stats.percentage < 75 && (
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5 mb-2 border border-rose-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>⚠️ Low Attendance Notice active</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('attendance')}
            className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200 group-hover:border-blue-200 transition"
          >
            <span>View Subject-wise Attendance</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 2. CGPA & Semester Grades */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Cumulative GPA
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                8.72 CGPA
              </span>
            </div>

            <div className="my-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Current Semester SGPA:</span>
                <span className="font-bold text-slate-900">8.85 (Sem 5)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">University Standing:</span>
                <span className="font-bold text-emerald-600">First Class with Distinction</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('cgpa')}
            className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200 group-hover:border-emerald-200 transition"
          >
            <span>Semester-wise Grade History</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 3. Sessional Exam Results */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Sessional Exam Scores
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                Mid-Term
              </span>
            </div>

            <div className="my-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-700 font-medium">Mathematics</span>
                <span className="font-mono font-bold text-slate-900">18 / 25 (72%)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-700 font-medium">Physics</span>
                <span className="font-mono font-bold text-slate-900">21 / 25 (84%)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700 font-medium">BEE</span>
                <span className="font-mono font-bold text-slate-900">20 / 25 (80%)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('sessional_results' as any)}
            className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-amber-50 text-amber-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200 group-hover:border-amber-200 transition"
          >
            <span>Full Sessional 1 & 2 Results</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 4. Real-time Timetable */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600" />
                Live Timetable
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 animate-pulse">
                NOW ACTIVE
              </span>
            </div>

            <div className="my-2 p-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-xs text-purple-900">{activeClass?.subject_name}</h4>
                  <p className="text-[11px] text-purple-700">{activeClass?.room_number || activeClass?.room_no || 'Room 204'} • {activeClass?.teacher_name || activeClass?.faculty_name || 'Faculty'}</p>
                </div>
                <span className="font-mono text-xs font-bold text-purple-800">
                  {activeClass?.start_time} - {activeClass?.end_time}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('timetable' as any)}
            className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-purple-50 text-purple-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200 group-hover:border-purple-200 transition"
          >
            <span>Open Class Schedule</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 5. Syllabus Progress Tracker */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-600" />
                Syllabus Coverage
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200">
                Applied Physics
              </span>
            </div>

            <div className="my-2 space-y-1.5">
              {progressList.slice(0, 3).map(p => {
                const percentage = p.completion_percentage ?? p.progress_percentage ?? 50;
                const unitName = p.unit_name || p.unit_title || `Unit ${p.unit_number}`;
                return (
                  <div key={p.id} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-700 font-medium">Unit {p.unit_number}: {unitName}</span>
                      <span className="font-mono font-bold text-slate-800">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigate('syllabus_progress' as any)}
            className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-cyan-50 text-cyan-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200 group-hover:border-cyan-200 transition"
          >
            <span>Track All Subject Progress</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 6. Syllabus & PYQs (2026-2023) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileQuestion className="w-4 h-4 text-indigo-600" />
                Previous Year Papers (PYQ)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                2023–2026
              </span>
            </div>

            <p className="text-xs text-slate-600 my-2">
              Browse semester-wise university exam question papers and syllabus PDFs with offline download support.
            </p>
          </div>

          <button
            onClick={() => onNavigate('pyqs')}
            className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200 group-hover:border-indigo-200 transition"
          >
            <span>Search Syllabus & PYQ Vault</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};
