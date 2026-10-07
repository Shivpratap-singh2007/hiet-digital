import React, { useState } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Save, Filter, Users, Calendar } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { AttendanceRecord, StudentMaster } from '../../types';

export const TeacherAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.teacher_id || 'tch-01';

  // Cascading Selector States as strictly specified in Section 26
  const [department, setDepartment] = useState<string>('CSE');
  const [branch, setBranch] = useState<string>('CSE');
  const [semester, setSemester] = useState<number>(6);
  const [section, setSection] = useState<string>('A');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Filter students based on cascading selections
  const allStudents = dataStore.getStudentsMaster();
  const matchingStudents = allStudents.filter(s => 
    s.department === department &&
    s.branch === branch &&
    s.semester === semester &&
    s.section === section
  );

  // If no students match (e.g. branch switch), fallback to branch students
  const displayStudents = matchingStudents.length > 0 
    ? matchingStudents 
    : allStudents.filter(s => s.branch === branch);

  // Local Attendance State
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent'>>(() => {
    const existing = dataStore.getAttendance().filter(a => a.date === date && a.subject_name === subject);
    const map: Record<string, 'Present' | 'Absent'> = {};
    displayStudents.forEach(s => {
      const match = existing.find(e => e.student_id === s.id);
      map[s.id] = (match ? match.status : 'Present') as 'Present' | 'Absent';
    });
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Toggle single student
  const handleToggle = (studentId: string, status: 'Present' | 'Absent') => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  // Mark All Present / Absent
  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const map: Record<string, 'Present' | 'Absent'> = {};
    displayStudents.forEach(s => {
      map[s.id] = status;
    });
    setAttendanceMap(map);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const records: Partial<AttendanceRecord>[] = displayStudents.map(s => ({
      student_id: s.id,
      subject_id: `sub-${branch.toLowerCase()}-${semester}`,
      subject_name: subject,
      subject_code: subject === 'Mathematics' ? 'CS-601' : subject === 'Physics' ? 'CS-602' : 'CS-603',
      date,
      status: attendanceMap[s.id] || 'Present',
      marked_by: teacherId
    }));

    await apiService.saveAttendance(records);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'Absent').length;

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-600" />
            <span>Classroom Attendance Register</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select course criteria, mark student presence, and submit official records
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Attendance register saved and synced to student transcripts!</span>
        </div>
      )}

      {/* Cascading Filter Strip as Specified in Section 26: Dept -> Branch -> Semester -> Section -> Subject -> Date */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-amber-600" />
          <span>Course & Lecture Filter Criteria:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* 1. Department */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="CSE">CSE Department</option>
            </select>
          </div>

          {/* 2. Branch */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Branch
            </label>
            <select
              value={branch}
              onChange={e => {
                const b = e.target.value;
                setBranch(b);
                setSemester(b === 'CSE AI & ML' ? 4 : 6);
              }}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="CSE">CSE</option>
              <option value="CSE AI & ML">CSE AI & ML</option>
            </select>
          </div>

          {/* 3. Semester */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={e => setSemester(Number(e.target.value))}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              {branch === 'CSE' ? (
                <>
                  <option value={6}>Semester 6</option>
                  <option value={4}>Semester 4</option>
                </>
              ) : (
                <>
                  <option value={4}>Semester 4</option>
                  <option value={2}>Semester 2</option>
                </>
              )}
            </select>
          </div>

          {/* 4. Section */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Section
            </label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* 5. Subject */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Subject
            </label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              {branch === 'CSE' ? (
                <>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="BEE">BEE</option>
                  <option value="Communication">Communication</option>
                  <option value="EVS">EVS</option>
                </>
              ) : (
                <>
                  <option value="Machine Learning Foundations">Machine Learning</option>
                  <option value="Data Structures & Algorithms">Data Structures</option>
                </>
              )}
            </select>
          </div>

          {/* 6. Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Lecture Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-2 py-1.5 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Batch Summary & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Batch Roster: <strong>{displayStudents.length} Students</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">{presentCount} Present</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-700 font-bold">{absentCount} Absent</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleMarkAll('Present')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('Absent')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Student Attendance List (Example format: CSE001 Aarav Sharma Present / Absent) */}
      <div className="space-y-2">
        {displayStudents.map((s, idx) => {
          const isPresent = (attendanceMap[s.id] || 'Present') === 'Present';
          return (
            <div
              key={s.id}
              className={`p-3 sm:p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                isPresent
                  ? 'bg-white border-slate-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                  {idx + 1}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {s.roll_no}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {s.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {s.branch} • Sec {s.section}
                  </p>
                </div>
              </div>

              {/* Present / Absent Segmented Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggle(s.id, 'Present')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    isPresent
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Present</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggle(s.id, 'Absent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    !isPresent
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Absent</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
