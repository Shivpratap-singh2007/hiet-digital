import React, { useState } from 'react';
import { Award, BookOpen, CheckCircle2, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { SessionalResult } from '../../types';

export const SessionalResultsView: React.FC = () => {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<'Sessional 1' | 'Sessional 2'>('Sessional 1');

  const studentRoll = user?.studentMaster?.roll_no || 'CSE001';
  const allResults = dataStore.getSessionalResults();
  
  // Filter for current student or fallback to CSE001 demo results
  const studentResults = allResults.filter(r => r.student_roll.toUpperCase() === studentRoll.toUpperCase());
  const displayResults = studentResults.length > 0 
    ? studentResults.filter(r => r.exam_type === selectedExam)
    : allResults.filter(r => r.exam_type === selectedExam && r.student_roll === 'CSE001');

  const totalMarksObtained = displayResults.reduce((acc, r) => acc + r.marks_obtained, 0);
  const totalMaxMarks = displayResults.reduce((acc, r) => acc + r.max_marks, 0);
  const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span>Sessional Exam Results</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal evaluation marks recorded by respective subject faculty
          </p>
        </div>

        {/* Exam Type Selector (Sessional 1 vs Sessional 2) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          {(['Sessional 1', 'Sessional 2'] as const).map(exam => (
            <button
              key={exam}
              onClick={() => setSelectedExam(exam)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedExam === exam
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {exam}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate Score Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 block">
              {selectedExam} • Aggregate Performance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black">{totalMarksObtained}</span>
              <span className="text-sm font-semibold text-blue-200">/ {totalMaxMarks} Marks</span>
            </div>
            <p className="text-xs text-blue-100/90 mt-1">
              Percentage: <strong className="text-white">{overallPercentage}%</strong>
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center backdrop-blur-sm">
            <span className="text-xl font-black text-amber-300">{overallPercentage}%</span>
            <span className="text-[9px] uppercase font-bold text-blue-200">Score</span>
          </div>
        </div>
      </div>

      {/* Subject-Wise Sessional Cards List */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Subject Breakdown:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayResults.map(res => {
            const isGood = res.percentage >= 75;
            return (
              <div 
                key={res.id} 
                className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {res.subject_name}
                      </h4>
                      {res.subject_code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                          {res.subject_code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {res.exam_type} • Max: {res.max_marks}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-slate-900 block">
                      {res.marks_obtained} <span className="text-xs font-normal text-slate-400">/ {res.max_marks}</span>
                    </span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {res.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isGood ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${res.percentage}%` }}
                  />
                </div>

                {res.remarks && (
                  <p className="text-[11px] text-slate-600 italic bg-slate-50 rounded-xl p-2 mt-2 border border-slate-100">
                    &ldquo;{res.remarks}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
