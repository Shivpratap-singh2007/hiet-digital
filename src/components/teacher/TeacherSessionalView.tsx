import React, { useState } from 'react';
import { Award, Plus, Save, CheckCircle2, TrendingUp, Search } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { SessionalResult } from '../../types';

export const TeacherSessionalView: React.FC = () => {
  const [results, setResults] = useState<SessionalResult[]>(() => dataStore.getSessionalResults());
  const students = dataStore.getStudentsMaster();

  const [studentRoll, setStudentRoll] = useState<string>('CSE001');
  const [subjectName, setSubjectName] = useState<string>('Mathematics');
  const [examType, setExamType] = useState<'Sessional 1' | 'Sessional 2'>('Sessional 1');
  const [marksObtained, setMarksObtained] = useState<number>(18);
  const [maxMarks, setMaxMarks] = useState<number>(25);
  const [remarks, setRemarks] = useState<string>('Good performance in mid-term evaluation.');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.roll_no === studentRoll);
    if (!student) return;

    const percentage = Math.round((marksObtained / maxMarks) * 100);

    const newResult = await apiService.saveSessionalResult({
      student_id: student.id,
      student_roll: student.roll_no,
      student_name: student.name,
      subject_name: subjectName,
      subject_code: subjectName === 'Mathematics' ? 'CS-601' : subjectName === 'Physics' ? 'CS-602' : 'CS-603',
      exam_type: examType,
      marks_obtained: Number(marksObtained),
      max_marks: Number(maxMarks),
      percentage,
      semester: student.semester,
      branch: student.branch,
      is_published: true,
      remarks
    });

    setResults(dataStore.getSessionalResults());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <span>Faculty Sessional Marks Entry & Publishing</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter internal sessional evaluation scores. Results are directly published to the student portal.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Sessional marks published successfully! Visible immediately on student transcripts.</span>
        </div>
      )}

      {/* Marks Entry Form as specified in Section 27 */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>New Sessional Score Entry</span>
        </h3>

        <form onSubmit={handlePublishResult} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Student Picker */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Select Student
              </label>
              <select
                value={studentRoll}
                onChange={e => setStudentRoll(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
              >
                {students.map(s => (
                  <option key={s.id} value={s.roll_no}>
                    {s.roll_no} - {s.name} ({s.branch})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Course Subject
              </label>
              <select
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="Mathematics">CS-601 Mathematics</option>
                <option value="Physics">CS-602 Physics</option>
                <option value="BEE">CS-603 BEE</option>
                <option value="Communication">CS-604 Communication</option>
                <option value="EVS">CS-605 EVS</option>
              </select>
            </div>

            {/* Exam (Sessional 1 or 2) */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Evaluation Exam
              </label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value as any)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="Sessional 1">Sessional 1</option>
                <option value="Sessional 2">Sessional 2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Marks Obtained */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Marks Obtained (e.g. 18)
              </label>
              <input
                type="number"
                min="0"
                max={maxMarks}
                value={marksObtained}
                onChange={e => setMarksObtained(Number(e.target.value))}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                required
              />
            </div>

            {/* Max Marks */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Maximum Marks (e.g. 25)
              </label>
              <input
                type="number"
                min="1"
                value={maxMarks}
                onChange={e => setMaxMarks(Number(e.target.value))}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                required
              />
            </div>

            {/* Faculty Remarks */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Faculty Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optional feedback..."
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Publish Sessional Result</span>
            </button>
          </div>
        </form>
      </div>

      {/* Published Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
          Recent Published Sessional Scores:
        </h4>

        <div className="divide-y divide-slate-100">
          {results.slice(0, 6).map(res => (
            <div key={res.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700">{res.student_roll}</span>
                  <span className="font-extrabold text-slate-900 truncate">{res.student_name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">{res.exam_type}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {res.subject_name} • {res.remarks}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black text-slate-900 block">
                  {res.marks_obtained} / {res.max_marks}
                </span>
                <span className="text-[10px] font-bold text-emerald-700">{res.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
