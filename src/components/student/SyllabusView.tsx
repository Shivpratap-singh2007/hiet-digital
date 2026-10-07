import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  Search, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Subject, SyllabusItem } from '../../types';

export const SyllabusView: React.FC = () => {
  const { user } = useAuth();
  const defaultBranch = user?.studentMaster?.branch || 'CSE';
  const defaultSem = user?.studentMaster?.semester || 1;

  const [selectedBranch, setSelectedBranch] = useState<string>(defaultBranch);
  const [selectedSem, setSelectedSem] = useState<number>(defaultSem);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    loadSyllabusData();
  }, [selectedBranch, selectedSem]);

  const loadSyllabusData = async () => {
    setLoading(true);
    try {
      const [subs, syllabi] = await Promise.all([
        apiService.getSubjects({ branch: selectedBranch, semester: selectedSem }),
        apiService.getSyllabus({ branch: selectedBranch, semester: selectedSem })
      ]);
      setSubjects(subs);
      setSyllabusList(syllabi);
      if (subs.length > 0) {
        setExpandedSubject(subs[0].id);
      }
    } catch (err) {
      console.error('Failed to load syllabus:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q);
  });

  const getSyllabusForSubject = (subjectId: string, subjectName: string) => {
    const direct = syllabusList.find(s => s.subject_id === subjectId);
    if (direct) return direct;
    return syllabusList.find(s => 
      s.title.toLowerCase().includes(subjectName.toLowerCase()) || 
      (s.subject_name && s.subject_name.toLowerCase().includes(subjectName.toLowerCase()))
    );
  };

  const handleDownload = (syllabus: SyllabusItem, subjectName: string) => {
    if (syllabus.file_url && syllabus.file_url.startsWith('http')) {
      window.open(syllabus.file_url, '_blank');
    } else {
      // Create a clean printable curriculum outline or trigger PDF download alert
      const textContent = `HIET SHAHPUR - COURSE SYLLABUS\n\nCourse: ${subjectName} (${syllabus.subject_code || ''})\nBranch: ${syllabus.branch} | Semester: ${syllabus.semester}\nAcademic Year: ${syllabus.academic_year || '2025-26'}\n\nDescription:\n${syllabus.description || 'HPTU Prescribed Course Syllabus and Credit Scheme'}\n\nUnits:\n${(syllabus.units || []).map(u => `Unit ${u.unitNumber}: ${u.title}\nTopics: ${(u.topics || []).join(', ')}`).join('\n\n')}\n\nVerified by Himachal Institute of Engineering & Technology, Shahpur.`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Syllabus_${syllabus.subject_code || selectedBranch}_Sem${selectedSem}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 w-full max-w-full">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-mono font-bold border border-purple-400/30">
            <BookOpen className="w-3.5 h-3.5 text-purple-300" />
            <span>HPTU PRESCRIBED ACADEMIC CURRICULUM</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            Subject Syllabus Repository
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
            Official credit distribution, unit-by-unit lecture outlines, course objectives, and reference textbooks prescribed by Himachal Pradesh Technical University (HPTU).
          </p>
        </div>
      </div>

      {/* 2. Hierarchical Filter Bar: Branch -> Semester -> Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="text-slate-500">Department / Branch:</span>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-xs"
            >
              <option value="CSE">Computer Science & Engg (CSE)</option>
              <option value="CSE AI & ML">CSE (AI & Machine Learning)</option>
              <option value="ECE">Electronics & Comm. (ECE)</option>
              <option value="ME">Mechanical Engineering (ME)</option>
              <option value="CE">Civil Engineering (CE)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search subject by name or code..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Semester Tabs */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1">Semester:</span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSem(sem)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 text-xs ${
                  selectedSem === sem
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Subjects & Syllabus Documents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing subjects for <strong>{selectedBranch}</strong> • <strong>Semester {selectedSem}</strong>
          </span>
          <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            {filteredSubjects.length} Courses Prescribed
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading syllabus outlines from database...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No subjects registered for {selectedBranch} Sem {selectedSem}</p>
            <p className="text-xs text-slate-500">Subject curriculum will be populated by the department faculty.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubjects.map(sub => {
              const syllabus = getSyllabusForSubject(sub.id, sub.subject_name);
              const isExpanded = expandedSubject === sub.id;

              return (
                <div
                  key={sub.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-purple-300"
                >
                  {/* Subject Card Header */}
                  <div
                    onClick={() => setExpandedSubject(isExpanded ? null : sub.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none bg-gradient-to-r from-white to-slate-50/50 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-black text-sm">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                            {sub.subject_name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-bold">
                            {sub.subject_code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Faculty: <span className="text-slate-700 font-semibold">{sub.teacher_name || 'Assigned Department Faculty'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {syllabus ? (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Syllabus Uploaded
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending Upload
                        </span>
                      )}
                      <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Syllabus Outline */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 space-y-4 animate-fade-in">
                      {syllabus ? (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                                {syllabus.title}
                              </h4>
                              {syllabus.description && (
                                <p className="text-xs text-slate-600 mt-1">
                                  {syllabus.description}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-400 mt-1">
                                Academic Year: {syllabus.academic_year || '2025-26'} • Credits: {syllabus.credits || 4}
                              </p>
                            </div>

                            <button
                              onClick={() => handleDownload(syllabus, sub.subject_name)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs active:scale-95 transition shrink-0"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download Syllabus PDF</span>
                            </button>
                          </div>

                          {/* Units Detail if available */}
                          {syllabus.units && syllabus.units.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-purple-600" />
                                <span>Unit-wise Lecture Outlines</span>
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {syllabus.units.map(unit => (
                                  <div
                                    key={unit.unitNumber}
                                    className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-xs text-purple-800">
                                        Unit {unit.unitNumber}: {unit.title}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                        {unit.hours} Hours
                                      </span>
                                    </div>
                                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                                      {(unit.topics || []).map((topic, tidx) => (
                                        <li key={tidx} className="truncate">
                                          {topic}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 text-center space-y-2">
                          <p className="text-xs font-bold text-amber-800">
                            Official syllabus document has not yet been uploaded for {sub.subject_name}.
                          </p>
                          <p className="text-[11px] text-amber-600">
                            The subject faculty member will upload the HPTU syllabus outline shortly.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
