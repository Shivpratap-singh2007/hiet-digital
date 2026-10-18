import React, { useState } from 'react';
import { 
  Calculator, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Sliders, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { NavTab } from '../common/Sidebar';
import { campusLifeStore, INITIAL_HPTU_INTERNAL_SCORES } from '../../lib/campusLifeData';
import { HptuInternalScore } from '../../types';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const InternalMarksCalculatorView: React.FC<Props> = ({ onNavigate: _onNavigate }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const studentRoll = student?.roll_no || '26CSE001';

  const [subjects] = useState<HptuInternalScore[]>(
    campusLifeStore.getHptuInternalScores(studentRoll)
  );

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(subjects[0]?.subject_code || 'CS-601');

  // Simulation Sliders for What-If Analysis
  const activeSubject = subjects.find(s => s.subject_code === selectedSubjectCode) || subjects[0] || INITIAL_HPTU_INTERNAL_SCORES[0];
  
  const [simMst1, setSimMst1] = useState<number>(activeSubject.mst1_marks);
  const [simMst2, setSimMst2] = useState<number>(activeSubject.mst2_marks);
  const [simAssignment, setSimAssignment] = useState<number>(activeSubject.assignments_marks);
  const [simAttendance, setSimAttendance] = useState<number>(activeSubject.attendance_percentage);

  // Sync sliders when subject changes
  const handleSelectSubject = (code: string) => {
    setSelectedSubjectCode(code);
    const sub = subjects.find(s => s.subject_code === code);
    if (sub) {
      setSimMst1(sub.mst1_marks);
      setSimMst2(sub.mst2_marks);
      setSimAssignment(sub.assignments_marks);
      setSimAttendance(sub.attendance_percentage);
    }
  };

  // Live calculation based on HPTU formula
  const simResult = campusLifeStore.calculateHptuInternal(simMst1, simMst2, simAssignment, simAttendance);

  // Targets for 100-mark total (50 Internal + 60/50 External scaled to 100)
  // Passing: 40% aggregate (min 21/60 in theory)
  // 1st Division: 60% aggregate
  // Distinction: 75% aggregate
  const neededForPassing = simResult.minPassingTheory;
  const neededForFirstDiv = Math.max(21, Math.min(60, 60 - simResult.totalInternal));
  const neededForDistinction = Math.max(21, Math.min(60, 75 - simResult.totalInternal));

  // Overall Internal Average
  const totalInternalAvg = Math.round(
    subjects.reduce((acc, s) => acc + s.total_internal, 0) / subjects.length
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'HIET Digital Campus' },
          { label: 'Academics' },
          { label: 'HPTU Internal Calculator', active: true }
        ]}
        title="Internal Assessment & Exam Target Calculator"
        description="Official HPTU B.Tech internal marking formula (MST-1 + MST-2 + Assignments + Attendance Points)."
        badge="HPTU Ordinance 2026 Compliant"
      />

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Calculator}
          label="Subjects Tracked"
          value={subjects.length.toString()}
          badgeColor="blue"
          subtext="Semester 6 Core"
        />
        <StatCard
          icon={Award}
          label="Avg Internal Score"
          value={`${totalInternalAvg} / 50`}
          badgeColor="emerald"
          subtext={`${Math.round((totalInternalAvg / 50) * 100)}% Internal Grade`}
        />
        <StatCard
          icon={TrendingUp}
          label="Pass Status"
          value="All Cleared"
          badgeColor="emerald"
          subtext="Eligible for End-Term"
        />
        <StatCard
          icon={CheckCircle2}
          label="Attendance Criteria"
          value="75%+ Met"
          badgeColor="amber"
          subtext="Zero Detention Risk"
        />
      </div>

      {/* Main Calculator & Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Subject Selector & Simulation Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Subject What-If Simulator</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a subject and adjust marks to simulate your projected internal evaluation.
                </p>
              </div>

              {/* Subject Selector Dropdown */}
              <select
                value={selectedSubjectCode}
                onChange={e => handleSelectSubject(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map(s => (
                  <option key={s.subject_code} value={s.subject_code}>
                    {s.subject_code}: {s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Subject Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                  SELECTED SUBJECT
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {activeSubject.subject_code} • {activeSubject.subject_name}
                </h4>
                <span className="text-[11px] text-slate-600 font-medium">
                  {activeSubject.credits} Credits • Department of CSE
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Recorded Score</span>
                <span className="text-lg font-black text-blue-700">{activeSubject.total_internal} / 50</span>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="space-y-4 pt-1">
              {/* 1. MST-1 Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">
                    Mid-Semester Test 1 (MST-1)
                  </span>
                  <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {simMst1} / 15 Marks
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={simMst1}
                  onChange={e => setSimMst1(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] text-slate-400 block">Conducted in Week 6 of semester.</span>
              </div>

              {/* 2. MST-2 Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">
                    Mid-Semester Test 2 (MST-2)
                  </span>
                  <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {simMst2} / 15 Marks
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={simMst2}
                  onChange={e => setSimMst2(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] text-slate-400 block">Conducted in Week 12 of semester.</span>
              </div>

              {/* 3. Assignments & Tutorials Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">
                    Assignments, Quizzes & Lab Continuous Evaluation
                  </span>
                  <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {simAssignment} / 10 Marks
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={simAssignment}
                  onChange={e => setSimAssignment(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] text-slate-400 block">Continuous tutorial work and class tests.</span>
              </div>

              {/* 4. Attendance Percentage Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">
                    Class Attendance Percentage
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      simAttendance >= 85 ? 'bg-emerald-100 text-emerald-800' :
                      simAttendance >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      +{simResult.attendanceMarks} Attendance Points
                    </span>
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {simAttendance}%
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={simAttendance}
                  onChange={e => setSimAttendance(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    simAttendance >= 85 ? 'accent-emerald-600 bg-emerald-100' :
                    simAttendance >= 75 ? 'accent-amber-500 bg-amber-100' : 'accent-rose-500 bg-rose-100'
                  }`}
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>&lt;75% (0 pts & Detention)</span>
                  <span>75-79% (3 pts)</span>
                  <span>80-84% (4 pts)</span>
                  <span>≥85% (5 pts)</span>
                </div>
              </div>
            </div>

            {/* Attendance Alert if < 75% */}
            {simAttendance < 75 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <p>
                  <strong>Detention Warning:</strong> Attendance below 75% awards 0 bonus points and requires formal HPTU medical condonation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Projected Internal Score & End-Term Target (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Calculation Outcome Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0f2942] to-[#1e3a5f] text-white shadow-md relative overflow-hidden space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                  PROJECTED INTERNAL SCORE
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black">{simResult.totalInternal}</span>
                  <span className="text-sm font-semibold text-slate-300">/ 50 Marks</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center backdrop-blur-xs">
                <span className="text-lg font-black text-amber-300">
                  {Math.round((simResult.totalInternal / 50) * 100)}%
                </span>
                <span className="text-[8px] uppercase tracking-wider text-slate-300 font-bold">GRADE</span>
              </div>
            </div>

            {/* Breakdown Formula Table */}
            <div className="p-3 rounded-xl bg-black/20 border border-white/10 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>MST-1 (15 Max):</span>
                <span className="font-bold text-white">{simMst1}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>MST-2 (15 Max):</span>
                <span className="font-bold text-white">{simMst2}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Continuous Assignments (10 Max):</span>
                <span className="font-bold text-white">{simAssignment}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Attendance Bonus ({simAttendance}%):</span>
                <span className="font-bold text-emerald-400">+{simResult.attendanceMarks}</span>
              </div>
              <div className="border-t border-white/10 pt-1.5 flex justify-between font-extrabold text-white">
                <span>Total Internal Assessment:</span>
                <span className="text-amber-300">{simResult.totalInternal} / 50</span>
              </div>
            </div>

            {/* Target End-Term Theory Marks Predictor */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Target Needed in 60-Mark Theory Exam</span>
              </span>

              <div className="space-y-2">
                {/* 1. Minimum Pass */}
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">To Pass Subject (40% Total)</span>
                    <span className="text-[10px] text-slate-300">Min 35% theory rule applies</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-400">{neededForPassing}</span>
                    <span className="text-[10px] text-slate-300"> / 60</span>
                  </div>
                </div>

                {/* 2. First Division */}
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">For 1st Division (60% Total)</span>
                    <span className="text-[10px] text-slate-300">Aggregate 60/100 target</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-sky-300">{neededForFirstDiv}</span>
                    <span className="text-[10px] text-slate-300"> / 60</span>
                  </div>
                </div>

                {/* 3. Distinction */}
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">For Distinction (75% Total)</span>
                    <span className="text-[10px] text-slate-300">Honors grade criteria</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-amber-300">{neededForDistinction}</span>
                    <span className="text-[10px] text-slate-300"> / 60</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Note */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-amber-800">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>HPTU Passing Ordinance Note</span>
            </span>
            <p className="text-[11px] leading-relaxed text-amber-800/90">
              As per Himachal Pradesh Technical University regulations, a candidate must secure a minimum of 40% aggregate marks in each theory subject (Internal + External) with not less than 35% in the End-Semester University Examination (21 out of 60 marks).
            </p>
          </div>
        </div>
      </div>

      {/* Subject-Wise Master Score Ledger */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Current Semester All Subjects Internal Ledger</span>
            </h3>
            <p className="text-xs text-slate-500">Official marks submitted to HPTU examination portal</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Subject Code & Name</th>
                <th className="py-2.5 px-3 text-center">Credits</th>
                <th className="py-2.5 px-3 text-center">MST-1 (15)</th>
                <th className="py-2.5 px-3 text-center">MST-2 (15)</th>
                <th className="py-2.5 px-3 text-center">Assign (10)</th>
                <th className="py-2.5 px-3 text-center">Att. Pts (5)</th>
                <th className="py-2.5 px-3 text-center">Total (50)</th>
                <th className="py-2.5 px-3 text-center">Min Passing Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {subjects.map(s => (
                <tr key={s.subject_code} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3">
                    <span className="font-extrabold text-blue-700 block">{s.subject_code}</span>
                    <span className="text-[11px] text-slate-600">{s.subject_name}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-500">{s.credits}</td>
                  <td className="py-3 px-3 text-center">{s.mst1_marks}</td>
                  <td className="py-3 px-3 text-center">{s.mst2_marks}</td>
                  <td className="py-3 px-3 text-center">{s.assignments_marks}</td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-700">+{s.attendance_marks}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-black border border-blue-100">
                      {s.total_internal} / 50
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs font-black text-slate-700">
                      {s.min_theory_passing_marks} / 60
                    </span>
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
