import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Sliders, Save, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { SyllabusProgress } from '../../types';

export const SyllabusProgressTrackerView: React.FC = () => {
  const { user, role } = useAuth();
  const [progressList, setProgressList] = useState<SyllabusProgress[]>(() => dataStore.getSyllabusProgress());
  const [selectedSubject, setSelectedSubject] = useState<string>('Applied Physics');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [newPercentage, setNewPercentage] = useState<number>(50);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = role === 'teacher' || role === 'hod' || role === 'admin';

  // Distinct subjects
  const subjects = Array.from(new Set(progressList.map(p => p.subject_name)));
  const currentUnits = progressList.filter(p => p.subject_name === selectedSubject);

  // Overall syllabus completion percentage for selected subject
  const averageProgress = currentUnits.length > 0 
    ? Math.round(currentUnits.reduce((acc, u) => acc + u.progress_percentage, 0) / currentUnits.length)
    : 0;

  const handleStartEdit = (unit: SyllabusProgress) => {
    setEditingUnitId(unit.id);
    setNewPercentage(unit.progress_percentage);
    setSaveSuccess(false);
  };

  const handleSaveProgress = async (unitId: string) => {
    await apiService.updateSyllabusProgress(unitId, newPercentage, user?.name);
    setProgressList(dataStore.getSyllabusProgress());
    setEditingUnitId(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Syllabus Progress Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit-wise curriculum coverage tracking verified by academic department
          </p>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => { setSelectedSubject(sub); setEditingUnitId(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Syllabus progress updated successfully!</span>
        </div>
      )}

      {/* Aggregate Subject Completion Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 block">
            {selectedSubject} • Semester 6
          </span>
          <h3 className="text-2xl font-black mt-1">
            {averageProgress}% <span className="text-xs font-normal text-indigo-200">Covered in Lectures</span>
          </h3>
          <p className="text-xs text-indigo-100 mt-1">
            {canEdit ? '⚡ You have permissions to update unit progress' : 'Audited and updated by faculty instructors'}
          </p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center backdrop-blur-sm">
          <span className="text-lg font-black text-amber-300">{averageProgress}%</span>
          <span className="text-[9px] uppercase font-bold text-indigo-200">Total</span>
        </div>
      </div>

      {/* Unit-Wise Visual Progress List */}
      <div className="space-y-3">
        {currentUnits.map(unit => {
          const isEditing = editingUnitId === unit.id;
          return (
            <div 
              key={unit.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {unit.unit_title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Important Topics: {unit.important_topics?.slice(0, 2).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-indigo-700">
                    {isEditing ? `${newPercentage}%` : `${unit.progress_percentage}%`}
                  </span>

                  {canEdit && !isEditing && (
                    <button
                      onClick={() => handleStartEdit(unit)}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Update percentage"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Graphical Progress Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    unit.progress_percentage >= 75
                      ? 'bg-emerald-500'
                      : unit.progress_percentage >= 40
                      ? 'bg-indigo-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${isEditing ? newPercentage : unit.progress_percentage}%` }}
                />
              </div>

              {/* Editing Slider Form for Teacher/HOD */}
              {isEditing && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>Adjust Unit Progress:</span>
                    <span className="text-sm font-black text-indigo-700">{newPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={newPercentage}
                    onChange={e => setNewPercentage(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingUnitId(null)}
                      className="px-3 py-1 bg-white text-slate-600 rounded-lg text-xs font-medium border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveProgress(unit.id)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Progress</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
