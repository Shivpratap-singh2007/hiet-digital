import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Calendar,
  User,
  Info,
  Check,
  Filter
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { apiService, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Grade, SessionalResult, ClassTestRecord } from '../../types';

interface Props {
  initialTab?: 'university_results' | 'sessional_results' | 'class_tests';
}

export const CgpaView: React.FC<Props> = ({ initialTab = 'university_results' }) => {
  const { user } = useAuth();
  
  // Authenticated student details
  const studentMaster = user?.studentMaster;
  const studentId = studentMaster?.id || user?.student_id || user?.id || '';
  const studentRoll = studentMaster?.roll_no || '';
  const studentName = studentMaster?.name || user?.name || '';
  const studentBranch = studentMaster?.branch || '';
  const studentCourse = studentMaster?.course || 'B.Tech';
  const studentSemester = studentMaster?.semester || 1;

  const [grades, setGrades] = useState<Grade[]>(() =>
    !isSupabaseConfigured 
      ? dataStore.getGrades().filter(g => 
          (g.student_id === studentId || 
           (studentRoll && g.student_id === studentRoll) ||
           (studentId === 'std-cse-sem6-001' && g.student_id === 'std-cse-001')) &&
          g.is_published !== false &&
          g.semester <= studentSemester
        )
      : []
  );

  const [sessionalResults, setSessionalResults] = useState<SessionalResult[]>([]);
  const [classTests, setClassTests] = useState<ClassTestRecord[]>([]);
  const [selectedSem, setSelectedSem] = useState<number>(studentSemester);
  const [activeTab, setActiveTab] = useState<'university_results' | 'sessional_results' | 'class_tests'>(
    initialTab === 'sessional_results' ? 'sessional_results' : initialTab === 'class_tests' ? 'class_tests' : 'university_results'
  );
  
  // Sessional Filter: All, Sessional 1, Sessional 2
  const [selectedSessionalExam, setSelectedSessionalExam] = useState<'All' | 'Sessional 1' | 'Sessional 2'>('All');
  
  // Class Test Filter: Subject filter
  const [selectedTestSubject, setSelectedTestSubject] = useState<string>('all');

  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch official grades, sessionals, and class tests
  useEffect(() => {
    let isMounted = true;
    async function loadAcademicRecords() {
      setLoading(true);
      setLoadError(null);
      try {
        const [gradesData, sessionalsData, classTestsData] = await Promise.all([
          apiService.getGrades(studentId),
          apiService.getSessionalResults({ studentId }),
          apiService.getClassTests({ studentId, studentRoll })
        ]);

        if (isMounted) {
          const published = (gradesData || []).filter(g => g.is_published !== false && g.semester <= studentSemester);
          setGrades(published);
          if (published.length > 0) {
            const maxSem = Math.max(...published.map(g => g.semester));
            setSelectedSem(maxSem);
          } else {
            setSelectedSem(studentSemester);
          }
          setSessionalResults(sessionalsData || []);
          setClassTests(classTestsData || []);
        }
      } catch (err) {
        console.warn('Error loading student academic records:', err);
        if (isMounted) {
          setLoadError('Failed to load examination records. Please try again later.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAcademicRecords();
    return () => { isMounted = false; };
  }, [studentId, studentRoll, studentSemester]);

  // Distinct published semesters for University Results
  const publishedSemesters = useMemo(() => {
    const semSet = new Set<number>(grades.filter(g => g.semester <= studentSemester).map(g => g.semester));
    return Array.from(semSet).sort((a, b) => a - b);
  }, [grades, studentSemester]);

  // All relevant degree semesters up to student's current semester
  const allDegreeSemesters = useMemo(() => {
    const maxSem = Math.max(1, studentSemester);
    const sems: number[] = [];
    for (let i = 1; i <= maxSem; i++) {
      sems.push(i);
    }
    return sems;
  }, [studentSemester]);

  // Semester-wise statistics (SGPA, total credits, points)
  const semesterStats = useMemo(() => {
    const stats: Record<number, { credits: number; points: number; sgpa: number | null }> = {};
    for (const sem of allDegreeSemesters) {
      const semGrades = grades.filter(g => g.semester === sem && g.is_published !== false);
      if (semGrades.length === 0) {
        stats[sem] = { credits: 0, points: 0, sgpa: null };
        continue;
      }
      const totalCredits = semGrades.reduce((sum, g) => sum + (g.credits || 4.0), 0);
      const totalPoints = semGrades.reduce((sum, g) => sum + (g.grade_point * (g.credits || 4.0)), 0);
      const sgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;
      stats[sem] = { credits: totalCredits, points: totalPoints, sgpa };
    }
    return stats;
  }, [grades, allDegreeSemesters]);

  // Overall Cumulative CGPA calculation
  const cumulativeStats = useMemo(() => {
    const publishedGrades = grades.filter(g => g.is_published !== false);
    if (publishedGrades.length === 0) {
      return { totalCredits: 0, cgpa: null };
    }
    const totalCredits = publishedGrades.reduce((sum, g) => sum + (g.credits || 4.0), 0);
    const totalPoints = publishedGrades.reduce((sum, g) => sum + (g.grade_point * (g.credits || 4.0)), 0);
    const cgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;
    return {
      totalCredits,
      cgpa
    };
  }, [grades]);

  // Currently selected semester data
  const currentSemGrades = useMemo(() => {
    return grades.filter(g => g.semester === selectedSem && g.is_published !== false);
  }, [grades, selectedSem]);

  const isCurrentSemDeclared = currentSemGrades.length > 0;
  const currentSemSgpa = semesterStats[selectedSem]?.sgpa ?? null;
  const currentSemCredits = semesterStats[selectedSem]?.credits ?? 0;
  const currentSemSession = currentSemGrades[0]?.session || `Academic Session (Semester ${selectedSem})`;

  // Authenticated student's own published sessional records
  const studentSessionals = useMemo(() => {
    return sessionalResults.filter(r => 
      (r.student_id === studentId || r.student_roll.toUpperCase() === studentRoll.toUpperCase()) &&
      r.is_published !== false
    );
  }, [sessionalResults, studentId, studentRoll]);

  // Sessional records filtered by exam type
  const filteredSessionals = useMemo(() => {
    if (selectedSessionalExam === 'All') return studentSessionals;
    return studentSessionals.filter(r => r.exam_type === selectedSessionalExam);
  }, [studentSessionals, selectedSessionalExam]);

  // Sessional summary metrics
  const sessionalSummary = useMemo(() => {
    if (filteredSessionals.length === 0) return { obtained: 0, max: 0, percentage: 0 };
    const obtained = filteredSessionals.reduce((sum, r) => sum + r.marks_obtained, 0);
    const max = filteredSessionals.reduce((sum, r) => sum + r.max_marks, 0);
    const percentage = max > 0 ? Math.round((obtained / max) * 100) : 0;
    return { obtained, max, percentage };
  }, [filteredSessionals]);

  // Authenticated student's own class test records
  const studentClassTests = useMemo(() => {
    return classTests.filter(ct => 
      ct.student_id === studentId || ct.student_roll.toUpperCase() === studentRoll.toUpperCase()
    );
  }, [classTests, studentId, studentRoll]);

  // Distinct subjects available in class test records
  const classTestSubjects = useMemo(() => {
    const subs = new Set<string>();
    studentClassTests.forEach(ct => {
      if (ct.subject_name) subs.add(ct.subject_name);
    });
    return Array.from(subs);
  }, [studentClassTests]);

  // Filtered class tests by subject
  const filteredClassTests = useMemo(() => {
    if (selectedTestSubject === 'all') return studentClassTests;
    return studentClassTests.filter(ct => ct.subject_name === selectedTestSubject);
  }, [studentClassTests, selectedTestSubject]);

  // Class tests summary metrics
  const classTestSummary = useMemo(() => {
    if (filteredClassTests.length === 0) return { count: 0, avgPercentage: 0, totalMarks: 0, maxMarks: 0 };
    const totalMarks = filteredClassTests.reduce((sum, ct) => sum + ct.marks_obtained, 0);
    const maxMarks = filteredClassTests.reduce((sum, ct) => sum + ct.max_marks, 0);
    const avgPercentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
    return { count: filteredClassTests.length, avgPercentage, totalMarks, maxMarks };
  }, [filteredClassTests]);

  return (
    <div className="space-y-6 font-sans pb-24 w-full max-w-full overflow-hidden">
      {/* 1. Official Header Banner */}
      <div className="bg-[#0F2942] text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#183B56] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/15 font-mono">
                  Office of the Controller of Examinations
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Official & Authenticated
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <GraduationCap className="w-7 h-7 text-white" />
                <span>Student Results & Academic Records</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Himachal Pradesh Technical University (HPTU) Affiliated Curricular Ledger, Sessional Examinations & Continuous Assessments
              </p>
            </div>

            {/* Read-Only Status Indicator */}
            <div className="sm:text-right shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-medium text-slate-200 border border-white/15">
                <ShieldCheck className="w-4 h-4 text-white" />
                Read-Only Student Access
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Marks cannot be altered by student
              </p>
            </div>
          </div>

          {/* Student Identity Metadata Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Student Name:</span>
              <strong className="text-white font-semibold text-sm">{studentName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Roll / Institutional ID:</span>
              <strong className="text-white font-mono font-semibold text-sm">{studentRoll}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Program & Branch:</span>
              <strong className="text-white font-semibold text-sm">{studentCourse} • {studentBranch}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">University Affiliation:</span>
              <strong className="text-white font-semibold text-sm">HPTU Hamirpur</strong>
            </div>
          </div>
        </div>

        {/* Subtle Decorative Background Seal */}
        <Award className="w-48 h-48 text-white/5 absolute -right-8 -bottom-10 pointer-events-none" />
      </div>

      {/* 2. Primary Academic Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cumulative CGPA Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            <span>Cumulative CGPA</span>
            <Award className="w-4 h-4 text-[#0F2942]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0F2942]">
              {loading ? '...' : (cumulativeStats.cgpa !== null ? cumulativeStats.cgpa.toFixed(2) : '--')}
            </span>
            <span className="text-xs text-[#64748B] font-medium">/ 10.0 Scale</span>
          </div>
          <p className="text-xs text-[#64748B] mt-2.5">
            {cumulativeStats.cgpa === null
              ? (loading ? 'Loading academic records...' : 'Awaiting published records')
              : cumulativeStats.cgpa >= 8.5
              ? 'First Class with Exemplary Distinction'
              : cumulativeStats.cgpa >= 7.5
              ? 'First Class Standing'
              : 'Good Academic Standing'}
          </p>
        </div>

        {/* Selected Semester SGPA Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            <span>Semester {selectedSem} SGPA</span>
            <TrendingUp className="w-4 h-4 text-[#0F2942]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0F2942]">
              {loading ? '...' : (currentSemSgpa !== null ? currentSemSgpa.toFixed(2) : '--')}
            </span>
            <span className="text-xs text-[#64748B] font-medium">/ 10.0 Scale</span>
          </div>
          <p className="text-xs text-[#64748B] mt-2.5">
            {isCurrentSemDeclared
              ? `Calculated from ${currentSemCredits} verified credit hours`
              : 'Results not published yet.'}
          </p>
        </div>

        {/* Total Earned Credits Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            <span>Degree Credits Completed</span>
            <BookOpen className="w-4 h-4 text-[#0F2942]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0F2942]">
              {loading ? '...' : (cumulativeStats.totalCredits > 0 ? cumulativeStats.totalCredits : '--')}
            </span>
            <span className="text-xs text-[#64748B] font-medium">/ 160 Total</span>
          </div>
          <p className="text-xs text-[#64748B] mt-2.5">
            {cumulativeStats.totalCredits > 0
              ? '0 Active Backlogs • Normal Academic Progress'
              : 'Results not published yet.'}
          </p>
        </div>
      </div>

      {/* 3. Section Navigation Tabs: Unified Single Entry Point for All Results */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: University Results */}
          <button
            onClick={() => setActiveTab('university_results')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'university_results'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#0F2942] border border-[#E2E8F0]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>University Results</span>
          </button>
          
          {/* Tab 2: Sessional Results (Section A) */}
          <button
            onClick={() => setActiveTab('sessional_results')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'sessional_results'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#0F2942] border border-[#E2E8F0]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Sessional Results</span>
            {studentSessionals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#0F2942]/10 text-[#0F2942] font-mono font-bold">
                {studentSessionals.length}
              </span>
            )}
          </button>

          {/* Tab 3: Class Test Records (Section B) */}
          <button
            onClick={() => setActiveTab('class_tests')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'class_tests'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#0F2942] border border-[#E2E8F0]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Class Test Records</span>
            {studentClassTests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#0F2942]/10 text-[#0F2942] font-mono font-bold">
                {studentClassTests.length}
              </span>
            )}
          </button>
        </div>

        <span className="hidden sm:inline-block text-xs text-[#64748B] font-medium">
          Academic Session 2025-2026
        </span>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: UNIVERSITY RESULTS                                         */}
      {/* ===================================================================== */}
      {activeTab === 'university_results' && (
        <div className="space-y-4">
          {/* Semester Selector Grid */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Select Examination Semester
              </h3>
              <span className="text-[11px] text-[#64748B]">
                Click semester tab to view official grade sheet
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {allDegreeSemesters.map(sem => {
                const hasGrades = publishedSemesters.includes(sem);
                const semSgpa = semesterStats[sem]?.sgpa;
                const isSelected = selectedSem === sem;

                return (
                  <button
                    key={sem}
                    onClick={() => setSelectedSem(sem)}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      isSelected
                        ? 'border-[#0F2942] bg-[#0F2942] text-white shadow-xs'
                        : hasGrades
                        ? 'border-[#E2E8F0] bg-white hover:border-[#0F2942]/30 text-[#0F2942]'
                        : 'border-[#E2E8F0] bg-slate-50/70 text-[#64748B] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#0F2942]'}`}>
                        Semester {sem}
                      </span>
                      {hasGrades && (
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-[#0F2942]'}`} />
                      )}
                    </div>

                    <div className={`text-lg font-black mt-1 ${isSelected ? 'text-white' : 'text-[#0F2942]'}`}>
                      {semSgpa !== null && semSgpa !== undefined ? semSgpa.toFixed(2) : '--'}
                    </div>

                    <span className={`text-[10px] block mt-0.5 ${
                      isSelected 
                        ? 'text-slate-200' 
                        : hasGrades 
                        ? 'text-[#64748B]' 
                        : 'text-slate-500 font-medium'
                    }`}>
                      {hasGrades ? 'SGPA Declared' : 'Not Declared'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Upcoming Semesters Guidance */}
            {studentSemester < 8 && (
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100">
                <span className="font-semibold text-slate-600">Upcoming Terms:</span>
                <span className="text-slate-400">
                  Semesters {studentSemester + 1}–8 will become accessible as you advance through subsequent academic sessions.
                </span>
              </div>
            )}
          </div>

          {/* Undeclared State Check */}
          {!isCurrentSemDeclared ? (
            <div className="p-8 sm:p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#0F2942]/5 border border-[#0F2942]/10 flex items-center justify-center text-[#0F2942]">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#0F2942]">
                Results not published yet.
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                The official examination results for Semester {selectedSem} have not been published by the examination authority yet. Please check back after formal institutional notification from the Controller of Examinations.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-[#64748B]">
                  <Info className="w-3.5 h-3.5" />
                  Examination Session: Ongoing Semester
                </span>
              </div>
            </div>
          ) : (
            /* Official Results Table and Mobile Cards */
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
              {/* Table Header / Sub-Banner */}
              <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#F8FAFC]">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F2942] flex items-center gap-2">
                    <span>Semester {selectedSem} Official Course Marks Card</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F2942] text-white">
                      PUBLISHED
                    </span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {currentSemSession} • Total Course Credits: <strong>{currentSemCredits}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="px-3 py-1 rounded-lg bg-white border border-[#E2E8F0] text-xs font-mono font-bold text-[#0F2942]">
                    SGPA: {currentSemSgpa !== null ? currentSemSgpa.toFixed(2) : '--'}
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                    STATUS: PASSED
                  </span>
                </div>
              </div>

              {/* Mobile View: Cards (< sm) */}
              <div className="sm:hidden divide-y divide-[#E2E8F0] p-3 space-y-3">
                {currentSemGrades.map((sub) => (
                  <div key={sub.id} className="p-4 bg-white rounded-xl border border-[#E2E8F0] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-mono font-bold text-xs text-[#0F2942] bg-slate-100 px-2 py-0.5 rounded">
                          {sub.subject_code}
                        </span>
                        <h4 className="font-bold text-sm text-[#0F2942] mt-1 leading-snug">
                          {sub.subject_name}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-lg font-black text-xs bg-[#0F2942] text-white">
                          {sub.letter_grade}
                        </span>
                        <span className="block text-[10px] text-[#64748B] mt-0.5 font-semibold">
                          GP: {sub.grade_point.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Marks Breakdown Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-[#64748B] block">Internal Assessment:</span>
                        <strong className="text-[#0F2942] font-mono">
                          {sub.internal_marks !== undefined ? sub.internal_marks : '-'}
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-[#64748B] block">Sessional Marks:</span>
                        <strong className="text-[#0F2942] font-mono">
                          {sub.sessional_marks !== undefined ? sub.sessional_marks : '-'}
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-[#64748B] block">Practical Marks:</span>
                        <strong className="text-[#0F2942] font-mono">
                          {sub.practical_marks !== undefined ? sub.practical_marks : '-'}
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-[#64748B] block">End-Sem External:</span>
                        <strong className="text-[#0F2942] font-mono">
                          {sub.external_marks !== undefined ? sub.external_marks : '-'}
                        </strong>
                      </div>
                    </div>

                    {/* Total & Credits Footer */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[#64748B]">Total Marks: </span>
                        <strong className="text-[#0F2942] font-mono">{sub.marks} / {sub.max_marks || 100}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Credits: </span>
                        <strong className="text-[#0F2942]">{sub.credits}</strong>
                      </div>
                      <span className="text-slate-800 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {sub.status || 'Pass'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Full Marks Table (>= sm) */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-bold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-4 py-3 min-w-[90px] whitespace-nowrap">Code</th>
                      <th className="px-4 py-3 min-w-[180px]">Subject Name</th>
                      <th className="px-3 py-3 text-center min-w-[65px] whitespace-nowrap">Credits</th>
                      <th className="px-3 py-3 text-center min-w-[70px] whitespace-nowrap">Internal</th>
                      <th className="px-3 py-3 text-center min-w-[75px] whitespace-nowrap">Sessional</th>
                      <th className="px-3 py-3 text-center min-w-[75px] whitespace-nowrap">Practical</th>
                      <th className="px-3 py-3 text-center min-w-[75px] whitespace-nowrap">External</th>
                      <th className="px-3 py-3 text-center min-w-[85px] whitespace-nowrap">Total (100)</th>
                      <th className="px-3 py-3 text-center min-w-[65px] whitespace-nowrap">Grade</th>
                      <th className="px-3 py-3 text-center min-w-[85px] whitespace-nowrap">Grade Point</th>
                      <th className="px-4 py-3 text-center min-w-[75px] whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-slate-800">
                    {currentSemGrades.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-[#0F2942]">
                          {sub.subject_code}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {sub.subject_name}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-700">
                          {sub.credits}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-slate-700">
                          {sub.internal_marks !== undefined ? sub.internal_marks : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-slate-700">
                          {sub.sessional_marks !== undefined ? sub.sessional_marks : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-slate-700">
                          {sub.practical_marks !== undefined ? sub.practical_marks : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-slate-700">
                          {sub.external_marks !== undefined ? sub.external_marks : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-[#0F2942]">
                          {sub.marks}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2 py-0.5 rounded font-black text-xs bg-[#0F2942] text-white">
                            {sub.letter_grade}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-semibold text-slate-800">
                          {sub.grade_point.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {sub.status || 'Pass'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: SESSIONAL RESULTS (Section A)                              */}
      {/* ===================================================================== */}
      {activeTab === 'sessional_results' && (
        <div className="space-y-4">
          {/* Header & Exam Filter */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0F2942] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0F2942]" />
                <span>Sessional Examination Results</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Official internal mid-term evaluation marks published by respective subject faculty
              </p>
            </div>

            {/* Exam Selector Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl w-fit">
              {(['All', 'Sessional 1', 'Sessional 2'] as const).map(exam => (
                <button
                  key={exam}
                  onClick={() => setSelectedSessionalExam(exam)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedSessionalExam === exam
                      ? 'bg-[#0F2942] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F2942]'
                  }`}
                >
                  {exam}
                </button>
              ))}
            </div>
          </div>

          {/* Aggregate Performance Score Card */}
          {filteredSessionals.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#0F2942] text-white shadow-sm border border-[#183B56] relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block font-mono">
                    {selectedSessionalExam === 'All' ? 'Combined Sessionals' : selectedSessionalExam} • Aggregate Performance
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black">{sessionalSummary.obtained}</span>
                    <span className="text-sm font-semibold text-slate-300">/ {sessionalSummary.max} Total Marks</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    Evaluation Standing: <strong className="text-white">{sessionalSummary.percentage}% Overall Score</strong>
                  </p>
                </div>

                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center backdrop-blur-xs">
                  <span className="text-2xl font-black text-white">{sessionalSummary.percentage}%</span>
                  <span className="text-[9px] uppercase font-bold text-slate-300">Aggregate</span>
                </div>
              </div>
            </div>
          )}

          {/* Subject-Wise Sessional Cards List */}
          {filteredSessionals.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F2942]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#0F2942]">
                No published sessional records found
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                No internal sessional evaluation scores have been published for {selectedSessionalExam} yet. Please check back once faculty marks entry has been finalized.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredSessionals.map(res => {
                const isPassing = res.percentage >= 50;
                return (
                  <div 
                    key={res.id} 
                    className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs hover:shadow-xs transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F2942] text-white">
                            {res.exam_type}
                          </span>
                          {res.subject_code && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-[#0F2942] font-bold border border-[#E2E8F0]">
                              {res.subject_code}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F8FAFC] text-slate-700 border border-[#E2E8F0]">
                            {res.is_published ? 'Published' : 'Under Review'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0F2942] mt-1.5 truncate">
                          {res.subject_name}
                        </h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Semester {res.semester} • Max Evaluation: {res.max_marks} Marks
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-[#0F2942] font-mono block">
                          {res.marks_obtained} <span className="text-xs font-normal text-[#64748B]">/ {res.max_marks}</span>
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-[#0F2942] border border-[#E2E8F0] mt-0.5">
                          {res.percentage}% Score
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#0F2942] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, res.percentage))}%` }}
                      />
                    </div>

                    {/* Faculty Remarks */}
                    {res.remarks && (
                      <p className="text-[11px] text-slate-700 italic bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0]">
                        &ldquo;{res.remarks}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: CLASS TEST RECORDS (Section B)                             */}
      {/* ===================================================================== */}
      {activeTab === 'class_tests' && (
        <div className="space-y-4">
          {/* Header & Course Filter */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0F2942] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F2942]" />
                <span>Class Test Records & Assessment History</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Continuous unit evaluations, class tests, and diagnostic assessment records
              </p>
            </div>

            {/* Subject Filter Dropdown */}
            {classTestSubjects.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2942]">
                <Filter className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="text-[#64748B]">Filter Subject:</span>
                <select
                  value={selectedTestSubject}
                  onChange={e => setSelectedTestSubject(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#0F2942]/30 bg-[#F8FAFC] text-[#0F2942] font-bold focus:ring-2 focus:ring-[#0F2942] focus:border-[#0F2942] focus:outline-hidden text-xs"
                >
                  <option value="all">All Courses ({classTestSubjects.length})</option>
                  {classTestSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Class Tests Summary Card */}
          {filteredClassTests.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#0F2942] text-white shadow-sm border border-[#183B56] relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block font-mono">
                    Class Assessment Summary • {selectedTestSubject === 'all' ? 'All Registered Subjects' : selectedTestSubject}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black">{classTestSummary.totalMarks}</span>
                    <span className="text-sm font-semibold text-slate-300">/ {classTestSummary.maxMarks} Total Marks</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    Completed Evaluations: <strong className="text-white">{classTestSummary.count} Tests</strong> • Average Score: <strong className="text-white">{classTestSummary.avgPercentage}%</strong>
                  </p>
                </div>

                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center backdrop-blur-xs">
                  <span className="text-2xl font-black text-white">{classTestSummary.avgPercentage}%</span>
                  <span className="text-[9px] uppercase font-bold text-slate-300">Average</span>
                </div>
              </div>
            </div>
          )}

          {/* Class Test Records Display or Empty State */}
          {filteredClassTests.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F2942]">
                <FileText className="w-7 h-7 text-[#0F2942]" />
              </div>
              <h3 className="text-base font-bold text-[#0F2942]">
                No class test records found
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                No class test or unit assessment evaluations have been recorded for your courses yet. Subject faculty will enter scores after conducting unit evaluations.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-[#64748B]">
                  <Info className="w-3.5 h-3.5" />
                  Continuous Evaluation: Active Academic Session
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Cards (< sm) */}
              <div className="sm:hidden space-y-3">
                {filteredClassTests.map(ct => (
                  <div key={ct.id} className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F2942] text-white">
                            {ct.test_name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-[#0F2942] font-bold border border-[#E2E8F0]">
                            {ct.subject_code}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0F2942] mt-1.5 truncate">
                          {ct.subject_name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-[#0F2942] font-mono block">
                          {ct.marks_obtained} <span className="text-xs font-normal text-[#64748B]">/ {ct.max_marks}</span>
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-[#0F2942] border border-[#E2E8F0] mt-0.5">
                          {ct.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Date: {new Date(ct.test_date).toLocaleDateString()}</span>
                      </span>
                      {ct.teacher_name && (
                        <span className="truncate max-w-[150px]">
                          Faculty: {ct.teacher_name}
                        </span>
                      )}
                    </div>

                    {ct.remarks && (
                      <p className="text-[11px] text-slate-700 italic bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0]">
                        &ldquo;{ct.remarks}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= sm) */}
              <div className="hidden sm:block bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs w-full">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="px-4 py-3 min-w-[90px] whitespace-nowrap">Code</th>
                        <th className="px-4 py-3 min-w-[160px]">Subject Name</th>
                        <th className="px-4 py-3 min-w-[150px]">Assessment Name</th>
                        <th className="px-3 py-3 text-center min-w-[100px] whitespace-nowrap">Date</th>
                        <th className="px-3 py-3 text-center min-w-[90px] whitespace-nowrap">Marks Obtained</th>
                        <th className="px-3 py-3 text-center min-w-[80px] whitespace-nowrap">Max Marks</th>
                        <th className="px-3 py-3 text-center min-w-[80px] whitespace-nowrap">Percentage</th>
                        <th className="px-4 py-3 text-center min-w-[80px] whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 min-w-[160px]">Faculty / Remarks</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-slate-800">
                    {filteredClassTests.map(ct => (
                      <tr key={ct.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-[#0F2942]">
                          {ct.subject_code}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {ct.subject_name}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0F2942]">
                          {ct.test_name}
                        </td>
                        <td className="px-3 py-3 text-center font-medium text-[#64748B]">
                          {new Date(ct.test_date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-black text-[#0F2942]">
                          {ct.marks_obtained}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-[#64748B]">
                          {ct.max_marks}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-[#0F2942]">
                          {ct.percentage}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0F2942] text-white">
                            {ct.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#64748B] max-w-xs truncate">
                          {ct.remarks || (ct.teacher_name ? `Evaluator: ${ct.teacher_name}` : 'Continuous Assessment')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          )}
        </div>
      )}

      {/* 4. Official Grading System Reference & Statutory Transcript Notes */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 text-xs text-[#64748B] space-y-3">
        <div className="flex items-center gap-2 text-[#0F2942] font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>HPTU Hamirpur Grading System & Statutory Academic Assessment Notes</span>
        </div>
        <p className="leading-relaxed">
          The Semester Grade Point Average (SGPA) and Cumulative Grade Point Average (CGPA) are computed strictly in conformance with the Himachal Pradesh Technical University Ordinance on a 10.0-point grading scale. Letter grades: <strong>A+ (10.0)</strong>, <strong>A (9.0)</strong>, <strong>B+ (8.0)</strong>, <strong>B (7.0)</strong>, <strong>C (6.0)</strong>, <strong>P (5.0)</strong>, <strong>F (0.0)</strong>. Sessional examinations and class unit tests contribute directly toward internal sessional weightage.
        </p>
        <p className="text-[11px] text-slate-500 border-t border-[#E2E8F0] pt-2">
          Notice: This digital transcript is generated directly from verified institutional database records. For official stamped transcripts or degree verification, contact the Academic Registrar&apos;s Office.
        </p>
      </div>
    </div>
  );
};
