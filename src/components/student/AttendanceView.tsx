import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, CheckCircle2, XCircle, Clock, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { calculateAttendanceStats } from '../../lib/utils';
import { AttendanceRecord } from '../../types';

export const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || 'std-210101';
  const subjects = dataStore.getSubjects().filter(s => s.branch === (user?.studentMaster?.branch || 'CSE'));
  
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>(() => 
    dataStore.getAttendance().filter(a => a.student_id === studentId)
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    let isMounted = true;
    apiService.getAttendance({ studentId }).then(records => {
      if (isMounted && records && records.length > 0) {
        setAllAttendance(records);
      }
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, [studentId]);

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

  const filteredRecords = selectedSubject === 'all'
    ? allAttendance
    : allAttendance.filter(a => a.subject_id === selectedSubject || a.subject_code === selectedSubject);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-blue-700 dark:text-blue-400 animate-icon-float icon-glow-cyan" />
          Academic Attendance Portal
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time tracking of lecture hours, lab sessions, and 75% statutory eligibility criteria
        </p>
      </div>

      {/* 75% Attendance Statutory Warning Banner */}
      {overallStats.isWarning && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-icon-wiggle icon-glow-amber" />
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Attendance Alert: Below HPTU Mandatory 75% Cut-off
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              Your overall attendance is currently <strong className="underline">{overallStats.percentage}%</strong>. As per Himachal Pradesh Technical University and HIET guidelines, you must maintain at least 75% in each registered course to be eligible to appear for the end-semester examinations. Please contact your respective course coordinator.
            </p>
          </div>
        </div>
      )}

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition w-full min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Percentage</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${overallStats.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {overallStats.percentage}%
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {overallStats.percentage >= 75 ? 'Eligible' : 'Warning'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${overallStats.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, overallStats.percentage)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition w-full min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Present Classes</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {overallStats.present}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-icon-heartbeat icon-glow-emerald" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Lectures & labs attended</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition w-full min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Absent Classes</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {overallStats.absent}
            </span>
            <XCircle className="w-5 h-5 text-rose-500 animate-icon-wiggle icon-glow-rose" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Unexcused missed hours</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition w-full min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sessions</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">
              {overallStats.total}
            </span>
            <BookOpen className="w-5 h-5 text-blue-500 animate-icon-float-delayed icon-glow-cyan" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Conducted this semester</p>
        </div>
      </div>

      {/* Subject-Wise Breakdown Cards */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs w-full">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
          Subject-Wise Attendance Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
          {subjectStats.map(item => (
            <div 
              key={item.subject.id} 
              className={`p-3.5 sm:p-4 rounded-xl border transition w-full min-w-0 ${
                item.isWarning 
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20' 
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                    {item.subject.subject_code}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {item.subject.subject_name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Instructor: {item.subject.teacher_name || 'Faculty Member'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-xl font-extrabold ${item.isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {item.percentage}%
                  </div>
                  {item.isWarning ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" /> Shortage
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Satisfactory
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-2 flex-wrap gap-1">
                <span>Present: <strong className="text-slate-800 dark:text-slate-200">{item.present}</strong></span>
                <span>Absent: <strong className="text-slate-800 dark:text-slate-200">{item.absent}</strong></span>
                <span>Total: <strong className="text-slate-800 dark:text-slate-200">{item.total}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Log Table / Mobile Cards */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs w-full">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Daily Attendance History Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Filtered session records</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">Filter:</span>
            <select
              value={selectedSubject}
              onChange={e => { setSelectedSubject(e.target.value); setPage(1); }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 max-w-full"
            >
              <option value="all">All Subjects ({allAttendance.length} records)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile View: Cards list (< sm) */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700/50 p-2.5 space-y-2">
          {pagedRecords.map(rec => (
            <div key={rec.id} className="p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 w-full">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                    {rec.subject_code}
                  </span>
                  <span className="text-[11px] text-slate-400">{rec.date}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-1">
                  {rec.subject_name || 'Class Lecture'}
                </h4>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] shrink-0 ${
                rec.status === 'Present'
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
              }`}>
                {rec.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {rec.status}
              </span>
            </div>
          ))}
        </div>

        {/* Tablet & Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto max-h-80 w-full min-w-0">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Course Code</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {pagedRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{rec.date}</td>
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{rec.subject_name || 'Class Lecture'}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{rec.subject_code}</td>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredRecords.length > pageSize && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
            <span>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 px-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
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
