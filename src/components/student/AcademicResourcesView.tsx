import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Filter,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Subject, SyllabusItem, PYQItem } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

interface Props {
  initialTab?: 'all' | 'syllabus' | 'pyqs';
}

export const AcademicResourcesView: React.FC<Props> = ({ initialTab = 'all' }) => {
  const { user } = useAuth();
  const defaultBranch = user?.studentMaster?.branch || 'CSE';
  const defaultSem = user?.studentMaster?.semester || 1;

  const [activeTab, setActiveTab] = useState<'all' | 'syllabus' | 'pyqs'>(initialTab);
  const [selectedBranch, setSelectedBranch] = useState<string>(defaultBranch);
  const [selectedSem, setSelectedSem] = useState<number>(defaultSem);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [pyqsList, setPyqsList] = useState<PYQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Sync state whenever initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadAcademicData();
  }, [selectedBranch, selectedSem]);

  const loadAcademicData = async () => {
    setLoading(true);
    try {
      const [subs, syllabi, pyqs] = await Promise.all([
        apiService.getSubjects({ branch: selectedBranch, semester: selectedSem }),
        apiService.getSyllabus({ branch: selectedBranch, semester: selectedSem }),
        apiService.getPyqs({ branch: selectedBranch, semester: selectedSem })
      ]);
      setSubjects(subs);
      setSyllabusList(syllabi);
      setPyqsList(pyqs);
      if (subs.length > 0) {
        setExpandedSubject(subs[0].id);
      }
    } catch (err) {
      console.error('Failed to load academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q);
  });

  const isSyllabusOnly = activeTab === 'syllabus';
  const isPyqsOnly = activeTab === 'pyqs';

  // Dynamic Page Header Metadata
  const getHeaderMeta = () => {
    if (isSyllabusOnly) {
      return {
        breadcrumb: [
          { label: 'Academic Portal' },
          { label: 'Curriculum & Syllabus', active: true }
        ],
        title: 'Subject Syllabus & Curriculum',
        description: 'Official HPTU university curriculum outlines, unit-wise topic descriptions, credit schemes, and prescribed reference textbooks.',
        badge: 'Curriculum Scheme'
      };
    }
    if (isPyqsOnly) {
      return {
        breadcrumb: [
          { label: 'Academic Portal' },
          { label: 'Question Papers (PYQs)', active: true }
        ],
        title: 'Previous Year Question Papers (PYQs)',
        description: 'Archived university examination question papers (Mid-Semester, End-Semester & Supplementary) organized by course and examination session.',
        badge: 'Exam Archive'
      };
    }
    return {
      breadcrumb: [
        { label: 'Academic Portal' },
        { label: 'Academic Resources', active: true }
      ],
      title: 'Academic Resources & Examination Papers',
      description: 'Centralized repository of university course syllabi, curriculum schemes, and archived previous year question papers.',
      badge: 'Academic Repository'
    };
  };

  const meta = getHeaderMeta();

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* 1. Standard Institutional Header */}
      <PageHeader
        breadcrumb={meta.breadcrumb}
        title={meta.title}
        description={meta.description}
        badge={meta.badge}
        actions={
          initialTab === 'all' ? (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'all'
                    ? 'bg-[#0f2942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('syllabus')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'syllabus'
                    ? 'bg-[#0f2942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Syllabus
              </button>
              <button
                onClick={() => setActiveTab('pyqs')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'pyqs'
                    ? 'bg-[#0f2942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PYQs
              </button>
            </div>
          ) : undefined
        }
      />

      {/* 2. Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Branch / Program
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-[#0f2942]"
            >
              <option value="CSE">Computer Science (CSE)</option>
              <option value="CSE-AIML">CSE Artificial Intelligence & ML</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="ME">Mechanical (ME)</option>
              <option value="CE">Civil (CE)</option>
              <option value="EE">Electrical (EE)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Semester
            </label>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-[#0f2942]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Search Course
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code or title..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#0f2942]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="w-8 h-8 rounded-full border-2 border-[#0f2942] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading {isPyqsOnly ? 'question papers' : 'curriculum'}...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={isPyqsOnly ? FileQuestion : BookOpen}
          title={isPyqsOnly ? 'No Question Papers Found' : 'No Courses Found'}
          description="Try adjusting the selected branch, semester, or search query filter above."
        />
      ) : (
        <div className="space-y-4">
          {filteredSubjects.map(subject => {
            const isExpanded = expandedSubject === subject.id;
            const subjectSyllabus = syllabusList.filter(s => s.subject_id === subject.id);
            const subjectPyqs = pyqsList.filter(p => p.subject_id === subject.id);

            return (
              <div 
                key={subject.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all"
              >
                {/* Course Header */}
                <div 
                  onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0f2942] flex items-center justify-center font-extrabold text-xs shrink-0">
                      {subject.subject_code.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#0f2942]">
                          {subject.subject_code}
                        </span>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          Credits: {subject.credits || 4}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
                        {subject.subject_name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                      {isSyllabusOnly 
                        ? `${subjectSyllabus.length} Syllabus Units` 
                        : isPyqsOnly 
                        ? `${subjectPyqs.length} Papers Archived` 
                        : `${subjectSyllabus.length} units • ${subjectPyqs.length} papers`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Course Expanded Resources */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-200 space-y-5">
                    {/* SYLLABUS SECTION */}
                    {(activeTab === 'all' || activeTab === 'syllabus') && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#0f2942]" />
                            <span>Course Syllabus & Units Scheme ({subjectSyllabus.length})</span>
                          </h4>
                        </div>

                        {subjectSyllabus.length === 0 ? (
                          <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                            <p className="text-xs text-slate-500 italic">No syllabus document published for this course yet.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {subjectSyllabus.map(item => (
                              <div 
                                key={item.id} 
                                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#0f2942] transition flex items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="min-w-0 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f2942] flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                      {item.academic_year || (item.units ? `${item.units.length} Units` : 'Official Curriculum')}
                                    </p>
                                  </div>
                                </div>
                                {item.file_url ? (
                                  <a
                                    href={item.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-[#0f2942] hover:text-white text-slate-700 transition shrink-0"
                                    title="Open Syllabus Document"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-mono">Published</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* PYQS SECTION */}
                    {(activeTab === 'all' || activeTab === 'pyqs') && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <FileQuestion className="w-3.5 h-3.5 text-[#0f2942]" />
                            <span>Previous Year Question Papers ({subjectPyqs.length})</span>
                          </h4>
                        </div>

                        {subjectPyqs.length === 0 ? (
                          <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                            <p className="text-xs text-slate-500 italic">No question papers archived for this course yet.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {subjectPyqs.map(pyq => (
                              <div 
                                key={pyq.id} 
                                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#0f2942] transition flex items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="min-w-0 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-slate-900 truncate">
                                      {pyq.exam_type} Examination
                                    </h5>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                      Session {pyq.year} • {pyq.description || 'University Paper'}
                                    </p>
                                  </div>
                                </div>
                                {pyq.file_url ? (
                                  <a
                                    href={pyq.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 transition shrink-0"
                                    title="Download Question Paper"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-mono">Archived</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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
  );
};
