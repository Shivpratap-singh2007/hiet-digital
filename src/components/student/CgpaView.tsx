import React, { useState, useEffect, useMemo } from 'react';
import { Award, TrendingUp, BookOpen, GraduationCap, CheckCircle2, ChevronRight } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { apiService, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Grade } from '../../types';

export const CgpaView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || 'std-cse-001';

  const [grades, setGrades] = useState<Grade[]>(() =>
    !isSupabaseConfigured ? dataStore.getGrades().filter(g => g.student_id === studentId) : []
  );
  const [selectedSem, setSelectedSem] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  // Fetch from Supabase with dataStore fallback
  useEffect(() => {
    let isMounted = true;
    async function loadStudentGrades() {
      setLoading(true);
      try {
        const data = await apiService.getGrades(studentId);
        if (isMounted) {
          setGrades(data || []);
          if (data && data.length > 0) {
            const maxSem = Math.max(...data.map(g => g.semester));
            setSelectedSem(maxSem);
          }
        }
      } catch (err) {
        console.warn('Error loading student grades:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStudentGrades();
    return () => { isMounted = false; };
  }, [studentId]);

  // Distinct available semesters
  const availableSemesters = useMemo(() => {
    const semSet = new Set<number>(grades.map(g => g.semester));
    const sorted = Array.from(semSet).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : (isSupabaseConfigured ? [] : [1, 2, 3, 4, 5]);
  }, [grades]);

  // Semester-wise calculations
  const semesterStats = useMemo(() => {
    const stats: Record<number, { credits: number; points: number; sgpa: number }> = {};
    for (const sem of availableSemesters) {
      const semGrades = grades.filter(g => g.semester === sem);
      const totalCredits = semGrades.reduce((sum, g) => sum + (g.credits || 4.0), 0);
      const totalPoints = semGrades.reduce((sum, g) => sum + (g.grade_point * (g.credits || 4.0)), 0);
      const sgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
      stats[sem] = { credits: totalCredits, points: totalPoints, sgpa };
    }
    return stats;
  }, [grades, availableSemesters]);

  // Overall Cumulative CGPA calculation
  const cumulativeStats = useMemo(() => {
    const totalCredits = grades.reduce((sum, g) => sum + (g.credits || 4.0), 0);
    const totalPoints = grades.reduce((sum, g) => sum + (g.grade_point * (g.credits || 4.0)), 0);
    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return {
      totalCredits,
      cgpa: Math.round(cgpa * 100) / 100
    };
  }, [grades]);

  const currentSemGrades = grades.filter(g => g.semester === selectedSem);
  const currentSemSgpa = semesterStats[selectedSem]?.sgpa || 0;
  const prevSemSgpa = semesterStats[selectedSem - 1]?.sgpa || null;
  const sgpaDiff = prevSemSgpa !== null ? currentSemSgpa - prevSemSgpa : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-icon-float icon-glow-amber" />
          Academic Records & CGPA Portal
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Official Himachal Pradesh Technical University (HPTU) transcript & semester grade reports
        </p>
      </div>

      {/* Top CGPA & Academic Standing Hero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cumulative CGPA Card */}
        <div className="bg-gradient-to-br from-blue-800 to-blue-950 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">Cumulative CGPA</span>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl font-extrabold text-amber-400">
                {cumulativeStats.totalCredits > 0 ? cumulativeStats.cgpa.toFixed(2) : (loading ? '...' : '0.00')}
              </span>
              <span className="text-xs text-blue-200">/ 10.0 Scale</span>
            </div>
            <p className="text-xs text-blue-200/80 mt-3">
              {cumulativeStats.totalCredits === 0
                ? (loading ? 'Loading academic records...' : 'No semester grades recorded yet')
                : cumulativeStats.cgpa >= 8.0 
                ? 'First Class with Distinction Standing' 
                : cumulativeStats.cgpa >= 6.5 
                ? 'First Class Standing' 
                : 'Academic Standing Validated'}
            </p>
          </div>
          <Award className="w-24 h-24 text-white/5 absolute -right-4 -bottom-4 pointer-events-none" />
        </div>

        {/* Latest Semester SGPA */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
            Semester {selectedSem} SGPA
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {currentSemGrades.length > 0 ? currentSemSgpa.toFixed(2) : (loading ? '...' : '0.00')}
            </span>
            <span className="text-xs text-slate-400">/ 10.0</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>
              {grades.length === 0
                ? 'Awaiting semester publishing'
                : sgpaDiff !== null
                ? `${sgpaDiff >= 0 ? '+' : ''}${sgpaDiff.toFixed(2)} vs Semester ${selectedSem - 1}`
                : `Official SGPA for Sem ${selectedSem}`}
            </span>
          </div>
        </div>

        {/* Total Earned Credits */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
            Completed Degree Credits
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-blue-700 dark:text-blue-400">
              {cumulativeStats.totalCredits}
            </span>
            <span className="text-xs text-slate-400">/ 160 Total</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            {grades.length === 0 ? 'No grade records on file' : '0 Active Backlogs • Verified Course Clearances'}
          </p>
        </div>
      </div>

      {/* Semester History Track */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
          Semester Progression & SGPA Timeline
        </h3>

        {availableSemesters.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No semester records available yet. Grades will appear once published by faculty.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {availableSemesters.map(sem => {
              const semSgpa = semesterStats[sem]?.sgpa || 0;
              const isSelected = selectedSem === sem;
              return (
                <button
                  key={sem}
                  onClick={() => setSelectedSem(sem)}
                className={`p-3.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1">
                  <span>Semester {sem}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {semSgpa > 0 ? semSgpa.toFixed(2) : '--'}
                </div>
                <span className="text-[10px] text-slate-400">SGPA</span>
              </button>
            );
          })}
        </div>
      )}
    </div>

      {/* Grade Details Table for Selected Semester */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Semester {selectedSem} Course Grade Card
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Official evaluation transcript from HPTU</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            SGPA: {currentSemSgpa > 0 ? currentSemSgpa.toFixed(2) : '--'}
          </span>
        </div>

        {/* Mobile View: Cards (< sm) */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700/50 p-3 space-y-2">
          {currentSemGrades.map((sub) => (
            <div key={sub.id} className="p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 w-full">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-xs">
                    {sub.subject_code}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                    {sub.subject_name}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                  {sub.letter_grade}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span>Marks: <strong className="text-slate-800 dark:text-slate-200">{sub.marks}/100</strong></span>
                <span>Credits: <strong className="text-slate-800 dark:text-slate-200">{sub.credits}</strong></span>
                <span>GP: <strong className="text-slate-800 dark:text-slate-200 font-mono">{sub.grade_point}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">PASSED</span>
              </div>
            </div>
          ))}
          {currentSemGrades.length === 0 && (
            <p className="text-xs text-center text-slate-400 py-4">No course records found for Semester {selectedSem}.</p>
          )}
        </div>

        {/* Desktop View: Table (>= sm) */}
        <div className="hidden sm:block overflow-x-auto w-full min-w-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Course Code</th>
                <th className="px-4 py-3">Course Title</th>
                <th className="px-4 py-3 text-center">Credits</th>
                <th className="px-4 py-3 text-center">Marks (100)</th>
                <th className="px-4 py-3 text-center">Letter Grade</th>
                <th className="px-4 py-3 text-center">Grade Point</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {currentSemGrades.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                  <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-400">{sub.subject_code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{sub.subject_name}</td>
                  <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">{sub.credits}</td>
                  <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">{sub.marks}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {sub.letter_grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">{sub.grade_point}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">PASSED</span>
                  </td>
                </tr>
              ))}
              {currentSemGrades.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-xs">
                    No course records found for Semester {selectedSem}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
