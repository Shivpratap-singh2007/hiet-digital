import React, { useState, useEffect } from 'react';
import { 
  FileQuestion, 
  Download, 
  Search, 
  Calendar, 
  FileText, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Subject, PYQItem } from '../../types';

export const PyqView: React.FC = () => {
  const { user } = useAuth();
  const defaultBranch = user?.studentMaster?.branch || 'CSE';
  const defaultSem = user?.studentMaster?.semester || 1;

  const [selectedBranch, setSelectedBranch] = useState<string>(defaultBranch);
  const [selectedSem, setSelectedSem] = useState<number>(defaultSem);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pyqsList, setPyqsList] = useState<PYQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    loadPyqData();
  }, [selectedBranch, selectedSem, selectedYear]);

  const loadPyqData = async () => {
    setLoading(true);
    try {
      const [subs, pyqs] = await Promise.all([
        apiService.getSubjects({ branch: selectedBranch, semester: selectedSem }),
        apiService.getPyqs({
          branch: selectedBranch,
          semester: selectedSem,
          year: selectedYear || undefined
        })
      ]);
      setSubjects(subs);
      setPyqsList(pyqs);
      if (subs.length > 0) {
        setExpandedSubject(subs[0].id);
      }
    } catch (err) {
      console.error('Failed to load PYQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q);
  });

  const getPyqsForSubject = (subjectId: string, subjectName: string) => {
    return pyqsList
      .filter(p => p.subject_id === subjectId || (p.subject_name && p.subject_name.toLowerCase() === subjectName.toLowerCase()))
      .sort((a, b) => b.year - a.year);
  };

  const handleDownload = (pyq: PYQItem, subjectName: string) => {
    if (pyq.file_url && pyq.file_url.startsWith('http')) {
      window.open(pyq.file_url, '_blank');
    } else {
      const content = `HIET SHAHPUR - PREVIOUS YEAR QUESTION PAPER\n\nSubject: ${subjectName} (${pyq.subject_code || ''})\nExamination: ${pyq.exam_type} ${pyq.year}\nBranch: ${pyq.branch || selectedBranch} | Semester: ${pyq.semester}\n\nDescription:\n${pyq.description || 'Official HPTU End-Semester Examination Question Paper'}\n\n[Official PDF Archive from HIET Digital Examination Cell]`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PYQ_${pyq.subject_code || 'Paper'}_${pyq.year}_${pyq.exam_type.replace(/\s+/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 w-full max-w-full">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-mono font-bold border border-blue-400/30">
            <FileQuestion className="w-3.5 h-3.5 text-blue-300" />
            <span>HPTU PAST 5-YEAR EXAMINATION QUESTION PAPERS</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            Previous Year Question Bank (PYQ)
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/90 max-w-2xl leading-relaxed">
            Archive of official Mid-Semester and End-Semester question papers for exam preparation, question pattern analysis, and score improvement.
          </p>
        </div>
      </div>

      {/* 2. Hierarchical Filter Bar: Branch -> Semester -> Year -> Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="text-slate-500">Department / Branch:</span>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs"
            >
              <option value="CSE">Computer Science & Engg (CSE)</option>
              <option value="CSE AI & ML">CSE (AI & Machine Learning)</option>
              <option value="ECE">Electronics & Comm. (ECE)</option>
              <option value="ME">Mechanical Engineering (ME)</option>
              <option value="CE">Civil Engineering (CE)</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="text-slate-500">Exam Year:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs"
            >
              <option value={0}>All Available Years</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
              <option value={2021}>2021</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search PYQ by subject or code..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Subjects & Year-by-Year PYQs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Question papers for <strong>{selectedBranch}</strong> • <strong>Semester {selectedSem}</strong>
          </span>
          <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {pyqsList.length} Papers in Archive
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading previous year papers...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No subjects found</p>
            <p className="text-xs text-slate-500">Please adjust branch or semester filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubjects.map(sub => {
              const subjectPyqs = getPyqsForSubject(sub.id, sub.subject_name);
              const isExpanded = expandedSubject === sub.id;

              return (
                <div
                  key={sub.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-blue-300"
                >
                  {/* Subject Card Header */}
                  <div
                    onClick={() => setExpandedSubject(isExpanded ? null : sub.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none bg-gradient-to-r from-white to-slate-50/50 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-black text-sm">
                        <FileQuestion className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                            {sub.subject_name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                            {sub.subject_code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {subjectPyqs.length} question paper{subjectPyqs.length === 1 ? '' : 's'} available
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {subjectPyqs.length > 0 ? `${subjectPyqs.length} Years` : 'No Papers Yet'}
                      </span>
                      <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Year-by-Year Papers List */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 space-y-3 animate-fade-in">
                      {subjectPyqs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {subjectPyqs.map(pyq => (
                            <div
                              key={pyq.id}
                              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs hover:border-blue-400 transition flex flex-col justify-between space-y-3"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-xs">
                                    {pyq.year}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {pyq.exam_type}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-xs text-slate-900">
                                  {sub.subject_name} Paper
                                </h4>
                                {pyq.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2">
                                    {pyq.description}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => handleDownload(pyq, sub.subject_name)}
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition active:scale-95 group"
                              >
                                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                                <span>Download {pyq.year} PDF</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-5 rounded-xl bg-slate-100/70 border border-slate-200 text-center space-y-1">
                          <p className="text-xs font-bold text-slate-700">
                            No past question papers uploaded yet for {sub.subject_name}.
                          </p>
                          <p className="text-[11px] text-slate-500">
                            The subject faculty member will upload past examination papers prior to exam season.
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
