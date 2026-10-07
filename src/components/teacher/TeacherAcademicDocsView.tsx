import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileQuestion, 
  UploadCloud, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Subject, SyllabusItem, PYQItem } from '../../types';
import { PageHeader } from '../common/PageHeader';

interface Props {
  initialTab?: 'syllabus' | 'pyqs';
}

export const TeacherAcademicDocsView: React.FC<Props> = ({ initialTab = 'syllabus' }) => {
  const { user } = useAuth();
  const teacherId = user?.teacher_id || user?.id || '';
  const isHod = user?.role === 'hod';
  const isAdmin = user?.role === 'admin';

  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<'syllabus' | 'pyqs'>(initialTab);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Data for selected subject
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [pyqList, setPyqList] = useState<PYQItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Upload Syllabus Modal
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [syllabusTitle, setSyllabusTitle] = useState('');
  const [syllabusDesc, setSyllabusDesc] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [syllabusFileUrl, setSyllabusFileUrl] = useState('');
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);

  // Upload PYQ Modal
  const [isPyqModalOpen, setIsPyqModalOpen] = useState(false);
  const [pyqYear, setPyqYear] = useState<number>(2025);
  const [pyqExamType, setPyqExamType] = useState<'Mid Semester' | 'End Semester' | 'Supplementary'>('End Semester');
  const [pyqDesc, setPyqDesc] = useState('');
  const [pyqFileUrl, setPyqFileUrl] = useState('');
  const [uploadingPyq, setUploadingPyq] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTeacherSubjects();
  }, [teacherId]);

  const loadTeacherSubjects = async () => {
    setLoading(true);
    try {
      const subs = await apiService.getTeacherSubjects(teacherId);
      setMySubjects(subs);
      if (subs.length > 0) {
        setSelectedSubject(subs[0]);
      }
    } catch (e) {
      console.error('Failed to load teacher subjects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      loadSubjectDocs(selectedSubject.id);
    }
  }, [selectedSubject]);

  const loadSubjectDocs = async (subjectId: string) => {
    setDataLoading(true);
    try {
      const [syllabi, pyqs] = await Promise.all([
        apiService.getSyllabus({ subjectId }),
        apiService.getPyqs({ subjectId })
      ]);
      setSyllabusList(syllabi);
      setPyqList(pyqs);
    } catch (e) {
      console.error('Failed to load subject documents:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setUploadingSyllabus(true);
    setFeedbackMsg(null);

    try {
      await apiService.uploadSyllabus({
        subject_id: selectedSubject.id,
        title: syllabusTitle.trim() || `${selectedSubject.subject_name} Syllabus`,
        description: syllabusDesc.trim(),
        branch: selectedSubject.branch,
        semester: selectedSubject.semester,
        file_url: syllabusFileUrl.trim() || 'https://hiet.co.in/academic/syllabus.pdf',
        academic_year: academicYear,
        uploaded_by: teacherId
      });

      setFeedbackMsg({ type: 'success', text: 'Syllabus document published successfully!' });
      setIsSyllabusModalOpen(false);
      setSyllabusTitle('');
      setSyllabusDesc('');
      setSyllabusFileUrl('');
      loadSubjectDocs(selectedSubject.id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Upload rejected by RLS security: ${err.message || 'Unauthorized subject'}` });
    } finally {
      setUploadingSyllabus(false);
    }
  };

  const handleDeleteSyllabus = async (id: string) => {
    if (!confirm('Are you sure you want to delete this syllabus document?')) return;
    try {
      await apiService.deleteSyllabus(id);
      setFeedbackMsg({ type: 'success', text: 'Syllabus removed successfully.' });
      if (selectedSubject) loadSubjectDocs(selectedSubject.id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Delete failed: ${err.message}` });
    }
  };

  const handleUploadPyq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setUploadingPyq(true);
    setFeedbackMsg(null);

    try {
      await apiService.uploadPyq({
        subject_id: selectedSubject.id,
        year: pyqYear,
        exam_type: pyqExamType,
        semester: selectedSubject.semester,
        branch: selectedSubject.branch,
        file_url: pyqFileUrl.trim() || 'https://hiet.co.in/academic/pyq.pdf',
        description: pyqDesc.trim() || `${pyqExamType} examination paper ${pyqYear}`,
        uploaded_by: teacherId
      });

      setFeedbackMsg({ type: 'success', text: `${pyqYear} PYQ paper published successfully!` });
      setIsPyqModalOpen(false);
      setPyqDesc('');
      setPyqFileUrl('');
      loadSubjectDocs(selectedSubject.id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Upload rejected by RLS security: ${err.message || 'Unauthorized subject'}` });
    } finally {
      setUploadingPyq(false);
    }
  };

  const handleDeletePyq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;
    try {
      await apiService.deletePyq(id);
      setFeedbackMsg({ type: 'success', text: 'Question paper removed successfully.' });
      if (selectedSubject) loadSubjectDocs(selectedSubject.id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Delete failed: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 w-full max-w-full">
      {/* 1. Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Faculty Directorate' },
          { 
            label: activeTab === 'syllabus' ? 'Syllabus Management' : 'Question Papers (PYQs)', 
            active: true 
          }
        ]}
        title={activeTab === 'syllabus' ? 'Course Syllabus & Curriculum' : 'Previous Year Question Papers (PYQs)'}
        description={
          activeTab === 'syllabus'
            ? 'Upload, publish, and manage official course syllabus schemes and unit learning outcomes for your assigned teaching subjects.'
            : 'Archive, upload, and publish university examination question papers (Mid-Semester, End-Semester) for your assigned courses.'
        }
        badge={activeTab === 'syllabus' ? 'Curriculum Authoring' : 'Exam Archive'}
      />

      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold animate-fade-in ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs underline hover:opacity-80">Dismiss</button>
        </div>
      )}

      {/* 2. Assigned Subject Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Assigned Teaching Subjects ({mySubjects.length})
            </h2>
            <p className="text-xs text-slate-500">
              Select one of your assigned courses to manage its curriculum and examination papers.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading your assigned subjects...</p>
          </div>
        ) : mySubjects.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="text-xs font-bold text-slate-700">No subjects currently assigned to your faculty profile.</p>
            <p className="text-[11px] text-slate-500">Please contact HOD or Academic Administration for subject allocation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {mySubjects.map(sub => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub)}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-slate-900 block truncate">
                      {sub.subject_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                      {sub.subject_code} • {sub.branch} (Sem {sub.semester})
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Selected Subject Management Console */}
      {selectedSubject && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          {/* Active Course Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {selectedSubject.subject_name}
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-mono font-bold">
                  {selectedSubject.subject_code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Department of {selectedSubject.branch} • Semester {selectedSubject.semester}
              </p>
            </div>

            {/* Tab switch: Syllabus vs PYQ */}
            <div className="flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200">
              <button
                onClick={() => setActiveTab('syllabus')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'syllabus'
                    ? 'bg-[#0f2942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Syllabus ({syllabusList.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('pyqs')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'pyqs'
                    ? 'bg-[#0f2942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileQuestion className="w-3.5 h-3.5" />
                <span>PYQ Papers ({pyqList.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: SYLLABUS MANAGEMENT */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Official Syllabus Documents
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enrolled students in {selectedSubject.branch} Sem {selectedSubject.semester} will download this curriculum.
                  </p>
                </div>
                <button
                  onClick={() => setIsSyllabusModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0f2942] hover:bg-[#1a365d] text-white text-xs font-bold shadow-xs active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Syllabus</span>
                </button>
              </div>

              {dataLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading syllabus data...</div>
              ) : syllabusList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-blue-50/50 border border-blue-100 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-[#0f2942] mx-auto" />
                  <p className="text-xs font-bold text-slate-900">No syllabus document published yet for {selectedSubject.subject_name}.</p>
                  <p className="text-[11px] text-slate-500">Click &ldquo;Upload Syllabus&rdquo; above to publish the HPTU curriculum outline.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {syllabusList.map(s => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {s.title}
                          </span>
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            Year: {s.academic_year || '2025-26'}
                          </span>
                        </div>
                        {s.description && (
                          <p className="text-xs text-slate-600">
                            {s.description}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Published: {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => window.open(s.file_url, '_blank')}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-purple-300 text-purple-700 text-xs font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSyllabus(s.id)}
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
                          title="Delete Syllabus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PYQ MANAGEMENT */}
          {activeTab === 'pyqs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Past Examination Papers (PYQ Bank)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Upload Mid-Sem, End-Sem, or Supplementary question papers for student practice.
                  </p>
                </div>
                <button
                  onClick={() => setIsPyqModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload PYQ Paper</span>
                </button>
              </div>

              {dataLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading question papers...</div>
              ) : pyqList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-blue-50/50 border border-blue-100 text-center space-y-2">
                  <FileQuestion className="w-8 h-8 text-blue-400 mx-auto" />
                  <p className="text-xs font-bold text-blue-900">No question papers uploaded yet for {selectedSubject.subject_name}.</p>
                  <p className="text-[11px] text-blue-600">Click &ldquo;Upload PYQ Paper&rdquo; above to add past examination questions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pyqList.map(p => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-xs">
                            {p.year}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {p.exam_type}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-xs text-slate-900 pt-1">
                          {selectedSubject.subject_name}
                        </h5>
                        {p.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {p.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <button
                          onClick={() => window.open(p.file_url, '_blank')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-blue-50"
                        >
                          <Download className="w-3 h-3" />
                          <span>View PDF</span>
                        </button>
                        <button
                          onClick={() => handleDeletePyq(p.id)}
                          className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
                          title="Delete Paper"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: UPLOAD SYLLABUS */}
      {isSyllabusModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Upload Syllabus Outline
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSubject.subject_name} ({selectedSubject.subject_code})
                </p>
              </div>
              <button
                onClick={() => setIsSyllabusModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSyllabus} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={syllabusTitle}
                  onChange={e => setSyllabusTitle(e.target.value)}
                  placeholder={`e.g. ${selectedSubject.subject_name} HPTU Syllabus & Scheme`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    placeholder="2025-26"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="text"
                    disabled
                    value={`Semester ${selectedSubject.semester}`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Description / Learning Objectives</label>
                <textarea
                  rows={3}
                  value={syllabusDesc}
                  onChange={e => setSyllabusDesc(e.target.value)}
                  placeholder="Summary of course contents, prerequisites, textbook references..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PDF File URL or Document Link</label>
                <input
                  type="url"
                  value={syllabusFileUrl}
                  onChange={e => setSyllabusFileUrl(e.target.value)}
                  placeholder="https://hiet.co.in/academic/syllabus.pdf"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to use official HIET server default.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSyllabusModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingSyllabus}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {uploadingSyllabus ? 'Publishing...' : 'Publish Syllabus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD PYQ */}
      {isPyqModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Upload Previous Year Paper
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSubject.subject_name} ({selectedSubject.subject_code})
                </p>
              </div>
              <button
                onClick={() => setIsPyqModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadPyq} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Year</label>
                  <select
                    value={pyqYear}
                    onChange={e => setPyqYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Type</label>
                  <select
                    value={pyqExamType}
                    onChange={e => setPyqExamType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="End Semester">End Semester Examination</option>
                    <option value="Mid Semester">Mid Semester Examination</option>
                    <option value="Supplementary">Supplementary / Re-appear</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Paper Description / Remarks</label>
                <input
                  type="text"
                  value={pyqDesc}
                  onChange={e => setPyqDesc(e.target.value)}
                  placeholder="e.g. Regular HPTU question paper with numerical solutions"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PDF Document URL</label>
                <input
                  type="url"
                  value={pyqFileUrl}
                  onChange={e => setPyqFileUrl(e.target.value)}
                  placeholder="https://hiet.co.in/academic/pyq_2025.pdf"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to use default HIET exam archive link.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPyqModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPyq}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {uploadingPyq ? 'Publishing...' : 'Publish Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
