import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  Save, 
  CheckCircle2, 
  Search, 
  Send, 
  Eye, 
  AlertCircle, 
  FileText, 
  Clock, 
  Check, 
  X, 
  Info,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SessionalResult, SessionalWorkflowStatus } from '../../types';
import { formatIndiaDateTime } from '../../lib/utils';

export const TeacherSessionalView: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const teacherId = user?.teacher_id || user?.id || 'tch-01';
  const facultyName = user?.name || user?.teacherMaster?.name || 'Dr. Rajesh Kumar';

  // Sessional records from data store
  const [results, setResults] = useState<SessionalResult[]>(() => dataStore.getSessionalResults());

  // Filter subjects assigned to faculty
  const allSubjects = dataStore.getSubjects();
  const authorizedSubjects = allSubjects.filter(s => 
    s.teacher_id === teacherId || 
    s.teacher_name?.toLowerCase() === facultyName.toLowerCase() ||
    (teacherId === 'tch-01' && (s.teacher_id === 'tch-01' || s.teacher_name === 'Dr. Rajesh Kumar')) ||
    (!s.teacher_id && s.department === (user?.teacherMaster?.department || 'CSE'))
  );

  const authorizedBranches = Array.from(new Set(authorizedSubjects.map(s => s.branch)));
  const defaultBranch = authorizedBranches.includes('CSE') ? 'CSE' : (authorizedBranches[0] || 'CSE');

  // Cascading Selection for Sessional Cohort
  const [selectedBranch, setSelectedBranch] = useState<string>(defaultBranch);

  const availableSemesters = Array.from(
    new Set(authorizedSubjects.filter(s => s.branch === selectedBranch).map(s => s.semester))
  ).sort((a, b) => a - b);
  const defaultSemester = availableSemesters.length > 0 ? availableSemesters[availableSemesters.length - 1] : 6;

  const [selectedSemester, setSelectedSemester] = useState<number>(defaultSemester);
  const [selectedSection, setSelectedSection] = useState<string>('A');

  const availableSubjectsForCohort = authorizedSubjects.filter(
    s => s.branch === selectedBranch && s.semester === selectedSemester
  );
  const defaultSubject = availableSubjectsForCohort.length > 0 
    ? availableSubjectsForCohort[0] 
    : { id: 'sub-cs601', subject_name: 'Mathematics', subject_code: 'CS-601' };

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultSubject.id);

  // Sync subject when cohort changes
  useEffect(() => {
    const matching = authorizedSubjects.filter(s => s.branch === selectedBranch && s.semester === selectedSemester);
    if (matching.length > 0 && !matching.some(m => m.id === selectedSubjectId)) {
      setSelectedSubjectId(matching[0].id);
    }
  }, [selectedBranch, selectedSemester, authorizedSubjects]);

  // Students belonging strictly to authorized class cohort
  const allStudents = dataStore.getStudentsMaster();
  const cohortStudents = allStudents.filter(s => 
    s.branch === selectedBranch &&
    s.semester === selectedSemester &&
    (s.section === selectedSection || !s.section)
  );

  const defaultStudent = cohortStudents.length > 0 ? cohortStudents[0] : allStudents[0];

  // Entry Form States
  const [studentRoll, setStudentRoll] = useState<string>(defaultStudent?.roll_no || 'CSE001');
  const [examType, setExamType] = useState<'Sessional 1' | 'Sessional 2'>('Sessional 1');
  const [marksObtained, setMarksObtained] = useState<string>('18');
  const [maxMarks, setMaxMarks] = useState<string>('25');
  const [remarks, setRemarks] = useState<string>('Good analytical problem-solving and derivations.');

  // Validation & Modal States
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState<SessionalResult | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingHOD, setSubmittingHOD] = useState(false);
  const [resultSearch, setResultSearch] = useState('');

  // Keep studentRoll in sync when cohort students change
  useEffect(() => {
    if (cohortStudents.length > 0 && !cohortStudents.some(s => s.roll_no === studentRoll)) {
      setStudentRoll(cohortStudents[0].roll_no);
    }
  }, [cohortStudents]);

  // Current active subject object
  const activeSubject = authorizedSubjects.find(s => s.id === selectedSubjectId) || defaultSubject;
  const activeStudent = cohortStudents.find(s => s.roll_no === studentRoll) || defaultStudent;

  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!studentRoll.trim()) {
      errors.studentRoll = 'Please select a student from the authorized roster.';
    }

    const marksNum = Number(marksObtained);
    const maxMarksNum = Number(maxMarks);

    if (isNaN(marksNum) || marksObtained.trim() === '') {
      errors.marksObtained = 'Marks obtained must be a valid number.';
    } else if (marksNum < 0) {
      errors.marksObtained = 'Marks obtained cannot be less than zero.';
    } else if (marksNum > maxMarksNum) {
      errors.marksObtained = `Marks obtained (${marksNum}) cannot exceed maximum marks (${maxMarksNum}).`;
    }

    if (isNaN(maxMarksNum) || maxMarks.trim() === '' || maxMarksNum <= 0) {
      errors.maxMarks = 'Maximum marks must be a positive number greater than zero.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 1. Save Draft Workflow
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    if (!activeStudent) return;

    setSavingDraft(true);
    const marksNum = Number(marksObtained);
    const maxMarksNum = Number(maxMarks);
    const percentage = Math.round((marksNum / maxMarksNum) * 100);

    const draft = await apiService.saveSessionalDraft({
      student_id: activeStudent.id,
      student_roll: activeStudent.roll_no,
      student_name: activeStudent.name,
      subject_name: activeSubject.subject_name,
      subject_code: activeSubject.subject_code,
      exam_type: examType,
      marks_obtained: marksNum,
      max_marks: maxMarksNum,
      percentage,
      semester: selectedSemester,
      branch: selectedBranch,
      faculty_id: teacherId,
      faculty_name: facultyName,
      remarks: remarks.trim() || undefined
    });

    setSavingDraft(false);
    setResults(dataStore.getSessionalResults());
    toast.info('Draft Saved', `Sessional mark for ${activeStudent.name} saved as Draft. It remains unpublished to students.`);
  };

  // 2. Open Preview Modal
  const handleOpenPreview = () => {
    if (!validateForm()) return;
    setShowPreviewModal(true);
  };

  // 3. Submit for HOD Approval Workflow
  const handleSubmitForHOD = async () => {
    if (!validateForm()) return;
    if (!activeStudent) return;

    setShowPreviewModal(false);
    setSubmittingHOD(true);

    const marksNum = Number(marksObtained);
    const maxMarksNum = Number(maxMarks);
    const percentage = Math.round((marksNum / maxMarksNum) * 100);

    const submission = await apiService.submitSessionalForApproval({
      student_id: activeStudent.id,
      student_roll: activeStudent.roll_no,
      student_name: activeStudent.name,
      subject_name: activeSubject.subject_name,
      subject_code: activeSubject.subject_code,
      exam_type: examType,
      marks_obtained: marksNum,
      max_marks: maxMarksNum,
      percentage,
      semester: selectedSemester,
      branch: selectedBranch,
      faculty_id: teacherId,
      faculty_name: facultyName,
      remarks: remarks.trim() || undefined
    });

    setSubmittingHOD(false);
    setResults(dataStore.getSessionalResults());

    if (submission.status === 'Submitted to HOD') {
      toast.success(
        'Submitted to HOD for Review',
        `Score of ${marksNum}/${maxMarksNum} for ${activeStudent.name} forwarded to HOD. Marks remain unpublished until formal institutional signoff.`
      );
    } else {
      toast.error('Submission Issue', 'Could not submit sessional marks for approval.');
    }
  };

  // Monochrome Status Badge
  const getWorkflowBadge = (status?: SessionalWorkflowStatus, isPublished?: boolean) => {
    if (isPublished) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-black text-white border border-black">
          Published
        </span>
      );
    }

    switch (status) {
      case 'Submitted to HOD':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-200 text-black border border-neutral-400">
            In Review (HOD)
          </span>
        );
      case 'Approved by HOD':
      case 'Submitted to Principal':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-200 text-black border border-neutral-400">
            HOD Approved
          </span>
        );
      case 'Approved by Principal':
      case 'Submitted to MD':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-200 text-black border border-neutral-400">
            Principal Approved
          </span>
        );
      case 'Returned by HOD':
      case 'Returned by Principal':
      case 'Rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-100 text-neutral-900 border border-neutral-400 underline">
            Returned: Revision Required
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-neutral-100 text-neutral-700 border border-neutral-300">
            Draft (Unsubmitted)
          </span>
        );
    }
  };

  // Filtered results
  const filteredResults = results.filter(r => {
    if (!resultSearch.trim()) return true;
    const q = resultSearch.toLowerCase();
    return (
      r.student_name.toLowerCase().includes(q) ||
      r.student_roll.toLowerCase().includes(q) ||
      r.subject_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 animate-fade-in font-sans w-full max-w-full overflow-hidden">
      {/* 1. Header with Institutional Description (Strict Monochrome Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center gap-2">
            <Award className="w-5 h-5 text-black" />
            <span>Faculty Sessional Marks Directorate</span>
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Record sessional assessment marks. Sessional scores enter institutional review (Faculty → HOD → Principal) before publishing to the student portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-300">
            Faculty ID: {teacherId} • {facultyName}
          </span>
        </div>
      </div>

      {/* 2. Authorized Teaching Assignment Selector Strip */}
      <div className="p-4 bg-white rounded-2xl border border-neutral-300 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-800 border-b border-neutral-200 pb-2">
          <span>Authorized Teaching Allocation & Class Cohort:</span>
          <span className="text-[11px] font-normal text-neutral-500">
            {cohortStudents.length} students enrolled in selected class
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Branch */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Authorized Branch
            </label>
            <select
              value={selectedBranch}
              onChange={e => {
                const b = e.target.value;
                setSelectedBranch(b);
                const sems = Array.from(new Set(authorizedSubjects.filter(s => s.branch === b).map(s => s.semester)));
                if (sems.length > 0) setSelectedSemester(sems[0]);
              }}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 text-black focus:outline-none focus:border-black"
            >
              {authorizedBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Teaching Semester
            </label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(Number(e.target.value))}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 text-black focus:outline-none focus:border-black"
            >
              {availableSemesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 text-black focus:outline-none focus:border-black"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
              Course Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 text-black focus:outline-none focus:border-black"
            >
              {availableSubjectsForCohort.map(s => (
                <option key={s.id} value={s.id}>
                  {s.subject_name} ({s.subject_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Sessional Score Entry Form */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-300 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-black" />
            <h3 className="font-extrabold text-sm text-black">New Internal Sessional Score Entry</h3>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium">
            Requires HOD verification before publishing
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Student Picker - Only Authorized Students */}
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                Select Student from Cohort
              </label>
              <select
                value={studentRoll}
                onChange={e => {
                  setStudentRoll(e.target.value);
                  if (formErrors.studentRoll) {
                    setFormErrors(prev => ({ ...prev, studentRoll: '' }));
                  }
                }}
                className={`w-full text-xs font-semibold bg-neutral-50 border rounded-xl px-3 py-2 text-black focus:outline-none ${
                  formErrors.studentRoll ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-300 focus:border-black'
                }`}
              >
                {cohortStudents.map(s => (
                  <option key={s.id} value={s.roll_no}>
                    {s.roll_no} - {s.name} ({s.branch})
                  </option>
                ))}
              </select>
              {formErrors.studentRoll && (
                <p className="text-[10px] text-black font-bold mt-1">{formErrors.studentRoll}</p>
              )}
            </div>

            {/* Assessment Type */}
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                Evaluation Assessment
              </label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value as any)}
                className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-black focus:outline-none focus:border-black"
              >
                <option value="Sessional 1">Sessional 1 (Mid-Term Assessment)</option>
                <option value="Sessional 2">Sessional 2 (End-Term Internal)</option>
              </select>
            </div>

            {/* Course Subject (Readonly derived from selector) */}
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                Selected Course Subject
              </label>
              <div className="w-full text-xs font-bold bg-neutral-100 border border-neutral-300 rounded-xl px-3 py-2 text-black">
                {activeSubject.subject_name} ({activeSubject.subject_code})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Marks Obtained */}
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                Marks Obtained (Numeric)
              </label>
              <input
                type="number"
                min="0"
                max={maxMarks}
                step="0.5"
                value={marksObtained}
                onChange={e => {
                  setMarksObtained(e.target.value);
                  if (formErrors.marksObtained) {
                    setFormErrors(prev => ({ ...prev, marksObtained: '' }));
                  }
                }}
                className={`w-full text-xs font-bold bg-neutral-50 border rounded-xl px-3 py-2 text-black focus:outline-none ${
                  formErrors.marksObtained ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-300 focus:border-black'
                }`}
                placeholder="e.g. 18.5"
              />
              {formErrors.marksObtained && (
                <p className="text-[10px] text-black font-bold mt-1">⚠️ {formErrors.marksObtained}</p>
              )}
            </div>

            {/* Maximum Marks */}
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                Maximum Marks
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={maxMarks}
                onChange={e => {
                  setMaxMarks(e.target.value);
                  if (formErrors.maxMarks) {
                    setFormErrors(prev => ({ ...prev, maxMarks: '' }));
                  }
                }}
                className={`w-full text-xs font-bold bg-neutral-50 border rounded-xl px-3 py-2 text-black focus:outline-none ${
                  formErrors.maxMarks ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-300 focus:border-black'
                }`}
                placeholder="e.g. 25"
              />
              {formErrors.maxMarks && (
                <p className="text-[10px] text-black font-bold mt-1">⚠️ {formErrors.maxMarks}</p>
              )}
            </div>

            {/* Percentage Computed */}
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                Computed Percentage
              </label>
              <div className="w-full text-xs font-black bg-neutral-100 border border-neutral-300 rounded-xl px-3 py-2 text-black flex items-center justify-between">
                <span>
                  {Number(maxMarks) > 0 && !isNaN(Number(marksObtained))
                    ? `${Math.round((Number(marksObtained) / Number(maxMarks)) * 100)}%`
                    : '—'}
                </span>
                <span className="text-[10px] font-medium text-neutral-500">
                  {Number(marksObtained)} / {Number(maxMarks)}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[11px] font-bold text-neutral-700 block mb-1">
              Faculty Evaluator Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Strong conceptual grasp in unit tests, recommended practice in derivations..."
              className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-black focus:outline-none focus:border-black"
            />
          </div>

          {/* Actions: Save Draft, Preview, Submit to HOD */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-200">
            <div className="text-[11px] text-neutral-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-black shrink-0" />
              <span>Marks will NOT be visible to students until signed off by the Head of Department.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Save Draft */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || submittingHOD}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>

              {/* Preview */}
              <button
                type="button"
                onClick={handleOpenPreview}
                disabled={savingDraft || submittingHOD}
                className="px-4 py-2 bg-white hover:bg-neutral-100 border border-neutral-400 text-black rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              {/* Submit for HOD Approval */}
              <button
                type="button"
                onClick={handleSubmitForHOD}
                disabled={savingDraft || submittingHOD}
                className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingHOD ? 'Submitting to HOD...' : 'Submit to HOD'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sessional Marks Registry & Audit Table (Monochrome) */}
      <div className="bg-white rounded-2xl border border-neutral-300 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-black">
              Institutional Sessional Marks Register ({filteredResults.length} Records)
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review current approval state, submission timestamps, reviewer notes, and publication status
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={resultSearch}
              onChange={e => setResultSearch(e.target.value)}
              placeholder="Search roll, student, subject..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl text-black focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-300 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">Roll No</th>
                <th className="py-2.5 px-3 min-w-[150px] whitespace-nowrap">Student Name</th>
                <th className="py-2.5 px-3 min-w-[160px] whitespace-nowrap">Course Subject</th>
                <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">Assessment</th>
                <th className="py-2.5 px-3 text-center min-w-[90px] whitespace-nowrap">Score</th>
                <th className="py-2.5 px-3 text-center min-w-[70px] whitespace-nowrap">%</th>
                <th className="py-2.5 px-3 min-w-[130px] whitespace-nowrap">Workflow Status</th>
                <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">Student Portal</th>
                <th className="py-2.5 px-3 text-right min-w-[90px] whitespace-nowrap">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    No sessional records found.
                  </td>
                </tr>
              ) : (
                filteredResults.map(res => (
                  <tr key={res.id} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-black whitespace-nowrap">{res.student_roll}</td>
                    <td className="py-2.5 px-3 font-bold text-black break-words">{res.student_name}</td>
                    <td className="py-2.5 px-3 text-neutral-700 whitespace-nowrap">{res.subject_name} ({res.subject_code || 'CS-601'})</td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-800 whitespace-nowrap">{res.exam_type}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-black whitespace-nowrap">{res.marks_obtained} / {res.max_marks}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-black text-black whitespace-nowrap">{res.percentage}%</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{getWorkflowBadge(res.status, res.is_published)}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {res.is_published ? (
                        <span className="text-[11px] font-bold text-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-medium">
                          <Lock className="w-3.5 h-3.5" /> Unpublished
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setShowAuditModal(res)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-[11px] font-bold transition cursor-pointer"
                      >
                        Audit Trail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Structured Sessional Marks Cards (md:hidden) */}
        <div className="md:hidden space-y-3 p-1">
          {filteredResults.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-xs">
              No sessional records found.
            </div>
          ) : (
            filteredResults.map(res => (
              <div
                key={res.id}
                className="p-4 rounded-2xl border border-neutral-300 bg-white shadow-2xs space-y-3 text-xs"
              >
                {/* Header: Student Name + Roll Number + Status Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-neutral-200 pb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-black break-words">{res.student_name}</div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      Roll: <span className="font-bold text-black">{res.student_roll}</span>
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    {getWorkflowBadge(res.status, res.is_published)}
                  </div>
                </div>

                {/* Score & Assessment Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Assessment</span>
                    <span className="font-bold text-black text-xs block mt-0.5 break-words">
                      {res.exam_type}
                    </span>
                    <span className="text-[11px] text-neutral-600 block truncate mt-0.5">
                      {res.subject_name}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Score & %</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="font-extrabold text-black text-sm">
                        {res.marks_obtained}/{res.max_marks}
                      </span>
                      <span className="font-mono font-bold text-xs text-neutral-600">
                        ({res.percentage}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Publication Status + Audit Button */}
                <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    {res.is_published ? (
                      <span className="text-[11px] font-bold text-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Published to Portal
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-medium">
                        <Lock className="w-3.5 h-3.5" /> Unpublished
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAuditModal(res)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-[11px] font-bold transition cursor-pointer"
                  >
                    Audit Trail
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. PREVIEW MODAL */}
      {showPreviewModal && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-400 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-white" />
                <h3 className="text-sm font-extrabold">Preview Sessional Score Submission</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-neutral-100 rounded-xl space-y-2 border border-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Student:</span>
                  <strong className="text-black">{activeStudent.name} ({activeStudent.roll_no})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Cohort:</span>
                  <strong className="text-black">{selectedBranch} Sem {selectedSemester} Sec {selectedSection}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Course:</span>
                  <strong className="text-black">{activeSubject.subject_name} ({activeSubject.subject_code})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Assessment:</span>
                  <strong className="text-black">{examType}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-200">
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Evaluation Score:</span>
                  <strong className="text-base text-black">
                    {marksObtained} / {maxMarks} ({Math.round((Number(marksObtained) / Number(maxMarks)) * 100)}%)
                  </strong>
                </div>
              </div>

              {remarks && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-0.5">Faculty Remarks</span>
                  <p className="text-neutral-800 italic">&quot;{remarks}&quot;</p>
                </div>
              )}

              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-xl flex items-start gap-2 text-neutral-800 text-[11px]">
                <Info className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <p>
                  This score will be forwarded to the <strong>Head of Department (HOD)</strong> for review. Students will not see this score until it receives formal institutional approval.
                </p>
              </div>
            </div>

            <div className="p-4 bg-neutral-100 border-t border-neutral-300 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-300 text-black text-xs font-bold hover:bg-neutral-200"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSubmitForHOD}
                className="px-5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Submit to HOD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. AUDIT TRAIL MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-400 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold">Sessional Mark Audit Trail</h3>
                <p className="text-[11px] text-neutral-300">
                  {showAuditModal.student_name} ({showAuditModal.student_roll}) • {showAuditModal.subject_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-100 rounded-xl border border-neutral-300">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Assessment</span>
                  <strong className="text-black">{showAuditModal.exam_type}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Score</span>
                  <strong className="text-black">{showAuditModal.marks_obtained} / {showAuditModal.max_marks} ({showAuditModal.percentage}%)</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Approval Status</span>
                  <strong className="text-black">{showAuditModal.status || 'Draft'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Student Portal</span>
                  <strong className="text-black">{showAuditModal.is_published ? 'Published' : 'Unpublished (Restricted)'}</strong>
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-black mb-2">
                  Governance Event History
                </h4>
                {showAuditModal.history && showAuditModal.history.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-neutral-300 pl-3 ml-2">
                    {showAuditModal.history.map((h, i) => (
                      <div key={h.id || `hist-${i}`} className="space-y-0.5 relative">
                        <div className="w-2 h-2 rounded-full bg-black absolute -left-[17px] top-1" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-black uppercase font-bold text-[11px]">
                            {h.action} by {h.actor_role} ({h.actor_name})
                          </strong>
                          <span className="text-[10px] text-neutral-500">
                            {formatIndiaDateTime(h.created_at || h.timestamp)}
                          </span>
                        </div>
                        {h.comments && (
                          <p className="text-[11px] text-neutral-700 italic">
                            &quot;{h.comments}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-neutral-50 rounded-xl text-neutral-500 text-center">
                    Submitted on {formatIndiaDateTime(showAuditModal.submitted_at || showAuditModal.created_at || new Date().toISOString())} by {showAuditModal.faculty_name || 'Faculty'}.
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-neutral-100 border-t border-neutral-300 text-right">
              <button
                type="button"
                onClick={() => setShowAuditModal(null)}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
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
